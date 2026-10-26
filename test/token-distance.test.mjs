import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  distanceSource,
  migrateTokenDistanceSetting,
  readLegacyClientTokenDistance,
  tokenDistance,
  tokenDistanceMigration,
  tokenDistanceWorldStored
} from '../scripts/ui/token-distance.js';

const KEY = 'morelord-core.tokenDistanceIndicator';

test('distance source respects GM selection, player ownership, and ambiguous characters', () => {
  const token = {controlled: false, isOwner: true, visible: true, actor: {id: 'character'}};
  const player = {isGM: false, character: token.actor};
  assert.equal(distanceSource(player, [token]), token);
  assert.equal(distanceSource({isGM: true}, [token]), null);
  assert.equal(distanceSource(player, [token, {...token}]), null);
  token.controlled = true;
  assert.equal(distanceSource({isGM: true}, [token]), token);
  assert.equal(distanceSource(player, [token]), token);
  token.isOwner = false;
  assert.equal(distanceSource(player, [token]), null);
  assert.equal(distanceSource({isGM: true}, [token, {...token}]), null);
});

test('measurement delegates to native grid and never reveals hidden or invisible targets', () => {
  const source = {visible: true, bounds: {x: 0, y: 0, width: 100, height: 100}, document: {}};
  const target = {visible: true, bounds: {x: 100, y: 0, width: 100, height: 100}, document: {}};
  const grid = {size: 100, measurePath(points) { assert.deepEqual(points, [{x:50,y:50}, {x:150,y:50}]); return {distance: 5}; }};
  assert.equal(tokenDistance(source, target, grid, {}), 5);
  assert.equal(tokenDistance(source, source, grid, {}), null);
  target.document.hidden = true;
  assert.equal(tokenDistance(source, target, grid, {}), null);
  assert.equal(tokenDistance(source, target, grid, {isGM: true}), 5);
  target.visible = false;
  assert.equal(tokenDistance(source, target, grid, {isGM: true}), null);
  assert.equal(tokenDistance(null, target, grid, {}), null);
});

test('Tiny through Gargantuan use nearest footprint spaces and round up to whole 5-unit steps', () => {
  const grid = {size:100, isGridless:true, measurePath: ([a,b]) => ({distance:Math.hypot(a.x-b.x,a.y-b.y)/20})};
  const token = (x, width) => ({visible:true, document:{}, bounds:{x,y:0,width:width*100,height:width*100}});
  for (const width of [0.5,1,2,3,4]) {
    const source = token(0,width), target = token(width*100,1);
    assert.equal(tokenDistance(source,target,grid,{}),5, `Adjacent size ${width}`);
    target.bounds.x += 100;
    assert.equal(tokenDistance(source,target,grid,{}),10, `One-square gap size ${width}`);
  }
  assert.equal(tokenDistance(token(0,2),token(500,3),grid,{}),20);
  assert.equal(tokenDistance(token(0,1),token(201,1),grid,{}),15);
  const square = {...grid,isGridless:false,getCenterPoint:({i,j})=>({x:j*100+50,y:i*100+50})};
  const source=token(0,2),target=token(200,1);
  source.document.getOccupiedGridSpaceOffsets=()=>[{i:0,j:0,k:9},{i:0,j:1,k:9}];
  target.document.getOccupiedGridSpaceOffsets=()=>[{i:0,j:2,k:0}];
  assert.equal(tokenDistance(source,target,square,{}),5);
});

function memoryStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    map,
    getItem: key => map.has(key) ? map.get(key) : null,
    removeItem: key => { map.delete(key); }
  };
}

function memorySettings({stored = false, getSetting} = {}) {
  const writes = [];
  const world = {
    values: () => stored ? [{key: KEY, value: false}] : [],
    ...(getSetting ? {getSetting} : stored ? {getSetting: () => ({key: KEY, value: false})} : {})
  };
  return {
    writes,
    storage: {get: scope => scope === 'world' ? world : null},
    set: async (namespace, key, value) => { writes.push({namespace, key, value}); }
  };
}

test('legacy client values are booleans from local storage, then the client backend', () => {
  const storage = memoryStorage({[KEY]: 'false'});
  assert.deepEqual(readLegacyClientTokenDistance(storage), {stored: true, value: false});
  storage.map.set(KEY, 'true');
  assert.deepEqual(readLegacyClientTokenDistance(storage), {stored: true, value: true});
  for (const raw of ['nope', '"nope"', '1', 'null']) {
    storage.map.set(KEY, raw);
    assert.deepEqual(readLegacyClientTokenDistance(storage), {stored: false}, raw);
  }
  storage.map.delete(KEY);
  assert.deepEqual(readLegacyClientTokenDistance(storage), {stored: false});
  assert.deepEqual(readLegacyClientTokenDistance(storage, storage), {stored: false});
  const backend = {getSetting: () => ({value: false})};
  assert.deepEqual(readLegacyClientTokenDistance(storage, backend), {stored: true, value: false});
  backend.getSetting = () => { throw new Error('unavailable'); };
  backend.getItem = () => 'true';
  assert.deepEqual(readLegacyClientTokenDistance(storage, backend), {stored: true, value: true});
});

