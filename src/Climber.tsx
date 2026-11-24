import { useEffect, useRef, useState } from 'react';
import { beginDrag, createClimber, limbs, limitReach, matchedRoute, nearbyHold, releaseLimb, stepClimber, type ClimbHold, type Limb } from './climbPhysics';

const limbLabels: Record<Limb, string> = { leftHand: 'Left hand', rightHand: 'Right hand', leftFoot: 'Left foot', rightFoot: 'Right foot' };

export function Climber({ holds, startX, paused, onSend }: { holds: ClimbHold[]; startX: number; paused: boolean; onSend: (route: string) => void }) {
  const sim = useRef(createClimber(startX));
  const group = useRef<SVGGElement>(null);
  const pointer = useRef<number | null>(null);
  const completed = useRef(new Set<string>());
  const callback = useRef(onSend);
  callback.current = onSend;
  const [, redraw] = useState(0);
  useEffect(() => {
    if (paused) return;
    let frame = 0; let last = 0; let accumulator = 0;
    const tick = (now: number) => {
      accumulator += Math.min((now - (last || now)) / 1000, .05); last = now;
      while (accumulator >= 1 / 120) { stepClimber(sim.current); accumulator -= 1 / 120; }
      redraw(value => value + 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  function move(clientX: number, clientY: number) {
    const svg = group.current?.ownerSVGElement; const matrix = svg?.getScreenCTM();
    if (!svg || !matrix || !sim.current.drag) return;
    const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
    sim.current.drag.target = limitReach(sim.current, sim.current.drag.limb, point);
  }
  function finish(cancel = false) {
    releaseLimb(sim.current, holds, cancel);
    pointer.current = null;
    const route = matchedRoute(sim.current);
    if (route && !completed.current.has(route)) {
      completed.current.add(route);
      callback.current(route);
    }
    redraw(value => value + 1);
  }
  const { nodes, anchors, drag } = sim.current;
  const candidate = nearbyHold(sim.current, holds);
  const torso = [nodes.leftShoulder, nodes.rightShoulder, nodes.rightHip, nodes.leftHip];
  const headX = (nodes.leftShoulder.x + nodes.rightShoulder.x) / 2;
  const headY = (nodes.leftShoulder.y + nodes.rightShoulder.y) / 2 - 14;
  return <g ref={group} className="climber">
    {holds.filter(hold => hold.top).map(hold => <g key={hold.id} pointerEvents="none"><circle cx={hold.x} cy={hold.y} r="18" fill="none" stroke={hold.color} strokeWidth="1.3" strokeDasharray="3 4" opacity=".7"/><text x={hold.x + 24} y={hold.y + 3} fill={hold.color} fontFamily="monospace" fontSize="7" letterSpacing=".8">TOP</text></g>)}
    {candidate && <circle cx={candidate.x} cy={candidate.y} r="21" fill="#fffdf430" stroke="#fffdf4" strokeWidth="2" pointerEvents="none"/>}
    {limbs.map(limb => {
      const arm = limb.endsWith('Hand'); const left = limb.startsWith('left');
      const root = nodes[arm ? left ? 'leftShoulder' : 'rightShoulder' : left ? 'leftHip' : 'rightHip'];
      const joint = nodes[arm ? left ? 'leftElbow' : 'rightElbow' : left ? 'leftKnee' : 'rightKnee'];
      const tip = nodes[limb];
      return <polyline key={limb} points={`${root.x},${root.y} ${joint.x},${joint.y} ${tip.x},${tip.y}`} fill="none" stroke={arm ? '#f2d2ad' : '#3c5044'} strokeWidth={arm ? 6 : 8} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/>;
    })}
    <polygon points={torso.map(p => `${p.x},${p.y}`).join(' ')} fill="#bd684d" stroke="#8d4d39" strokeWidth="1.5" pointerEvents="none"/>
    <path d={`M${nodes.leftHip.x} ${nodes.leftHip.y-5}L${nodes.rightHip.x} ${nodes.rightHip.y-5}`} stroke="#e8be91" strokeWidth="3" pointerEvents="none"/>
    <circle cx={headX} cy={headY} r="9" fill="#f2d2ad" stroke="#755f46" strokeWidth="1" pointerEvents="none"/>
    <path d={`M${headX-9} ${headY-1}Q${headX-9} ${headY-13} ${headX+5} ${headY-9}L${headX+9} ${headY-2}Z`} fill="#344638" pointerEvents="none"/>
    {limbs.map(limb => <g key={limb}>
      <circle cx={nodes[limb].x} cy={nodes[limb].y} r="7" fill={limb.endsWith('Hand') ? '#fffdf0' : '#344638'} stroke={anchors[limb] ? '#6b8453' : '#fffdf0'} strokeWidth={anchors[limb] ? 3 : 1.5} pointerEvents="none"/>
      <circle className={`limb-grip ${drag?.limb === limb ? 'is-dragging' : ''}`} cx={nodes[limb].x} cy={nodes[limb].y} r="14" fill="transparent" stroke={drag?.limb === limb ? '#fffdf0' : 'transparent'} strokeWidth="1.5" strokeDasharray="3 3" tabIndex={0} role="button" aria-label={`${limbLabels[limb]}${anchors[limb] ? ', attached' : ''}. Drag to a hold, or use arrow keys and Enter.`}
        onPointerDown={event => {
          if (paused || pointer.current !== null || event.button !== 0) return;
          event.preventDefault(); event.stopPropagation();
          event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = event.pointerId; beginDrag(sim.current, limb);
          move(event.clientX, event.clientY);
        }}
        onPointerMove={event => { if (pointer.current === event.pointerId) move(event.clientX, event.clientY); }}
        onPointerUp={event => { if (pointer.current === event.pointerId) finish(); }}
        onPointerCancel={() => finish(true)}
        onLostPointerCapture={() => { if (pointer.current !== null) finish(true); }}
        onKeyDown={event => {
          if (paused || pointer.current !== null) return;
          if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) {
            event.preventDefault();
            if (sim.current.drag?.limb !== limb) beginDrag(sim.current, limb);
            const point = sim.current.drag!.target; const step = event.shiftKey ? 2 : 8;
            sim.current.drag!.target = limitReach(sim.current, limb, { x: point.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), y: point.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0) });
          } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (sim.current.drag) finish(); else beginDrag(sim.current, limb);
          }
        }}
        onBlur={() => { if (sim.current.drag?.limb === limb && pointer.current === null) finish(); }}
      />
    </g>)}
    <text x="580" y="483" textAnchor="middle" fontFamily="monospace" fontSize="7" letterSpacing=".6" fill="#6c7560" pointerEvents="none">{drag ? candidate ? 'RELEASE TO GRAB' : 'REACH FOR A HOLD · KEEP OTHER LIMBS ATTACHED' : 'DRAG A HAND OR FOOT · MATCH BOTH HANDS ON A TOP HOLD'}</text>
  </g>;
}
