/* eslint-disable no-console */
/* 
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TAMV ONLINE NETWORK™
 OMNIKERNEL GATEWAY X6 — HARDENED CORE
 Sovereign Cognitive Infrastructure Prototype
 --------------------------------------------------------
 MODULES:
 - DEKATEORL™      → Ethical / Semantic Governance
 - BOOKPI™         → Immutable Forensic Ledger
 - ANUBIS™         → Adaptive Threat Detection
 - OMNIKERNEL™     → Federated Orchestration Gateway
 - ATLAS INTEGRATION → Kernel + Persistence (TAMV-Online)
 --------------------------------------------------------
 STATUS:
 Hardened Prototype / Deterministic Core + Atlas Integration
 --------------------------------------------------------
 SECURITY MODEL:
 - Tamper-evident ledger
 - Payload integrity
 - Replay protection
 - Rate limiting
 - Identity normalization
 - Secure hashing
 - Entropy-safe nonce generation
 - Threat correlation
 - Immutable audit trail
 - Deterministic validation pipeline
 - Atlas kernel gateway integration
 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { EventEmitter } from 'node:events';

// Integraciones Atlas/TAMV (opcional, para usar en composición con AtlasKernel + AtlasStore)
import type {
  AtlasKernel,
  AtlasKernelConfig,
} from './atlas-kernel.mjs';
import type {
  AtlasPersistencePort,
} from './atlas-store.mjs';

/* =========================================================
 * CONSTANTS
 * =======================================================*/

const SHA256 = 'sha256';

const DEFAULT_CONFIG = Object.freeze({
  STRICT_MODE: true,
  ENABLE_BOOKPI: true,
  ENABLE_DEKATEORL: true,
  ENABLE_ANUBIS: true,

  MAX_DAILY_REQUESTS: 1000,
  MAX_PAYLOAD_BYTES: 1024 * 128,

  MAX_ANOMALY_SCORE: 0.75,

  REQUEST_TIMEOUT_MS: 10_000,

  MIN_TRUST_SCORE: 0.15,

  ENABLE_REPLAY_PROTECTION: true,
  REPLAY_WINDOW_MS: 60_000,

  ENABLE_RATE_LIMITING: true,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 120,

  ENABLE_EVENT_EMISSION: true,

  SECRET_KEY:
    process.env.TAMV_SECRET_KEY ||
    randomBytes(32).toString('hex'),
});

/* =========================================================
 * UTILITIES
 * =======================================================*/

function nowISO() {
  return new Date().toISOString();
}

function safeStringify(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return '[UNSERIALIZABLE_PAYLOAD]';
  }
}

function sha256(data: unknown): string {
  return createHash(SHA256)
    .update(
      typeof data === 'string'
        ? data
        : safeStringify(data),
    )
    .digest('hex');
}

function hmac(data: unknown, secret: string): string {
  return createHmac(SHA256, secret)
    .update(
      typeof data === 'string'
        ? data
        : safeStringify(data),
    )
    .digest('hex');
}

function secureUUID(): string {
  return randomBytes(16).toString('hex');
}

function normalizeIdentity(id: string): string {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function safeCompare(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);

  if (aa.length !== bb.length) return false;

  return timingSafeEqual(aa, bb);
}

/* =========================================================
 * TYPES
 * =======================================================*/

type ThreatLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

interface GovernanceResult {
  approved: boolean;
  riskScore: number;
  violations: string[];
  hardStopTriggered: boolean;
  explanation: string;
  timestamp: string;
}

interface ThreatResult {
  anomalyScore: number;
  threatLevel: ThreatLevel;
  violations: string[];
  timestamp: string;
}

interface UserRecord {
  isni: string;
  name: string;

  createdAt: string;

  todayUsage: number;
  totalUsage: number;

  dailyLimit: number;

  tamvCredits: number;

  trustScore: number;

  lastRequestAt?: number;
}

interface BlockRecord {
  index: number;
  timestamp: string;

  type: string;

  data: unknown;

  previousHash: string;

  nonce: string;

  currentHash: string;

  integritySignature: string;
}

interface AtlasIntegrationConfig {
  atlasKernel?: AtlasKernel;
  atlasConfig?: AtlasKernelConfig;
  atlasStore?: AtlasPersistencePort;
}

interface ProcessedRequestRecord {
  requestId: string;
  status: 'SUCCESS' | 'BLOCKED';
  requestType: string;
  processedAt: string;
  forensicHash: string;
  blockReason?: string;
}

