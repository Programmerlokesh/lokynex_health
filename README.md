<div align="center">

<img src="docs/banner.svg" alt="Lokynex Health - Precision lab management, built right." width="100%" />

<br />

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Open_App-0ea5e9?style=for-the-badge)](https://lokynex-health-five.vercel.app/login)
[![Backend CI](https://img.shields.io/github/actions/workflow/status/Programmerlokesh/lokynex_health/ci.yml?branch=main&style=for-the-badge&label=Backend%20CI&logo=githubactions&logoColor=white)](https://github.com/Programmerlokesh/lokynex_health/actions)
[![Last Commit](https://img.shields.io/github/last-commit/Programmerlokesh/lokynex_health?style=for-the-badge&logo=git&logoColor=white&color=1e40af)](https://github.com/Programmerlokesh/lokynex_health/commits/main)
[![Stars](https://img.shields.io/github/stars/Programmerlokesh/lokynex_health?style=for-the-badge&logo=github&color=f59e0b)](https://github.com/Programmerlokesh/lokynex_health/stargazers)

<br />

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![.NET](https://img.shields.io/badge/.NET_10-512BD4?style=flat-square&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

<br />

**[Overview](#-overview)** ·
**[Screenshots](#-screenshots)** ·
**[Features](#-features)** ·
**[Architecture](#-architecture)** ·
**[Getting Started](#-getting-started)** ·
**[Deployment](#-deployment)** ·
**[Roadmap](#-roadmap)**

</div>

<br />

## 🔭 Overview

**Lokynex Health** gives every diagnostic lab its own **isolated, secure workspace** to run daily operations: patient orders, test reports, doctor and referral commissions, and full accounting. The platform owner controls labs, plans and subscriptions from a dedicated **SuperAdmin console**.

<div align="center">

| 🏢 Multi-tenant | 🧪 Test catalog | 🛡️ Secure | 📱 Responsive |
| :---: | :---: | :---: | :---: |
| One database schema **per lab** | **37 departments**<br/>**1,200+ tests** ready to use | **JWT** auth, **BCrypt**,<br/>role + module permissions | Works on **desktop,<br/>tablet and mobile** |

</div>

> 🔗 **Try it live:** [lokynex-health-five.vercel.app](https://lokynex-health-five.vercel.app/login)

---

## 📸 Screenshots

<div align="center">

### 📊 Ledger & P&L
<img src="docs/screenshots/ledger.png" alt="Ledger and P&L dashboard" width="100%" />
<sub>Date presets, KPI cards, best / weakest day and a performance trend chart, with separate P&L Statement and Ledger tabs.</sub>

<br /><br />

### 🏠 Lab Dashboard
<img src="docs/screenshots/dashboard.png" alt="Lab dashboard" width="100%" />
<sub>Every module one click away, grouped under Orders, Reports, Accounts and Settings.</sub>

<br /><br />

### 🧪 Departments & Tests
<img src="docs/screenshots/departments.png" alt="Departments and tests" width="100%" />
<sub>Pathology, Imaging, Heart & Brain and Procedures, with search and category filters.</sub>

<br /><br />

### 🔐 Secure Login
<img src="docs/screenshots/login.png" alt="Login page" width="100%" />
<sub>Split-screen brand panel with a clean sign-in card.</sub>

</div>

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

#### 🧾 Orders & Billing
- Create, edit, pay and delete orders
- Soft delete with **restore**
- Full **audit log** of every change
- Discounts and payment tracking

</td>
<td width="33%" valign="top">

#### 🧬 Reports
- Pick patient + test, the **format loads automatically**
- Report Builder, Report Pad and Templates
- Custom header / footer or blank space for letterhead
- **Print, PDF download** and public report links

</td>
<td width="33%" valign="top">

#### 🧪 Test Catalog
- **37 departments, 1,200+ tests** pre-loaded
- Editable prices, normal ranges and formats
- Specimen defaults per test
- Add your own departments and tests

</td>
</tr>
<tr>
<td width="33%" valign="top">

#### 💸 Commissions
- Doctor, referral and technician commission
- Per-order-line overrides
- Payout tracking
- Doctor and referral commission can **never overlap** (enforced in the database)

</td>
<td width="33%" valign="top">

#### 📊 Ledger & P&L
- KPI cards: net profit, income, outflow, margin
- **Performance trend** chart (cashflow, profit, cumulative)
- P&L Statement and Ledger tabs
- **Sync from Orders** and manual entries

</td>
<td width="33%" valign="top">

#### 👥 Team & Access
- Branches, users and roles
- **Module-level permissions**
- Global doctor / referral directory
- **Per-lab overrides** without touching the global record

</td>
</tr>
<tr>
<td width="33%" valign="top">

#### 🩺 Doctor Clinic
- Patients and appointments
- Prescriptions with custom **Rx layout**
- Medicine catalog
- Clinic ledger, users and settings

</td>
<td width="33%" valign="top">

#### 👑 SuperAdmin Console
- Manage labs and owners / staff
- Plans and subscriptions
- Module catalog
- Platform-level notifications

</td>
<td width="33%" valign="top">

#### 🎨 Experience
- Fully **mobile responsive**
- Light / dark mode
- Smooth animations
- Clean, modern UI

</td>
</tr>
</table>

---

## 🏛 Architecture

### System overview

```mermaid
flowchart LR
    U([👤 User]) --> FE["🖥️ Next.js Frontend<br/>Vercel"]
    FE -- "REST + JWT" --> API["⚙️ ASP.NET Core API<br/>Railway · Docker"]
    API --> DB[("🐘 PostgreSQL<br/>Neon")]

    subgraph DB_SCHEMAS ["Database · schema-per-tenant"]
        direction TB
        P["platform<br/>plans · owners · subscriptions<br/>doctors · referrals · clinics"]
        L1["lab_alpha"]
        L2["lab_beta"]
        L3["lab_..."]
    end

    DB --- DB_SCHEMAS
```

### Multi-tenancy

Every lab lives in its **own PostgreSQL schema** (`lab_<code>`), so tenant data is isolated by design. Shared SuperAdmin data lives in the `platform` schema.

When a new lab is created, the backend provisions it in **one transaction**. If anything fails, the whole schema is rolled back, so you never end up with a half-created lab.

### Backend: Clean Architecture

```mermaid
flowchart TB
    API["<b>Api</b><br/>Controllers · Middleware · Security"] --> APP
    INFRA["<b>Infrastructure</b><br/>EF Core · Tenant provisioning · JWT · BCrypt"] --> APP
    APP["<b>Application</b><br/>MediatR commands & queries · FluentValidation"] --> DOM
    DOM["<b>Domain</b><br/>Entities · Enums"]
```

---

## 🧱 Tech Stack

<table>
<tr>
<td><b>🖥️ Frontend</b></td>
<td>Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · MUI · shadcn/ui · TanStack Query · Zustand · Framer Motion</td>
</tr>
<tr>
<td><b>⚙️ Backend</b></td>
<td>ASP.NET Core (.NET 10) · MediatR (CQRS) · FluentValidation · EF Core + Npgsql · Swagger</td>
</tr>
<tr>
<td><b>🔐 Security</b></td>
<td>JWT Bearer authentication · BCrypt password hashing · role and module-permission checks</td>
</tr>
<tr>
<td><b>🐘 Database</b></td>
<td>PostgreSQL (schema-per-tenant)</td>
</tr>
<tr>
<td><b>🚢 DevOps</b></td>
<td>Docker · GitHub Actions · Vercel · Railway · Neon</td>
</tr>
</table>

---

## 📁 Project Structure

<details>
<summary><b>Click to expand</b></summary>

<br />

```text
lokynex_health/
├── .github/workflows/ci.yml          # Backend CI (build + test)
├── docs/                             # Banner + README screenshots
│   ├── banner.svg
│   └── screenshots/
├── database/                         # SQL scripts + seed runner
│   ├── 001_platform.sql
│   ├── 002_tenant_schema.sql
│   ├── 003_departments_and_tests.sql
│   ├── 031_doctor_clinic.sql
│   ├── 032_clinic_rx_layout.sql
│   └── run-seeds.mjs
└── LokynexHealth/
    ├── backend/
    │   ├── Dockerfile
    │   └── src/
    │       ├── LokynexHealth.Api/             # Controllers, middleware, security
    │       ├── LokynexHealth.Application/     # Commands, queries, validators
    │       ├── LokynexHealth.Domain/          # Entities, enums
    │       └── LokynexHealth.Infrastructure/  # EF Core, provisioning, SQL scripts
    └── frontend/
        └── src/
            ├── app/            # Routes: (dashboard), clinic, owner, superadmin, login
            ├── components/     # UI by feature
            ├── lib/api/        # API clients
            ├── store/          # Zustand stores
            ├── hooks/
            └── types/
```

</details>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
| --- | --- |
| Node.js | 20+ |
| .NET SDK | 10 |
| PostgreSQL | Local, or a free [Neon](https://neon.tech) database |

### 1 · Clone

```bash
git clone https://github.com/Programmerlokesh/lokynex_health.git
cd lokynex_health
```

### 2 · Database

Run the scripts from `database/` in this order:

| # | File | Run |
| :-: | --- | --- |
| 1 | `001_platform.sql` | once per database |
| 2 | `002_tenant_schema.sql` | once per lab (`SET search_path TO lab_xxx, public;`) |
| 3 | `003_departments_and_tests.sql` | once per lab |
| 4 | `031_doctor_clinic.sql` | once per database |
| 5 | `032_clinic_rx_layout.sql` | once per database (after 031) |

> 💡 All scripts are safe to re-run. Labs created from inside the app get steps 2 and 3 automatically.
> More details in [`database/README.md`](database/README.md).

### 3 · Backend

Create `LokynexHealth/backend/src/LokynexHealth.Api/appsettings.Development.json` (already git-ignored):

```json
{
  "ConnectionStrings": {
    "TenantDb": "Host=localhost;Database=lokynex;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "Secret": "use-a-long-random-secret-at-least-32-characters"
  }
}
```

```bash
cd LokynexHealth/backend
dotnet restore LokynexHealth.slnx
dotnet run --project src/LokynexHealth.Api
```

API runs at **http://localhost:5213** (Swagger available in development).

### 4 · Frontend

Create `LokynexHealth/frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5213
```

```bash
cd LokynexHealth/frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🎉

### 5 · First login

`001_platform.sql` seeds the first **SuperAdmin** (username: `superadmin`).

> ⚠️ **Change the password immediately after your first login.**

---

## ⚙️ Environment Variables

<details>
<summary><b>Backend</b></summary>

<br />

| Variable | Description |
| --- | --- |
| `ConnectionStrings__TenantDb` | PostgreSQL connection string |
| `Jwt__Secret` | Secret used to sign JWT tokens (keep private) |
| `Jwt__Issuer` / `Jwt__Audience` | JWT issuer / audience (defaults in `appsettings.json`) |
| `AllowedOrigins` | Extra CORS origins, comma-separated |
| `PORT` | Injected by Railway; Kestrel binds to it automatically |

</details>

<details>
<summary><b>Frontend</b></summary>

<br />

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API |

</details>

---

## 🐳 Docker

```bash
cd LokynexHealth/backend
docker build -t lokynex-health-api .
docker run -p 8080:8080 \
  -e ConnectionStrings__TenantDb="<your-connection-string>" \
  -e Jwt__Secret="<your-secret>" \
  lokynex-health-api
```

---

## ☁️ Deployment

| Service | Platform | Setup |
| --- | --- | --- |
| 🖥️ Frontend | **Vercel** | Root directory `LokynexHealth/frontend` · set `NEXT_PUBLIC_API_BASE_URL` |
| ⚙️ Backend | **Railway** | Root directory `LokynexHealth/backend` (uses the `Dockerfile`) · set backend env vars |
| 🐘 Database | **Neon** | Use the non-pooled connection string for running seed scripts |

---

## 🔄 Continuous Integration

The **CI - Backend** workflow runs on every push and pull request to `main` that touches `LokynexHealth/backend/**`:

`Restore` → `Build (Release)` → `Test`

---

## 🔒 Security

- Passwords are hashed with **BCrypt**
- APIs are protected with **JWT** plus role and module-permission checks
- Tenant data is isolated in **separate database schemas**
- Secrets are never committed. Use environment variables or the git-ignored `appsettings.Development.json`

---

## 🗺 Roadmap

- [x] Multi-tenant lab platform (schema-per-tenant)
- [x] Orders, billing and audit log
- [x] Blood report formats, print and PDF
- [x] Commission management and payouts
- [x] Ledger & P&L with charts
- [x] Doctor Clinic module
- [x] SuperAdmin console (plans, subscriptions)
- [ ] WhatsApp report sharing
- [ ] Automated backend test coverage
- [ ] Analytics dashboard improvements

---

## 📄 License

All rights reserved © 2026 Lokynex.

<br />

<div align="center">

### Built with ❤️ by [Lokesh Debnath](https://github.com/Programmerlokesh)

[🌐 Live Demo](https://lokynex-health-five.vercel.app/login) ·
[🐛 Report a Bug](https://github.com/Programmerlokesh/lokynex_health/issues) ·
[⭐ Star this repo](https://github.com/Programmerlokesh/lokynex_health)

<sub>If you find this project useful, a star would mean a lot.</sub>

</div>
