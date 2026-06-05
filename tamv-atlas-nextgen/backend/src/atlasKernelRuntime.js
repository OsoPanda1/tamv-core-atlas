import { randomUUID, createHash } from "node:crypto";
import { mkdir, writeFile, readFile, rename } from "node:fs/promises";
import { resolve, normalize } from "node:path";
import {
  DEFAULT_STATE_DIR,
  createEvent,
  inspectState,
  loadManifest,
  pathExists,
  publishEvent,
  publishHeartbeat,
  readEvents,
  readJson,
  stableHash,
} from "./federation-bus.mjs";
import {
  emitLocalEliteBookPiEvent,
  projectBookPiLedger,
} from "./elite-bookpi.mjs";
import { ELITE_HEHEP_MANIFEST } from "./elite-manifest.mjs";

// ============================================================================
// CONTEXTO HE-HEP (Atlas canonical context)
// ============================================================================

export type HexagonId =
  | "HE-Ingest"
  | "HE-Transform"
  | "HE-Publish"
  | "HE-Science"
  | "HE-Economy"
  | "HE-Identity";

export type HeDomainId =
  | "HEP-1"
  | "HEP-2"
  | "HEP-3"
  | "HEP-4"
  | "HEP-5"
  | "HEP-6"
  | "HEP-7";

export type HeHepContext = {
  hexagon: HexagonId;
  domain: HeDomainId;
};

const HE_DEFAULT_INGEST: HeHepContext = {
  hexagon: "HE-Ingest",
  domain: "HEP-1",
};

const HE_DEFAULT_ECONOMY: HeHepContext = {
  hexagon: "HE-Economy",
  domain: "HEP-1",
};

const HE_DEFAULT_IDENTITY: HeHepContext = {
  hexagon: "HE-Identity",
  domain: "HEP-1",
};

const HE_DEFAULT_TRANSFORM: HeHepContext = {
  hexagon: "HE-Transform",
  domain: "HEP-1",
};

const HE_DEFAULT_SCIENCE: HeHepContext = {
  hexagon: "HE-Science",
  domain: "HEP-1",
};

const HE_DEFAULT_PUBLISH: HeHepContext = {
  hexagon: "HE-Publish",
  domain: "HEP-1",
};

const now = () => new Date().toISOString();

// ============================================================================
// TIPOS BASE (Ledger, Usuarios, Protocolos, Atlas Execution)
// ============================================================================

export type LedgerEntry = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  kind: "credit" | "debit";
  he_hep_context: HeHepContext;
  createdAt: string;
};

export type AtlasUser = {
  id: string;
  handle: string;
  displayName: string;
  roles: string[];
  memberships: string[];
  he_hep_context: HeHepContext;
  createdAt: string;
};

export type ProtocolPath = {
  id: string;
  description?: string;
  score: number;
  ethicalRisk: number;
  [key: string]: unknown;
};

export type AtlasProtocolExecution = {
  id: string;
  protocolId: string;
  phase: "active" | "collapsed" | "completed";
  selectedPath: ProtocolPath;
  evaluatedPaths: ProtocolPath[];
  collapsedAt: string;
  actorId: string;
  he_hep_context: HeHepContext;
};

export type AuditEntry = {
  id: string;
  action: string;
  payload: unknown;
  he_hep_context: HeHepContext;
  createdAt: string;
};

export type AtlasKernelState = {
  id: string;
  createdAt: string;
  he_hep_context: HeHepContext;
  ledger: LedgerEntry[];
  users: AtlasUser[];
  protocols: AtlasProtocolExecution[];
  auditLog: AuditEntry[];
  agents: { id: string; role: string; capabilities: string[] }[];
  taskGraphLayers: string[][];
};

// ============================================================================
// RUNTIME BÁSICO (Atlas Runtime)
// ============================================================================

export class AtlasKernelRuntime {
  private ledger: LedgerEntry[];
  private users: AtlasUser[];
  private protocols: AtlasProtocolExecution[];
  private auditLog: AuditEntry[];

  constructor() {
    this.ledger = [];
    this.users = [];
    this.protocols = [];
    this.auditLog = [];
  }

