DOCUMENT 1 OF 3
HYDROGRAPH — PREMIUM FRONTEND DESIGN & IMPLEMENTATION SPECIFICATION
MUNICIPAL COMMAND CENTER + GIS FLOOD INTELLIGENCE

IMPORTANT:
This is DOCUMENT 1 OF 3.

Do NOT redesign the backend.
Do NOT rewrite the PRD.
Do NOT focus on backend architecture.

Your responsibility in this document is ONLY the frontend/UI/UX.

The backend/product requirements already exist in the HydroGraph PRD.

Build the frontend as a world-class emergency-management and geospatial intelligence product.

The frontend must look like a serious government-grade disaster intelligence platform, not a college project, generic admin dashboard, or ordinary weather application.

The final UI must be:
- highly interactive
- visually impressive
- operationally useful
- information-dense but not cluttered
- extremely clear during emergencies
- responsive
- accessible
- fast
- map-centric
- intuitive
- professional
- unique

==================================================
1. PRODUCT
==================================================

Product name:

HYDROGRAPH

Tagline:

PREDICT → EXPLAIN → WARN → ROUTE → EVACUATE → RESCUE

Product purpose:

HydroGraph converts rainfall, terrain, drainage, river conditions and emergency information into actionable street-level flood intelligence.

The frontend must make the following information immediately understandable:

- Where is flooding happening?
- Where will flooding happen next?
- How deep will it become?
- How soon will it happen?
- Which roads are unsafe?
- Why is this location flooding?
- How confident is the prediction?
- Where are SOS incidents?
- Where are rescue teams?
- Which shelters are safe?
- Which routes remain usable?

==================================================
2. DESIGN DIRECTION
==================================================

Create a distinctive visual identity.

DO NOT copy:
- Google Maps
- ArcGIS dashboard
- generic SaaS admin dashboards
- generic Bootstrap dashboards
- generic hospital dashboards

Instead create a custom "Urban Disaster Intelligence" visual language.

Preferred visual direction:

DARK COMMAND-CENTER BASE

Use:
- deep navy/charcoal background
- glass/soft translucent panels
- subtle cyan/teal intelligence accents
- amber warning accents
- red emergency accents
- green safe-state accents
- high-contrast white typography

The map must remain the visual hero.

Use subtle:
- grid patterns
- geographic contours
- radar-like glow
- thin data lines
- micro animations
- pulsing emergency markers

Do NOT overuse glow or neon.

The interface must still feel professional and governmental.

==================================================
3. APPLICATION SHELL
==================================================

Create a desktop-first command-center shell.

Layout:

LEFT:
Compact vertical navigation rail.

CENTER:
Large interactive GIS map.

RIGHT:
Contextual intelligence panel.

TOP:
Global command/status bar.

BOTTOM:
Forecast timeline / time slider.

Navigation:

1. Overview
2. Live Flood Map
3. Hotspots
4. Drainage
5. Routing
6. Shelters
7. SOS
8. Rescue
9. Scenarios
10. Replay
11. System Health

At the bottom:

Settings
User profile
Role

==================================================
4. TOP COMMAND BAR
==================================================

Design a sophisticated top command bar.

Left:

HYDROGRAPH logo

Center:

Current location:

PILOT ZONE
CITY / DISTRICT

Live status:

● SYSTEM OPERATIONAL

Right:

Radar:
● LIVE

Forecast:
Updated 2 min ago

Last model run:
14:32:08

Data quality:
GOOD

User:
Municipal Operator

Include a notification icon.

If critical flooding exists:

display:

⚠ 12 CRITICAL ALERTS

The alert count must visually attract attention but must not dominate the entire interface.

==================================================
5. OVERVIEW DASHBOARD
==================================================

Create an exceptional command-center overview.

Top KPI cards:

CURRENT FLOOD RISK
HIGH

CRITICAL ROADS
12

SOS INCIDENTS
18

PEAK DEPTH
42 cm

TIME TO CRITICAL
27 min

ACTIVE RESCUE TEAMS
9

Each card should contain:
- number
- label
- trend/change
- tiny visualization
- status indicator

Example:

TIME TO CRITICAL
27 min
↓ 8 min since last update

Use subtle animation when values change.

==================================================
6. MAIN GIS MAP
==================================================

The map must occupy the majority of the screen.

Use a modern dark basemap.

Map layers:

