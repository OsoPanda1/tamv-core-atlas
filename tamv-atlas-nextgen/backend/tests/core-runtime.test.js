import test from "node:test";
import assert from "node:assert/strict";
import { createAtlasCoreRuntime } from "../src/tamvCoreRuntime.js";

test("canonical runtime exposes modules, skills and protocols", async () => {
  const runtime = createAtlasCoreRuntime({ secret: "test-secret" });
  assert.ok(runtime.modules.get("isabella.cognition"));
  assert.ok(runtime.skills.get("skill.isabella.entropy"));
  assert.ok(runtime.protocols.get("protocol.isabella.audit"));

  const entropy = await runtime.executeSkill("skill.isabella.entropy", {
    probabilities: [0.1, 0.9],
  });
  assert.equal(typeof entropy.resultado.entropiaShannon, "number");

  const protocol = await runtime.executeProtocol("protocol.isabella.audit", {
    input: "La premisa jamás fue cierta.\n---\nEl sistema resolvió el conflicto.",
    profile: "contra-auditoria",
  });
  assert.equal(protocol.protocolId, "protocol.isabella.audit");
  assert.equal(runtime.health().status, "operational");
  assert.ok(runtime.health().monitor.samples > 0);
});

test("atlas protocol execution rejects missing paths", () => {
  const runtime = createAtlasCoreRuntime();
  assert.throws(
    () => runtime.atlas.executeProtocol("p1", "actor-1", []),
    /paths are required/,
  );
});
