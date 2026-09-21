import { test } from "node:test";
import assert from "node:assert/strict";
import { TelemetryService, errorDetails } from "../scripts/services/telemetry-service.js";

function fixture() {
  const settings = { telemetryConsentVersion: 0, shareUsageStatistics: true, shareErrorReports: false, developerMode: false, telemetryCredentials: { origin: "https://morelordgaming.com", world: crypto.randomUUID(), token: "mlt_" + "a".repeat(64) }, serverUrl: "https://morelordgaming.com" };
  const requests = [];
  const game = { settings: { get: (_module, key) => settings[key], set: async (_module,key,value) => { settings[key]=value; } }, modules: new Map([["morelord-core", { active:true, version:"0.3.9" }]]), version:"14.368", system:{ id:"dnd5e", version:"6.0.3" }, user:{ isGM:true } };
  const service = new TelemetryService({ game: () => game, fetch: async (url, options) => { requests.push({ url, options }); return { ok:true }; } });
  return { settings, requests, service };
}

test("old consent sends nothing; explicit consent uses only a reporting credential", async () => {
  const { service, settings, requests } = fixture();
  service.track("morelord-core", "dashboard.opened");
  await service.flush();
  assert.equal(requests.length, 0);
  settings.telemetryConsentVersion = 1;
  service.track("morelord-core", "dashboard.opened");
  await service.flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.credentials, "omit");
  assert.deepEqual(Object.keys(requests[0].options.headers), ["content-type", "authorization"]);
  assert.equal(requests[0].options.headers.authorization, `Bearer ${settings.telemetryCredentials.token}`);
  assert.equal(JSON.parse(requests[0].options.body).events[0].event, "dashboard.opened");
});

test("errors exclude messages, hosts and arguments; error-only reporting has no breadcrumbs", () => {
  const { service, settings } = fixture();
  settings.telemetryConsentVersion = 1; settings.shareUsageStatistics = false; settings.shareErrorReports = true;
  const error = new TypeError("Secret character and token");
  error.stack = "TypeError: secret\n at method (https://private.example/modules/morelord-core/scripts/main.js:20:4)\n at Other (https://private.example/worlds/secret.js:1:1)";
  assert.deepEqual(errorDetails(error), { type:"TypeError", frames:["morelord-core/scripts/main.js:20:4"] });
  service.error("morelord-core", "test", error);
  service.error("morelord-core", "test", error);
  assert.equal(service.queue.length, 1);
  assert.deepEqual(service.queue[0].recent, []);
  assert.doesNotMatch(JSON.stringify(service.queue), /secret|private|token/i);
});

test("retry uses identical event IDs and opt-out discards unsent reports", async () => {
  const { service, settings, requests } = fixture();
  settings.telemetryConsentVersion = 1;
  let succeed = false;
  service.fetch = async (_url, options) => { requests.push(options.body); return { ok:succeed, status:503 }; };
  service.track("morelord-core", "test"); await service.flush();
  succeed = true; await service.flush();
  assert.equal(requests[0], requests[1]);
  service.track("morelord-core", "test"); settings.shareUsageStatistics = false; service.reset();
  await service.flush(); assert.equal(requests.length, 2); assert.equal(service.queue.length, 0);
});

test("observer preserves this, arguments, result and original errors", async () => {
  const { service, settings } = fixture(); settings.telemetryConsentVersion = 1; settings.shareErrorReports = true;
  const failure = new Error("private");
  const target = { value:7, async run(n) { if (n < 0) throw failure; return this.value+n; } };
  service.observe("morelord-core", target, { run:"example" });
  assert.equal(await target.run(2), 9);
  await assert.rejects(target.run(-1), error => error === failure);
  assert.deepEqual(service.queue.map(event => event.event), ["example.attempted","example.returned","example.attempted","example.failed","example"]);
});

test("developer mode, invalid codes and bounded queues", () => {
  const { service, settings } = fixture(); settings.telemetryConsentVersion=1; settings.developerMode=true;
  service.track("morelord-core", "test"); assert.equal(service.queue.length, 0);
  settings.developerMode=false;
  service.track("morelord-campaign-manager", "test"); service.track("morelord-core", "Secret campaign text");
  assert.equal(service.queue.length, 0);
  for (let i=0;i<200;i++) service.track("morelord-core", "test");
  assert.equal(service.queue.length, 100);
});

test("ignored users never queue reports even after explicit consent", () => {
  const { service, settings } = fixture(); settings.telemetryConsentVersion=1; settings.shareErrorReports=true;
  const previous = globalThis.MorelordCore;
  globalThis.MorelordCore = { users: { isIgnored: () => true } };
  try {
    service.track("morelord-core", "test"); service.error("morelord-core", "test", new Error("private"));
    assert.equal(service.queue.length, 0);
  } finally { globalThis.MorelordCore = previous; }
});

test("revocation aborts an in-flight request and an old response cannot clear newly queued events", async () => {
  const { service, settings } = fixture(); settings.telemetryConsentVersion=1;
  let finish; let signal;
  service.fetch = (_url, options) => { signal=options.signal; return new Promise(resolve => { finish=resolve; }); };
  service.track("morelord-core", "before"); const request = service.flush();
  service.reset(); assert.equal(signal.aborted, true);
  service.track("morelord-core", "after"); finish({ok:true}); await request;
  assert.equal(service.queue[0].event, "after"); assert.equal(service.pending, null);
});

test("enrollment is consent-gated and credentials cannot be sent to another origin", async () => {
  const { service, settings, requests } = fixture(); settings.telemetryCredentials={};
  const identity={world:crypto.randomUUID(),token:"mlt_"+"b".repeat(64)};
  service.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>identity};};
  await service.register(); assert.equal(requests.length,0);
  settings.telemetryConsentVersion=1; await service.register();
  assert.equal(requests[0].url,"https://morelordgaming.com/api/foundry/telemetry/register");
  assert.equal(requests[0].options.headers,undefined);
  assert.equal(settings.telemetryCredentials.token,identity.token);
  settings.serverUrl="https://different.example";
  service.track("morelord-core","test");await service.flush();
  assert.equal(requests.length,1);
});

test("rejected credentials stop sending without silently re-registering", async () => {
  const {service,settings,requests}=fixture();settings.telemetryConsentVersion=1;
  service.fetch=async(url)=>{requests.push(url);return {ok:false,status:401};};
  service.track("morelord-core","test");await service.flush();
  service.track("morelord-core","test");await service.flush();await service.register();
  assert.equal(requests.length,1);
});
