// Stockage minimal en fichier JSON (data/db.json).
// Suffisant pour un volume de type PME. Pour un gros volume ou plusieurs
// serveurs en parallèle, remplacer par une vraie base (Postgres, etc.).
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data", "db.json");

function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], loans: [] }, null, 2));
  }
}

function loadDB() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], loans: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { loadDB, saveDB };