test('a world value counts only when the setting document exists', () => {
  assert.equal(tokenDistanceWorldStored({}), false);
  assert.equal(tokenDistanceWorldStored(memorySettings()), false);
  assert.equal(tokenDistanceWorldStored(memorySettings({stored: true})), true);
  const scanned = memorySettings();
  scanned.storage.get = () => ({
    getSetting: () => { throw new Error('id is not the key'); },
    values: () => [{id: 'abc', key: KEY}]
  });
  assert.equal(tokenDistanceWorldStored(scanned), true);
  scanned.storage.get = () => ({values: () => []});
  assert.equal(tokenDistanceWorldStored(scanned), false);
});

test('the first GM records the old client choice, or on, and later clients leave a saved world value alone', () => {
  assert.deepEqual(tokenDistanceMigration({worldStored: false, legacy: {stored: true, value: false}, isGM: true}),
    {write: true, value: false, clearLegacy: true});
  assert.deepEqual(tokenDistanceMigration({worldStored: false, legacy: {stored: true, value: true}, isGM: true}),
    {write: true, value: true, clearLegacy: true});
  assert.deepEqual(tokenDistanceMigration({worldStored: false, legacy: {stored: false}, isGM: true}),
    {write: true, value: true, clearLegacy: false});
  assert.deepEqual(tokenDistanceMigration({worldStored: false, legacy: {stored: true, value: false}, isGM: false}),
    {write: false, clearLegacy: true});
  assert.deepEqual(tokenDistanceMigration({worldStored: true, legacy: {stored: true, value: false}, isGM: true}),
    {write: false, clearLegacy: true});
  assert.deepEqual(tokenDistanceMigration({worldStored: true, legacy: {stored: false}, isGM: false}),
    {write: false, clearLegacy: false});
});

test('migration writes the world setting once and drops the old client key', async () => {
  const storage = memoryStorage({[KEY]: 'false'});
  const settings = memorySettings();
  const off = await migrateTokenDistanceSetting(settings, {storage, isGM: true});
  assert.deepEqual(off, {write: true, value: false, clearLegacy: true});
  assert.deepEqual(settings.writes, [{namespace: 'morelord-core', key: 'tokenDistanceIndicator', value: false}]);
  assert.equal(storage.map.has(KEY), false);

  const on = memoryStorage({[KEY]: 'true'});
  const onSettings = memorySettings();
  await migrateTokenDistanceSetting(onSettings, {storage: on, isGM: true});
  assert.deepEqual(onSettings.writes, [{namespace: 'morelord-core', key: 'tokenDistanceIndicator', value: true}]);
  assert.equal(on.map.has(KEY), false);

  const fresh = memoryStorage();
  const freshSettings = memorySettings();
  const kept = await migrateTokenDistanceSetting(freshSettings, {storage: fresh, isGM: true});
  assert.deepEqual(kept, {write: true, value: true, clearLegacy: false});
  assert.equal(freshSettings.writes[0].value, true);

  const player = memoryStorage({[KEY]: 'false'});
  const playerSettings = memorySettings();
  await migrateTokenDistanceSetting(playerSettings, {storage: player, isGM: false});
  assert.deepEqual(playerSettings.writes, []);
  assert.equal(player.map.has(KEY), false);

  const saved = memoryStorage({[KEY]: 'false'});
  const savedSettings = memorySettings({stored: true});
  await migrateTokenDistanceSetting(savedSettings, {storage: saved, isGM: true});
  assert.deepEqual(savedSettings.writes, []);
  assert.equal(saved.map.has(KEY), false);

  const stuck = {
    getItem: () => 'false',
    removeItem() { throw new Error('locked'); }
  };
  const stuckSettings = memorySettings();
  const decision = await migrateTokenDistanceSetting(stuckSettings, {storage: stuck, clientBackend: stuck, isGM: true});
  assert.equal(decision.value, false);
  assert.deepEqual(stuckSettings.writes, [{namespace: 'morelord-core', key: 'tokenDistanceIndicator', value: false}]);
});

function scriptFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...scriptFiles(path));
    else if (entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}

test('Core settings are world-scoped, and Token Distance plus compendium organization are GM-only', () => {
  const clientScoped = scriptFiles('scripts').filter(file => /scope:\s*['"]client['"]/.test(readFileSync(file, 'utf8')));
  assert.deepEqual(clientScoped, []);
  const distance = readFileSync('scripts/ui/token-distance.js', 'utf8');
  assert.match(distance, /scope:\s*'world'/);
  assert.match(distance, /restricted:\s*true/);
  assert.match(distance, /game\.settings\.get\(MODULE_ID,\s*'tokenDistanceIndicator'\)/);
  const main = readFileSync('scripts/main.js', 'utf8');
  assert.match(main, /"compendiumOrganization",\s*\{scope:"world", config:false, type:Object, default:\{\}, restricted:true\}/);
});
