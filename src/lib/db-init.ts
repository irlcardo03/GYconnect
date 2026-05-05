import turso from './turso'

const CREATE_TABLES = `
-- Countries
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (country_code) REFERENCES countries(code)
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  telegram_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  country_code TEXT NOT NULL DEFAULT '',
  city_id TEXT,
  position TEXT NOT NULL DEFAULT '',
  looking_for TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  mood TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  vibes TEXT NOT NULL DEFAULT '',
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at TEXT,
  profile_views INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active TEXT NOT NULL DEFAULT (datetime('now')),
  is_banned INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  daily_chats_used INTEGER NOT NULL DEFAULT 0,
  daily_likes_used INTEGER NOT NULL DEFAULT 0,
  daily_photos_sent INTEGER NOT NULL DEFAULT 0,
  daily_voice_sent INTEGER NOT NULL DEFAULT 0,
  daily_super_likes_used INTEGER NOT NULL DEFAULT 0,
  daily_boost_used INTEGER NOT NULL DEFAULT 0,
  daily_rewind_used INTEGER NOT NULL DEFAULT 0,
  daily_reset TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Matches (likes)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'like',
  is_matched INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (from_id) REFERENCES profiles(id),
  FOREIGN KEY (to_id) REFERENCES profiles(id),
  UNIQUE(from_id, to_id)
);

-- Chat rooms
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct',
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chat members
CREATE TABLE IF NOT EXISTS chat_members (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  UNIQUE(chat_id, profile_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',
  media_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  disappears_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (sender_id) REFERENCES profiles(id)
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  member_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  UNIQUE(group_id, profile_id)
);

-- Group messages
CREATE TABLE IF NOT EXISTS group_messages (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (sender_id) REFERENCES profiles(id)
);

-- Blocks
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (blocker_id) REFERENCES profiles(id),
  FOREIGN KEY (blocked_id) REFERENCES profiles(id),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reported_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporter_id) REFERENCES profiles(id),
  FOREIGN KEY (reported_id) REFERENCES profiles(id),
  UNIQUE(reporter_id, reported_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  txid TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Daily vibes
CREATE TABLE IF NOT EXISTS daily_vibes (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Promo codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_uses INTEGER NOT NULL DEFAULT 0,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Promo code usage
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id TEXT PRIMARY KEY,
  promo_code_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id),
  UNIQUE(promo_code_id, profile_id)
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  inviter_id TEXT NOT NULL,
  invitee_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (inviter_id) REFERENCES profiles(id),
  FOREIGN KEY (invitee_id) REFERENCES profiles(id)
);

-- Ephemeral media (photos & voice notes)
CREATE TABLE IF NOT EXISTS ephemeral_media (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'photo',
  data TEXT NOT NULL DEFAULT '',
  viewed INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sender_id) REFERENCES profiles(id),
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);

-- Profile notes (private notes on other profiles - Gold+)
CREATE TABLE IF NOT EXISTS profile_notes (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES profiles(id),
  FOREIGN KEY (target_id) REFERENCES profiles(id),
  UNIQUE(owner_id, target_id)
);

-- Profile views (who viewed who - Diamond)
CREATE TABLE IF NOT EXISTS profile_views (
  id TEXT PRIMARY KEY,
  viewer_id TEXT NOT NULL,
  viewed_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (viewer_id) REFERENCES profiles(id),
  FOREIGN KEY (viewed_id) REFERENCES profiles(id)
);
`

const SEED_COUNTRIES = `
INSERT OR IGNORE INTO countries (id, name, code, flag) VALUES ('tz', 'Tanzania', 'TZ', '🇹🇿');
INSERT OR IGNORE INTO countries (id, name, code, flag) VALUES ('ke', 'Kenya', 'KE', '🇰🇪');
INSERT OR IGNORE INTO countries (id, name, code, flag) VALUES ('za', 'South Africa', 'ZA', '🇿🇦');
INSERT OR IGNORE INTO countries (id, name, code, flag) VALUES ('in', 'India', 'IN', '🇮🇳');
INSERT OR IGNORE INTO countries (id, name, code, flag) VALUES ('ph', 'Philippines', 'PH', '🇵🇭');
`

