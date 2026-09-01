DOCUMENT 2 OF 3
HYDROGRAPH — PREMIUM FRONTEND DESIGN & IMPLEMENTATION SPECIFICATION
CITIZEN EXPERIENCE + SAFE ROUTING + SHELTER + SOS

IMPORTANT:
This is DOCUMENT 2 OF 3.

Focus ONLY on the citizen-facing experience.

Do NOT redesign the municipal command center from Document 1.

The citizen interface must be radically simpler than the operator interface.

A person may use this application:
- during heavy rain
- while frightened
- with poor connectivity
- on a low-end phone
- while walking/driving
- with limited technical knowledge

Therefore the design priority is:

SAFETY > CLARITY > SPEED > BEAUTY

But it must still be visually exceptional and unique.

==================================================
1. PRODUCT
==================================================

Product:

HYDROGRAPH

Citizen PWA

No mandatory app installation.

Primary actions:

CHECK FLOOD RISK
FIND SAFE ROUTE
FIND SAFE SHELTER
SEND SOS

==================================================
2. DESIGN LANGUAGE
==================================================

Create a mobile-first emergency interface.

Visual direction:

- dark navy base
- high contrast
- large typography
- large touch targets
- teal for safe
- amber for warning
- red for emergency
- white for primary information

Avoid:
- complicated dashboards
- tiny text
- excessive charts
- dense menus
- unnecessary animations

The citizen must understand the current situation in less than 3 seconds.

==================================================
3. HOME SCREEN
==================================================

Top:

HYDROGRAPH

Location:

Using current location

Main status card:

CURRENT FLOOD RISK

HIGH

Your area is expected to experience severe flooding.

Time to critical:

27 MIN

Then three large actions:

FIND SAFE ROUTE

NEAREST SAFE SHELTER

I AM IN DANGER

The SOS action must always remain visually accessible.

==================================================
4. CURRENT LOCATION
==================================================

Show:

YOU ARE HERE

Current location:

Area name

Current risk:

HIGH

Current depth:

12 cm

Predicted peak:

28 cm

Time-to-flood:

34 min

Confidence:

86%

Use a simple map.

Do not overwhelm the citizen with engineering details.

==================================================
5. FLOOD STATUS
==================================================

Create an easy-to-understand status screen.

Example:

YOUR AREA

HIGH FLOOD RISK

Water may reach:

25–35 cm

Expected:

within 35 minutes

Confidence:

86%

Then:

WHAT SHOULD YOU DO?

Avoid low-lying roads.

Move toward the recommended safe zone.

Keep emergency contacts accessible.

==================================================
6. FORECAST SCREEN
==================================================

Show simple timeline:

NOW
LOW

+15 MIN
MODERATE

+30 MIN
HIGH

+45 MIN
SEVERE

Use an intuitive horizontal timeline.

Do not require the citizen to understand hydraulic modelling.

==================================================
7. SAFE ROUTE EXPERIENCE
==================================================

Primary action:

FIND SAFE ROUTE

Inputs:

FROM:
Current location

TO:
Destination

Button:

FIND SAFEST ROUTE

After calculation show:

RECOMMENDED ROUTE

SAFEST

ETA:
18 min

Distance:
5.2 km

Flood exposure:
LOW

Avoided:
3 high-risk roads

Alternative route:

FASTER

ETA:
14 min

Flood exposure:
MODERATE

The default recommendation must prioritize safety.

==================================================
8. ROUTE MAP
==================================================

Map must show:

Current location

Destination

Recommended route

Danger roads

Flooded roads

Shelters

Emergency facilities

Use animated route drawing.

Show:

SAFE ROUTE

as the dominant route.

High-risk roads should appear visually blocked.

==================================================
9. ROUTE SAFETY EXPLANATION
==================================================

When user taps the route:

WHY THIS ROUTE?

