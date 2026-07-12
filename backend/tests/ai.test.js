// Unit tests for AI controller (no DB / server needed).
const test = require("node:test");
const assert = require("node:assert");
const aiController = require("../src/controllers/ai.controller");

// Mock Express response
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

async function run(handler, body) {
  const req = { body };
  const res = mockRes();
  await handler(req, res);
  return res;
}

test("AI controller", async () => {
  let res = await run(aiController.dashboard, {});
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);

  res = await run(aiController.maintenance, { issue: "leak" });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.available, false);
  assert.ok(res.body.data.error);

  res = await run(aiController.description, { asset_name: "Laptop" });
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.available, false);

  res = await run(aiController.chat, {});
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.available, false);
});
