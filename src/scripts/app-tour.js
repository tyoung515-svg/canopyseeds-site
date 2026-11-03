(function () {
  const ICON = {
    agents: 'M4 5h16v10H9l-5 4z',
    workspace: 'M3 5h18v14H3zM3 9h18M8 9v10',
    needs: 'M12 3l9 16H3zM12 10v4M12 16.5v.5',
    tasks: 'M5 6h14M5 12h14M5 18h9',
    projects: 'M3 6h7l2 2h9v11H3z',
    memory: 'M12 4a3 3 0 100 6 3 3 0 000-6zM5 16a3 3 0 100 6 3 3 0 000-6zM19 16a3 3 0 100 6 3 3 0 000-6zM12 10l-6 6M12 10l6 6',
    library: 'M4 4h4v16H4zM10 4h4v16h-4zM16 5l4 1-3 14-4-1z',
    prefs: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  };
  const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;

  function rail(on, badge = 1) {
    const items = [['agents','Agents'],['workspace','Workspace'],['tasks','Tasks'],['projects','Projects'],['memory','Memory'],['library','Library'],['needs','Needs you']];
    return `<div class="rail"><b class="brand">BoB</b>${items.map(([id, label]) =>
      `<i class="${id === on ? 'on' : ''}">${svg(id)}${label}${id === 'needs' && badge ? `<span class="badge">${badge}</span>` : ''}</i>`).join('')}
      <span class="gap"></span><i class="${on === 'prefs' ? 'on' : ''}">${svg('prefs')}Settings</i></div>`;
  }
  const av = (t, h) => `<span class="av" style="background:hsl(${h} 32% 34%)">${t}</span>`;
  const chat = (agent, title, lines, composer, chipLine = '') => `
    <div class="col pane bl" style="display:grid;grid-template-rows:auto 1fr auto;background:#15171a">
      <div class="pad bb row" style="background:var(--panel)">${av(agent[0], agent[1])}<div><p class="h">${agent[2]} ${agent[3] || ''}</p><span class="mut sm">${title}</span></div></div>
      <div class="pad stack" style="gap:9px">${lines}</div>
      <div class="pad bt" style="background:var(--panel)">${chipLine}<div class="composer"><div class="box">${composer}</div><span class="btn pri">Send</span></div></div>
    </div>`;

  const SCREENS = {
    agents: {
      label: 'Agents', title: 'Agents you talk to like contacts',
      text: 'Each main agent is one persistent thread, like a messenger contact. New work stays inside that agent’s thread instead of piling up as new chats, and whoever needs you rises to the top.',
      points: [['One thread per agent','Sessions live inside the agent, with a divider between them.'],['Attention rises','Working and needs-you agents move up with a badge.'],['See the work','A live activity column shows every tool call as it happens.']],
      html: () => `<div class="app">${rail('agents')}<div class="body" style="grid-template-columns:250px 1fr 270px">
        <div class="col pane br pad stack">
          <div class="row" style="justify-content:space-between"><p class="h" style="font-size:17px">Agents</p><span class="btn">Refresh</span></div>
          <div class="composer"><div class="box" style="border-radius:16px;padding:6px 12px">Search agents and sessions…</div></div>
          <div class="agent">${av('RE',40)}<div><strong>Researcher</strong><div class="sub"><span class="chip need">needs you</span> Compare three backup tools</div></div><span class="mut sm">2m</span></div>
          <div class="agent sel">${av('BO',120)}<div><strong>Bob</strong><div class="sub"><span class="chip work">working</span> Weekly plan</div></div><span class="mut sm">now</span></div>
          <div class="agent">${av('CO',200)}<div><strong>Coder</strong><div class="sub">Fix the photo importer</div></div><span class="mut sm">1h</span></div>
          <div class="agent">${av('TC',270)}<div><strong>The Council</strong><div class="sub">Should we move to a NAS?</div></div><span class="mut sm">1d</span></div>
          <div class="agent">${av('GA',90)}<div><strong>General Assistant</strong><div class="sub">No sessions yet — start one</div></div><span></span></div>
        </div>
        ${chat(['BO',120,'Bob','<span class="chip work">working</span>'], 'Weekly plan · 3 sessions', `
          <span class="btn" style="justify-self:center;border-style:dashed;background:transparent">↑ Earlier session · Grocery run · 2d</span>
          <div class="divider">Session · Weekly plan · started Mon 08:10</div>
          <div class="msg me"><div class="who">You · 08:10</div>Plan my week around the school run and the two client calls.</div>
          <div class="msg bot"><div class="who">Bob · 08:11</div>Here’s a draft. Tuesday is tight: the dentist overlaps the 3pm call. Want me to move the call or the appointment?</div>
          <div class="msg me"><div class="who">You · 08:12</div>Move the call. And add a gym slot Thursday.</div>
          <p class="mut sm row"><span class="dot pulse" style="background:var(--green)"></span>Bob is working · 2 tool calls so far</p>`, 'Message Bob…')}
        <div class="col pane bl pad stack" style="gap:10px">
          <span class="lab">Activity</span>
          <div class="card row"><span class="dot pulse" style="background:var(--green)"></span><div><strong>Bob is working</strong><div class="mut sm">2 tool calls</div></div></div>
          <div class="trail">
            <div class="done"><span class="t">calendar.read</span> <span class="mut">· 210 ms</span><div class="mut">this week · 14 events</div></div>
            <div class="done"><span class="t">calendar.propose_move</span> <span class="mut">· 95 ms</span><div class="mut">Client call → Tue 4:30pm</div></div>
            <div><span class="t">calendar.add</span> <span class="mut">running…</span></div>
          </div>
          <span class="lab" style="margin-top:6px">Sessions in this thread · 3</span>
          <div class="stack sm"><div class="row" style="justify-content:space-between"><span>Weekly plan</span><span class="mut">now</span></div><div class="row" style="justify-content:space-between"><span class="mut">Grocery run</span><span class="mut">2d</span></div><div class="row" style="justify-content:space-between"><span class="mut">Birthday ideas</span><span class="mut">6d</span></div></div>
          <span class="lab" style="margin-top:6px">▸ Audit · this session</span>
        </div>
      </div></div>`,
    },
    workspace: {
      label: 'Workspace', title: 'A real editor, with agents beside you',
      text: 'Open a folder and work in an editor developers already know: file tree with git changes, tabs, a side-by-side diff, real terminals. The agent on the right sees the open file, and every agent at work gets its own mini terminal.',
      points: [['Editor and terminal','A familiar editor, git marks, and a real shell in the folder.'],['Agent sees your file','Send the open file or just your selection with a message.'],['Agents in action','Mini terminals stream each agent’s tool calls and reply.']],
      html: () => `<div class="app">${rail('workspace')}<div class="body" style="grid-template-columns:190px 1fr 290px">
        <div class="col pane br" style="padding-top:8px">
          <div class="row pad" style="padding-top:0;justify-content:space-between"><span class="lab">Explorer</span><span class="btn">Open…</span></div>
          <div class="tree"><div class="lab" style="padding:4px 8px">PHOTO-IMPORTER · main</div>
          <div class="mut">▾ src</div><div style="padding-left:22px" class="M act">importer.ts <b style="float:right">M</b></div><div style="padding-left:22px">exif.ts</div><div style="padding-left:22px" class="U">dedupe.ts <b style="float:right">U</b></div><div class="mut">▸ tests</div><div>package.json</div><div>README.md</div></div>
        </div>
        <div class="col" style="display:grid;grid-template-rows:auto 1fr 190px auto;background:#1e1e1e">
          <div class="tabs"><span class="on">importer.ts ●</span><span>dedupe.ts</span><span>importer.ts ↔ HEAD</span></div>
          <div class="code"><span class="ln">12</span><span class="k">import</span> { <span class="f">readExif</span> } <span class="k">from</span> <span class="s">'./exif'</span>;
<span class="ln">13</span><span class="k">import</span> { <span class="f">isDuplicate</span> } <span class="k">from</span> <span class="s">'./dedupe'</span>;
<span class="ln">14</span>
<span class="ln">15</span><span class="c">// Copy new photos into the dated library folders.</span>
<span class="ln">16</span><span class="k">export async function</span> <span class="f">importFolder</span>(dir: <span class="ty">string</span>) {
<span class="ln">17</span>  <span class="k">for</span> (<span class="k">const</span> file <span class="k">of</span> <span class="k">await</span> <span class="f">list</span>(dir)) {
<span class="ln">18</span>    <span class="k">const</span> meta = <span class="k">await</span> <span class="f">readExif</span>(file);
<span class="ln">19</span>    <span class="k">if</span> (<span class="k">await</span> <span class="f">isDuplicate</span>(file, meta)) <span class="k">continue</span>;
<span class="ln">20</span>    <span class="k">await</span> <span class="f">copyInto</span>(<span class="f">libraryPath</span>(meta.taken), file);
<span class="ln">21</span>  }
<span class="ln">22</span>}</div>
          <div class="bt" style="display:grid;grid-template-rows:auto 1fr;background:#0f1113">
            <div class="row" style="padding:0 8px;gap:0"><span class="tabs" style="background:none;border:0"><span>Terminal</span><span class="on" style="background:none">Agents</span></span></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:6px 8px">
              <div class="tile"><header><span class="dot pulse" style="background:var(--green)"></span><strong>Coder</strong><span class="mut">Fix the importer</span><span class="mut" style="margin-left:auto">working · 41s</span></header><pre>$ read_file src/dedupe.ts
  ✓ read_file · 12 ms
$ run_tests importer
  ✓ run_tests · 3.2 s
    14 passed, 1 failed
› The failing case is two photos with
› the same second: compare the hash too.</pre></div>
              <div class="tile" style="border-color:var(--line)"><header><span class="dot" style="background:var(--accent)"></span><strong>Researcher</strong><span class="mut">EXIF libraries</span><span class="mut" style="margin-left:auto">done · 18s</span></header><pre>$ web_search exif parser typescript
  ✓ web_search · 1.4 s
› Two good options, both MIT. The
› smaller one handles HEIC too.</pre></div>
            </div>
          </div>
          <div class="row sm" style="background:#2b3a33;color:#dfe9e2;padding:2px 10px;gap:14px"><span>~/code/photo-importer</span><span>⎇ main · 2 changes</span><span style="margin-left:auto">Ln 19, Col 31</span></div>
        </div>
        ${chat(['CO',200,'Coder',''], 'Fix the photo importer', `
          <div class="msg me" style="max-width:92%"><div class="who">You · 14:02</div>Why does this skip some photos from the same burst?<div class="mut sm" style="margin-top:4px">📎 importer.ts · lines 17–21</div></div>
          <div class="msg bot" style="max-width:92%"><div class="who">Coder · 14:03</div>Bursts share a timestamp, so the duplicate check treats them as one photo. I’ll compare a content hash as well — running the tests now.</div>`, 'Message Coder…', '<p class="sm" style="margin:0 0 6px;color:var(--accent)">☑ Include importer.ts (or the selection)</p>')}
      </div></div>`,
    },
    needs: {
      label: 'Needs you', title: 'Only what actually needs you',
      text: 'Approvals and gaps share one small inbox for high-level decisions and emergencies, not a flood of routine prompts. Open any item to read all of it, decide, or hand it to an agent to fix or plan the fix.',
      points: [['Quiet by default','Routine work never becomes an approval.'],['Read it all','Rows expand to the full details and where they came from.'],['Hand it off','Ask to fix or Ask for a plan opens a ready-to-send request.']],
      html: () => `<div class="app">${rail('needs', 2)}<div class="body" style="grid-template-columns:1fr 360px">
        <div class="col pad stack" style="gap:10px;padding:16px 22px">
          <div class="row" style="justify-content:space-between"><p class="h" style="font-size:18px">Needs you</p><span class="btn">Reload</span></div>
          <p class="mut" style="margin:0">Click an item to read all of it, or hand it to an agent to fix or plan.</p>
          <div class="card open">
            <div class="row"><span class="mut">▾</span><strong>Spend over budget</strong><span class="mut sm" style="margin-left:auto">today 09:42</span></div>
            <p class="mut sm" style="margin:0"><code>appr-7f21</code> · from Researcher · “Compare three backup tools”</p>
            <pre class="details">{
  "action": "team_run",
  "team": "deep-research",
  "model_calls": 24,
  "budget_left": 10,
  "reason": "Needs pricing pages for all three vendors"
}</pre>
            <div class="row"><span class="btn pri">Approve</span><span class="btn">Reject</span><span class="mut sm" style="margin-left:10px">Work on it with an agent:</span><span class="btn">Ask to fix</span><span class="btn">Ask for a plan</span></div>
          </div>
          <div class="card"><div class="row"><span class="mut">▸</span><strong>Send email</strong><span class="mut sm">yesterday 18:05</span><span class="mut sm" style="margin-left:6px">appr-3c09 · draft reply to the school about Friday pickup</span></div><div class="row"><span class="btn pri">Approve</span><span class="btn">Reject</span></div></div>
        </div>
        <div class="col pane bl pad stack" style="gap:10px">
          <p class="h">Gaps · what Bob can’t do yet</p>
          <p class="mut sm" style="margin:0">Missing capabilities, not loading states. Open one, or ask an agent to fix it.</p>
          <div class="card"><strong>▾ No way to list built apps on the server</strong><span class="sm" style="color:#cfd3d6">The Library shows what you add by hand until the server can list what agents have built.</span><div class="row"><span class="btn">Ask to fix</span><span class="btn">Ask for a plan</span></div></div>
          <div class="card"><strong>▸ Agent tasks can’t start on a schedule</strong></div>
          <div class="card"><strong>▸ Memory can’t be edited in place</strong></div>
        </div>
      </div></div>`,
    },
    tasks: {
      label: 'Tasks', title: 'One calendar for you and your agents',
      text: 'Your own plans and your agents’ scheduled work sit on one calendar. Click a day to see it hour by hour and set things up. Teams are put together by talking to an assistant, not by filling in forms.',
      points: [['Month and day','Click any day for an hour-by-hour view to add, move or change items.'],['Agent tasks','Repeat daily or weekly; due tasks wait for a Run button.'],['Teams by chat','“Set up a team” starts a guided conversation.']],
      html: () => {
        const days = [];
        const start = 26; let n = 0;
        const ev = { 2: ['<span class="ev me">08:15 School run</span>','<span class="ev ag due">07:00 Morning brief</span>'], 3:['<span class="ev me">15:00 Dentist</span>'], 4:['<span class="ev ag">Inbox tidy</span>'], 5:['<span class="ev me">18:30 Gym</span>'], 6:['<span class="ev ag">Weekly report</span>'], 9:['<span class="ev ag">07:00 Morning brief</span>'], 12:['<span class="ev me">Mum’s birthday</span>'], 16:['<span class="ev ag">07:00 Morning brief</span>'], 19:['<span class="ev me">10:00 Car service</span>'], 20:['<span class="ev ag">Weekly report</span>'], 23:['<span class="ev ag">07:00 Morning brief</span>'], 27:['<span class="ev ag">Weekly report</span>'] };
        for (let i = 0; i < 35; i++) {
          const inPrev = i < 6; const d = inPrev ? start + i : i - 5;
          const other = inPrev || d > 30;
          const day = other && !inPrev ? d - 30 : d;
          days.push(`<div class="d${other ? ' o' : ''}${!other && day === 2 ? ' today' : ''}"><b>${day}</b>${!other && ev[day] ? ev[day].join('') : ''}${!other && (day === 6 || day === 13) ? '<span class="mut" style="font-size:9.5px">⚙ 2 team runs</span>' : ''}</div>`);
          n++;
        }
        return `<div class="app">${rail('tasks')}<div class="body" style="grid-template-columns:1fr 300px">
        <div class="col pad stack" style="gap:8px;padding:12px 16px">
          <div class="row"><span class="btn">◂</span><span class="btn">Today</span><span class="btn">▸</span><p class="h" style="font-size:18px;margin-left:6px">November</p><span style="flex:1"></span><span class="chip" style="border:1px solid #4f6f9a;color:#b9d3f5">☑ Me</span><span class="chip" style="border:1px solid #3d6b4f;color:#b8e6c6">☑ Agents</span><span class="btn">Run history</span><span class="btn pri">Set up a team…</span></div>
          <p class="sm" style="margin:0;color:var(--amber)">1 agent task is due today: open today</p>
          <div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w => `<span class="wd">${w}</span>`).join('')}${days.join('')}</div>
        </div>
        ${chat(['BO',120,'Bob',''], 'Team setup', `
          <div class="msg me" style="max-width:94%"><div class="who">You</div>Help me set up a team that writes a short morning brief from my inbox and calendar.</div>
          <div class="msg bot" style="max-width:94%"><div class="who">Bob</div>Happy to. First question: which days should it run, and what time do you want it ready by?</div>
          <div class="msg me" style="max-width:94%"><div class="who">You</div>Weekdays, 7am.</div>`, 'Message Bob…')}
      </div></div>`;
      },
    },
    projects: {
      label: 'Projects', title: 'A board your PM agent runs with you',
      text: 'Projects sit on a simple board. Pick one up and a project-manager agent plans it with you; agent teams do the work. Prefer a list? One click switches to a sortable table.',
      points: [['Board or list','Drag cards between columns, or sort a plain list.'],['Pick it up','Opens a PM session inside the project with a brief ready to send.'],['PM reviews the board','Ask the PM what to focus on next.']],
      html: () => {
        const card = (t, d, m, sel) => `<div class="kcard${sel ? ' sel' : ''}"><strong>${t}</strong><p>${d}</p><span class="mut" style="font-size:10px">${m}</span><div class="row" style="gap:4px"><span class="btn" style="padding:1px 6px">◂</span><span class="btn" style="flex:1;text-align:center;padding:1px 6px">Pick up</span><span class="btn" style="padding:1px 6px">▸</span></div></div>`;
        const col = (name, n, cards, color) => `<div class="kcol"><div><span class="lab" style="color:${color || 'var(--muted)'}">${name}</span><span class="mut sm">${n}</span></div><div class="kcards">${cards}</div></div>`;
        return `<div class="app">${rail('projects')}<div class="body" style="grid-template-columns:1fr 300px">
        <div class="col pad" style="display:grid;grid-template-rows:auto 1fr;gap:8px;padding:12px 14px">
          <div class="row"><p class="h" style="font-size:18px">Projects</p><span class="mut sm">7 on the server</span><span class="row" style="gap:0;border:1px solid var(--line);border-radius:7px;margin-left:6px"><span class="btn" style="border:0;background:#22292a;color:var(--accent)">Board</span><span class="btn" style="border:0;background:none">List</span></span><span style="flex:1"></span><span class="btn">Add</span><span class="btn pri">Ask the PM…</span></div>
          <div class="kan">
            ${col('Backlog', 2, card('Family recipe book','Scan and tag grandma’s cards','0 sessions · 3d') + card('Garden planner','When to plant what, by bed','1 session · 1w'))}
            ${col('Planned', 1, card('Home network refresh','New router, guest wifi, NAS','2 sessions · 1d'))}
            ${col('In progress', 2, card('Photo importer','Dated library, no duplicates','5 sessions · now', true) + card('Morning brief','Inbox + calendar at 7am','3 sessions · 2h'), 'var(--green)')}
            ${col('Review', 1, card('Budget sheet','Monthly categories and alerts','4 sessions · 5h'), 'var(--amber)')}
            ${col('Done', 1, card('Holiday packing list','Shared list for the trip','2 sessions · 2w'))}
          </div>
        </div>
        ${chat(['BO',120,'Bob','<span class="chip" style="border:1px solid #34413a;color:var(--accent)">PM</span>'], 'PM · Photo importer', `
          <div class="msg bot" style="max-width:94%"><div class="who">Bob · PM</div>Where it stands: import and dating work; duplicates from burst shots slip through.<br><br>Next step: content-hash check (Coder, about 8 model calls), then a test run on last month’s photos. I need one thing from you: should near-duplicates be kept or moved to a review folder?</div>`, 'Message Bob…')}
      </div></div>`;
      },
    },
    memory: {
      label: 'Memory', title: 'See what your agents remember',
      text: 'Browse memory as a plain file explorer or as a 3D brain of how things connect. Health flags point out test data, errors and duplicates, and any memory can go to an agent to talk about or tidy up.',
      points: [['Flat or 3D','A folder tree and reader, or a brain you can spin and click.'],['Health at a glance','A score plus flags that filter straight to the problems.'],['Talk or manage','Pick memories and hand them to an agent.']],
      html: () => `<div class="app">${rail('memory')}<div class="body" style="grid-template-columns:1fr 280px">
        <div class="col pad" style="display:grid;grid-template-rows:auto auto 1fr;gap:8px;padding:12px 14px">
          <div class="row"><p class="h" style="font-size:18px">Memory</p><span class="row" style="gap:0;border:1px solid var(--line);border-radius:7px;margin-left:6px"><span class="btn" style="border:0;background:none">Flat</span><span class="btn" style="border:0;background:#22292a;color:var(--accent)">Brain</span></span><span style="flex:1"></span><span class="btn">New memory</span><span class="btn">Refresh</span></div>
          <div class="health"><span class="score">Health 92%</span><span>286 memories</span><span style="color:#9fc6ee">182 notes</span><span style="color:#a6dfb8">96 events</span><span style="color:#efd9a7">8 facts</span><span class="flag">17 test / probe data</span><span class="flag">5 turns recorded an error</span></div>
          <div style="display:grid;grid-template-columns:1fr 250px;gap:8px;min-height:0">
            <div style="position:relative;border:1px solid var(--line);border-radius:9px;overflow:hidden;background:#0b0d0f"><canvas class="brain" id="brain" width="1100" height="900" aria-label="Memory graph"></canvas>
              <div class="row sm mut" style="position:absolute;right:8px;top:8px;background:rgba(14,16,18,.85);padding:3px 9px;border-radius:9px"><span class="dot" style="background:var(--blue)"></span>note <span class="dot" style="background:var(--green)"></span>event <span class="dot" style="background:var(--amber)"></span>fact <span class="dot" style="background:var(--coral)"></span>flagged</div></div>
            <div class="card" style="align-content:start">
              <span class="lab">note</span><strong>Prefers the morning brief under 150 words</strong>
              <pre class="details">Keep the 7am brief short: three bullets for the day, one for anything that needs a decision. No weather unless it changes plans.</pre>
              <span class="mut sm">source note:home:12 · saved by Bob</span>
              <div class="row" style="flex-wrap:wrap"><span class="btn">Talk about it</span><span class="btn">Manage with agent</span></div>
            </div>
          </div>
        </div>
        ${chat(['BO',120,'Bob',''], 'Memory · 6 memories', `
          <div class="msg me" style="max-width:94%"><div class="who">You</div>Help me manage these memories: which are still true, duplicated or test data?</div>
          <div class="msg bot" style="max-width:94%"><div class="who">Bob</div>Two are probe notes from setup and can retire. Three say the same thing about the brief — I suggest one merged note. Here’s the text to save…</div>`, 'Message Bob…')}
      </div></div>`,
    },
    library: {
      label: 'Library', title: 'Everything your agents build, ready to launch',
      text: 'Apps and workflows live in a library like a games launcher: launch them, open them in the Workspace, or hand them to an agent to drive, manage or fix. Plan a new app and it becomes a project with a PM. Hard to describe? Sketch the workflow instead.',
      points: [['Launch and manage','Covers, stats and a big Launch button.'],['+ New app','Starts a project and a PM session to plan it.'],['Sketch it','A drag-and-link canvas the agent turns into a plan.']],
      html: () => `<div class="app">${rail('library')}<div class="body" style="grid-template-columns:200px 1fr 290px">
        <div class="col pane br pad stack">
          <div class="row" style="flex-wrap:wrap;gap:4px"><span class="chip" style="border:1px solid var(--accent);color:var(--accent)">All</span><span class="chip" style="border:1px solid var(--line);color:var(--muted)">Apps</span><span class="chip" style="border:1px solid var(--line);color:var(--muted)">Workflows</span></div>
          <strong style="padding:4px 2px">Home</strong>
          ${[['PI','Photo importer','App · Building',200],['MB','Morning brief','Workflow · Ready',120],['BS','Budget sheet','App · Ready',40],['RB','Recipe book','App · Planned',330]].map(([i,n,s,h],k) => `<div class="row" style="padding:4px;border-radius:8px;${k===0?'background:#22292a;border:1px solid #34413a':''}"><span class="cover" style="width:32px;height:32px;font-size:11px;background:linear-gradient(135deg,hsl(${h} 45% 32%),hsl(${(h+50)%360} 40% 16%))">${i}</span><span><strong style="font-size:12px">${n}</strong><br><span class="mut" style="font-size:10.5px">${s}</span></span></div>`).join('')}
        </div>
        <div class="col" style="display:grid;grid-template-rows:auto 1fr">
          <div class="hero bb" style="background:linear-gradient(120deg,hsl(200 45% 26%),#121417 75%)"><span class="cover" style="width:96px;height:96px;font-size:30px;background:linear-gradient(135deg,hsl(200 45% 32%),hsl(250 40% 16%));box-shadow:0 10px 26px rgba(0,0,0,.45)">PI</span><div class="stack"><span class="lab" style="color:#c9d2cc">App · Building</span><p class="h" style="font-size:26px">Photo importer</p><div class="row"><span class="btn pri" style="padding:6px 20px;font-size:13px">▶ Launch</span><span class="btn">Open in Workspace</span><span class="btn">Edit</span></div></div></div>
          <div style="position:relative;background-color:#111316;background-image:radial-gradient(#2a2f35 1px,transparent 1px);background-size:20px 20px;overflow:hidden">
            <span class="lab" style="position:absolute;left:12px;top:8px">Workflow sketch</span>
            <svg width="100%" height="100%" style="position:absolute;inset:0" aria-hidden="true"><g fill="none" stroke="#8a949c" stroke-width="2"><path d="M172 70 C 210 70, 200 130, 238 130"/><path d="M378 130 C 416 130, 406 70, 444 70"/><path d="M378 130 C 416 130, 406 200, 444 200"/></g></svg>
            <div class="node" style="left:32px;top:46px;border-left:3px solid var(--amber)"><div class="nh">Trigger</div><div class="nl">New photos on the phone</div></div>
            <div class="node" style="left:238px;top:106px;border-left:3px solid var(--green)"><div class="nh">Agent</div><div class="nl">Date, tag, de-duplicate</div></div>
            <div class="node" style="left:444px;top:46px;border-left:3px solid var(--blue)"><div class="nh">Tool / app</div><div class="nl">Family photo library</div></div>
            <div class="node" style="left:444px;top:176px;border-left:3px solid var(--coral)"><div class="nh">Me</div><div class="nl">Review near-duplicates</div></div>
          </div>
        </div>
        ${chat(['CO',200,'Coder',''], 'App · Photo importer', `
          <div class="msg me" style="max-width:94%"><div class="who">You</div>Help me manage this: is it healthy, and what should be documented?</div>
          <div class="msg bot" style="max-width:94%"><div class="who">Coder</div>It launched 23 times this month with no errors. Two things: a README for the folder layout, and a weekly check that the library drive has space.</div>`, 'Message Coder…')}
      </div></div>`,
    },
    prefs: {
      label: 'Settings', title: 'Settings that keep secrets secret',
      text: 'Appearance, account, models, connection and scope in one place. Keys are write-only: a pasted key goes straight to your server, the field clears at once, and only a short fingerprint is ever shown. Passwords change with your current password and a two-factor code.',
      points: [['Write-only keys','Never saved, shown or logged on the computer you type them on.'],['Safe sign-in changes','Current password plus a fresh two-factor code.'],['Simple or Pro','Hide the technical detail, or see all of it.']],
      html: () => `<div class="app">${rail('prefs')}<div class="body" style="grid-template-columns:200px 1fr">
        <div class="col pane br pad snav stack" style="gap:2px"><p class="h" style="font-size:17px;padding:4px 8px 8px">Settings</p><div>Appearance</div><div>Account &amp; sign-in</div><div class="on">Keys &amp; sign-ins</div><div>Models</div><div>Connection</div><div>Approvals &amp; scope</div><div>Data on this PC</div></div>
        <div class="col pad stack" style="gap:12px;padding:16px 22px;max-width:760px">
          <div class="card" style="padding:12px 14px">
            <p class="h">Provider keys</p>
            <p class="sm" style="margin:0;color:#cfd3d6">Keys live on your server. A key you paste is sent once over the private link, the field clears at once, and only a short fingerprint is shown.</p>
            ${[['anthropic','api','working','ok'],['openai','api','working','ok'],['local-gpu','local','offline · machine asleep','off']].map(([id,k,s,c]) => `<div class="card" style="background:#16181b"><div class="row"><strong>${id}</strong><span class="mut sm">${k}</span><span class="chip ${c}">${s}</span></div><div class="row"><span class="field">••••••••••••••••••••••</span><span class="btn">Show</span><span class="btn pri">Send to server</span></div>${id === 'openai' ? '<p class="sm" style="margin:0;color:var(--accent)">Sent to the server · key 3f9a1c07…</p>' : ''}</div>`).join('')}
          </div>
          <div class="card" style="padding:12px 14px"><p class="h">Add a key</p><div class="row"><span class="field" style="flex:0 0 220px;font-family:var(--body)">Choose a provider…</span></div><p class="mut sm" style="margin:0">Adding a key switches nothing on: your server decides which providers your agents may use.</p></div>
        </div>
      </div></div>`,
    },
  };

  const ORDER = ['agents', 'workspace', 'needs', 'tasks', 'projects', 'memory', 'library', 'prefs'];
  const nav = document.getElementById('tour-nav');
  nav.innerHTML = ORDER.map((id) => `<button type="button" data-id="${id}">${svg(id)}<span>${SCREENS[id].label}</span></button>`).join('');
  const screen = document.getElementById('screen');
  const frame = document.getElementById('frame');

  function fit() { screen.style.transform = frame.classList.contains('is-expanded') ? 'none' : `scale(${frame.clientWidth / 1120})`; }
  const detailToggle = document.getElementById('screen-detail-toggle');
  detailToggle.addEventListener('click', () => {
    const expanded = frame.classList.toggle('is-expanded');
    detailToggle.setAttribute('aria-pressed', String(expanded));
    detailToggle.textContent = expanded ? 'Fit screen' : 'Expand screen';
    document.getElementById('screen-detail-hint').textContent = expanded ? 'Scroll inside the screen to explore.' : 'See the details at full size.';
    frame.scrollLeft = 0;
    frame.scrollTop = 0;
    fit();
  });
  new ResizeObserver(fit).observe(frame);

  let brainTimer = null;
  function drawBrain() {
    const canvas = document.getElementById('brain');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const hubs = [[550, 300, '#c8dccd'], [330, 560, '#c8dccd'], [780, 580, '#c8dccd'], [560, 760, '#c8dccd']];
    const colors = ['#7fb3e6', '#7fb3e6', '#8fd3a5', '#e9cf95'];
    const nodes = [];
    hubs.forEach((h, k) => { for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = 50 + rnd() * 150; nodes.push({ x: h[0] + Math.cos(a) * r, y: h[1] + Math.sin(a) * r * .8, z: rnd(), hub: k, c: rnd() < .07 ? '#e0816f' : colors[k] }); } });
    let t = 0;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = Math.sin(t / 90), cx = 560;
      const px = (n) => cx + (n.x - cx) * (0.92 + 0.08 * Math.cos(t / 90 + n.z * 6)) + s * 18 * (n.z - .5);
      ctx.lineWidth = 1;
      nodes.forEach((n, i) => { const h = hubs[n.hub]; ctx.strokeStyle = 'rgba(200,220,205,0.08)'; ctx.beginPath(); ctx.moveTo(px(n), n.y); ctx.lineTo(h[0], h[1]); ctx.stroke();
        const m = nodes[i + 1]; if (m && m.hub === n.hub && i % 3 === 0) { ctx.strokeStyle = 'rgba(127,179,230,0.25)'; ctx.beginPath(); ctx.moveTo(px(n), n.y); ctx.lineTo(px(m), m.y); ctx.stroke(); } });
      ctx.strokeStyle = 'rgba(233,207,149,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hubs[0][0], hubs[0][1]); ctx.lineTo(hubs[2][0], hubs[2][1]); ctx.stroke();
      hubs.forEach((h) => { ctx.fillStyle = h[2]; ctx.beginPath(); ctx.arc(h[0], h[1], 16, 0, Math.PI * 2); ctx.fill(); });
      nodes.forEach((n) => { ctx.fillStyle = n.c; ctx.globalAlpha = .55 + n.z * .45; ctx.beginPath(); ctx.arc(px(n), n.y, 3.5 + n.z * 4, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { t++; brainTimer = requestAnimationFrame(frame); }
    }
    frame();
  }

  function show(id) {
    if (!ORDER.includes(id)) id = 'agents';
    const s = SCREENS[id];
    if (brainTimer) cancelAnimationFrame(brainTimer);
    document.getElementById('caption').innerHTML = `<span class="eyebrow">${ORDER.indexOf(id) + 1} of ${ORDER.length} · ${s.label}</span><h2>${s.title}</h2><p>${s.text}</p>`;
    document.getElementById('points').innerHTML = s.points.map(([a, b]) => `<li><strong>${a}</strong>${b}</li>`).join('');
    screen.innerHTML = s.html();
    nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
    fit();
    if (id === 'memory') drawBrain();
  }

  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (location.hash !== '#' + b.dataset.id) location.hash = b.dataset.id; else show(b.dataset.id);
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1) || 'agents');
})();
