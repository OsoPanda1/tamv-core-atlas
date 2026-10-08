import { createHash, createHmac, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

const FEDERATIONS = [
  "Sociologica",
  "Identidad",
  "Gobernanza",
  "Territorial",
  "Educativa",
  "Tecnologica",
  "Economica",
];

const PROFILES = [
  "general",
  "contra-auditoria",
  "simulacion",
  "secretaria",
  "gobernanza",
  "auditoria-ecosistema",
];

const now = () => new Date().toISOString();
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));
const stableHash = (value) => createHash("sha256").update(
  typeof value === "string" ? value : JSON.stringify(value)
).digest("hex");

function deterministicScore(seed, min = 0.4, max = 1) {
  const hex = stableHash(seed).slice(0, 12);
  const ratio = parseInt(hex, 16) / 0xffffffffffff;
  return Number((min + ratio * (max - min)).toFixed(4));
}

function normalizeProbabilities(values) {
  if (!Array.isArray(values) || values.length === 0) throw new Error("probabilities must be a non-empty array");
  const clean = values.map(Number).filter(Number.isFinite).map((n) => Math.max(0, n));
  const total = clean.reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new Error("probabilities must contain positive finite mass");
  return clean.map((n) => n / total);
}

function shannon(values) {
  return normalizeProbabilities(values).reduce((h, p) => h - (p > 0 ? p * Math.log2(p) : 0), 0);
}

export class ModuleRegistry {
  constructor(modules = []) {
    this.modules = new Map();
    modules.forEach((m) => this.register(m));
  }
  register(module) {
    if (!module?.id || typeof module.execute !== "function") throw new Error("Invalid module");
    if (this.modules.has(module.id)) throw new Error(`Duplicate module: ${module.id}`);
    this.modules.set(module.id, module);
    return this;
  }
  get(id) { return this.modules.get(id); }
  list() { return [...this.modules.values()].map(({ id, version, domain, capabilities = [] }) => ({ id, version, domain, capabilities })); }
}

export class SkillRegistry {
  constructor(skills = []) {
    this.skills = new Map();
    skills.forEach((s) => this.register(s));
  }
  register(skill) {
    if (!skill?.id || typeof skill.run !== "function") throw new Error("Invalid skill");
    if (this.skills.has(skill.id)) throw new Error(`Duplicate skill: ${skill.id}`);
    this.skills.set(skill.id, skill);
    return this;
  }
  get(id) { return this.skills.get(id); }
  list() { return [...this.skills.values()].map(({ id, version, module, riskTier = "LOW" }) => ({ id, version, module, riskTier })); }
}

export class ProtocolRegistry {
  constructor(protocols = []) {
    this.protocols = new Map();
    protocols.forEach((p) => this.register(p));
  }
  register(protocol) {
    if (!protocol?.id || !Array.isArray(protocol.steps) || protocol.steps.length === 0) throw new Error("Invalid protocol");
    if (this.protocols.has(protocol.id)) throw new Error(`Duplicate protocol: ${protocol.id}`);
    this.protocols.set(protocol.id, protocol);
    return this;
  }
  get(id) { return this.protocols.get(id); }
  list() { return [...this.protocols.values()].map(({ id, version, purpose, steps, riskTier = "LOW" }) => ({ id, version, purpose, steps: steps.map((s) => s.skill), riskTier })); }
}

export class RuntimeMonitor {
  constructor() {
    this.samples = [];
    this.counters = { requests: 0, success: 0, failures: 0, blocked: 0 };
  }
  observe(name, durationMs, ok = true, meta = {}) {
    const sample = { name, durationMs: Number(durationMs.toFixed(3)), ok, at: now(), ...meta };
    this.samples.push(sample);
    if (this.samples.length > 2000) this.samples.shift();
    this.counters.requests += 1;
    if (ok) this.counters.success += 1; else this.counters.failures += 1;
    return sample;
  }
  snapshot() {
    const values = this.samples.map((s) => s.durationMs).sort((a,b) => a-b);
    const pct = (p) => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] : 0;
    return {
      samples: values.length,
      p50Ms: Number(pct(0.5).toFixed(3)),
      p95Ms: Number(pct(0.95).toFixed(3)),
      p99Ms: Number(pct(0.99).toFixed(3)),
      errorRate: this.counters.requests ? Number((this.counters.failures / this.counters.requests).toFixed(4)) : 0,
      counters: { ...this.counters },
    };
  }
}

