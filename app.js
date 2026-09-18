const PEOPLE = [
  { key: 'ben',   name: 'Ben',   c: '--c-ben' },
  { key: 'sam',   name: 'Sam',   c: '--c-sam' },
  { key: 'yoshi', name: 'Yoshi', c: '--c-yoshi' },
];
const DAYS = [
  { key: 'mo', label: 'Mo' },
  { key: 'di', label: 'Di' },
  { key: 'mi', label: 'Mi' },
  { key: 'do', label: 'Do' },
  { key: 'fr', label: 'Fr' },
  { key: 'sa', label: 'Sa' },
];
const TASKS = [
  { key: 'kueche',    label: 'Küche / Wohnen', points: 4, icon: 'house' },
  { key: 'zimmer',    label: 'Zimmer',         points: 4, icon: 'bed' },
  { key: 'klamotten', label: 'Klamotten',      points: 4, icon: 'shirt' },
  { key: 'toilette',  label: 'Toilette',       points: 1, icon: 'drop' },
  { key: 'musik',     label: 'Musik',          points: 3, icon: 'note' },
  { key: 'garage',    label: 'Garage',         points: 1, icon: 'car' },
  { key: 'kaninchen', label: 'Kaninchen',      points: 2, icon: 'rabbit' },
];
const MAX_WEEK_POINTS = TASKS.reduce((s, t) => s + t.points, 0) * DAYS.length;

function iconSvg(name) {
  const a = 'width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  switch (name) {
    case 'house': return `<svg ${a}><path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/></svg>`;
    case 'bed': return `<svg ${a}><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/><path d="M3 18h18"/><path d="M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3"/></svg>`;
    case 'shirt': return `<svg ${a}><path d="M8 3 4 6l2 3 2-1v11h8V8l2 1 2-3-4-3-2 2h-4z"/></svg>`;
    case 'drop': return `<svg ${a}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>`;
    case 'note': return `<svg ${a}><circle cx="7" cy="18" r="3"/><circle cx="17" cy="16" r="3"/><path d="M10 18V5l10-2v13"/></svg>`;
    case 'car': return `<svg ${a}><path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5"/><rect x="2" y="13" width="20" height="5" rx="1.5"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>`;
    case 'rabbit': return `<svg ${a}><path d="M8 3c-1 2-1 5 0 7"/><path d="M16 3c1 2 1 5 0 7"/><circle cx="12" cy="13" r="6"/><circle cx="10" cy="12" r=".6" fill="currentColor"/><circle cx="14" cy="12" r=".6" fill="currentColor"/></svg>`;
  }
  return '';
}
const CHECK_SVG = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8.5 6.5 12 13 4.5"/></svg>';

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function getMonday(d) {
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function isoWeekId(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return date.getUTCFullYear() + '-W' + pad(weekNo);
}
function fmtShort(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; }
function fmtFull(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }

const today = new Date();
const monday = getMonday(today);
const weekId = isoWeekId(today);
const dayDates = DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
const saturday = dayDates[5];

function emptyChecks() {
  const checks = {};
  PEOPLE.forEach(p => {
    checks[p.key] = {};
    DAYS.forEach(d => {
      checks[p.key][d.key] = {};
      TASKS.forEach(t => { checks[p.key][d.key][t.key] = false; });
    });
  });
  return checks;
}
function mergeChecks(raw) {
  const def = emptyChecks();
  if (!raw) return def;
  PEOPLE.forEach(p => DAYS.forEach(d => TASKS.forEach(t => {
    const v = raw?.[p.key]?.[d.key]?.[t.key];
    if (typeof v === 'boolean') def[p.key][d.key][t.key] = v;
  })));
  return def;
}
function defaultWeekDoc() {
  return { weekId, weekStart: isoDate(monday), checks: emptyChecks() };
}

let liveChecks = emptyChecks();
let activePerson = 'ben';
let backendReady = false;
let backendMode = 'none'; // 'firestore' | 'local'

const weekRangeEl = document.getElementById('weekRange');
const statusEl = document.getElementById('statusBadge');
const summaryEl = document.getElementById('summaryCards');
const tabsEl = document.getElementById('tabs');
const tableWrapEl = document.getElementById('tableWrap');
const historyEl = document.getElementById('historyList');
const setupBanner = document.getElementById('setupBanner');

weekRangeEl.textContent = 'Woche vom ' + fmtShort(monday) + ' – ' + fmtFull(saturday);

function setStatus() {
  statusEl.classList.remove('live', 'readonly');
  const t = statusEl.querySelector('.statustext');
  if (!backendReady) {
    t.textContent = 'Verbinde …';
  } else if (backendMode === 'local') {
    statusEl.classList.add('readonly');
    t.textContent = 'Nur dieses Gerät';
  } else {
    statusEl.classList.add('live');
    t.textContent = 'Live verbunden';
  }
}

function totalPoints(personKey) {
  let sum = 0;
  DAYS.forEach(d => TASKS.forEach(t => { if (liveChecks[personKey][d.key][t.key]) sum += t.points; }));
  return sum;
}
function dayPoints(personKey, dayKey) {
  let sum = 0;
  TASKS.forEach(t => { if (liveChecks[personKey][dayKey][t.key]) sum += t.points; });
  return sum;
}

function renderSummary() {
  summaryEl.innerHTML = PEOPLE.map(p => {
    const pts = totalPoints(p.key);
    const pct = Math.min(100, Math.round((pts / MAX_WEEK_POINTS) * 100));
    return `
      <div class="p-card" style="--card-c:var(${p.c})">
        <div class="name">${p.name}</div>
        <div class="minutes">${pts} <small>Min. YouTube</small></div>
        <div class="bar"><span style="width:${pct}%"></span></div>
        <div class="of-max">${pts} von max. ${MAX_WEEK_POINTS} Minuten diese Woche</div>
      </div>`;
  }).join('');
}

function renderTabs() {
  tabsEl.innerHTML = PEOPLE.map(p => {
    const active = p.key === activePerson;
    return `<button class="tab${active ? ' active' : ''}" style="--tab-c:var(${p.c})" data-person="${p.key}" role="tab" aria-selected="${active}">${p.name}</button>`;
  }).join('');
  tabsEl.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activePerson = btn.getAttribute('data-person');
      renderTabs();
      renderTable();
    });
  });
}

