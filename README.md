# Resume Builder (MVP)

A full-stack resume builder matching the PRD:
- **Backend:** Python (FastAPI) + PostgreSQL (production) / SQLite (local development) + JWT auth + bcrypt password hashing
- **Frontend:** React (Vite) + React Router + Axios + html2canvas + jsPDF for visual PDF export

100% free to build and run — SQLite needs no database server, and everything
below runs on your own machine at no cost. (Free-hosting options for putting
it online are at the bottom.)

---

## 1. Prerequisites

Install these once:

| Tool | Check you have it | Get it |
|---|---|---|
| Python 3.10+ | `python3 --version` | https://www.python.org/downloads/ |
| Node.js 18+ | `node --version` | https://nodejs.org/ |

---

## 2. Project layout

```
resume-builder/
├── backend/            FastAPI app (Python)
│   ├── app/
│   │   ├── main.py          # app entrypoint, CORS, router registration
│   │   ├── config.py        # settings (reads .env)
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── models.py        # User, Resume tables
│   │   ├── schemas.py       # Pydantic request/response shapes
│   │   ├── auth.py          # JWT + bcrypt password hashing
│   │   └── routers/
│   │       ├── auth_routes.py     # signup, login, logout, profile
│   │       ├── resume_routes.py   # resume CRUD + email sharing
│   │       └── admin_routes.py    # protected admin management
│   ├── requirements.txt
│   └── .env.example
└── frontend/            React app (Vite)
    ├── src/
    │   ├── main.jsx / App.jsx     # routes
    │   ├── context/AuthContext.jsx
    │   ├── api/                   # axios client + resume API calls
    │   ├── components/            # Navbar, ProtectedRoute
    │   └── pages/                 # Login, Signup, Dashboard, ResumeForm, ResumePreview, Profile
    ├── package.json
    └── .env.example
```

---

## 3. Run the backend

```bash
cd backend

# 1. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your local env file
cp .env.example .env
# Open .env and change SECRET_KEY to any long random string
# (e.g. run: python3 -c "import secrets; print(secrets.token_hex(32))")

# 4. Start the API (auto-reloads on save)
uvicorn app.main:app --reload
```

The API is now running at **http://localhost:8000**.
Open **http://localhost:8000/docs** for interactive Swagger docs — you can
test signup/login/resume endpoints directly from the browser, no frontend needed.

A `resume_builder.db` SQLite file is created automatically on first run —
that's your whole database, no separate DB server needed.

---

## 4. Run the frontend

Open a **second terminal** (keep the backend running in the first one):

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env
# Default is already correct: VITE_API_URL=http://localhost:8000

# 3. Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the login page.

---

## 5. Using the app

1. **Sign up** with a name, email, and password.
2. You land on the **Dashboard** — click "+ Create new resume", give it a name.
3. You're taken to the **edit form** — fill in Personal Info, Education,
   Experience, Skills, Projects. Click Save at any point.
4. Click **Preview** to see the formatted, single-column, ATS-friendly layout.
5. Go back to the Dashboard any time to see all your resumes, open, or edit them.
6. **Profile** page lets you update your name and password.
7. **Log out** clears your session; log back in any time — your resumes persist.

---

## 6. How the pieces fit together (for your understanding)

- **Auth:** On signup/login, the backend returns a JWT. The frontend stores
  it in `localStorage` and attaches it as `Authorization: Bearer <token>` on
  every API call (see `frontend/src/api/client.js`). Passwords are hashed
  with `bcrypt` before ever touching the database — plaintext passwords are
  never stored.
- **Resume data:** Each resume's Personal Info / Education / Experience /
  Skills / Projects sections are stored as JSON columns on the `resumes`
  table. This keeps the MVP flexible — you can add a new field to a section
  without a database migration.
- **Ownership:** Every resume endpoint checks that the resume belongs to the
  logged-in user (`owner_id`) before allowing read/update/delete — one user
  can never see or edit another user's resumes.
- **History:** `updated_at` is bumped automatically on every save, and the
  dashboard lists resumes sorted by most-recently-updated.

---

## 7. Common issues

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` when starting backend | You forgot to activate the venv, or `pip install -r requirements.txt` failed — re-run it. |
| Frontend shows network errors | Make sure the backend terminal is still running on port 8000. |
| CORS error in browser console | Check `backend/.env` — `CORS_ORIGINS` must include `http://localhost:5173`. |
| "Could not validate credentials" | Your JWT expired (default 24h) or `SECRET_KEY` changed after you logged in — just log in again. |

---

## 8. Admin setup

Set these in `backend/.env` before starting the backend:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=UseARealStrongPassword123!
```

On startup, the backend creates that account if it does not exist, or promotes the existing account with that email to administrator. Administrator authorization is enforced by the API; hiding the frontend link is not the security boundary. Deleting a user also deletes that user's resumes. Deleting a resume from Admin Dashboard removes it from the owner's dashboard too.

## 9. Email + PDF

The Share button generates the PDF from the same rendered resume document shown in Preview, then sends that PDF to the recipient. SMTP credentials are still required for real delivery. Gmail can be used with a free App Password. If no browser-generated PDF is supplied, the backend keeps a ReportLab fallback renderer.

## 10. Deploying for free (optional, once you're ready)

You don't need this to develop locally, but if you want a live link to share:

- **Backend:** [Render](https://render.com) or [Railway](https://railway.app) both have free tiers for small FastAPI apps. Point the start command at `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and set `SECRET_KEY` and `CORS_ORIGINS` (your deployed frontend URL) as environment variables there.
- **Frontend:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — both free for personal projects. Set `VITE_API_URL` to your deployed backend URL as a build-time environment variable.
- **Database:** Use hosted PostgreSQL in production (Neon, Supabase, Railway, Render, etc.). SQLite is supported for local development only.

---

## 11. Included in this version

- Six resume templates: Classic, Modern, Minimal, Bold, ATS Friendly, and Sidebar.
- Four accent colors per template: Violet, Blue, Emerald, and Rose.
- Optional profile photos on Modern, Bold, and Sidebar templates.
- Fixed “I currently study here” / “I currently work here” checkbox behavior.
- Visual PDF download generated from the same rendered document used in Preview.
- Email sharing uses that same generated PDF attachment, so template/color/photo match the preview.
- Backend-protected Admin Dashboard with user list, resume list, template usage, user deletion, and resume deletion.
- Deleting a resume as admin removes it from the owning user's account.
- Deleting a user also deletes that user's resumes.
- Existing SQLite databases are upgraded automatically with `template`, `color`, and `is_admin` columns.
