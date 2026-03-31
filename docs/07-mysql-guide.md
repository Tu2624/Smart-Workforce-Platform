# 07 — MySQL Guide for the Project
## Smart Workforce Platform

> This guide covers MySQL from the basics up to what is needed for this project, aligned with the existing stack and design decisions.
> Read this file before writing any service file.

---

## 1. What is MySQL, How Does It Differ From PostgreSQL

MySQL and PostgreSQL are both **relational databases** — they store data in tables, support SQL, and have foreign keys and transactions. This project uses MySQL because it is widely supported, easy to host, and available on most budget hosting providers.

**The most important differences for this project:**

| Issue | PostgreSQL | MySQL (used in this project) |
|-------|-----------|------------------------------|
| UUID primary key | `UUID DEFAULT gen_random_uuid()` | `CHAR(36) DEFAULT (UUID())` |
| Timezone-aware timestamp | `TIMESTAMPTZ` | `DATETIME` (store UTC+7 directly) |
| Data arrays | `TEXT[]` | `JSON` |
| Get row after INSERT | `RETURNING id, ...` | Not available — generate UUID before INSERT |
| Query placeholder | `$1, $2, $3` | `?` |
| Node.js driver | `pg` | `mysql2` |
| Migration tool | `node-pg-migrate` | `db-migrate` |
| Time calculation | `EXTRACT(EPOCH FROM ...)` | `TIMESTAMPDIFF(UNIT, start, end)` |
| Unique error code | `err.code === '23505'` | `err.code === 'ER_DUP_ENTRY'` |

---

## 2. Installing MySQL 8

### Windows
1. Download MySQL Installer from `dev.mysql.com/downloads/installer/`
2. Select "MySQL Server 8.0.x" → Custom Install
3. During installation: set a root password and remember it
4. After installation, open **MySQL Command Line Client** and enter the password

### Verify the installation
```bash
mysql -u root -p
# Enter password → enter MySQL shell
mysql> SELECT VERSION();
# Should show: 8.x.x
mysql> EXIT;
```

### If the `mysql` command does not run (Windows)
Add MySQL to PATH: `C:\Program Files\MySQL\MySQL Server 8.0\bin`

---

## 3. Create the Project Database

After installing MySQL, create a database and user for the project (do not use root for the application):

```sql
-- Login as root
mysql -u root -p

-- Create database with utf8mb4 charset (supports emoji and all Unicode)
CREATE DATABASE smart_workforce
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user for the app (do not use root)
CREATE USER 'sw_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON smart_workforce.* TO 'sw_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
-- smart_workforce should appear in the list

EXIT;
```

> **Why utf8mb4?** MySQL has two charsets with similar names but different behavior:
> - `utf8` — actually only UTF-8 with up to 3 bytes; cannot encode emoji and some special characters
> - `utf8mb4` — true UTF-8 (4 bytes); encodes everything
>
> Always use `utf8mb4`.

---

## 4. Data Types Used in the Project

### CHAR(36) — Primary Keys (UUID)

```sql
id CHAR(36) PRIMARY KEY DEFAULT (UUID())
```

A UUID looks like this: `550e8400-e29b-41d4-a716-446655440000` — always 36 characters.

MySQL 8 has a `UUID()` function that returns a UUID string, but `DEFAULT UUID()` (without outer parentheses) is interpreted as a column name. You must write `DEFAULT (UUID())` with parentheses around the function call.

**Why not AUTO_INCREMENT integer?** This project uses UUIDs because:
- IDs are not guessable (better security)
- The ID can be generated in TypeScript before the INSERT (important since there is no `RETURNING`)

### DATETIME — Timestamps

```sql
created_at DATETIME DEFAULT NOW(),
updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
```

Unlike PostgreSQL's `TIMESTAMPTZ`, `DATETIME` is timezone-unaware. This project stores UTC+7 directly — everything uses UTC+7, no conversion.

`ON UPDATE NOW()` is a MySQL-specific feature — it automatically updates `updated_at` whenever any field in the row changes.

### ENUM — Fixed States

