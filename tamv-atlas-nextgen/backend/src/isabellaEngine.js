// IsabellaEngine v3.0 – Núcleo cognitivo heptafederado con auditoría de claims y anclaje al Nodo 001
// Derivado del IsabellaEngine v1.0 (Zenodo: 20538366) y alineado con TAMV + Nodo 001 (Génesis).

// =========================================================
// Import / tipo de Dossier Nodo 001 (definido en tu repo)
// =========================================================

export type VerificationLevel =
  | 'self_reported'
  | 'externally_visible'
  | 'externally_verified'
  | 'not_verified';

export interface Claim {
  claim: string;
  source: string;
  verification: VerificationLevel;
  notes?: string;
}

export interface PendingCheck {
  priority: 'high' | 'medium' | 'low';
  task: string;
}

export interface Nodo001ResearchDossier {
  id: string;
  version: string;
  title: string;
  scope: {
    project: string;
    founder: string;
    location: string;
  };
  executiveSummary: string;
  claims: Claim[];
  pendingChecks: PendingCheck[];
  recommendations: string[];
}

// =========================================================
// Contexto TAMV / HE-HEP
// =========================================================

export type HexagonId =
  | 'HE-Ingest'
  | 'HE-Transform'
  | 'HE-Publish'
  | 'HE-Science'
  | 'HE-Economy'
  | 'HE-Identity';

export type HeDomainId =
  | 'HEP-1'
  | 'HEP-2'
  | 'HEP-3'
  | 'HEP-4'
  | 'HEP-5'
  | 'HEP-6'
  | 'HEP-7';

export interface HeHepContext {
  hexagon: HexagonId;
  domain: HeDomainId;
}

const HE_DEFAULT_COGNITIVE: HeHepContext = {
  hexagon: 'HE-Science',
  domain: 'HEP-1',
};

const HE_DEFAULT_GOVERNANCE: HeHepContext = {
  hexagon: 'HE-Identity',
  domain: 'HEP-3',
};

const HE_DEFAULT_TERRITORIAL: HeHepContext = {
  hexagon: 'HE-Ingest',
  domain: 'HEP-4',
};

const HE_DEFAULT_AUDIT: HeHepContext = {
  hexagon: 'HE-Publish',
  domain: 'HEP-2',
};

// =========================================================
// Tipos Isabella v3.0
// =========================================================

type FederationId =
  | 'Sociologica'
  | 'Identidad'
  | 'Gobernanza'
  | 'Territorial'
  | 'Educativa'
  | 'Tecnologica'
  | 'Economica';

export type IsabellaProfile =
  | 'general'
  | 'contra-auditoria'
  | 'simulacion'
  | 'secretaria'
  | 'gobernanza'
  | 'auditoria-ecosistema';

export interface HeptafederatedScores {
  Sociologica: number;
  Identidad: number;
  Gobernanza: number;
  Territorial: number;
  Educativa: number;
  Tecnologica: number;
  Economica: number;
}

export interface FederationRiskBands {
  [fed: string]: 'alto' | 'medio' | 'bajo';
}

export interface EntropyAnalysis {
  entropiaShannon: number;
  estabilidadEpistemica: boolean;
  mitigacionRequerida: boolean;
}

export interface ContraAuditoriaResult {
  operacion: 'Contra-Auditoria Cognitiva';
  tensionDetectada: number;
  analisisEntropia: EntropyAnalysis;
  falsable: boolean;
  riesgoFederado: FederationRiskBands;
}

export interface EpistemicSimulationResult {
  hashRegistro: string;
  hipotesisEvaluada: string;
  validacionHeptafederada: HeptafederatedScores;
  riesgoFederado: FederationRiskBands;
  consonanciaSistemica: boolean;
  factorCompresionOOD: number;
  estadoEmergente: string;
}

export interface ClaimAuditResult {
  claim: string;
  source: string;
  verification: VerificationLevel;
  nivelConfianza: number; // 0–1
  riesgoFederado: FederationRiskBands;
  scores: HeptafederatedScores;
  recomendaciones: string[];
  notes?: string;
}

