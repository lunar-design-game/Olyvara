import { randomUUID, randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

const scrypt = promisify(scryptCallback);
const prompt = createInterface({ input: process.stdin, output: process.stdout });
const email = (await prompt.question("Administrator email: ")).trim().toLowerCase();
const name = (await prompt.question("Administrator name: ")).trim();
const password = await prompt.question("Password (12+ characters): ");
prompt.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || password.length < 12 || password.length > 128) {
  console.error("Provide a valid email, name, and password between 12 and 128 characters.");
  process.exit(1);
}

const databasePath = resolve(process.env.OLYVARA_DATABASE_PATH ?? "./data/olyvara.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });
const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'employer', 'admin')),
  created_at TEXT NOT NULL
)`);
if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
  console.error("An account already uses that email.");
  db.close();
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = (await scrypt(password, salt, 64)).toString("hex");
db.prepare("INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, 'admin', ?)")
  .run(randomUUID(), email, name, `${salt}:${hash}`, new Date().toISOString());
db.close();
console.log("Administrator created. Sign in to review submitted vacancies.");