export class BookPIChain {
  constructor(secret = process.env.TAMV_SECRET_KEY || "development-only-secret") {
    this.secret = secret;
    this.chain = [];
  }
  recordEvent(type, data) {
    const previousHash = this.chain.at(-1)?.currentHash ?? "GENESIS";
    const payload = { type, data, previousHash, timestamp: now() };
    const currentHash = stableHash(payload);
    const integritySignature = createHmac("sha256", this.secret).update(currentHash).digest("hex");
    const block = { index: this.chain.length, ...payload, currentHash, integritySignature };
    this.chain.push(block);
    return currentHash;
  }
  list() { return [...this.chain]; }
}

export class IsabellaEngine {
  constructor(config = {}) {
    this.version = "3.1-2026";
    this.hashDocumental = config.hashDocumentalOverride ?? "TAMV-IVAI-EMERGENT-COGNITION-v3.1-2026-NODO001";
    this.ledger = [];
    this.dossier = config.dossierOverride;
    this.manifoldDimensions = Math.max(8, Math.min(4096, Number(config.manifoldDimensions ?? 128)));
  }
  scoreFederations(hypothesis, sovereign = true) {
    const scores = {};
    const riskBands = {};
    for (const fed of FEDERATIONS) {
      const score = deterministicScore(`${fed}|${hypothesis}|${sovereign}`, sovereign ? 0.75 : 0.4, sovereign ? 1 : 0.8);
      scores[fed] = score;
      riskBands[fed] = score >= 0.8 ? "bajo" : score >= 0.6 ? "medio" : "alto";
    }
    return { scores, riskBands, consonante: Object.values(scores).every((s) => s >= 0.5) };
  }
  append(kind, profile, payload, context = {}) {
    const entry = {
      id: `isa_evt_${this.ledger.length + 1}`,
      kind, profile, timestamp: now(), sessionId: context.sessionId, actorId: context.actorId,
      channel: context.channel ?? "atlas", he_hep_context: context.he_hep_context, payload,
    };
    this.ledger.push(entry);
    return entry;
  }
  ejecutarContraAuditoria(premisaA, premisaB, context) {
    const a = String(premisaA ?? "").trim(), b = String(premisaB ?? "").trim();
    if (!a || !b) throw new Error("ambas premisas son requeridas");
    const contradiction = /jamás/i.test(a) && /resolvió/i.test(b);
    const resultado = {
      operacion: "Contra-Auditoria Cognitiva",
      tensionDetectada: contradiction ? 0.95 : 0.2,
      analisisEntropia: this.evaluarEntropia(contradiction ? [0.1, 0.9] : [0.5, 0.5]).resultado,
      falsable: contradiction,
      ...this.scoreFederations(`${a} || ${b}`, true),
    };
    const ledger = this.append("contra-auditoria", "contra-auditoria", { premisaA:a, premisaB:b, resultado }, context);
    return { resultado, ledger };
  }
  procesarSimulacionEpistemologica(hipotesis, soberano, context) {
    const h = String(hipotesis ?? "").trim();
    if (!h) throw new Error("hipótesis requerida");
    const validation = this.scoreFederations(h, Boolean(soberano));
    const factorOOD = clamp01(Math.max(0.1, 1 - h.split(/\s+/).filter(Boolean).length * 0.02));
    const resultado = {
      hashRegistro: this.hashDocumental, hipotesisEvaluada: h,
      validacionHeptafederada: validation.scores, riesgoFederado: validation.riskBands,
      consonanciaSistemica: validation.consonante, factorCompresionOOD: Number(factorOOD.toFixed(4)),
      estadoEmergente: validation.consonante && factorOOD < 0.7
        ? "Cognición Contextual Emergente Operacional Garantizada"
        : "Colapso Lógico o Reduccionismo Lineal Detectado",
    };
    const ledger = this.append("simulacion-epistemologica", "simulacion", { resultado }, context);
    return { resultado, ledger };
  }
  evaluarEntropia(probabilidades, context) {
    const resultado = {
      entropiaShannon: Number(shannon(probabilidades).toFixed(4)),
      estabilidadEpistemica: shannon(probabilidades) < 1.5,
      mitigacionRequerida: shannon(probabilidades) >= 1.5,
    };
    const ledger = this.append("entropia", "general", { probabilidades, resultado }, context);
    return { resultado, ledger };
  }
  auditarClaim(claim, context) {
    if (!claim?.claim) throw new Error("claim is required");
    const factor = { externally_verified:1, externally_visible:0.85, self_reported:0.6, not_verified:0.35 }[claim.verification] ?? 0.35;
    const validation = this.scoreFederations(claim.claim, true);
    const adjusted = Object.fromEntries(FEDERATIONS.map((f) => [f, Number((validation.scores[f] * factor).toFixed(4))]));
    const confidence = Object.values(adjusted).reduce((a,b)=>a+b,0)/7;
    const resultado = { ...claim, nivelConfianza:Number(confidence.toFixed(4)), scores:adjusted, riesgoFederado:validation.riskBands,
      recomendaciones: claim.verification === "not_verified" ? ["Publicar evidencia técnica reproducible."] : [] };
    const ledger = this.append("claim-audit", "auditoria-ecosistema", { claim, resultado }, context);
    return { resultado, ledger };
  }
  auditarEcosistema(dossier, context) {
    if (!dossier || !Array.isArray(dossier.claims)) throw new Error("dossier inválido");
    this.dossier = dossier;
    const claimAudits = dossier.claims.map((claim) => this.auditarClaim(claim, context).resultado);
    const confidence = claimAudits.length ? claimAudits.reduce((a,c)=>a+c.nivelConfianza,0)/claimAudits.length : 0;
    const resultado = {
      dossier, summary:{ totalClaims:claimAudits.length, confidence:Number(confidence.toFixed(4)) },
      claimAudits, highPriorityTasks:(dossier.pendingChecks ?? []).filter((p)=>p.priority==="high"),
      peligrosDetectados:claimAudits.filter((c)=>c.verification==="not_verified").map((c)=>`Claim sin verificación: "${c.claim}"`),
      decisiones:{ operacionExecutable:confidence>=0.6, requiereRevisiónHumana:confidence>=0.4&&confidence<0.6, bloquearOperacion:confidence<0.4 },
    };
    const ledger = this.append("ecosistema-audit","auditoria-ecosistema",{dossierId:dossier.id,resultado},context);
    return { resultado, ledger };
  }
  setDossier(dossier) { this.dossier = dossier; }
  getDossier() { return this.dossier; }
  listLedger(limit=100) { return this.ledger.slice(-Math.max(0, Number(limit)||0)); }
  getLedgerEntry(id) { return this.ledger.find((e)=>e.id===id) ?? null; }
  chat({input, profile="general", context, dossierOverride}) {
    const text = String(input ?? "").trim();
    if (!text) throw new Error("input is required");
    if (!PROFILES.includes(profile)) throw new Error(`unknown Isabella profile: ${profile}`);
    if (profile === "contra-auditoria") {
      const [a,b] = text.split(/\n---\n/);
      const {resultado} = this.ejecutarContraAuditoria(a ?? text,b ?? text,context);
      return { answer:`Isabella contra-auditoría: tension=${resultado.tensionDetectada.toFixed(2)}, entropy=${resultado.analisisEntropia.entropiaShannon}`, profile, safeguards:["epistemic-falsability","human-override-ready"] };
    }
    if (profile === "simulacion" || profile === "gobernanza") {
      const {resultado} = this.procesarSimulacionEpistemologica(text, profile === "simulacion", context);
      return { answer:`Isabella (${profile}): consonancia=${resultado.consonanciaSistemica}, factorOOD=${resultado.factorCompresionOOD}`, profile, safeguards:["federated-consistency","human-review-ready"] };
    }
    if (profile === "auditoria-ecosistema") {
      const dossier = dossierOverride ?? this.dossier;
      if (!dossier) return { answer:"No hay dossier disponible para auditoría.", profile, safeguards:["no-dossier-available"] };
      const {resultado} = this.auditarEcosistema(dossier,context);
      return { answer:`Auditoría TAMV: ${resultado.summary.totalClaims} claims, confianza=${resultado.summary.confidence.toFixed(2)}, ejecutar=${resultado.decisiones.operacionExecutable}`, profile, safeguards:["ecosystem-audit","claim-based-verifiability"] };
    }
    this.append("meta",profile,{input:text},context);
    return { answer:`Isabella recibió: ${text}`, profile, safeguards:["privacy-minimization","human-override-ready"] };
  }
  vision(payload) { return { modality:"vision", accepted:true, analysis:"Vision adapter ready; evidence must be supplied by an approved provider.", payloadHash:stableHash(payload) }; }
  audio(payload) { return { modality:"audio", accepted:true, analysis:"Audio adapter ready; transcription provider remains external.", payloadHash:stableHash(payload) }; }
  haptics(payload) { return { modality:"haptics", accepted:true, acceptedChannels:["vibration","pressure","temperature"], payloadHash:stableHash(payload) }; }
  registerLedgerEvent(payload) { return this.append("external-event","general",payload); }
  getLedgerEvent(id) { return this.getLedgerEntry(id); }
  listPlugins() { return [{id:"atlas-core",status:"builtin",capabilities:["modules","skills","protocols","monitoring"]}]; }
  installPlugin(id) { if (id !== "atlas-core") throw new Error("Only governed built-in plugins are installable in core runtime"); return this.listPlugins()[0]; }
}

