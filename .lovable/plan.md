## Reality check

Sections C + D together are ~20+ full module upgrades (each needing list → detail drawer → create/edit wizard → bulk actions → export → skeleton/empty/error states) plus 8 dashboard finishing items. The dashboard alone is already 2,000 lines; the target modules (programs, timetable, budget, committees, etc.) are 80–150 lines each and need to grow 5–10× with wired stores, audit calls, and cascade hooks.

Shipping all of this in one turn will produce shallow stubs — exactly what your guardrails ("no dead UI, everything mapped, functional + logical correctness") forbid. I'd rather ship fewer modules at true fidelity than 25 broken ones.

## Proposed split (2 turns, no further division after this)

### Turn A — Dashboard finishing (Section C, items 13–20) at full fidelity
Already partly in place via `HoiWidgets.tsx` + `dashboardApprovals` + `tasks` stores. Complete:
1. **Period selector** wired into a `usePeriod()` context; KPIs recompute Month Collection, Attendance, Placement %, Fee Outstanding per period.
2. **KPI cards** — every tile gets `spark`, `target`, `status`, `onExplain` (breakdown dialog listing contributing records).
3. **Pending Approvals inline** — Approve/Reject in-place with reject-reason dialog, badge decrement, audit + notification + toast; no navigation.
4. **Risk Flags** — 5 flags, each with target route, primary action dialog, Dismiss (persist), Assign (creates Task in `useTaskStore`).
5. **Drill-downs** — Department row → Sheet with faculty/attendance/pass %; Funnel stage → cohort list; NAAC tile → criterion detail dialog; Recent Activity → record; AQAR → draft modal.
6. **Export Institution Report** — config modal (scope/sections/period/format) → generates jsPDF snapshot + audit entry.
7. **Send Announcement** — segment picker with live recipient count from `useUsersStore` (All / Students / Parents / Faculty / dept / year).
8. **Retention widget** + **Compliance mini-calendar** (AQAR/AICTE/exam milestones).

### Turn B — Section D module deep-wiring
Grouped by module family; each module gets: row-click detail Sheet, primary-button wizard that persists + audits + toasts, filter/search/bulk-select, export filtered CSV, skeleton/empty/error states.

- **Academic**: Programs, Subjects, Classes, Timetable (cell click + auto-generate with conflict report + faculty/room views), Calendar, Attendance Monitor (Flag HOD modal), Study Material, Course Files, Examinations (Schedule wizard, moderation, hall-ticket).
- **Placement**: Companies, Drives (funnel), AI Assessments (analytics), AI Interviews (review).
- **People**: Students 360, Faculty (workload flags), Faculty Appraisal (rubric), Parents (bulk-message).
- **Finance**: Fee Structures (Build wizard), Budget (inline edit + Concession Requests → Approval Center).
- **Admin**: Committees (Constitute wizard).

## Ask

Approve this split and I'll execute Turn A now in full, then Turn B in the next message. If you truly want it all in one turn, I'll ship it but the deep-wiring items in Section D will land as thinner drawers (list → detail sheet + one primary action wired) rather than full wizards — say the word and I'll do that instead.