function renderTable() {
  const person = PEOPLE.find(p => p.key === activePerson);
  const head = '<thead><tr><th class="taskcol" style="border-bottom:none"></th>' +
    DAYS.map((d, i) => `<th class="${i === 5 ? 'sat' : ''}">${d.label}<span class="datenum">${fmtShort(dayDates[i])}</span></th>`).join('') +
    '</tr></thead>';

  const rows = TASKS.map(t => {
    const cells = DAYS.map((d, i) => {
      const checked = !!liveChecks[person.key][d.key][t.key];
      return `<td class="${i === 5 ? 'sat' : ''}"><button class="cb" role="checkbox" aria-checked="${checked}" aria-label="${t.label} ${d.label} ${person.name}" data-person="${person.key}" data-day="${d.key}" data-task="${t.key}" style="--tab-c:var(${person.c})">${CHECK_SVG}</button></td>`;
    }).join('');
    return `<tr><th class="taskcol">${iconSvg(t.icon)}<span>${t.label}</span><span class="pts">${t.points}P</span></th>${cells}</tr>`;
  }).join('');

  const footCells = DAYS.map((d, i) => `<td class="${i === 5 ? 'sat' : ''}">${dayPoints(person.key, d.key)}</td>`).join('');
  const foot = `<tfoot><tr><td class="taskcol">Tagessumme</td>${footCells}</tr></tfoot>`;

  tableWrapEl.innerHTML = `<table class="grid">${head}<tbody>${rows}</tbody>${foot}</table>`;

  tableWrapEl.querySelectorAll('.cb').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleCell(btn.getAttribute('data-person'), btn.getAttribute('data-day'), btn.getAttribute('data-task'));
    });
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCell(btn.getAttribute('data-person'), btn.getAttribute('data-day'), btn.getAttribute('data-task'));
      }
    });
  });
}

function renderAll() {
  setStatus();
  renderSummary();
  renderTable();
}
renderAll();

