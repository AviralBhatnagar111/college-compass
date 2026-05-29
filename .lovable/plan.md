
# LearnNowX MVP — Build Plan

Before I start coding, two things need your call. This spec is huge (≈40+ pages, 9 dashboards, deep Access Control sub-product, 10 end-to-end workflows). I want to set expectations honestly so you get a shippable result, not a half-built skeleton.

## 1. Stack mismatch — needs a decision

Your spec says **React 18 + Vite + React Router v6**. This project is scaffolded on **TanStack Start (React 19 + TanStack Router, file-based routing under `src/routes/`)**. These are not interchangeable — `react-router-dom` is not installed and TanStack Start uses a different routing/SSR model.

Two options:

- **A. Keep TanStack Start (recommended)** — I adapt the spec: file-based routes under `src/routes/`, `Link`/`useNavigate` from `@tanstack/react-router`. All functionality, design tokens, Zustand stores, seed data, and access logic stay identical. Zero loss of features; just different router imports. Fastest path.
- **B. Rip out TanStack Start, scaffold Vite + RR v6** — possible but throws away the working shell and adds a day of yak-shaving before any feature work. Not recommended unless you have a hard reason.

## 2. Scope — this is ~5–10 builds of work, not one

A faithful implementation of the full spec (every page, every workflow, polished empty/loading states, full Access Control sub-product with Pack Builder + Edit Access drawer + audit diffs, 9 distinct dashboards, 140 seeded students with parents, working MCQ flow, etc.) is realistically **multiple days of focused build time** and will produce 80–120 files. I cannot ship all of it cleanly in a single turn — if I try, you get shallow stubs everywhere and nothing demo-ready.

I propose shipping in **phases**, each one independently demo-able. You approve Phase 1, I build it end-to-end and verify it, then we move on.

### Phase 1 — Foundation + Demo Spine (this turn)
Goal: the 12-step final demo script works end-to-end, even if secondary modules are lighter.

- Design system: tokens in `styles.css`, Inter font, shadcn primitives styled to brand
- App shell: sidebar (role-aware, collapsible), top bar (breadcrumbs, search, role switcher, bell, quick-add, avatar), command palette (⌘K)
- Auth: `/login` with password/OTP tabs + 11 "Try Demo as…" chips, `/forgot-password`, route gating
- Zustand stores (all 8 domains) with `persist` + full seed data (Bharat Institute, 140 students with Indian names, parents, faculty, drives, fees, etc.)
- Access model: roles, 11 packs, scopes, overrides, requests, audit log; `useAccess()` hook with `can/canSee/inScope/isReadOnly`
- All 9 role dashboards (HOI, Registrar, TPO, Finance, Exam, HOD, Faculty, Student, Parent) — real KPIs from seed
- **Access Control sub-product in full**: Overview, People, User Detail (5 tabs), Add User wizard, Edit Access drawer (all 6 sections), Packs list, Pack Detail, Pack Builder (6 tabs), Org Structure, Requests, Activity, Audit Log
- Workflows W1–W10 all functional
- Role switcher visibly changes sidebar/scope/permissions
- 404, Access Denied, Profile, Settings (with Reset Data)

### Phase 2 — Academic + Placement depth
Programs/Courses/Subjects/Classes/Rooms/Timetable (grid + conflict detection)/Study Material/Examinations/Results. Placement: Companies/Drives detail tabs/Job Profiles/AI Assessments create flow/AI Interviews/Offers/student MCQ-taking flow.

### Phase 3 — Finance + Compliance + Communication + Analytics
Fee Structures builder, Ledger, Scholarships, Defaulters. NAAC Cockpit (7-criterion drill-in), NBA/NIRF/AICTE shells. Inbox triple-pane, Announcements, Templates. Reports + Custom Builder.

### Phase 4 — Polish pass
Mobile responsive sidebar→bottom-sheet, keyboard a11y, empty-state illustrations, skeleton loaders everywhere, all secondary list pages brought to full fidelity.

## What I need from you

1. **Stack: A (TanStack Start) or B (rip & replace with Vite+RR)?** I strongly recommend A.
2. **Confirm phased delivery starting with Phase 1 above**, OR tell me a different slice you want first (e.g. "just Access Control sub-product, nothing else" or "just the shell + role switcher + 3 dashboards as a clickthrough").

Once you answer, I start building immediately — no more questions.
