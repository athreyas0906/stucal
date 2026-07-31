# Study Log — a calendar for studying

A clean, static calendar site: month grid, an upcoming-events sidebar, and a
study streak counter. No build step, no backend — it's plain HTML/CSS/JS, so
it hosts directly on GitHub Pages.

## Put it on GitHub Pages

1. Create a new repository on GitHub and push these files to it (root of the
   `main` branch is simplest).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a URL like `https://yourname.github.io/repo-name/` after
   a minute or two — that's your calendar.

## Editing your events

You have two ways to do this — use whichever you prefer, or both:

**On the website itself** (recommended for day-to-day use)
Click any day to add an event, or click an existing event to edit or delete
it. Changes save automatically in that browser. This is the easiest way to
keep the calendar current, but it's stored per-browser/device — it won't
follow you to a different computer, and clearing browser data clears it too.

**In the source code**, via `js/events.js`
Open that file and edit the `SEED_EVENTS` array — it's a plain list of
objects with a date, title, type, and optional time/notes. This file only
loads automatically the *first* time someone visits the site (so it survives
a fresh device or an incognito window). If you've already been using the
website and want to pull in changes you made to this file, use the
**Reset to defaults** button at the bottom of the sidebar — note that this
replaces whatever you'd added on the site.

A reasonable workflow: keep recurring or planned-ahead items (exam dates,
assignment due dates you already know) in `events.js` and commit them to
GitHub, then use the website day-to-day for quick additions like "read
chapter 5 tonight."

## Files

```
index.html       page structure
css/style.css    all styling
js/events.js     starting event data — edit this by hand
js/app.js        calendar rendering, storage, the add/edit modal
```

## Event types

Each event has one of four types, each with its own color on the calendar:
`exam`, `assignment`, `study` (study session), `review`. Toggle any type off
in the sidebar to hide it from the calendar without deleting it.

## Local preview

No install needed — just open `index.html` in a browser. If your browser
blocks local scripts from loading, run a tiny local server instead, e.g.
`python3 -m http.server` from this folder, then visit
`http://localhost:8000`.
