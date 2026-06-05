import { randomUUID } from "node:crypto";
import type {
  AtlasUser,
  AtlasProtocolExecution,
  LedgerEntry,
  HeHepContext,
} from "./atlas-kernel.mjs";

// Integraciones Atlas/TAMV
import type {
  AtlasKernel,
  AtlasKernelConfig,
} from './atlas-kernel.mjs';
import type {
  AtlasStore,
  AtlasPersistencePort,
} from './atlas-store.mjs';

interface OmniKernelIntegrationConfig {
  atlasKernel?: AtlasKernel;
  atlasConfig?: AtlasKernelConfig;
  atlasStore?: AtlasPersistencePort; // p.ej. AtlasStore sobre Supabase
}

interface ProcessedRequestRecord {
  requestId: string;
  status: 'SUCCESS' | 'BLOCKED';
  requestType: string;
  processedAt: string;
  forensicHash: string;
  blockReason?: string;
}

// ============================================================================
// AtlasStoreConfig y tipos de tablas Supabase
// ============================================================================

export type AtlasStoreConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /**
   * Timeout en ms para requests al Data API.
   * Por defecto: 10 segundos.
   */
  requestTimeoutMs?: number;
};

export type AtlasUserRow = {
  id: string;
  handle: string;
  display_name: string;
  created_at: string;
};

export type AtlasProtocolExecutionRow = {
  id: string;
  protocol_id: string;
  actor_id: string;
  selected_path: unknown;
  evaluated_paths: unknown;
  collapsed_at: string;
};

export type AtlasLedgerRow = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  kind: "credit" | "debit";
};

export type AtlasXrEventRow = {
  id: string;
  event_type: string;
  payload: unknown;
  created_at?: string;
};

export type AtlasSignalRow = {
  id: string;
  room_id: string;
  sender_id: string;
  target_id: string | null;
  signal_type: string;
  payload: unknown;
  created_at?: string;
};

// ============================================================================
// Inputs de alto nivel (puente con AtlasKernelRuntime)
// ============================================================================

export type CreateUserInput = {
  handle: string;
  displayName: string;
  he_hep_context?: HeHepContext;
};

export type RecordProtocolExecutionInput = {
  protocolId: string;
  actorId: string;
  selectedPath: unknown;
  evaluatedPaths: unknown;
  collapsedAt?: string;
  he_hep_context?: HeHepContext;
};

export type RecordEconomyEntryInput = {
  userId: string;
  amount: number;
  reason: string;
  kind: "credit" | "debit";
  he_hep_context?: HeHepContext;
};

export type XrEventListener = (event: AtlasXrEventRow) => void;
export type SignalListener = (signal: AtlasSignalRow) => void;

export type CreateSignalInput = {
  roomId: string;
  senderId: string;
  targetId?: string | null;
  signalType: string;
  payload?: unknown;
};

// ============================================================================
// Supabase REST Data API wrapper antifrágil (con timeout)
// ============================================================================

