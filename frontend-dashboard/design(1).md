# VanRakshak — Person 4 Dashboard Design Specification

## 0. READ THIS FIRST

This document is the **visual source of truth for Person 4's frontend**.

Person 4 owns ONLY the dashboard side of the system:

- Gram Sabha / jurisdiction dashboard
- District / Admin dashboard
- Role-gated dashboard views
- Leaflet-based map experience
- Alert list + alert detail
- Dashboard analytics and operational UI
- OTP/login UI shell
- User/role controls relevant to the dashboard

Do NOT redesign the citizen-facing reporting PWA. That belongs to Person 3.

Do NOT redesign the satellite detection engine, corroboration engine, or backend. Those belong to Persons 1 and 2.

The dashboard must consume backend/API data or realistic mock data that follows the shared API contract.

The visual reference for this document is the supplied VanRakshak dashboard mockup. The implementation should reproduce that reference as closely as possible in layout, spacing, proportions, typography, colors, hierarchy, cards, controls, map treatment, and interaction behavior.

---

# 1. DESIGN TARGET

Product name:

**VanRakshak**

Product descriptor:

**FRA Land Monitoring**

The product should feel like:

- premium GovTech
- professional GIS software
- environmental intelligence
- modern enterprise SaaS
- trustworthy public-sector software

It should NOT feel like:

- generic Bootstrap admin
- AI-generated dashboard
- cyber-security console
- crypto dashboard
- gaming UI
- neon futuristic interface
- generic government portal

The reference image uses a **light warm-white application canvas + deep forest-green navigation + green GIS accents**.

This is intentional.

DO NOT switch the dashboard to the previous dark charcoal theme.

The final visual direction is:

**cream/white + forest green + sage + restrained amber/red alert colors + satellite imagery**

---

# 2. CRITICAL VISUAL RULE

The dashboard should look like the supplied reference image at first glance.

The layout is:

```text
┌──────────────┬──────────────────────────────────────────────────────────────┐
│              │ TOP FILTER / SEARCH / USER BAR                               │
│              ├───────────────────────────────────────────────┬──────────────┤
│              │                                               │              │
│   FOREST     │                                               │ ACTIVE       │
│   SIDEBAR    │                  LARGE MAP                    │ ALERTS       │
│              │                                               │ FEED         │
│              │                                               │              │
│              ├───────────────────────────────┬───────────────┤              │
│              │ MONITORED GS                  │ RESOLUTION    │              │
│              ├───────────────────────────────┴───────────────┤              │
│              │ MODEL VALIDATION / BACKTEST                   │ DATA         │
│              │                                               │ OVERVIEW     │
└──────────────┴───────────────────────────────────────────────┴──────────────┘
```

Desktop is the primary experience.

The map is the visual center of the product.

The alert feed is the operational center.

The analytics row is the evidence/health layer.

---

# 3. GLOBAL CANVAS

Application background:

`#F7F8F4`

Use a very subtle warm green-gray tint rather than pure white.

Main content should have generous whitespace.

Do not use a dark page background.

Cards:

`#FFFFFF`

Borders:

`#DDE4DD`

Primary dark green:

`#063C2A`

Secondary forest:

`#0B5D3F`

Accent green:

`#2E9B5F`

Light green:

`#EAF5EC`

Text:

`#15221C`

Secondary text:

`#66736C`

Muted text:

`#8A958F`

---

# 4. ALERT COLORS

Green:

`#2E9B5F`

Meaning:

- verified
- stable
- healthy
- resolved

Amber:

`#F59E0B`

Meaning:

- under review
- needs attention
- moderate priority

Red:

`#E5534B`

Meaning:

- high priority
- escalated
- high-confidence signal requiring review

Blue/cyan:

`#08A7C5`

Meaning:

- satellite pass
- imagery
- geospatial layer

IMPORTANT:

Red never means "criminal" or "illegal".

It means:

**higher-priority review signal.**

---

# 5. TYPOGRAPHY

Primary font:

**Inter**

If Inter is unavailable, use:

**Manrope**

Do not introduce decorative fonts.

Font weights:

400 = body

500 = metadata

600 = labels/headings

700 = major numbers

Page title:

28–32px / 700

Section title:

17–19px / 600

Card title:

14–16px / 600

Body:

13–14px / 400

Small metadata:

11–12px / 500

Large KPI:

