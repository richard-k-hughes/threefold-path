const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // adjust origin in production
app.use(bodyParser.json());

const DATA_FILE = path.resolve(__dirname, 'backlog.json');

function readBacklog() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read backlog:', e);
    return [];
  }
}

function writeBacklog(tasks) {
  // atomic write: write to temp then rename
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(tasks, null, 2), 'utf-8');
  fs.renameSync(tmp, DATA_FILE);
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

// optional: replace entire list
app.put('/backlog', (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: 'Tasks must be an array' });
  }
  writeBacklog(tasks.map(t => String(t)));
  res.json(tasks);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backlog API listening on port ${PORT}`);
});
