/* ===================== SNEAKY STEALTH COURSE =====================
   App logic: rooms, countdown, team scoring, Google Sheet sync.
   ================================================================ */

(function () {
  "use strict";

  const CONFIG = window.CONFIG || {};
  const TEAMS = ["Bradman", "Jackson", "Elliot", "Fraser"];
  const TEAM_CLASS = { Bradman: "red", Jackson: "green", Elliot: "yellow", Fraser: "blue" };
  const ROOM_COUNT = 10;
  const LOCKOUT_MS = 2000;
  const STORE_KEY = "sneakyStealthScores";

  // ---------- State ----------
  let currentRoom = null;            // active room number (1..10) or null
  let gameOver = false;
  let scores = loadScores();         // { Bradman: n, Jackson: n, ... }

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const roomPoints = (n) => n / 10;  // Room N gives N/10 points

  function loadScores() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (saved) return saved;
    } catch (e) { /* ignore */ }
    return TEAMS.reduce((acc, t) => ((acc[t] = 0), acc), {});
  }

  function saveScores() {
    localStorage.setItem(STORE_KEY, JSON.stringify(scores));
  }

  // ---------- View switching ----------
  function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const view = document.getElementById(id);
    if (view) view.classList.add("active");
    document.body.classList.toggle("in-room", id === "room");
    if (id !== "room") currentRoom = null;
    if (id === "scoreboard") renderBoard();
  }

  // ---------- Build room buttons ----------
  function buildRooms() {
    const grid = $("#roomGrid");
    let html = "";
    for (let n = 1; n <= ROOM_COUNT; n++) {
      html += `<button class="room-btn" data-room="${n}">ROOM ${n}` +
              `<span class="rp">${roomPoints(n).toFixed(1)} pts</span></button>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll(".room-btn").forEach((btn) => {
      btn.addEventListener("click", () => enterRoom(Number(btn.dataset.room)));
    });
  }

  function enterRoom(n) {
    currentRoom = n;
    $("#roomName").textContent = "Room " + n;
    $("#roomPoints").textContent = roomPoints(n).toFixed(1);
    showView("room");
  }

  // ---------- Team scoring ----------
  function setupTeamButtons() {
    document.querySelectorAll(".team-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleTeamTap(btn));
    });
  }

  function handleTeamTap(btn) {
    if (gameOver || currentRoom === null) return;
    if (btn.classList.contains("locked")) return;

    const team = btn.dataset.team;
    const pts = roomPoints(currentRoom);

    // Update score
    scores[team] = +(scores[team] + pts).toFixed(1);
    saveScores();

    // Flash animation
    btn.classList.add("flash");
    setTimeout(() => btn.classList.remove("flash"), 350);

    // Lock out for 2 seconds
    btn.classList.add("locked");
    setTimeout(() => btn.classList.remove("locked"), LOCKOUT_MS);

    // Send to Google Sheet
    sendToSheet(team, pts, currentRoom);
  }

  // ---------- Scoreboard ----------
  function renderBoard() {
    const board = $("#board");
    board.innerHTML = TEAMS.map((t) =>
      `<div class="score-row ${TEAM_CLASS[t]}">` +
      `<span class="team-name">${t}</span>` +
      `<span class="team-score" data-score="${t}">${scores[t].toFixed(1)}</span>` +
      `</div>`
    ).join("");

    const note = $("#syncNote");
    note.textContent = CONFIG.GOOGLE_SCRIPT_URL
      ? "Live scores synced from Google Sheet."
      : "Offline mode — scores stored in this browser only.";
  }

  function updateBoardScores() {
    document.querySelectorAll("[data-score]").forEach((el) => {
      el.textContent = scores[el.dataset.score].toFixed(1);
    });
  }

  // ---------- Google Sheet sync ----------
  function sendToSheet(team, points, room) {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    const body = JSON.stringify({ team, points, room, ts: new Date().toISOString() });
    // text/plain avoids a CORS preflight against Apps Script
    fetch(CONFIG.GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    }).catch((err) => console.warn("Sheet POST failed:", err));
  }

  // Reads use JSONP: a browser cannot read Apps Script's JSON response
  // directly (no CORS headers), but it can load it as a <script>.
  function pollSheet() {
    if (!CONFIG.GOOGLE_SCRIPT_URL) return;
    const cb = "ssc_cb_" + Date.now();
    const script = document.createElement("script");

    const cleanup = () => {
      delete window[cb];
      script.remove();
    };

    window[cb] = (data) => {
      if (data && data.totals) {
        TEAMS.forEach((t) => {
          if (typeof data.totals[t] === "number") {
            scores[t] = +data.totals[t].toFixed(1);
          }
        });
        saveScores();
        updateBoardScores();
      }
      cleanup();
    };

    script.onerror = () => {
      console.warn("Sheet GET (JSONP) failed");
      cleanup();
    };
    const sep = CONFIG.GOOGLE_SCRIPT_URL.indexOf("?") === -1 ? "?" : "&";
    script.src = CONFIG.GOOGLE_SCRIPT_URL + sep + "callback=" + cb;
    document.body.appendChild(script);
  }

  // ---------- Countdown ----------
  function startCountdown() {
    const target = new Date(CONFIG.TARGET_ISO).getTime();
    const clockEl = $("#clock");

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        clockEl.textContent = "00:00:00:00";
        triggerGameOver();
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      clockEl.textContent =
        pad(d) + ":" + pad(h) + ":" + pad(m) + ":" + pad(s);
      requestAnimationFrame(() => setTimeout(tick, 1000));
    }
    tick();
  }

  const pad = (n) => String(n).padStart(2, "0");

  function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    $("#gameOver").hidden = false;
    document.querySelectorAll(".team-btn").forEach((b) => b.classList.add("locked"));
  }

  // ---------- Nav buttons ----------
  function setupNav() {
    document.querySelectorAll("[data-target]").forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.target));
    });
  }

  // ---------- Init ----------
  function init() {
    buildRooms();
    setupTeamButtons();
    setupNav();
    startCountdown();
    showView("hall");

    if (CONFIG.GOOGLE_SCRIPT_URL) {
      pollSheet();
      setInterval(pollSheet, CONFIG.POLL_INTERVAL_MS || 5000);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
