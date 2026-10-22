import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export type Job = {
  id: string;
  slug: string;
  title: string;
  description: string;
  responsibilities: string;
  required_skills: string;
  preferred_skills: string;
  location: string;
  work_arrangement: "Remote" | "Hybrid" | "On-site";
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  application_question: string;
  deadline: string | null;
  published_at: string;
  last_confirmed_at: string;
  status: string;
  is_demo: number;
  organization_name: string;
  verification_status: string;
};

const globalForDb = globalThis as typeof globalThis & { olyvaraDb?: Database.Database };

function ensureApplicationColumns(db: Database.Database) {
  const jobColumns = new Set((db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[]).map((column) => column.name));
  if (!jobColumns.has("application_question")) db.exec("ALTER TABLE jobs ADD COLUMN application_question TEXT NOT NULL DEFAULT ''");
  const applicationColumns = new Set((db.prepare("PRAGMA table_info(applications)").all() as { name: string }[]).map((column) => column.name));
  if (!applicationColumns.has("video_path")) {
    db.exec("ALTER TABLE applications ADD COLUMN video_path TEXT NOT NULL DEFAULT ''");
  }
  if (!applicationColumns.has("cv_path")) {
    db.exec("ALTER TABLE applications ADD COLUMN cv_path TEXT NOT NULL DEFAULT ''");
  }
  if (!applicationColumns.has("project_url")) {
    db.exec("ALTER TABLE applications ADD COLUMN project_url TEXT NOT NULL DEFAULT ''");
  }
  if (!applicationColumns.has("candidate_skills")) {
    db.exec("ALTER TABLE applications ADD COLUMN candidate_skills TEXT NOT NULL DEFAULT ''");
  }
  if (!applicationColumns.has("screening_response")) {
    db.exec("ALTER TABLE applications ADD COLUMN screening_response TEXT NOT NULL DEFAULT ''");
  }
  const profileColumns = new Set((db.prepare("PRAGMA table_info(candidate_profiles)").all() as { name: string }[]).map((column) => column.name));
  for (const [column, definition] of [
    ["about", "TEXT NOT NULL DEFAULT ''"],
    ["experience", "TEXT NOT NULL DEFAULT ''"],
    ["education", "TEXT NOT NULL DEFAULT ''"],
    ["website", "TEXT NOT NULL DEFAULT ''"],
    ["network_visible", "INTEGER NOT NULL DEFAULT 1"],
  ]) {
    if (!profileColumns.has(column)) db.exec(`ALTER TABLE candidate_profiles ADD COLUMN ${column} ${definition}`);
  }
  if (!profileColumns.has("email_job_alerts")) {
    db.exec("ALTER TABLE candidate_profiles ADD COLUMN email_job_alerts INTEGER NOT NULL DEFAULT 0");
  }
  db.exec(`CREATE TABLE IF NOT EXISTS candidate_job_preferences (
    candidate_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    work_arrangement TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT '',
    minimum_salary INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    CHECK (sender_id <> recipient_id),
    UNIQUE(sender_id, recipient_id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT,
    CHECK (sender_id <> recipient_id)
  )`);
  db.exec("CREATE INDEX IF NOT EXISTS connections_recipient ON connections(recipient_id, status, created_at DESC)");
  db.exec("CREATE INDEX IF NOT EXISTS messages_participants ON messages(sender_id, recipient_id, created_at DESC)");
}