1. Flood depth
2. Rainfall
3. Flood velocity
4. Drainage stress
5. Drainage anomalies
6. River/dam influence
7. Roads
8. Shelters
9. SOS
10. Rescue teams
11. Safe routes
12. Administrative boundaries

Create a collapsible layer control.

Do NOT show every layer by default.

Default:

Flood Depth
Rainfall
Critical Roads
SOS

==================================================
7. FLOOD DEPTH VISUALIZATION
==================================================

Create a visually intuitive flood-depth heatmap.

Depth ranges:

LOW
MODERATE
HIGH
SEVERE

Show a professional legend.

When hovering a road:

show a floating tooltip:

ROAD R-102

Current Depth
18 cm

Peak Forecast
34 cm

Time to Critical
31 min

Risk
HIGH

Confidence
87%

==================================================
8. MAP INTERACTION
==================================================

Implement:

- hover
- click
- zoom
- pan
- marker clustering
- layer toggles
- animated flood progression
- selected road highlighting
- map search
- locate me
- fullscreen
- reset view

When selecting a road, open the right-side intelligence panel.

Do NOT navigate to another page unnecessarily.

The map and information panel should work together.

==================================================
9. RIGHT-SIDE STREET INTELLIGENCE PANEL
==================================================

When a road is selected, display:

ROAD R-102

HIGH RISK

Current:
18 cm

Peak:
34 cm

Velocity:
0.42 m/s

Duration:
48 min

Time-to-flood:
31 min

Confidence:
87%

Rainfall:
76 mm/hr

Drain utilization:
94%

Possible Cause:

Heavy rainfall
+
Drainage stress

Recommended Action:

AVOID AFTER +30 MIN

Buttons:

VIEW ROUTE

SIMULATE

REPORT ISSUE

CLOSE ROAD

==================================================
10. FLOOD FORECAST TIMELINE
==================================================

At bottom of map create a cinematic forecast timeline.

Timeline:

NOW
+15m
+30m
+45m
+60m
+90m
+120m
+180m

Allow the user to drag the timeline.

When moving the timeline:

the map must update the flood layer.

Animate the transition smoothly.

Show:

FORECAST MODE

+45 MIN

Expected Peak:

31 cm

Confidence:

84%

==================================================
11. TIME-TO-FLOOD VISUALIZATION
==================================================

Create a dedicated visualization.

Example:

CURRENT
3 cm

+15 MIN
7 cm

+30 MIN
14 cm

+45 MIN
22 cm

+60 MIN
31 cm

Represent this as:

- line chart
- vertical threshold marker
- danger threshold
- current position

The chart must visually communicate:

"How much time remains before this road becomes dangerous?"

==================================================
12. HOTSPOT PANEL
==================================================

Create a ranked hotspot drawer.

Title:

TOP FLOOD HOTSPOTS

Cards:

01
R-102
SEVERE
34 cm
18 min

02
Junction 14
HIGH
27 cm
24 min

03
Market Road
HIGH
25 cm
31 min

Each card must be clickable.

Clicking it focuses the map.

==================================================
13. RAINFALL PANEL
==================================================

Create a rainfall intelligence panel.

Show:

CURRENT RAINFALL
76 mm/hr

15 MIN FORECAST
82 mm/hr

60 MIN FORECAST
91 mm/hr

TOTAL ACCUMULATION
142 mm

Then show:

STORM MOVEMENT

→ NE

Storm intensity:

EXTREME

Use a radar-inspired mini visualization.

==================================================
14. CONFIDENCE UI
==================================================

Confidence must never be hidden.

For every prediction display:

CONFIDENCE 87%

Clicking confidence opens an explanation:

Why confidence is 87%:

Radar freshness
✓

DEM quality
✓

Drainage coverage
✓

Model agreement
✓

Historical validation
✓

Forecast lead time
—

Then show:

Expected depth:
27 cm

Likely range:
21–34 cm

This makes the system explainable.

==================================================
15. DRAINAGE INTELLIGENCE
==================================================

Create a drainage layer.

Show:

NORMAL
STRESSED
CRITICAL

When selecting a drainage node:

NODE N-204

Utilization:
94%

Expected capacity:
82 L/s

Current estimated flow:
77 L/s

Status:
STRESSED

Anomaly:

Possible capacity reduction

Confidence:

76%

Action:

REQUEST FIELD INSPECTION

IMPORTANT:

Do not label an inferred anomaly as a confirmed blockage.