const SEED_CITIES = `
-- Tanzania
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-1', 'TZ', 'Dar es Salaam');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-2', 'TZ', 'Dodoma');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-3', 'TZ', 'Arusha');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-4', 'TZ', 'Mwanza');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-5', 'TZ', 'Zanzibar');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-6', 'TZ', 'Tanga');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-7', 'TZ', 'Mbeya');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-8', 'TZ', 'Morogoro');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-9', 'TZ', 'Moshi');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('tz-10', 'TZ', 'Kilimanjaro');

-- Kenya
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-1', 'KE', 'Nairobi');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-2', 'KE', 'Mombasa');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-3', 'KE', 'Kisumu');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-4', 'KE', 'Nakuru');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-5', 'KE', 'Eldoret');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-6', 'KE', 'Malindi');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-7', 'KE', 'Thika');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-8', 'KE', 'Nyeri');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-9', 'KE', 'Nanyuki');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ke-10', 'KE', 'Diani');

-- South Africa
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-1', 'ZA', 'Johannesburg');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-2', 'ZA', 'Cape Town');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-3', 'ZA', 'Durban');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-4', 'ZA', 'Pretoria');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-5', 'ZA', 'Port Elizabeth');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-6', 'ZA', 'Stellenbosch');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-7', 'ZA', 'Bloemfontein');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-8', 'ZA', 'Sandton');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-9', 'ZA', 'Centurion');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('za-10', 'ZA', 'Soweto');

-- India
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-1', 'IN', 'Mumbai');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-2', 'IN', 'Delhi');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-3', 'IN', 'Bangalore');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-4', 'IN', 'Chennai');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-5', 'IN', 'Hyderabad');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-6', 'IN', 'Kolkata');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-7', 'IN', 'Pune');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-8', 'IN', 'Goa');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-9', 'IN', 'Jaipur');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('in-10', 'IN', 'Ahmedabad');

-- Philippines
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-1', 'PH', 'Manila');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-2', 'PH', 'Cebu City');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-3', 'PH', 'Davao');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-4', 'PH', 'Quezon City');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-5', 'PH', 'Baguio');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-6', 'PH', 'Iloilo City');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-7', 'PH', 'Cagayan de Oro');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-8', 'PH', 'Makati');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-9', 'PH', 'Boracay');
INSERT OR IGNORE INTO cities (id, country_code, name) VALUES ('ph-10', 'PH', 'Taguig');
`

const SEED_GROUPS = `
INSERT OR IGNORE INTO groups (id, country_code, name, description, is_default) VALUES ('grp-tz', 'TZ', 'Tanzania Community', 'Connect with the LGBTQ+ community in Tanzania', 1);
INSERT OR IGNORE INTO groups (id, country_code, name, description, is_default) VALUES ('grp-ke', 'KE', 'Kenya Community', 'Connect with the LGBTQ+ community in Kenya', 1);
INSERT OR IGNORE INTO groups (id, country_code, name, description, is_default) VALUES ('grp-za', 'ZA', 'South Africa Community', 'Connect with the LGBTQ+ community in South Africa', 1);
INSERT OR IGNORE INTO groups (id, country_code, name, description, is_default) VALUES ('grp-in', 'IN', 'India Community', 'Connect with the LGBTQ+ community in India', 1);
INSERT OR IGNORE INTO groups (id, country_code, name, description, is_default) VALUES ('grp-ph', 'PH', 'Philippines Community', 'Connect with the LGBTQ+ community in Philippines', 1);
`

const SEED_SETTINGS = `
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('freemium_mode', 'true');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('grant_all_gold', 'true');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('support_channel', 'https://t.me/+QAQB2vigDAlhOGFk');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('celo_usdt_wallet', '0x712c79c774f335c81Bd4A46EffF948bCa9867Ab8');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('solana_wallet', '4BCiiEGbD3bMakErgjc1EpVKPKE17y8onEVo6GM9XzpC');
`

export async function initializeDatabase() {
  try {
    // Execute each statement individually for better error handling
    const statements = CREATE_TABLES.split(';').filter(s => s.trim())
    for (const stmt of statements) {
      try {
        await turso.execute(stmt.trim())
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          console.error('Table creation error:', e.message)
        }
      }
    }

    // Seed data
    const seedStatements = [
      ...SEED_COUNTRIES.split(';').filter(s => s.trim()),
      ...SEED_CITIES.split(';').filter(s => s.trim()),
      ...SEED_GROUPS.split(';').filter(s => s.trim()),
      ...SEED_SETTINGS.split(';').filter(s => s.trim()),
    ]

    for (const stmt of seedStatements) {
      try {
        await turso.execute(stmt.trim())
      } catch (e: any) {
        if (!e.message?.includes('UNIQUE constraint')) {
          console.error('Seed error:', e.message)
        }
      }
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

export default initializeDatabase
