# ONBOARDX — Smart Partner Onboarding & Approval System

> A focused, workflow-driven SaaS control center for enterprise partner onboarding, compliance document verification, dynamic blueprints, and stage-gated executive approvals.

---

### 🌐 Live Links & Deployment

- **Live Production Application**: [https://onboardx-enterprise.vercel.app](https://onboardx-enterprise.vercel.app)
- **GitHub Repository**: [https://github.com/samayshrey-dev/ONBOARDX](https://github.com/samayshrey-dev/ONBOARDX)
- **Hosting & Infrastructure**: Vercel (`onboardx-enterprise`)

---

## 📌 Project Overview

**ONBOARDX** simplifies enterprise partner onboarding (vendors, regional distributors, franchisees) by replacing email threads and ad-hoc spreadsheets with a transparent, stage-gated compliance workflow.

Rather than filling out database forms, partners navigate a guided 4-stage **Onboarding Journey**:
```
Stage 01: Registration ──> Stage 02: Documents ──> Stage 03: Verification ──> Stage 04: Approval
```

---

## 🎯 Problem Statement

Traditional partner onboarding suffers from three major flaws:
1. **Fragmented Communication**: Document submissions and rejection reasons get lost across manual email exchanges.
2. **Brittle Requirements**: Hardcoded document checklists make it impossible to adapt requirements for different partner categories (e.g., Company Vendor vs Individual Contractor).
3. **Lack of Auditability & Multi-Tier Governance**: Organizations lack an immutable audit log detailing who verified item-level documents versus who authorized final executive sign-off.

---

## ✨ Key Features

- **Visual Onboarding Journey**: Linear stage stepper (`Registration` → `Documents` → `Verification` → `Approval`) showing progress percentages and active status markers.
- **Dynamic Onboarding Blueprints**: Admins configure master checklist templates per partner category (`COMPANY`, `VENDOR`, `DISTRIBUTOR`, `FRANCHISEE`). When a partner initializes an application, a snapshot checklist is generated to guarantee immutability against future blueprint edits.
- **Action-Oriented Review Queue**: Compliance reviewers work from a dedicated workload queue (`/reviewer`) with filters, status flags, and search options.
- **Two-Panel Document Reviewer**: Side-by-side file viewer (PDF/Image preview) and reviewer decision controls (`APPROVED` or `REJECTED` with mandatory feedback comments).
- **Password Strength & Recovery System**: Password strength meter (Weak/Fair/Strong/Excellent) during registration & reset, backed by Django's `PasswordResetTokenGenerator`.
- **Destructive Action Confirmation**: Reusable monochrome modal system (`ConfirmModal`) preventing accidental deletions or rejections.
- **Decoupled Verification vs. Executive Approval**:
  - *Level 1*: Reviewers verify item-level compliance documents. When 100% of mandatory documents are verified, the application automatically transitions to `PENDING_APPROVAL`.
  - *Level 2*: Admins authorize final executive decision sign-off (`APPROVED`, `REJECTED`, `CORRECTION_REQUIRED`).
- **Immutable Audit Activity Stream**: Chronological event log (`ActivityLog`) tracking every registration, submission, file upload, rejection, replacement, and approval.
- **Strict Monochrome Visual Design**: Premium black, white, and grayscale design system with typography tokens and micro-interactions.

---

## 👥 User Roles & Security Boundaries

| Role | Access Scope & Permissions |
| :--- | :--- |
| 🤝 **PARTNER** | Manages organization profile, creates applications, uploads/replaces compliance documents, submits application, tracks live journey status & audit timeline. **Cannot review documents or self-approve applications.** |
| 🔍 **REVIEWER** | Accesses Review Queue (`/reviewer`), inspects uploaded files in a two-panel viewer, approves/rejects documents with feedback comments. **Cannot grant final admin approval or modify blueprint schemas.** |
| ⚙️ **ADMIN** | Monitors operational overview metrics, configures master Onboarding Blueprints & Checklist Requirements, inspects all applications, executes final level-2 decision sign-offs. |

---

## 🔄 Application Lifecycle State Machine

```
   ┌────────┐       Submit       ┌───────────┐
   │ DRAFT  │ ─────────────────> │ SUBMITTED │
   └────────┘                    └─────┬─────┘
       ▲                               │ Reviewer Inspects
       │ Re-upload                     ▼
┌──────────────┐ Rejection  ┌──────────────┐ 100% Docs Verified ┌──────────────────┐
│ CORRECTION   │ <───────── │ UNDER_REVIEW │ ─────────────────> │ PENDING_APPROVAL │
│ REQUIRED     │            └──────────────┘                    └────────┬─────────┘
└──────────────┘                                                         │ Admin Sign-off
                                                                         ▼
                                                               ┌──────────────────┐
                                                               │ APPROVED/REJECTED│
                                                               └──────────────────┘
```

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11, Django 4.2 LTS, Django REST Framework, SimpleJWT (JWT Access/Refresh Tokens), PostgreSQL (SQLite3 fallback).
- **Frontend**: React 19 (JavaScript), Vite, Bootstrap 5 + Bootstrap Icons, Axios, React Router DOM.
- **Design System**: Monochrome Palette (Black `#000000`, Off-White `#FAFAFA`, Grayscale `#212529`/`#6C757D`), Monospace typography accents, CSS micro-animations.

---

## 📊 Database Architecture

- `accounts.CustomUser`: Custom user model with `role` (`PARTNER`, `REVIEWER`, `ADMIN`), `company_name`, and `phone_number`.
- `accounts.PartnerProfile`: One-to-one organization profile (`business_name`, `phone`, `address`, `registration_number`, `website`).
- `onboarding.Blueprint`: Master blueprint schema for a partner type (`title`, `partner_type_code`, `description`, `is_active`).
- `onboarding.ChecklistRequirement`: Master document requirement attached to a Blueprint (`document_name`, `is_mandatory`, `order`).
- `onboarding.OnboardingApplication`: Application instance (`application_number`, `partner`, `blueprint`, `business_name`, `status`, `submitted_at`).
- `onboarding.ApplicationChecklistItem`: Immutable snapshot requirement item generated from Blueprint upon application creation.
- `documents.Document`: Compliance document file attached to a checklist item (`file`, `file_name`, `file_size`, `file_type`, `status`, `reviewer_comment`).
- `approvals.ApprovalRecord`: Record of final executive admin decision (`approved_by`, `decision`, `comment`, `timestamp`).
- `activity.ActivityLog`: Audit log entry (`application`, `actor`, `action`, `description`, `created_at`).

---

## 📡 API Overview

### Authentication (`/api/v1/auth/`)
- `POST /api/v1/auth/register/` — Register partner account with password validation.
- `POST /api/v1/auth/login/` — Login and receive JWT access/refresh token pair.
- `POST /api/v1/auth/token/refresh/` — Obtain new access token via refresh token.
- `POST /api/v1/auth/password-reset/` — Request password reset token.
- `POST /api/v1/auth/password-reset-confirm/` — Set new password using token.
- `GET /api/v1/auth/me/` — Retrieve currently authenticated user profile.
- `GET / PATCH /api/v1/auth/profile/` — Fetch or update partner organization profile.
- `POST /api/v1/auth/logout/` — Blacklist refresh token and logout.

### Onboarding (`/api/v1/onboarding/`)
- `GET / POST /api/v1/onboarding/blueprints/` — List or create master blueprints (Admin create).
- `GET / PATCH / DELETE /api/v1/onboarding/blueprints/<id>/` — Blueprint CRUD.
- `POST /api/v1/onboarding/blueprints/<id>/requirements/` — Add checklist requirement to blueprint.
- `PATCH / DELETE /api/v1/onboarding/requirements/<id>/` — Requirement CRUD.
- `GET / POST /api/v1/onboarding/applications/` — List or initialize onboarding applications.
- `GET / PATCH /api/v1/onboarding/applications/<id>/` — Fetch application details or update draft.
- `POST /api/v1/onboarding/applications/<id>/submit/` — Submit application for review.
- `GET /api/v1/onboarding/reviewer/queue/` — Reviewer compliance workload queue.

### Documents (`/api/v1/documents/`)
- `GET /api/v1/documents/application/<app_id>/` — List documents for application.
- `POST /api/v1/documents/items/<checklist_item_id>/upload/` — Upload or replace compliance document file.
- `PATCH /api/v1/documents/<id>/review/` — Reviewer approve/reject document decision.

### Approvals (`/api/v1/approvals/`)
- `POST /api/v1/approvals/applications/<app_id>/decide/` — Admin final executive decision (`APPROVED`, `REJECTED`, `CORRECTION_REQUIRED`).

### Activity (`/api/v1/activity/`)
- `GET /api/v1/activity/applications/<app_id>/` — Read-only application audit stream.

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Setup Backend
```bash
# Navigate to project root
cd ONBOARDX

# Activate Python virtual environment
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
$env:DB_ENGINE='django.db.backends.sqlite3' # Windows PowerShell
python backend/manage.py migrate

# Seed initial admin, reviewer, partner users & blueprints
python backend/manage.py seed_db
python backend/manage.py seed_onboarding

# Start Django development server
python backend/manage.py runserver 8080
```

### 2. Setup Frontend
```bash
# Open new terminal in ONBOARDX/frontend
cd frontend

# Install Node dependencies
npm install

# Build or run Vite dev server
npm run dev
```

Visit `http://localhost:5173` to access the local application.

---

## 🧪 Automated Testing

Run the comprehensive 26-test backend suite (including authentication, password recovery, authorization, document upload security, and stage-gated workflow tests):
```bash
python backend/manage.py test
```

---

## 🔮 Production Checklist & Security Controls

```
[x] All required pages exist (Landing, Auth, Partner, Reviewer, Admin, Legal, Error screens)
[x] JWT authentication with token rotation & blacklisting
[x] Server-side role permissions (IsPartner, IsReviewer, IsAdminRole) & object-level authorization (IsOwnerOrStaff)
[x] Document security: File size limit (10MB), restricted file extensions (.pdf, .png, .jpg, .jpeg), MIME validation
[x] Production security settings: DEBUG toggling, environment SECRET_KEY, restricted CORS_ALLOWED_ORIGINS
[x] Clean production build: Vite build output verified with 0 errors
[x] Live Vercel deployment: https://onboardx-enterprise.vercel.app
```
