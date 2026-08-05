# AHamson Client Document Portal

Corporate SaaS portal for creating secure client document links, collecting registration forms, and managing submissions.

## Stack

- **Frontend:** React + Vite + Tailwind
- **Backend:** FastAPI + SQLite + JWT auth

## Local development

### 1. Frontend

```bash
npm install
cp .env.example .env.local   # optional — leave VITE_API_URL empty to use Vite proxy
npm run dev
```

App: http://localhost:5173

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Or from project root: `npm run dev:backend`

API: http://127.0.0.1:8000/api/health

Default admin (change in `backend/.env`):

- Email: `admin@ahamson.com`
- Password: `Admin@2025`

## Production deployment

### Windows RDP (recommended for internal server)

See **[deploy/windows/README.md](deploy/windows/README.md)** for full guide.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\deploy\windows\setup.ps1 -ServerIp "YOUR_SERVER_IP"
notepad backend\.env   # set ADMIN_PASSWORD
.\deploy\windows\start.ps1
```

App runs at `http://YOUR_SERVER_IP:8080` — frontend + API on one port.

### Backend

1. Copy `backend/.env.example` → `backend/.env`
2. Set:
   - `ENVIRONMENT=production`
   - `SECRET_KEY` — random string, 32+ characters
   - `ADMIN_PASSWORD` — strong password
   - `CORS_ORIGINS` — your frontend URL(s), comma-separated
   - `FRONTEND_URL` — public frontend URL (password reset emails)
   - `SMTP_*` — for document link and password reset emails
3. Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Frontend

1. Copy `.env.example` → `.env.production`
2. Set `VITE_API_URL` to your backend URL (e.g. `https://api.example.com`)
3. Set `VITE_APP_URL` to your frontend URL
4. Build: `npm run build`
5. Serve the `dist/` folder (Nginx, Vercel, Azure Static Web Apps, etc.)

## Features

| Area | Details |
|------|---------|
| Admin auth | JWT login, forgot/reset password, role-based access (admin/manager) |
| Document links | Time-limited secure links (default 2 hours), email notification |
| Client form | 7-step registration form, draft save, digital signatures, PDF preview |
| Admin portal | Dashboard KPIs, submissions, link management, user management |
| Security | bcrypt passwords, rate limiting, security headers, CORS lockdown |

## API overview

- `POST /api/auth/login` — admin login
- `GET /api/dashboard` — stats + submissions (auth required)
- `POST /api/submissions` — create document link (auth required)
- `GET /api/client/links/{token}` — public client link access
- `PUT /api/client/links/{token}/draft` — save client draft
- `POST /api/client/links/{token}/submit` — submit form
