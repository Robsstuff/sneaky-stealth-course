/* ===================== CONFIGURATION =====================
   Edit the values below to wire the app to your Google Sheet.

   1. Follow the steps in README.md to deploy the Apps Script.
   2. Paste the deployed Web-App URL into GOOGLE_SCRIPT_URL.

   If GOOGLE_SCRIPT_URL is left blank, the app still works fully
   offline — scores are kept in the browser (localStorage) only.
   ========================================================= */

window.CONFIG = {
  // Paste your Google Apps Script web-app URL here (ends in /exec)
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwdKAVmwKzBgQ8iuFwnIdFxm_UJ2cW7LZ1asMIRidcVzUJIv_4pWenpJiaGC4m_1tQQ4w/exec",

  // How often (ms) the scoreboard refreshes from the Google Sheet
  POLL_INTERVAL_MS: 5000,

  // Countdown target: Tue 30 June 2026, 2:40 PM AEST (UTC+10)
  TARGET_ISO: "2026-06-30T14:40:00+10:00",
};
