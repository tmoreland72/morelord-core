import test from "node:test";
import assert from "node:assert/strict";
import { DocumentationService } from "../scripts/documentation/documentation-service.js";

test("product documentation registers, lists, and returns defensive copies", () => {
  const service = new DocumentationService();
  service.register({ id: "morelord-test", title: "Test", sections: [{ id: "purpose", title: "Purpose" }] });
  const product = service.get("morelord-test");
  product.sections[0].title = "Changed";
  assert.equal(service.get("morelord-test").sections[0].title, "Purpose");
  assert.deepEqual(service.list().map(entry => entry.id), ["morelord-test"]);
});