```sql
role   ENUM('student', 'employer', 'admin') NOT NULL
status ENUM('open', 'full', 'ongoing', 'completed', 'cancelled') DEFAULT 'open'
```

ENUM restricts valid values at the DB level. If you INSERT a value not in the list → MySQL throws an error immediately.

> **Note**: Adding a new ENUM value requires `ALTER TABLE` and a new migration file. Never edit an existing migration.

### DECIMAL — Precise Decimals

```sql
hourly_rate      DECIMAL(10,2)   -- up to 10 digits, 2 after decimal. e.g.: 99999999.99
reputation_score DECIMAL(4,2)    -- up to 4 digits, 2 after decimal. e.g.: 200.00
hours_worked     DECIMAL(5,2)    -- e.g.: 999.99 hours
```

Use `DECIMAL` (not `FLOAT` or `DOUBLE`) for money and scores — no floating-point rounding errors.

### JSON — Arrays and Metadata

```sql
skills   JSON   -- ["communication", "agility"]
metadata JSON   -- { "shift_id": "uuid", "job_title": "..." }
```

MySQL 8 has a JSON column type that stores and validates JSON automatically. When reading, the `mysql2` driver usually auto-parses it into a JavaScript object/array.

### DATE vs DATETIME

```sql
period_start DATE   -- date only: 2024-03-01
period_end   DATE   -- date only: 2024-03-31

created_at   DATETIME  -- date + time: 2024-03-01 08:30:00
```

`DATE` is used for payroll periods (1st to last day of month) — no time component needed.

### BOOLEAN

```sql
is_active    BOOLEAN DEFAULT TRUE
auto_assign  BOOLEAN DEFAULT FALSE
```

Stored as `TINYINT(1)` internally in MySQL. Values: `TRUE`/`FALSE` or `1`/`0` — both work.

---

## 5. Basic SQL Syntax (MySQL Flavor)

### CREATE TABLE

```sql
-- Standard project pattern:
CREATE TABLE shift_registrations (
  id            CHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  shift_id      CHAR(36)  NOT NULL,
  student_id    CHAR(36)  NOT NULL,
  status        ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  registered_at DATETIME  DEFAULT NOW(),
  reviewed_at   DATETIME,         -- can be NULL (not yet reviewed)
  reviewed_by   CHAR(36),         -- can be NULL

  -- Constraints at the end (not inline like PostgreSQL)
  UNIQUE (shift_id, student_id),
  FOREIGN KEY (shift_id)    REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Difference from PostgreSQL**: Foreign keys must be declared separately with `FOREIGN KEY (column) REFERENCES ...`; you cannot inline them as in PostgreSQL: `shift_id UUID REFERENCES shifts(id)`.

### INSERT

```sql
-- MySQL has no RETURNING — must provide id upfront
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES ('550e8400-...', 'user@email.com', '$2b$...', 'Nguyen Van A', 'student');
```

### SELECT

```sql
-- Get 1 row
SELECT * FROM users WHERE id = '550e8400-...';

-- Get multiple rows with filter
SELECT id, email, full_name FROM users WHERE role = 'student' AND is_active = TRUE;

-- JOIN
SELECT
  u.full_name,
  sp.reputation_score,
  sp.university
FROM users u
JOIN student_profiles sp ON sp.user_id = u.id
WHERE u.role = 'student';

-- Pagination
SELECT * FROM shifts WHERE status = 'open' ORDER BY start_time ASC LIMIT 10 OFFSET 0;
```

### UPDATE

```sql
-- Standard update
UPDATE users SET is_active = FALSE WHERE id = '550e8400-...';

-- UPDATE with JOIN (MySQL specific — PostgreSQL uses UPDATE...FROM)
UPDATE attendance a
JOIN shifts s ON a.shift_id = s.id
SET a.hours_worked = TIMESTAMPDIFF(SECOND, a.check_in_time, NOW()) / 3600,
    a.status = 'on_time'