/* =========================================================
 * DEKATEORL™
 * ETHICAL GOVERNANCE ENGINE
 * =======================================================*/

export class DekateorlEngine {
  private strictMode: boolean;

  private violationPatterns: RegExp[];

  private hardStops: string[];

  constructor(strictMode = true) {
    this.strictMode = strictMode;

    this.violationPatterns = [
      /\b(exploit|manipulate|abuse|deceive)\b/i,
      /\b(misinformation|fake\s+news|propaganda)\b/i,
      /\b(malware|phishing|credential\s+stealing)\b/i,
      /\b(harassment|extortion|doxxing)\b/i,
    ];

    this.hardStops = [
      'child exploitation',
      'terrorism',
      'human trafficking',
      'mass violence',
    ];
  }

  async evaluate(
    input = '',
  ): Promise<GovernanceResult> {
    const text = String(input).toLowerCase();

    const violations: string[] = [];

    for (const stop of this.hardStops) {
      if (text.includes(stop)) {
        violations.push(`HARD_STOP:${stop}`);
      }
    }

    if (violations.length > 0) {
      return {
        approved: false,
        riskScore: 1,
        violations,
        hardStopTriggered: true,
        explanation: 'HARD_STOP_TRIGGERED',
        timestamp: nowISO(),
      };
    }

    for (const pattern of this.violationPatterns) {
      if (pattern.test(text)) {
        violations.push(
          `PATTERN_MATCH:${pattern.source}`,
        );
      }
    }

    const entropyModifier =
      Math.min(text.length / 5000, 1) * 0.1;

    const riskScore = Math.min(
      violations.length * 0.2 + entropyModifier,
      1,
    );

    const threshold = this.strictMode
      ? 0.30
      : 0.55;

    return {
      approved: riskScore < threshold,
      riskScore,
      violations,
      hardStopTriggered: false,
      explanation:
        riskScore < threshold
          ? 'APPROVED'
          : 'BLOCKED_BY_GOVERNANCE',
      timestamp: nowISO(),
    };
  }
}

/* =========================================================
 * BOOKPI™
 * IMMUTABLE FORENSIC LEDGER
 * =======================================================*/

export class BookPIChain {
  private chain: BlockRecord[];

  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
    this.chain = [this.createGenesis()];
  }

  private signBlock(block: unknown): string {
    return hmac(block, this.secret);
  }

  private hashBlock(block: unknown): string {
    return sha256(block);
  }

  private createGenesis(): BlockRecord {
    const base = {
      index: 0,
      timestamp: nowISO(),
      type: 'GENESIS',
      data: {},
      previousHash: '0'.repeat(64),
      nonce: secureUUID(),
    };

    const currentHash = this.hashBlock(base);

    return {
      ...base,
      currentHash,
      integritySignature:
        this.signBlock(currentHash),
    };
  }

  recordEvent(
    type: string,
    data: unknown,
  ): string {
    const prev = this.chain[this.chain.length - 1];

    const base = {
      index: this.chain.length,
      timestamp: nowISO(),
      type,
      data,
      previousHash: prev.currentHash,
      nonce: secureUUID(),
    };

    const currentHash =
      this.hashBlock(base);

    const block: BlockRecord = {
      ...base,
      currentHash,
      integritySignature:
        this.signBlock(currentHash),
    };

    this.chain.push(block);

    return currentHash;
  }

  verifyIntegrity(): boolean {
    for (
      let i = 1;
      i < this.chain.length;
      i += 1
    ) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (
        current.previousHash !==
        previous.currentHash
      ) {
        return false;
      }

      const expectedHash = this.hashBlock({
        index: current.index,
        timestamp: current.timestamp,
        type: current.type,
        data: current.data,
        previousHash: current.previousHash,
        nonce: current.nonce,
      });

      if (
        !safeCompare(
          expectedHash,
          current.currentHash,
        )
      ) {
        return false;
      }

      const expectedSig = this.signBlock(
        current.currentHash,
      );

      if (
        !safeCompare(
          expectedSig,
          current.integritySignature,
        )
      ) {
        return false;
      }
    }

    return true;
  }

  getChain(): BlockRecord[] {
    return structuredClone(this.chain);
  }
}

/* =========================================================
 * ANUBIS™
 * THREAT INTELLIGENCE ENGINE
 * =======================================================*/

export class AnubisSentinel {
  private threshold: number;

