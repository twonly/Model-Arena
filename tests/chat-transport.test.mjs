import assert from "node:assert/strict";
import test from "node:test";

import {
  createWorkerTicket,
  hashChatBody,
  verifyWorkerTicket,
  workerChatUrl,
} from "../lib/chat-ticket.ts";

test("worker chat url appends /chat once", () => {
  assert.equal(workerChatUrl("https://example.workers.dev"), "https://example.workers.dev/chat");
  assert.equal(workerChatUrl("https://example.workers.dev/chat"), "https://example.workers.dev/chat");
  assert.equal(workerChatUrl("https://example.workers.dev/"), "https://example.workers.dev/chat");
});

test("worker tickets bind to the exact request body and expiry", () => {
  const secret = "unit-test-secret";
  const body = { shared: true, sharedId: "glm-5-2", runId: "r1", clientId: "c1" };
  const signed = createWorkerTicket(body, { uid: "u1", ip: "1.2.3.4" }, secret, 1000);
  assert.ok(signed);

  const ok = verifyWorkerTicket(signed.ticket, body, secret, 2000);
  assert.equal(ok.ok, true);
  assert.equal(ok.ok && ok.claims.bodyHash, hashChatBody(body));
  assert.equal(ok.ok && ok.claims.uid, "u1");

  const changed = verifyWorkerTicket(
    signed.ticket,
    { ...body, sharedId: "glm-5-1" },
    secret,
    2000
  );
  assert.equal(changed.ok, false);

  const expired = verifyWorkerTicket(signed.ticket, body, secret, 31 * 60 * 1000);
  assert.equal(expired.ok, false);
});
