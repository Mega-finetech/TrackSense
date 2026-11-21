// Browser-only integration fixtures. No request is sent to the real API/database.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, mkdtemp } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve('web-preview');
const artifacts = resolve('artifacts');
await mkdir(artifacts, { recursive: true });
const server = createServer(async (req, res) => {
  const file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403).end(); return; }
  const mime = { '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.html': 'text/html', '.ttf': 'font/ttf' };
  try { const data = await readFile(file); res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(data); }
  catch { res.setHeader('Content-Type', 'text/html'); res.end(await readFile(resolve(root, 'index.html'))); }
});
await new Promise(resolve => server.listen(8796, '127.0.0.1', resolve));
const profile = await mkdtemp(resolve(tmpdir(), 'tracksense-preview-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
process.on('exit', () => chrome.kill());
const pending = new Map(); let sequence = 0; let ws;
const errors = [];
let profileFixture={id:'11111111-1111-4111-8111-111111111111',name:'Alex',email:'alex@example.test',bio:'',avatar_url:null};
let notificationFixture={task_due:true,exam_soon:true,streak_risk:true,goal_deadline:true,assignment_overdue:true,focus_sessions:true,weekly_review:true};
const tasks = [];
const focusSessions = [];
let analyticsEmpty = false; let analyticsFailure = false; const analyticsRequests = [];
let preferences = null;
const spiritual = { prayer: [], devotion: [], journal: [] };
let spiritualFailure = false;
const study = { courses: [], assignments: [], exams: [] };
let notifications = [];
const plans = { goals: [], projects: [] };
const milestones = { goals: [], projects: [] };
const id = '11111111-1111-4111-8111-111111111111';
const sessionUser = { id, name: 'Alex', email: 'alex@example.test', isVerified: true, createdAt: '2026-01-01T00:00:00.000Z' };
const sessionPayload = { user: sessionUser, token: 'browser-test-session', refreshToken: 'browser-test-refresh' };
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = '';
    chrome.stderr.on('data', chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) resolve(match[1]); });
    chrome.on('error', reject);
    chrome.on('exit', code => reject(new Error(`Chrome exited: ${code}`)));
  });
  ws = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  function send(method, params = {}, sessionId) {
    const messageId = ++sequence;
    return new Promise((resolve, reject) => { pending.set(messageId, { resolve, reject }); ws.send(JSON.stringify({ id: messageId, method, params, ...(sessionId ? { sessionId } : {}) })); });
  }
  ws.onmessage = async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const promise = pending.get(message.id); pending.delete(message.id);
      if (message.error) promise?.reject(new Error(message.error.message)); else promise?.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
    if (message.method === 'Fetch.requestPaused') {
      const { request, requestId } = message.params;
      const path = new URL(request.url).pathname;
      let body = {};
      if (request.method === 'OPTIONS') body = {};
      else if (path === '/api/auth/register') {
        const payload = request.postData ? JSON.parse(request.postData) : {};
        body = { success: true, data: { user: { id, name: payload.name || 'Alex', email: payload.email, isVerified: false }, verificationRequired: true, email: payload.email, expiresInSeconds: 60, resendInSeconds: 60 } };
      }
      else if (path === '/api/auth/login') body = { success: true, data: sessionPayload };
      else if (path === '/api/auth/verify-email' || path === '/api/auth/reset-password') body = { success: true, data: sessionPayload };
      else if (path === '/api/auth/resend-verification' || path === '/api/auth/forgot-password') body = { success: true, message: 'If this email is registered, a recovery code has been sent.', data: { expiresInSeconds: 60, resendInSeconds: 60 } };
      else if (path === '/api/auth/refresh') body = { success: true, data: { ...sessionPayload, token: 'browser-test-session-refreshed' } };
      else if (path === '/api/auth/logout') body = { success: true };
      else if (path === '/api/auth/me') body = { success: true, data: sessionUser };
      else if (path === '/api/settings/profile') { if(request.method==='PUT') profileFixture={...profileFixture,...JSON.parse(request.postData)}; body={...profileFixture,id}; }
      else if (path === '/api/settings/notifications') { if(request.method==='PUT') notificationFixture={...notificationFixture,...JSON.parse(request.postData)}; body=notificationFixture; }
      else if (path === '/api/settings/export') body={user:profileFixture,tasks};
      else if (path === '/api/preferences') {
        if (request.method === 'PUT') preferences = { ...JSON.parse(request.postData), revision: (preferences?.revision || 0) + 1 };
        body = preferences;
      }
      else if (path === '/api/tasks' && request.method === 'POST') { const task = { ...JSON.parse(request.postData), id: id.slice(0, -1) + (tasks.length + 1), user_id: id }; tasks.push(task); body = task; }
      else if (path === '/api/tasks') body = analyticsEmpty ? [] : tasks;
      else if (path.startsWith('/api/tasks/') && request.method === 'PUT') { const task = tasks.find(item => item.id === path.split('/').at(-1)); if (!task) throw new Error('Unknown fixture task'); Object.assign(task, JSON.parse(request.postData)); body = { task, nextTask: null }; }
      else if (path === '/api/notifications') body = notifications;
      else if (path === '/api/notifications/unread-count') body = { unreadCount: notifications.filter(item => !item.is_read).length };
      else if (path === '/api/notifications/read-all' && request.method === 'PUT') {
        const updatedCount = notifications.filter(item => !item.is_read).length;
        notifications.forEach(item => { item.is_read = true; });
        body = { success: true, updatedCount };
      }
      else if (/^\/api\/notifications\/[^/]+\/read$/.test(path) && request.method === 'PUT') {
        const notification = notifications.find(item => item.id === path.split('/').at(-2));
        if (notification) notification.is_read = true;
        body = notification || { success: true };
      }
      else if (['/api/courses', '/api/assignments', '/api/exams'].includes(path)) {
        const kind = path.split('/').at(-1);
        if (request.method === 'POST') { const record = { ...JSON.parse(request.postData), id: kind + '-' + (study[kind].length + 1) }; study[kind].push(record); body = record; }
        else body = study[kind];
      }
      else if (/^\/api\/(courses|assignments|exams)\/[^/]+$/.test(path) && ['PUT', 'DELETE'].includes(request.method)) {
        const [, , kind, recordId] = path.split('/');
        const index = study[kind].findIndex(item => item.id === recordId);
        if (index < 0) throw new Error('Unknown fixture ' + kind.slice(0, -1));
        if (request.method === 'DELETE') {
          study[kind].splice(index, 1);
          if (kind === 'courses') {
            study.assignments = study.assignments.filter(item => item.course_id !== recordId);
            study.exams = study.exams.filter(item => item.course_id !== recordId);
          }
          body = { success: true };
        } else {
          Object.assign(study[kind][index], JSON.parse(request.postData));
          body = study[kind][index];
        }
      }
      else if (path === '/api/streaks') body = [{ type: 'prayer', current_count: 3, longest_count: 7 }];
      else if (path === '/api/bible-plans') body = [];
      else if (path.startsWith('/api/spiritual/')) {
        const kind = path.split('/').at(-1);
        if (request.method === 'POST') {
          const payload = JSON.parse(request.postData);
          const existing = kind !== 'journal' && spiritual[kind].find(item => item.log_date === payload.log_date);
          if (existing) Object.assign(existing, payload);
          else spiritual[kind].unshift({ ...payload, id: kind + '-' + (spiritual[kind].length + 1), user_id: id });
          body = existing || spiritual[kind][0];
        } else {
          const params = new URL(request.url).searchParams;
          body = spiritual[kind].filter(item => kind === 'journal' || (item.log_date >= params.get('start') && item.log_date <= params.get('end')));
        }
      }
      else if (path.startsWith('/api/analytics/')) {
        const range = new URL(request.url).searchParams.get('dateRange'); analyticsRequests.push({ path, range });
        body = path.endsWith('/productivity') ? { weeklyData: analyticsEmpty ? [] : [{ week: '2026-09-27', completed: 18 }], completionRate: 75, totalCompleted: analyticsEmpty ? 0 : 18, totalTasks: analyticsEmpty ? 0 : 24 } : { hoursPerSubject: analyticsEmpty ? [] : [{ subject: 'Data Structures', hours: 4.17, minutes: 250 }, { subject: 'Mathematics', hours: 2, minutes: 120 }], sessionsPerWeek: analyticsEmpty ? [] : [{ week: '2026-09-27', sessions: 5 }] };
        if (analyticsFailure) body = { error: 'Analytics unavailable.' };
      }
      else if (path === '/api/dashboard/summary') body = { data: { activeGoals: plans.goals.filter(goal => goal.status === 'active').length, totalTodayTasks: tasks.length, completedTodayTasks: tasks.filter(task => task.status === 'done').length, focusMinutesToday: 0, studyHoursThisWeek: 0, upcomingTasks: tasks, goalsProgress: plans.goals.filter(goal => goal.status === 'active') } };
      else if (/^\/api\/(goals|projects)/.test(path)) {
        const [, , kind, record, action] = path.split('/');
        const data = request.postData ? JSON.parse(request.postData) : {};
        if (!record && request.method === 'POST') { body = { ...data, id, progress: 0 }; plans[kind].push(body); }
        else if (!record) body = plans[kind];
        else if (record === 'milestones') { milestones[kind][0].completed = !milestones[kind][0].completed; plans[kind][0].progress = kind === 'goals' ? 100 : 0; body = milestones[kind][0]; }
        else if (action === 'milestones' && request.method === 'POST') { body = { ...data, id, completed: false }; milestones[kind].push(body); }
        else if (action === 'milestones') body = milestones[kind];
        else if (request.method === 'DELETE') { plans[kind] = []; milestones[kind] = []; body = { success: true }; }
        else if (request.method === 'PUT') { Object.assign(plans[kind][0], data); body = plans[kind][0]; }
        else body = plans[kind][0];
      }
      else if (path === '/api/focus-sessions') {
        if (request.method === 'POST') { const payload = JSON.parse(request.postData); let record = focusSessions.find(item => item.client_session_id === payload.client_session_id); if (!record) { record = { ...payload, id: 'focus-' + (focusSessions.length + 1) }; focusSessions.unshift(record); } body = record; }
        else body = analyticsEmpty ? [] : focusSessions;
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode: request.method === 'OPTIONS' ? 200 : analyticsFailure && path.startsWith('/api/analytics/') ? 503 : spiritualFailure && path.startsWith('/api/spiritual/') ? 503 : body === undefined ? 404 : 200, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: '*' },
      ], body: Buffer.from(JSON.stringify(body ?? { error: 'Record not found' })).toString('base64') }, message.sessionId);
    }
  };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  async function waitFor(expression) {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 200)); }
    throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
  }
  const hasText = text => `document.body?.innerText?.includes(${JSON.stringify(text)})`;
  const click = text => evaluate(`(() => { const el = [...document.querySelectorAll('[role="button"],button')].find(el => el.textContent.trim() === ${JSON.stringify(text)} || el.getAttribute('aria-label') === ${JSON.stringify(text)}); if (!el) throw new Error('Button missing: '+${JSON.stringify(text)}); el.click(); })()`);
  const input = (label, value) => evaluate(`(() => {const el=document.querySelector('input[aria-label="${label}"],textarea[aria-label="${label}"]'); if(!el)throw new Error('Input missing'); Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  async function screenshot(name) {
    await waitFor('[...document.images].every(image => image.complete)');
    await new Promise(resolve => setTimeout(resolve, 300));
    const { data } = await command('Page.captureScreenshot', { format: 'png' });
    await writeFile(resolve(artifacts, name + '.png'), Buffer.from(data, 'base64'));
  }
  await command('Runtime.enable'); await command('Page.enable');
  await command('Fetch.enable', { patterns: [{ urlPattern: '*localhost:4000/api/*' }] });
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await command('Page.navigate', { url: 'http://127.0.0.1:8796' });
  await waitFor(hasText('A better you. Every day.')); await screenshot('welcome');
  await click('Get Started'); await waitFor(hasText('Create Account')); await screenshot('signup-light');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await new Promise(resolve => setTimeout(resolve, 400)); await screenshot('signup-dark');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await input('Full name', 'Alex'); await input('Email address', 'alex@example.test'); await input('Password', 'test-password-123');
  await click('Create Account'); await waitFor(hasText('Verify Your Email'));
  await waitFor(hasText('We sent a 6-digit code to alex@example.test'));
  await waitFor(`document.querySelector('[aria-label^="Resend code in "]')?.getAttribute('aria-disabled') === 'true'`);
  assert.equal(await evaluate(`document.querySelectorAll('input[aria-label^="Code digit "]').length`), 6);
  await screenshot('verify-email-light');
  for (let index = 1; index <= 6; index++) {
    await input(`Code digit ${index}`, String(index));
    await waitFor(`document.querySelector('input[aria-label="Code digit ${index}"]').value === "${index}"`);
  }
  await waitFor(hasText('Choose Your Focus'));
  await waitFor(`document.querySelector('[role="button"][aria-disabled="true"]') !== null`);
  await screenshot('onboarding-light');
  await evaluate(`document.querySelector('[role="checkbox"][aria-label="Goals"]').click()`);
  await waitFor(`document.querySelector('[role="checkbox"][aria-label="Goals"]').getAttribute('aria-checked') === 'true'`);
  await evaluate(`document.querySelector('[role="checkbox"][aria-label="Goals"]').click()`);
  await waitFor(`document.querySelector('[role="checkbox"][aria-label="Goals"]').getAttribute('aria-checked') === 'false'`);

  for (const label of ['Goals', 'Tasks', 'Focus Timer']) await evaluate(`document.querySelector('[role="checkbox"][aria-label="${label}"]').click()`);
  await waitFor(`document.querySelectorAll('[role="checkbox"][aria-checked="true"]').length === 3`);
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  preferences = { ...preferences, theme: 'dark' };
  await command('Page.reload'); await waitFor(hasText('Choose Your Focus'));
  for (const label of ['Goals', 'Tasks', 'Focus Timer']) await evaluate(`document.querySelector('[role="checkbox"][aria-label="${label}"]').click()`);
  await screenshot('onboarding-dark');
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await click('Continue'); await waitFor(hasText("You're All Set!"));
  if (preferences.onboarded !== false || preferences.focusAreas.length !== 3) throw new Error('Focus selection must save without completing onboarding');
  await screenshot('onboarding-complete-dark');
  preferences = { ...preferences, theme: 'light' };
  await command('Page.reload'); await waitFor(hasText("You're All Set!"));
  await screenshot('onboarding-complete-light');
  await click('Go to Dashboard'); await waitFor(hasText('Nothing coming up'));
  if (preferences.onboarded !== true) throw new Error('Completion flag was not saved');
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/onboarding-complete' });
  await waitFor(hasText('Nothing coming up'));
  if (await evaluate(hasText("You're All Set!"))) throw new Error('Completed onboarding remains accessible'); await screenshot('dashboard-empty');
  await evaluate(`document.querySelector('[aria-label="Quick add"]').click()`);
  await waitFor(hasText('Quick add'));
  await evaluate(`document.querySelector('[aria-label="Close quick add"]').click()`);

  await click('Add Task'); await waitFor(hasText('Make a little plan.')); await input('What needs doing?', 'Read a chapter');
  await click('Save task'); await waitFor(hasText('Read a chapter'));
  await evaluate(`document.querySelector('[role="checkbox"]').click()`);
  await waitFor(`document.querySelector('[role="checkbox"]').getAttribute('aria-checked') === 'true'`);
  assert.equal(tasks[0].status, 'done'); await screenshot('dashboard-task');
  for (const kind of ['goals', 'projects']) {
    const singular = kind === 'goals' ? 'goal' : 'project';
    await command('Page.navigate', { url: `http://127.0.0.1:8796/${kind}` });
    await waitFor(hasText(kind === 'goals' ? 'Create Goal' : 'Create Project')); await click(kind === 'goals' ? 'Create Goal' : 'Create Project');
    await waitFor(`!!document.querySelector('input[aria-label="${kind === 'goals' ? 'Title' : 'Project Name'}"]')`);
    await input(kind === 'goals' ? 'Title' : 'Project Name', kind === 'goals' ? 'Become a better developer' : 'TrackSense MVP');
    if (kind === 'projects') {
      await evaluate(`document.querySelector('[aria-label="Choose project deadline"]').click()`);
      await waitFor(`!!document.querySelector('[aria-label^="Select deadline "]')`);
      await evaluate(`document.querySelector('[aria-label^="Select deadline "]').click()`);
      await screenshot('projects-create-light');
      await evaluate(`([...document.querySelectorAll('[role="button"]')].filter(el => el.textContent.trim() === 'Create Project')).at(-1).click()`);
    } else await click(`Save ${singular}`); await waitFor(hasText(kind === 'goals' ? 'Become a better developer' : 'TrackSense MVP'));
    await screenshot(kind + '-list');
    await evaluate(`document.querySelector('[aria-label="${kind === 'goals' ? 'Become a better developer' : 'TrackSense MVP'}"]').click()`);
    await waitFor(hasText('New milestone')); if (kind === 'goals') await click('New milestone'); await input('New milestone', 'Finish the first step'); await click('Add milestone');
    await waitFor(hasText('Finish the first step'));
    await evaluate(`document.querySelector('[role="checkbox"]').click()`);
    await waitFor(`document.querySelector('[role="checkbox"]').getAttribute('aria-checked') === 'true'`);
    await screenshot(kind + '-detail');
    await click(`Edit ${singular}`); await waitFor(hasText(`Save ${singular}`));
    await input('Title', 'Updated ' + singular); await click(`Save ${singular}`); await waitFor(hasText('Updated ' + singular));
    await click('Add linked task'); await waitFor(hasText('Make a little plan.'));
    await input('What needs doing?', 'Task for ' + singular); await click('Save task'); await waitFor(hasText('Updated ' + singular));
    assert.equal(tasks.at(-1)[kind === 'goals' ? 'goal_id' : 'project_id'], id);
    await click(`Delete ${singular}`); await waitFor(hasText('Confirm delete')); await click('Keep it');
    assert.equal(plans[kind].length, 1);
    await click(`Delete ${singular}`); await click('Confirm delete'); await waitFor(hasText(kind === 'goals' ? 'Create Goal' : 'Create Project'));
  }
  await command('Page.navigate', { url: 'http://127.0.0.1:8796' }); await waitFor(hasText("Upcoming"));
  await evaluate(`[...document.querySelectorAll('[role=tab],a')].find(el => el.textContent.trim() === 'Profile').click()`); await waitFor(hasText('Edit Profile'));
  await click('Theme'); await waitFor(hasText('Appearance')); await click('Dark'); await screenshot('profile-dark');
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/goals' });
    await waitFor(hasText('No goals yet'));
    await screenshot('reference-goals-empty-' + theme);
    const action = await evaluate(`(() => { const el = [...document.querySelectorAll('[role=button]')].find(el => el.textContent.trim() === 'Create Goal'); const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; })()`);
    assert.ok(action.width >= 120 && action.height >= 44, 'Empty goal action is a comfortable visible button');
  }
  // Populated visual review fixtures only; nothing is written to a real account.
  plans.goals = [
    { id: 'goal-career', title: 'Become a better developer', category: 'Career', status: 'active', progress: 75, deadline: '2026-12-31T12:00:00Z', description: 'Build confidence through consistent practice and meaningful projects.' },
    { id: 'goal-spiritual', title: 'Maintain spiritual consistency', category: 'Spiritual', status: 'active', progress: 40, deadline: '2026-12-01T12:00:00Z' },
    { id: 'goal-academic', title: 'Improve academic performance', category: 'Academic', status: 'active', progress: 60, deadline: '2026-11-15T12:00:00Z' },
    { id: 'goal-financial', title: 'Build financial discipline', category: 'Financial', status: 'active', progress: 20, deadline: '2026-12-31T12:00:00Z' },
  ];
  milestones.goals = [
    { id: 'm1', title: 'Finish the fundamentals course', completed: true },
    { id: 'm2', title: 'Build a responsive portfolio', completed: true },
    { id: 'm3', title: 'Complete a real-world project', completed: true },
    { id: 'm4', title: 'Publish and share my work', completed: false },
  ];
  plans.projects = [{ id: 'project-one', title: 'TrackSense MVP', status: 'active', progress: 72 }];
  tasks.splice(0, tasks.length, ...[
    { id: 'task-one', title: 'Finish UI design', status: 'todo', priority: 'high', goal_id: 'goal-career', due_date: new Date().toISOString() },
    { id: 'task-two', title: 'Read a chapter', status: 'done', priority: 'medium', due_date: new Date().toISOString() },
    { id: 'task-three', title: 'Plan tomorrow', status: 'todo', priority: 'low', due_date: new Date().toISOString() },
  ]);
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme, focusAreas: ['Goals', 'Tasks', 'Projects', 'Focus'] };
    for (const [path, text, name] of [['/', "Today's Progress", 'dashboard'], ['/goals', 'Maintain spiritual consistency', 'goals'], ['/goal/detail?goalId=goal-career', 'Your progress', 'goal-detail']]) {
      await command('Page.navigate', { url: 'http://127.0.0.1:8796' + path });
      await waitFor(hasText(text));
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'No horizontal overflow');
      await screenshot('reference-' + name + '-' + theme);
      if (name === 'goals') {
        await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Completed')).click()`);
        await waitFor(hasText('No goals yet'));
        await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'All')).click()`);
        await waitFor(hasText('Become a better developer'));
      }

      if (path === '/') {
        const scrollOffsets = await evaluate(`(() => { const nodes = [...document.querySelectorAll('div')].filter(el => el.clientHeight > 100 && el.scrollHeight > el.clientHeight + 100 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)); return nodes.map(el => { el.scrollTop = 600; return el.scrollTop; }); })()`);
        assert.ok(scrollOffsets.some(value => value > 0), 'Dashboard content scrolls');
        await screenshot('reference-dashboard-sections-' + theme);
      }
    }
  }
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/tasks' });
    await waitFor(hasText('Finish UI design'));
    await screenshot('tasks-list-' + theme);
    const selectTab = label => evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === '${label}')).click()`);
    await selectTab('All'); await waitFor(hasText('Plan tomorrow'));
    await selectTab('This Week'); await waitFor(hasText('Plan tomorrow'));
    await selectTab('Kanban'); await waitFor(hasText('To Do'));
    await screenshot('tasks-kanban-' + theme);
    await click('Start task');
    await waitFor(`document.body.innerText.includes('In Progress')`);
    for (let attempt = 0; attempt < 30 && !tasks.some(task => task.status === 'in_progress'); attempt++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(tasks.some(task => task.status === 'in_progress'));
    await new Promise(resolve => setTimeout(resolve, 300));
    await selectTab('Calendar'); await waitFor(`document.querySelector('[aria-label="Next month"]') !== null`);
    await screenshot('tasks-calendar-' + theme);
    await evaluate(`document.querySelector('[aria-label="Next month"]').click()`);
    await evaluate(`document.querySelector('[aria-label="Previous month"]').click()`);
  }
  preferences = { ...preferences, theme: 'light' };
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/courses' });
  await waitFor(hasText('No courses yet'));
  await evaluate(`document.querySelector('[aria-label="Add course"]').click()`);
  await input('Course Code', 'CSC 301'); await input('Course Name', 'Data Structures');
  await click('Create Course'); await waitFor(hasText('Data Structures'));
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Course list has no horizontal overflow');

  // Per-course options menu: edit first, then a destructive delete later.
  await evaluate(`document.querySelector('[aria-label="Course options for Data Structures"]').click()`);
  await waitFor(hasText('COURSE OPTIONS'));
  assert.equal(await evaluate(`(() => { const el = [...document.querySelectorAll('div,span')].filter(el => el.textContent.trim() === 'Delete Course').at(-1); return el ? getComputedStyle(el).color : null; })()`), 'rgb(239, 68, 68)');
  await screenshot('course-actions-light');
  await click('Edit Course'); await waitFor(hasText('Edit Course'));
  assert.equal(await evaluate(`document.querySelector('input[aria-label="Course Code"]').value`), 'CSC 301');
  await input('Course Code', 'CSC 302'); await click('Save Course'); await waitFor(hasText('CSC 302'));
  assert.equal(study.courses[0].code, 'CSC 302');
  await waitFor(`document.querySelector('[aria-label="Course options for Data Structures"]') !== null`);

  // Course details start with no assignments and no scheduled exam.
  await evaluate(`document.querySelector('[aria-label="Data Structures"]').click()`);
  await waitFor(hasText('Course Progress'));
  await waitFor(hasText('No upcoming exam scheduled'));
  await waitFor(hasText('No assignments yet'));
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Course details have no horizontal overflow');
  assert.ok(await evaluate(`document.querySelector('[aria-label="0 percent complete"]') !== null`));

  const dayFromNow = offset => { const value = new Date(); value.setDate(value.getDate() + offset); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; };
  const addCourseAssignment = async (name, offset, scores) => {
    await evaluate(`document.querySelector('[aria-label="Add Assignment"]').click()`);
    await waitFor(`!!document.querySelector('input[aria-label="Assignment Name"]')`);
    await input('Assignment Name', name);
    await input('Due Date', dayFromNow(offset));
    if (scores) {
      await input('Earned Score', String(scores.earned));
      await input('Total Score', String(scores.total));
    }
    await click('Save assignment');
    await waitFor(`document.querySelector('input[aria-label="Assignment Name"]') === null`);
    await waitFor(hasText(name));
  };
  const addChecklistEntry = async (entryLabel, title) => {
    await evaluate(`document.querySelector('[aria-label="Add ${entryLabel}"]').click()`);
    await waitFor(`!!document.querySelector('input[aria-label="${entryLabel} title"]')`);
    await input(`${entryLabel} title`, title);
    await evaluate(`document.querySelector('[aria-label="Save ${entryLabel.toLowerCase()}"]').click()`);
    await waitFor(hasText(title));
  };
  await addCourseAssignment('Problem set 1', 2);
  await waitFor(hasText('0 of 1 assignment complete'));
  await evaluate(`document.querySelector('[aria-label="Toggle Problem set 1"]').click()`);
  await waitFor(hasText('1 of 1 assignment complete'));
  assert.ok(await evaluate(`document.querySelector('[aria-label="100 percent complete"]') !== null`));
  assert.equal(study.assignments[0].status, 'submitted');
  await screenshot('course-detail-progress-light');

  // Course health combines assignments and topics, and tracks module position.
  await waitFor(hasText('On Track'));
  await waitFor(hasText('0 / 0 Topics Done'));
  await addChecklistEntry('Topic', 'Arrays');
  await waitFor(hasText('0 / 1 Topics Done'));
  assert.ok(await evaluate(`document.querySelector('[aria-label="50 percent complete"]') !== null`), 'Topics count toward combined progress');
  await evaluate(`document.querySelector('[aria-label="Toggle topic Arrays"]').click()`);
  await waitFor(hasText('1 / 1 Topics Done'));
  await waitFor(`document.querySelector('[aria-label="100 percent complete"]') !== null`);
  await addChecklistEntry('Module', 'Foundations');
  await waitFor(hasText('Module 1 of 1'));
  assert.equal(study.courses[0].topics[0].completed, true);
  assert.equal(study.courses[0].modules.length, 1);

  // New assignments sort by due date rather than insertion order.
  await addCourseAssignment('Later paper', 10);
  await addCourseAssignment('Earlier quiz', 1);
  assert.deepEqual(
    await evaluate(`[...document.querySelectorAll('[aria-label^="Toggle "]')].map(el => el.getAttribute('aria-label').slice(7)).filter(label => !label.startsWith('topic ') && !label.startsWith('module '))`),
    ['Earlier quiz', 'Problem set 1', 'Later paper'],
  );

  // Graded work feeds the cumulative course score pill.
  await addCourseAssignment('Graded quiz', 3, { earned: 8, total: 10 });
  await waitFor(hasText('Current Score: 80%'));
  await waitFor(hasText('8 / 10'));
  assert.equal(study.assignments.find(item => item.title === 'Graded quiz').status, 'graded');
  await evaluate(`document.querySelector('[aria-label="Close course details"]').click()`);

  // An exam created through the main form appears in the course countdown.
  await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Exams')).click()`);
  await evaluate(`document.querySelector('[aria-label="Add exam"]').click()`);
  await input('Exam Type / Subject', 'Final Exam');
  await input('Date (YYYY-MM-DD)', dayFromNow(2));
  await evaluate(`([...document.querySelectorAll('[role="radio"]')].find(el => el.textContent === 'Data Structures')).click()`);
  await click('Create Exam');
  await waitFor(hasText('Final Exam'));
  assert.equal(study.assignments[0].course_id, study.courses[0].id);
  assert.equal(study.exams[0].course_id, study.courses[0].id);

  // The Assignments tab uses the same ascending due-date order.
  await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Assignments')).click()`);
  await waitFor(hasText('Earlier quiz'));
  assert.deepEqual(
    await evaluate(`(() => { const titles = ['Earlier quiz', 'Problem set 1', 'Later paper']; return titles.map(text => ({ text, y: [...document.querySelectorAll('div,span')].find(el => el.textContent.trim() === text).getBoundingClientRect().y })).sort((a, b) => a.y - b.y).map(item => item.text); })()`),
    ['Earlier quiz', 'Problem set 1', 'Later paper'],
  );

  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/courses' });
    await waitFor(hasText('Data Structures'));
    for (const tab of ['Courses', 'Assignments', 'Exams']) {
      await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === '${tab}')).click()`);
      await screenshot('study-' + tab.toLowerCase() + '-' + theme);
    }
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Courses')).click()`);
    await waitFor(hasText('Data Structures'));
    await evaluate(`document.querySelector('[aria-label="Data Structures"]').click()`);
    await waitFor(hasText('Course Progress'));
    await waitFor(`document.querySelector('[aria-label="Exam in 2 days for Final Exam"]') !== null`);
    assert.equal(await evaluate(`(() => { const el = [...document.querySelectorAll('div')].find(el => el.textContent.trim() === 'Exam in 2 days'); return el ? getComputedStyle(el).color : null; })()`), 'rgb(255, 77, 77)');
    await screenshot('study-course-detail-' + theme);
    await evaluate(`document.querySelector('[aria-label="Close course details"]').click()`);
  }

  // Delete confirmation removes the course and its assignments and exams.
  preferences = { ...preferences, theme: 'light' };
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/courses' });
  await waitFor(hasText('Data Structures'));
  await evaluate(`window.confirm = () => true`);
  await evaluate(`document.querySelector('[aria-label="Course options for Data Structures"]').click()`);
  await waitFor(hasText('COURSE OPTIONS'));
  await click('Delete Course');
  await waitFor(hasText('No courses yet'));
  assert.equal(study.courses.length, 0);
  assert.equal(study.assignments.length, 0);
  assert.equal(study.exams.length, 0);

  // Unread badge, Profile alert cards, mark-as-read, and alert navigation.
  notifications = [
    { id: 'alert-task', user_id: id, type: 'task_due', related_id: 'task-1', title: 'Task due today', message: 'Finish UI design before the day ends.', is_read: false, created_at: new Date().toISOString() },
    { id: 'alert-exam', user_id: id, type: 'exam_soon', related_id: 'exam-1', title: 'Exam coming up', message: 'Final Exam is in 2 days.', is_read: false, created_at: new Date().toISOString() },
  ];
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/tasks' });
  await waitFor(hasText('Finish UI design'));
  await waitFor(`document.querySelector('[aria-label="2 unread alerts"]') !== null`);
  await screenshot('notification-badge-light');
  await evaluate(`document.querySelector('[data-testid="bottom-tab-profile"]').click()`);
  await waitFor(hasText('Recent Alerts'));
  await waitFor(hasText('Task due today'));
  await waitFor(`document.querySelector('[aria-label="2 unread alerts"]') === null`);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Profile alerts have no horizontal overflow');
  for (let attempt = 0; attempt < 30 && !notifications.every(item => item.is_read); attempt++) await new Promise(resolve => setTimeout(resolve, 100));
  assert.ok(notifications.every(item => item.is_read));
  await screenshot('profile-alerts-light');
  await evaluate(`document.querySelector('[aria-label="Task due today"]').click()`);
  await waitFor(hasText('Finish UI design'));
  assert.equal(await evaluate(`document.querySelector('[data-testid="bottom-tab-tasks"]').getAttribute('aria-selected')`), 'true');
  assert.equal(await evaluate(`new URL(location.href).searchParams.get('relatedId')`), 'task-1', 'Alert deep-link carries its related record');
  preferences = { ...preferences, theme: 'light' };
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/spiritual' });
  await waitFor(hasText('No activities this week')); await screenshot('spiritual-empty-light');
  await evaluate(`([...document.querySelectorAll('[role="button"],button')].filter(el => el.textContent.trim() === 'Log Activity')).at(-1).click()`);
  await waitFor(`!!document.querySelector('textarea[aria-label="Reflection notes"]:not([readonly])')`);
  await input('Reflection notes', 'Quiet time and gratitude.');
  await evaluate(`([...document.querySelectorAll('[role="button"],button')].filter(el => el.textContent.trim() === 'Log Activity')).at(-1).click()`);
  await waitFor(`!!document.querySelector('[aria-label="Devotion: 1 of 7 days"]')`);
  assert.equal(spiritual.devotion[0].notes, 'Quiet time and gratitude.');
  await evaluate(`document.querySelector('[aria-label="Log activity"]').click()`);
  await waitFor(`document.querySelector('textarea[aria-label="Reflection notes"]')?.value === 'Quiet time and gratitude.'`);
  await input('Reflection notes', 'Quiet time and gratitude. An updated note.');
  await evaluate(`([...document.querySelectorAll('[role="button"],button')].filter(el => el.textContent.trim() === 'Log Activity')).at(-1).click()`);
  await waitFor(`!document.querySelector('[aria-label="Close activity form"]')`);
  assert.equal(spiritual.devotion.length, 1, 'Devotion upsert must not duplicate a day');
  assert.equal(spiritual.devotion[0].notes, 'Quiet time and gratitude. An updated note.');
  await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Journal')).click()`);
  await waitFor(hasText('No reflections yet')); await screenshot('spiritual-journal-empty-light');
  await click('New Reflection');
  await input('Reflection title', 'Finding stillness');
  await input('Reflection notes', 'Today I made room for quiet prayer. I am grateful for the small moments of kindness and the chance to begin again.');
  await input('Reflection tags', 'gratitude, prayer');
  await evaluate(`document.querySelector('[aria-label="Grateful"]').click()`);
  await click('Save Reflection'); await waitFor(hasText('Finding stillness'));
  await waitFor(`!document.querySelector('[aria-label="Close activity form"]')`);
  assert.equal(spiritual.journal.length, 1);
  assert.equal(spiritual.journal[0].mood, '\u{1F64F}');
  assert.deepEqual(spiritual.journal[0].tags, ['gratitude', 'prayer']);
  await evaluate(`document.querySelector('[aria-label="Finding stillness"]').click()`);
  await waitFor(hasText('the chance to begin again.')); await screenshot('spiritual-reflection-detail-light');
  await evaluate(`document.querySelector('[aria-label="Close reflection"]').click()`);
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/spiritual' });
    await waitFor(`!!document.querySelector('[aria-label="Devotion: 1 of 7 days"]')`);
    await new Promise(resolve => setTimeout(resolve, 700));
    await evaluate(`window.scrollTo(0, 0); document.querySelectorAll('div').forEach(el => { if (el.scrollHeight > el.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el.scrollTop = 0; })`);
    await screenshot('spiritual-overview-' + theme);
    await evaluate(`document.querySelectorAll('div').forEach(el => { if (el.scrollHeight > el.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el.scrollTop = 600; })`);
    await screenshot('spiritual-overview-lower-' + theme);
    await evaluate(`document.querySelector('[aria-label="Log activity"]').click()`);
    await waitFor(`document.querySelector('textarea[aria-label="Reflection notes"]')?.value === 'Quiet time and gratitude. An updated note.'`);
    await screenshot('spiritual-log-' + theme);
    await evaluate(`document.querySelector('[aria-label="Close activity form"]').click()`);
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Journal')).click()`);
    await waitFor(hasText('Finding stillness')); await new Promise(resolve => setTimeout(resolve, 700));
    await evaluate(`window.scrollTo(0, 0)`); await screenshot('spiritual-journal-' + theme);
  }
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/spiritual/journal' });
  await waitFor(hasText('Finding stillness'));
  await waitFor(`location.pathname.includes('/spiritual/journal') && document.body.innerText.includes('New Reflection')`);
  // Simulate a failed service: errors must not masquerade as an empty journal.
  spiritualFailure = true;
  await command('Page.reload'); await waitFor(hasText('Your reflections could not be loaded.'));
  assert.equal(await evaluate(hasText('No reflections yet')), false);
  spiritualFailure = false; await click('Retry journal'); await waitFor(hasText('Finding stillness'));
  // Projects presentation fixtures; existing CRUD was exercised above.
  const projectFixtures = [
    { id: 'project-one', title: 'TrackSense MVP', status: 'active', progress: 72, taskCount: 25, completedTaskCount: 18, milestoneCount: 4, deadline: '2026-12-30T23:59:00Z' },
    { id: 'project-two', title: 'Portfolio Website', status: 'in_progress', progress: 40, taskCount: 10, completedTaskCount: 4, milestoneCount: 3, deadline: '2026-12-15T23:59:00Z' },
    { id: 'project-three', title: 'Mobile App Concept', status: 'on_hold', progress: 20, taskCount: 5, completedTaskCount: 1, milestoneCount: 2, deadline: '2020-01-01T23:59:00Z' },
    { id: 'project-four', title: 'Research Project', status: 'completed', progress: 100, taskCount: 8, completedTaskCount: 8, milestoneCount: 3, deadline: '2020-01-01T23:59:00Z' },
    { id: 'project-five', title: 'Next Semester Plan', status: 'planning', progress: 0, taskCount: 0, completedTaskCount: 0, milestoneCount: 0 },
  ];
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    plans.projects = [];
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/projects' });
    await waitFor(hasText('No projects yet')); await screenshot('projects-empty-' + theme);
    await evaluate(`document.querySelector('[aria-label="Add project"]').click()`);
    await waitFor(hasText('New Project')); await screenshot('projects-create-' + theme);
    await click('Cancel'); await waitFor(hasText('No projects yet'));
    plans.projects = projectFixtures.map(item => ({ ...item }));
    await command('Page.reload'); await waitFor(hasText('TrackSense MVP'));
    await new Promise(resolve => setTimeout(resolve, 600)); await screenshot('projects-populated-' + theme);
    assert.ok(await evaluate(hasText('18/25 tasks')));
    assert.ok(await evaluate(hasText('4 milestones')));
    assert.ok(await evaluate(hasText('Overdue')));
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Active')).click()`);
    await waitFor(`!document.body.innerText.includes('Mobile App Concept')`);
    assert.ok(await evaluate(hasText('TrackSense MVP'))); assert.ok(await evaluate(hasText('Portfolio Website')));
    assert.equal(await evaluate(hasText('Next Semester Plan')), false);
    await screenshot('projects-active-' + theme);
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Completed')).click()`);
    await waitFor(hasText('Research Project'));
    assert.equal(await evaluate(hasText('TrackSense MVP')), false);
    assert.equal(await evaluate(hasText('Overdue')), false, 'Completed project is not marked overdue');
    await screenshot('projects-completed-' + theme);
  }
  // Focus UI uses the existing wall-clock session, including restoration and explicit save.
  const reloadFocus = async () => { const origin = await evaluate('performance.timeOrigin'); await command('Page.reload'); await waitFor(`performance.timeOrigin > ${origin}`); };
  preferences = { ...preferences, theme: 'light' };
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/focus' });
  await waitFor(hasText('25:00'));
  await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Sessions')).click()`);
  await waitFor(hasText('No sessions yet')); await screenshot('focus-sessions-empty-light');
  await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Timer')).click()`);
  await screenshot('focus-timer-light');
  await click('Start'); await waitFor(`!!document.querySelector('[aria-label="Pause"]')`);
  await screenshot('focus-running-light');
  await click('Pause'); await waitFor(`!!document.querySelector('[aria-label="Resume"]')`);
  await screenshot('focus-paused-light');
  const focusKey = 'tracksense_focus_' + id;
  const pausedSession = await evaluate(`JSON.parse(localStorage.getItem('${focusKey}'))`);
  assert.equal(pausedSession.endAt, null);
  await reloadFocus(); await waitFor(`!!document.querySelector('[aria-label="Resume"]')`);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${focusKey}')).id`), pausedSession.id);
  await click('Resume'); await waitFor(`!!document.querySelector('[aria-label="Pause"]')`);
  await reloadFocus(); await waitFor(`!!document.querySelector('[aria-label="Pause"]')`);
  await evaluate(`document.querySelector('[aria-label="Reset focus timer"]').click()`); await waitFor(hasText('25:00'));
  await evaluate(`document.querySelector('[aria-label="Timer settings"]').click()`);
  await waitFor(hasText('Timer Settings')); await screenshot('focus-settings-light');
  await input('Duration in minutes', '1'); await click('Apply duration'); await waitFor(hasText('01:00'));
  await click('Start'); await waitFor(`!!document.querySelector('[aria-label="Pause"]')`);
  const ending = await evaluate(`(() => { const session=JSON.parse(localStorage.getItem('${focusKey}')); session.endAt=Date.now()-1000; localStorage.setItem('${focusKey}',JSON.stringify(session)); return session; })()`);
  await reloadFocus(); await waitFor(hasText('Session Complete!'));
  assert.equal(focusSessions.length, 0, 'Completion must retain explicit saving');
  await screenshot('focus-complete-light'); await click('Save completed session');
  await waitFor(hasText('Session saved. A small step forward.'));
  assert.equal(focusSessions.length, 1); assert.equal(focusSessions[0].client_session_id, ending.id);
  assert.equal(focusSessions[0].duration, 1); assert.equal(focusSessions[0].completed_at, new Date(ending.endAt).toISOString());
  assert.equal(await evaluate(`localStorage.getItem('${focusKey}')`), null);
  focusSessions.push({ id: 'focus-fixture', type: 'pomodoro', task_title: 'Finish UI design', duration: 25, completed_at: new Date().toISOString() });
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/focus' }); await waitFor(hasText('25:00'));
    await new Promise(resolve => setTimeout(resolve, 500)); await screenshot('focus-timer-' + theme);
    if (theme === 'dark') {
      await evaluate(`document.querySelector('[aria-label="Timer settings"]').click()`);
      await waitFor(hasText('Timer Settings')); await screenshot('focus-settings-dark');
      await evaluate(`document.querySelector('[aria-label="Close timer settings"]').click()`);
      await click('Start'); await waitFor(`!!document.querySelector('[aria-label="Pause"]')`); await screenshot('focus-running-dark');
      await click('Pause'); await waitFor(`!!document.querySelector('[aria-label="Resume"]')`); await screenshot('focus-paused-dark');
      await evaluate(`document.querySelector('[aria-label="Reset focus timer"]').click()`); await waitFor(hasText('25:00'));
    }
    await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === 'Sessions')).click()`);
    await waitFor(hasText('25 min')); await waitFor(hasText('Finish UI design')); await new Promise(resolve => setTimeout(resolve, 900)); await evaluate('window.scrollTo(0, 0)'); await screenshot('focus-sessions-' + theme);
  }
  for (const theme of ['light', 'dark']) {
    preferences = { ...preferences, theme };
    await command('Page.navigate', { url: 'http://127.0.0.1:8796/analytics' });
    await waitFor(hasText('18 completed')); await new Promise(resolve => setTimeout(resolve, 500));
    for (const tab of ['Overview', 'Time', 'Goals', 'Study']) {
      await evaluate(`([...document.querySelectorAll('[role="tab"]')].find(el => el.textContent === '${tab}')).click()`);
      await waitFor(hasText(tab === 'Overview' ? '18 completed' : tab === 'Time' ? 'Best recorded day:' : tab === 'Goals' ? 'Become a better developer' : 'Data Structures'));
      await evaluate(`window.scrollTo(0, 0); document.querySelectorAll('div').forEach(el => { if (el.scrollHeight > el.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el.scrollTop = 0; })`);
      await new Promise(resolve => setTimeout(resolve, 500));
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Analytics fits viewport');
      await screenshot('analytics-' + tab.toLowerCase() + '-' + theme);
      if (tab === 'Overview') {
        await evaluate(`document.querySelectorAll('div').forEach(el => { if (el.scrollHeight > el.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY)) el.scrollTop = 600; })`);
        await screenshot('analytics-overview-lower-' + theme);
      }
    }
    await evaluate(`document.querySelector('[aria-label="Choose analytics date range"]').click()`);
    await waitFor(hasText('Date Range')); await screenshot('analytics-range-' + theme);
    await evaluate(`([...document.querySelectorAll('[role="radio"]')].find(el => el.textContent === 'This Month')).click()`);
    await click('Apply'); await waitFor(`!document.querySelector('[aria-label="Close date range"]')`);
    for (let attempt = 0; attempt < 30 && !analyticsRequests.some(item => item.range === 'month' && item.path.endsWith('/study')); attempt++) await new Promise(resolve => setTimeout(resolve, 100));
    assert.ok(analyticsRequests.some(item => item.range === 'month' && item.path.endsWith('/study')));
    assert.ok(analyticsRequests.some(item => item.range === 'month' && item.path.endsWith('/productivity')));
  }
  analyticsEmpty = true;
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/analytics' });
  await waitFor(hasText('No data yet')); await screenshot('analytics-empty-dark');
  analyticsEmpty = false; analyticsFailure = true;
  await command('Page.reload'); await waitFor(hasText('Analytics unavailable.'));
  await screenshot('analytics-error-dark'); analyticsFailure = false;
  await click('Try again'); await waitFor(hasText('18 completed'));
  // Bottom-navigation geometry at physical-device CSS widths. Real Android
  // system insets/font scaling still require a device; these are web fixtures.
  const navigationMeasurements = [];
  for (const width of [390, 320]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: true });
    for (const theme of ['light', 'dark']) {
      preferences = { ...preferences, theme };
      for (const [path, active, ready] of [['/', 'index', "Today's Progress"], ['/profile', 'profile', 'Edit Profile']]) {
        await command('Page.navigate', { url: 'http://127.0.0.1:8796' + path });
        await waitFor(hasText(ready));
        await waitFor(`document.querySelector('[data-testid="bottom-tab-${active}"]')?.getAttribute('aria-selected') === 'true'`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const metrics = await evaluate(`(() => {
          const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
          const names = ['index', 'tasks', 'focus', 'analytics', 'profile'];
          const bar = document.querySelector('[data-testid="bottom-navigation"]');
          const barStyle = getComputedStyle(bar);
          return { bar: rect(bar), paddingBottom: parseFloat(barStyle.paddingBottom), paddingLeft: parseFloat(barStyle.paddingLeft), paddingRight: parseFloat(barStyle.paddingRight), slots: names.map(name => {
            const item = document.querySelector('[data-testid="bottom-tab-' + name + '"]');
            const icon = document.querySelector('[data-testid="bottom-icon-' + name + '"]');
            const label = document.querySelector('[data-testid="bottom-label-' + name + '"]');
            const range = document.createRange(); range.selectNodeContents(label);
            return { name, item: rect(item), icon: rect(icon), label: rect(label), text: rect(range), fontSize: getComputedStyle(label).fontSize, lineHeight: getComputedStyle(label).lineHeight, scrollWidth: label.scrollWidth };
          }) };
        })()`);
        const innerWidth = metrics.bar.width - metrics.paddingLeft - metrics.paddingRight;
        assert.ok(Math.abs(metrics.paddingLeft - metrics.paddingRight) < 1, 'Balanced bar edge padding');
        const firstSlot = metrics.slots[0].item; const lastSlot = metrics.slots[4].item;
        assert.ok(Math.abs(firstSlot.x - (metrics.bar.x + metrics.paddingLeft)) < 1, 'First tab respects left padding');
        assert.ok(Math.abs(lastSlot.x + lastSlot.width - (metrics.bar.x + metrics.bar.width - metrics.paddingRight)) < 1, 'Last tab respects right padding');
        for (const slot of metrics.slots) {
          assert.ok(Math.abs(slot.item.width - innerWidth / 5) < 1, 'Five equal slots');
          assert.ok(slot.item.height >= 48, 'Comfortable touch height');
          for (const element of [slot.icon, slot.label]) assert.ok(Math.abs(element.x + element.width / 2 - slot.item.x - slot.item.width / 2) < 1, 'Icon and label centered in slot');
          assert.ok(slot.text.x >= slot.item.x && slot.text.x + slot.text.width <= slot.item.x + slot.item.width, 'Label text fits inside its own slot');
          assert.ok(slot.scrollWidth <= slot.label.width + 1, 'No label overflow');
          assert.equal(slot.fontSize, metrics.slots[0].fontSize);
          assert.equal(slot.lineHeight, '14px');
        }
        const analytics = metrics.slots[3].text; const profile = metrics.slots[4].text;
        assert.ok(profile.x - analytics.x - analytics.width >= 8, 'Analytics and Profile have a visible gap');
        assert.ok(metrics.paddingBottom >= 8, 'Labels have bottom breathing room');
        const imageName = `bottom-nav-${width}-${theme}-${active}`;
        await screenshot(imageName + '-screen');
        const { data } = await command('Page.captureScreenshot', { format: 'png', clip: { ...metrics.bar, scale: 1 } });
        await writeFile(resolve(artifacts, imageName + '.png'), Buffer.from(data, 'base64'));
        navigationMeasurements.push({ width, theme, active, ...metrics });
      }
    }
  }
  await writeFile(resolve(artifacts, 'bottom-navigation-measurements.json'), JSON.stringify(navigationMeasurements, null, 2));
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await click('Sign Out'); await waitFor(hasText('Are you sure you want to sign out?')); await click('Cancel');
  assert.ok(await evaluate(hasText('Edit Profile')));
  await click('Edit Profile'); await input('Full Name','Alex Updated'); await input('Bio','Intentional growth'); await click('Save Changes'); await waitFor(hasText('Alex Updated'));
  assert.equal(profileFixture.bio,'Intentional growth');
  await click('Notifications'); await waitFor(hasText('Weekly Review'));
  await evaluate(`document.querySelector('[role=switch][aria-label="Weekly Review"]').click()`);
  await waitFor(hasText('Preferences saved. Device reminders are available in the mobile app.')); assert.equal(notificationFixture.weekly_review,false);
  await evaluate(`document.querySelector('[aria-label="Close settings"]').click()`);
  for(const theme of ['light','dark']) {
    await click('Theme'); await click(theme==='light'?'Light':'Dark'); await waitFor(hasText('Edit Profile'));
    await evaluate(`window.scrollTo(0,0);document.querySelectorAll('div').forEach(el=>{if(el.scrollHeight>el.clientHeight+10)el.scrollTop=0;})`);
    await screenshot('profile-'+theme);
    await evaluate(`document.querySelectorAll('div').forEach(el=>{if(el.scrollHeight>el.clientHeight+10)el.scrollTop=600;})`);await screenshot('profile-lower-'+theme);
    await evaluate(`document.querySelectorAll('div').forEach(el=>{if(el.scrollHeight>el.clientHeight+10)el.scrollTop=0;})`);
    for(const [label,key] of [['Edit Profile','edit'],['Notifications','notifications'],['Data & Privacy','privacy'],['About','about']]) {await click(label);await new Promise(r=>setTimeout(r,500));await screenshot('profile-'+key+'-'+theme);await evaluate(`document.querySelector('[aria-label="Close settings"]').click()`);}
  }
  await click('Sign Out'); await click('Confirm Sign Out'); await waitFor(hasText('A better you. Every day.'));

  // Password recovery: request a 10-minute code, then reset and auto-authenticate.
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/login' });
  await waitFor(hasText('Welcome Back'));
  assert.ok(await evaluate(`([...document.querySelectorAll('[role="link"]')].some(el => el.textContent.trim() === 'Forgot Password?'))`));
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/forgot-password' });
  await waitFor(hasText('Send Recovery Code'));
  await screenshot('forgot-password-light');
  await input('Email address', 'alex@example.test');
  await click('Send Recovery Code');
  await waitFor(hasText('Reset Password'));
  await waitFor(hasText('The code expires in 10 minutes.'));
  for (let index = 1; index <= 6; index++) {
    await input(`Code digit ${index}`, String(index));
    await waitFor(`document.querySelector('input[aria-label="Code digit ${index}"]').value === "${index}"`);
  }
  await input('New Password', 'new-password-123');
  await input('Confirm Password', 'new-password-123');
  await click('Reset Password');
  await waitFor(hasText("Today's Progress"));
  assert.equal(await evaluate(`localStorage.getItem('tracksense_token')`), null, 'Tokens are not stored unencrypted');

  // Help & Support: contact channels, searchable FAQ, bug report, feedback toast.
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/profile' });
  await waitFor(hasText('Edit Profile'));
  await click('Help & Support');
  await waitFor(hasText('FREQUENTLY ASKED QUESTIONS'));
  assert.ok(await evaluate(hasText('Tracksensehelpnow@gmail.com')));
  assert.ok(await evaluate(hasText('+234 905 743 4214')));
  assert.ok(await evaluate(hasText('TrackSense v1.0.0')));
  assert.ok(await evaluate(hasText('Systems Operational')));
  assert.ok(await evaluate(`document.querySelector('[aria-label="Email Support"]') !== null`));
  assert.ok(await evaluate(`document.querySelector('[aria-label="WhatsApp Admin"]') !== null`));
  await screenshot('help-support-light');
  await input('Search frequently asked questions', 'notifications');
  await waitFor(hasText("I'm not receiving push notifications"));
  assert.equal(await evaluate(hasText('How is my course progress calculated?')), false);
  await evaluate(`document.querySelector('[aria-label="Clear help search"]').click()`);
  await waitFor(hasText('How is my course progress calculated?'));
  await click('Report a Bug');
  await waitFor(hasText('Submit Bug Report'));
  assert.equal(await evaluate(`document.querySelectorAll('[role="radio"]').length`), 4);
  assert.equal(await evaluate(`document.querySelector('[role="radio"][aria-label="Course Tracking"]').getAttribute('aria-checked')`), 'true');
  await evaluate(`document.querySelector('[role="radio"][aria-label="Auth/OTP"]').click()`);
  await input('Bug description', 'The verification code expired before I could enter it.');
  await screenshot('help-bug-report-light');
  await evaluate(`document.querySelector('[aria-label="Close dialog"]').click()`);
  await click('Share Feedback');
  await waitFor(hasText('Submit Feedback'));
  await input('Feature feedback', 'Add a study streak calendar.');
  await evaluate(`document.querySelector('[aria-label="Submit Feedback"]').click()`);
  await waitFor(hasText('Thank you! Your feedback helps us improve TrackSense.'));
  await screenshot('help-feedback-toast-light');
  preferences = { ...preferences, theme: 'dark' };
  await command('Page.navigate', { url: 'http://127.0.0.1:8796/help' });
  await waitFor(hasText('FREQUENTLY ASKED QUESTIONS'));
  await screenshot('help-support-dark');

  assert.deepEqual(errors, []);
  console.log('Browser smoke passed: OTP registration and verification countdown, onboarding, tasks, goal/project creation, details, milestone completion, editing, course create/edit/delete, dynamic course progress, assignment sorting/add flow, exam countdown, notification badge/alerts, Spiritual devotion/journal saving and retry, Focus timer restoration/manual saving, Analytics tabs/ranges/retry, Profile editing/notification preferences/theme/sign-out confirmation, password recovery, Help & Support search/bug/feedback, dark theme and logout. API fixtures only.');
  await send('Browser.close');
} finally {
  ws?.close(); chrome.kill(); server.close();
}