  constructor(threshold = 0.75) {
    this.threshold = threshold;
  }

  async analyzeRequest(
    user: string,
    payload: unknown,
  ): Promise<ThreatResult> {
    const violations: string[] = [];

    const serialized =
      safeStringify(payload);

    const payloadSize =
      Buffer.byteLength(serialized);

    let score = 0.05;

    if (payloadSize > 50_000) {
      score += 0.45;
      violations.push('PAYLOAD_SIZE');
    }

    if (
      /(DROP\s+TABLE|<script>|eval\(|\.\.\/)/i.test(
        serialized,
      )
    ) {
      score += 0.40;
      violations.push(
        'INJECTION_PATTERN_DETECTED',
      );
    }

    if (
      /(token|secret|apikey|privatekey)/i.test(
        serialized,
      )
    ) {
      score += 0.15;
      violations.push(
        'SENSITIVE_PATTERN_DETECTED',
      );
    }

    score = Math.min(score, 1);

    let threatLevel: ThreatLevel = 'low';

    if (score >= 0.9)
      threatLevel = 'critical';
    else if (score >= 0.75)
      threatLevel = 'high';
    else if (score >= 0.4)
      threatLevel = 'medium';

    return {
      anomalyScore: score,
      threatLevel,
      violations,
      timestamp: nowISO(),
    };
  }

  shouldBlock(result: ThreatResult): boolean {
    return (
      result.anomalyScore >= this.threshold
    );
  }
}

/* =========================================================
 * OMNIKERNEL GATEWAY X6
 * =======================================================*/

export class OmniKernelGatewayX6 extends EventEmitter {
  private config;

  private users: Map<string, UserRecord>;

  private requestHistory: Map<
    string,
    number[]
  >;

  private replayCache: Set<string>;

  private dekateorl: DekateorlEngine;

  private bookpi: BookPIChain;

  private anubis: AnubisSentinel;

  private metrics;

  private atlasKernel?: AtlasKernel;

  private atlasStore?: AtlasPersistencePort;

  constructor(
    config: Partial<typeof DEFAULT_CONFIG> & AtlasIntegrationConfig = {},
  ) {
    super();

    const {
      atlasKernel,
      atlasStore,
      atlasConfig: _atlasConfig,
      ...restConfig
    } = config;

    this.config = {
      ...DEFAULT_CONFIG,
      ...restConfig,
    };

    this.users = new Map();

    this.requestHistory = new Map();

    this.replayCache = new Set();

    this.dekateorl =
      new DekateorlEngine(
        this.config.STRICT_MODE,
      );

    this.bookpi = new BookPIChain(
      this.config.SECRET_KEY,
    );

    this.anubis =
      new AnubisSentinel(
        this.config.MAX_ANOMALY_SCORE,
      );

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      blockedByAnubis: 0,
      blockedByDekateorl: 0,
      blockedByRateLimit: 0,
      blockedByReplay: 0,
    };

    this.atlasKernel = atlasKernel;
    this.atlasStore = atlasStore;
  }

  registerUser(
    isni: string,
    name: string,
  ) {
    const normalized =
      normalizeIdentity(isni);

    if (this.users.has(normalized)) {
      throw new Error(
        'USER_ALREADY_EXISTS',
      );
    }

    const user: UserRecord = {
      isni: normalized,
      name,

      createdAt: nowISO(),

      todayUsage: 0,
      totalUsage: 0,

      dailyLimit:
        this.config.MAX_DAILY_REQUESTS,

      tamvCredits: 100,

      trustScore: 1,
    };

    this.users.set(normalized, user);

    const hash =
      this.bookpi.recordEvent(
        'USER_REGISTERED',
        {
          isni: normalized,
          name,
        },
      );

    return {
      ...user,
      registrationHash: hash,
    };
  }

  private enforceRateLimit(
    isni: string,
  ): boolean {
    if (
      !this.config.ENABLE_RATE_LIMITING
    ) {
      return true;
    }

    const now = Date.now();

    const history =
      this.requestHistory.get(isni) || [];

    const valid = history.filter(
      (t) =>
        now - t <
        this.config
          .RATE_LIMIT_WINDOW_MS,
    );

    if (
      valid.length >=
      this.config
        .RATE_LIMIT_MAX_REQUESTS
    ) {
      return false;
    }

    valid.push(now);

    this.requestHistory.set(
      isni,
      valid,
    );

    return true;
  }

