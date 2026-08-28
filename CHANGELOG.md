# What's new in this update

## 1. Two new templates
- **ATS Friendly** — single column, black & white, no icons/tables/colors,
  standard font, and skills rendered as one comma-separated line (instead
  of separate tag chips) so a resume parser can't run words together.
- **Sidebar** — two-column layout: a dark sidebar carries contact info,
  skills, and education; the wide main column carries the summary,
  experience, and projects.

Both show up automatically in the template gallery (`/resumes/:id/template`)
alongside Classic/Modern/Minimal/Bold — no other setup needed.

## 2. Live side-by-side preview while editing
The resume editor (`/resumes/:id/edit`) now has a real resume preview
docked on the right that updates instantly as you type — same idea as the
screenshot you shared. On narrower screens it collapses into a "Show
preview" toggle button. Both the live preview and the full Preview page
now share one rendering component (`ResumeDocument.jsx`), so they can
never drift out of sync with each other.

## 3. Phone field with a country-code dropdown
The phone field is now a country dropdown (50 common countries, e.g.
"Pakistan (+92)") plus a separate number box. They're combined into one
string (`+92 3001234567`) for storage/display, and split back apart
automatically when you reopen a saved resume.

## 4. Calendar date pickers with real validation
Start/End date fields for Education and Experience are now native
calendar pickers (`<input type="date">`), plus a "currently
work/study here" checkbox that disables the end date. Validation:
- Start date can't be in the future.
- End date can't be before the start date (checked live, and again
  before you're allowed to move to the next step).
- Both dates are required unless "currently..." is checked.

## 5. Required fields (*)
Full name, email, and phone are required in Personal Info. Within any
Education/Experience block you add, school/degree/dates or
company/role/dates are required. Any Project you add needs at least a
title. Required fields are marked with a red `*`, and the wizard won't
let you move to the next step (or hit "Save & preview") until they're
filled in correctly — errors show inline under each field.

## 6. Stronger signup validation
- **Email**: now requires a real domain with a proper TLD
  (`name@example.com`) — this is the fix for "signup happens without
  .com". Enforced both in the browser (instant feedback) and on the
  server (`pydantic` validator), so it can't be bypassed by calling the
  API directly.
- **Password**: signup now requires 8+ characters with an uppercase
  letter, lowercase letter, number, and special character, and blocks a
  short list of extremely common passwords (`password123`, etc). There's
  a live strength meter (Weak/Fair/Good/Strong) with a checklist under
  the password field. This is enforced on the backend too, so the API
  itself refuses weak passwords even if someone skips the frontend.

## 7. Share via email
On the Preview page there's now a **✉ Share** button next to Print. It
opens a small dialog asking for a recipient email (with an optional
note), and emails them a PDF copy of the resume.

**Backend setup:** the share endpoint (`POST /resumes/{id}/share`)
generates the PDF itself (via `reportlab`, added to
`requirements.txt`) and sends it with Python's built-in `smtplib`. By
default `SMTP_HOST` is blank in `.env`, which puts email sending in
**dev mode**: the app logs what it would have sent to the server
console instead of actually sending it, so the whole feature works
out of the box with zero configuration. To send real emails, fill in
`backend/.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=you@gmail.com
SMTP_FROM_NAME=ResumeForge
SMTP_USE_TLS=true
```
(Any standard SMTP provider works — Gmail app passwords, SendGrid,
Mailgun, your company's SMTP relay, etc.)

## Install / run
Nothing about the run process changed — same as before:

```
# backend
cd backend
pip install -r requirements.txt --break-system-packages   # note: reportlab + pydantic-settings added
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

Both `npm run build` and the backend test suite (manual FastAPI
TestClient smoke test) were run against this update before delivery —
signup validation, resume creation, and the share endpoint all verified
working.
