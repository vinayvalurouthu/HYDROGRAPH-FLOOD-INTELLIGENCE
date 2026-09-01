DOCUMENT 3 OF 3
HYDROGRAPH — PREMIUM FRONTEND DESIGN & IMPLEMENTATION SPECIFICATION
EMERGENCY OPERATIONS + SCENARIO SIMULATION + HISTORICAL REPLAY + DESIGN SYSTEM

IMPORTANT:
This is DOCUMENT 3 OF 3.

This document completes the HydroGraph frontend.

Focus on:

- emergency command operations
- rescue dispatch
- what-if simulation
- historical event replay
- system health
- analytics
- notifications
- design system
- component system
- interaction system
- frontend architecture
- visual consistency

Do not redesign Documents 1 and 2 from scratch.

Integrate them into one coherent product.

==================================================
1. EMERGENCY COMMAND CENTRE
==================================================

Create a dedicated emergency operations interface.

This is NOT a normal admin dashboard.

It should feel like a professional emergency operations center.

Primary objective:

Help municipal authorities answer:

1. What is happening?
2. Where is it happening?
3. What will happen next?
4. Who needs help?
5. Which roads are safe?
6. Where should rescue teams go?
7. Which shelters are available?
8. What action should we take?

==================================================
2. COMMAND CENTER LAYOUT
==================================================

Main layout:

TOP:
System status + critical alert bar

LEFT:
Incident queue

CENTER:
Live operational map

RIGHT:
Selected incident / rescue / shelter details

BOTTOM:
Operational timeline

==================================================
3. INCIDENT QUEUE
==================================================

Show incidents ordered by priority.

Example:

CRITICAL

SOS #10284
4 people
Medical emergency
Severe flood

ETA:
11 min

HIGH

SOS #10276
2 people
Flood depth:
70 cm

MODERATE

SOS #10251
1 person

Each incident card:

- priority
- location
- people
- risk
- waiting time
- status

==================================================
4. SOS INCIDENT DETAIL
==================================================

When selected:

SOS #10284

CRITICAL

Location:
Market Road

People:
4

Children:
1

Elderly:
1

Medical:
YES

Water depth:
~1 m

Waiting:
8 min

Flood risk:
SEVERE

Then:

RECOMMENDED ACTION

Dispatch Rescue Team R-04

Safe route:

4.2 km

ETA:

11 min

Buttons:

ASSIGN TEAM

OPEN ROUTE

CALL

MARK VERIFIED

==================================================
5. RESCUE DISPATCH
==================================================

When operator selects:

ASSIGN TEAM

show available teams.

TEAM R-04

Distance:
2.4 km

ETA:
11 min

Vehicle:
Rescue Van

Capacity:
8

Route safety:
HIGH

TEAM R-07

Distance:
4.8 km

ETA:
17 min

Vehicle:
Boat

Capacity:
10

Route safety:
SAFE

Allow operator to select.

After assignment:

show confirmation:

TEAM R-07 ASSIGNED

SOS #10284

STATUS:
EN ROUTE

==================================================
6. RESCUE TRACKING
==================================================

Show real-time rescue movement.

Map:

SOS location

Rescue team

Route

Flood zones

Road closures

Shelters

Show:

ETA

distance

current status

route risk

If route becomes dangerous:

WARNING

CURRENT ROUTE COMPROMISED

Alternative safe route available.

Button:

REROUTE

==================================================
7. RESCUE STATUS WORKFLOW
==================================================

Statuses:

RECEIVED
VERIFIED
ASSIGNED
EN ROUTE
RESCUED
CLOSED

Display this as a horizontal progress tracker.

Each state should have timestamp.

Example:

14:02
SOS received

14:03
Location verified

14:05
Team assigned

14:08
Team en route

14:19
Citizen rescued

14:24
Case closed

==================================================
8. SHELTER OPERATIONS
==================================================

Create an authority-side shelter dashboard.

Cards:

CENTRAL SCHOOL

Capacity:
500

Occupancy:
340

68%

Status:
OPEN

Flood risk:
LOW

Medical:
YES

Another:

COMMUNITY HALL

Capacity:
300

Occupancy:
292

97%

Status:
NEAR FULL

Use visual capacity bars.