WHERE a.id = '...';
```

### DELETE

```sql
DELETE FROM shift_registrations WHERE id = '...';
-- Rows in other tables with FOREIGN KEY → ON DELETE CASCADE will be deleted automatically
```

### Checking time overlap (replacing PostgreSQL's OVERLAPS)

```sql
-- Find shifts that overlap with shift A (start_a, end_a):
SELECT * FROM shifts s
JOIN shift_registrations sr ON sr.shift_id = s.id
WHERE sr.student_id = ?
  AND sr.status IN ('pending', 'approved')
  AND NOT (s.end_time <= ? OR s.start_time >= ?)
  -- Params: [studentId, start_a, end_a]
  -- Logic: NOT (shift ends before A starts OR shift starts after A ends)
  --      = this shift overlaps with shift A
```

---

## 6. Important MySQL Functions Used in the Project

### TIMESTAMPDIFF — Calculate Time Difference

```sql
-- Minutes from start_time to check_in_time
TIMESTAMPDIFF(MINUTE, shift.start_time, attendance.check_in_time)
-- → 10 if student arrived 10 minutes late

-- Seconds from check_in to check_out, then convert to hours
TIMESTAMPDIFF(SECOND, check_in_time, check_out_time) / 3600
-- → 3.5 if worked 3.5 hours

-- Supported units: SECOND, MINUTE, HOUR, DAY, WEEK, MONTH, YEAR
```

### GREATEST and LEAST — Max/Min Across Values

```sql
-- Ensure late_minutes is not negative (if arrived early → 0, not a negative number)
GREATEST(0, TIMESTAMPDIFF(MINUTE, shift.start_time, check_in_time))
-- → 0 if on time or early
-- → 7 if 7 minutes late

-- Cap hours_worked at shift duration (do not count overtime after shift ends)
LEAST(
  TIMESTAMPDIFF(SECOND, check_in_time, check_out_time) / 3600,
  TIMESTAMPDIFF(SECOND, shift.start_time, shift.end_time) / 3600
)
```

### NOW() — Current Time

```sql
-- Used in DEFAULT
created_at DATETIME DEFAULT NOW()

-- Used in WHERE
SELECT * FROM shifts WHERE start_time <= NOW() AND status = 'ongoing';

-- Used in INSERT
INSERT INTO attendance (check_in_time) VALUES (NOW());
```

### DATE_FORMAT — Format Dates

```sql
-- Format a date as a readable string
SELECT DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') AS formatted_date FROM shifts;
-- → "25/03/2024 08:00"
```

### YEAR, MONTH — Extract Year/Month

```sql
-- Find payroll for the current month
SELECT * FROM payroll
WHERE YEAR(period_start) = YEAR(NOW())
  AND MONTH(period_start) = MONTH(NOW())
  AND student_id = ?;
```

---

## 7. Using mysql2 in Node.js / TypeScript

### Installation

```bash
npm install mysql2 uuid
npm install --save-dev @types/uuid
```

### Connection (src/config/database.ts)

```typescript
import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME     || 'smart_workforce',
  user:     process.env.DB_USER     || 'sw_user',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,   // max 10 simultaneous connections
  queueLimit: 0,         // no limit on queue when connections are exhausted
  timezone: '+07:00',    // IMPORTANT: ensures correct DATETIME ↔ JS Date conversion in UTC+7
})

export default pool
```

> `pool` vs `connection`: Use `pool` (connection pool) instead of a single connection.
> The pool manages multiple connections automatically and reconnects when the connection is lost — appropriate for a continuously running server.

### SELECT — Reading Data

```typescript
import pool from '../config/database'

// mysql2 returns a TUPLE [rows, fields], not { rows }
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
// rows is an array — (rows as any[])[0] is the first row

const user = (rows as any[])[0]
if (!user) {
  throw new Error('USER_NOT_FOUND')
}

// Get multiple rows:
const [rows] = await pool.query(
  'SELECT * FROM shifts WHERE employer_id = ? AND status = ?',
  ['uuid-123', 'open']
)
const shifts = rows as any[]
```

> **Key difference from `pg`**:
> - `pg`: `const result = await pool.query(...)` → `result.rows[0]`
> - `mysql2`: `const [rows] = await pool.query(...)` → `rows[0]`
>
> If you forget to destructure `[rows]` and use `rows.rows`, you will get `undefined`.

### INSERT — Adding Data

```typescript
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'

