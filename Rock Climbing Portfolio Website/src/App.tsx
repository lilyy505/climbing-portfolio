import { useEffect, useState } from 'react';
import { BetaLog, Projects } from './PortfolioSections';
import { Climber } from './Climber';
import type { ClimbHold } from './climbPhysics';

type RouteId = 'about' | 'projects' | 'resume' | 'notes';
type IconName = 'arrow' | 'close' | 'mountain' | 'mail' | 'download' | 'plus' | 'expand';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'arrow' && <path d="M5 19 19 5M5 5h14v14" />}
    {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
    {name === 'mountain' && <><path d="m2 20 7-14 5 9 3-6 5 11H2Z" /><path d="m6.5 11 2.5 2 2.4-2.2" /></>}
    {name === 'mail' && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    {name === 'download' && <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>}
    {name === 'plus' && <path d="M12 5v14M5 12h14" />}
    {name === 'expand' && <path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/>}
  </svg>;
}

function ChalkHand() {
  return <img className="chalk-hand" src="/images/chalk-handprint.png" alt="" aria-hidden="true"/>;
}

function HeaderHold() {
  return <svg className="header-hold" viewBox="0 0 30 24" aria-hidden="true">
    <path d="M3 17 1.8 11Q2 5 8 3L21 2Q27 3 28 9L26 17Q23 22 16 22L7 21Z" fill="currentColor"/>
    <path d="m3 15 6 2 13-1 5-5-1 6q-3 5-10 5l-9-1Z" fill="#17251e" opacity=".22"/>
    <path d="M6 9q3-4 8-4l7 .5" fill="none" stroke="#fffdf4" strokeWidth="2.4" strokeLinecap="round" opacity=".4"/>
    <path d="m7 13 7-2 8 1" fill="none" stroke="#17251e" strokeWidth="1.1" strokeLinecap="round" opacity=".18"/>
    <circle cx="17" cy="15" r="1.7" fill="#28362b" opacity=".65"/>
    <circle cx="16.7" cy="14.5" r=".6" fill="#fffdf4" opacity=".55"/>
  </svg>;
}

const routes = [
  { id: 'about' as const, number: '01', name: 'About me', grade: 'V0', color: '#c46b4f', subtitle: 'The person behind the projects', x: 153, y: 95, path: 'M110 448 C210 388 89 343 145 285 S233 204 153 130', label: 'Start here' },
  { id: 'projects' as const, number: '02', name: 'My projects', grade: 'V4', color: '#6c7d51', subtitle: 'A few problems worth solving', x: 434, y: 57, path: 'M381 452 C300 383 492 360 403 290 S366 181 434 95', label: 'Deep dive' },
  { id: 'resume' as const, number: '03', name: 'Résumé', grade: 'V2', color: '#c79b3c', subtitle: 'Experience, skills & a little grit', x: 702, y: 107, path: 'M672 453 C581 378 752 366 681 299 S759 221 702 145', label: 'Track record' },
  { id: 'notes' as const, number: '04', name: 'Beta Log', grade: 'V3', color: '#6d8e9a', subtitle: 'Thoughts from the climb & LinkedIn', x: 982, y: 68, path: 'M1007 450 C1080 386 909 360 976 303 S1058 213 982 106', label: 'Always learning' },
];

const holds: Record<RouteId, [number, number, number, number][]> = {
  about: [[110,440,1.1,-20],[170,393,.7,30],[130,350,1,-30],[131,297,.85,10],[184,252,1.1,-20],[196,204,.75,70],[164,156,.8,20]],
  projects: [[381,445,.9,15],[360,396,.7,-30],[419,364,1,-40],[439,320,.8,15],[395,276,1.1,50],[385,221,.75,-20],[411,170,.95,-35],[434,115,.8,20]],
  resume: [[672,443,.9,-30],[643,392,.8,10],[700,354,1.05,-30],[701,309,.7,-20],[677,262,.85,30],[718,216,1.1,-30],[707,169,.7,10]],
  notes: [[1007,443,1,25],[1027,394,.75,-40],[974,358,1.05,30],[959,315,.7,-20],[1005,265,.9,50],[1020,218,.8,-20],[992,161,1,20],[982,120,.65,-15]],
};

const climbHolds: ClimbHold[] = routes.flatMap(route => holds[route.id].map(([x, y], index, list) => ({
  x, y, id: `${route.id}-${index}`, route: route.id, color: route.color, top: index === list.length - 1,
})));

function ClimbingWall({ onSelect, visited, sent, climbing, onClimb, onExit, onSend, paused }: {
  onSelect: (id: RouteId) => void; visited: Set<RouteId>; sent: Set<RouteId>;
  climbing: boolean; onClimb: () => void; onExit: () => void;
  onSend: (id: RouteId) => void; paused: boolean;
}) {
  const [hovered, setHovered] = useState<RouteId | null>(null);
  const [startRoute, setStartRoute] = useState<RouteId>('about');
  const [attempt, setAttempt] = useState(0);
  function start(id: RouteId) { setStartRoute(id); setAttempt(value => value + 1); }
  return <div className="wall-shell">
    <div className="wall-topline"><span><span className="tiny-cross">+</span> {climbing ? 'CLIMB MODE / THE PORTFOLIO WALL' : 'THE PORTFOLIO WALL'}</span>{climbing && <div className="climb-toolbar"><details className="climb-controls"><summary>Controls <span className="guide-icon">?</span></summary><div className="climb-tooltip"><strong>One move at a time.</strong><p>Drag a hand or foot onto a hold. A white ring means it’s within grabbing distance. Release to grip. Keep other limbs attached for support.</p><p>Match both hands on a ringed TOP hold to send a route. Click a route card to restart there.</p><p>Keyboard: Tab to a limb, use arrows to reach (Shift for smaller moves), then Enter to grip. On small screens, swipe the wall to pan.</p><span>Inspired by Klifur</span></div></details><button className="reset-climber" onClick={() => start(startRoute)}>Reset climber</button><button id="exit-climb-mode" className="climb-pill" onClick={onExit}>Exit Climb Mode <Icon name="close" size={13}/></button></div>}</div>
    <div className="wall-scroll">
      <div className="wall-canvas">
        <svg className="wall-art" viewBox="0 0 1160 490" role={climbing ? 'group' : 'img'} aria-label={climbing ? 'Interactive climbing wall. Drag hands and feet to climb.' : 'A climbing wall with four colorful routes. Choose a route using its labeled button.'}>
          <defs>
            <pattern id="bolts" width="57" height="53" patternUnits="userSpaceOnUse"><circle cx="29" cy="27" r="1.7" fill="#9d998a" opacity=".43"/><circle cx="28.6" cy="26.5" r=".5" fill="#f8f5e9" /></pattern>
            <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".63" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".095"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
            <filter id="hold-shadow" x="-70%" y="-70%" width="240%" height="260%"><feDropShadow dx="1" dy="3" stdDeviation="1.5" floodColor="#37362b" floodOpacity=".26" /></filter>
          </defs>
          <g filter="url(#grain)">
            <path d="M0 0H1160V490H0Z" fill="#e6e2d5"/>
            <path d="m0 0 365 0-91 203L0 271Z" fill="#eae6db"/>
            <path d="m365 0 367 0-25 242-433-39Z" fill="#dedbcf"/>
            <path d="m732 0 428 0v293l-453-51Z" fill="#e8e4d9"/>
            <path d="m0 271 274-68 182 287H0Z" fill="#e1ded2"/>
            <path d="m274 203 433 39 120 248H456Z" fill="#e9e5da"/>
            <path d="m707 242 453 51v197H827Z" fill="#dedbcf"/>
            <g stroke="#bcb8ab" strokeWidth="1" fill="none" opacity=".6"><path d="m365 0-91 203L0 271m274-68 433 39L732 0M274 203l182 287m251-248 120 248M707 242l453 51"/></g>
            <rect width="1160" height="490" fill="url(#bolts)" />
          </g>
          <g opacity=".45" stroke="#b8b4a7" fill="none" strokeWidth="1.5"><path d="m47 366 63-19-13-44-35 7Z"/><path d="m520 135 44 26-38 28-15-31Z"/><path d="m815 365 45-41 30 64Z"/><path d="m1100 110 28 24-34 17Z"/></g>
          {routes.map(route => <g key={route.id} style={{ opacity: hovered && hovered !== route.id ? .38 : 1, transition: 'opacity .25s' }}>
            <path d={route.path} fill="none" stroke={route.color} strokeWidth={hovered === route.id ? 2.5 : 1.5} strokeDasharray="3 7" opacity={hovered === route.id ? .7 : .35} />
            {holds[route.id].map(([x,y,scale,rotation], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} filter="url(#hold-shadow)">
              <path d={i % 3 === 0 ? 'M-17 3 Q-18-8-7-11L9-8Q18-6 17 2L10 10-5 11Z' : i % 3 === 1 ? 'M-11 5-8-8Q0-16 9-5L12 5 4 11Z' : 'M-18 1Q-9-10 7-7L18-2 14 7-8 9Z'} fill={route.color} />
              <path d={i % 3 === 0 ? 'M-17 3-6 6 8 5 17 2 10 10-5 11Z' : i % 3 === 1 ? 'M-11 5-3 6 6 2 10-2 12 5 4 11Z' : 'M-18 1-6 3 8 1 18-2 14 7-8 9Z'} fill="#17251e" opacity=".22"/>
              <path d="M-9-4Q-1-7 7-3" fill="none" stroke="#fffdf4" strokeOpacity=".4" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="m-7 1 6-2 8 1" fill="none" stroke="#17251e" strokeOpacity=".18" strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="1" cy="2" r="1.6" fill="#242a24" opacity=".6"/><circle cx="1" cy="1.6" r=".5" fill="white" opacity=".4"/>
            </g>)}
            <path d={`M${holds[route.id][0][0]-14} 467h28`} stroke={route.color} strokeWidth="4" />
          </g>)}
          <g transform="translate(1100 421)" stroke="#888b7a" strokeWidth="1" fill="none"><circle r="21" opacity=".45"/><path d="M0-14V14M-14 0h28m-28 0 4-3m-4 3 4 3M0-14l-3 4m3-4 3 4"/><text x="-3" y="-27" fontSize="8" stroke="none" fill="#777d6e" fontFamily="monospace">N</text></g>
          {climbing && <Climber key={`${startRoute}-${attempt}`} holds={climbHolds} startX={holds[startRoute][0][0]} paused={paused} onSend={id => { const completed = routes.find(route => route.id === id); if (completed) onSend(completed.id); }}/>}
        </svg>
        {routes.map(route => <button key={route.id} className={`route-pin ${hovered === route.id ? 'is-hovered' : ''}`} style={{ left: `${route.x/11.6}%`, top: `${route.y/4.9}%`, '--route-color': route.color } as React.CSSProperties} onMouseEnter={() => setHovered(route.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(route.id)} onBlur={() => setHovered(null)} onClick={() => climbing ? start(route.id) : onSelect(route.id)} aria-label={`${climbing ? 'Climb' : 'Explore'} ${route.name}, route ${route.grade}${sent.has(route.id) ? ', sent' : ''}`}>
          <span className="pin-eyebrow">{route.number} / {route.label}{visited.has(route.id) && <span className="sent-label">SENT</span>}</span>
          <span className="pin-name">{route.name}<Icon name="arrow" size={16}/></span>
          <span className="pin-bottom"><span className="color-dot"/>{route.grade}<span className="pin-description">{route.subtitle.split(' & ')[0]}</span></span>
          <span className="pin-tape"/>
          {sent.has(route.id) && <span className="route-sent-stamp">SENT</span>}
        </button>)}
      </div>
    </div>
    <div className="wall-bottomline"><div className="wall-bottom-left"><span className="wall-route-label"><span className="live-dot"/> 4 ROUTES · NO ROPES REQUIRED</span>{!climbing && <button className="climb-pill" onClick={onClimb}>Climb Mode <Icon name="expand" size={12}/></button>}</div><span className="wall-hint">{climbing ? 'Pick a card to start a route · Match both hands at the top' : 'Click a route to start exploring'} <span>↗</span></span><span className="route-count" aria-live="polite">{visited.size.toString().padStart(2,'0')} <span>/ 04 ROUTES EXPLORED</span></span></div>
  </div>;
}

function RouteContent({ id }: { id: RouteId | 'contact' }) {
  if (id === 'about') return <>
    <p className="dialog-lead">Curious by nature.<br/>A builder by choice.</p>
    <p>I’m Alex, a designer and developer who likes making complicated things feel simple. I’m happiest somewhere between a good idea, a messy first draft, and that moment when everything clicks.</p>
    <p>Climbing taught me how I like to work: stay curious, try a different angle, and don’t be afraid to fall a few times. I bring that same energy to everything I make.</p>
    <div className="fact-grid"><div><span>BASED IN</span><strong>Somewhere outdoors</strong></div><div><span>CURRENTLY INTO</span><strong>Thoughtful digital things</strong></div><div><span>OFF THE CLOCK</span><strong>Boulders & good coffee</strong></div><div><span>APPROACH</span><strong>One move at a time</strong></div></div>
    <div className="content-note">This is your starting point. Swap in your name, your story, and the things that make you, you.</div>
  </>;
  if (id === 'projects') return <Projects/>;
  if (id === 'resume') return <><p className="dialog-lead">The experience<br/>behind the ascent.</p><p>A little context on what I bring to the wall. Replace this sample experience with your own journey.</p><div className="timeline"><div><span>2023 — PRESENT</span><h3>Designer & developer</h3><p>Your company · Building thoughtful digital products from concept to launch.</p></div><div><span>2021 — 2023</span><h3>Digital designer</h3><p>Your previous team · Turning complex challenges into clear, useful experiences.</p></div><div><span>THE TOOLKIT</span><h3>Always adding new holds.</h3><p>Product design · React · TypeScript · Figma · Prototyping · Creative thinking</p></div></div><a className="primary-button" download="alex-sample-resume.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent('ALEX — SAMPLE RESUME\n\nReplace this sample with your own experience.\n\nDesigner & Developer | 2023–Present\nDigital Designer | 2021–2023\n\nSkills: Product design, React, TypeScript, Figma, Prototyping')}`}><Icon name="download" size={17}/> Download sample résumé</a></>;
  if (id === 'notes') return <BetaLog/>;
  return <><p className="dialog-lead">Good things start<br/>with a hello.</p><p>Have a project in mind, an interesting opportunity, or a favorite crag? I’d love to hear about it.</p><a className="contact-email" href="mailto:hello@yourname.com">hello@yourname.com <Icon name="arrow" size={25}/></a><div className="content-note">Make it yours: replace this sample email with your own address before sharing your portfolio.</div></>;
}

export default function App() {
  const [active, setActive] = useState<RouteId | 'contact' | null>(null);
  const [visited, setVisited] = useState<Set<RouteId>>(new Set());
  const [sent, setSent] = useState<Set<RouteId>>(new Set());
  const [climbMode, setClimbMode] = useState(false);
  const [guide, setGuide] = useState(false);
  const route = routes.find(r => r.id === active);
  function select(id: RouteId) { setActive(id); setVisited(previous => new Set([...previous, id])); }
  useEffect(() => {
    if (!active && !climbMode) return;
    const original = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = document.getElementById(active ? 'close-dialog' : 'exit-climb-mode');
    close?.focus();
    document.querySelector('.dialog-body')?.scrollTo(0, 0);
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (active) setActive(null); else setClimbMode(false); }
      if (event.key === 'Tab') {
        const scope = active ? '.route-dialog' : '.climb-overlay';
        const elements = [...document.querySelectorAll<HTMLElement>(`${scope} button, ${scope} a[href], ${scope} [tabindex="0"], ${scope} summary`)];
        const first = elements[0]; const last = elements[elements.length-1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handler); original?.focus(); };
  }, [active, climbMode]);

  return <div className="site">
    <header className="site-header">
      <a className="wordmark" href="#" aria-label="On the wall home"><span className="logo-icon"><Icon name="mountain" size={26}/></span>on the wall<span className="wordmark-period">.</span></a>
      <nav className="route-legend" aria-label="Portfolio routes"><div>{routes.map(r => <button key={r.id} onClick={() => select(r.id)} aria-label={`${r.name}${visited.has(r.id) ? ', explored' : ''}`}><span className={`header-route-marker ${visited.has(r.id) ? 'is-explored' : ''}`} style={{'--route-color':r.color} as React.CSSProperties}><HeaderHold/>{visited.has(r.id) && <ChalkHand/>}</span>{r.name}</button>)}</div></nav>
      <button className="contact-button" onClick={() => setActive('contact')}>Let’s connect <Icon name="arrow" size={16}/></button>
    </header>
    <main>
      <section className="intro">
        <div className="intro-title"><h1 className="portfolio-headline">A personal portfolio,<br/>with a little <em>altitude.</em></h1></div>
        <div className="intro-aside"><span className="availability"><span className="live-dot"/> BASED IN BERKELEY</span><p>Hey, I’m Alex. A creative thinker, builder,<br className="desktop-break"/> and climber. This is my little corner of the<br className="desktop-break"/> internet. Pick a route. See where it takes you.</p><button className="guide-toggle" onClick={() => setGuide(!guide)} aria-expanded={guide}><span className="guide-icon">?</span> First time on the wall? <span>{guide ? '−' : '+'}</span></button>{guide && <div className="guide-popover"><strong>No chalk bag needed.</strong><p>Each color is a different part of my portfolio. Click a route card to explore it. V0 is the easiest climb — a good place to start.</p><button onClick={() => { setGuide(false); select('about'); }}>Take the first hold <Icon name="arrow" size={14}/></button></div>}</div>
      </section>
      <section id="wall" className={climbMode ? 'climb-overlay' : undefined} role={climbMode ? 'dialog' : undefined} aria-modal={climbMode || undefined} aria-label={climbMode ? 'Climb Mode' : 'Explore the portfolio routes'}><ClimbingWall onSelect={select} visited={visited} sent={sent} climbing={climbMode} onClimb={() => setClimbMode(true)} onExit={() => setClimbMode(false)} paused={!!active} onSend={id => { setSent(previous => new Set([...previous, id])); select(id); }}/></section>
    </main>
    <footer><span>© {new Date().getFullYear()} Alex. Made with intention. And a little chalk.</span><span className="footer-center"><Icon name="mountain" size={17}/> ALWAYS A WORK IN PROGRESS</span><button onClick={() => setActive('contact')}>See you at the top <Icon name="arrow" size={14}/></button></footer>
    {active && <div className="dialog-overlay" onClick={() => setActive(null)}><section className={`route-dialog ${active === 'projects' || active === 'notes' ? 'route-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="dialog-heading" style={{'--route-color': route?.color || '#344638'} as React.CSSProperties} onClick={e => e.stopPropagation()}>
      <div className="dialog-header">
        <button className="wall-return" id="close-dialog" aria-label="Return to the wall" onClick={() => setActive(null)}><span aria-hidden="true">←</span> Wall</button>
        <div className="dialog-heading-group"><span className="eyebrow">{route ? `${route.number} / ${route.label.toUpperCase()}` : 'THE NEXT ADVENTURE'}</span><h2 id="dialog-heading">{route?.name || 'Let’s connect'}</h2></div>
        {route && <span className="grade-badge dialog-grade"><span className="color-dot"/>{route.grade}</span>}
      </div>
      <div className="dialog-body"><RouteContent key={active} id={active}/></div>
      <div className="dialog-footer"><span className="route-count">{visited.size.toString().padStart(2,'0')} <span>/ 04 ROUTES EXPLORED</span></span>{route && <button onClick={() => select(routes[(routes.indexOf(route)+1)%4].id)}>Next route <Icon name="arrow" size={15}/></button>}</div>
    </section></div>}
  </div>;
}
