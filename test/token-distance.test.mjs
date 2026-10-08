import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceSource, tokenDistance } from '../scripts/ui/token-distance.js';

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