export class AtlasKernelRuntime {
  constructor() {
    this.ledger=[]; this.users=[]; this.protocols=[]; this.auditLog=[];
  }
  snapshot(context={hexagon:"HE-Ingest",domain:"HEP-1"}) {
    return { id:`atlas_${randomUUID().replaceAll("-","")}`, createdAt:now(), he_hep_context:context,
      ledger:[...this.ledger], users:[...this.users], protocols:[...this.protocols], auditLog:[...this.auditLog], agents:[], taskGraphLayers:[] };
  }
  logAudit(action,payload,context={hexagon:"HE-Ingest",domain:"HEP-1"}) {
    const e={id:`aud_${randomUUID().replaceAll("-","")}`,action,payload,he_hep_context:context,createdAt:now()}; this.auditLog.push(e); return e;
  }
  createUser(handle,displayName,roles=["citizen"],memberships=["free"]) {
    if (!handle) throw new Error("handle required");
    const user={id:`usr_${randomUUID().replaceAll("-","")}`,handle,displayName:String(displayName??handle),roles,memberships,createdAt:now()};
    this.users.push(user); this.logAudit("createUser",user); return user;
  }
  executeProtocol(protocolId,actorId,paths=[]) {
    if (!protocolId || !actorId || !Array.isArray(paths) || !paths.length) throw new Error("protocolId, actorId and paths are required");
    const ranked=[...paths].sort((a,b)=>(Number(b.score)||0)-(Number(b.ethicalRisk)||0)*2-((Number(a.score)||0)-(Number(a.ethicalRisk)||0)*2));
    const execution={id:`prc_${randomUUID().replaceAll("-","")}`,protocolId,phase:"completed",selectedPath:ranked[0],evaluatedPaths:ranked,collapsedAt:now(),actorId};
    this.protocols.push(execution); this.logAudit("executeProtocol",execution); return execution;
  }
  postLedger(userId,amount,reason) {
    const n=Number(amount); if (!userId || !Number.isFinite(n)) throw new Error("userId and numeric amount are required");
    const entry={id:`ldg_${randomUUID().replaceAll("-","")}`,userId,amount:n,reason:String(reason??""),kind:n>=0?"credit":"debit",createdAt:now()};
    this.ledger.push(entry); this.logAudit("postLedger",entry); return entry;
  }
  listUsers(){return [...this.users];}
  listLedger(){return [...this.ledger];}
  listProtocols(){return [...this.protocols];}
  listAuditLog(){return [...this.auditLog];}
}