// Step 1: Generate UUID before INSERT
const id = uuidv4()
// → "550e8400-e29b-41d4-a716-446655440000"

// Step 2: INSERT with that id
await pool.query(
  `INSERT INTO users (id, email, password_hash, full_name, role)
   VALUES (?, ?, ?, ?, ?)`,
  [id, email, hashedPassword, fullName, 'student']
)

// Step 3: id is already known — no need to re-query
return { id, email, fullName, role: 'student' }
```

> **Why generate UUID in TypeScript?**
> PostgreSQL has `RETURNING id` to retrieve the id after INSERT.
> MySQL does not have this command. Two solutions:
> 1. Generate UUID in TypeScript using the `uuid` package (this project uses this approach)
> 2. Use auto-increment integer and read `result.insertId` — but integer PKs are less secure than UUIDs

### UPDATE — Modifying Data

```typescript
// Standard update
await pool.query(
  'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
  [userId]
)

// Update and check number of affected rows
const [result] = await pool.query(
  'UPDATE shift_registrations SET status = ? WHERE id = ?',
  ['approved', registrationId]
) as any
const affectedRows = result.affectedRows
// affectedRows = 0 → row not found (wrong id)
// affectedRows = 1 → success
if (affectedRows === 0) throw new Error('NOT_FOUND')
```

### DELETE — Removing Data

```typescript
const [result] = await pool.query(
  'DELETE FROM shift_registrations WHERE id = ? AND student_id = ?',
  [registrationId, studentId]
) as any
if (result.affectedRows === 0) throw new Error('NOT_FOUND')
```

### Error Handling

```typescript
try {
  await pool.query('INSERT INTO shift_registrations ...', [...])
} catch (err: any) {
  if (err.code === 'ER_DUP_ENTRY') {
    // UNIQUE constraint violated
    // → student already registered for this shift (UNIQUE shift_id + student_id)
    throw { status: 409, error: 'ALREADY_REGISTERED' }
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    // FOREIGN KEY does not exist
    // → shift_id not found in the shifts table
    throw { status: 400, error: 'INVALID_REFERENCE' }
  }
  throw err  // other errors → bubble up to errorHandler
}
```

**Common MySQL error codes:**

| Code | Meaning | When it occurs |
|------|---------|----------------|
| `ER_DUP_ENTRY` | UNIQUE constraint violated | Duplicate insert (shift_id + student_id) |
| `ER_NO_REFERENCED_ROW_2` | FK does not exist | Insert with an invalid id |
| `ER_ROW_IS_REFERENCED_2` | FK is being referenced | Delete a row that has a FK from another table |
| `ER_BAD_FIELD_ERROR` | Wrong column name | Typo in SQL query |
| `ER_PARSE_ERROR` | SQL syntax error | SQL written with wrong syntax |

### Typed Queries (TypeScript)

```typescript
import { RowDataPacket } from 'mysql2'

// Define a type for the row
interface UserRow extends RowDataPacket {
  id: string
  email: string
  full_name: string
  role: 'student' | 'employer' | 'admin'
  is_active: boolean
  created_at: Date
}