export interface EcosistemaAuditReport {
  dossier: Nodo001ResearchDossier;
  summary: {
    totalClaims: number;
    selfReported: number;
    externallyVisible: number;
    externallyVerified: number;
    notVerified: number;
    confidence: number;
  };
  claimAudits: ClaimAuditResult[];
  highPriorityTasks: PendingCheck[];
  peligrosDetectados: string[];
  decisiones: {
    operacionExecutable: boolean;
    requiereRevisiónHumana: boolean;
    bloquearOperacion: boolean;
  };
}

interface LatentPoint {
  id: string;
  label: string;
  vector: number[];
}

export interface IsabellaLedgerEntry {
  id: string;
  kind:
    | 'contra-auditoria'
    | 'simulacion-epistemologica'
    | 'heptafederacion'
    | 'entropia'
    | 'claim-audit'
    | 'ecosistema-audit'
    | 'meta';
  timestamp: string;
  profile: IsabellaProfile;
  he_hep_context: HeHepContext;
  sessionId?: string;
  actorId?: string;
  channel?: 'atlas' | 'omnikernel' | 'console' | 'external';
  payload: unknown;
}

export interface IsabellaEngineConfig {
  manifoldDimensions?: number;
  entropiaUmbralCritico?: number;
  heptafederacionUmbralMinimo?: number;
  hashDocumentalOverride?: string;
  defaultContext?: HeHepContext;
  dossierOverride?: Nodo001ResearchDossier;
}

export interface IsabellaInvocationContext {
  sessionId?: string;
  actorId?: string;
  channel?: 'atlas' | 'omnikernel' | 'console' | 'external';
  he_hep_context?: HeHepContext;
}

// Helpers

