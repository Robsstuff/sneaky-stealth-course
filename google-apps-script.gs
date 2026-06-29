/* ============================================================
   SNEAKY STEALTH COURSE — Google Apps Script backend
   ------------------------------------------------------------
   Receives score taps (doPost) and serves live totals (doGet).

   SETUP (see README.md for full walkthrough):
   1. Create a Google Sheet. Note the first tab name (default "Sheet1").
   2. Extensions > Apps Script. Delete any code, paste this file.
   3. Deploy > New deployment > Web app.
        - Execute as:  Me
        - Who has access:  Anyone
   4. Copy the /exec URL into config.js -> GOOGLE_SCRIPT_URL.

   The sheet stores one row per tap:
     timestamp | team | room | points
   ============================================================ */

var TEAMS = ["Bradman", "Jackson", "Elliot", "Fraser"];
var SHEET_NAME = "Sheet1";

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "team", "room", "points"]);
  }
  return sheet;
}

/* ---- Record a tap ---- */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (TEAMS.indexOf(data.team) === -1) {
      return jsonOut({ ok: false, error: "unknown team" });
    }
    getSheet().appendRow([
      data.ts || new Date().toISOString(),
      data.team,
      data.room,
      Number(data.points) || 0,
    ]);
    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

/* ---- Serve live totals ----
   Supports JSONP: the browser loads this via a <script> tag with a
   ?callback=fn param, which sidesteps the CORS limit on Apps Script. */
function doGet(e) {
  var sheet = getSheet();
  var totals = {};
  TEAMS.forEach(function (t) { totals[t] = 0; });

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var rows = sheet.getRange(2, 2, lastRow - 1, 3).getValues(); // team, room, points
    rows.forEach(function (r) {
      var team = r[0];
      var pts = Number(r[2]) || 0;
      if (totals.hasOwnProperty(team)) totals[team] += pts;
    });
  }
  // round to 1 decimal to avoid float drift
  TEAMS.forEach(function (t) { totals[t] = Math.round(totals[t] * 10) / 10; });

  var callback = e && e.parameter && e.parameter.callback;
  return jsonOut({ ok: true, totals: totals }, callback);
}

function jsonOut(obj, callback) {
  var body = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + body + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}