async function supabaseRequest<T>(
  config: AtlasStoreConfig,
  path: string,
  {
    method = "GET",
    body,
  }: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.requestTimeoutMs ?? 10_000,
  );

  try {
    const url = `${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${path}`;

    const res = await fetch(url, {
      method,
      headers: {
        apikey: config.supabaseServiceRoleKey,
        authorization: `Bearer ${config.supabaseServiceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Supabase REST error ${res.status}: ${text || res.statusText}`,
      );
    }

    if (res.status === 204) return [] as unknown as T;

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// AtlasPersistencePort – interfaz que el kernel puede usar
// ============================================================================

export interface AtlasPersistencePort {
  // usuarios
  createUser(input: CreateUserInput): Promise<AtlasUser>;
  listUsers(): Promise<AtlasUser[]>;

  // protocolos
  recordProtocolExecution(
    input: RecordProtocolExecutionInput,
  ): Promise<AtlasProtocolExecution>;

  // economía
  recordEconomyEntry(
    input: RecordEconomyEntryInput,
  ): Promise<LedgerEntry>;

  // XR + signaling (atlas online / salas)
  publishXrEvent(
    eventType: string,
    payload: unknown,
  ): Promise<AtlasXrEventRow>;
  onXrEvent(listener: XrEventListener): () => void;

  createSignal(msg: CreateSignalInput): Promise<AtlasSignalRow>;
  onSignal(listener: SignalListener): () => void;
}

// ============================================================================
// AtlasStore – implementación sobre Supabase Data API
// ============================================================================

/**
 * AtlasStore
 * Capa de persistencia / signaling sobre Supabase Data API.
 * Supone ejecución en backend (service role key no debe exponerse al cliente).
 */
export class AtlasStore implements AtlasPersistencePort {
  private readonly config: AtlasStoreConfig;
  private readonly xrListeners: Set<XrEventListener>;
  private readonly signalingListeners: Set<SignalListener>;

  constructor(config: AtlasStoreConfig) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
      throw new Error(
        "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para AtlasStore",
      );
    }

    this.config = config;
    this.xrListeners = new Set();
    this.signalingListeners = new Set();
  }

  async init(): Promise<void> {
    // hook para migraciones, warmup, health-checks, etc.
  }

  // --------------------------------------------------------------------------
  // Usuarios
  // --------------------------------------------------------------------------

  async createUser(input: CreateUserInput): Promise<AtlasUser> {
    const handle = input.handle?.trim();
    const displayName = input.displayName?.trim();

    if (!handle || !displayName) {
      throw new Error("AtlasStore::createUser requiere handle y displayName");
    }

    const rows = await supabaseRequest<AtlasUserRow[]>(
      this.config,
      "atlas_users",
      {
        method: "POST",
        body: [
          {
            id: randomUUID(),
            handle,
            display_name: displayName,
          },
        ],
      },
    );

    const row = rows[0];
    if (!row) {
      throw new Error("AtlasStore::createUser no devolvió ninguna fila");
    }

    // Adaptador a AtlasUser (dominio AtlasKernel)
    const heContext: HeHepContext =
      input.he_hep_context ?? {
        hexagon: "HE-Identity",
        domain: "HEP-1",
      };

    return {
      id: row.id,
      handle: row.handle,
      displayName: row.display_name,
      roles: ["citizen"],
      memberships: ["free"],
      he_hep_context: heContext,
      createdAt: row.created_at,
    };
  }

  async listUsers(): Promise<AtlasUser[]> {
    const rows = await supabaseRequest<AtlasUserRow[]>(
      this.config,
      "atlas_users?select=id,handle,display_name,created_at&order=created_at.desc&limit=500",
    );

    return rows.map((row) => ({
      id: row.id,
      handle: row.handle,
      displayName: row.display_name,
      roles: ["citizen"],
      memberships: ["free"],
      he_hep_context: {
        hexagon: "HE-Identity",
        domain: "HEP-1",
      },
      createdAt: row.created_at,
    }));
  }

  // --------------------------------------------------------------------------
  // Protocolos
  // --------------------------------------------------------------------------

  async recordProtocolExecution(
    input: RecordProtocolExecutionInput,
  ): Promise<AtlasProtocolExecution> {
    if (!input.protocolId || !input.actorId) {
      throw new Error(
        "AtlasStore::recordProtocolExecution requiere protocolId y actorId",
      );
    }

    const rows = await supabaseRequest<AtlasProtocolExecutionRow[]>(
      this.config,
      "atlas_protocols",
      {
        method: "POST",
        body: [
          {
            id: randomUUID(),
            protocol_id: input.protocolId,
            actor_id: input.actorId,
            selected_path: input.selectedPath,
            evaluated_paths: input.evaluatedPaths,
            collapsed_at: input.collapsedAt ?? new Date().toISOString(),
          },
        ],
      },
    );

    const row = rows[0];
    if (!row) {
      throw new Error(
        "AtlasStore::recordProtocolExecution no devolvió ninguna fila",
      );
    }

    const heContext: HeHepContext =
      input.he_hep_context ?? {
        hexagon: "HE-Transform",
        domain: "HEP-2",
      };

    return {
      id: row.id,
      protocolId: row.protocol_id,
      actorId: row.actor_id,
      phase: "completed",
      selectedPath: row.selected_path as any,
      evaluatedPaths: row.evaluated_paths as any,
      collapsedAt: row.collapsed_at,
      he_hep_context: heContext,
    };
  }

  // --------------------------------------------------------------------------
  // Ledger / Economía
  // --------------------------------------------------------------------------

  async recordEconomyEntry(
    input: RecordEconomyEntryInput,
  ): Promise<LedgerEntry> {
    const { userId, amount, reason, kind } = input;

    if (!userId) {
      throw new Error("AtlasStore::recordEconomyEntry requiere userId");
    }
    if (!Number.isFinite(amount)) {
      throw new Error("AtlasStore::recordEconomyEntry requiere amount numérico");
    }
    if (!reason) {
      throw new Error("AtlasStore::recordEconomyEntry requiere reason");
    }
    if (kind !== "credit" && kind !== "debit") {
      throw new Error(
        "AtlasStore::recordEconomyEntry requiere kind = 'credit' | 'debit'",
      );
    }

    const rows = await supabaseRequest<AtlasLedgerRow[]>(
      this.config,
      "atlas_ledger",
      {
        method: "POST",
        body: [
          {
            id: randomUUID(),
            user_id: userId,
            amount,
            reason,
            kind,
          },
        ],
      },
    );

    const row = rows[0];
    if (!row) {
      throw new Error(
        "AtlasStore::recordEconomyEntry no devolvió ninguna fila",
      );
    }

    const heContext: HeHepContext =
      input.he_hep_context ?? {
        hexagon: "HE-Economy",
        domain: "HEP-1",
      };

    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      reason: row.reason,
      kind: row.kind,
      he_hep_context: heContext,
      createdAt: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // XR Events (atlas online, escena compartida)
  // --------------------------------------------------------------------------

  async publishXrEvent(
    eventType: string,
    payload: unknown,
  ): Promise<AtlasXrEventRow> {
    if (!eventType) {
      throw new Error("AtlasStore::publishXrEvent requiere eventType");
    }

    const rows = await supabaseRequest<AtlasXrEventRow[]>(
      this.config,
      "atlas_xr_events",
      {
        method: "POST",
        body: [
          {
            id: randomUUID(),
            event_type: eventType,
            payload,
          },
        ],
      },
    );

    const event = rows[0];
    if (!event) {
      throw new Error("AtlasStore::publishXrEvent no devolvió ninguna fila");
    }

    // Bus local en memoria (no Realtime, solo proceso actual)
    for (const listener of this.xrListeners) {
      try {
        listener(event);
      } catch (err) {
        // no dejar que un listener rompa a los demás
        console.error("[AtlasStore] XR listener error:", err);
      }
    }

    return event;
  }

  onXrEvent(listener: XrEventListener): () => void {
    this.xrListeners.add(listener);
    return () => this.xrListeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // WebRTC Signaling (salas Atlas, federable con Realtime/P2P)
  // --------------------------------------------------------------------------

  async createSignal(msg: CreateSignalInput): Promise<AtlasSignalRow> {
    if (!msg.roomId || !msg.senderId || !msg.signalType) {
      throw new Error(
        "AtlasStore::createSignal requiere roomId, senderId y signalType",
      );
    }

    const rows = await supabaseRequest<AtlasSignalRow[]>(
      this.config,
      "atlas_webrtc_signals",
      {
        method: "POST",
        body: [
          {
            id: randomUUID(),
            room_id: msg.roomId,
            sender_id: msg.senderId,
            target_id: msg.targetId ?? null,
            signal_type: msg.signalType,
            payload: msg.payload ?? {},
          },
        ],
      },
    );

    const signal = rows[0];
    if (!signal) {
      throw new Error("AtlasStore::createSignal no devolvió ninguna fila");
    }

    for (const listener of this.signalingListeners) {
      try {
        listener(signal);
      } catch (err) {
        console.error("[AtlasStore] Signal listener error:", err);
      }
    }

    return signal;
  }

  onSignal(listener: SignalListener): () => void {
    this.signalingListeners.add(listener);
    return () => this.signalingListeners.delete(listener);
  }
}
