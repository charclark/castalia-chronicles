# The Castalia Chronicles

> Tales of the immortal and the untamed

A full-stack web application for author Alexandra Castalia — a public author site combined with a private writing and admin tool for supernatural fiction.

**Tech stack:** Next.js · TypeScript · PostgreSQL (Railway) · Prisma · Tailwind CSS

---

## Database — IMPORTANT

The database **must be a separate Railway PostgreSQL service**. The app folder is wiped on every redeploy, so any file-based database (SQLite, etc.) would lose all data. All user data lives in PostgreSQL and is safe across deploys.

### Setting up the database on Railway

1. In your Railway project, click **New** → **Database** → **PostgreSQL**.
2. Once provisioned, go to the PostgreSQL service → **Variables** tab.
3. Copy the `DATABASE_URL` connection string.
4. In your **app** service on Railway → **Variables**, add:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
   ```
5. Also add:
   ```
   NEXTAUTH_SECRET=<a long random string — generate with: openssl rand -base64 32>
   ```

---

## Deploy flow

```
Local development → git push to GitHub → Railway auto-deploys
```

Railway is connected to the `castalia-chronicles` GitHub repository and deploys automatically on every push to `main`.

On first deploy (or after schema changes), run migrations:

```bash
npx prisma migrate deploy
```

You can run this via the Railway shell in your app service, or add it as a release command in Railway settings.

---

## Local development

```bash
# 1. Copy environment file and fill in your DATABASE_URL
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations (requires a real PostgreSQL database)
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable          | Required | Description                                      |
|-------------------|----------|--------------------------------------------------|
| `DATABASE_URL`    | Yes      | PostgreSQL connection string (Railway service)   |
| `NEXTAUTH_SECRET` | Yes      | Random secret for session signing                |

See `.env.example` for the format.
