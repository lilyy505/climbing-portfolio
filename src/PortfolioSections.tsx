import { useState } from 'react';

function ExternalLink({ href, children }: { href?: string; children: React.ReactNode }) {
  return <a className="subtle-link" href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} aria-disabled={!href} title={href ? undefined : 'Sample content — add your URL to connect this link'}>{children} <span aria-hidden="true">↗</span></a>;
}

const projects: { title: string; category: string; crux: string; stack: string[]; preview: string; live?: string; source?: string }[] = [
  { title: 'Crag Atlas', category: '01 / MAPPING & DISCOVERY', crux: 'Making thousands of climbing routes feel easy to explore. A spatial index and viewport-based loading keep the map fast without losing the details.', stack: ['React', 'TypeScript', 'Mapbox', 'PostgreSQL'], preview: 'atlas' },
  { title: 'QueueKit', category: '02 / DEVELOPER TOOLS', crux: 'Keeping background jobs reliable when everything else isn’t. Idempotent workers, retry backoff, and a live queue view make failures visible and recoverable.', stack: ['Node.js', 'Redis', 'Docker', 'WebSocket'], preview: 'queue' },
  { title: 'Trace', category: '03 / DATA & OBSERVABILITY', crux: 'Finding the signal in noisy application logs. Streaming aggregation turns high-volume events into a readable, real-time picture of system health.', stack: ['Next.js', 'TypeScript', 'ClickHouse'], preview: 'trace' },
  { title: 'On the wall', category: '04 / CREATIVE ENGINEERING', crux: 'Turning a portfolio into a small exploration. SVG routes, accessible dialogs, and responsive layouts bring the climbing metaphor to life without getting in the way.', stack: ['React', 'SVG', 'CSS', 'Vite'], preview: 'wall' },
];

function ProjectPreview({ kind }: { kind: string }) {
  return <div className={`project-preview preview-${kind}`} aria-hidden="true">
    <div className="preview-window">
      <div className="preview-toolbar"><span>● ● ●</span><span>{kind === 'atlas' ? 'crag atlas / explore' : kind === 'queue' ? 'queuekit / overview' : kind === 'trace' ? 'trace / live metrics' : 'on the wall / pick a route'}</span><span>↗</span></div>
      {kind === 'atlas' ? <div className="atlas-scene"><div className="mini-sidebar"><b>Find your next climb.</b><i/><i/><i/><span>24 routes nearby</span></div><svg viewBox="0 0 260 150"><g fill="none" stroke="#a1af94" strokeWidth=".8">{[0,1,2,3,4,5].map(i => <path key={i} d={`M${20+i*7} 150C${-45+i*13} 66 ${148+i*8} 131 ${100+i*18} 0M${130+i*10} 150Q${250-i*13} 55 260 ${25+i*7}`}/>)}</g><path d="M70 110Q167 118 155 48" stroke="#bc684c" strokeWidth="2" strokeDasharray="3 3" fill="none"/>{[[70,110],[155,48],[199,80]].map(([x,y]) => <g key={x}><circle cx={x} cy={y} r="8" fill="#faf9ee"/><circle cx={x} cy={y} r="4" fill="#bc684c"/></g>)}</svg></div>
      : kind === 'queue' ? <div className="queue-scene"><div className="mini-metrics"><span>PROCESSED<b>24,891</b></span><span>ACTIVE<b>12</b></span><span>SUCCESS RATE<b>99.98<span>%</span></b></span></div>{['send.welcome.email', 'process.image.upload', 'sync.route.data'].map((job,i) => <div className="mini-job" key={job}><span className="mini-job-dot"/><code>{job}</code><span>{i === 1 ? 'running' : 'complete'}</span><span>{24+i*17} ms</span></div>)}</div>
      : kind === 'trace' ? <div className="trace-scene"><div className="trace-head"><span><span className="live-dot"/> ALL SYSTEMS HEALTHY</span><b>142<span> ms</span></b></div><svg viewBox="0 0 360 90"><g stroke="#ffffff10">{[20,45,70].map(y => <path key={y} d={`M0 ${y}H360`}/>)}</g><path d="M0 70 18 65 35 69 54 44 70 52 88 48 105 58 122 41 140 47 158 23 175 40 192 37 210 49 227 22 246 31 262 16 280 29 298 18 316 25 336 11 360 17" fill="none" stroke="#afc99b" strokeWidth="2"/></svg><span className="trace-caption">RESPONSE TIME / LAST 24 HOURS</span></div>
      : <div className="mini-wall"><span>Every route.<br/><em>A different story.</em></span><svg viewBox="0 0 300 100">{['#c46b4f','#6c7d51','#c79b3c','#6d8e9a'].map((color,i) => <g key={color} transform={`translate(${i*70+30} 0)`}><path d="M0 90Q40 55 10 10" stroke={color} fill="none" strokeDasharray="2 4"/>{[20,45,70,90].map((y,j) => <rect key={y} x={j%2 ? 4 : 13} y={y-5} width="11" height="7" rx="3" fill={color} transform={`rotate(-20 10 ${y})`}/>)}</g>)}</svg></div>}
    </div>
  </div>;
}