==================================================
9. SHELTER ALERT
==================================================

If a shelter becomes unsafe:

SHELTER STATUS CHANGE

Central School

Flood risk:
LOW → HIGH

Recommended action:

STOP NEW ARRIVALS

BUTTON:

MARK UNAVAILABLE

The system should automatically update citizen recommendations.

==================================================
10. ROAD MANAGEMENT
==================================================

Create road operations panel.

Show:

Road ID

Risk

Depth

Closure status

Time-to-flood

Traffic importance

Actions:

CLOSE ROAD

REOPEN ROAD

VIEW FLOOD

FIND ALTERNATIVE

==================================================
11. WHAT-IF SIMULATION UI
==================================================

Create a highly interactive scenario simulator.

Title:

WHAT-IF FLOOD SIMULATOR

Start with:

BASELINE

Then sliders:

RAINFALL INTENSITY
100%

DRAINAGE CAPACITY
100%

RIVER LEVEL
NORMAL

ROAD STATUS
OPEN

Buttons:

RUN SCENARIO

RESET

==================================================
12. SCENARIO CONTROLS
==================================================

Rainfall:

50%
75%
100%
125%
150%

Drainage capacity:

100%
75%
50%
25%

River:

NORMAL
WARNING
DANGER
EXTREME

Road:

OPEN
CLOSED

Allow operators to combine conditions.

==================================================
13. SCENARIO RESULT
==================================================

After running:

SCENARIO RESULT

Flooded roads:
+18

Peak depth:
+12 cm

Flooded area:
+23%

Time-to-flood:
-11 min

Affected shelters:
+2

SOS exposure:
+14%

Then compare:

BASELINE vs SCENARIO

Use charts.

==================================================
14. SCENARIO MAP
==================================================

Show split-screen:

LEFT:
Baseline

RIGHT:
Scenario

Allow:

SWIPE COMPARISON

or

BLINK COMPARISON

The operator should immediately see how the flood changes.

==================================================
15. SCENARIO SAVING
==================================================

Allow:

SAVE SCENARIO

Example:

"Heavy rainfall + 50% drainage capacity"

Saved scenarios appear in:

MY SCENARIOS

Each has:

date
author
conditions
result

==================================================
16. HISTORICAL EVENT REPLAY
==================================================

Create a cinematic historical replay screen.

Purpose:

Demonstrate model performance without waiting for a real flood.

Screen:

HISTORICAL EVENT REPLAY

Select event:

2025 MONSOON EVENT

Then:

PLAY

Timeline:

10:00
10:15
10:30
10:45
11:00
11:15
11:30

Animate:

rainfall

flood extent

road impact

drainage stress

==================================================
17. PREDICTED VS OBSERVED
==================================================

Provide a comparison mode.

Show:

PREDICTED

OBSERVED

Overlay them on the map.

Use:

MATCH

MISMATCH

UNCERTAINTY

Then show metrics:

Flood IoU
Depth MAE
Time-to-flood error

Do not present engineering targets as achieved results.

==================================================
18. EVENT REPLAY TIMELINE
==================================================

Create a bottom timeline.

Controls:

PLAY

PAUSE

STEP BACK

STEP FORWARD

SPEED:

0.5x
1x
2x
4x

Add event markers:

Rainfall peak

Drainage surcharge

First road flood

Critical flood

Evacuation warning

SOS peak

==================================================
19. ANALYTICS
==================================================

Create an analytics panel.

Metrics:

Total flooded roads

Peak water depth

Maximum velocity

Flood duration

Affected population estimate

Shelter utilization

SOS count

Rescue response time

Model confidence

Historical accuracy

Use charts sparingly.

Prefer visual storytelling over dashboards filled with graphs.

==================================================
20. SYSTEM HEALTH
==================================================

Create a technical health dashboard.

Services:

Radar ingestion
● HEALTHY

CWC ingestion
● HEALTHY

GIS
● HEALTHY

SWMM
● HEALTHY

2D model
● HEALTHY

GNN
● HEALTHY

Routing
● HEALTHY

Database
● HEALTHY

SOS
● HEALTHY

Show:

Last update

Latency

Error rate

Data freshness

==================================================
21. DEGRADED MODE
==================================================

If something fails:

show a clear banner.

