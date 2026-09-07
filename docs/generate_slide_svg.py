"""
Generate high-resolution, editable vector SVG for SIH 2026 PPT Slide:
'TECHNICAL APPROACH' — HydroGraph Urban Flood Intelligence.
Features clean vector logos and symbols (no cluttered text paragraphs),
matching the friend's reference layout 1:1.
"""
import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" style="background:#ffffff; font-family:'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Arrow Markers -->
    <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#0284c7" />
    </marker>
    <marker id="arr-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#7c3aed" />
    </marker>
    <marker id="arr-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#16a34a" />
    </marker>
    <marker id="arr-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#dc2626" />
    </marker>
    <marker id="arr-orange" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#ea580c" />
    </marker>

    <!-- Drop Shadows -->
    <filter id="card-shadow" x="-3%" y="-3%" width="106%" height="110%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.05"/>
    </filter>
  </defs>

  <!-- BACKGROUND -->
  <rect x="0" y="0" width="1600" height="900" fill="#f8fafc" />

  <!-- ─── HEADER BAR ─── -->
  <rect x="0" y="0" width="1600" height="70" fill="#ffffff" />
  <line x1="0" y1="70" x2="1600" y2="70" stroke="#e2e8f0" stroke-width="2" />

  <!-- Logo (Left) -->
  <g transform="translate(40, 15)">
    <circle cx="20" cy="20" r="19" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
    <path d="M 10 20 Q 15 14, 20 20 T 30 20" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 10 24 Q 15 18, 20 24 T 30 24" fill="none" stroke="#0369a1" stroke-width="2" stroke-linecap="round" />
    <text x="48" y="22" font-size="18" font-weight="800" fill="#0369a1">HYDROGRAPH</text>
    <text x="48" y="34" font-size="9" font-weight="700" fill="#64748b">Urban Flood Intelligence &amp; Command Platform</text>
  </g>

  <!-- Title (Center) -->
  <text x="800" y="44" font-size="22" font-weight="800" fill="#0f172a" letter-spacing="1.5" text-anchor="middle">TECHNICAL APPROACH</text>

  <!-- SIH 2026 Emblem (Right) -->
  <g transform="translate(1420, 14)">
    <circle cx="21" cy="21" r="20" fill="#fff7ed" stroke="#ea580c" stroke-width="1.8" />
    <path d="M 21 12 L 21 28 M 14 18 L 28 18" stroke="#ea580c" stroke-width="2" stroke-linecap="round"/>
    <text x="50" y="18" font-size="11" font-weight="800" fill="#ea580c">SMART INDIA</text>
    <text x="50" y="31" font-size="10" font-weight="800" fill="#16a34a">HACKATHON 2026</text>
  </g>

  <!-- ─── LEFT COLUMN: TECH-STACK (X: 35, Y: 85, W: 270, H: 765) ─── -->
  <g filter="url(#card-shadow)">
    <rect x="35" y="85" width="270" height="765" rx="10" fill="#ffffff" stroke="#bae6fd" stroke-width="1.8" />
    
    <text x="52" y="118" font-size="14" font-weight="800" fill="#0284c7">TECH-STACK</text>
    <line x1="52" y1="128" x2="285" y2="128" stroke="#e0f2fe" stroke-width="2" />

    <!-- FRONTEND -->
    <text x="52" y="152" font-size="10" font-weight="800" fill="#475569">FRONTEND</text>
    
    <!-- HTML5 -->
    <g transform="translate(75, 185)">
      <polygon points="-12,-14 12,-14 9.6,12 0,16 -9.6,12" fill="#e44d26" />
      <polygon points="0,-14 12,-14 9.6,12 0,16" fill="#f16529" />
      <text x="0" y="3" font-size="11" font-weight="900" fill="white" text-anchor="middle">5</text>
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">HTML5</text>
    </g>

    <!-- CSS3 -->
    <g transform="translate(150, 185)">
      <polygon points="-12,-14 12,-14 9.6,12 0,16 -9.6,12" fill="#1572b6" />
      <polygon points="0,-14 12,-14 9.6,12 0,16" fill="#33a9dc" />
      <text x="0" y="3" font-size="11" font-weight="900" fill="white" text-anchor="middle">3</text>
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">CSS3</text>
    </g>

    <!-- JS -->
    <g transform="translate(225, 185)">
      <rect x="-13" y="-14" width="26" height="26" rx="3" fill="#f7df1e" />
      <text x="3" y="5" font-size="11" font-weight="800" fill="#000000" text-anchor="middle">JS</text>
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">JavaScript</text>
    </g>

    <!-- React 19 -->
    <g transform="translate(75, 255)">
      <circle cx="0" cy="0" r="3.5" fill="#00d8ff" />
      <ellipse cx="0" cy="0" rx="14" ry="5.5" fill="none" stroke="#00d8ff" stroke-width="1.3" />
      <ellipse cx="0" cy="0" rx="14" ry="5.5" transform="rotate(60)" fill="none" stroke="#00d8ff" stroke-width="1.3" />
      <ellipse cx="0" cy="0" rx="14" ry="5.5" transform="rotate(120)" fill="none" stroke="#00d8ff" stroke-width="1.3" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">React 19</text>
    </g>

    <!-- Tailwind -->
    <g transform="translate(150, 255)">
      <path d="M -12 -2 Q -6 -8, 0 -2 T 12 -2" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
      <path d="M -12 4 Q -6 -2, 0 4 T 12 4" fill="none" stroke="#0ea5e9" stroke-width="2.5" stroke-linecap="round" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">Tailwind</text>
    </g>

    <!-- Leaflet -->
    <g transform="translate(225, 255)">
      <path d="M 0 -12 Q 10 -4, 8 6 Q 0 14, 0 14 Q 0 14, -8 6 Q -10 -4, 0 -12" fill="#199900" stroke="#0f6600" stroke-width="1"/>
      <line x1="0" y1="-12" x2="0" y2="10" stroke="#ffffff" stroke-width="1.2" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">Leaflet GIS</text>
    </g>

    <line x1="52" y1="295" x2="285" y2="295" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- BACKEND & DATABASE -->
    <text x="52" y="320" font-size="10" font-weight="800" fill="#475569">BACKEND &amp; DATABASE</text>

    <!-- FastAPI -->
    <g transform="translate(80, 355)">
      <circle cx="0" cy="0" r="14" fill="#009688" />
      <polygon points="1,-9 -6,1 0,1 -1,9 6,-1 0,-1" fill="white" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">FastAPI</text>
    </g>

    <!-- Python -->
    <g transform="translate(150, 355)">
      <circle cx="-4" cy="-4" r="7" fill="#3572a5" />
      <circle cx="4" cy="4" r="7" fill="#ffd43b" />
      <circle cx="-5" cy="-5" r="1.5" fill="white" />
      <circle cx="5" cy="5" r="1.5" fill="white" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">Python</text>
    </g>

    <!-- SQLite -->
    <g transform="translate(220, 355)">
      <ellipse cx="0" cy="-6" rx="12" ry="4" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
      <ellipse cx="0" cy="0" rx="12" ry="4" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
      <ellipse cx="0" cy="6" rx="12" ry="4" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">SQLite</text>
    </g>

    <!-- PostGIS -->
    <g transform="translate(110, 425)">
      <circle cx="0" cy="0" r="13" fill="#336791" stroke="#1d3c55" stroke-width="1"/>
      <ellipse cx="0" cy="0" rx="13" ry="5" fill="none" stroke="white" stroke-width="1"/>
      <line x1="0" y1="-13" x2="0" y2="13" stroke="white" stroke-width="1"/>
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">PostGIS</text>
    </g>

    <!-- Docker -->
    <g transform="translate(190, 425)">
      <circle cx="0" cy="0" r="13" fill="#2496ed" />
      <rect x="-7" y="-5" width="4" height="4" fill="white" />
      <rect x="-2" y="-5" width="4" height="4" fill="white" />
      <rect x="3" y="-5" width="4" height="4" fill="white" />
      <rect x="-7" y="0" width="4" height="4" fill="white" />
      <rect x="-2" y="0" width="4" height="4" fill="white" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">Docker</text>
    </g>

    <line x1="52" y1="465" x2="285" y2="465" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- AI & SIMULATION -->
    <text x="52" y="490" font-size="10" font-weight="800" fill="#475569">AI &amp; HYDRODYNAMIC</text>

    <!-- PySTEPS -->
    <g transform="translate(80, 525)">
      <path d="M -8 6 A 10 10 0 0 1 8 -6" fill="none" stroke="#7c3aed" stroke-width="2.5" />
      <line x1="-8" y1="6" x2="0" y2="0" stroke="#7c3aed" stroke-width="2" />
      <path d="M 4 -2 A 6 6 0 0 1 10 -8" fill="none" stroke="#7c3aed" stroke-width="1.5" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">PySTEPS</text>
    </g>

    <!-- SWMM -->
    <g transform="translate(150, 525)">
      <circle cx="0" cy="0" r="12" fill="none" stroke="#4c1d95" stroke-width="2.5"/>
      <path d="M -11 3 A 11 11 0 0 0 11 3 Z" fill="#0284c7" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">SWMM</text>
    </g>

    <!-- LISFLOOD -->
    <g transform="translate(220, 525)">
      <path d="M -12 2 Q -6 -6, 0 2 T 12 2" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" />
      <rect x="-10" y="6" width="6" height="5" fill="#d1d5db" />
      <rect x="-2" y="6" width="6" height="5" fill="#d1d5db" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">LISFLOOD</text>
    </g>

    <!-- OSRM -->
    <g transform="translate(110, 595)">
      <circle cx="0" cy="0" r="13" fill="#16a34a" />
      <polyline points="-5,-4 0,-9 5,-4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <line x1="0" y1="-9" x2="0" y2="7" stroke="white" stroke-width="2" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">OSRM</text>
    </g>

    <!-- Analytics -->
    <g transform="translate(190, 595)">
      <rect x="-9" y="-2" width="5" height="12" fill="#8884d8" />
      <rect x="-2" y="-7" width="5" height="17" fill="#82ca9d" />
      <rect x="5" y="-4" width="5" height="14" fill="#ffc658" />
      <text x="0" y="25" font-size="9" font-weight="700" fill="#1e293b" text-anchor="middle">Analytics</text>
    </g>

    <!-- GitHub link -->
    <line x1="52" y1="760" x2="285" y2="760" stroke="#cbd5e1" stroke-dasharray="4,4" />
    <text x="52" y="785" font-size="9.5" font-weight="800" fill="#475569">GitHub Repository:</text>
    <text x="52" y="805" font-size="8" font-family="monospace" font-weight="700" fill="#0284c7" text-decoration="underline">github.com/vinayvalurouthu/</text>
    <text x="52" y="818" font-size="8" font-family="monospace" font-weight="700" fill="#0284c7" text-decoration="underline">HYDROGRAPH-FLOOD-INTELLIGENCE</text>
  </g>

  <!-- ─── MAIN DIAGRAM CANVAS ─── -->

  <!-- ═════ LAYER 1: TOP ROW (USERS -> PLATFORM + AI LAYER) ═════ -->

  <!-- 1.1 USERS BOX (X: 325, Y: 85, W: 195, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="325" y="85" width="195" height="140" rx="9" fill="#0284c7" stroke="#0369a1" stroke-width="1.8" />
    <text x="422" y="112" font-size="12" font-weight="800" fill="#ffffff" text-anchor="middle">USERS</text>
    <line x1="345" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.3)" stroke-width="1" />

    <!-- User 1: SDMA -->
    <g transform="translate(355, 142)">
      <polygon points="-8,-2 8,-2 0,-9" fill="white"/>
      <line x1="-6" y1="-2" x2="-6" y2="6" stroke="white" stroke-width="2"/>
      <line x1="0" y1="-2" x2="0" y2="6" stroke="white" stroke-width="2"/>
      <line x1="6" y1="-2" x2="6" y2="6" stroke="white" stroke-width="2"/>
      <line x1="-8" y1="6" x2="8" y2="6" stroke="white" stroke-width="2"/>
      <text x="16" y="3" font-size="10.5" font-weight="700" fill="white">Municipal SDMA</text>
    </g>

    <!-- User 2: Responders -->
    <g transform="translate(355, 172)">
      <polygon points="-7,-7 7,-7 6,2 0,8 -6,2" fill="white"/>
      <line x1="0" y1="-4" x2="0" y2="4" stroke="#0284c7" stroke-width="2"/>
      <line x1="-4" y1="0" x2="4" y2="0" stroke="#0284c7" stroke-width="2"/>
      <text x="16" y="3" font-size="10.5" font-weight="700" fill="white">First Responders</text>
    </g>

    <!-- User 3: Citizens -->
    <g transform="translate(355, 202)">
      <circle cx="0" cy="-3" r="4" fill="white"/>
      <ellipse cx="0" cy="5" rx="8" ry="4" fill="white"/>
      <circle cx="-6" cy="-1" r="3" fill="rgba(255,255,255,0.7)"/>
      <circle cx="6" cy="-1" r="3" fill="rgba(255,255,255,0.7)"/>
      <text x="16" y="3" font-size="10.5" font-weight="700" fill="white">Vulnerable Citizens</text>
    </g>
  </g>

  <!-- Arrow: Users -> Platform (Blue) -->
  <line x1="520" y1="155" x2="545" y2="155" stroke="#0284c7" stroke-width="3" marker-end="url(#arr-blue)" />

  <!-- 1.2 PLATFORM BOX (X: 550, Y: 85, W: 665, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="550" y="85" width="665" height="140" rx="9" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    <rect x="560" y="93" width="645" height="26" rx="5" fill="#0284c7" />
    <text x="882" y="111" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="0.8" text-anchor="middle">HYDROGRAPH COMMAND &amp; DECISION PLATFORM</text>

    <!-- Capsule 1: Flood Map -->
    <g transform="translate(562, 128)">
      <rect x="0" y="0" width="118" height="86" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(59, 36)">
        <polygon points="-16,-12 -6,-8 -6,12 -16,8" fill="#93c5fd" stroke="#0284c7" stroke-width="1"/>
        <polygon points="-6,-8 6,-12 6,8 -6,12" fill="#60a5fa" stroke="#0284c7" stroke-width="1"/>
        <polygon points="6,-12 16,-8 16,12 6,8" fill="#3b82f6" stroke="#0284c7" stroke-width="1"/>
      </g>
      <text x="59" y="70" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Flood Map</text>
    </g>

    <!-- Capsule 2: Hotspots -->
    <g transform="translate(692, 128)">
      <rect x="0" y="0" width="118" height="86" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(59, 36)">
        <path d="M 0 12 L 7 2 A 9 9 0 0 0 -7 2 Z" fill="#0284c7" />
        <circle cx="0" cy="-3" r="8" fill="#0284c7" />
        <circle cx="0" cy="-3" r="3.5" fill="white" />
      </g>
      <text x="59" y="70" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Hotspots</text>
    </g>

    <!-- Capsule 3: Safe Route -->
    <g transform="translate(822, 128)">
      <rect x="0" y="0" width="118" height="86" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(59, 36)">
        <path d="M -12 8 L 0 8 L 0 -8" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
        <polyline points="-6,-4 0,-12 6,-4" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="59" y="70" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Safe Route</text>
    </g>

    <!-- Capsule 4: Smart Shelter -->
    <g transform="translate(952, 128)">
      <rect x="0" y="0" width="118" height="86" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(59, 36)">
        <polygon points="-12,-3 12,-3 0,-13" fill="#0284c7" />
        <rect x="-10" y="-3" width="20" height="15" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#dc2626" stroke-width="2.5" />
        <line x1="-4" y1="4" x2="4" y2="4" stroke="#dc2626" stroke-width="2.5" />
      </g>
      <text x="59" y="70" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Smart Shelter</text>
    </g>

    <!-- Capsule 5: Citizen SOS -->
    <g transform="translate(1082, 128)">
      <rect x="0" y="0" width="121" height="86" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(60, 36)">
        <circle cx="0" cy="0" r="14" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
        <text x="0" y="4" font-size="9" font-weight="900" fill="white" text-anchor="middle">SOS</text>
        <path d="M -14 -14 A 20 20 0 0 1 14 -14" fill="none" stroke="#dc2626" stroke-width="1.8" stroke-linecap="round"/>
      </g>
      <text x="60" y="70" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Citizen SOS</text>
    </g>
  </g>

  <!-- 1.3 AI LAYER BOX (X: 1240, Y: 85, W: 325, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="1240" y="85" width="325" height="140" rx="9" fill="#ffffff" stroke="#16a34a" stroke-width="1.8" />
    <rect x="1250" y="93" width="305" height="26" rx="5" fill="#16a34a" />
    <text x="1402" y="111" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="0.8" text-anchor="middle">AI &amp; INTELLIGENCE LAYER</text>

    <!-- 5 Clean Bullets (No verbose sentences) -->
    <circle cx="1265" cy="138" r="4" fill="#16a34a" />
    <text x="1278" y="142" font-size="10" font-weight="700" fill="#14532d">PySTEPS Radar Nowcasting</text>

    <circle cx="1265" cy="158" r="4" fill="#16a34a" />
    <text x="1278" y="162" font-size="10" font-weight="700" fill="#14532d">ST-GNN Inundation Surrogate</text>

    <circle cx="1265" cy="178" r="4" fill="#16a34a" />
    <text x="1278" y="182" font-size="10" font-weight="700" fill="#14532d">Drainage Anomaly Residuals</text>

    <circle cx="1265" cy="198" r="4" fill="#16a34a" />
    <text x="1278" y="202" font-size="10" font-weight="700" fill="#14532d">Multi-Sensor Confidence Score</text>

    <circle cx="1265" cy="218" r="4" fill="#16a34a" />
    <text x="1278" y="222" font-size="10" font-weight="700" fill="#14532d">Real-Time Impact &amp; Loss Calc</text>
  </g>

  <!-- Arrow: Platform <-> AI (Green) -->
  <line x1="1215" y1="155" x2="1235" y2="155" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arr-green)" />

  <!-- Arrow: Platform -> Execution Engine (Purple) -->
  <line x1="882" y1="225" x2="882" y2="250" stroke="#7c3aed" stroke-width="3" marker-end="url(#arr-purple)" />

  <!-- ═════ LAYER 2: PHYSICS & SIMULATION ENGINE (PURPLE) ═════ -->
  <!-- (X: 325, Y: 255, W: 1240, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="325" y="255" width="1240" height="140" rx="9" fill="#ffffff" stroke="#7c3aed" stroke-width="1.8" />
    <rect x="335" y="263" width="1220" height="26" rx="5" fill="#7c3aed" />
    <text x="945" y="281" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">PHYSICS &amp; HYDRODYNAMIC EXECUTION ENGINE</text>

    <!-- Mod 1: PySTEPS -->
    <g transform="translate(345, 298)">
      <rect x="0" y="0" width="228" height="86" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
      <g transform="translate(114, 32)">
        <path d="M -12 10 A 16 16 0 0 1 12 -10" fill="none" stroke="#4c1d95" stroke-width="3" />
        <line x1="-12" y1="10" x2="0" y2="0" stroke="#4c1d95" stroke-width="2.5" />
        <line x1="-18" y1="18" x2="-8" y2="18" stroke="#4c1d95" stroke-width="3" />
        <path d="M 6 -4 A 8 8 0 0 1 14 -12" fill="none" stroke="#7c3aed" stroke-width="2" />
      </g>
      <text x="114" y="68" font-size="12" font-weight="800" fill="#4c1d95" text-anchor="middle">PySTEPS</text>
    </g>

    <!-- Mod 2: EPA SWMM -->
    <g transform="translate(595, 298)">
      <rect x="0" y="0" width="228" height="86" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
      <g transform="translate(114, 32)">
        <circle cx="0" cy="0" r="16" fill="none" stroke="#4c1d95" stroke-width="3.2"/>
        <path d="M -15 4 A 15 15 0 0 0 15 4 Z" fill="#0284c7" />
        <line x1="-15" y1="4" x2="15" y2="4" stroke="#0369a1" stroke-width="2"/>
      </g>
      <text x="114" y="68" font-size="12" font-weight="800" fill="#4c1d95" text-anchor="middle">EPA SWMM</text>
    </g>

    <!-- Mod 3: LISFLOOD-FP -->
    <g transform="translate(845, 298)">
      <rect x="0" y="0" width="228" height="86" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
      <g transform="translate(114, 32)">
        <rect x="-16" y="6" width="9" height="7" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
        <rect x="-4" y="6" width="9" height="7" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
        <rect x="8" y="6" width="9" height="7" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
        <path d="M -18 0 Q -9 -8, 0 0 T 18 0" fill="none" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round" />
      </g>
      <text x="114" y="68" font-size="12" font-weight="800" fill="#4c1d95" text-anchor="middle">LISFLOOD-FP</text>
    </g>

    <!-- Mod 4: Coupled 1D/2D -->
    <g transform="translate(1095, 298)">
      <rect x="0" y="0" width="228" height="86" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
      <g transform="translate(114, 32)">
        <line x1="-20" y1="-12" x2="20" y2="-12" stroke="#4c1d95" stroke-width="2.5"/>
        <line x1="-20" y1="12" x2="20" y2="12" stroke="#475569" stroke-width="2.5"/>
        <line x1="-4" y1="8" x2="-4" y2="-8" stroke="#7c3aed" stroke-width="2.5" marker-end="url(#arr-purple)"/>
        <line x1="4" y1="-8" x2="4" y2="8" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arr-blue)"/>
      </g>
      <text x="114" y="68" font-size="12" font-weight="800" fill="#4c1d95" text-anchor="middle">Coupled 1D/2D</text>
    </g>

    <!-- Mod 5: CWC Boundary -->
    <g transform="translate(1345, 298)">
      <rect x="0" y="0" width="208" height="86" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
      <g transform="translate(104, 32)">
        <polygon points="-16,12 -4,-12 4,-12 16,12" fill="#4c1d95" />
        <rect x="-24" y="0" width="9" height="12" fill="#0284c7" />
        <path d="M 4 -4 L 16 12" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
      </g>
      <text x="104" y="68" font-size="12" font-weight="800" fill="#4c1d95" text-anchor="middle">CWC Boundary</text>
    </g>
  </g>

  <!-- Arrow: Execution Engine -> Visualization (Orange) -->
  <line x1="770" y1="395" x2="770" y2="420" stroke="#ea580c" stroke-width="3" marker-end="url(#arr-orange)" />

  <!-- ═════ LAYER 3: MIDDLE ROW (VISUALIZATION + DATA MANAGEMENT) ═════ -->

  <!-- 3.1 VISUALIZATION & RESULTS (ORANGE) (X: 325, Y: 425, W: 890, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="325" y="425" width="890" height="140" rx="9" fill="#ffffff" stroke="#ea580c" stroke-width="1.8" />
    <rect x="335" y="433" width="870" height="26" rx="5" fill="#ea580c" />
    <text x="770" y="451" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">VISUALIZATION &amp; OPERATIONAL INTELLIGENCE</text>

    <!-- Card 1: Depth Contours -->
    <g transform="translate(341, 468)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#fff7ed" stroke="#ffedd5" stroke-width="1.2" />
      <g transform="translate(82, 32)">
        <ellipse cx="0" cy="0" rx="20" ry="13" fill="#fed7aa" stroke="#ea580c" stroke-width="1"/>
        <ellipse cx="0" cy="0" rx="14" ry="9" fill="#fb923c" stroke="#ea580c" stroke-width="1"/>
        <ellipse cx="0" cy="0" rx="8" ry="5" fill="#ea580c" />
        <text x="0" y="3" font-size="7" font-weight="800" fill="white" text-anchor="middle">35cm</text>
      </g>
      <text x="82" y="68" font-size="11" font-weight="800" fill="#9a3412" text-anchor="middle">Depth Contours</text>
    </g>

    <!-- Card 2: Hotspot Matrix -->
    <g transform="translate(517, 468)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#fff7ed" stroke="#ffedd5" stroke-width="1.2" />
      <g transform="translate(82, 32)">
        <polygon points="0,-14 15,12 -15,12" fill="#fbbf24" stroke="#ea580c" stroke-width="1.8"/>
        <text x="0" y="8" font-size="15" font-weight="900" fill="#9a3412" text-anchor="middle">!</text>
      </g>
      <text x="82" y="68" font-size="11" font-weight="800" fill="#9a3412" text-anchor="middle">Hotspot Matrix</text>
    </g>

    <!-- Card 3: Safe Evacuation -->
    <g transform="translate(693, 468)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#fff7ed" stroke="#ffedd5" stroke-width="1.2" />
      <g transform="translate(82, 32)">
        <path d="M -14 10 L 0 -4 L 14 -10" fill="none" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="-14" cy="10" r="4" fill="#0284c7" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="-10" r="4" fill="#14532d" stroke="white" stroke-width="1.5"/>
      </g>
      <text x="82" y="68" font-size="11" font-weight="800" fill="#9a3412" text-anchor="middle">Safe Evacuation</text>
    </g>

    <!-- Card 4: Drain Surcharge -->
    <g transform="translate(869, 468)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#fff7ed" stroke="#ffedd5" stroke-width="1.2" />
      <g transform="translate(82, 32)">
        <line x1="-16" y1="8" x2="16" y2="8" stroke="#9a3412" stroke-width="3.5"/>
        <line x1="0" y1="8" x2="0" y2="-10" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arr-blue)"/>
        <line x1="-5" y1="0" x2="0" y2="-10" stroke="#0284c7" stroke-width="2"/>
        <line x1="5" y1="0" x2="0" y2="-10" stroke="#0284c7" stroke-width="2"/>
      </g>
      <text x="82" y="68" font-size="11" font-weight="800" fill="#9a3412" text-anchor="middle">Drain Surcharge</text>
    </g>

    <!-- Card 5: Scenario Sandbox -->
    <g transform="translate(1045, 468)">
      <rect x="0" y="0" width="160" height="86" rx="7" fill="#fff7ed" stroke="#ffedd5" stroke-width="1.2" />
      <g transform="translate(80, 32)">
        <line x1="-16" y1="-5" x2="16" y2="-5" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <circle cx="-5" cy="-5" r="4.5" fill="#ea580c" stroke="white" stroke-width="1.5"/>
        <line x1="-16" y1="5" x2="16" y2="5" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
        <circle cx="7" cy="5" r="4.5" fill="#ea580c" stroke="white" stroke-width="1.5"/>
      </g>
      <text x="80" y="68" font-size="11" font-weight="800" fill="#9a3412" text-anchor="middle">Scenario Sandbox</text>
    </g>
  </g>

  <!-- 3.2 DATA MANAGEMENT (RED) (X: 1240, Y: 425, W: 325, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="1240" y="425" width="325" height="140" rx="9" fill="#ffffff" stroke="#dc2626" stroke-width="1.8" />
    <rect x="1250" y="433" width="305" height="26" rx="5" fill="#dc2626" />
    <text x="1402" y="451" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="0.8" text-anchor="middle">OPERATIONAL DATA MANAGEMENT</text>

    <!-- 5 Clean Bullets -->
    <circle cx="1265" cy="478" r="4" fill="#dc2626" />
    <text x="1278" y="482" font-size="10" font-weight="700" fill="#991b1b">IMD Doppler Radar (DWR)</text>

    <circle cx="1265" cy="498" r="4" fill="#dc2626" />
    <text x="1278" y="502" font-size="10" font-weight="700" fill="#991b1b">CWC River &amp; Dam Gauges</text>

    <circle cx="1265" cy="518" r="4" fill="#dc2626" />
    <text x="1278" y="522" font-size="10" font-weight="700" fill="#991b1b">OpenStreetMap &amp; DEM Topology</text>

    <circle cx="1265" cy="538" r="4" fill="#dc2626" />
    <text x="1278" y="542" font-size="10" font-weight="700" fill="#991b1b">Citizen SOS Offline Queue</text>

    <circle cx="1265" cy="558" r="4" fill="#dc2626" />
    <text x="1278" y="562" font-size="10" font-weight="700" fill="#991b1b">Historical Flood Replay DB</text>
  </g>

  <!-- Arrow: Data Management -> Execution Engine (Red) -->
  <line x1="1240" y1="495" x2="1225" y2="495" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arr-red)" />

  <!-- Arrow: Visualization -> Infrastructure (Navy) -->
  <line x1="770" y1="565" x2="770" y2="590" stroke="#0284c7" stroke-width="3" marker-end="url(#arr-blue)" />

  <!-- ═════ LAYER 4: BOTTOM ROW (INFRASTRUCTURE + LEGEND) ═════ -->

  <!-- 4.1 INFRASTRUCTURE & SCALABILITY (X: 325, Y: 595, W: 890, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="325" y="595" width="890" height="140" rx="9" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    <rect x="335" y="603" width="870" height="26" rx="5" fill="#0284c7" />
    <text x="770" y="621" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">INFRASTRUCTURE &amp; SCALABLE ARCHITECTURE</text>

    <!-- Card 1: React 19 -->
    <g transform="translate(341, 638)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#f8fafc" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(82, 30)">
        <circle cx="0" cy="0" r="4" fill="#00d8ff" />
        <ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="#00d8ff" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="16" ry="6" transform="rotate(60)" fill="none" stroke="#00d8ff" stroke-width="1.5" />
        <ellipse cx="0" cy="0" rx="16" ry="6" transform="rotate(120)" fill="none" stroke="#00d8ff" stroke-width="1.5" />
      </g>
      <text x="82" y="68" font-size="11.5" font-weight="800" fill="#0f172a" text-anchor="middle">React 19</text>
    </g>

    <!-- Card 2: FastAPI -->
    <g transform="translate(517, 638)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#f8fafc" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(82, 30)">
        <circle cx="0" cy="0" r="15" fill="#009688" />
        <polygon points="1,-10 -7,1 0,1 -1,10 7,-1 0,-1" fill="white" />
      </g>
      <text x="82" y="68" font-size="11.5" font-weight="800" fill="#0f172a" text-anchor="middle">FastAPI</text>
    </g>

    <!-- Card 3: SQLite / PostGIS -->
    <g transform="translate(693, 638)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#f8fafc" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(82, 30)">
        <ellipse cx="0" cy="-6" rx="14" ry="4.5" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
        <ellipse cx="0" cy="0" rx="14" ry="4.5" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
        <ellipse cx="0" cy="6" rx="14" ry="4.5" fill="#0284c7" stroke="#003b57" stroke-width="1"/>
      </g>
      <text x="82" y="68" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">SQLite / PostGIS</text>
    </g>

    <!-- Card 4: OSRM Engine -->
    <g transform="translate(869, 638)">
      <rect x="0" y="0" width="164" height="86" rx="7" fill="#f8fafc" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(82, 30)">
        <circle cx="0" cy="0" r="15" fill="#16a34a" />
        <polyline points="-6,-4 0,-10 6,-4" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="0" y1="-10" x2="0" y2="8" stroke="white" stroke-width="2.5" />
      </g>
      <text x="82" y="68" font-size="11.5" font-weight="800" fill="#0f172a" text-anchor="middle">OSRM Engine</text>
    </g>

    <!-- Card 5: Deployment -->
    <g transform="translate(1045, 638)">
      <rect x="0" y="0" width="160" height="86" rx="7" fill="#f8fafc" stroke="#bae6fd" stroke-width="1.2" />
      <g transform="translate(80, 30)">
        <rect x="-10" y="-8" width="6" height="6" rx="1" fill="#2496ed" />
        <rect x="-2" y="-8" width="6" height="6" rx="1" fill="#2496ed" />
        <rect x="6" y="-8" width="6" height="6" rx="1" fill="#2496ed" />
        <rect x="-10" y="0" width="6" height="6" rx="1" fill="#2496ed" />
        <rect x="-2" y="0" width="6" height="6" rx="1" fill="#2496ed" />
        <rect x="6" y="0" width="6" height="6" rx="1" fill="#2496ed" />
      </g>
      <text x="80" y="68" font-size="11.5" font-weight="800" fill="#0f172a" text-anchor="middle">Deployment</text>
    </g>
  </g>

  <!-- 4.2 LEGEND BOX (X: 1240, Y: 595, W: 325, H: 140) -->
  <g filter="url(#card-shadow)">
    <rect x="1240" y="595" width="325" height="140" rx="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="1255" y="618" font-size="10" font-weight="800" fill="#64748b" letter-spacing="0.8">SYSTEM FLOW LEGEND</text>

    <!-- Legend 1 -->
    <line x1="1255" y1="638" x2="1295" y2="638" stroke="#0284c7" stroke-width="3" marker-end="url(#arr-blue)" />
    <text x="1308" y="642" font-size="10" font-weight="700" fill="#1e293b">User Action &amp; Interactive Flow</text>

    <!-- Legend 2 -->
    <line x1="1255" y1="660" x2="1295" y2="660" stroke="#7c3aed" stroke-width="3" marker-end="url(#arr-purple)" />
    <text x="1308" y="664" font-size="10" font-weight="700" fill="#1e293b">Hydrodynamic Simulation Pipeline</text>

    <!-- Legend 3 -->
    <line x1="1255" y1="682" x2="1295" y2="682" stroke="#16a34a" stroke-width="3" marker-end="url(#arr-green)" />
    <text x="1308" y="686" font-size="10" font-weight="700" fill="#1e293b">AI Inference &amp; Anomaly Engine</text>

    <!-- Legend 4 -->
    <line x1="1255" y1="704" x2="1295" y2="704" stroke="#dc2626" stroke-width="3" marker-end="url(#arr-red)" />
    <text x="1308" y="708" font-size="10" font-weight="700" fill="#1e293b">Multi-Source Sensor Ingestion</text>

    <!-- Legend 5 -->
    <line x1="1255" y1="724" x2="1295" y2="724" stroke="#059669" stroke-width="2.5" stroke-dasharray="4,4" />
    <text x="1308" y="727" font-size="9.5" font-weight="700" fill="#047857">Real-Time Residual Feedback Loop</text>
  </g>

  <!-- ─── FOOTER BAR ─── -->
  <rect x="0" y="865" width="1600" height="35" fill="#0284c7" />
  <text x="40" y="887" font-size="11" font-weight="700" fill="#ffffff" letter-spacing="0.5">Team HydroGraph  |  Smart India Hackathon 2026  |  Problem Domain: Urban Flood Nowcasting &amp; Emergency Command</text>
  
  <rect x="1510" y="871" width="60" height="22" rx="4" fill="rgba(255,255,255,0.2)" />
  <text x="1540" y="886" font-size="11" font-weight="800" fill="#ffffff" text-anchor="middle" font-family="'JetBrains Mono', monospace">Slide 3</text>

</svg>
"""

out_path = os.path.join(os.path.dirname(__file__), "technical_approach_slide.svg")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(svg_content.strip())

print(f"Updated vector SVG: {out_path}")
