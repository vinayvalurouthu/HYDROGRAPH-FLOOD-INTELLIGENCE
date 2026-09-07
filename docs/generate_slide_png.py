import os
import matplotlib
matplotlib.use("Agg")
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'DejaVu Sans']
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon

# Professional Color Palette matching the reference slide
BLUE_DARK   = "#0A2540"
BLUE_MID    = "#0284C7"
BLUE_LIGHT  = "#E0F2FE"
BLUE_BORDER = "#BAE6FD"

PURPLE_DARK = "#4C1D95"
PURPLE_MID  = "#7C3AED"
PURPLE_BG   = "#FAF5FF"
PURPLE_BDR  = "#DDD6FE"

ORANGE_DARK = "#9A3412"
ORANGE_MID  = "#EA580C"
ORANGE_BG   = "#FFF7ED"
ORANGE_BDR  = "#FFEDD5"

GREEN_DARK  = "#14532D"
GREEN_MID   = "#16A34A"
GREEN_BG    = "#F0FDF4"
GREEN_BDR   = "#BBF7D0"

RED_DARK    = "#991B1B"
RED_MID     = "#DC2626"
RED_BG      = "#FEF2F2"
RED_BDR     = "#FECACA"

GREY_DARK   = "#0F172A"
GREY_MID    = "#475569"
GREY_LIGHT  = "#F1F5F9"
GREY_BDR    = "#CBD5E1"

def draw_card(ax, x, y, w, h, fc, ec, lw=1.2, radius=0.08, zorder=2):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0.01,rounding_size={radius}",
                         facecolor=fc, edgecolor=ec, linewidth=lw,
                         zorder=zorder)
    ax.add_patch(box)
    return box

def draw_arrow(ax, x1, y1, x2, y2, color, lw=2.4, zorder=5, style="-|>"):
    ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color,
                                lw=lw, mutation_scale=14),
                zorder=zorder)

def draw_badge(ax, x, y, text, bg, fg, w=0.5, h=0.22, fontsize=7.5, zorder=4):
    draw_card(ax, x - w/2, y - h/2, w, h, bg, "none", radius=0.04, zorder=zorder)
    ax.text(x, y, text, ha="center", va="center", fontsize=fontsize,
            fontweight="bold", color=fg, zorder=zorder+1)