function nowISO(): string {
  return new Date().toISOString();
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function probabilitiesNormalize(values: number[]): number[] {
  const safe = values.map((v) => (v < 0 ? 0 : v));
  const sum = safe.reduce((a, b) => a + b, 0) || 1;
  return safe.map((v) => v / sum);
}

// =========================================================
// LatentSpaceManifold v3.0
// =========================================================

class LatentSpaceManifold {
  readonly dimensions: number;
  private conceptBank: Map<string, LatentPoint>;

  constructor(dimensions = 128) {
    this.dimensions = dimensions;
    this.conceptBank = new Map();

    this.registerConcept('soberania_digital');
    this.registerConcept('reduccionismo_estadistico');
    this.registerConcept('cognicion_contextual');
    this.registerConcept('infraestructura_cognitiva');
    this.registerConcept('isomorfismo_funcional');
    this.registerConcept('nodo_001_genesis');
    this.registerConcept('evidencia_tamv_online');
  }

  private randomVector(): number[] {
    const v: number[] = [];
    for (let i = 0; i < this.dimensions; i += 1) {
      v.push(randFloat(-1, 1));
    }
    return v;
  }

  registerConcept(label: string): LatentPoint {
    const id = `concept_${this.conceptBank.size + 1}`;
    const point: LatentPoint = {
      id,
      label,
      vector: this.randomVector(),
    };
    this.conceptBank.set(label, point);
    return point;
  }

  getConcept(label: string): LatentPoint | undefined {
    return this.conceptBank.get(label);
  }

  distance(v1: number[], v2: number[]): number {
    const n = Math.min(v1.length, v2.length);
    let acc = 0;
    for (let i = 0; i < n; i += 1) {
      const d = v1[i] - v2[i];
      acc += d * d;
    }
    return Math.sqrt(acc);
  }

  projectOODFactor(hipotesis: string): number {
    const tokens = hipotesis.split(/\s+/).filter(Boolean);
    const pesoAbstraccion = tokens.length;
    const raw = 1.0 - pesoAbstraccion * 0.02;
    return clamp01(Math.max(0.1, raw));
  }
}

// =========================================================
// HeptafederatedValidator v3.0
// =========================================================

class HeptafederatedValidator {
  private readonly federaciones: FederationId[] = [
    'Sociologica',
    'Identidad',
    'Gobernanza',
    'Territorial',
    'Educativa',
    'Tecnologica',
    'Economica',
  ];

  constructor(private readonly umbralMinimo = 0.5) {}

  evaluarConsonancia(datos: {
    hipotesis: string;
    soberano: boolean;
  }): {
    consonante: boolean;
    scores: HeptafederatedScores;
    riskBands: FederationRiskBands;
  } {
    const { soberano } = datos;
    const scores: Partial<HeptafederatedScores> = {};
    const riskBands: FederationRiskBands = {};
    let consonante = true;

    for (const fed of this.federaciones) {
      const score = soberano
        ? randFloat(0.75, 1.0)
        : randFloat(0.4, 0.8);

      const rounded = Number(score.toFixed(4));
      scores[fed] = rounded;

      if (score < this.umbralMinimo) consonante = false;

      if (rounded >= 0.8) {
        riskBands[fed] = 'bajo';
      } else if (rounded >= 0.6) {
        riskBands[fed] = 'medio';
      } else {
        riskBands[fed] = 'alto';
      }
    }

    return {
      consonante,
      scores: scores as HeptafederatedScores,
      riskBands,
    };
  }

  /**
   * Valida un claim con base en su nivel de verificación y federaciones.
   * Devuelve scores + riesgo ajustado por `verification`.
   */
  evaluarClaim(claim: Claim): {
    scores: HeptafederatedScores;
    riskBands: FederationRiskBands;
    nivelConfianza: number;
    consonante: boolean;
  } {
    const base = this.evaluarConsonancia({
      hipotesis: claim.claim,
      soberano: true,
    });

    const { scores, riskBands, consonante } = base;

    // Ajuste por nivel de verificación
    let factor = 1.0;
    switch (claim.verification) {
      case 'externally_verified':
        factor = 1.0;
        break;
      case 'externally_visible':
        factor = 0.85;
        break;
      case 'self_reported':
        factor = 0.6;
        break;
      case 'not_verified':
        factor = 0.35;
        break;
      default:
        factor = 0.5;
    }

    // Aplicar factor a todos los scores
    const adjusted: HeptafederatedScores = {
      Sociologica: clamp01(scores.Sociologica * factor),
      Identidad: clamp01(scores.Identidad * factor),
      Gobernanza: clamp01(scores Gobernanza * factor),
      Territorial: clamp01(scores.Territorial * factor),
      Educativa: clamp01(scores.Educativa * factor),
      Tecnologica: clamp01(scores.Tecnologica * factor),
      Economica: clamp01(scores.Economica * factor),
    };

    // Re-computar bandas
    const adjustedBands: FederationRiskBands = {} as FederationRiskBands;
    for (const fed of this.federaciones) {
      const s = adjusted[fed];
      if (s >= 0.7) adjustedBands[fed] = 'bajo';
      else if (s >= 0.5) adjustedBands[fed] = 'medio';
      else adjustedBands[fed] = 'alto';
    }

    const nivelConfianza = Object.values(adjusted).reduce((a, b) => a + b, 0) / 7;

    // Si hay federación "Tecnologica" o "Identidad" muy baja, puede haber no consonancia
    let consonanteFinal = consonante;
    if (adjusted.Tecnologica < 0.5 || adjusted.Identidad < 0.5) {
      consonanteFinal = false;
    }

    return {
      scores: adjusted,
      riskBands: adjustedBands,
      nivelConfianza,
      consonante: consonanteFinal,
    };
  }
}

// =========================================================
// EntropyMitigator v3.0
// =========================================================

class EntropyMitigator {
  constructor(private readonly umbralCritico = 1.5) {}

  calcularEntropiaShannon(probabilidades: number[]): number {
    let entropia = 0;
    for (const p of probabilitiesNormalize(probabilidades)) {
      if (p > 0) {
        entropia -= p * Math.log2(p);
      }
    }
    return entropia;
  }

  evaluarArgumento(probabilidades: number[]): EntropyAnalysis {
    const entropia = this.calcularEntropiaShannon(probabilidades);
    const estable = entropia < this.umbralCritico;
    return {
      entropiaShannon: Number(entropia.toFixed(4)),
      estabilidadEpistemica: estable,
      mitigacionRequerida: !estable,
    };
  }
}

// =========================================================
// IsabellaEngine v3.0 – Núcleo con auditoría de claims y Nodo 001
// =========================================================

export class IsabellaEngine {
  readonly version: string;
  readonly hashDocumental: string;

  private manifold: LatentSpaceManifold;
  private validator: HeptafederatedValidator;
  private mitigator: EntropyMitigator;
  private ledger: IsabellaLedgerEntry[];
  private defaultContext: HeHepContext;
  private dossierCached?: Nodo001ResearchDossier;

  constructor(config: IsabellaEngineConfig = {}) {
    this.version = '3.0-2026';
    this.hashDocumental =
      config.hashDocumentalOverride ??
      'TAMV-IVAI-EMERGENT-COGNITION-v3.0-2026-NODO001';

    this.manifold = new LatentSpaceManifold(
      config.manifoldDimensions ?? 128,
    );
    this.validator = new HeptafederatedValidator(
      config.heptafederacionUmbralMinimo ?? 0.5,
    );
    this.mitigator = new EntropyMitigator(
      config.entropiaUmbralCritico ?? 1.5,
    );
    this.ledger = [];
    this.defaultContext =
      config.defaultContext ?? HE_DEFAULT_COGNITIVE;

    this.dossierCached = config.dossierOverride;
  }

  private resolveContext(
    ctx?: IsabellaInvocationContext,
  ): IsabellaInvocationContext & { he_hep_context: HeHepContext } {
    return {
      sessionId: ctx?.sessionId,
      actorId: ctx?.actorId,
      channel: ctx?.channel ?? 'console',
      he_hep_context: ctx?.he_hep_context ?? this.defaultContext,
    };
  }

  

  private appendLedger(
    kind: IsabellaLedgerEntry['kind'],
    profile: IsabellaProfile,
    payload: unknown,
    ctx?: IsabellaInvocationContext,
  ): IsabellaLedgerEntry {
    const resolved = this.resolveContext(ctx);
    const entry: IsabellaLedgerEntry = {
      id: `isa_evt_${this.ledger.length + 1}`,
      kind,
      profile,
      timestamp: nowISO(),
      he_hep_context: resolved.he_hep_context,
      sessionId: resolved.sessionId,
      actorId: resolved.actorId,
      channel: resolved.channel,
      payload,
    };
    this.ledger.push(entry);
    return entry;
  }

  // -------------------------------------------------------
  // 1. Contra-auditoría cognitiva
  // -------------------------------------------------------

  ejecutarContraAuditoria(
    premisaA: string,
    premisaB: string,
    ctx?: IsabellaInvocationContext,
  ): {
    resultado: ContraAuditoriaResult;
    ledger: IsabellaLedgerEntry;
  } {
    const a = normalizeText(premisaA).toLowerCase();
    const b = normalizeText(premisaB).toLowerCase();

    if (!a || !b) {
      throw new Error(
        'ambas premisas son requeridas para la contra-auditoría',
      );
    }

    const esContradiccionFuerte =
      a.includes('jamás') && b.includes('resolvió');

    const tension = esContradiccionFuerte ? 0.95 : 0.2;
    const probabilidadesEntropia = esContradiccionFuerte
      ? [0.1, 0.9]
      : [0.5, 0.5];

    const analisisEntropia =
      this.mitigator.evaluarArgumento(probabilidadesEntropia);

    const { riskBands } =
      this.validator.evaluarConsonancia({
        hipotesis: `${premisaA} || ${premisaB}`,
        soberano: true,
      });

    const resultado: ContraAuditoriaResult = {
      operacion: 'Contra-Auditoria Cognitiva',
      tensionDetectada: tension,
      analisisEntropia,
      falsable: analisisEntropia.mitigacionRequerida,
      riesgoFederado: riskBands,
    };

    const ledger = this.appendLedger(
      'contra-auditoria',
      'contra-auditoria',
      {
        premisaA,
        premisaB,
        tension,
        analisisEntropia,
        riesgoFederado: riskBands,
      },
      {
        ...ctx,
        he_hep_context: HE_DEFAULT_GOVERNANCE,
      },
    );

    return { resultado, ledger };
  }

  // -------------------------------------------------------
  // 2. Simulación epistemológica
  // -------------------------------------------------------

  procesarSimulacionEpistemologica(
    hipotesis: string,
    contextoSoberano: boolean,
    ctx?: IsabellaInvocationContext,
  ): {
    resultado: EpistemicSimulationResult;
    ledger: IsabellaLedgerEntry;
  } {
    const h = normalizeText(hipotesis);
    if (!h) throw new Error('hipótesis requerida para simulación epistemológica');

    const payloadContextual = { hipotesis: h, soberano: contextoSoberano };

    const { consonante, scores, riskBands } =
      this.validator.evaluarConsonancia(payloadContextual);

    const factorOOD = this.manifold.projectOODFactor(h);

    let estado: string;
    if (consonante && factorOOD < 0.7) {
      estado =
        'Cognición Contextual Emergente Operacional Garantizada';
    } else {
      estado =
        'Colapso Lógico o Reduccionismo Lineal Detectado';
    }

    const resultado: EpistemicSimulationResult = {
      hashRegistro: this.hashDocumental,
      hipotesisEvaluada: h,
      validacionHeptafederada: scores,
      riesgoFederado: riskBands,
      consonanciaSistemica: consonante,
      factorCompresionOOD: Number(factorOOD.toFixed(4)),
      estadoEmergente: estado,
    };

    const ledger = this.appendLedger(
      'simulacion-epistemologica',
      'simulacion',
      { ...payloadContextual, resultado },
      {
        ...ctx,
        he_hep_context: contextoSoberano
          ? HE_DEFAULT_TERRITORIAL
          : this.defaultContext,
      },
    );

    this.appendLedger(
      'heptafederacion',
      'simulacion',
      { hipotesis: h, scores, riskBands, contextoSoberano },
      ctx,
    );

    return { resultado, ledger };
  }

  evaluateEntropy(probabilidades: number[], ctx?: IsabellaInvocationContext): {
    resultado: EntropyAnalysis;
    ledger: IsabellaLedgerEntry;
  } {
    if (
      !Array.isArray(probabilidades) ||
      probabilidades.length === 0
    ) {
      throw new Error(
        'se requiere una lista de probabilidades para evaluar entropía',
      );
    }

    const resultado = this.mitigator.evaluarArgumento(probabilidades);

    const ledger = this.appendLedger(
      'entropia',
      'general',
      { probabilidades, resultado },
      ctx,
    );

    return { resultado, ledger };
  }

  // -------------------------------------------------------
  // 3. Auditoría de claims y ecosistema TAMV (Nodo 001)
  // -------------------------------------------------------

  setDossier(dossier: Nodo001ResearchDossier): void {
    this.dossierCached = dossier;
  }

  getDossier(): Nodo001ResearchDossier | undefined {
    return this.dossierCached;
  }

  auditarClaim(
    claim: Claim,
    ctx?: IsabellaInvocationContext,
  ): {
    resultado: ClaimAuditResult;
    ledger: IsabellaLedgerEntry;
  } {
    const { scores, riskBands, nivelConfianza, consonante } =
      this.validator.evaluarClaim(claim);

    const recomendaciones: string[] = [];

    if (claim.verification === 'not_verified') {
      recomendaciones.push(
        'Publicar evidencia técnica reproducible (PoC, repos, tests).',
      );
    } else if (claim.verification === 'self_reported') {
      recomendaciones.push(
        'Validar con auditoría externa o tercera parte confiable.',
      );
    }

    if (!consonante) {
      recomendaciones.push(
        'Revisar alineación con federaciones de Identidad y Tecnología.',
      );
    }

    if (nivelConfianza < 0.5) {
      recomendaciones.push(
        'Considerar marcar claim como "no firmado" en documentación pública.',
      );
    }

    const resultado: ClaimAuditResult = {
      claim: claim.claim,
      source: claim.source,
      verification: claim.verification,
      nivelConfianza: Number(nivelConfianza.toFixed(4)),
      riesgoFederado: riskBands,
      scores,
      recomendaciones,
      notes: claim.notes,
    };

    const ledger = this.appendLedger(
      'claim-audit',
      'auditoria-ecosistema',
      { claim, resultado },
      {
        ...ctx,
        he_hep_context: HE_DEFAULT_AUDIT,
      },
    );

    return { resultado, ledger };
  }

  auditarEcosistema(
    dossier: Nodo001ResearchDossier,
    ctx?: IsabellaInvocationContext,
  ): {
    resultado: EcosistemaAuditReport;
    ledger: IsabellaLedgerEntry;
  } {
    this.setDossier(dossier);

    const claimAudits: ClaimAuditResult[] = [];
    let selfReported = 0;
    let externallyVisible = 0;
    let externallyVerified = 0;
    let notVerified = 0;
    let totalConfianza = 0;

    const peligrosDetectados: string[] = [];

    for (const claim of dossier.claims) {
      const { resultado } = this.auditarClaim(claim, ctx);
      claimAudits.push(resultado);

      switch (claim.verification) {
        case 'self_reported':
          selfReported += 1;
          break;
        case 'externally_visible':
          externallyVisible += 1;
          break;
        case 'externally_verified':
          externallyVerified += 1;
          break;
        case 'not_verified':
          notVerified += 1;
          break;
      }

      totalConfianza += resultado.nivelConfianza;

      if (
        claim.verification === 'not_verified' &&
        resultado.nivelConfianza < 0.4
      ) {
        peligrosDetectados.push(
          `Claim sin verificación y baja confianza: "${claim.claim}"`,
        );
      }
    }

    const totalClaims = dossier.claims.length;
    const confidence = totalClaims > 0 ? totalConfianza / totalClaims : 0;

    const highPriorityTasks = dossier.pendingChecks.filter(
      (p) => p.priority === 'high',
    );

    const operacionExecutable = confidence >= 0.6;
    const requiereRevisionHumana =
      confidence >= 0.4 && confidence < 0.6;
    const bloquearOperacion = confidence < 0.4;

    if (bloquearOperacion) {
      peligrosDetectados.push(
        'Confianza global del ecosistema insuficiente para operación comercial sin auditoría externa.',
      );
    }

    const summary = {
      totalClaims,
      selfReported,
      externallyVisible,
      externallyVerified,
      notVerified,
      confidence: Number(confidence.toFixed(4)),
    };

    const resultado: EcosistemaAuditReport = {
      dossier,
      summary,
      claimAudits,
      highPriorityTasks,
      peligrosDetectados,
      decisiones: {
        operacionExecutable,
        requiereRevisiónHumana,
        bloquearOperacion,
      },
    };

    const ledger = this.appendLedger(
      'ecosistema-audit',
      'auditoria-ecosistema',
      {
        dossierId: dossier.id,
        version: dossier.version,
        summary,
        claimAudits,
        decisiones: resultado.decisiones,
      },
      {
        ...ctx,
        he_hep_context: HE_DEFAULT_AUDIT,
      },
    );

    return { resultado, ledger };
  }

  // -------------------------------------------------------
  // 4. API de ledger
  // -------------------------------------------------------

  listLedger(limit = 100): IsabellaLedgerEntry[] {
    if (limit <= 0) return [];
    return this.ledger.slice(-limit);
  }

  getLedgerEntry(id: string): IsabellaLedgerEntry | null {
    return this.ledger.find((e) => e.id === id) ?? null;
  }

  // -------------------------------------------------------
  // 5. API chat simplificada con perfil auditoria-ecosistema
  // -------------------------------------------------------

  chat({
    input,
    profile = 'general',
    context,
    dossierOverride,
  }: {
    input: string;
    profile?: IsabellaProfile;
    context?: IsabellaInvocationContext;
    dossierOverride?: Nodo001ResearchDossier;
  }) {
    const text = normalizeText(input);
    if (!text) throw new Error('input is required');

    const resolvedProfile: IsabellaProfile = profile;

    if (resolvedProfile === 'contra-auditoria') {
      const [a, b] = text.split(/\n---\n/);
      const { resultado } = this.ejecutarContraAuditoria(
        a ?? text,
        b ?? text,
        context,
      );
      return {
        answer: `Isabella ejecutó contra-auditoría: tensión=${resultado.tensionDetectada.toFixed(
          2,
        )}, entropía=${resultado.analisisEntropia.entropiaShannon}`,
        profile: resolvedProfile,
        safeguards: [
          'epistemic-falsability',
          'human-override-ready',
        ],
      };
    }

    if (resolvedProfile === 'simulacion') {
      const { resultado } = this.procesarSimulacionEpistemologica(
        text,
        true,
        context,
      );
      return {
        answer: `Simulación epistemológica: estado="${resultado.estadoEmergente}", factorOOD=${resultado.factorCompresionOOD}`,
        profile: resolvedProfile,
        safeguards: [
          'federated-consistency',
          'territorial-anchor',
        ],
      };
    }

    if (resolvedProfile === 'gobernanza') {
      const { resultado } = this.procesarSimulacionEpistemologica(
        text,
        false,
        {
          ...context,
          he_hep_context: HE_DEFAULT_GOVERNANCE,
        },
      );
      return {
        answer: `Isabella (gobernanza) evaluó hipótesis: consonancia=${resultado.consonanciaSistemica}, riesgo.Gobernanza=${resultado.riesgoFederado.Gobernanza}`,
        profile: resolvedProfile,
        safeguards: ['policy-alignment', 'human-review-required'],
      };
    }

    if (resolvedProfile === 'auditoria-ecosistema') {
      const dossier = dossierOverride ?? this.dossierCached;
      if (!dossier) {
        return {
          answer:
            'No hay dossier disponible para auditoría. Proporciona un dossier en el campo dossierOverride o llama a setDossier().',
          profile: resolvedProfile,
          safeguards: ['no-dossier-available'],
        };
      }

      const { resultado } = this.auditarEcosistema(dossier, context);

      const { summary, decisiones, peligrosDetectados } = resultado;

      let answer =
        `Auditoría de ecosistema TAMV (Nodo 001): ` +
        `${summary.totalClaims} claims evaluados, ` +
        `confianza global=${summary.confidence.toFixed(2)}, ` +
        `operaciónExecutable=${decisiones.operacionExecutable}, ` +
        `requiereRevisiónHumana=${decisiones.requiereRevisiónHumana}, ` +
        `bloquearOperacion=${decisiones.bloquearOperacion}.`;

      if (peligrosDetectados.length > 0) {
        answer +=
          ` Peligros detectados: ${peligrosDetectados.slice(0, 3).join('; ')}.`;
      }

      return {
        answer,
        profile: resolvedProfile,
        safeguards: [
          'ecosystem-audit',
          'human-review-conditional',
          'claim-based-verifiability',
        ],
      };
    }

    // fallback general
    this.appendLedger('meta', resolvedProfile, { input: text }, context);

    return {
      answer: `Isabella recibió: ${text}`,
      profile: resolvedProfile,
      safeguards: [
        'privacy-minimization',
        'human-override-ready',
      ],
    };
  }
}
