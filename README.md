# Sneaky Stealth Course

A stealth-themed, browser-based scoring game. Black background, yellow text,
a red mission countdown, 10 rooms, four house teams, and a live scoreboard
that syncs to a Google Sheet.

![theme](https://img.shields.io/badge/theme-stealth-ffd60a?labelColor=000000)

## How it works

- **10 rooms** — each room awards points equal to its number ÷ 10
  (Room 1 = 0.1 pts … Room 9 = 0.9 pts), except **Room 10 is worth 5 pts**.
  Inside a room you see the words **Sneaky Stealth** and the room's point value.
  Room 10 also switches to a special gold-themed look while you're inside it —
  every other room stays the plain black/yellow stealth theme.
- **Red countdown clock** — counts down to **Tuesday 30 June 2026, 2:40 PM AEST**.
  When it hits zero a **GAME OVER — Return to Hall** message covers the screen
  and scoring is disabled.
- **Four team buttons** (fixed at the bottom while in a room):
  | Button | Colour | Team |
  |--------|--------|---------|
  | Red    | 🔴     | Bradman |
  | Green  | 🟢     | Jackson |
  | Yellow | 🟡     | Elliot  |
  | Blue   | 🔵     | Fraser  |

  Tapping a team button adds the current room's points to that team, shows a
  tiny flash plus a confetti burst across the screen, then locks the button
  for **1 second**. Each tap is sent to the Google Sheet.
- **Live scoreboard** — shows the running total for all four teams.

## Run it locally

It's plain HTML/CSS/JS — just open `index.html`, or serve the folder:

```bash
# Python
python -m http.server 8000
# then visit http://localhost:8000
```

The app works **offline out of the box** (scores stored in the browser).
Google Sheet sync is optional — set it up below to share scores across devices.

## Connect a Google Sheet (optional but recommended)

1. Create a new Google Sheet.
2. **Extensions → Apps Script**. Delete the default code.
3. Paste the contents of [`google-apps-script.gs`](google-apps-script.gs) and **Save**.
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Authorise when prompted, then copy the **Web app URL** (ends in `/exec`).
6. Open [`config.js`](config.js) and paste it:

   ```js
   GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfy.../exec",
   ```

That's it. Taps now append rows to the sheet, and the scoreboard polls the
sheet every few seconds so every device shows the same live totals.

## Deploy to GitHub Pages

1. Create a new GitHub repo named **`sneaky-stealth-course`** and push these files.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. Your app goes live at `https://<your-username>.github.io/sneaky-stealth-course/`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure (hall, room, scoreboard, game-over) |
| `style.css` | Stealth theme + flash/lockout styling |
| `script.js` | Rooms, countdown, scoring, sheet sync |
| `config.js` | Your Google Script URL + countdown target |
| `google-apps-script.gs` | Backend that writes to / reads from the Sheet |

## Customising

- **Countdown target** — `config.js → TARGET_ISO`.
- **Points per room** — `script.js → roomPoints()` (`n / 10`, Room 10 = 5).
- **Lockout time** — `script.js → LOCKOUT_MS` (currently `1000`).
