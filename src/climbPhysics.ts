export type Limb = 'leftHand' | 'rightHand' | 'leftFoot' | 'rightFoot';
export type Vec = { x: number; y: number };
export type ClimbHold = Vec & { id: string; route: string; color: string; top: boolean };
type Node = Vec & { px: number; py: number };
type Joint = Limb | 'leftShoulder' | 'rightShoulder' | 'leftHip' | 'rightHip' | 'leftElbow' | 'rightElbow' | 'leftKnee' | 'rightKnee';
type Constraint = [Joint, Joint, number];
export type Climber = {
  nodes: Record<Joint, Node>;
  anchors: Partial<Record<Limb, ClimbHold>>;
  drag: { limb: Limb; target: Vec; previous?: ClimbHold } | null;
};

export const limbs: Limb[] = ['leftHand', 'rightHand', 'leftFoot', 'rightFoot'];
const chains: Record<Limb, [Joint, Joint, number, number]> = {
  leftHand: ['leftShoulder', 'leftElbow', 35, 37],
  rightHand: ['rightShoulder', 'rightElbow', 35, 37],
  leftFoot: ['leftHip', 'leftKnee', 36, 38],
  rightFoot: ['rightHip', 'rightKnee', 36, 38],
};
const constraints: Constraint[] = [
  ['leftShoulder', 'rightShoulder', 26], ['leftHip', 'rightHip', 20],
  ['leftShoulder', 'leftHip', 39], ['rightShoulder', 'rightHip', 39],
  ['leftShoulder', 'rightHip', 45], ['rightShoulder', 'leftHip', 45],
  ...limbs.flatMap<Constraint>(limb => {
    const [root, middle, upper, lower] = chains[limb];
    return [[root, middle, upper], [middle, limb, lower]];
  }),
];
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);
function betweenLimbs(first: Limb, second: Limb) {
  const sameKind = first.endsWith('Hand') === second.endsWith('Hand');
  const sameSide = first.startsWith('left') === second.startsWith('left');
  const torso = sameKind ? first.endsWith('Hand') ? 26 : 20 : sameSide ? 39 : 45;
  return chains[first][2] + chains[first][3] + torso + chains[second][2] + chains[second][3];
}

export function createClimber(x: number): Climber {
  const positions: Record<Joint, [number, number]> = {
    leftShoulder: [x - 13, 354], rightShoulder: [x + 13, 354],
    leftHip: [x - 10, 393], rightHip: [x + 10, 393],
    leftElbow: [x - 42, 374], rightElbow: [x + 42, 374],
    leftHand: [x - 28, 408], rightHand: [x + 28, 408],
    leftKnee: [x - 27, 425], rightKnee: [x + 27, 425],
    leftFoot: [x - 30, 462], rightFoot: [x + 30, 462],
  };
  return {
    nodes: Object.fromEntries(Object.entries(positions).map(([id, [nx, ny]]) => [id, { x: nx, y: ny, px: nx, py: ny }])) as Record<Joint, Node>,
    anchors: {}, drag: null,
  };
}

export function limitReach(sim: Climber, limb: Limb, target: Vec): Vec {
  const [root, , upper, lower] = chains[limb];
  const origin = sim.nodes[root];
  const length = distance(origin, target);
  const ratio = Math.min(1, (upper + lower - 1) / (length || 1));
  const result = {
    x: Math.max(8, Math.min(1152, origin.x + (target.x - origin.x) * ratio)),
    y: Math.max(8, Math.min(475, origin.y + (target.y - origin.y) * ratio)),
  };
  // A moving shoulder must not let the mouse ratchet past a load-bearing limb's total reach.
  for (let iteration = 0; iteration < 8; iteration++) {
    for (const other of limbs) {
      const anchor = sim.anchors[other];
      if (!anchor || other === limb) continue;
      const length = distance(anchor, result);
      const reach = betweenLimbs(limb, other) - 1;
      if (length > reach) {
        result.x = anchor.x + (result.x - anchor.x) * reach / length;
        result.y = anchor.y + (result.y - anchor.y) * reach / length;
      }
    }
  }
  return result;
}

export function beginDrag(sim: Climber, limb: Limb) {
  sim.drag = { limb, target: { ...sim.nodes[limb] }, previous: sim.anchors[limb] };
  delete sim.anchors[limb];
}

export function nearbyHold(sim: Climber, holds: ClimbHold[]): ClimbHold | undefined {
  if (!sim.drag) return;
  const { limb } = sim.drag;
  const [root, , upper, lower] = chains[limb];
  return holds.filter(hold => distance(sim.nodes[limb], hold) < 20 && distance(sim.nodes[root], hold) <= upper + lower)
    .sort((a, b) => distance(sim.nodes[limb], a) - distance(sim.nodes[limb], b))[0];
}

export function releaseLimb(sim: Climber, holds: ClimbHold[], cancel = false) {
  if (!sim.drag) return;
  const { limb, previous } = sim.drag;
  const hold = cancel ? previous : nearbyHold(sim, holds);
  if (hold) {
    sim.anchors[limb] = hold;
    Object.assign(sim.nodes[limb], { x: hold.x, y: hold.y, px: hold.x, py: hold.y });
  } else {
    const point = sim.nodes[limb];
    point.px = point.x; point.py = point.y;
  }
  sim.drag = null;
}

export function matchedRoute(sim: Climber): string | undefined {
  const left = sim.anchors.leftHand; const right = sim.anchors.rightHand;
  if (left?.top && right?.id === left.id) return left.route;
}

// Fixed 120 Hz Verlet integration; repeated distance constraints make attached limbs load-bearing.
export function stepClimber(sim: Climber) {
  const fixed = (id: Joint) => id === sim.drag?.limb || !!sim.anchors[id as Limb];
  const pin = () => {
    for (const limb of limbs) {
      const anchor = sim.anchors[limb];
      const target = sim.drag?.limb === limb ? sim.drag.target : anchor;
      if (target) Object.assign(sim.nodes[limb], { x: target.x, y: target.y, px: target.x, py: target.y });
    }
  };
  if (sim.drag) sim.drag.target = limitReach(sim, sim.drag.limb, sim.drag.target);
  for (const [id, point] of Object.entries(sim.nodes)) {
    if (fixed(id as Joint)) continue;
    const vx = (point.x - point.px) * .975; const vy = (point.y - point.py) * .975;
    point.px = point.x; point.py = point.y;
    point.x += vx; point.y += vy + .075;
  }
  for (let iteration = 0; iteration < 24; iteration++) {
    pin();
    for (const [a, b, length] of constraints) {
      const first = sim.nodes[a]; const second = sim.nodes[b];
      const dx = second.x - first.x; const dy = second.y - first.y;
      const actual = Math.hypot(dx, dy) || .001;
      const firstWeight = fixed(a) ? 0 : 1; const secondWeight = fixed(b) ? 0 : 1;
      const total = firstWeight + secondWeight;
      if (!total) continue;
      const correction = (actual - length) / actual / total;
      first.x += dx * correction * firstWeight; first.y += dy * correction * firstWeight;
      second.x -= dx * correction * secondWeight; second.y -= dy * correction * secondWeight;
    }
    for (const [id, point] of Object.entries(sim.nodes)) {
      if (fixed(id as Joint)) continue;
      point.x = Math.max(8, Math.min(1152, point.x));
      if (point.y > 475) { point.y = 475; point.py = 475; point.px += (point.x - point.px) * .3; }
      point.y = Math.max(16, point.y);
    }
  }
  pin();
}