30–34px / 600–700

Use tabular/lining numerals for statistics.

---

# 6. SIDEBAR

Desktop width:

**236px**

Fixed height:

100vh

Background:

`#063C2A`

The sidebar is one of the strongest visual anchors.

It must remain dark forest green even though the rest of the application is light.

Add a very subtle inner/right border:

`rgba(255,255,255,0.08)`

---

# 7. SIDEBAR BRANDING

Top-left:

small green/white forest/map logo

Wordmark:

**VanRakshak**

Below wordmark:

**FRA Land Monitoring**

Wordmark approximately 19–21px.

Subtitle approximately 10–11px.

Logo should be simple.

Do not use a giant logo.

---

# 8. SIDEBAR NAVIGATION

Navigation starts approximately 24px below the brand.

Items:

1. Dashboard
2. Jurisdictions
3. Alert Flags
4. Citizen Reports
5. Model Backtesting
6. Admin Settings
7. Users & Roles

Each item:

height: 42–46px

horizontal padding: 14px

border radius: 9px

gap between icon and label: 12px

Icon size:

18–19px

Use Lucide icons.

Suggested icons:

Dashboard → Home

Jurisdictions → Map

Alert Flags → ShieldAlert

Citizen Reports → FileText / ClipboardList

Model Backtesting → Waypoints / Activity

Admin Settings → Settings

Users & Roles → Users

---

# 9. SIDEBAR ACTIVE STATE

Dashboard active state:

background:

`rgba(52,160,91,0.28)`

border:

`1px solid rgba(83,196,120,0.22)`

text:

white

icon:

light green

The active item should look selected without looking like a glowing neon button.

---

# 10. SIDEBAR BADGES

Alert Flags badge:

red circular/rounded badge

Example:

`18`

Citizen Reports:

green badge

Example:

`32`

Badge should be small and aligned to the far right.

---

# 11. SIDEBAR STATUS BLOCKS

Near the lower half of the sidebar, include:

## Working as

```text
Working as
State Administrator
Odisha
```

For Gram Sabha role:

```text
Working as
Gram Sabha Reviewer
[Jurisdiction Name]
```

Use a subtle bordered dark-green panel.

---

# 12. SYSTEM STATUS

Below the role block:

```text
System Status

● Operational

All systems are running

Last updated
18 Aug 2026, 10:30 AM
```

Green status dot.

Do not use an oversized status widget.

---

# 13. DEMO ENVIRONMENT

Include:

```text
Demo Environment

Prototype • Demo Data
```

This must be visible.

Do not hide demo status.

Use a soft green translucent card.

---

# 14. SIDEBAR ACCOUNT

At bottom:

Circular initials avatar:

`RS`

Name:

`R. Sharma`

Role:

`State Admin`

Dropdown chevron.

For Gram Sabha account use an appropriate demo identity such as:

`A. Nayak`

Role:

`Gram Sabha Reviewer`

Do not use real personal information.

---

# 15. SIDEBAR FOOTER

At absolute bottom:

Help & Docs

Feedback

Small icon + text.

---

# 16. MAIN CONTENT

The main content area begins immediately after the 236px sidebar.

Padding:

20–24px

Do not use excessive outer margins.

The dashboard should feel dense enough for professional operations while retaining whitespace.

---

# 17. TOP HEADER

Height:

approximately 64px

Background:

transparent / page background.

Display:

```text
[State filter] [Jurisdiction filter] [Status filter]       [Search] [Bell] [User]
```

All controls vertically aligned.

---

# 18. STATE FILTER

First control:

```text
State: Odisha (Mayurbhanj)
⌄
```

Width:

approximately 210px

Height:

42–44px

White background.

Border:

`#D9E0D9`

Radius:

9px.

---

# 19. JURISDICTION FILTER

Second control:

```text
Jurisdiction: Gram Sabha
⌄
```

Width:

approximately 225px

Same styling.

---

# 20. STATUS FILTER

Third:

```text
Status: All
⌄
```

Width:

approximately 130px.

Options:

- All
- New
- Under Review
- Resolved
- Escalated

Use the backend status vocabulary.

---

# 21. SEARCH

Search sits toward the right.

Width:

approximately 310px.

Placeholder:

`Search by Flag ID, Location, or Report...`

Icon:

Search

Search should support:

- flag ID
- location
- Gram Sabha
- report ID