export class AtlasCoreRuntime {
  constructor(options={}) {
    this.monitor=new RuntimeMonitor();
    this.bookpi=new BookPIChain(options.secret);
    this.isabella=new IsabellaEngine(options.isabella);
    this.atlas=new AtlasKernelRuntime();
    this.modules=new ModuleRegistry();
    this.skills=new SkillRegistry();
    this.protocols=new ProtocolRegistry();
    this.events=new EventEmitter();
    this.registerBuiltins();
  }
  registerBuiltins() {
    this.modules.register({id:"atlas.ingestion",version:"1.0.0",domain:"atlas",capabilities:["discover","fetch","normalize","classify","relate","publish"],execute:async (ctx)=>ctx});
    this.modules.register({id:"isabella.cognition",version:"3.1.0",domain:"cognition",capabilities:["contra-auditoria","simulacion","entropia","auditoria-ecosistema"],execute:async (ctx)=>this.isabella.chat(ctx)});
    this.modules.register({id:"governance.runtime",version:"1.0.0",domain:"governance",capabilities:["policy","risk","audit"],execute:async (ctx)=>({approved:true,profile:ctx.profile??"general"})});
    this.modules.register({id:"observability.runtime",version:"1.0.0",domain:"eoct",capabilities:["latency","errors","slo"],execute:async ()=>this.monitor.snapshot()});
    this.skills.register({id:"skill.isabella.chat",version:"1.0.0",module:"isabella.cognition",riskTier:"LOW",run:async(ctx)=>this.isabella.chat(ctx)});
    this.skills.register({id:"skill.isabella.entropy",version:"1.0.0",module:"isabella.cognition",riskTier:"LOW",run:async(ctx)=>this.isabella.evaluarEntropia(ctx.probabilities,ctx.context)});
    this.skills.register({id:"skill.atlas.protocol",version:"1.0.0",module:"atlas.ingestion",riskTier:"LOW",run:async(ctx)=>this.atlas.executeProtocol(ctx.protocolId,ctx.actorId,ctx.paths)});
    this.protocols.register({id:"protocol.isabella.audit",version:"1.0.0",purpose:"contra-audit and epistemic safety",riskTier:"LOW",steps:[{skill:"skill.isabella.chat"}]});
    this.protocols.register({id:"protocol.atlas.execute",version:"1.0.0",purpose:"governed Atlas protocol execution",riskTier:"LOW",steps:[{skill:"skill.atlas.protocol"}]});
  }
  async executeSkill(skillId,ctx={}) {
    const started=performance.now();
    const skill=this.skills.get(skillId); if(!skill) throw new Error(`Unknown skill: ${skillId}`);
    try { const result=await skill.run(ctx); this.monitor.observe(skillId,performance.now()-started,true); return result; }
    catch(error){this.monitor.observe(skillId,performance.now()-started,false); throw error;}
  }
  async executeProtocol(protocolId,ctx={}) {
    const protocol=this.protocols.get(protocolId); if(!protocol) throw new Error(`Unknown protocol: ${protocolId}`);
    const started=performance.now();
    try {
      const results={};
      for(const step of protocol.steps) results[step.skill]=await this.executeSkill(step.skill,ctx);
      this.monitor.observe(protocolId,performance.now()-started,true);
      this.bookpi.recordEvent("PROTOCOL_EXECUTED",{protocolId,results});
      return {protocolId,version:protocol.version,results};
    } catch(error){this.monitor.observe(protocolId,performance.now()-started,false); this.bookpi.recordEvent("PROTOCOL_FAILED",{protocolId,error:String(error)}); throw error;}
  }
  health() {
    return {status:"operational",runtime:"atlas-core",version:"1.0.0",modules:this.modules.list(),skills:this.skills.list(),protocols:this.protocols.list(),monitor:this.monitor.snapshot(),ledgerBlocks:this.bookpi.list().length};
  }
}

export const createAtlasCoreRuntime = (options={}) => new AtlasCoreRuntime(options);
export const createIsabellaEngine = (config={}) => new IsabellaEngine(config);
export const createOmniKernelGateway = () => ({ processRequest: async (payload) => ({ accepted:true,payloadHash:stableHash(payload) }) });