✓ Avoids severe flood zones
✓ Avoids predicted road closures
✓ Lowest flood exposure
✓ Shelter available nearby

This builds trust.

==================================================
10. WARNING DURING ROUTE
==================================================

If flood conditions change while navigating:

show a prominent but non-disruptive notification:

ROUTE CONDITIONS CHANGED

Road ahead predicted to become severe in 12 min.

Recalculate safer route?

BUTTON:

RECALCULATE

==================================================
11. SHELTER EXPERIENCE
==================================================

Primary action:

NEAREST SAFE SHELTER

Do NOT simply show nearest shelter.

Show:

SAFE SHELTER

Shelter name

Distance:
2.1 km

ETA:
8 min

Capacity:
68%

Status:
OPEN

Flood risk:
LOW

Medical support:
YES

Food:
YES

Water:
YES

Accessibility:
YES

Button:

NAVIGATE TO SHELTER

==================================================
12. SHELTER COMPARISON
==================================================

Show multiple cards.

Shelter A:
2.1 km
LOW risk
68% capacity

Shelter B:
1.5 km
MODERATE risk
92% capacity

Shelter C:
3.4 km
LOW risk
40% capacity

Recommended:

SHELTER C

Reason:

Lower flood exposure
+ better route safety
+ more available capacity

This demonstrates that HydroGraph is intelligent rather than simply distance-based.

==================================================
13. SHELTER DETAIL
==================================================

Show:

Shelter name

Address

Capacity

Occupancy

Medical support

Food

Water

Power

Accessibility

Current flood risk

Route safety

Last updated

Buttons:

NAVIGATE

CALL SHELTER

SHARE LOCATION

==================================================
14. SOS EXPERIENCE
==================================================

This is the MOST IMPORTANT citizen screen.

Create a very large emergency button:

I AM IN DANGER

The button should be accessible from:
- home
- route
- shelter
- flood warning

Do NOT hide SOS inside a menu.

==================================================
15. SOS CONFIRMATION
==================================================

When pressed:

ARE YOU IN IMMEDIATE DANGER?

Buttons:

YES — SEND SOS

CANCEL

Avoid accidental SOS submissions.

But do not create too many confirmation steps.

==================================================
16. SOS FORM
==================================================

Collect only critical information.

Location:
Automatically detected

People:
1
2
3
4
5+

Children:
Yes / No

Elderly:
Yes / No

Medical emergency:
Yes / No

Water depth:
Optional

Photo:
Optional

Then:

SEND SOS

==================================================
17. SOS SUBMISSION
==================================================

After submission show:

SOS SENT

Incident:
#10284

Priority:

CRITICAL

Location:

Detected

Status:

RESCUE TEAM BEING ASSIGNED

Do not make the citizen wonder whether the request was received.

==================================================
18. SOS LIVE STATUS
==================================================

Show progress:

SOS RECEIVED
✓

LOCATION VERIFIED
✓

RESCUE TEAM ASSIGNED
✓

TEAM EN ROUTE
●

RESCUED
○

CLOSED
○

Show estimated arrival:

11 MIN

==================================================
19. RESCUE TEAM TRACKING
==================================================

Show a map:

Citizen location

Rescue team

Safe route

Flood zones

Show:

TEAM R-04

ETA:
11 min

Status:
EN ROUTE

==================================================
20. OFFLINE SOS
==================================================

If internet unavailable:

show:

NO INTERNET CONNECTION

YOUR SOS IS SAVED

We will automatically retry when connectivity returns.

Do not falsely claim that the SOS has reached authorities.

If SMS fallback is available:

show:

SMS FALLBACK AVAILABLE

SEND VIA SMS

==================================================
21. OFFLINE UX
==================================================

Display an offline indicator globally:

OFFLINE MODE

The interface must still allow:

- view cached safety information
- view saved route
- create SOS
- queue SOS
- view cached shelter information

When connectivity returns:

CONNECTED

SYNCING…

SOS SENT