---

# 22. NOTIFICATION BELL

Circular/compact icon button.

Small red badge:

`12`

Hover:

subtle green surface.

Click opens a small notification popover.

Do not create a huge notification page unless required.

---

# 23. USER MENU

Top-right profile control:

```text
[RS]  R. Sharma
      State Administrator
                  ⌄
```

White card/button.

Width:

approximately 215px.

---

# 24. MAIN DASHBOARD GRID

Use a CSS grid.

Recommended desktop structure:

```text
columns:

minmax(0, 1fr)  330px
```

Map occupies left.

Alert feed occupies right.

Below map:

analytics cards.

Do NOT allow the alert feed to push the map into a tiny area.

---

# 25. MAP CONTAINER

Map starts around:

20px below header.

Height:

approximately **604px** in a 1440×900 desktop viewport.

The map should be the largest object on the page.

Border radius:

12px

Overflow:

hidden

Border:

1px solid `#DDE4DD`

---

# 26. MAP

Use Leaflet.

Use satellite imagery if available.

Preferred map style:

natural satellite imagery with a subtle dark/green overlay so the data remains readable.

The map must feel like a real GIS workspace.

Do not use a cartoon/vector map.

Do not use a bright standard OpenStreetMap look as the primary presentation.

---

# 27. MAP GEOGRAPHY

Demo geography:

**Mayurbhanj, Odisha**

Show:

- district boundary
- Gram Sabha boundaries
- relevant jurisdiction labels
- FRA parcel indicators if available
- satellite change signals
- community reports
- satellite pass markers where applicable

All demo geographic data must be clearly treated as demonstration data unless backed by real source data.

---

# 28. MAP TOP INFORMATION CARD

Inside the top-left of the map:

white semi-transparent card.

Approximately:

550px wide

Height:

82–90px.

Contents:

```text
Mayurbhanj District
Odisha, India

142
Gram Sabhas
Monitored

57
Active Flags

23
Under Review

09
Resolved
```

Use vertical dividers.

District title should be visually strongest.

---

# 29. MAP CONTROLS

Left side of map.

Vertical control stack:

```text
+
−
Locate
Layers
Fullscreen
```

Each button:

40–42px

White background.

Subtle shadow.

Radius:

8px

Spacing:

5–6px.

Do not use default ugly Leaflet controls if they clash with the design.

Style Leaflet controls to match the system.

---

# 30. MAP LAYER BUTTON

Top-right inside map:

```text
[Layers ⌄]
```

White floating control.

Click opens:

```text
Map Layers

☑ Gram Sabha Boundaries
☑ FRA Parcel Indicators
☑ Satellite Change Signals
☑ Citizen Reports
☐ Satellite Passes
☐ NDVI Difference
```

Use custom checkboxes/switches.

---

# 31. MAP MARKERS

### Verified / lower-priority signal

Green marker:

`#2E9B5F`

### Under Review

Amber:

`#F59E0B`

### High-priority

Red:

`#E5534B`

### Satellite pass

Cyan:

`#08A7C5`

Satellite pass marker may use concentric radar rings.

Keep the rings subtle.

---

# 32. MAP POLYGONS

Gram Sabha boundaries:

thin light green outline.

FRA parcel boundaries:

slightly brighter green.

Potential change area:

amber/red translucent polygon.

Opacity:

approximately 0.15–0.30.

Do not fill entire districts with solid colors.

---

# 33. MAP LABELS

Labels such as:

```text
Karangia
32 GS

Bangriposi
28 GS

Udala
...
```

should be subtle.

Use white/near-white text with a dark translucent backing if needed.

Labels should never overwhelm the map.

---

# 34. MAP LEGEND

Bottom-left of map.

White card.

Approximately:

205×215px.

Title:

**Map Legend**

Rows:

● Verified / Lower Priority

● Under Review

● High-Priority Signal

✦ Satellite Pass

□ FRA Parcel Boundary

□ Gram Sabha Boundary

Use the actual colors from the system.

---

# 35. ACTIVE ALERTS FEED

Right column.

Width:

approximately 330px.

Card background:

white.

Title:

**Active Alerts Feed**

Top-right:

**View All →**

Green text.

---

# 36. ALERT CARD

Each card approximately:

150–170px high.

Border:

1px solid.

Radius:

10px.

Padding:

12–14px.

Use subtle colored left border corresponding to severity.

---

# 37. ALERT CARD CONTENT

Example:

```text
FLAG-2026-00142                    High

🔴 Potential Built-up Change

Location:
Kusumi Gram Sabha

Coordinates:
21.9854° N, 86.4123° E

Source:
Satellite

88% Confidence

18 Aug 2026 • 09:45 AM

[ Verify ] [ Reject ]
```

Do NOT say:

"Confirmed Encroachment."

Use:

"Potential Built-up Change"

or:

"Unverified Land-use Change."

---

# 38. SOURCE BADGE

Satellite:

```text
Satellite
88% Confidence
```

Citizen report:

```text
Citizen Report
70% Authenticity
```

Authenticity comes from Person 5's module when available.

If unavailable, use mock data.

---

# 39. VERIFY BUTTON

Primary action:

forest green.

Text:

`Verify`

Width:

65–70px.

Height:

30–34px.

Radius:

7px.

Click should update status through the API.

Do not merely animate the button.

---

# 40. REJECT BUTTON

Secondary white button with border.

Text:

`Reject`

It should require appropriate confirmation.

Reject should not mean "the activity was illegal."

It means the alert is not being retained as a current actionable signal.

---

# 41. ALERT CARD CLOSE / DISMISS ICON

Use small X icon only for removing the item from the immediate feed if the UX requires it.

Do NOT interpret X as "reject."

Keep status changes explicit.

---

# 42. ALERT DETAIL DRAWER

Clicking an alert card should open a detail drawer or dedicated detail route.

Preferred desktop behavior:

right-side detail drawer.

Width:

420–500px.

It should show:

```text
Flag ID
Status
Location
Jurisdiction
Detection type
Satellite evidence
Community evidence
Parcel proximity
Timeline
Corroboration
Actions
```

---

# 43. ALERT DETAIL HEADER

Example:

```text
FLAG-2026-00142

Potential Built-up Change

HIGH PRIORITY

Under Review
```

Include close button.

---

# 44. ALERT DETAIL MAP

Small contextual map at top of detail panel.

Show:

- exact signal
- relevant jurisdiction
- nearby parcel
- community report if applicable

---

# 45. EVIDENCE SECTION

Display evidence as separate cards:

```text
Satellite Signal
Strong

Community Report
Moderate

Parcel Proximity
38 m
```

Never combine these into an unexplained black-box AI score.

---

# 46. CORROBORATION

Show:

```text
Corroboration

Satellite Signal       Strong
Community Observation  Moderate
Parcel Proximity       38 m

Overall
Strong Corroboration
```

Info tooltip:

`Corroboration prioritizes review; it does not prove a violation.`

---

# 47. ALERT ACTIONS

Available actions depend on role.

Typical:

```text
Mark Under Review
Request Field Verification
Resolve
Escalate to District
```

Do not include:

`Confirm Illegal Activity`

`Accuse`

`Identify Offender`

---

# 48. ANALYTICS ROW

Below map + alert feed, create three primary cards.

Card 1:

**Monitored Gram Sabhas**

Card 2:

**Alert Resolution Rate**

Card 3:

**Model Validation & Backtest**

These cards should align horizontally.

---

# 49. MONITORED GRAM SABHAS CARD

Title:

`Monitored Gram Sabhas`

Info icon.

Large number:

`142 / 162`

Secondary:

`87% of total GS in district`

Trend:

`↑ 12%`

Label:

`vs last month`

Bottom:

green area/sparkline chart.

The chart should be subtle.

---

# 50. ALERT RESOLUTION CARD

Title:

`Alert Resolution Rate`

Donut chart.

Example:

```text
60% Verified
25% Under Review
15% Rejected
```

Center:

`60%`

Below:

`Total Flags 57`

Use green / amber / red.

Do not use too many colors.

---

# 51. MODEL VALIDATION CARD

Title:

`Model Validation & Backtest`

Subtitle:

`Precision (Positive Predictive Value)`

Large number:

`85.6%`

Trend:

`↑ 6.2%`

Chart:

grouped bars comparing:

- Satellite Model
- Ground Truth

Categories:

- Vegetation Loss
- Land-use Change
- Structure Detection
- Overall

IMPORTANT:

This card belongs to Person 4 only as a dashboard visualization.

Person 4 does not own the actual backtesting engine.