  snapshot(context: HeHepContext = HE_DEFAULT_INGEST): AtlasKernelState {
    return {
      id: `atlas_${randomUUID().replace(/-/g, "")}`,
      createdAt: now(),
      he_hep_context: context,
      ledger: [...this.ledger],
      users: [...this.users],
      protocols: [...this.protocols],
      auditLog: [...this.auditLog],
      agents: [],
      taskGraphLayers: [],
    };
  }

  logAudit(
    action: string,
    payload: unknown,
    context: HeHepContext = HE_DEFAULT_INGEST,
  ): AuditEntry {
    const entry: AuditEntry = {
      id: `aud_${randomUUID().replace(/-/g, "")}`,
      action,
      payload,
      he_hep_context: context,
      createdAt: now(),
    };
    this.auditLog.push(entry);
    return entry;
  }

  postLedger(
    userId: string,
    amount: number,
    reason: string,
    context: HeHepContext = HE_DEFAULT_ECONOMY,
  ): LedgerEntry {
    const entry: LedgerEntry = {
      id: `ldg_${randomUUID().replace(/-/g, "")}`,
      userId,
      amount,
      reason,
      kind: amount >= 0 ? "credit" : "debit",
      he_hep_context: context,
      createdAt: now(),
    };
    this.ledger.push(entry);
    this.logAudit("postLedger", entry, context);
    return entry;
  }

  createUser(
    handle: string,
    displayName: string,
    roles: string[] = ["citizen"],
    memberships: string[] = ["free"],
    context: HeHepContext = HE_DEFAULT_IDENTITY,
  ): AtlasUser {
    const user: AtlasUser = {
      id: `usr_${randomUUID().replace(/-/g, "")}`,
      handle,
      displayName,
      roles,
      memberships,
      he_hep_context: context,
      createdAt: now(),
    };
    this.users.push(user);
    this.logAudit("createUser", user, context);
    return user;
  }

  executeProtocol(
    protocolId: string,
    actorId: string,
    paths: ProtocolPath[],
    context: HeHepContext = HE_DEFAULT_TRANSFORM,
  ): AtlasProtocolExecution {
    if (!Array.isArray(paths) || paths.length === 0) {
      throw new Error("TAMV-CRITICAL: executeProtocol requiere paths no vacíos.");
    }

    const ranked = [...paths].sort(
      (a, b) =>
        (b.score - b.ethicalRisk * 2) -
        (a.score - a.ethicalRisk * 2),
    );

    const protocol: AtlasProtocolExecution = {
      id: `prc_${randomUUID().replace(/-/g, "")}`,
      protocolId,
      phase: "active",
      selectedPath: ranked[0],
      evaluatedPaths: ranked,
      collapsedAt: now(),
      actorId,
      he_hep_context: context,
    };
    this.protocols.push(protocol);
    this.logAudit("executeProtocol", protocol, context);
    return protocol;
  }

  listUsers(): AtlasUser[] {
    return [...this.users];
  }

  listLedger(): LedgerEntry[] {
    return [...this.ledger];
  }

  listProtocols(): AtlasProtocolExecution[] {
    return [...this.protocols];
  }

  listAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }
}

// ============================================================================
// TASK GRAPH (Topología antifrágil Atlas)
// ============================================================================

export type TaskNode = {
  id: string;
  dependsOn?: string[];
  retries?: number;
  timeoutMs?: number;
  agentId?: string;
  he_hep_context?: HeHepContext;
  [key: string]: unknown;
};

export type ResolvedTaskNode = TaskNode & {
  dependsOn: string[];
  retries: number;
  timeoutMs: number;
  he_hep_context: HeHepContext;
};

export class TaskGraph {
  private tasks: Map<string, ResolvedTaskNode>;

  constructor(tasks: TaskNode[] = []) {
    this.tasks = new Map();
    for (const task of tasks) this.addTask(task);
  }