==================================================
22. EMERGENCY WARNING
==================================================

Create full-screen emergency alert.

Example:

⚠ FLOOD WARNING

YOUR AREA MAY FLOOD

SEVERE FLOODING EXPECTED

IN APPROXIMATELY

27 MIN

Primary:

FIND SAFE ROUTE

Secondary:

FIND SHELTER

Emergency:

I AM IN DANGER

==================================================
23. LOCALIZED ALERTS
==================================================

The alert should be location-aware.

Example:

"Severe flooding is expected near Market Road."

Avoid generic:

"Heavy rain warning."

The entire purpose is actionable information.

==================================================
24. CITIZEN MAP
==================================================

Map layers should be simplified.

Default:

Current location

Flood risk

Safe route

Shelters

Emergency centers

Do not expose drainage pipes, GNN information, hydraulic parameters etc. to normal citizens.

==================================================
25. FAMILY SAFETY
==================================================

Add optional feature:

MY SAFETY

Show:

Current risk

Current location

Selected shelter

Route

SOS status

Emergency contacts

This provides a simple personal safety center.

==================================================
26. SHARE SAFETY STATUS
==================================================

Allow:

SHARE MY STATUS

Example generated message:

"I'm currently at Market Road.
Flood risk: HIGH.
Safe shelter: Central School.
ETA: 12 min.
SOS: Not active."

This should use device share capabilities where available.

==================================================
27. EMERGENCY CONTACTS
==================================================

Provide a simple emergency contacts screen.

Allow user to save:

Family
Police
Fire
Medical
Local emergency authority

Do not hard-code fictional phone numbers.

Use configurable official contacts.

==================================================
28. CITIZEN EXPERIENCE PRINCIPLES
==================================================

At every screen ask:

Can a frightened person understand this immediately?

Can they operate it with one hand?

Can they operate it with poor connectivity?

Can they identify the safest action?

Can they tell whether SOS was actually delivered?

Can they tell whether the shelter is truly safe?

If not, redesign the UI.

==================================================
29. MOBILE UX
==================================================

Support:

360px width and above.

Use:
- bottom navigation
- large buttons
- thumb-friendly controls
- swipeable cards
- bottom sheets
- sticky SOS button

Avoid:
- tiny icons
- hover-only interactions
- desktop-style sidebars

==================================================
30. MICROINTERACTIONS
==================================================

Use subtle animations.

Examples:

Flood risk changing:

LOW → MODERATE → HIGH

Route calculation:

animated route line

SOS:

large confirmation animation

Rescue team:

moving marker

Shelter:

capacity meter

Offline:

connection state transition

Avoid distracting animation during emergencies.

==================================================
31. ACCESSIBILITY
==================================================

Emergency actions must be accessible.

Support:

large tap targets

high contrast

screen readers

text labels

icons + text

reduced motion

voice-friendly labels where possible

Never communicate risk through color alone.

==================================================
32. FRONTEND DATA CONTRACTS
==================================================

Use the existing APIs.

GET /api/v1/forecast/latest

GET /api/v1/flood/{road_id}

POST /api/v1/route

GET /api/v1/shelters/safe

POST /api/v1/sos

GET /api/v1/sos/priority

Do not invent unrelated backend endpoints unless absolutely necessary.

Use mock adapters when backend is unavailable.

==================================================
33. FINAL EXPERIENCE
==================================================

The citizen interface should feel like:

"Google Maps + emergency warning system + intelligent evacuation assistant"

but must be unique to HydroGraph.

The user should never feel:

"I need to understand the technology."

They should feel:

"HydroGraph tells me what is happening and what I should do next."

Core citizen flow:

PREDICT
↓
WARN
↓
CHECK RISK
↓
FIND SAFE ROUTE
↓
FIND SHELTER
↓
SOS IF NECESSARY
↓
RESCUE
↓
SAFETY

END OF DOCUMENT 2.