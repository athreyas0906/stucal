/* app.js — calendar rendering, editing, and persistence.
   Data lives in the browser's localStorage once initialized;
   see events.js for the one-time seed data. */

const STORAGE_KEY = "studyCalendar.events.v1";
const INIT_KEY = "studyCalendar.initialized.v1";
const HIDDEN_TYPES_KEY = "studyCalendar.hiddenTypes.v1";

const TYPE_LABELS = {
  exam: "Exam",
  assignment: "Assignment",
  study: "Study session",
  review: "Review"
};

let state = {
  cursor: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  events: [],
  hiddenTypes: new Set(),
  editingId: null
};

/* ---------------- storage ---------------- */

function loadEvents() {
  const alreadyInit = localStorage.getItem(INIT_KEY);
  if (!alreadyInit) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.SEED_EVENTS || []));
    localStorage.setItem(INIT_KEY, "true");
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
}

function loadHiddenTypes() {
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_TYPES_KEY));
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

function saveHiddenTypes() {
  localStorage.setItem(HIDDEN_TYPES_KEY, JSON.stringify([...state.hiddenTypes]));
}

function resetToDefaults() {
  if (!confirm("Reset the calendar to the defaults in events.js? This deletes anything you added or changed here.")) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.SEED_EVENTS || []));
  localStorage.setItem(INIT_KEY, "true");
  state.events = loadEventsFromStorageOnly();
  renderAll();
}

function loadEventsFromStorageOnly() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/* ---------------- date helpers ---------------- */

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ---------------- rendering: calendar grid ---------------- */

function visibleEventsByDate() {
  const map = {};
  for (const ev of state.events) {
    if (state.hiddenTypes.has(ev.type)) continue;
    if (!map[ev.date]) map[ev.date] = [];
    map[ev.date].push(ev);
  }
  for (const key in map) {
    map[key].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }
  return map;
}

function renderCalendar() {
  const days = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(state.cursor);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const startLabel = `${MONTH_NAMES[days[0].getMonth()].slice(0,3)} ${days[0].getDate()}`;
  const endLabel = `${MONTH_NAMES[days[2].getMonth()].slice(0,3)} ${days[2].getDate()}, ${days[2].getFullYear()}`;
  document.getElementById("monthLabel").textContent = `${startLabel} – ${endLabel}`;
  document.getElementById("monthTab").textContent = `${MONTH_NAMES[days[0].getMonth()].slice(0,3)} ${days[0].getFullYear()}`;

  const row = document.getElementById("weekdayRow");
  row.innerHTML = days.map(d => `<div>${WEEKDAY_SHORT[d.getDay()]}</div>`).join("");

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const eventsByDate = visibleEventsByDate();
  const today = new Date();

  for (const cellDate of days) {
    const iso = toISODate(cellDate);
    const isToday = isSameDay(cellDate, today);

    const cell = document.createElement("div");
    cell.className = "day" + (isToday ? " is-today" : "");
    cell.dataset.date = iso;

    const num = document.createElement("div");
    num.className = "day-num";
    num.textContent = cellDate.getDate();
    cell.appendChild(num);

    const evWrap = document.createElement("div");
    evWrap.className = "day-events";
    const dayEvents = eventsByDate[iso] || [];
    const shown = dayEvents.slice(0, 3);
    for (const ev of shown) {
      const pill = document.createElement("div");
      pill.className = `pill tag-${ev.type}`;
      pill.textContent = ev.time ? `${ev.time} ${ev.title}` : ev.title;
      pill.title = ev.title;
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(ev.id);
      });
      evWrap.appendChild(pill);
    }
    if (dayEvents.length > shown.length) {
      const more = document.createElement("div");
      more.className = "more-link";
      more.textContent = `+${dayEvents.length - shown.length} more`;
      evWrap.appendChild(more);
    }
    cell.appendChild(evWrap);

    cell.addEventListener("click", () => openModal(null, iso));
    grid.appendChild(cell);
  }
}

/* ---------------- rendering: sidebar ---------------- */

function renderLegend() {
  const wrap = document.getElementById("legend");
  wrap.innerHTML = "";
  for (const type of Object.keys(TYPE_LABELS)) {
    const row = document.createElement("div");
    row.className = "legend-row";
    const btn = document.createElement("button");
    btn.className = state.hiddenTypes.has(type) ? "off" : "";
    btn.innerHTML = `<span class="dot tag-${type}"></span> ${TYPE_LABELS[type]}`;
    btn.addEventListener("click", () => {
      if (state.hiddenTypes.has(type)) state.hiddenTypes.delete(type);
      else state.hiddenTypes.add(type);
      saveHiddenTypes();
      renderAll();
    });
    row.appendChild(btn);
    wrap.appendChild(row);
  }
}

