import { describe, it} from "node:test";
import assert from "node:assert/strict";
import { TestingTools } from "./testing.tools.js";
import NOOPService from "../services/noop.hc.js";

const getServiceHarness = (service) =>
  TestingTools.Harness.createServiceHarness(service);

describe("NOOPService", () => {
  it("Should be able to instantiate NOOPService", () => {
    const { service } = getServiceHarness(NOOPService);
    assert.ok(service);
  });

  it("Should be able to return greeting message with sender", () => {
    const { service } = getServiceHarness(NOOPService);
    const result = service.hello("Alice", "Bob");

    assert.equal(result, "[NOOPService] has a message for Alice from: Bob");
  });

  it("Should be able to fall back to default sender", () => {
    const { service } = getServiceHarness(NOOPService);
    const result = service.hello("Alice");

    assert.equal(
      result,
      "[NOOPService] has a message for Alice from: Someone special"
    );
  });
});


