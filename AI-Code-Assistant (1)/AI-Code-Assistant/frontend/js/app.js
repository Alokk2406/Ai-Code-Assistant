/* Main app logic: sidebar navigation, module actions, toasts, chat, history. */

const MODULE_META = {
  dashboard: { title: 'Dashboard', sub: 'Your AI-powered programming companion — overview & quick actions.', view: 'dashboard' },
  chat: { title: 'AI Chat', sub: 'Ask anything about programming — get explanations, examples, and complexity notes.', view: 'chat' },
  generate: { title: 'Code Generator', sub: 'Describe what you need. Get complete, working code with comments and error handling.', view: 'workspace', prompt: true, action: 'generate' },
  debug: { title: 'Debugger', sub: 'Paste code. Get syntax, runtime, logic, and security issues — plus a fix.', view: 'workspace', action: 'debug' },
  explain: { title: 'Code Explainer', sub: 'Line-by-line breakdown: variables, functions, loops, conditions, complexity.', view: 'workspace', action: 'explain' },
  optimize: { title: 'Optimizer', sub: 'Improve speed, readability, memory, and naming — with a before/after diff.', view: 'workspace', action: 'optimize' },
  complexity: { title: 'Complexity Analyzer', sub: 'Automatic Big-O time and space complexity analysis.', view: 'workspace', action: 'complexity' },
  docs: { title: 'Documentation Generator', sub: 'Generate docstrings, README sections, and inline comments.', view: 'workspace', action: 'docs' },
  security: { title: 'Security Scanner', sub: 'Detect SQL injection, XSS, hardcoded secrets, and unsafe file handling.', view: 'workspace', action: 'security' },
  project: { title: 'AI Project Generator', sub: 'Describe a system. Get a folder structure, backend, frontend, schema, and README.', view: 'workspace', prompt: true, action: 'project' },
  convert: { title: 'Code Converter', sub: 'Convert code between Python, Java, C, C++, JavaScript, Go, Rust, PHP, and C#.', view: 'convert' },
  history: { title: 'History', sub: 'Everything you\u2019ve run in this session.', view: 'history' },
  settings: { title: 'Settings', sub: 'Configure the backend connection.', view: 'settings' },
};

const LANGUAGES = ['python', 'javascript', 'java', 'c', 'cpp', 'go', 'rust', 'php', 'csharp'];
const MONACO_LANG_MAP = { csharp: 'csharp', cpp: 'cpp' };

let currentModule = 'dashboard';
const stats = { generated: 0, debugged: 0, converted: 0 };

/* ---------------- Toasts ---------------- */
function toast(message, isError = false) {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------------- Navigation ---------------- */
function switchModule(name) {
  currentModule = name;
  const meta = MODULE_META[name];
  if (!meta) return;

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.module === name);
  });

  document.getElementById('moduleTitle').textContent = meta.title;
  document.getElementById('moduleSubtitle').textContent = meta.sub;

  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.getElementById(`view-${meta.view}`).classList.add('active');

  if (meta.view === 'workspace') {
    document.querySelector('.workspace-prompt').style.display = meta.prompt ? 'flex' : 'none';
    document.getElementById('workspacePrompt').placeholder = meta.action === 'project'
      ? 'Describe the system to build… (e.g. "Hospital Management System")'
      : 'Describe what to generate…';
    document.getElementById('runActionBtn').textContent =
      meta.action === 'generate' ? 'Generate' :
      meta.action === 'project' ? 'Build project' :
      meta.action.charAt(0).toUpperCase() + meta.action.slice(1);
  }

  if (name === 'history') loadHistory();
}

document.getElementById('navList').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (btn) switchModule(btn.dataset.module);
});

document.querySelectorAll('.quick-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchModule(btn.dataset.jump));
});

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

/* ---------------- API status ---------------- */
async function checkApiStatus() {
  const dot = document.getElementById('apiDot');
  const text = document.getElementById('apiStatusText');
  try {
    await API.status();
    dot.className = 'dot online';
    text.textContent = 'API online';
  } catch {
    dot.className = 'dot offline';
    text.textContent = 'API offline';
  }
}
checkApiStatus();
setInterval(checkApiStatus, 15000);

/* ---------------- Response rendering ---------------- */
function renderResponse(target, text, asCode) {
  target.innerHTML = '';
  if (asCode) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-' + (document.getElementById('languageSelect')?.value || 'python');
    code.textContent = text;
    pre.appendChild(code);
    target.appendChild(pre);
    if (window.Prism) Prism.highlightElement(code);
  } else {
    const p = document.createElement('div');
    p.style.whiteSpace = 'pre-wrap';
    p.textContent = text;
    target.appendChild(p);
  }
}

/* ---------------- Workspace actions ---------------- */
document.getElementById('languageSelect').addEventListener('change', (e) => {
  document.getElementById('editorLangLabel').textContent = e.target.value;
  window.Editors?.whenReady(() => {
    const lang = MONACO_LANG_MAP[e.target.value] || e.target.value;
    monaco.editor.setModelLanguage(window.Editors.main.getModel(), lang);
  });
});

