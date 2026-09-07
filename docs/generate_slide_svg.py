"""
Generate high-resolution, editable vector SVG for SIH 2026 PPT Slide:
'TECHNICAL APPROACH' — HydroGraph Urban Flood Intelligence.
Compatible with PowerPoint, Canva, and Illustrator.
"""
import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" style="background:#ffffff; font-family:'Segoe UI', -apple-system, Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="gradUsers" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="gradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6d28d9" />
      <stop offset="100%" stop-color="#7c3aed" />
    </linearGradient>
    <linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c2410c" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <linearGradient id="gradNavy" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <!-- Arrow Markers -->
    <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#0284c7" />
    </marker>
    <marker id="arrow-purple" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#7c3aed" />
    </marker>
    <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#16a34a" />
    </marker>
    <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
      <path d="M 0 1 L 6 4 L 0 7 z" fill="#dc2626" />
    </marker>

    <!-- Drop Shadows -->
    <filter id="shadow-card" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- BACKGROUND -->
  <rect x="0" y="0" width="1600" height="900" fill="#f8fafc" />

  <!-- ─── HEADER BAR ─── -->
  <rect x="0" y="0" width="1600" height="70" fill="#ffffff" />
  <line x1="0" y1="70" x2="1600" y2="70" stroke="#e2e8f0" stroke-width="2" />

  <!-- Logo (Left) -->
  <g transform="translate(40, 18)">
    <circle cx="17" cy="17" r="17" fill="#e0f2fe" />
    <path d="M 7 17 Q 12 11, 17 17 T 27 17" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 7 21 Q 12 15, 17 21 T 27 21" fill="none" stroke="#0369a1" stroke-width="2" stroke-linecap="round" />
    <text x="42" y="24" font-size="20" font-weight="800" fill="#0369a1" letter-spacing="-0.5">HYDROGRAPH</text>
  </g>

  <!-- Title (Center) -->
  <text x="800" y="44" font-size="22" font-weight="800" fill="#1e293b" letter-spacing="2" text-anchor="middle">TECHNICAL APPROACH</text>

  <!-- SIH 2026 Emblem (Right) -->
  <g transform="translate(1420, 14)">
    <circle cx="21" cy="21" r="20" fill="#fff7ed" stroke="#ea580c" stroke-width="1.8" />
    <text x="21" y="27" font-size="18" text-anchor="middle">💡</text>
    <text x="50" y="18" font-size="11" font-weight="800" fill="#ea580c" letter-spacing="0.5">SMART INDIA</text>
    <text x="50" y="31" font-size="10" font-weight="800" fill="#16a34a" letter-spacing="0.5">HACKATHON 2026</text>
  </g>

  <!-- ─── LEFT COLUMN: TECH-STACK (X: 35, Y: 90, W: 275, H: 755) ─── -->
  <g filter="url(#shadow-card)">
    <rect x="35" y="90" width="275" height="755" rx="10" fill="#ffffff" stroke="#bae6fd" stroke-width="1.8" />
    
    <!-- Title -->
    <text x="52" y="125" font-size="15" font-weight="800" fill="#0284c7" letter-spacing="1.2">⚡ TECH-STACK</text>
    <line x1="52" y1="135" x2="290" y2="135" stroke="#e0f2fe" stroke-width="2" />

    <!-- 1. Frontend -->
    <text x="52" y="160" font-size="11" font-weight="800" fill="#475569" letter-spacing="0.8">FRONTEND</text>
    
    <!-- Chips Grid -->
    <!-- Row 1 -->
    <rect x="52" y="172" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="186" r="4" fill="#e34c26" />
    <text x="74" y="190" font-size="10.5" font-weight="700" fill="#1e293b">HTML5 / CSS</text>

    <rect x="170" y="172" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="186" r="4" fill="#f7df1e" />
    <text x="192" y="190" font-size="10.5" font-weight="700" fill="#1e293b">JavaScript</text>

    <!-- Row 2 -->
    <rect x="52" y="206" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="220" r="4" fill="#61dafb" />
    <text x="74" y="224" font-size="10.5" font-weight="700" fill="#1e293b">React 19</text>

    <rect x="170" y="206" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="220" r="4" fill="#38bdf8" />
    <text x="192" y="224" font-size="10.5" font-weight="700" fill="#1e293b">Tailwind v4</text>

    <!-- Row 3 -->
    <rect x="52" y="240" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="254" r="4" fill="#199900" />
    <text x="74" y="258" font-size="10.5" font-weight="700" fill="#1e293b">Leaflet GIS</text>

    <rect x="170" y="240" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="254" r="4" fill="#8884d8" />
    <text x="192" y="258" font-size="10.5" font-weight="700" fill="#1e293b">Recharts</text>

    <!-- Divider -->
    <line x1="52" y1="282" x2="290" y2="282" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- 2. Backend & Database -->
    <text x="52" y="306" font-size="11" font-weight="800" fill="#475569" letter-spacing="0.8">BACKEND &amp; DATABASE</text>

    <!-- Row 1 -->
    <rect x="52" y="318" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="332" r="4" fill="#009688" />
    <text x="74" y="336" font-size="10.5" font-weight="700" fill="#1e293b">FastAPI</text>

    <rect x="170" y="318" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="332" r="4" fill="#3572A5" />
    <text x="192" y="336" font-size="10.5" font-weight="700" fill="#1e293b">Python 3.12</text>

    <!-- Row 2 -->
    <rect x="52" y="352" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="366" r="4" fill="#003b57" />
    <text x="74" y="370" font-size="10.5" font-weight="700" fill="#1e293b">SQLite DB</text>

    <rect x="170" y="352" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="366" r="4" fill="#336791" />
    <text x="192" y="370" font-size="10.5" font-weight="700" fill="#1e293b">PostGIS / GIS</text>

    <!-- Row 3 -->
    <rect x="52" y="386" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="400" r="4" fill="#e10098" />
    <text x="74" y="404" font-size="10.5" font-weight="700" fill="#1e293b">Pydantic v2</text>

    <rect x="170" y="386" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="400" r="4" fill="#d71f00" />
    <text x="192" y="404" font-size="10.5" font-weight="700" fill="#1e293b">SQLAlchemy</text>

    <!-- Divider -->
    <line x1="52" y1="428" x2="290" y2="428" stroke="#f1f5f9" stroke-width="1.5" />

    <!-- 3. AI & Hydrodynamic -->
    <text x="52" y="452" font-size="11" font-weight="800" fill="#475569" letter-spacing="0.8">AI &amp; HYDRODYNAMIC</text>

    <!-- Row 1 -->
    <rect x="52" y="464" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="478" r="4" fill="#0284c7" />
    <text x="74" y="482" font-size="10.5" font-weight="700" fill="#1e293b">PySTEPS</text>

    <rect x="170" y="464" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="478" r="4" fill="#ea580c" />
    <text x="192" y="482" font-size="10.5" font-weight="700" fill="#1e293b">EPA SWMM</text>

    <!-- Row 2 -->
    <rect x="52" y="498" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="512" r="4" fill="#dc2626" />
    <text x="74" y="516" font-size="10.5" font-weight="700" fill="#1e293b">LISFLOOD-FP</text>

    <rect x="170" y="498" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="512" r="4" fill="#ee4c2c" />
    <text x="192" y="516" font-size="10.5" font-weight="700" fill="#1e293b">PyTorch GNN</text>

    <!-- Row 3 -->
    <rect x="52" y="532" width="112" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="64" cy="546" r="4" fill="#7c3aed" />
    <text x="74" y="550" font-size="10.5" font-weight="700" fill="#1e293b">NetworkX</text>

    <rect x="170" y="532" width="122" height="28" rx="5" fill="#f1f5f9" stroke="#e2e8f0" />
    <circle cx="182" cy="546" r="4" fill="#16a34a" />
    <text x="192" y="550" font-size="10.5" font-weight="700" fill="#1e293b">OSRM Engine</text>

    <!-- Divider -->
    <line x1="52" y1="760" x2="290" y2="760" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="4,4" />

    <!-- GitHub Repo Section -->
    <g transform="translate(52, 780)">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="#475569" transform="scale(0.9)"/>
      <text x="20" y="11" font-size="10" font-weight="700" fill="#475569">GitHub Repository:</text>
      <text x="0" y="27" font-size="8.8" font-family="'JetBrains Mono', monospace" fill="#0284c7" text-decoration="underline">github.com/vinayvalurouthu/HYDROGRAPH</text>
    </g>
  </g>

  <!-- ─── MAIN DIAGRAM CANVAS (X: 330, Y: 90, W: 1235, H: 755) ─── -->

  <!-- ═════ LAYER 1: TOP ROW (USERS -> PLATFORM + AI LAYER) ═════ -->

  <!-- 1.1 USERS BOX (X: 330, Y: 90, W: 165, H: 140) -->
  <g filter="url(#shadow-card)">
    <rect x="330" y="90" width="165" height="140" rx="9" fill="url(#gradUsers)" />
    <text x="345" y="115" font-size="12" font-weight="800" fill="#ffffff" letter-spacing="0.5">👥 USERS</text>
    <line x1="345" y1="122" x2="480" y2="122" stroke="rgba(255,255,255,0.3)" stroke-width="1" />
    
    <text x="348" y="145" font-size="10.5" font-weight="600" fill="#ffffff">🏛️ Municipal SDMA</text>
    <text x="348" y="173" font-size="10.5" font-weight="600" fill="#ffffff">🚒 NDRF Responders</text>
    <text x="348" y="201" font-size="10.5" font-weight="600" fill="#ffffff">📱 Vulnerable Citizens</text>
  </g>

  <!-- Arrow: Users -> Platform (Blue) -->
  <line x1="495" y1="160" x2="520" y2="160" stroke="#0284c7" stroke-width="3" marker-end="url(#arrow-blue)" />

  <!-- 1.2 PLATFORM BOX (X: 525, Y: 90, W: 690, H: 140) -->
  <g filter="url(#shadow-card)">
    <rect x="525" y="90" width="690" height="140" rx="9" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    
    <!-- Platform Header Banner -->
    <rect x="535" y="98" width="670" height="26" rx="5" fill="#0284c7" />
    <text x="870" y="116" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">HYDROGRAPH URBAN COMMAND &amp; DECISION PLATFORM</text>

    <!-- 5 Action Capsules -->
    <!-- Capsule 1: Flood Map -->
    <rect x="540" y="134" width="122" height="84" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
    <text x="601" y="162" font-size="18" text-anchor="middle">🗺️</text>
    <text x="601" y="184" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Flood Map</text>
    <text x="601" y="198" font-size="8.5" font-weight="600" fill="#0284c7" text-anchor="middle">2D/3D Inundation</text>

    <!-- Capsule 2: Hotspots -->
    <rect x="672" y="134" width="122" height="84" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
    <text x="733" y="162" font-size="18" text-anchor="middle">📍</text>
    <text x="733" y="184" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Hotspot Intel</text>
    <text x="733" y="198" font-size="8.5" font-weight="600" fill="#0284c7" text-anchor="middle">Street Vulnerability</text>

    <!-- Capsule 3: Safe Route -->
    <rect x="804" y="134" width="122" height="84" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
    <text x="865" y="162" font-size="18" text-anchor="middle">🧭</text>
    <text x="865" y="184" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Safe Routing</text>
    <text x="865" y="198" font-size="8.5" font-weight="600" fill="#0284c7" text-anchor="middle">Water-Depth Penalty</text>

    <!-- Capsule 4: Shelters -->
    <rect x="936" y="134" width="122" height="84" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
    <text x="997" y="162" font-size="18" text-anchor="middle">🏥</text>
    <text x="997" y="184" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Smart Shelters</text>
    <text x="997" y="198" font-size="8.5" font-weight="600" fill="#0284c7" text-anchor="middle">Capacity &amp; Elevation</text>

    <!-- Capsule 5: SOS -->
    <rect x="1068" y="134" width="137" height="84" rx="7" fill="#f0f9ff" stroke="#bae6fd" stroke-width="1.2" />
    <text x="1136" y="162" font-size="18" text-anchor="middle">🚨</text>
    <text x="1136" y="184" font-size="10.5" font-weight="800" fill="#0369a1" text-anchor="middle">Citizen SOS</text>
    <text x="1136" y="198" font-size="8.5" font-weight="600" fill="#0284c7" text-anchor="middle">Rescue Dispatch</text>
  </g>

  <!-- 1.3 AI LAYER BOX (X: 1245, Y: 90, W: 320, H: 140) -->
  <g filter="url(#shadow-card)">
    <rect x="1245" y="90" width="320" height="140" rx="9" fill="#ffffff" stroke="#16a34a" stroke-width="1.8" />
    <rect x="1255" y="98" width="300" height="26" rx="5" fill="#16a34a" />
    <text x="1405" y="116" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">AI &amp; INTELLIGENCE LAYER</text>

    <!-- 5 Pills -->
    <rect x="1257" y="132" width="296" height="18" rx="3" fill="#f0fdf4" />
    <line x1="1257" y1="132" x2="1257" y2="150" stroke="#16a34a" stroke-width="3" />
    <text x="1268" y="145" font-size="9.5" font-weight="700" fill="#14532d">🌧️ PySTEPS Radar Nowcasting (6h Lead)</text>

    <rect x="1257" y="153" width="296" height="18" rx="3" fill="#f0fdf4" />
    <line x1="1257" y1="153" x2="1257" y2="171" stroke="#16a34a" stroke-width="3" />
    <text x="1268" y="166" font-size="9.5" font-weight="700" fill="#14532d">🧠 Spatio-Temporal GNN Surrogate</text>

    <rect x="1257" y="174" width="296" height="18" rx="3" fill="#f0fdf4" />
    <line x1="1257" y1="174" x2="1257" y2="192" stroke="#16a34a" stroke-width="3" />
    <text x="1268" y="187" font-size="9.5" font-weight="700" fill="#14532d">🔍 Drainage Residual Anomaly Detector</text>

    <rect x="1257" y="195" width="296" height="18" rx="3" fill="#f0fdf4" />
    <line x1="1257" y1="195" x2="1257" y2="213" stroke="#16a34a" stroke-width="3" />
    <text x="1268" y="208" font-size="9.5" font-weight="700" fill="#14532d">📊 Multi-Sensor Confidence Engine</text>

    <rect x="1257" y="216" width="296" height="18" rx="3" fill="#f0fdf4" />
    <line x1="1257" y1="216" x2="1257" y2="234" stroke="#16a34a" stroke-width="3" />
    <text x="1268" y="229" font-size="9.5" font-weight="700" fill="#14532d">💥 Real-time Exposure &amp; Impact Predictor</text>
  </g>

  <!-- Arrow: Platform <-> AI (Green) -->
  <line x1="1215" y1="160" x2="1240" y2="160" stroke="#16a34a" stroke-width="2.5" marker-end="url(#arrow-green)" />

  <!-- Arrow: Platform -> Execution Engine (Purple) -->
  <line x1="870" y1="230" x2="870" y2="260" stroke="#7c3aed" stroke-width="3" marker-end="url(#arrow-purple)" />

  <!-- ═════ LAYER 2: PHYSICS & SIMULATION CORE (PURPLE) ═════ -->
  <!-- (X: 330, Y: 265, W: 1235, H: 135) -->
  <g filter="url(#shadow-card)">
    <rect x="330" y="265" width="1235" height="135" rx="9" fill="#ffffff" stroke="#7c3aed" stroke-width="1.8" />
    
    <!-- Purple Header Banner -->
    <rect x="340" y="273" width="1215" height="26" rx="5" fill="url(#gradPurple)" />
    <text x="947" y="291" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">PHYSICS &amp; HYDRODYNAMIC EXECUTION ENGINE</text>

    <!-- 5 Execution Modules -->
    <!-- Mod 1: PySTEPS -->
    <rect x="348" y="309" width="225" height="80" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
    <text x="460" y="333" font-size="16" text-anchor="middle">📡</text>
    <text x="460" y="353" font-size="11" font-weight="800" fill="#5b21b6" text-anchor="middle">PySTEPS</text>
    <text x="460" y="370" font-size="8.8" font-weight="500" fill="#6b21a8" text-anchor="middle">Optical Flow Radar Extrapolation</text>

    <!-- Mod 2: EPA SWMM -->
    <rect x="593" y="309" width="225" height="80" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
    <text x="705" y="333" font-size="16" text-anchor="middle">🚰</text>
    <text x="705" y="353" font-size="11" font-weight="800" fill="#5b21b6" text-anchor="middle">EPA SWMM</text>
    <text x="705" y="370" font-size="8.8" font-weight="500" fill="#6b21a8" text-anchor="middle">1D Pipe &amp; Conduit Hydraulics</text>

    <!-- Mod 3: LISFLOOD-FP -->
    <rect x="838" y="309" width="225" height="80" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
    <text x="950" y="333" font-size="16" text-anchor="middle">🌊</text>
    <text x="950" y="353" font-size="11" font-weight="800" fill="#5b21b6" text-anchor="middle">LISFLOOD-FP</text>
    <text x="950" y="370" font-size="8.8" font-weight="500" fill="#6b21a8" text-anchor="middle">2D Shallow-Water Surface Flow</text>

    <!-- Mod 4: Coupled 1D/2D -->
    <rect x="1083" y="309" width="225" height="80" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
    <text x="1195" y="333" font-size="16" text-anchor="middle">🔄</text>
    <text x="1195" y="353" font-size="11" font-weight="800" fill="#5b21b6" text-anchor="middle">Coupled 1D/2D</text>
    <text x="1195" y="370" font-size="8.8" font-weight="500" fill="#6b21a8" text-anchor="middle">Manhole Inflow/Outflow Flux</text>

    <!-- Mod 5: CWC Dam Boundary -->
    <rect x="1328" y="309" width="225" height="80" rx="7" fill="#faf5ff" stroke="#ddd6fe" stroke-width="1.2" />
    <text x="1440" y="333" font-size="16" text-anchor="middle">🏞️</text>
    <text x="1440" y="353" font-size="11" font-weight="800" fill="#5b21b6" text-anchor="middle">CWC River Boundary</text>
    <text x="1440" y="370" font-size="8.8" font-weight="500" fill="#6b21a8" text-anchor="middle">Stage &amp; Dam Discharge Gauge</text>
  </g>

  <!-- Arrow: Execution Engine -> Visualization (Orange) -->
  <line x1="775" y1="400" x2="775" y2="430" stroke="#ea580c" stroke-width="3" marker-end="url(#arrow-purple)" />

  <!-- ═════ LAYER 3: MIDDLE ROW (VISUALIZATION + DATA MANAGEMENT) ═════ -->

  <!-- 3.1 VISUALIZATION & RESULTS (ORANGE) (X: 330, Y: 435, W: 890, H: 140) -->
  <g filter="url(#shadow-card)">
    <rect x="330" y="435" width="890" height="140" rx="9" fill="#ffffff" stroke="#ea580c" stroke-width="1.8" />
    
    <rect x="340" y="443" width="870" height="26" rx="5" fill="url(#gradOrange)" />
    <text x="775" y="461" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">VISUALIZATION &amp; OPERATIONAL INTELLIGENCE</text>

    <!-- 5 Cards -->
    <rect x="346" y="479" width="162" height="84" rx="7" fill="#fffaf5" stroke="#ffedd5" stroke-width="1.2" />
    <text x="427" y="506" font-size="18" text-anchor="middle">🌊</text>
    <text x="427" y="528" font-size="10.5" font-weight="800" fill="#9a3412" text-anchor="middle">Depth Contours</text>
    <text x="427" y="543" font-size="8.5" font-weight="600" fill="#c2410c" text-anchor="middle">Water Depth (cm)</text>

    <rect x="522" y="479" width="162" height="84" rx="7" fill="#fffaf5" stroke="#ffedd5" stroke-width="1.2" />
    <text x="603" y="506" font-size="18" text-anchor="middle">⚠️</text>
    <text x="603" y="528" font-size="10.5" font-weight="800" fill="#9a3412" text-anchor="middle">Hotspot Matrix</text>
    <text x="603" y="543" font-size="8.5" font-weight="600" fill="#c2410c" text-anchor="middle">Street Risk Ranking</text>

    <rect x="698" y="479" width="162" height="84" rx="7" fill="#fffaf5" stroke="#ffedd5" stroke-width="1.2" />
    <text x="779" y="506" font-size="18" text-anchor="middle">🛣️</text>
    <text x="779" y="528" font-size="10.5" font-weight="800" fill="#9a3412" text-anchor="middle">Safe Evacuation</text>
    <text x="779" y="543" font-size="8.5" font-weight="600" fill="#c2410c" text-anchor="middle">Isochrone Routing</text>

    <rect x="874" y="479" width="162" height="84" rx="7" fill="#fffaf5" stroke="#ffedd5" stroke-width="1.2" />
    <text x="955" y="506" font-size="18" text-anchor="middle">🕸️</text>
    <text x="955" y="528" font-size="10.5" font-weight="800" fill="#9a3412" text-anchor="middle">Drainage Surcharge</text>
    <text x="955" y="543" font-size="8.5" font-weight="600" fill="#c2410c" text-anchor="middle">NetworkX Pipe Nodes</text>

    <rect x="1050" y="479" width="160" height="84" rx="7" fill="#fffaf5" stroke="#ffedd5" stroke-width="1.2" />
    <text x="1130" y="506" font-size="18" text-anchor="middle">🎛️</text>
    <text x="1130" y="528" font-size="10.5" font-weight="800" fill="#9a3412" text-anchor="middle">Scenario Sandbox</text>
    <text x="1130" y="543" font-size="8.5" font-weight="600" fill="#c2410c" text-anchor="middle">Rain &amp; Dam Sliders</text>
  </g>

  <!-- 3.2 DATA MANAGEMENT (RED) (X: 1245, Y: 435, W: 320, H: 140) -->
  <g filter="url(#shadow-card)">
    <rect x="1245" y="435" width="320" height="140" rx="9" fill="#ffffff" stroke="#dc2626" stroke-width="1.8" />
    <rect x="1255" y="443" width="300" height="26" rx="5" fill="#dc2626" />
    <text x="1405" y="461" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">OPERATIONAL DATA MANAGEMENT</text>

    <!-- 5 Pills -->
    <rect x="1257" y="477" width="296" height="18" rx="3" fill="#fef2f2" />
    <line x1="1257" y1="477" x2="1257" y2="495" stroke="#dc2626" stroke-width="3" />
    <text x="1268" y="490" font-size="9.5" font-weight="700" fill="#991b1b">🛰️ IMD Doppler Radar (DWR NetCDF)</text>

    <rect x="1257" y="498" width="296" height="18" rx="3" fill="#fef2f2" />
    <line x1="1257" y1="498" x2="1257" y2="516" stroke="#dc2626" stroke-width="3" />
    <text x="1268" y="511" font-size="9.5" font-weight="700" fill="#991b1b">📈 CWC River Gauges &amp; Reservoirs</text>

    <rect x="1257" y="519" width="296" height="18" rx="3" fill="#fef2f2" />
    <line x1="1257" y1="519" x2="1257" y2="537" stroke="#dc2626" stroke-width="3" />
    <text x="1268" y="532" font-size="9.5" font-weight="700" fill="#991b1b">🗺️ OpenStreetMap &amp; High-Res DEM</text>

    <rect x="1257" y="540" width="296" height="18" rx="3" fill="#fef2f2" />
    <line x1="1257" y1="540" x2="1257" y2="558" stroke="#dc2626" stroke-width="3" />
    <text x="1268" y="553" font-size="9.5" font-weight="700" fill="#991b1b">🆘 Citizen SOS Offline IndexedDB</text>

    <rect x="1257" y="561" width="296" height="18" rx="3" fill="#fef2f2" />
    <line x1="1257" y1="561" x2="1257" y2="579" stroke="#dc2626" stroke-width="3" />
    <text x="1268" y="574" font-size="9.5" font-weight="700" fill="#991b1b">⏮️ Historical Flood Event Replay Store</text>
  </g>

  <!-- Arrow: Data Management -> Execution Engine & Viz (Red) -->
  <line x1="1245" y1="505" x2="1225" y2="505" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow-red)" />

  <!-- Arrow: Visualization -> Infrastructure (Navy) -->
  <line x1="775" y1="575" x2="775" y2="605" stroke="#0284c7" stroke-width="3" marker-end="url(#arrow-blue)" />

  <!-- ═════ LAYER 4: BOTTOM ROW (INFRASTRUCTURE + LEGEND) ═════ -->

  <!-- 4.1 INFRASTRUCTURE & SCALABILITY (X: 330, Y: 610, W: 890, H: 135) -->
  <g filter="url(#shadow-card)">
    <rect x="330" y="610" width="890" height="135" rx="9" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" />
    
    <rect x="340" y="618" width="870" height="26" rx="5" fill="url(#gradNavy)" />
    <text x="775" y="636" font-size="11.5" font-weight="800" fill="#ffffff" letter-spacing="1" text-anchor="middle">INFRASTRUCTURE &amp; SCALABLE ARCHITECTURE</text>

    <!-- 5 Infra Cards -->
    <rect x="346" y="654" width="162" height="78" rx="7" fill="#f8fafc" stroke="#e0f2fe" stroke-width="1.2" />
    <text x="427" y="679" font-size="18" text-anchor="middle">⚛️</text>
    <text x="427" y="700" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">React 19</text>
    <text x="427" y="716" font-size="8.5" font-weight="600" fill="#475569" text-anchor="middle">PWA &amp; Command UI</text>

    <rect x="522" y="654" width="162" height="78" rx="7" fill="#f8fafc" stroke="#e0f2fe" stroke-width="1.2" />
    <text x="603" y="679" font-size="18" text-anchor="middle">⚡</text>
    <text x="603" y="700" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">FastAPI</text>
    <text x="603" y="716" font-size="8.5" font-weight="600" fill="#475569" text-anchor="middle">Async REST &amp; WebSocket</text>

    <rect x="698" y="654" width="162" height="78" rx="7" fill="#f8fafc" stroke="#e0f2fe" stroke-width="1.2" />
    <text x="779" y="679" font-size="18" text-anchor="middle">🗄️</text>
    <text x="779" y="700" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">PostGIS / SQLite</text>
    <text x="779" y="716" font-size="8.5" font-weight="600" fill="#475569" text-anchor="middle">R-Tree Spatial Indices</text>

    <rect x="874" y="654" width="162" height="78" rx="7" fill="#f8fafc" stroke="#e0f2fe" stroke-width="1.2" />
    <text x="955" y="679" font-size="18" text-anchor="middle">🧭</text>
    <text x="955" y="700" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">OSRM Engine</text>
    <text x="955" y="716" font-size="8.5" font-weight="600" fill="#475569" text-anchor="middle">Dynamic Evacuation Graph</text>

    <rect x="1050" y="654" width="160" height="78" rx="7" fill="#f8fafc" stroke="#e0f2fe" stroke-width="1.2" />
    <text x="1130" y="679" font-size="18" text-anchor="middle">🚀</text>
    <text x="1130" y="700" font-size="11" font-weight="800" fill="#0f172a" text-anchor="middle">Docker Edge</text>
    <text x="1130" y="716" font-size="8.5" font-weight="600" fill="#475569" text-anchor="middle">Municipal On-Prem / Cloud</text>
  </g>

  <!-- 4.2 LEGEND BOX (X: 1245, Y: 610, W: 320, H: 135) -->
  <g filter="url(#shadow-card)">
    <rect x="1245" y="610" width="320" height="135" rx="9" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="1260" y="630" font-size="10" font-weight="800" fill="#64748b" letter-spacing="0.8">SYSTEM FLOW LEGEND</text>

    <!-- Legend 1: User Flow -->
    <line x1="1260" y1="648" x2="1300" y2="648" stroke="#0284c7" stroke-width="3" marker-end="url(#arrow-blue)" />
    <text x="1312" y="652" font-size="10" font-weight="700" fill="#1e293b">User Action &amp; Interactive Flow</text>

    <!-- Legend 2: Physics Sim Flow -->
    <line x1="1260" y1="670" x2="1300" y2="670" stroke="#7c3aed" stroke-width="3" marker-end="url(#arrow-purple)" />
    <text x="1312" y="674" font-size="10" font-weight="700" fill="#1e293b">Hydrodynamic Simulation Pipeline</text>

    <!-- Legend 3: AI Intelligence Flow -->
    <line x1="1260" y1="692" x2="1300" y2="692" stroke="#16a34a" stroke-width="3" marker-end="url(#arrow-green)" />
    <text x="1312" y="696" font-size="10" font-weight="700" fill="#1e293b">AI Inference &amp; Anomaly Engine</text>

    <!-- Legend 4: Data Ingestion Flow -->
    <line x1="1260" y1="714" x2="1300" y2="714" stroke="#dc2626" stroke-width="3" marker-end="url(#arrow-red)" />
    <text x="1312" y="718" font-size="10" font-weight="700" fill="#1e293b">Multi-Source Sensor Ingestion</text>

    <!-- Legend 5: Real-time Feedback Loop -->
    <line x1="1260" y1="734" x2="1300" y2="734" stroke="#059669" stroke-width="2.5" stroke-dasharray="4,4" />
    <text x="1312" y="737" font-size="9.5" font-weight="700" fill="#047857">Real-time Residual Feedback Loop</text>
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

print(f"Generated SVG: {out_path} ({len(svg_content)} bytes)")