==================================================
16. SOS MAP
==================================================

SOS markers must be visually distinct.

Use:

CRITICAL SOS
HIGH SOS
MODERATE SOS

Use clustering when many SOS reports exist.

Click marker:

SOS #10284

Priority:
CRITICAL

People:
4

Children:
1

Elderly:
1

Medical:
YES

Water:
~1 m

Waiting:
8 min

Button:

OPEN INCIDENT

==================================================
17. RESCUE TEAM MAP
==================================================

Show rescue teams as moving markers.

Example:

TEAM R-04

Available

ETA:
11 min

Current location:
2.4 km away

Route:

SAFE

When assigned:

marker changes to:

EN ROUTE

Animate movement.

==================================================
18. ALERT CENTER
==================================================

Create a notification drawer.

Categories:

CRITICAL
WARNING
INFO

Example:

CRITICAL
Road R-102 predicted severe flooding in 18 min.

WARNING
Drain node N-204 approaching capacity.

INFO
Rainfall forecast updated.

Allow:
- acknowledge
- dismiss
- open
- mark as read

==================================================
19. ROAD CLOSURE INTERACTION
==================================================

Operator can click:

CLOSE ROAD

Open confirmation modal:

CLOSE ROAD R-102?

Reason:
Flood depth above safe threshold

Duration:
Until manually reopened

Affected routes:
7

Confirm closure.

After confirmation:

Road changes visually on map.

Routing automatically recalculates.

Show toast:

ROAD CLOSED
7 routes recalculated.

==================================================
20. RESPONSIVE BEHAVIOR
==================================================

Desktop:

Full command center.

Tablet:

Map + collapsible intelligence panel.

Mobile:

Do NOT try to reproduce the entire command center.

Instead provide:
- alerts
- map
- hotspots
- SOS
- shelter
- route

==================================================
21. MICROINTERACTIONS
==================================================

Use meaningful animations.

Examples:

New SOS:
soft pulse

Critical alert:
subtle red pulse

Forecast update:
map layer transition

New rescue assignment:
route animates onto map

Road closure:
road fades into blocked state

Confidence:
animated progress ring

Do not use animations merely for decoration.

==================================================
22. ACCESSIBILITY
==================================================

Flood information cannot depend only on color.

Use:

color + icons + labels + patterns.

Example:

SEVERE
▲
RED
Blocked

Do not rely on red/green alone.

Support:
- keyboard navigation
- focus states
- readable contrast
- screen-reader labels
- large emergency targets

==================================================
23. TECHNICAL FRONTEND REQUIREMENTS
==================================================

Use:

React
TypeScript
MapLibre GL JS
Tailwind CSS
Recharts or equivalent
Framer Motion where useful

Component architecture must be modular.

Suggested structure:

/components
/map
/dashboard
/forecast
/drainage
/sos
/rescue
/routing
/shelter
/scenario
/replay
/ui

Use reusable components.

==================================================
24. API INTEGRATION
==================================================

Frontend must be designed around the existing backend APIs.

Important endpoints:

GET /api/v1/forecast/latest

GET /api/v1/hotspots

GET /api/v1/flood/{road_id}

GET /api/v1/drainage/status

GET /api/v1/drainage/anomalies

POST /api/v1/route

GET /api/v1/shelters/safe

POST /api/v1/sos

GET /api/v1/sos/priority

POST /api/v1/rescue/assign

POST /api/v1/road/closure

GET /api/v1/system/health

Do not hard-code fake architecture assumptions.

For development/demo, create realistic mock data adapters if backend endpoints are unavailable.

==================================================
25. DATA STATES
==================================================

Every component must handle:

Loading
Loaded
Empty
Error
Stale
Offline

Example:

Radar unavailable:

show:

RADAR DATA DELAYED

Last update:
8 min ago

Confidence reduced.

Never silently show stale data as live.

==================================================
26. FINAL QUALITY BAR
==================================================

The final frontend must feel like:

"Bloomberg Terminal + modern GIS + emergency operations center"

but must have its own unique HydroGraph identity.

It must immediately impress an SIH judge.

The first 10 seconds of viewing should communicate:

1. This is a serious disaster-management product.
2. The map is live and intelligent.
3. It predicts future flooding.
4. It explains risk.
5. It connects prediction to emergency action.

Do NOT create a generic dashboard.

Create a product that looks deployable by a real government disaster-management organization.

END OF DOCUMENT 1.