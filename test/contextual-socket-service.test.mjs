import test from "node:test";
import assert from "node:assert/strict";
import { createSocketMessageId } from "../scripts/services/contextual-socket-service.js";

test("socket message IDs use Foundry's generator when randomUUID is unavailable", () => {
  let requestedLength = null;
  const id = createSocketMessageId({ randomID: length => { requestedLength = length; return "foundry-message-id"; } });
  assert.equal(id, "foundry-message-id");
  assert.equal(requestedLength, 24);
});