function renderHistory(entries) {
  const filtered = entries.filter(e => e.id !== weekId);
  if (!filtered.length) {
    historyEl.innerHTML = '<p class="h-empty">Noch keine vergangenen Wochen.</p>';
    return;
  }
  historyEl.innerHTML = filtered.map(entry => {
    const data = entry.data || {};
    const checks = mergeChecks(data.checks);
    const start = data.weekStart ? new Date(data.weekStart + 'T00:00:00') : null;
    const end = start ? new Date(start.getTime() + 5 * 86400000) : null;
    const range = start ? (fmtShort(start) + ' – ' + fmtFull(end)) : entry.id;
    const scores = PEOPLE.map(p => {
      let sum = 0;
      DAYS.forEach(d => TASKS.forEach(t => { if (checks[p.key][d.key][t.key]) sum += t.points; }));
      return `<span class="h-score" style="color:var(${p.c})"><span class="swatch" style="background:var(${p.c})"></span>${sum}</span>`;
    }).join('');
    return `<div class="h-row"><span class="h-range">${range}</span><span class="h-scores">${scores}</span></div>`;
  }).join('');
}

// ---- Backend: Firestore when configured, else this-browser-only fallback ----

let toggleImpl = null;

function setupLocalBackend() {
  backendMode = 'local';
  setupBanner.hidden = false;
  const KEY = 'punkteplan_' + weekId;
  const saved = localStorage.getItem(KEY);
  if (saved) {
    try { liveChecks = mergeChecks(JSON.parse(saved).checks); } catch (e) { /* ignore */ }
  }
  backendReady = true;
  renderAll();

  const historyEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('punkteplan_')) {
      try {
        const data = JSON.parse(localStorage.getItem(k));
        historyEntries.push({ id: k.replace('punkteplan_', ''), data });
      } catch (e) { /* ignore */ }
    }
  }
  historyEntries.sort((a, b) => (b.data?.weekStart || '').localeCompare(a.data?.weekStart || ''));
  renderHistory(historyEntries.slice(0, 9));

  toggleImpl = (personKey, dayKey, taskKey, next) => {
    liveChecks[personKey][dayKey][taskKey] = next;
    const doc = { weekId, weekStart: isoDate(monday), checks: liveChecks };
    localStorage.setItem(KEY, JSON.stringify(doc));
    return Promise.resolve();
  };
}

async function setupFirestoreBackend(config) {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js');
  const {
    getFirestore, doc, setDoc, onSnapshot, collection, query, orderBy, limit, getDocs
  } = await import('https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js');

  const app = initializeApp(config);
  const db = getFirestore(app);
  const weekRef = doc(db, 'weeks', weekId);

  backendMode = 'firestore';
  backendReady = true;

  onSnapshot(weekRef, snap => {
    liveChecks = mergeChecks(snap.exists() ? snap.data().checks : null);
    renderAll();
  }, err => {
    console.error('Firestore-Fehler:', err);
    setupLocalBackend();
  });

  getDocs(query(collection(db, 'weeks'), orderBy('weekStart', 'desc'), limit(9)))
    .then(snap => renderHistory(snap.docs.map(d => ({ id: d.id, data: d.data() }))))
    .catch(() => { historyEl.innerHTML = '<p class="h-empty">Verlauf konnte nicht geladen werden.</p>'; });

  toggleImpl = (personKey, dayKey, taskKey, next) => {
    const patch = { checks: { [personKey]: { [dayKey]: { [taskKey]: next } } } };
    return setDoc(weekRef, patch, { merge: true });
  };

  renderAll();
}

let writeQueue = Promise.resolve();
function toggleCell(personKey, dayKey, taskKey) {
  if (!backendReady || !toggleImpl) return;
  const cur = !!liveChecks[personKey][dayKey][taskKey];
  const next = !cur;
  liveChecks[personKey][dayKey][taskKey] = next;
  renderAll();
  writeQueue = writeQueue.then(() => toggleImpl(personKey, dayKey, taskKey, next)).catch(err => {
    console.error(err);
    liveChecks[personKey][dayKey][taskKey] = cur;
    renderAll();
  });
}

if (window.FIREBASE_CONFIG) {
  setupFirestoreBackend(window.FIREBASE_CONFIG).catch(err => {
    console.error('Firebase konnte nicht geladen werden, nutze lokalen Speicher:', err);
    setupLocalBackend();
  });
} else {
  setupLocalBackend();
}