  addTask(task: TaskNode): this {
    if (!task?.id) throw new Error("TAMV-CRITICAL: Task requiere un id.");
    if (this.tasks.has(task.id)) {
      throw new Error(`TAMV-CRITICAL: ID duplicado: ${task.id}`);
    }

    const dependsOn = Array.isArray(task.dependsOn)
      ? [...new Set(task.dependsOn)]
      : [];

    const heContext: HeHepContext = task.he_hep_context ?? HE_DEFAULT_TRANSFORM;

    this.tasks.set(task.id, {
      dependsOn,
      retries: task.retries ?? 3,
      timeoutMs: task.timeoutMs ?? 300_000,
      he_hep_context: heContext,
      ...task,
    });

    return this;
  }

  validateAndSort(): ResolvedTaskNode[][] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of this.tasks.keys()) {
      inDegree.set(id, 0);
      adjacency.set(id, []);
    }

    for (const [id, task] of this.tasks.entries()) {
      for (const dep of task.dependsOn) {
        if (!this.tasks.has(dep)) {
          throw new Error(
            `TAMV-CRITICAL: Tarea ${id} depende de inexistente ${dep}.`,
          );
        }
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
        adjacency.get(dep)!.push(id);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    const sortedLayers: ResolvedTaskNode[][] = [];

    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLayer: ResolvedTaskNode[] = [];

      for (let i = 0; i < levelSize; i++) {
        const id = queue.shift()!;
        const task = this.tasks.get(id)!;
        currentLayer.push(task);

        for (const neighbor of adjacency.get(id)!) {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);
          if (newDegree === 0) queue.push(neighbor);
        }
      }

      sortedLayers.push(currentLayer);
    }

    const totalTasks = [...this.tasks.values()].length;
    const flattened = sortedLayers.reduce(
      (acc, layer) => acc + layer.length,
      0,
    );

    if (flattened !== totalTasks) {
      throw new Error("TAMV-CRITICAL: Deadlock detectado.");
    }

    return sortedLayers;
  }

  layers(): ResolvedTaskNode[][] {
    return this.validateAndSort();
  }

  idsByLayer(): string[][] {
    return this.layers().map((layer) => layer.map((t) => t.id));
  }
}

// ============================================================================
// REGISTRO DE AGENTES (Atlas Agents)
// ============================================================================

export type AgentRunContext = {
  parameters?: Record<string, unknown>;
  results?: Record<string, any>;
  he_hep_context?: HeHepContext;
};

export type AgentResult = Record<string, unknown>;

export type AgentDefinition = {
  id: string;
  role: string;
  capabilities: string[];
  run: (context: AgentRunContext) => Promise<AgentResult>;
};

export class AgentRegistry {
  private agents: Map<string, AgentDefinition>;

  constructor(agents: AgentDefinition[] = []) {
    this.agents = new Map();
    for (const agent of agents) this.register(agent);
  }

  register(agent: AgentDefinition): this {
    if (!agent?.id || typeof agent.run !== "function") {
      throw new Error("TAMV-CRITICAL: Agente inválido.");
    }
    if (this.agents.has(agent.id)) {
      throw new Error(`TAMV-CRITICAL: Agente duplicado: ${agent.id}`);
    }
    this.agents.set(agent.id, agent);
    return this;
  }

  get(id: string): AgentDefinition {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`TAMV-CRITICAL: Agente desconocido: ${id}`);
    }
    return agent;
  }

  list(): { id: string; role: string; capabilities: string[] }[] {
    return [...this.agents.values()].map(
      ({ id, role, capabilities = [] }) => ({ id, role, capabilities }),
    );
  }
}

// ============================================================================
// AGENTES POR DEFECTO (Pipeline de impresión/geometry antifrágil)
// ============================================================================

