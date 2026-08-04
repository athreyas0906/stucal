/* app.js — calendar rendering, editing, and persistence.
   Data lives in the browser's localStorage once initialized;
   see events.js for the one-time seed data. checking*/

const STORAGE_KEY = "studyCalendar.events.v1";
const INIT_KEY = "studyCalendar.initialized.v1";
const HIDDEN_TYPES_KEY = "studyCalendar.hiddenTypes.v1";

const TYPE_LABELS = {
  study: "Study",
  class: "Class",
  mock: "Mock",
  physics: "Physics",
  chemistry: "Chemistry",
  mathematics: "Mathematics",
  general: "General"
};

let state = {
  cursor: startOfToday(new Date()), // CHANGED from startOfMonth
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

// CHANGED: Instead of starting at day 1 of the month, the cursor now represents the specific starting day of our 3-day view.
function startOfToday(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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

// REMOVED: renderWeekdayRow is empty now because day headers (e.g., "Mon, Aug 3") are generated directly inside each column card.
function renderWeekdayRow() {
  const row = document.getElementById("weekdayRow");
  if (row) row.innerHTML = "";
}

function visibleEventsByDate() {
  const map = {};
  
  // Track the visible dates of our current 3-day screen layout window
  const visibleDates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(state.cursor);
    d.setDate(d.getDate() + i);
    visibleDates.push(toISODate(d));
  }

  // FIXED: Ensure every loop item uses "ev" as the variable name
  for (const ev of state.events) {
    const tagsArray = Array.isArray(ev.types) ? ev.types : (ev.type ? [ev.type] : []);
    
    // Skip if all tags are hidden
    if (tagsArray.length > 0 && tagsArray.every(tag => state.hiddenTypes.has(tag))) continue;

    const baseDate = new Date(ev.date + "T00:00:00");
    const repeatType = ev.recurrence || "none";

    visibleDates.forEach(visStr => {
      const targetDate = new Date(visStr + "T00:00:00");
      
      // An event cannot appear before its initial base start date
      if (targetDate < baseDate) return;

      let isMatch = false;

      if (repeatType === "none" && ev.date === visStr) {
        isMatch = true;
      } else if (repeatType === "daily") {
        isMatch = true;
      } else if (repeatType === "weekly") {
        if (targetDate.getDay() === baseDate.getDay()) isMatch = true;
      } else if (repeatType === "monthly") {
        if (targetDate.getDate() === baseDate.getDate()) isMatch = true;
      }

      if (isMatch) {
        if (!map[visStr]) map[visStr] = [];
        const instance = { ...ev, date: visStr };
        map[visStr].push(instance);
      }
    });
  }

  // Sort by execution timestamp
  for (const key in map) {
    map[key].sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }
  return map;
}

// REWRITTEN: Switched from a 42-day month grid to a rolling 3-day view
function renderCalendar() {
  const cursor = state.cursor;
  const today = new Date();
  
  // Calculate the end date of the current 3-day window
  const endDate = new Date(cursor);
  endDate.setDate(cursor.getDate() + 2);

  // 1. Format and update the main header labels
  const dateRangeLabel = document.getElementById("dateRangeLabel");
  if (dateRangeLabel) {
    // Displays ranges clearly like "Aug 3 – Aug 5, 2026"
    const startStr = `${MONTH_NAMES[cursor.getMonth()].slice(0,3)} ${cursor.getDate()}`;
    const endStr = `${MONTH_NAMES[endDate.getMonth()].slice(0,3)} ${endDate.getDate()}`;
    dateRangeLabel.textContent = `${startStr} – ${endStr}, ${endDate.getFullYear()}`;
  }

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const eventsByDate = visibleEventsByDate();

  // 2. Loop exactly 3 times to build the 3 columns
  for (let i = 0; i < 3; i++) {
    const cellDate = new Date(cursor);
    cellDate.setDate(cursor.getDate() + i);
    const iso = toISODate(cellDate);
    const isToday = isSameDay(cellDate, today);

    // Create the column container card
    const cell = document.createElement("div");
    // Preserves your base styling class structure
    cell.className = "day" + (isToday ? " is-today" : "");
    cell.dataset.date = iso;
    // Stretch column height seamlessly for a column layout
    cell.style.minHeight = "350px"; 

    // 3. Inject the combined Day + Date header directly into the top of the column
    const num = document.createElement("div");
    num.className = "day-num";
    const dayName = WEEKDAY_SHORT[cellDate.getDay()];
    num.innerHTML = `<span style="font-size: 14px; font-weight: 500; opacity: 0.7; margin-right: 4px;">${dayName}</span> ${cellDate.getDate()}`;
    cell.appendChild(num);

    // 4. Gather and append events matching this date
    const evWrap = document.createElement("div");
    evWrap.className = "day-events";
    const dayEvents = eventsByDate[iso] || [];
    
    const shown = dayEvents.slice(0, 5); 
    for (const ev of shown) {
      const pill = document.createElement("div");
      pill.className = "pill";
      pill.title = ev.title;
      
      // Grab all active tags safely from the object array
      const tagsArray = Array.isArray(ev.types) ? ev.types : (ev.type ? [ev.type] : []);
      
      // Cache the time element badge snippet
      const timeStr = ev.time ? `<span class="pill-time">${ev.time}</span>` : '';
      
      // Check for recurrence settings and build the ↻ icon element if repeatable
      const repeatIcon = (ev.recurrence && ev.recurrence !== "none") 
        ? `<span style="font-weight: bold; opacity: 0.6; margin-right: 3px;" title="Repeats ${ev.recurrence}">↻</span>` 
        : '';
        
      // FIXED: Safely verify ev.important within the loop where ev is explicitly defined
      const starIndicator = ev.important 
        ? '<span style="margin-right: 4px;" title="Important">⭐</span>' 
        : '';
      
      // Wrap tags inside a 'dot-cluster' and push 'timeStr' right beside it on the same top line
      let dotsHTML = '<div class="pill-dots-row">';
      dotsHTML += '<div class="dot-cluster">';
      tagsArray.forEach(tag => {
        dotsHTML += `<span class="inline-tag-dot dot-${tag}" title="${tag}"></span>`;
      });
      dotsHTML += '</div>';
      dotsHTML += timeStr; 
      dotsHTML += '</div>';
      
      // Inject the layout.
      pill.innerHTML = `
        ${dotsHTML}
        <span class="pill-text">${repeatIcon}${starIndicator}${escapeHtml(ev.title)}</span>
      `;
      
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        openModal(ev.id); // Open modal on pill click
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

    // Clicking anywhere blank on the column card creates a new event for that day
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
    // CHANGED: Added 'pill' and 'tag-{type}' classes so it inherits pill styles directly
    btn.className = `pill tag-${type} ${state.hiddenTypes.has(type) ? "off" : ""}`;
    btn.style.cursor = "pointer";
    btn.style.textAlign = "left";
    
    // CHANGED: Match the calendar structure with a dot and text wrapper
    btn.innerHTML = `
      <span class="pill-dot"></span>
      <span class="pill-text">${TYPE_LABELS[type]}</span>
    `;
    
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

  const upcomingInstances = [];

  // Generate instances for recurring events over the next 14 days
  for (const ev of state.events) {
    const tagsArray = Array.isArray(ev.types) ? ev.types : (ev.type ? [ev.type] : []);
    if (tagsArray.length > 0 && tagsArray.every(tag => state.hiddenTypes.has(tag))) continue;

    const baseDate = new Date(ev.date + "T00:00:00");
    const repeatType = ev.recurrence || "none";

    // Loop through each day from today until the 14-day horizon
    for (let current = new Date(today); current <= horizon; current.setDate(current.getDate() + 1)) {
      if (current < baseDate) continue;

      let isMatch = false;
      const isoStr = toISODate(current);

      if (repeatType === "none" && ev.date === isoStr) {
        isMatch = true;
      } else if (repeatType === "daily") {
        isMatch = true;
      } else if (repeatType === "weekly") {
        if (current.getDay() === baseDate.getDay()) isMatch = true;
      } else if (repeatType === "monthly") {
        if (current.getDate() === baseDate.getDate()) isMatch = true;
      }

      if (isMatch) {
        upcomingInstances.push({
          ...ev,
          date: isoStr,
          actualDateObj: new Date(current)
        });
      }
    }
  }

  // Sort chronologically and slice the top 5 closest items
  const sortedAgenda = upcomingInstances
    .sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")))
    .slice(0, 5);

  if (sortedAgenda.length === 0) {
    wrap.innerHTML = `<div class="agenda-empty">No events upcoming. Click a day on the calendar to add something.</div>`;
    return;
  }

  for (const ev of sortedAgenda) {
    const item = document.createElement("div");
    item.className = "agenda-item";

    const tagsArray = Array.isArray(ev.types) ? ev.types : (ev.type ? [ev.type] : []);
    const timeStr = ev.time ? `<span class="pill-time">${ev.time}</span>` : '';
    
    // Add the ↻ recurrence icon into the sidebar agenda if it repeats
    const repeatIcon = (ev.recurrence && ev.recurrence !== "none") 
      ? `<span style="font-size: 11px; opacity: 0.6; margin-right: 4px;" title="Repeats ${ev.recurrence}">↻</span>` 
      : '';

    // NEW: Safely check for ev.important and generate the star indicator tag
    const starIndicator = ev.important 
      ? '<span style="margin-right: 4px;" title="Important">⭐</span>' 
      : '';

    let dotsHTML = '<div class="pill-dots-row">';
    dotsHTML += '<div class="dot-cluster">';
    tagsArray.forEach(tag => {
      dotsHTML += `<span class="inline-tag-dot dot-${tag}" title="${tag}"></span>`;
    });
    dotsHTML += '</div>';
    dotsHTML += timeStr;
    dotsHTML += '</div>';

    // Injects the elements; starIndicator sits comfortably beside the repeat symbol
    item.innerHTML = `
      <div class="agenda-date">${MONTH_NAMES[ev.actualDateObj.getMonth()].slice(0,3)}<strong>${ev.actualDateObj.getDate()}</strong></div>
      <div class="agenda-content-wrapper">
        ${dotsHTML}
        <div class="agenda-title-row">
          <span class="agenda-title-text">${repeatIcon}${starIndicator}${escapeHtml(ev.title)}</span>
        </div>
      </div>
    `;
    item.addEventListener("click", () => openModal(ev.id));
    wrap.appendChild(item);
  }
}


function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


function updateWelcomeMessage() {
    const welcomeNode = document.getElementById("welcomeSubtext");
    if (!welcomeNode) return;

    const now = new Date();
    const currentHour = now.getHours(); 

    let timeGreeting = "Welcome to StuCal"; 

    if (currentHour >= 0 && currentHour < 12) {
        timeGreeting = "Good morning";
    } else if (currentHour >= 12 && currentHour < 17) {
        timeGreeting = "Good afternoon";
    } else if (currentHour >= 17 && currentHour < 24) { // Fixed: Changed < 0 to < 24
        timeGreeting = "Good evening";
    }

    welcomeNode.innerHTML = timeGreeting;
}

// Fixed: Moved outside the function so it actually runs on page load
window.onload = updateWelcomeMessage; 

function renderAll() {
  renderCalendar();
  renderLegend();
  renderAgenda();
  updateWelcomeMessage(); 

}
/* ---------------------------------------------------------
   Modal Controls & Logic
--------------------------------------------------------- */
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
  
  // Safely populate recurrence settings
  document.getElementById("recurrenceInput").value = ev && ev.recurrence ? ev.recurrence : "none";

  // Safely load important notification checkbox flag
  document.getElementById("importantInput").checked = ev ? !!ev.important : false;
  
  const currentTags = ev ? (Array.isArray(ev.types) ? ev.types : [ev.type]) : ["study"];
  document.querySelectorAll('input[name="eventTags"]').forEach(checkbox => {
    checkbox.checked = currentTags.includes(checkbox.value);
  });

  document.getElementById("deleteBtn").style.display = ev ? "inline-block" : "none";
  backdrop.classList.add("open");
  document.getElementById("titleInput").focus();
}

function closeModal() {
  backdrop.classList.remove("open");
  state.editingId = null;
}

document.getElementById("closeModalBtn").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });

/* FIXED: Corrected global window observer to catch the Escape key natively */
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("titleInput").value.trim();
  const date = document.getElementById("dateInput").value;
  const time = document.getElementById("timeInput").value;
  const notes = document.getElementById("notesInput").value.trim();
  const recurrence = document.getElementById("recurrenceInput").value; 
  const important = document.getElementById("importantInput").checked; 

  if (!title || !date) return;

  const selectedTags = [];
  document.querySelectorAll('input[name="eventTags"]:checked').forEach(checkbox => {
    selectedTags.push(checkbox.value);
  });
  if (selectedTags.length === 0) selectedTags.push("study");

  if (state.editingId) {
    const ev = state.events.find(e => e.id === state.editingId);
    Object.assign(ev, { title, date, time, notes, types: selectedTags, type: selectedTags, recurrence, important });
  } else {
    state.events.push({
      id: "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      title, date, time, notes, types: selectedTags, type: selectedTags, recurrence, important
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
  // NEW: Forces an immediate check right now so you don't wait 30 minutes
  if (typeof checkUpcomingNotifications === "function") {
    checkUpcomingNotifications();
  }
  
  closeModal();
  renderAll();
});

/* ---------------------------------------------------------
   Top-Level Navigation Controls (Restored Original JS)
--------------------------------------------------------- */
// --- Download Calendar Events Array as a Local .json Text File ---
document.getElementById("exportBtn").addEventListener("click", () => {
  if (state.events.length === 0) {
    alert("There are no events to backup.");
    return;
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.events, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "study_calendar_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

// --- Trigger Hidden File Explorer Window Prompt ---
document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("hiddenFileInput").click();
});

// --- Intercept Uploaded File and Overwrite Local Storage ---
document.getElementById("hiddenFileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const parsedData = JSON.parse(event.target.result);
      
      if (!Array.isArray(parsedData)) {
        alert("Invalid backup file format. Must be an array of events.");
        return;
      }

      if (confirm(`Are you sure you want to restore ${parsedData.length} events? This will overwrite your current calendar.`)) {
        state.events = parsedData;
        saveEvents(); 
        renderAll();   
        alert("Calendar data successfully restored!");
      }
    } catch (err) {
      alert("Error parsing file. Make sure it's a valid calendar JSON file.");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});
document.getElementById("prevBtn").addEventListener("click", () => {
  const currentCursor = new Date(state.cursor);
  currentCursor.setDate(currentCursor.getDate() - 3);
  state.cursor = currentCursor;
  renderCalendar();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  const currentCursor = new Date(state.cursor);
  currentCursor.setDate(currentCursor.getDate() + 3);
  state.cursor = currentCursor;
  renderCalendar();
});

document.getElementById("todayBtn").addEventListener("click", () => {
  state.cursor = startOfToday(new Date());
  renderCalendar();
});

document.getElementById("addEventBtn").addEventListener("click", () => openModal(null, toISODate(new Date())));
document.getElementById("resetBtn").addEventListener("click", resetToDefaults);

/* ---------------------------------------------------------
   Desktop Notification System Core
--------------------------------------------------------- */
/* ---------------------------------------------------------
   Desktop Notification System Core
--------------------------------------------------------- */
const notifiedEventIds = new Set();

function initializeNotifications() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

// FIXED: Isolated into a dedicated function that can be called anytime
function checkUpcomingNotifications() {
  const now = new Date();
  const thirtyMinsLater = new Date(now.getTime() + 30 * 60 * 1000);
  const currentISO = toISODate(now);
  const todayEvents = visibleEventsByDate()[currentISO] || [];

  todayEvents.forEach(ev => {
    if (ev.important && ev.time && !notifiedEventIds.has(ev.id)) {
      const [hours, minutes] = ev.time.split(':').map(Number);
      const eventDate = new Date(now);
      eventDate.setHours(hours, minutes, 0, 0);

      if (eventDate >= now && eventDate <= thirtyMinsLater) {
        if (Notification.permission === "granted") {
          new Notification("🔔 Upcoming Important Event!", {
            body: `${ev.title} starts at ${ev.time} (within 30 mins)`,
            icon: "favicon.ico"
          });
        }
        notifiedEventIds.add(ev.id);
      }
    }
  });
}

function startNotificationCheck() {
  // Run the checker on a 30-minute interval loop
  setInterval(checkUpcomingNotifications, 1800000);
}



// Make sure to add the call inside your main renderAll() definition:
// updateWelcomeMessage();
/* ---------------------------------------------------------
   App Initialization Hook
--------------------------------------------------------- */
/* ---------------------------------------------------------
   App Initialization Hook
--------------------------------------------------------- */
/* ---------------------------------------------------------
   App Initialization Hook (Timed Focus Intro Sequence)
--------------------------------------------------------- */
function init() {
  state.events = loadEvents();
  state.hiddenTypes = loadHiddenTypes();
  renderAll();

  initializeNotifications();
  startNotificationCheck();
}

// Kickstart the application loop cleanly
init();