---

# 52. DATA OVERVIEW

Right column below alerts.

Card:

**Data Overview**

Rows:

```text
Satellite Images Processed
1,264
This month

Citizen Reports Received
87
This month

Avg. Authenticity Score
72%

Last Satellite Pass
17 Aug 2026
Sentinel-2
```

Use small icons.

Keep this card compact.

---

# 53. BOTTOM DISCLAIMER

Full-width bottom strip.

Very subtle pale green background.

Left:

small shield/info icon.

Text:

> All alerts are unverified and require human review by authorized officials. VanRakshak does not determine legality or ownership.

Right:

Privacy Policy

Terms of Use

`v1.0.0`

This disclaimer is part of the product UX and must remain visible.

---

# 54. GRAM SABHA ROLE

The Gram Sabha dashboard uses the SAME visual system.

However, data is jurisdiction-gated.

The Gram Sabha user should see:

- their jurisdiction
- relevant flags
- relevant reports
- relevant map signals
- status updates
- review queue

They should NOT see unrestricted state-level data.

---

# 55. GRAM SABHA DASHBOARD DIFFERENCE

For Gram Sabha role:

Top filter can become:

```text
Jurisdiction: [Assigned Gram Sabha]
Status: All
```

District/state selectors may be hidden or disabled.

Dashboard title:

`[Gram Sabha Name]`

Subtitle:

`[Block], Mayurbhanj, Odisha`

Stats:

```text
Active Flags
Under Review
Resolved
Community Reports
```

Map should automatically center on the assigned jurisdiction.

---

# 56. STATE / DISTRICT ADMIN DASHBOARD

For State/District Admin:

Allow broader filters:

```text
State
District
Block
Gram Sabha
Status
Date
Signal Type
```

Admin map can show aggregated jurisdiction coverage.

Do not expose unnecessary personal information.

---

# 57. JURISDICTIONS PAGE

This page belongs to Person 4.

Purpose:

browse jurisdictions.

Use a clean table/card interface.

Columns:

```text
Gram Sabha
Block
District
Active Flags
Reports
Under Review
Last Updated
```

Clicking a jurisdiction opens its dashboard context.

---

# 58. ALERT FLAGS PAGE

Full alert list.

Filters:

```text
Status
Severity
Source
Change Type
Date
Jurisdiction
```

Search:

`Search Flag ID...`

Table columns:

```text
Flag ID
Jurisdiction
Signal
Source
Corroboration
Severity
Created
Status
Action
```

Use pagination if required.

---

# 59. CITIZEN REPORTS PAGE

Person 4 can display submitted reports.

This is NOT the reporting form itself.

Display:

- report ID
- jurisdiction
- timestamp
- category
- photo thumbnail
- GPS status
- authenticity score
- linked flag
- status

Click opens report detail.

---

# 60. MODEL BACKTESTING PAGE

Person 4 displays the results supplied by Person 1/backend.

Do not implement the model here.

Show:

- precision
- recall if available
- false positives
- false negatives
- comparison against ground truth
- event-level history

Make it analytical but clean.

---

# 61. ADMIN SETTINGS

Keep this focused.

Include:

- jurisdiction configuration
- notification preferences
- role permissions
- system status
- API/system health indicators

Do not create fake settings that aren't supported by the backend.

---

# 62. USERS & ROLES

Admin-only.

Display:

```text
User
Role
Jurisdiction
Status
Last Login
```

Roles:

- Gram Sabha Reviewer
- District Administrator
- State Administrator

Do not expose passwords or sensitive authentication data.

---

# 63. OTP LOGIN

Person 4 owns the OTP login flow.

Visual style must match the dashboard.

Login page:

white/cream background.

Centered card.

VanRakshak logo.

Title:

`Sign in to VanRakshak`

Subtitle:

`Secure access for authorized users`

Fields:

Mobile / registered identifier

Then:

`Send OTP`

OTP screen:

6 digit inputs.

Button:

`Verify OTP`

Include:

`Resend OTP`

Keep it clean.

---

# 64. LOADING STATES

Every dashboard page must have polished loading states.

Use skeleton cards.

Map:

show a neutral map loading overlay.

Alert feed:

show 3–4 skeleton cards.

Do not show blank white space.

---

# 65. EMPTY STATES

Examples:

No flags:

`No active signals in this jurisdiction.`