export function createDefaultAgents(): AgentRegistry {
  return new AgentRegistry([
    {
      id: "GeometryAgent",
      role: "geometry",
      capabilities: ["procedural-model-plan", "mesh-export-contract"],
      async run(context: AgentRunContext): Promise<AgentResult> {
        return {
          model: "fairy-collectible-80cm",
          scaleCm: 80,
          modules: [
            "head",
            "torso",
            "arms",
            "legs",
            "detachable-wings",
            "base",
          ],
          exports: ["glb", "obj"],
          he_hep_context: {
            hexagon: "HE-Transform",
            domain: "HEP-2",
          } as HeHepContext,
          nextEvent: "GEOMETRY_READY",
          contextHash: stableHash(context.parameters ?? {}),
        };
      },
    },
    {
      id: "UnfoldAgent",
      role: "geometry",
      capabilities: [
        "edge-classification",
        "island-segmentation",
        "uv-flattening",
      ],
      async run(context: AgentRunContext): Promise<AgentResult> {
        return {
          algorithm: "graph-based-unfold-v1",
          lineTypes: ["cut", "mountain", "valley"],
          overlapPolicy: "resolve-by-island-translation",
          he_hep_context: {
            hexagon: "HE-Transform",
            domain: "HEP-2",
          } as HeHepContext,
          nextEvent: "UNFOLD_READY",
          geometryRef:
            context.results?.GeometryAgent?.model ?? "pending-geometry",
        };
      },
    },
    {
      id: "LayoutAgent",
      role: "print",
      capabilities: ["a4-layout", "page-numbering", "registration-marks"],
      async run(context: AgentRunContext): Promise<AgentResult> {
        return {
          media: "A4",
          minimumPages: 100,
          marginMm: 8,
          he_hep_context: {
            hexagon: "HE-Publish",
            domain: "HEP-1",
          } as HeHepContext,
          nextEvent: "PRINT_TEMPLATE_READY",
          unfoldingRef:
            context.results?.UnfoldAgent?.algorithm ?? "pending-unfold",
        };
      },
    },
    {
      id: "RenderAgent",
      role: "print",
      capabilities: ["svg-generation", "pdf-compilation", "gold-overlay"],
      async run(context: AgentRunContext): Promise<AgentResult> {
        return {
          outputs: [
            "white-system.pdf",
            "gold-overlay.pdf",
            "commercial-bundle.zip",
          ],
          colorSystem: "white-gold-cmyk-simulation",
          he_hep_context: {
            hexagon: "HE-Publish",
            domain: "HEP-1",
          } as HeHepContext,
          nextEvent: "PDF_READY",
          layoutRef:
            context.results?.LayoutAgent?.media ?? "pending-layout",
        };
      },
    },
    {
      id: "UIAgent",
      role: "frontend",
      capabilities: ["parameter-controls", "export-ui", "pipeline-status"],
      async run(context: AgentRunContext): Promise<AgentResult> {
        return {
          controls: [
            "scale",
            "wing-joints",
            "paper-density",
            "gold-overlay",
          ],
          statusSurface: "pipeline-dashboard",
          he_hep_context: {
            hexagon: "HE-Identity",
            domain: "HEP-7",
          } as HeHepContext,
          nextEvent: "UI_READY",
          exportEnabled: Boolean(context.results?.RenderAgent),
        };
      },
    },
    {
      id: "OptimizeAgent",
      role: "optimization",
      capabilities: ["quality-scoring", "feedback-loop", "version-iteration"],
      async run(context: AgentRunContext): Promise<AgentResult> {
        const completed = Object.keys(context.results ?? {}).length;
        const qualityScore = Math.min(100, 60 + completed * 7);
        return {
          qualityScore,
          nextVersion:
            qualityScore >= 90 ? "v2-ready" : "v1-improve",
          he_hep_context: {
            hexagon: "HE-Science",
            domain: "HEP-1",
          } as HeHepContext,
          nextEvent: "QUALITY_SCORE_REPORTED",
          bottlenecks:
            qualityScore >= 90
              ? []
              : [
                  "manual-pdf-validation",
                  "geometry-asset-verification",
                ],
        };
      },
    },
  ]);
}

// ============================================================================
// ATLAS KERNEL (orquestador canónico para TAMV-Online)
// ============================================================================

export type AtlasKernelConfig = {
  stateDir?: string;
  he_hep_context?: HeHepContext;
};

export class AtlasKernel {
  readonly runtime: AtlasKernelRuntime;
  readonly agents: AgentRegistry;
  readonly graph: TaskGraph;
  readonly config: AtlasKernelConfig;