def generate_slide():
    fig, ax = plt.subplots(figsize=(19.2, 10.8), dpi=160)
    ax.set_xlim(0, 19.2)
    ax.set_ylim(0, 10.8)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")

    # ─── 1. HEADER BAR ───
    ax.add_patch(Rectangle((0, 9.9), 19.2, 0.9, facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5, zorder=1))
    
    # Logo & Team Name (Left)
    c = Circle((0.8, 10.35), 0.28, facecolor=BLUE_LIGHT, edgecolor=BLUE_MID, linewidth=1.5, zorder=3)
    ax.add_patch(c)
    # Wave icon vector
    ax.plot([0.62, 0.72, 0.80, 0.88, 0.98], [10.35, 10.42, 10.35, 10.28, 10.35], color=BLUE_MID, lw=2.2, zorder=4)
    ax.plot([0.62, 0.72, 0.80, 0.88, 0.98], [10.27, 10.34, 10.27, 10.20, 10.27], color=BLUE_DARK, lw=1.8, zorder=4)

    ax.text(1.25, 10.44, "HYDROGRAPH", fontsize=16, fontweight="bold", color=BLUE_DARK, va="center", zorder=3)
    ax.text(1.25, 10.24, "AI Urban Flood Intelligence & Command Platform", fontsize=8.5, fontweight="bold", color=GREY_MID, va="center", zorder=3)

    # Header Title (Center)
    ax.text(9.6, 10.35, "TECHNICAL APPROACH", fontsize=20, fontweight="bold", color=GREY_DARK,
            ha="center", va="center", zorder=3)

    # SIH 2026 Emblem (Right)
    sih_c = Circle((17.2, 10.35), 0.28, facecolor="#FFF7ED", edgecolor=ORANGE_MID, linewidth=1.5, zorder=3)
    ax.add_patch(sih_c)
    ax.plot([17.2, 17.2], [10.22, 10.44], color=ORANGE_MID, lw=2, zorder=4)
    ax.plot([17.1, 17.3], [10.30, 10.30], color=ORANGE_MID, lw=2, zorder=4)
    ax.text(17.65, 10.45, "SMART INDIA", fontsize=11, fontweight="bold", color=ORANGE_MID, va="center", zorder=3)
    ax.text(17.65, 10.25, "HACKATHON 2026", fontsize=10, fontweight="bold", color=GREEN_MID, va="center", zorder=3)

    # ─── 2. LEFT SIDEBAR: TECH-STACK ───
    draw_card(ax, 0.4, 0.5, 3.2, 9.15, "#FFFFFF", BLUE_BORDER, lw=1.8, radius=0.12)
    
    # Tech stack header
    ax.text(0.6, 9.35, "TECH-STACK", fontsize=14, fontweight="bold", color=BLUE_MID, va="center", zorder=3)
    ax.plot([0.6, 3.4], [9.15, 9.15], color=BLUE_LIGHT, lw=2, zorder=3)

    # Section 1: Frontend
    ax.text(0.6, 8.9, "FRONTEND", fontsize=10, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    fe_chips = [
        ("HTML5 / CSS3", "#E34C26", 0.6, 8.45), ("JavaScript", "#F7DF1E", 2.0, 8.45),
        ("React 19", "#61DAFB", 0.6, 8.0),     ("Tailwind v4", "#38BDF8", 2.0, 8.0),
        ("Leaflet GIS", "#199900", 0.6, 7.55),  ("Recharts", "#8884D8", 2.0, 7.55),
    ]
    for name, dot_col, cx, cy in fe_chips:
        draw_card(ax, cx, cy - 0.16, 1.3, 0.32, GREY_LIGHT, GREY_BDR, lw=0.8, radius=0.05)
        ax.add_patch(Circle((cx + 0.14, cy), 0.05, facecolor=dot_col, edgecolor="none", zorder=4))
        ax.text(cx + 0.25, cy, name, fontsize=8.5, fontweight="bold", color=GREY_DARK, va="center", zorder=4)

    ax.plot([0.6, 3.4], [7.25, 7.25], color=GREY_LIGHT, lw=1.2, zorder=3)

    # Section 2: Backend & Database
    ax.text(0.6, 7.0, "BACKEND & DATABASE", fontsize=10, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    be_chips = [
        ("FastAPI", "#009688", 0.6, 6.55),      ("Python 3.12", "#3572A5", 2.0, 6.55),
        ("SQLite DB", "#003B57", 0.6, 6.1),     ("PostGIS / GIS", "#336791", 2.0, 6.1),
        ("Pydantic v2", "#E10098", 0.6, 5.65),  ("SQLAlchemy", "#D71F00", 2.0, 5.65),
    ]
    for name, dot_col, cx, cy in be_chips:
        draw_card(ax, cx, cy - 0.16, 1.3, 0.32, GREY_LIGHT, GREY_BDR, lw=0.8, radius=0.05)
        ax.add_patch(Circle((cx + 0.14, cy), 0.05, facecolor=dot_col, edgecolor="none", zorder=4))
        ax.text(cx + 0.25, cy, name, fontsize=8.5, fontweight="bold", color=GREY_DARK, va="center", zorder=4)

    ax.plot([0.6, 3.4], [5.35, 5.35], color=GREY_LIGHT, lw=1.2, zorder=3)

    # Section 3: AI & Hydrodynamic
    ax.text(0.6, 5.1, "AI & HYDRODYNAMIC", fontsize=10, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    ai_chips = [
        ("PySTEPS", "#0284C7", 0.6, 4.65),      ("EPA SWMM", "#EA580C", 2.0, 4.65),
        ("LISFLOOD-FP", "#DC2626", 0.6, 4.2),  ("PyTorch GNN", "#EE4C2C", 2.0, 4.2),
        ("NetworkX", "#7C3AED", 0.6, 3.75),     ("OSRM Engine", "#16A34A", 2.0, 3.75),
    ]
    for name, dot_col, cx, cy in ai_chips:
        draw_card(ax, cx, cy - 0.16, 1.3, 0.32, GREY_LIGHT, GREY_BDR, lw=0.8, radius=0.05)
        ax.add_patch(Circle((cx + 0.14, cy), 0.05, facecolor=dot_col, edgecolor="none", zorder=4))
        ax.text(cx + 0.25, cy, name, fontsize=8.2, fontweight="bold", color=GREY_DARK, va="center", zorder=4)

    # GitHub link at bottom
    ax.plot([0.6, 3.4], [1.35, 1.35], color=GREY_BDR, lw=1, ls="--", zorder=3)
    ax.text(0.6, 1.12, "GitHub Repository:", fontsize=9, fontweight="bold", color=GREY_MID, zorder=3)
    ax.text(0.6, 0.82, "github.com/vinayvalurouthu/\nHYDROGRAPH-FLOOD-INTELLIGENCE", fontsize=7.5,
            fontweight="bold", color=BLUE_MID, zorder=3, family="monospace")

    # ─── 3. MAIN CANVAS ARCHITECTURE ───

    # ──── LAYER 1: TOP ROW (USERS -> PLATFORM + AI LAYER) ────
    # 1.1 USERS BOX (x=3.8, y=7.75, w=2.45, h=1.9)
    draw_card(ax, 3.8, 7.75, 2.45, 1.9, BLUE_MID, BLUE_DARK, lw=1.5, radius=0.1)
    ax.text(5.02, 9.35, "USERS", fontsize=11, fontweight="bold", color="white", ha="center", zorder=3)
    ax.plot([4.0, 6.05], [9.15, 9.15], color="white", lw=0.8, alpha=0.5, zorder=3)
    
    users = [
        ("SDMA", "Municipal SDMA"),
        ("NDRF", "First Responders"),
        ("PUBLIC", "Vulnerable Citizens")
    ]
    for i, (tag, u) in enumerate(users):
        draw_badge(ax, 4.3, 8.75 - i*0.4, tag, "#0369A1", "white", w=0.68, h=0.22, fontsize=7)
        ax.text(4.75, 8.75 - i*0.4, u, fontsize=8.8, fontweight="bold", color="white", va="center", zorder=3)

    # Arrow: Users -> Platform (Blue)
    draw_arrow(ax, 6.30, 8.7, 6.55, 8.7, BLUE_MID, lw=3)

    # 1.2 PLATFORM BOX (x=6.6, y=7.75, w=8.0, h=1.9)
    draw_card(ax, 6.6, 7.75, 8.0, 1.9, "#FFFFFF", BLUE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 6.75, 9.2, 7.7, 0.38, BLUE_MID, BLUE_MID, radius=0.06)
    ax.text(10.6, 9.39, "HYDROGRAPH URBAN COMMAND & DECISION PLATFORM", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    # 5 Action Capsules inside Platform
    capsules = [
        ("GIS", "Flood Map", "2D/3D Inundation", 6.8),
        ("HOT", "Hotspots", "Street Vulnerability", 8.3),
        ("NAV", "Safe Route", "Water Penalty", 9.8),
        ("SHEL", "Smart Shelter", "Elevation & Capacity", 11.3),
        ("SOS", "Citizen SOS", "Rescue Dispatch", 12.8),
    ]
    for tag, title, sub, cap_x in capsules:
        draw_card(ax, cap_x, 7.95, 1.4, 1.1, BLUE_LIGHT, BLUE_BORDER, lw=1, radius=0.08)
        draw_badge(ax, cap_x + 0.7, 8.78, tag, BLUE_MID, "white", w=0.55, h=0.22, fontsize=7)
        ax.text(cap_x + 0.7, 8.44, title, fontsize=9.5, fontweight="bold", color=BLUE_DARK, ha="center", zorder=4)
        ax.text(cap_x + 0.7, 8.18, sub, fontsize=7.5, fontweight="bold", color=BLUE_MID, ha="center", zorder=4)

    # 1.3 AI LAYER BOX (x=14.9, y=7.75, w=3.9, h=1.9)
    draw_card(ax, 14.9, 7.75, 3.9, 1.9, "#FFFFFF", GREEN_MID, lw=1.8, radius=0.1)
    draw_card(ax, 15.05, 9.2, 3.6, 0.38, GREEN_MID, GREEN_MID, radius=0.06)
    ax.text(16.85, 9.39, "AI & INTELLIGENCE LAYER", fontsize=11, fontweight="bold", color="white", ha="center", va="center", zorder=4)

    ai_items = [
        ("NOWCAST", "PySTEPS Radar Nowcasting (6h)"),
        ("ST-GNN", "Inundation Surrogate Engine"),
        ("RESIDUAL", "Drainage Residual Anomaly"),
        ("CONF", "Multi-Sensor Confidence Score"),
        ("IMPACT", "Real-Time Exposure & Loss Calc")
    ]
    for i, (tag, item) in enumerate(ai_items):
        py = 8.88 - i*0.25
        draw_card(ax, 15.1, py - 0.08, 3.5, 0.22, GREEN_BG, "none", radius=0.04)
        draw_badge(ax, 15.45, py + 0.03, tag, GREEN_MID, "white", w=0.6, h=0.18, fontsize=6.5)
        ax.text(15.82, py + 0.03, item, fontsize=7.8, fontweight="bold", color=GREEN_DARK, va="center", zorder=4)

    # Arrow: Platform <-> AI (Green)
    draw_arrow(ax, 14.62, 8.7, 14.88, 8.7, GREEN_MID, lw=2.5)

    # ──── LAYER 2: PHYSICS & HYDRODYNAMIC EXECUTION ENGINE (PURPLE) ────
    # (x=3.9, y=5.45, w=14.9, h=1.95)
    draw_card(ax, 3.9, 5.45, 14.9, 1.95, "#FFFFFF", PURPLE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 4.05, 6.95, 14.6, 0.38, PURPLE_MID, PURPLE_MID, radius=0.06)
    ax.text(11.35, 7.14, "PHYSICS & HYDRODYNAMIC EXECUTION ENGINE", fontsize=11.5,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    physics_mods = [
        ("RADAR", "PySTEPS", "Optical Flow Radar Advection", 4.15),
        ("1D-PIPE", "EPA SWMM", "1D Storm Drain Hydraulic Solver", 7.1),
        ("2D-SURF", "LISFLOOD-FP", "2D Shallow-Water Inundation", 10.05),
        ("FLUX", "Coupled 1D/2D", "Dynamic Manhole Flux Exchange", 13.0),
        ("RIVER", "CWC Boundary", "River Discharge & Dam Hydrograph", 15.95),
    ]
    for tag, title, desc, px in physics_mods:
        draw_card(ax, px, 5.65, 2.7, 1.15, PURPLE_BG, PURPLE_BDR, lw=1, radius=0.08)
        draw_badge(ax, px + 1.35, 6.52, tag, PURPLE_MID, "white", w=0.7, h=0.22, fontsize=7)
        ax.text(px + 1.35, 6.22, title, fontsize=10.5, fontweight="bold", color=PURPLE_DARK, ha="center", zorder=4)
        ax.text(px + 1.35, 5.92, desc, fontsize=7.8, fontweight="bold", color=PURPLE_MID, ha="center", zorder=4)

    # Arrow: Platform -> Execution Engine (Purple)
    draw_arrow(ax, 10.55, 7.75, 10.55, 7.42, PURPLE_MID, lw=3)

    # ──── LAYER 3: VISUALIZATION & RESULTS (ORANGE) + DATA MANAGEMENT (RED) ────
    # 3.1 VISUALIZATION BOX (x=3.9, y=3.05, w=10.7, h=2.0)
    draw_card(ax, 3.9, 3.05, 10.7, 2.0, "#FFFFFF", ORANGE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 4.05, 4.6, 10.4, 0.38, ORANGE_MID, ORANGE_MID, radius=0.06)
    ax.text(9.25, 4.79, "VISUALIZATION & OPERATIONAL INTELLIGENCE", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    viz_cards = [
        ("DEPTH", "Depth Contours", "Water Depth (cm)", 4.1),
        ("RANK", "Hotspot Matrix", "Time-to-Peak Risk", 6.2),
        ("ROUTE", "Safe Evacuation", "Isochrone Routing", 8.3),
        ("PIPE", "Drain Surcharge", "NetworkX Choke Nodes", 10.4),
        ("WHAT-IF", "Scenario Sandbox", "Rain & Dam Sliders", 12.5),
    ]
    for tag, title, desc, vx in viz_cards:
        draw_card(ax, vx, 3.25, 1.95, 1.2, ORANGE_BG, ORANGE_BDR, lw=1, radius=0.08)
        draw_badge(ax, vx + 0.97, 4.18, tag, ORANGE_MID, "white", w=0.68, h=0.22, fontsize=7)
        ax.text(vx + 0.97, 3.84, title, fontsize=9.5, fontweight="bold", color=ORANGE_DARK, ha="center", zorder=4)
        ax.text(vx + 0.97, 3.52, desc, fontsize=7.8, fontweight="bold", color=ORANGE_MID, ha="center", zorder=4)

    # Arrow: Execution Engine -> Visualization (Orange)
    draw_arrow(ax, 9.25, 5.45, 9.25, 5.08, ORANGE_MID, lw=3)

    # 3.2 DATA MANAGEMENT BOX (x=14.9, y=3.05, w=3.9, h=2.0)
    draw_card(ax, 14.9, 3.05, 3.9, 2.0, "#FFFFFF", RED_MID, lw=1.8, radius=0.1)
    draw_card(ax, 15.05, 4.6, 3.6, 0.38, RED_MID, RED_MID, radius=0.06)
    ax.text(16.85, 4.79, "OPERATIONAL DATA MANAGEMENT", fontsize=10.5,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    data_items = [
        ("DWR", "IMD Doppler Radar Grids (NetCDF)"),
        ("CWC", "River Stage & Reservoir Telemetry"),
        ("DEM", "OpenStreetMap & High-Res Terrain"),
        ("QUEUE", "Citizen SOS Offline IndexedDB"),
        ("STORE", "Historical Flood Event Replay DB")
    ]
    for i, (tag, item) in enumerate(data_items):
        py = 4.28 - i*0.27
        draw_card(ax, 15.1, py - 0.08, 3.5, 0.23, RED_BG, "none", radius=0.04)
        draw_badge(ax, 15.42, py + 0.03, tag, RED_MID, "white", w=0.58, h=0.18, fontsize=6.5)
        ax.text(15.78, py + 0.03, item, fontsize=7.8, fontweight="bold", color=RED_DARK, va="center", zorder=4)

    # Arrow: Data Management -> Execution Engine (Red)
    draw_arrow(ax, 14.88, 4.15, 14.65, 4.15, RED_MID, lw=2.5)

    # ──── LAYER 4: INFRASTRUCTURE (NAVY) + LEGEND ────
    # 4.1 INFRASTRUCTURE (x=3.9, y=0.65, w=10.7, h=2.0)
    draw_card(ax, 3.9, 0.65, 10.7, 2.0, "#FFFFFF", BLUE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 4.05, 2.2, 10.4, 0.38, BLUE_MID, BLUE_MID, radius=0.06)
    ax.text(9.25, 2.39, "INFRASTRUCTURE & SCALABLE ARCHITECTURE", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    infra_cards = [
        ("REACT", "React 19", "Command UI & PWA", 4.1),
        ("ASYNC", "FastAPI", "Async REST & WS", 6.2),
        ("GIS-DB", "PostGIS / SQLite", "R-Tree Spatial Index", 8.3),
        ("GRAPH", "OSRM Engine", "Dynamic Route Matrix", 10.4),
        ("EDGE", "Docker Edge", "Municipal Deployment", 12.5),
    ]
    for tag, title, desc, ix in infra_cards:
        draw_card(ax, ix, 0.85, 1.95, 1.2, GREY_LIGHT, BLUE_BORDER, lw=1, radius=0.08)
        draw_badge(ax, ix + 0.97, 1.78, tag, BLUE_DARK, "white", w=0.65, h=0.22, fontsize=7)
        ax.text(ix + 0.97, 1.44, title, fontsize=10, fontweight="bold", color=GREY_DARK, ha="center", zorder=4)
        ax.text(ix + 0.97, 1.14, desc, fontsize=7.8, fontweight="bold", color=GREY_MID, ha="center", zorder=4)

    # Arrow: Visualization -> Infrastructure
    draw_arrow(ax, 9.25, 3.05, 9.25, 2.68, BLUE_MID, lw=3)

    # 4.2 LEGEND BOX (x=14.9, y=0.65, w=3.9, h=2.0)
    draw_card(ax, 14.9, 0.65, 3.9, 2.0, "#FFFFFF", GREY_BDR, lw=1.5, radius=0.1)
    ax.text(16.85, 2.35, "SYSTEM FLOW LEGEND", fontsize=10, fontweight="bold", color=GREY_MID, ha="center", zorder=3)
    ax.plot([15.2, 18.5], [2.2, 2.2], color=GREY_LIGHT, lw=1.5, zorder=3)

    legends = [
        (BLUE_MID, "User Action & Interactive Flow", "-"),
        (PURPLE_MID, "Hydrodynamic Simulation Pipeline", "-"),
        (GREEN_MID, "AI Inference & Anomaly Engine", "-"),
        (RED_MID, "Multi-Source Sensor Ingestion", "-"),
        (GREEN_MID, "Real-Time Residual Feedback Loop", "--"),
    ]
    for i, (l_col, l_text, l_style) in enumerate(legends):
        ly = 1.95 - i*0.28
        if l_style == "-":
            draw_arrow(ax, 15.2, ly, 15.7, ly, l_col, lw=2.5)
        else:
            ax.plot([15.2, 15.7], [ly, ly], color=l_col, lw=2, ls="--", zorder=4)
            ax.plot([15.7], [ly], marker=">", color=l_col, markersize=5, zorder=4)
        ax.text(15.85, ly, l_text, fontsize=8.2, fontweight="bold", color=GREY_DARK, va="center", zorder=4)

    # ─── 4. FOOTER BAR ───
    ax.add_patch(Rectangle((0, 0), 19.2, 0.45, facecolor=BLUE_MID, edgecolor="none", zorder=2))
    ax.text(0.5, 0.22, "Team HydroGraph  |  Smart India Hackathon 2026  |  Problem Domain: Urban Flood Nowcasting & Emergency Command",
            fontsize=10, fontweight="bold", color="white", va="center", zorder=3)
    
    draw_card(ax, 18.0, 0.08, 0.9, 0.28, "#0369A1", "none", radius=0.04, zorder=3)
    ax.text(18.45, 0.22, "Slide 3", fontsize=10, fontweight="bold", color="white", ha="center", va="center", zorder=4)

    # Save to docs
    out_docs = os.path.join(os.path.dirname(__file__), "technical_approach_slide.png")
    plt.savefig(out_docs, dpi=160, bbox_inches="tight", facecolor="#F8FAFC")
    plt.close()
    print("Saved PNG to:", out_docs)

    # Also copy to artifacts directory for display
    artifact_dir = r"C:\Users\vinay\.gemini\antigravity-ide\brain\0e167209-4c18-48f9-9d9f-4de3317d4b0d"
    if os.path.exists(artifact_dir):
        import shutil
        dest = os.path.join(artifact_dir, "technical_approach_slide.png")
        shutil.copy2(out_docs, dest)
        print("Copied PNG to artifacts:", dest)

if __name__ == "__main__":
    generate_slide()