Example:

RADAR DATA DELAYED

Last update:
8 minutes ago

Forecast uncertainty increased.

Do NOT create an alarming full-screen error unless necessary.

The system should continue operating with reduced confidence where possible.

==================================================
22. GLOBAL ALERT SYSTEM
==================================================

Create a unified notification system.

Types:

CRITICAL
WARNING
INFO
SUCCESS

Alerts should support:

toast

notification center

map marker

context panel

Do not duplicate the same alert excessively.

==================================================
23. DESIGN SYSTEM
==================================================

Create a complete HydroGraph design system.

Brand:

HYDROGRAPH

Primary visual identity:

Urban Flood Intelligence

Colors:

Background:
deep navy / charcoal

Primary:
teal/cyan

Safe:
green

Warning:
amber

Critical:
red

Info:
blue

Do not use excessive gradients.

==================================================
24. TYPOGRAPHY
==================================================

Use a modern technical sans-serif.

Recommended:

Inter

or

Manrope

or equivalent.

Hierarchy:

Display

Heading

Section heading

Body

Caption

Metric

Emergency number

Time-to-flood should have a very strong visual hierarchy.

==================================================
25. COMPONENT LIBRARY
==================================================

Build reusable:

Button

IconButton

Badge

StatusPill

Card

MetricCard

AlertCard

MapMarker

MapTooltip

BottomSheet

Drawer

Modal

Tabs

Dropdown

Slider

Timeline

ProgressBar

ProgressRing

Chart

Table

DataTable

Toast

Notification

EmptyState

ErrorState

Skeleton

==================================================
26. EMERGENCY COMPONENTS
==================================================

Create special components:

EmergencyButton

SOSButton

RiskIndicator

FloodDepthIndicator

TimeToFloodBadge

ConfidenceIndicator

ShelterCard

RescueTeamCard

IncidentCard

RoadRiskCard

RouteCard

ForecastTimeline

==================================================
27. MAP COMPONENT SYSTEM
==================================================

Create reusable:

FloodLayer

RainfallLayer

VelocityLayer

DrainageLayer

AnomalyLayer

ShelterLayer

SOSLayer

RescueLayer

RouteLayer

RoadClosureLayer

MapLegend

MapControls

LayerSwitcher

MapSearch

TimeSlider

==================================================
28. EMPTY STATES
==================================================

Do not leave blank screens.

Example:

No active SOS incidents.

✓

ALL CLEAR

No emergency incidents currently require response.

Example:

No drainage anomalies.

✓

No unusual drainage behavior detected.

==================================================
29. LOADING STATES
==================================================

Use skeleton loading.

For maps:

show map immediately.

Then progressively load:

roads

flood layer

rainfall

incidents

routes

Do not block the whole interface waiting for every API.

==================================================
30. ERROR STATES
==================================================

Example:

ROUTING SERVICE TEMPORARILY UNAVAILABLE

Using fallback route calculation.

The user should know:

- what failed
- what fallback is active
- whether action is still possible

==================================================
31. REAL-TIME UPDATES
==================================================

Design the UI for live data.

Possible implementation:

WebSocket/SSE when available.

Use polling fallback.

Live updates should update only affected components.

Do not refresh the entire page.

==================================================
32. MOTION SYSTEM
==================================================

Motion should communicate:

change
urgency
progress
connection

Examples:

Forecast update:
smooth transition

New SOS:
pulse

Rescue:
route movement

Scenario:
map transition

Replay:
time progression

Use reduced-motion support.

==================================================
33. UNIQUE VISUAL FEATURES
==================================================

Create several signature HydroGraph features.

FEATURE 1:

"Flood Pulse"

A subtle map animation showing predicted flood propagation through time.

FEATURE 2:

"Time-to-Flood Ring"

A circular countdown around selected high-risk locations.

FEATURE 3:

"Confidence Halo"

Map markers have a subtle halo representing prediction confidence.

FEATURE 4:

"Risk Corridor"

Highlight the predicted flood propagation corridor.

FEATURE 5:

"Decision Strip"

At the bottom:

NOW
→
+30 MIN
→
+60 MIN
→
+120 MIN

with changing risk.

FEATURE 6:

"Action Intelligence"

Instead of simply:

HIGH RISK

