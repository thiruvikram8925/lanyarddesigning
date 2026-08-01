# Dashboard & strap studio style guide

This document describes the UI tokens and patterns implemented for the user dashboard, strap editor (uploads / elements / inspirations), and shared navigation. **Behavior and data paths are unchanged** — styling and layout only.

## Layout & spacing

| Token / rule | Value | Usage |
|--------------|-------|--------|
| `--dash-sidebar-width` | `240px` | Fixed app sidebar (Home, Projects, Learning) on desktop |
| `--dash-page-margin` | `32px` | Minimum margin from viewport edges on dashboard pages |
| `--dash-card-gap` | `24px` | Minimum gap between dashboard cards |
| `--dash-template-gap` | `16px` | Spacing between “Lanyard templates” and “Badge templates” inside the template bundle |

**F-pattern:** Primary KPIs (total uploads, active elements, saved inspirations) sit in the **top-left** flow with `dash-kpi-primary` (≈40% larger than secondary labels). Secondary order metrics use smaller type in a separate strip.

**Widget scale:** Primary blocks use `dash-primary-widget` (larger min-height); supporting blocks use `dash-supporting-widget`.

## Color system

| Role | Hex | Notes |
|------|-----|--------|
| Primary action | `#007bff` | “Start designing”, “Upload new”, “Apply design”, main CTAs |
| Success / complete | `#28a745` | Completed states, inspiration apply count accent |
| Action required | `#dc3545` | Warnings / attention (charts may use `tone: 'action'`) |
| Body text | `#1a1a1a` / slate scales | Default content |

## Navigation

- **Breadcrumb:** `14px`, class `dash-breadcrumb`, pattern `Home > [Section] > [Subsection]` (set from `App.jsx` via `DashboardHeader`).
- **Workflow strip:** Template selection → Design workspace → Export & order (dashboard hero).
- **Global search:** `300px` width, `16px` from the right cluster in `DashboardHeader`.

## Charts (data visualization)

- **Upload trend:** Line chart — “Strap upload trend” over time; axis labels include units; legend describes the series.
- **Element usage:** Bar chart — compares element types on the current draft; legend maps colors to categories.

Implementation: `src/components/dashboard/MiniCharts.jsx` (SVG, no extra chart library).

## Progressive disclosure

- **Dashboard:** Order list can be collapsed; “View details — full order list” expands the full filtered list.
- **Strap editor:** Strap element list shows up to three rows by default; “View details” reveals the full list and metadata rows.

## Files

| File | Purpose |
|------|---------|
| `src/styles/dashboard-design-system.css` | CSS variables and utility classes |
| `src/lib/dashboardAnalytics.js` | KPI helpers, upload history, inspiration apply count |
| `src/components/dashboard/MiniCharts.jsx` | Line + bar chart components |

## Mockups

Static wireframe reference: `public/dashboard-mockups.html` (open in a browser; no build step required).