// Use generics for type safety
const [rows] = await pool.query<UserRow[]>(
  'SELECT id, email, full_name, role, is_active FROM users WHERE id = ?',
  [id]
)
const user = rows[0]
// user.email → string (with autocomplete)
// user.role  → 'student' | 'employer' | 'admin' (not any)
```

### Transaction — Multiple Queries That Must All Succeed

Use a transaction when multiple queries must all succeed or all fail. Example: creating a user + creating a student_profile — if the user is created but the profile fails, the user must be rolled back.

```typescript
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()

  const userId = uuidv4()
  await connection.query(
    'INSERT INTO users (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [userId, email, hashedPassword, fullName, 'student']
  )

  const profileId = uuidv4()
  await connection.query(
    'INSERT INTO student_profiles (id, user_id, employer_id) VALUES (?, ?, ?)',
    [profileId, userId, employerId]
  )

  await connection.commit()
  return { userId, profileId }

} catch (err) {
  await connection.rollback()  // undo everything if an error occurs
  throw err
} finally {
  connection.release()  // return connection to pool
}
```

> **Rule**: Whenever creating a user with a profile, or approving a registration together with updating current_workers — use a transaction.

---

## 8. JSON Column: skills and required_skills

The `skills` column (student_profiles) and `required_skills` (jobs) are `JSON` type storing a string array.

```typescript
// INSERT: JSON.stringify before saving
const skills = ['communication', 'agility', 'diligence']
await pool.query(
  'UPDATE student_profiles SET skills = ? WHERE user_id = ?',
  [JSON.stringify(skills), userId]
  // → stored in DB as: ["communication","agility","diligence"]
)

// SELECT: mysql2 auto-parses JSON columns into arrays
const [rows] = await pool.query(
  'SELECT skills FROM student_profiles WHERE user_id = ?',
  [userId]
)
const profile = (rows as any[])[0]

// Defensive: check for both string and object (in case of driver version differences)
const skills: string[] = typeof profile.skills === 'string'
  ? JSON.parse(profile.skills)
  : (profile.skills ?? [])
```

---

## 9. Migrations With db-migrate

### Installation

```bash
cd backend
npm install --save-dev db-migrate db-migrate-mysql
```

### Required file structure

```
backend/
├── database.json        ← db-migrate config (reads from env vars)
├── migrations/          ← migration files
│   ├── 20240101000000-create-users.js
│   ├── 20240101000100-create-employer-profiles.js
│   └── ...
└── package.json
```

### database.json file (place at `backend/database.json`)

```json
{
  "dev": {
    "driver": "mysql",
    "host": { "ENV": "DB_HOST" },
    "port": { "ENV": "DB_PORT" },
    "database": { "ENV": "DB_NAME" },
    "user": { "ENV": "DB_USER" },
    "password": { "ENV": "DB_PASSWORD" },
    "timezone": "+07:00"
  },
  "test": {
    "driver": "mysql",
    "host": { "ENV": "DB_HOST" },
    "port": { "ENV": "DB_PORT" },
    "database": { "ENV": "DB_NAME" },
    "user": { "ENV": "DB_USER" },
    "password": { "ENV": "DB_PASSWORD" },
    "timezone": "+07:00"
  }
}
```

### Writing a Migration File

```javascript
// migrations/20240101000000-create-users.js
'use strict'

exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE users (
      id            CHAR(36)     PRIMARY KEY DEFAULT (UUID()),
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name     VARCHAR(255) NOT NULL,
      phone         VARCHAR(20),
      role          ENUM('student', 'employer', 'admin') NOT NULL,
      avatar_url    TEXT,
      is_active     BOOLEAN      DEFAULT TRUE,
      created_at    DATETIME     DEFAULT NOW(),
      updated_at    DATETIME     DEFAULT NOW() ON UPDATE NOW()
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}

exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS users')
}

exports._meta = { version: 1 }
```

> `exports._meta = { version: 1 }` is required — db-migrate uses it to track the migration version.

### Running Migrations

```bash
# Make sure .env is loaded (or set env vars directly)
cd backend
cp .env.example .env    # fill in actual values

# Run all new migrations
npm run migrate         # → db-migrate up

# Rollback 1 migration (most recent)
npm run migrate:down    # → db-migrate down

# Rollback 3 migrations
npx db-migrate down -c 3

# View status of which migrations have been run
npx db-migrate status
```

### Migration Rules (Required)

```
✅ Each migration is its own file, named in timestamp order
✅ File order must respect foreign key dependencies (see docs/02-project-init.md §9)
✅ Write both exports.up AND exports.down
✅ NEVER edit a migration that has been committed and run
✅ Schema changes → create a new migration
```

---

## 10. Docker With MySQL

`docker-compose.yml` is already configured (see `docs/06-deployment.md §2`). Key notes:

```yaml
mysql:
  image: mysql:8.0
  command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
  # ↑ Important: sets charset for the entire server, not just individual tables
  healthcheck:
    start_period: 30s
    # ↑ MySQL 8 needs ~15-20s to initialize on first run; healthcheck must wait