show:

HIGH RISK

ACTION:
Avoid R-102 after 14:45.

This makes the UI actionable.

==================================================
34. ROLE-BASED FRONTEND
==================================================

Support:

Citizen

Municipal Operator

Rescue Team

Administrator

Each role gets an appropriate interface.

Citizen:
simple safety interface

Operator:
full command center

Rescue:
incident + navigation interface

Admin:
system health + configuration

==================================================
35. FRONTEND SECURITY
==================================================

Implement:

authentication

role-based routes

protected operator screens

session handling

secure API requests

logout

timeout handling

Do not expose administrative functions to citizens.

==================================================
36. PERFORMANCE
==================================================

The map is the most important performance concern.

Use:

lazy loading

code splitting

virtualized lists

memoized components

efficient map layers

debounced interactions

cached API responses

progressive loading

Do not render thousands of DOM markers if clustering or map-native layers can be used.

==================================================
37. RESPONSIVE PRODUCT STRATEGY
==================================================

DESKTOP:

Municipal command center

TABLET:

Operations + map

MOBILE:

Citizen safety

Do not force one layout onto all screen sizes.

==================================================
38. FINAL NAVIGATION
==================================================

The complete product should have:

COMMAND CENTER

LIVE MAP

HOTSPOTS

DRAINAGE

ROUTING

SHELTERS

SOS

RESCUE

SCENARIOS

REPLAY

ANALYTICS

SYSTEM HEALTH

Settings

==================================================
39. FINAL DEMO JOURNEY
==================================================

The frontend must support a perfect SIH demonstration.

Demo:

1. Open Command Center.

2. Show current flood risk.

3. Start Historical Replay.

4. Show flood spreading.

5. Jump to +45 minutes.

6. Select a road.

7. Show:
   depth
   velocity
   time-to-flood
   confidence

8. Show drainage stress.

9. Open What-If.

10. Increase rainfall.

11. Reduce drainage capacity.

12. Run scenario.

13. Show flood expansion.

14. Return to live map.

15. Show SOS incident.

16. Open incident.

17. Assign rescue team.

18. Show safe route.

19. Open shelter.

20. Show shelter capacity.

21. Return to command center.

The entire demonstration should feel like one connected system.

==================================================
40. FINAL DESIGN QUALITY BAR
==================================================

The final frontend should look like a product that could realistically be shown to:

- Ministry of Earth Sciences
- IMD
- CWC
- municipal corporations
- disaster management authorities
- emergency services

It must NOT look like:

- student CRUD project
- ordinary admin template
- generic React dashboard
- simple Google Maps clone
- generic AI dashboard

The design must communicate:

TRUST

URGENCY

INTELLIGENCE

CLARITY

RELIABILITY

ACTION

==================================================
41. FINAL FRONTEND PRINCIPLE
==================================================

HydroGraph frontend philosophy:

SEE THE FLOOD.

UNDERSTAND THE RISK.

KNOW THE TIME.

TAKE THE SAFEST ACTION.

GET HELP WHEN NECESSARY.

Every major screen must answer:

"What should the user do next?"

==================================================
42. FINAL IMPLEMENTATION REQUIREMENT
==================================================

Generate the actual frontend implementation, not merely descriptions.

Create:

- reusable components
- responsive pages
- navigation
- realistic mock data
- interactive map
- interactive charts
- animations
- dialogs
- drawers
- notifications
- scenario controls
- replay controls
- SOS flow
- routing flow
- shelter flow
- rescue flow
- system health
- loading/error/offline states

Use realistic data matching the HydroGraph PRD.

Do not use lorem ipsum.

Do not use generic placeholder dashboards.

Do not leave major buttons non-functional.

Where backend APIs are unavailable, use a clean mock service layer so that APIs can later be connected without rewriting the UI.

==================================================
43. FINAL OUTPUT
==================================================

The final result must be a complete, polished, interactive HydroGraph frontend.

It should feel like:

A REAL URBAN FLOOD COMMAND PLATFORM

not a prototype-looking website.

Priority:

1. UX
2. Visual hierarchy
3. Map interaction
4. Emergency usability
5. Responsiveness
6. Performance
7. Accessibility
8. Technical maintainability

END OF DOCUMENT 3.