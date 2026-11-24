import assert from 'node:assert/strict';
import test from 'node:test';
import { beginDrag, createClimber, distance, limitReach, matchedRoute, nearbyHold, releaseLimb, stepClimber } from '../src/climbPhysics.ts';

const hold = (x, y, extra = {}) => ({ x, y, id: 'about-0', route: 'about', color: '#c46b4f', top: false, ...extra });

test('gravity acts on the climber and the floor contains every joint', () => {
  const sim = createClimber(110);
  const start = sim.nodes.leftHip.y;
  for (let i = 0; i < 30; i++) stepClimber(sim);
  assert.ok(sim.nodes.leftHip.y > start);
  for (let i = 0; i < 1500; i++) stepClimber(sim);
  for (const point of Object.values(sim.nodes)) {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    assert.ok(point.y <= 475 && point.y >= 16);
    assert.ok(point.x >= 8 && point.x <= 1152);
  }
});

test('a snapped hand stays pinned and supports body weight under gravity', () => {
  const sim = createClimber(200);
  for (const node of Object.values(sim.nodes)) { node.y -= 180; node.py -= 180; }
  const anchor = hold(sim.nodes.leftHand.x, sim.nodes.leftHand.y);
  beginDrag(sim, 'leftHand');
  releaseLimb(sim, [anchor]);
  for (let i = 0; i < 1500; i++) stepClimber(sim);
  assert.equal(sim.nodes.leftHand.x, anchor.x);
  assert.equal(sim.nodes.leftHand.y, anchor.y);
  assert.ok(sim.nodes.leftHip.y > anchor.y);
  assert.ok(distance(sim.nodes.leftShoulder, sim.nodes.leftHand) <= 72.5);
});

test('dragging is reach-limited and cannot teleport across the wall', () => {
  const sim = createClimber(110);
  const target = limitReach(sim, 'leftHand', { x: 1100, y: 10 });
  assert.ok(distance(target, sim.nodes.leftShoulder) <= 71.01);
  beginDrag(sim, 'leftHand');
  sim.drag.target = { x: 1100, y: 10 };
  stepClimber(sim);
  assert.ok(sim.nodes.leftHand.x < 250);
  assert.equal(nearbyHold(sim, [hold(1100, 10)]), undefined);
});

test('repeated dragging cannot ratchet past the total reach of an attached hand', () => {
  const sim = createClimber(110);
  const anchor = hold(sim.nodes.rightHand.x, sim.nodes.rightHand.y);
  sim.anchors.rightHand = anchor;
  beginDrag(sim, 'leftHand');
  for (let i = 0; i < 1000; i++) {
    sim.drag.target = { x: 1100, y: 20 };
    stepClimber(sim);
  }
  assert.ok(distance(sim.nodes.leftHand, anchor) <= 170);
  assert.equal(sim.nodes.rightHand.x, anchor.x);
  assert.equal(sim.nodes.rightHand.y, anchor.y);
});

test('nearby holds snap; distant holds do not; cancelled drags restore the prior grip', () => {
  const sim = createClimber(110);
  const anchor = hold(sim.nodes.leftHand.x + 5, sim.nodes.leftHand.y);
  beginDrag(sim, 'leftHand');
  releaseLimb(sim, [anchor]);
  assert.equal(sim.anchors.leftHand, anchor);
  beginDrag(sim, 'leftHand');
  assert.equal(sim.anchors.leftHand, undefined);
  releaseLimb(sim, [], true);
  assert.equal(sim.anchors.leftHand, anchor);
  beginDrag(sim, 'leftHand');
  releaseLimb(sim, [hold(1000, 20)]);
  assert.equal(sim.anchors.leftHand, undefined);
});

test('a send requires BOTH hands on the SAME top hold, for all four routes', () => {
  for (const route of ['about', 'projects', 'resume', 'notes']) {
    const sim = createClimber(110);
    const top = hold(150, 100, { id: `${route}-top`, route, top: true });
    sim.anchors.leftHand = top;
    sim.anchors.rightFoot = top;
    assert.equal(matchedRoute(sim), undefined);
    sim.anchors.rightHand = { ...top, id: 'other-top' };
    assert.equal(matchedRoute(sim), undefined);
    sim.anchors.rightHand = top;
    assert.equal(matchedRoute(sim), route);
    sim.anchors.leftHand = sim.anchors.rightHand = { ...top, top: false };
    assert.equal(matchedRoute(sim), undefined);
  }
});