document.getElementById('runActionBtn').addEventListener('click', async () => {
  const meta = MODULE_META[currentModule];
  const responseBody = document.getElementById('responseBody');
  const btn = document.getElementById('runActionBtn');
  const code = window.Editors?.main?.getValue() ?? '';
  const prompt = document.getElementById('workspacePrompt').value.trim();
  const language = document.getElementById('languageSelect').value;

  btn.disabled = true;
  responseBody.innerHTML = '<div class="response-empty">AI is thinking…</div>';

  try {
    let result, asCode = false;
    switch (meta.action) {
      case 'generate':
        if (!prompt) return toast('Describe what to generate first.', true);
        result = (await API.generateCode(prompt, language)).result;
        asCode = true;
        window.Editors.main.setValue(result);
        stats.generated++; document.getElementById('statGenerated').textContent = stats.generated;
        break;
      case 'project':
        if (!prompt) return toast('Describe the project first.', true);
        result = (await API.generateProject(prompt)).result;
        break;
      case 'debug':
        result = (await API.debugCode(code)).result;
        stats.debugged++; document.getElementById('statDebugged').textContent = stats.debugged;
        break;
      case 'explain':
        result = (await API.explainCode(code)).result;
        break;
      case 'optimize':
        result = (await API.optimizeCode(code)).result;
        break;
      case 'complexity':
        result = (await API.complexity(code)).result;
        break;
      case 'docs':
        result = (await API.generateDocs(code)).result;
        break;
      case 'security':
        result = (await API.securityScan(code)).result;
        break;
    }
    renderResponse(responseBody, result, asCode);
  } catch (err) {
    renderResponse(responseBody, `Request failed: ${err.message}\n\nIs the backend running at ${API.getBaseUrl()}?`, false);
    toast('Request failed — check the backend is running.', true);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('copyEditorBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.Editors?.main?.getValue() ?? '');
  toast('Editor code copied.');
});
document.getElementById('copyResponseBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('responseBody').innerText);
  toast('Response copied.');
});

document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => window.Editors?.main?.setValue(reader.result);
  reader.readAsText(file);
});

/* Drag & drop onto editor host */
const editorHost = document.getElementById('monacoEditor');
['dragover', 'drop'].forEach((evt) => editorHost.addEventListener(evt, (e) => e.preventDefault()));
editorHost.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => window.Editors?.main?.setValue(reader.result);
  reader.readAsText(file);
});

/* ---------------- Convert module ---------------- */
const convertFrom = document.getElementById('convertFrom');
const convertTo = document.getElementById('convertTo');
LANGUAGES.forEach((l) => {
  convertFrom.add(new Option(l, l));
  convertTo.add(new Option(l, l));
});
convertTo.value = 'javascript';

document.getElementById('convertRunBtn').addEventListener('click', async () => {
  const body = document.getElementById('convertResponseBody');
  const code = window.Editors?.convert?.getValue() ?? '';
  if (!code.trim()) return toast('Paste some code to convert first.', true);
  body.innerHTML = '<div class="response-empty">Converting…</div>';
  try {
    const result = (await API.convertCode(code, convertFrom.value, convertTo.value)).result;
    renderResponse(body, result, true);
    stats.converted++; document.getElementById('statConverted').textContent = stats.converted;
  } catch (err) {
    renderResponse(body, `Request failed: ${err.message}`, false);
    toast('Conversion failed — check the backend is running.', true);
  }
});
document.getElementById('copyConvertBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('convertResponseBody').innerText);
  toast('Converted code copied.');
});

/* ---------------- Chat module ---------------- */
async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const win = document.getElementById('chatWindow');
  win.querySelector('.chat-empty')?.remove();

  const userBubble = document.createElement('div');
  userBubble.className = 'chat-msg user';
  userBubble.textContent = msg;
  win.appendChild(userBubble);
  input.value = '';
  win.scrollTop = win.scrollHeight;

  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-msg ai';
  aiBubble.textContent = 'Thinking…';
  win.appendChild(aiBubble);
  win.scrollTop = win.scrollHeight;

  try {
    const { response } = await API.chat(msg);
    aiBubble.textContent = response;
  } catch (err) {
    aiBubble.textContent = `Request failed: ${err.message}`;
  }
  win.scrollTop = win.scrollHeight;
}
document.getElementById('chatSend').addEventListener('click', sendChat);
document.getElementById('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });

/* ---------------- History module ---------------- */
async function loadHistory() {
  const body = document.getElementById('historyBody');
  try {
    const items = await API.getHistory();
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="3" class="muted">No history yet.</td></tr>';
      return;
    }
    body.innerHTML = items.map((h) => `
      <tr>
        <td>${h.action}</td>
        <td>${(h.detail || '').replace(/</g, '&lt;')}</td>
        <td class="muted">${new Date(h.created_at).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="3" class="muted">Couldn't load history — is the backend running?</td></tr>`;
  }
}
document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
  try {
    await API.clearHistory();
    loadHistory();
    toast('History cleared.');
  } catch {
    toast('Could not clear history.', true);
  }
});

/* ---------------- Settings module ---------------- */
const apiBaseInput = document.getElementById('apiBaseInput');
apiBaseInput.value = API.getBaseUrl();
document.getElementById('saveApiBaseBtn').addEventListener('click', () => {
  API.setBaseUrl(apiBaseInput.value.trim());
  toast('Backend URL saved.');
  checkApiStatus();
});

/* ---------------- Theme toggle (dark is default/only theme in v1) ---------------- */
document.getElementById('themeToggle').addEventListener('click', () => {
  toast('Dark mode is the only theme in this build — light mode is a good next feature to add.');
});