  constructor(
    graph: TaskGraph,
    agents: AgentRegistry = createDefaultAgents(),
    config: AtlasKernelConfig = {},
  ) {
    this.runtime = new AtlasKernelRuntime();
    this.agents = agents;
    this.graph = graph;
    this.config = {
      stateDir: config.stateDir ?? DEFAULT_STATE_DIR,
      he_hep_context: config.he_hep_context ?? HE_DEFAULT_INGEST,
    };
  }

  async heartbeat(label = "atlas-kernel"): Promise<void> {
    await publishHeartbeat({
      source: label,
      manifest: ELITE_HEHEP_MANIFEST,
      he_hep_context: this.config.he_hep_context!,
      createdAt: now(),
    });
  }

  /**
   * Ejecuta el TaskGraph por capas, invocando agentes asociados.
   * Proyecta eventos al bus federado y deja trazas auditables en BookPi.
   */
  async run(
    parameters: Record<string, unknown> = {},
  ): Promise<{
    state: AtlasKernelState;
    results: Record<string, AgentResult>;
  }> {
    const layers = this.graph.layers();
    const atlasId = `atlas_run_${randomUUID().replace(/-/g, "")}`;
    const results: Record<string, AgentResult> = {};

    await this.heartbeat("atlas-kernel:start");

    for (const layer of layers) {
      // capa paralela (topología antifrágil por nivel)
      await Promise.all(
        layer.map(async (task) => {
          const agentId = task.agentId;
          const context: AgentRunContext = {
            parameters,
            results,
            he_hep_context: task.he_hep_context ?? this.config.he_hep_context,
          };

          const taskEventBase = {
            atlasId,
            taskId: task.id,
            agentId,
            he_hep_context: context.he_hep_context!,
            createdAt: now(),
          };

          await publishEvent(
            createEvent("ATLAS_TASK_STARTED", {
              ...taskEventBase,
              dependsOn: task.dependsOn,
            }),
          );

          if (!agentId) {
            // tarea puramente estructural: solo audit y bus
            this.runtime.logAudit("task:noop", taskEventBase, context.he_hep_context!);
            await publishEvent(
              createEvent("ATLAS_TASK_COMPLETED", {
                ...taskEventBase,
                result: { kind: "noop" },
              }),
            );
            return;
          }

          const agent = this.agents.get(agentId);

          let attempt = 0;
          let lastError: unknown;

          while (attempt <= task.retries) {
            attempt += 1;
            try {
              const result = await agent.run(context);
              results[agentId] = result;

              this.runtime.logAudit("agent:completed", {
                agentId,
                taskId: task.id,
                attempt,
                result,
              }, context.he_hep_context!);

              await publishEvent(
                createEvent("ATLAS_TASK_COMPLETED", {
                  ...taskEventBase,
                  attempt,
                  result,
                }),
              );

              return;
            } catch (error) {
              lastError = error;
              const normalized = {
                ...taskEventBase,
                attempt,
                error: String(error),
              };

              this.runtime.logAudit("agent:error", normalized, context.he_hep_context!);
              await publishEvent(
                createEvent("ATLAS_TASK_FAILED", normalized),
              );

              if (attempt > task.retries) {
                throw error;
              }
            }
          }

          throw lastError ?? new Error("ATLAS: unknown agent failure");
        }),
      );
    }

    const state = this.runtime.snapshot(this.config.he_hep_context!);
    state.agents = this.agents.list();
    state.taskGraphLayers = this.graph.idsByLayer();

    // Proyectar ledger y auditoría a EliteBookPi (libro mayor federado)
    await projectBookPiLedger(state.ledger, {
      he_hep_context: HE_DEFAULT_ECONOMY,
      atlasId,
    });

    await emitLocalEliteBookPiEvent({
      kind: "ATLAS_RUN_COMPLETED",
      atlasId,
      he_hep_context: this.config.he_hep_context!,
      createdAt: now(),
      quality: {
        protocols: state.protocols.length,
        users: state.users.length,
        ledgerEntries: state.ledger.length,
      },
    });

    await this.heartbeat("atlas-kernel:completed");

    return { state, results };
  }
}
