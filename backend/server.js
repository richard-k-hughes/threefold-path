const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // adjust origin in production
app.use(bodyParser.json({ limit: '1mb' }));

const BACKLOG_DATA_FILE = path.resolve(__dirname, 'backlog.json');
const STATE_DATA_FILE = path.resolve(__dirname, 'state.json');
const HISTORY_DIR = path.resolve(__dirname, 'history'); // NEW: history snapshots live here

function readBacklog() {
  try {
    const raw = fs.readFileSync(BACKLOG_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read backlog:', e);
    return [];
  }
}

function writeBacklog(tasks) {
  // atomic write: write to temp then rename
  const tmp = BACKLOG_DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(tasks, null, 2), 'utf-8');
  fs.renameSync(tmp, BACKLOG_DATA_FILE);
}

app.get('/backlog', (req, res) => {
  const tasks = readBacklog();
  res.json(tasks);
});

app.post('/backlog', (req, res) => {
  const { task } = req.body;
  if (!task || typeof task !== 'string' || !task.trim()) {
    return res.status(400).json({ error: 'Invalid task' });
  }

  const tasks = readBacklog();
  tasks.push(task.trim());
  writeBacklog(tasks);
  res.status(201).json(tasks);
});

app.delete('/backlog', (req, res) => {
  const { task } = req.body;
  if (!task || typeof task !== 'string') {
    return res.status(400).json({ error: 'Invalid task' });
  }

  let tasks = readBacklog();
  tasks = tasks.filter(t => t !== task);
  writeBacklog(tasks);
  res.json(tasks);
});

app.put('/backlog', (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks must be an array' });
  }
  writeBacklog(tasks.map(t => String(t)));
  res.json(tasks);
});

app.get('/state', (req, res) => {
  const state = readState();
  res.json(state);
});

app.put('/state', (req, res) => {
  const newState = req.body;
  if (!newState || !Array.isArray(newState.days)) {
    return res.status(400).json({ error: 'Invalid payload: expected { days: [...] }' });
  }
  writeState(newState);
  res.json(newState);
});

function readState() {
  try {
    const raw = fs.readFileSync(STATE_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read state.json:', e);
    return { days: [] }; // weekOf/weekly may be added later by clients
  }
}

function writeState(state) {
  const tmp = STATE_DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmp, STATE_DATA_FILE);
}

// ===== Archiving helpers & route =====
function mondayOf(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun..6=Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
function iso(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
function ensureHistoryDir() {
  try { fs.mkdirSync(HISTORY_DIR, { recursive: true }); } catch {}
}

/**
 * POST /archive-week
 * If state.weekOf < current Monday (ISO), writes a snapshot to:
 *   history/week-of-<state.weekOf>.json
 * Safe to call multiple times; won’t overwrite existing snapshots.
 */
app.post('/archive-week', (req, res) => {
  try {
    const state = readState();
    const currentMondayIso = iso(mondayOf(new Date()));
    const priorWeekOf = state?.weekOf; // expected ISO "YYYY-MM-DD"

    if (!priorWeekOf || typeof priorWeekOf !== 'string') {
      return res.json({ archived: false, reason: 'no_prior_weekOf' });
    }
    // ISO YYYY-MM-DD strings compare lexicographically
    if (priorWeekOf >= currentMondayIso) {
      return res.json({ archived: false, reason: 'up_to_date', currentMondayIso });
    }

    ensureHistoryDir();
    const snapshotPath = path.join(HISTORY_DIR, `week-of-${priorWeekOf}.json`);
    if (fs.existsSync(snapshotPath)) {
      return res.json({ archived: false, alreadyExists: true, path: snapshotPath });
    }

    // atomic write
    const tmp = snapshotPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmp, snapshotPath);

    return res.json({ archived: true, from: priorWeekOf, to: currentMondayIso, path: snapshotPath });
  } catch (e) {
    console.error('archive-week failed:', e);
    return res.status(500).json({ error: 'archive_failed' });
  }
});
// ===== end archiving =====

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backlog API listening on port ${PORT}`);
});