  private detectReplay(
    payloadHash: string,
  ): boolean {
    if (
      !this.config
        .ENABLE_REPLAY_PROTECTION
    ) {
      return false;
    }

    if (
      this.replayCache.has(payloadHash)
    ) {
      return true;
    }

    this.replayCache.add(payloadHash);

    setTimeout(() => {
      this.replayCache.delete(
        payloadHash,
      );
    }, this.config.REPLAY_WINDOW_MS);

    return false;
  }

  async processRequest(
    isni: string,
    requestType: string,
    payload: unknown,
  ) {
    this.metrics.totalRequests += 1;

    const normalized =
      normalizeIdentity(isni);

    const user =
      this.users.get(normalized);

    if (!user) {
      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_REJECTED_UNKNOWN_USER',
          { isni: normalized, requestType },
        );

      return {
        approved: false,
        blockReason:
          'USER_NOT_FOUND',
        forensicHash,
      };
    }

    const serialized =
      safeStringify(payload);

    const payloadBytes =
      Buffer.byteLength(serialized);

    if (
      payloadBytes >
      this.config.MAX_PAYLOAD_BYTES
    ) {
      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_PAYLOAD_TOO_LARGE',
          {
            isni: normalized,
            requestType,
            payloadBytes,
          },
        );

      return {
        approved: false,
        blockReason:
          'PAYLOAD_TOO_LARGE',
        forensicHash,
      };
    }

    if (
      !this.enforceRateLimit(
        normalized,
      )
    ) {
      this.metrics.blockedByRateLimit += 1;

      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_RATE_LIMIT',
          {
            isni: normalized,
            requestType,
          },
        );

      return {
        approved: false,
        blockReason:
          'RATE_LIMIT_EXCEEDED',
        forensicHash,
      };
    }

    const payloadHash =
      sha256(serialized);

    if (
      this.detectReplay(payloadHash)
    ) {
      this.metrics.blockedByReplay += 1;

      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_REPLAY',
          {
            isni: normalized,
            requestType,
            payloadHash,
          },
        );

      return {
        approved: false,
        blockReason:
          'REPLAY_DETECTED',
        forensicHash,
      };
    }

    const anubis =
      await this.anubis.analyzeRequest(
        normalized,
        payload,
      );

    if (
      this.config.ENABLE_ANUBIS &&
      this.anubis.shouldBlock(
        anubis,
      )
    ) {
      this.metrics.blockedByAnubis += 1;

      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_ANUBIS',
          {
            isni: normalized,
            requestType,
            anomalyScore:
              anubis.anomalyScore,
          },
        );

      return {
        approved: false,
        blockReason:
          'ANUBIS_BLOCK',
        forensicHash,
        metrics: { anubis },
      };
    }

    const governance =
      await this.dekateorl.evaluate(
        (payload as any)?.content ??
          '',
      );

    if (
      this.config.ENABLE_DEKATEORL &&
      !governance.approved
    ) {
      this.metrics.blockedByDekateorl += 1;

      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_DEKATEORL',
          {
            isni: normalized,
            requestType,
            risk:
              governance.riskScore,
          },
        );

      return {
        approved: false,
        blockReason:
          governance.explanation,
        forensicHash,
        metrics: {
          anubis,
          governance,
        },
      };
    }

    if (
      user.todayUsage + 1 >
      user.dailyLimit
    ) {
      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_DAILY_QUOTA',
          {
            isni: normalized,
            requestType,
            todayUsage: user.todayUsage,
          },
        );

      return {
        approved: false,
        blockReason:
          'DAILY_QUOTA_EXCEEDED',
        forensicHash,
      };
    }

    if (
      user.trustScore <
      this.config.MIN_TRUST_SCORE
    ) {
      const forensicHash =
        this.bookpi.recordEvent(
          'REQUEST_BLOCKED_TRUST_SCORE',
          {
            isni: normalized,
            requestType,
            trustScore: user.trustScore,
          },
        );

      return {
        approved: false,
        blockReason:
          'TRUST_SCORE_TOO_LOW',
        forensicHash,
      };
    }

    user.todayUsage += 1;
    user.totalUsage += 1;
    user.lastRequestAt = Date.now();

    this.metrics.successfulRequests += 1;

    const forensicHash =
      this.bookpi.recordEvent(
        'REQUEST_PROCESSED',
        {
          isni: normalized,
          requestType,
          payloadHash,
        },
      );

    const response = {
      approved: true,

      result: {
        requestId: secureUUID(),

        status: 'SUCCESS',

        requestType,

        processedAt: nowISO(),

        forensicHash,
      },

      metrics: {
        anubis,
        governance,
      },
    };

    // Proyección de decisión al BookPi como bloque de alto nivel
    const decisionRecord: ProcessedRequestRecord = {
      requestId: response.result.requestId,
      status: response.result.status,
      requestType,
      processedAt: response.result.processedAt,
      forensicHash: response.result.forensicHash,
    };

    this.bookpi.recordEvent('REQUEST_DECISION', {
      isni: normalized,
      decision: decisionRecord,
      threat: anubis,
      governance,
    });

    // Proyección opcional al AtlasStore (economía simple: -1 crédito por request válido)
    if (this.atlasStore && response.approved) {
      try {
        await this.atlasStore.recordEconomyEntry({
          userId: normalized,
          amount: -1,
          reason: `REQUEST:${requestType}`,
          kind: 'debit',
          he_hep_context: {
            hexagon: 'HE-Economy',
            domain: 'HEP-1',
          },
        });
      } catch (err) {
        // no bloquear la request por un fallo de persistencia
        console.error('[OmniKernel] AtlasStore economy projection failed:', err);
      }
    }

    if (
      this.config
        .ENABLE_EVENT_EMISSION
    ) {
      this.emit(
        'request.processed',
        response,
      );
    }

    return response;
  }

  /**
   * Ejecuta una acción AtlasKernel solo si pasa por Anubis + Dekateorl + cuotas.
   * `action` es una función que ejecuta algo contra el kernel/atlas y devuelve un resultado.
   */
  async guardAndRun<T>(
    isni: string,
    requestType: string,
    payload: unknown,
    action: (atlas: AtlasKernel) => Promise<T>,
  ): Promise<
    | { approved: false; blockReason: string; forensicHash?: string }
    | { approved: true; forensicHash: string; result: T }
  > {
    const gate = await this.processRequest(isni, requestType, payload);

    if (!gate.approved) {
      return {
        approved: false,
        blockReason: gate.blockReason ?? 'BLOCKED_BY_GATEWAY',
        forensicHash: gate.forensicHash,
      };
    }

    if (!this.atlasKernel) {
      return {
        approved: false,
        blockReason: 'ATLAS_KERNEL_NOT_CONFIGURED',
        forensicHash: gate.forensicHash,
      };
    }

    const result = await action(this.atlasKernel);

    return {
      approved: true,
      forensicHash: gate.forensicHash,
      result,
    };
  }

  buildSystemStatus() {
    return {
      kernel: {
        name: 'OMNIKERNEL X6',
        state: 'ACTIVE',
      },

      federation: {
        mode: 'HYBRID',
      },

      layers: {
        DEKATEORL: 'ACTIVE',
        BOOKPI: 'ACTIVE',
        ANUBIS: 'ACTIVE',
        ATLAS: this.atlasKernel ? 'ACTIVE' : 'DETACHED',
        ATLAS_STORE: this.atlasStore ? 'ACTIVE' : 'DETACHED',
      },

      metrics: {
        ...this.metrics,
        activeUsers:
          this.users.size,
      },

      integrity: {
        bookpi:
          this.bookpi.verifyIntegrity(),
      },

      atlas: {
        kernelConnected: Boolean(this.atlasKernel),
        storeConnected: Boolean(this.atlasStore),
      },

      timestamp: nowISO(),
    };
  }

  getUserMetrics(isni: string) {
    return (
      this.users.get(
        normalizeIdentity(isni),
      ) || null
    );
  }

  getLedger() {
    return this.bookpi.getChain();
  }
}

/* =========================================================
 * FACTORY
 * =======================================================*/

export function createOmniKernelGateway(
  config: Partial<typeof DEFAULT_CONFIG> & AtlasIntegrationConfig = {},
) {
  return new OmniKernelGatewayX6(
    config,
  );
}

/* =========================================================
 * OPTIONAL TEST BOOTSTRAP
 * =======================================================*/

/*
const kernel = createOmniKernelGateway();

kernel.registerUser(
  'ISNI-0001',
  'Anubis'
);

(async () => {
  const response =
    await kernel.processRequest(
      'ISNI-0001',
      'COGNITIVE_QUERY',
      {
        content:
          'Generate ethical TAMV node architecture',
      },
    );

  console.log(response);

  console.log(
    kernel.buildSystemStatus(),
  );
})();
*/