export function Projects() {
  return <>
    <div className="section-intro"><div><span className="eyebrow">SELECTED WORK / ROUTE TOPO</span><p className="dialog-lead">Different problems.<br/>Same determination.</p></div><p>A few technical climbs, from first attempt to final send. Sample projects below — ready for your own work and links.</p></div>
    <div className="topo-grid">{projects.map(project => <article className="topo-card" key={project.title}>
      <ProjectPreview kind={project.preview}/>
      <div className="topo-card-body"><span className="eyebrow">{project.category}</span><h3>{project.title}</h3><h4>THE CRUX</h4><p>{project.crux}</p><ul className="stack-pills" aria-label={`${project.title} tech stack`}>{project.stack.map(tech => <li key={tech}>{tech}</li>)}</ul><div className="project-links"><ExternalLink href={project.live}>Live</ExternalLink><ExternalLink href={project.source}>Source</ExternalLink><span>LINKS COMING SOON</span></div></div>
    </article>)}</div>
  </>;
}

const categories = ['All', 'TIL', 'LinkedIn', 'Note', 'Build'] as const;
type Category = typeof categories[number];
const posts: { date: string; category: Exclude<Category, 'All'>; title?: string; text: string; code?: string; language?: string; url?: string }[] = [
  { date: '2026-05-21', category: 'TIL', title: 'Cancel the request, not just the update.', text: 'A small React reminder: ignoring a stale response protects your UI, but aborting the fetch saves the work too. AbortController belongs in the effect cleanup.', language: 'tsx', code: "useEffect(() => {\n  const controller = new AbortController();\n  fetch(url, { signal: controller.signal })\n    .then(res => res.json())\n    .then(setData)\n    .catch(error => {\n      if (error.name !== 'AbortError') setError(error);\n    });\n  return () => controller.abort();\n}, [url]);" },
  { date: '2026-05-18', category: 'Build', title: 'A portfolio that feels a little more like me.', text: 'This week’s experiment: replacing the usual portfolio navigation with a climbing wall. The interesting challenge wasn’t drawing the holds — it was making the playful version just as usable with a keyboard as with a mouse.' },
  { date: '2026-05-14', category: 'LinkedIn', title: 'The best move isn’t always the obvious one.', text: 'On the wall and in engineering, stepping back can be more useful than trying harder. When something isn’t working, I’m learning to change my perspective before adding more complexity. Sometimes the simplest solution is one you can only see after a break.' },
  { date: '2026-05-10', category: 'Note', text: 'Some days are for sending. Others are for figuring out a single move. Both count. A reminder to give the quiet, unglamorous work the credit it deserves.' },
  { date: '2026-05-06', category: 'TIL', title: 'A tiny CSS win for readable text.', text: 'Instead of choosing a fixed width for a reading column, use the text itself as the measuring stick. Around 65 characters is a comfortable place to start.', language: 'css', code: '.reading-stream {\n  max-width: 65ch;\n  line-height: 1.85;\n  overflow-wrap: anywhere;\n}' },
  { date: '2026-05-02', category: 'LinkedIn', title: 'Ship the small version.', text: 'A finished small idea teaches me more than a perfect plan for a big one. Build the smallest useful version, share it, listen, and take the next hold.' },
];

export function BetaLog() {
  const [filter, setFilter] = useState<Category>('All');
  const filtered = posts.filter(post => filter === 'All' || post.category === filter);
  return <>
    <div className="section-intro"><div><span className="eyebrow">OBSERVATIONS FROM THE ASCENT</span><p className="dialog-lead">Learning out loud.<br/>One move at a time.</p></div><p>Small discoveries, things I’m building, and thoughts from beyond the screen. A sample log to make your own.</p></div>
    <div className="beta-layout">
      <aside className="beta-sidebar"><span className="eyebrow">PICK A THREAD</span><div className="filter-pills" role="group" aria-label="Filter Beta Log">{categories.map(category => <button key={category} className={`grade-badge ${filter === category ? 'filter-active' : ''}`} onClick={() => setFilter(category)} aria-pressed={filter === category}>{category}<span>{category === 'All' ? posts.length : posts.filter(p => p.category === category).length}</span></button>)}</div>
        <div className="now-block"><h3><span className="live-dot"/> On the wall now</h3><dl><div><dt>BUILDING</dt><dd>This little corner of the internet</dd></div><div><dt>LEARNING</dt><dd>Better systems. Simpler solutions.</dd></div><div><dt>CLIMBING</dt><dd>That one V4 with the tricky start</dd></div></dl><span className="now-update">SAMPLE STATUS / MAY 2026</span></div>
        <p className="log-footnote">A living notebook, not a highlight reel.</p>
      </aside>
      <div className="reading-stream"><div className="feed-summary" role="status">{filter === 'All' ? 'ALL ENTRIES' : filter.toUpperCase()}<span>{filtered.length.toString().padStart(2,'0')} NOTES / NEWEST FIRST</span></div>{filtered.map(post => <article className={`log-entry category-${post.category.toLowerCase()}`} key={post.date}>
        <div className="entry-meta"><time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time><span className="grade-badge">{post.category}</span></div>
        {post.title && <h3>{post.title}</h3>}<p>{post.text}</p>
        {post.code && <div className="code-block"><div><span>{post.language}</span><span>FIELD REFERENCE</span></div><pre><code>{post.code}</code></pre></div>}
        {post.category === 'LinkedIn' && <div className="syndicated-link"><ExternalLink href={post.url}>LinkedIn</ExternalLink><span>Sample syndicated post · URL not connected</span></div>}
      </article>)}<div className="feed-end"><span>+</span> THAT’S THE BETA. MORE AS THE ROUTE UNFOLDS.</div></div>
    </div>
  </>;
}