```

```bash
# Start the full stack
docker-compose up -d

# View MySQL logs
docker logs sw_mysql

# Open MySQL shell in the container
docker exec -it sw_mysql mysql -u sw_user -p smart_workforce

# Backup database (when needed)
docker exec sw_mysql mysqldump -u sw_user -psw_password smart_workforce > backup.sql
```

---

## 11. Debugging MySQL

### View Current Databases

```sql
SHOW DATABASES;
USE smart_workforce;
SHOW TABLES;
DESCRIBE users;           -- view table structure
SHOW CREATE TABLE users;  -- view full CREATE TABLE statement
```

### Inspect Data

```sql
-- View data in a table
SELECT * FROM users LIMIT 5;
SELECT COUNT(*) FROM shift_registrations WHERE status = 'pending';

-- Check foreign keys
SELECT
  sr.id,
  sr.status,
  u.full_name AS student_name,
  s.start_time
FROM shift_registrations sr
JOIN users u ON u.id = sr.student_id
JOIN shifts s ON s.id = sr.shift_id
WHERE sr.status = 'pending';
```

### Common Errors When Starting Out

**Error 1: `DEFAULT (UUID())` does not work**
```
Error 1101 (42000): BLOB/TEXT column 'id' can't have a default value
```
Cause: MySQL version < 8.0.13. Upgrade to MySQL 8.0.13+.

**Error 2: `ER_ACCESS_DENIED_ERROR`**
```
Access denied for user 'sw_user'@'localhost'
```
Cause: Wrong password or GRANT not set. Run:
```sql
GRANT ALL PRIVILEGES ON smart_workforce.* TO 'sw_user'@'localhost';
FLUSH PRIVILEGES;
```

**Error 3: `ER_NO_SUCH_TABLE`**
```
Table 'smart_workforce.users' doesn't exist
```
Cause: Migrations have not been run. Run `npm run migrate`.

**Error 4: Connection refused when using Docker**
```
ECONNREFUSED 127.0.0.1:3306
```
Cause: MySQL container is not healthy yet. Wait for `start_period` (30s) or check `docker logs sw_mysql`.

**Error 5: Query for `skills` returns `"[\"communication\"]"` (string instead of array)**
```typescript
// mysql2 auto-parses JSON if the column type is JSON
// If you still receive a string → use defensive parse:
const skills = typeof profile.skills === 'string'
  ? JSON.parse(profile.skills)
  : profile.skills ?? []
```

---

## 12. Checklist Before Writing a Service File

Before each new service file, ensure:

```
□ Import pool from '../config/database' (mysql2/promise)
□ Import uuidv4 from 'uuid' if INSERT is needed
□ Use ? (not $1 $2) for parameterized queries
□ Destructure [rows] from pool.query(), not result.rows
□ Generate UUID BEFORE INSERT, do not use RETURNING
□ Catch ER_DUP_ENTRY (not '23505') for unique violations
□ Use transaction (pool.getConnection()) when multiple related queries are involved
□ Use TIMESTAMPDIFF() (not EXTRACT(EPOCH FROM ...)) for time calculations
□ Use GREATEST(0, ...) to avoid negative numbers when calculating late_minutes
□ JSON.stringify() when saving skills/required_skills, defensive parse when reading
```

---

## References

- [mysql2 npm package](https://www.npmjs.com/package/mysql2) — full API reference
- [db-migrate docs](https://db-migrate.readthedocs.io/) — migration tool
- MySQL 8.0 Reference: `dev.mysql.com/doc/refman/8.0/en/`
- `docs/01-system-design.md` — full schema with MySQL syntax
- `docs/03-backend.md` §6 — MySQL Query Patterns for each specific use case
