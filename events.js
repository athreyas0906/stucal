/*
  events.js — edit your calendar here, right in the source code.

  This array is only used to SEED the calendar the very first time
  someone opens the site (or after they press "Reset to defaults").
  After that, everything is saved in the browser's storage, and the
  website itself becomes the easiest way to add/edit/delete events.

  If you'd rather manage everything by hand in this file instead of
  clicking around the site, add entries below and then, on the site,
  use the "Reset to defaults" button (bottom of the sidebar) to reload
  from here. Note: that also wipes anything you added in the browser.

  Fields:
    id      — any unique string. Easiest: just increment the number.
    date    — "YYYY-MM-DD"
    time    — "HH:MM" 24-hour, or "" if it's an all-day item
    title   — short text shown on the calendar
    type    — one of: "exam", "assignment", "study", "review"
    notes   — optional longer text, shown when the event is opened
*/

const SEED_EVENTS = [
  {
    id: "seed-1",
    date: "2026-08-03",
    time: "18:00",
    title: "Read ch. 4 — Cellular Respiration",
    type: "study",
    notes: "Focus on the electron transport chain diagram."
  },
  {
    id: "seed-2",
    date: "2026-08-07",
    time: "10:00",
    title: "Problem set 3 due",
    type: "assignment",
    notes: ""
  },
  {
    id: "seed-3",
    date: "2026-08-12",
    time: "09:00",
    title: "Midterm — Organic Chemistry",
    type: "exam",
    notes: "Bring calculator. Covers ch. 1–6."
  },
  {
    id: "seed-4",
    date: "2026-08-14",
    time: "17:00",
    title: "Review flashcards — full deck",
    type: "review",
    notes: ""
  }
];