function initialize(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('candidate', 'employer', 'admin')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
      provider_user_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (provider, provider_user_id)
    );
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      overview TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'unverified',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      responsibilities TEXT NOT NULL DEFAULT '',
      required_skills TEXT NOT NULL DEFAULT '',
      preferred_skills TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL,
      work_arrangement TEXT NOT NULL CHECK (work_arrangement IN ('Remote', 'Hybrid', 'On-site')),
      employment_type TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT,
      application_question TEXT NOT NULL DEFAULT '',
      deadline TEXT,
      published_at TEXT NOT NULL,
      last_confirmed_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending_moderation', 'published', 'paused', 'expired', 'closed', 'rejected')),
      is_demo INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('submitted', 'received', 'under_review', 'shortlisted', 'interview_invited', 'interview_completed', 'offer_made', 'hired', 'rejected', 'withdrawn', 'position_closed')),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(candidate_id, job_id)
    );
    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      headline TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '',
      email_job_alerts INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saved_jobs (
      candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY(candidate_id, job_id)
    );
    CREATE TABLE IF NOT EXISTS application_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS jobs_public_search ON jobs(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS applications_candidate ON applications(candidate_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS applications_job ON applications(job_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id, expires_at);
    CREATE INDEX IF NOT EXISTS saved_jobs_candidate ON saved_jobs(candidate_id, created_at DESC);
  `);

  ensureApplicationColumns(db);

  if (process.env.SEED_DEMO === "false" || process.env.NODE_ENV === "production") return;
  if ((db.prepare("SELECT COUNT(*) AS count FROM jobs").get() as { count: number }).count > 0) return;

  const createdAt = new Date().toISOString();
  const organizationId = randomUUID();
  const createOrganization = db.prepare(`
    INSERT INTO organizations (id, owner_id, name, overview, location, verification_status, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, 'unverified', 1, ?)
  `);
  createOrganization.run(organizationId, null, "Kifaru Works (Demo)", "A fictional product studio building practical tools for East African businesses.", "Nairobi, Kenya", createdAt);

  const createJob = db.prepare(`
    INSERT INTO jobs (id, organization_id, slug, title, description, responsibilities, required_skills, preferred_skills,
      location, work_arrangement, employment_type, salary_min, salary_max, currency, deadline, published_at,
      last_confirmed_at, status, is_demo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KES', ?, ?, ?, 'published', 1)
  `);
  createJob.run(randomUUID(), organizationId, "product-designer-kifaru-demo", "Product Designer", "Help a small product team turn complex workflows into useful, accessible software. This is a fictional demonstration vacancy.", "Map user journeys; prototype and test product improvements; partner with engineering and research.", "Product design, prototyping, accessibility, user research", "Figma, service design", "Nairobi, Kenya", "Hybrid", "Full-time", 120000, 180000, "2027-03-30", createdAt, createdAt);
  createJob.run(randomUUID(), organizationId, "operations-associate-kifaru-demo", "Operations Associate", "Make day-to-day operations more reliable as a fictional Nairobi team grows. Demonstration data only.", "Coordinate vendor workflows; document processes; identify and resolve operational bottlenecks.", "Operations, communication, spreadsheets", "Process improvement, project coordination", "Kenya", "Remote", "Full-time", 75000, 105000, "2027-04-15", createdAt, createdAt);
}

export function getDb() {
  if (globalForDb.olyvaraDb) {
    ensureApplicationColumns(globalForDb.olyvaraDb);
    return globalForDb.olyvaraDb;
  }
  const databasePath = resolve(process.env.OLYVARA_DATABASE_PATH ?? "./data/olyvara.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
  initialize(db);
  globalForDb.olyvaraDb = db;
  return db;
}

export function listJobs(search = "", location = "", arrangement = "", currency = "", minimumSalary = 0) {
  const query = `%${search.trim()}%`;
  const place = `%${location.trim()}%`;
  return getDb().prepare(`
    SELECT jobs.*, organizations.name AS organization_name, organizations.verification_status
    FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
    WHERE jobs.status = 'published' AND (jobs.deadline IS NULL OR jobs.deadline >= date('now'))
      AND jobs.last_confirmed_at >= datetime('now', '-30 days')
      AND (? = '%%' OR jobs.title LIKE ? OR jobs.description LIKE ? OR jobs.required_skills LIKE ? OR organizations.name LIKE ?)
      AND (? = '%%' OR jobs.location LIKE ? OR jobs.work_arrangement = 'Remote')
      AND (? = '' OR jobs.work_arrangement = ?)
      AND (? = '' OR jobs.currency = ?)
      AND (? = 0 OR jobs.salary_min >= ?)
    ORDER BY jobs.published_at DESC LIMIT 50
  `).all(query, query, query, query, query, place, place, arrangement, arrangement, currency, currency, minimumSalary, minimumSalary) as Job[];
}

export function getJobBySlug(slug: string) {
  return getDb().prepare(`
    SELECT jobs.*, organizations.name AS organization_name, organizations.overview AS organization_overview,
      organizations.verification_status
    FROM jobs JOIN organizations ON organizations.id = jobs.organization_id
    WHERE jobs.slug = ? AND jobs.status = 'published'
      AND (jobs.deadline IS NULL OR jobs.deadline >= date('now'))
      AND jobs.last_confirmed_at >= datetime('now', '-30 days')
  `).get(slug) as (Job & { organization_overview: string }) | undefined;
}