function renderAgenda() {
  const wrap = document.getElementById("agendaList");
  wrap.innerHTML = "";

  const today = new Date();
  today.setHours(0,0,0,0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 14);

  const upcoming = state.events
    .filter(ev => !state.hiddenTypes.has(ev.type))
    .filter(ev => {
      const d = new Date(ev.date + "T00:00:00");
      return d >= today && d <= horizon;
    })
    .sort((a, b) => (a.date + (a.time||"99:99")).localeCompare(b.date + (b.time||"99:99")));

  if (upcoming.length === 0) {
    wrap.innerHTML = `<div class="agenda-empty">Nothing in the next two weeks. Click a day on the calendar to add something.</div>`;
    return;
  }

  for (const ev of upcoming) {
    const d = new Date(ev.date + "T00:00:00");
    const item = document.createElement("div");
    item.className = "agenda-item";
    item.innerHTML = `
      <div class="agenda-date">${MONTH_NAMES[d.getMonth()].slice(0,3)}<strong>${d.getDate()}</strong></div>
      <div>
        <div class="agenda-title">${escapeHtml(ev.title)}</div>
        ${ev.time ? `<span class="agenda-time">${ev.time}</span>` : ""}
      </div>
    `;
    item.addEventListener("click", () => openModal(ev.id));
    wrap.appendChild(item);
  }
}

function renderStreak() {
  const el = document.getElementById("streakCount");
  const today = new Date();
  today.setHours(0,0,0,0);
  const studyDates = new Set(
    state.events.filter(ev => ev.type === "study").map(ev => ev.date)
  );
  let streak = 0;
  let cursor = new Date(today);
  while (studyDates.has(toISODate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  el.textContent = streak;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderAll() {
  renderCalendar();
  renderLegend();
  renderAgenda();
  renderStreak();
}

/* ---------------- modal ---------------- */

const backdrop = document.getElementById("modalBackdrop");
const form = document.getElementById("eventForm");

function openModal(eventId, presetDate) {
  state.editingId = eventId;
  const ev = eventId ? state.events.find(e => e.id === eventId) : null;

  document.getElementById("modalTitle").textContent = ev ? "Edit event" : "New event";
  document.getElementById("titleInput").value = ev ? ev.title : "";
  document.getElementById("dateInput").value = ev ? ev.date : (presetDate || toISODate(new Date()));
  document.getElementById("timeInput").value = ev ? (ev.time || "") : "";
  document.getElementById("notesInput").value = ev ? (ev.notes || "") : "";
  setActiveType(ev ? ev.type : "study");

  document.getElementById("deleteBtn").style.display = ev ? "inline-block" : "none";

  backdrop.classList.add("open");
  document.getElementById("titleInput").focus();
}

function closeModal() {
  backdrop.classList.remove("open");
  state.editingId = null;
}

function setActiveType(type) {
  document.querySelectorAll(".type-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.type === type);
  });
  form.dataset.type = type;
}

document.querySelectorAll(".type-chip").forEach(chip => {
  chip.addEventListener("click", () => setActiveType(chip.dataset.type));
});

document.getElementById("closeModalBtn").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("titleInput").value.trim();
  const date = document.getElementById("dateInput").value;
  const time = document.getElementById("timeInput").value;
  const notes = document.getElementById("notesInput").value.trim();
  const type = form.dataset.type || "study";

  if (!title || !date) return;

  if (state.editingId) {
    const ev = state.events.find(e => e.id === state.editingId);
    Object.assign(ev, { title, date, time, notes, type });
  } else {
    state.events.push({
      id: "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      title, date, time, notes, type
    });
  }
  saveEvents();
  closeModal();
  renderAll();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (!state.editingId) return;
  state.events = state.events.filter(e => e.id !== state.editingId);
  saveEvents();
  closeModal();
  renderAll();
});

/* ---------------- top-level controls ---------------- */

document.getElementById("prevBtn").addEventListener("click", () => {
  state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), state.cursor.getDate() - 3);
  renderCalendar();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth(), state.cursor.getDate() + 3);
  renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  state.cursor = d;
  renderCalendar();
});

document.getElementById("addEventBtn").addEventListener("click", () => openModal(null, toISODate(new Date())));
document.getElementById("resetBtn").addEventListener("click", resetToDefaults);

/* ---------------- init ---------------- */

function init() {
  state.events = loadEvents();
  state.hiddenTypes = loadHiddenTypes();
  renderAll();
}

init();