No reports:

`No community reports available.`

No alerts:

`No items currently require review.`

No data:

`No monitoring data is available for this period.`

Do not make empty states look like errors.

---

# 66. TOASTS

Use subtle bottom-right toasts.

Examples:

`Flag moved to Under Review`

`Alert resolved`

`Jurisdiction updated`

`Filters applied`

Use green success state.

Use amber/red only for actual errors/warnings.

---

# 67. MODALS

Use modals only when confirmation is necessary.

Example:

Reject flag:

```text
Reject this flag?

This removes the signal from the active review queue.

[Cancel] [Reject Flag]
```

Resolve:

```text
Resolve this alert?

The alert will move to Resolved.

[Cancel] [Resolve]
```

Do not use giant modal windows.

---

# 68. RESPONSIVE DESIGN

Desktop is primary.

Also support:

1024px

768px

390px

On tablet:

sidebar collapses.

On mobile:

sidebar becomes a bottom navigation/drawer.

Map becomes the main surface.

Alert feed becomes a slide-up/bottom sheet.

Analytics become stacked cards.

Never simply scale down the desktop screenshot.

---

# 69. MOBILE NAVIGATION

Use:

```text
Dashboard
Map
Alerts
Reports
More
```

Bottom navigation height:

approximately 64px.

Keep icons 18–20px.

---

# 70. MICROINTERACTIONS

All interactions should feel responsive.

Duration:

150–250ms.

Use:

- opacity
- transform
- border-color
- background-color
- shadow

Avoid bouncing.

Avoid large spring animations.

Map marker pulses should be rare.

---

# 71. HOVER STATES

Cards:

slight elevation.

Buttons:

slight background change.

Navigation:

subtle green surface.

Map marker:

highlight.

Table row:

light green background.

---

# 72. DESIGN TOKENS

Create CSS variables/tokens.

Example:

```css
--color-page: #F7F8F4;
--color-surface: #FFFFFF;
--color-forest-900: #063C2A;
--color-forest-700: #0B5D3F;
--color-green: #2E9B5F;
--color-green-soft: #EAF5EC;
--color-amber: #F59E0B;
--color-red: #E5534B;
--color-cyan: #08A7C5;
--color-text: #15221C;
--color-text-secondary: #66736C;
--color-border: #DDE4DD;
```

Keep all styling derived from these tokens.

---

# 73. COMPONENT ARCHITECTURE

Prefer reusable components:

```text
DashboardLayout
Sidebar
TopFilterBar
UserMenu
NotificationBell

MapWorkspace
MapHeaderStats
MapControls
MapLayers
MapLegend
JurisdictionLayer
ParcelLayer
ChangeSignalLayer
CitizenReportLayer
SatellitePassLayer

AlertFeed
AlertCard
AlertDetailDrawer
EvidenceCard
CorroborationPanel

MetricCard
ResolutionDonut
BacktestChart
DataOverview

JurisdictionTable
AlertTable
ReportTable

StatusBadge
SeverityBadge
SourceBadge

ConfirmModal
Toast
EmptyState
Skeleton
```

Do not create one giant dashboard component.

---

# 74. MAP / DATA CONTRACT BOUNDARY

Person 4 should consume data from Person 2's API.

Do not directly access:

- Google Earth Engine
- Sentinel-2 APIs
- detection models

The frontend only consumes returned coordinates/signals.

For development, use mock objects that mirror the final API contract.

---

# 75. IMPORTANT API-DRIVEN INTERACTIONS

These frontend actions must eventually map to backend calls:

```text
GET flags by jurisdiction

GET flag detail

UPDATE flag status

GET citizen reports

GET jurisdiction data

GET analytics

LOGIN / OTP verification
```

Use a clean API service layer.

Do not put fetch calls throughout UI components.

---

# 76. DATA VISUALIZATION RULE

Every chart must answer a question.

Good:

`How many alerts were resolved?`

Good:

`How many Gram Sabhas are being monitored?`

Good:

`How does model precision compare to ground truth?`

Bad:

Random chart added for decoration.

---

# 77. LANGUAGE / TERMINOLOGY

Use:

- Flag
- Signal
- Potential Change
- Unverified Land-use Change
- Under Review
- Corroborated
- Human Review
- Field Verification
- Resolved
- Escalated

Avoid:

- criminal
- offender
- illegal activity
- confirmed encroacher
- culprit
- violation confirmed

The dashboard is a decision-support system, not an accusation system.

---

# 78. DEMO DATA

Use realistic-looking demo data.

Examples:

```text
Mayurbhanj District
142 Gram Sabhas
57 Active Flags
23 Under Review
09 Resolved
```

Flag IDs:

```text
FLAG-2026-00142
FLAG-2026-00141
FLAG-2026-00139
FLAG-2026-00138
```

Use fictional/demonstration identities.

Always show:

`Prototype • Demo Data`

---

# 79. EXACT VISUAL PROPORTION TARGET

For a 1440×900 desktop:

Sidebar:

236px

Main horizontal padding:

20–24px

Header:

64px

Map:

approximately 60–65% of available horizontal content

Alert feed:

approximately 330px

Gap between map and alert feed:

14–16px

Analytics cards:

approximately 3 equal columns

Border radius:

8–12px

The UI should be compact and professional.

---

# 80. DO NOT OVERDESIGN

The reference is polished because it is restrained.

Do not add:

- floating blobs
- excessive gradients
- neon outlines
- giant glass panels
- animated backgrounds
- unnecessary 3D
- excessive rounded pills
- huge typography
- random decorative illustrations

The satellite map itself is the visual hero.

---

# 81. FINAL SCREEN CHECKLIST

Before declaring the dashboard complete, verify:

### Branding
- [ ] VanRakshak used everywhere
- [ ] FRA Land Monitoring subtitle
- [ ] No FRAWatch references
- [ ] Forest-green brand identity

### Layout
- [ ] 236px dark green sidebar
- [ ] top filter/search bar
- [ ] large map
- [ ] right alert feed
- [ ] bottom analytics
- [ ] data overview
- [ ] footer disclaimer

### Map
- [ ] Leaflet
- [ ] Mayurbhanj demo geography
- [ ] jurisdiction boundaries
- [ ] signal markers
- [ ] parcel indicators
- [ ] satellite-pass visualization
- [ ] legend
- [ ] layers
- [ ] zoom/location/fullscreen controls

### Alerts
- [ ] Flag ID
- [ ] signal type
- [ ] source
- [ ] confidence/authenticity
- [ ] coordinates
- [ ] timestamp
- [ ] Verify
- [ ] Reject
- [ ] status
- [ ] detail drawer

### Analytics
- [ ] monitored Gram Sabhas
- [ ] resolution donut
- [ ] model validation/backtest
- [ ] data overview

### Roles
- [ ] Gram Sabha view
- [ ] District/Admin view
- [ ] state-level filtering where authorized
- [ ] role-aware navigation
- [ ] jurisdiction-aware data

### Safety/credibility
- [ ] no accusations
- [ ] no illegal-activity claims
- [ ] human review language
- [ ] demo data clearly labeled
- [ ] privacy-conscious presentation

---

# 82. IMPLEMENTATION INSTRUCTION TO CODEX

When implementing this document:

1. Inspect the existing repository first.
2. Preserve the existing framework.
3. Do not rewrite unrelated code.
4. Build Person 4's dashboard only.
5. Use reusable React components.
6. Use Leaflet for the map.
7. Implement the light cream + forest-green theme exactly.
8. Use Inter or the closest available font.
9. Match the supplied reference image's spacing and hierarchy.
10. Use the exact labels and terminology in this document.
11. Use mock data only where backend endpoints are not yet available.
12. Keep mock data in a separate data layer.
13. Make interactions functional, not decorative.
14. Make role-based screens structurally ready.
15. Run the application after implementation.
16. Fix all build/runtime errors.
17. Check desktop and mobile layouts.
18. Do a final visual polish pass.

---

# 83. MOST IMPORTANT FINAL INSTRUCTION

Do NOT interpret this document as inspiration.

Treat it as the **implementation specification**.

The supplied dashboard reference image is the visual target.

Match:

- overall composition
- sidebar width
- map dominance
- right alert column
- card dimensions
- colors
- typography
- spacing
- borders
- radius
- icon placement
- button placement
- hierarchy
- information density

as closely as technically possible.

If a design decision is not explicitly specified here, prefer the visual language of the supplied reference rather than inventing a new style.

The final result should look like the same product family as the reference image:

**VanRakshak — FRA Land Monitoring**

not a generic dashboard.
