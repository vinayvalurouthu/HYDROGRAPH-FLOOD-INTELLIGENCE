"""
HydroGraph PRD - PDF Generator
Smart India Hackathon 2026 | Problem Statement 26085
Ministry of Earth Sciences (MoES) / NCMRWF

Run:  python generate_prd.py
Output: HydroGraph_PRD_SIH2026.pdf
"""
# Fix Windows console encoding before any print
import sys, os, math, io
from pathlib import Path
import textwrap
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── third-party ─────────────────────────────────────────────────────────────
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patches as FancyBboxPatch
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from matplotlib.patches import Polygon as MplPolygon
import matplotlib.gridspec as gridspec
import numpy as np

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas as rl_canvas

# ── constants ────────────────────────────────────────────────────────────────
OUT_DIR  = Path(__file__).parent
PDF_PATH = OUT_DIR / "HydroGraph_PRD_SIH2026.pdf"
IMG_DIR  = OUT_DIR / "prd_assets"
IMG_DIR.mkdir(exist_ok=True)

# ── brand palette ─────────────────────────────────────────────────────────────
BLUE_DARK   = "#0D2B45"
BLUE_MID    = "#1565C0"
BLUE_LIGHT  = "#1E88E5"
TEAL        = "#00897B"
TEAL_LIGHT  = "#4DB6AC"
ACCENT_RED  = "#C62828"
ACCENT_AMB  = "#F57F17"
ACCENT_GRN  = "#2E7D32"
BG_HEADER   = "#0D2B45"
BG_SUBHEAD  = "#1565C0"
BG_ALT      = "#E3F2FD"
GREY_LIGHT  = "#F5F7FA"
GREY_MED    = "#B0BEC5"
WHITE       = "#FFFFFF"
BLACK       = "#212121"

# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def save_fig(name):
    p = IMG_DIR / name
    plt.savefig(p, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close()
    return str(p)

def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))

def flow_box(ax, text, x, y, w=2.2, h=0.55, fc=BLUE_LIGHT, ec=BLUE_DARK,
             fontsize=8, textcolor="white", radius=0.08):
    box = FancyBboxPatch((x - w/2, y - h/2), w, h,
                         boxstyle=f"round,pad=0.02,rounding_size={radius}",
                         fc=hex2rgb(fc), ec=hex2rgb(ec), linewidth=1.2,
                         transform=ax.transData, zorder=3)
    ax.add_patch(box)
    ax.text(x, y, text, ha="center", va="center", fontsize=fontsize,
            color=textcolor, fontweight="bold", zorder=4,
            wrap=True, multialignment="center")

def arrow_down(ax, x, y_top, y_bot, color=BLUE_DARK):
    ax.annotate("", xy=(x, y_bot + 0.04), xytext=(x, y_top - 0.04),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=1.5, mutation_scale=12))

def arrow_right(ax, x_left, x_right, y, color=BLUE_DARK):
    ax.annotate("", xy=(x_right - 0.04, y), xytext=(x_left + 0.04, y),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=1.5, mutation_scale=12))

def column_flow(ax, items, x, y_start, step=0.9, fc=BLUE_LIGHT,
                w=2.4, h=0.55, fontsize=8):
    y = y_start
    for i, item in enumerate(items):
        flow_box(ax, item, x, y, w=w, h=h, fc=fc)
        if i < len(items) - 1:
            arrow_down(ax, x, y - h/2, y - step + h/2)
        y -= step
    return y

# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 1 — OVERALL SYSTEM ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────────────

def diag_system_architecture():
    fig, ax = plt.subplots(figsize=(16, 11))
    ax.set_xlim(0, 16); ax.set_ylim(0, 11)
    ax.axis("off")
    fig.patch.set_facecolor("white")

    # background layer bands
    layers = [
        (10.2, 10.9, "#E8F5E9", "LAYER 5 — CITIZEN & EMERGENCY RESPONSE"),
        (8.0,  10.0, "#E3F2FD", "LAYER 4 — DECISION SUPPORT & OUTPUT"),
        (5.4,  7.8,  "#FFF3E0", "LAYER 3 — AI & FLOOD INTELLIGENCE"),
        (2.8,  5.2,  "#FCE4EC", "LAYER 2 — PHYSICS ENGINE"),
        (0.2,  2.6,  "#E0F7FA", "LAYER 1 — DATA INGESTION"),
    ]
    for y0, y1, bg, label in layers:
        rect = plt.Rectangle((0.1, y0), 15.8, y1 - y0, fc=bg, ec=GREY_MED,
                              linewidth=0.8, zorder=1)
        ax.add_patch(rect)
        ax.text(0.25, (y0 + y1) / 2, label, fontsize=7, color=BLUE_DARK,
                fontweight="bold", va="center", rotation=0, zorder=2)

    # ── Layer 1 — Data sources ─────────────────────────────────────────────
    L1_y = 1.4
    src_items = [("IMD\nDoppler\nRadar", 3.0, TEAL),
                 ("CWC\nRiver/Dam\nData", 5.5, BLUE_LIGHT),
                 ("GIS / DEM\nOpenStreetMap", 8.0, BLUE_MID),
                 ("Municipal\nTelemetry\n(optional)", 10.5, "#5E35B1"),
                 ("Citizen\nReports\n/ SOS", 13.0, ACCENT_AMB)]
    for label, x, fc in src_items:
        flow_box(ax, label, x, L1_y, w=2.1, h=0.85, fc=fc, fontsize=7)

    # adapters
    for _, x, _ in src_items:
        flow_box(ax, "Adapter\n+ QC", x, 0.45, w=2.1, h=0.5, fc=GREY_MED,
                 textcolor=BLACK, fontsize=7)
        arrow_down(ax, x, L1_y - 0.43, 0.7)

    ax.text(8, 0.02, "INGESTION BUS → Quality Control → Spatial Alignment → Normalized Store",
            ha="center", fontsize=7.5, color=BLUE_DARK, style="italic")

    # ── Layer 2 — Physics Engine ───────────────────────────────────────────
    boxes_L2 = [
        ("PySTEPS\nRainfall\nNowcasting", 3.0, 4.3, BLUE_LIGHT),
        ("DEM\nProcessing\n& Terrain", 6.0, 4.3, TEAL),
        ("Drainage\nGraph\n(NetworkX)", 9.0, 4.3, BLUE_MID),
        ("River/Dam\nBoundary\nCondition", 12.5, 4.3, "#5E35B1"),
        ("EPA SWMM\n1D Hydraulic\nSimulator", 4.5, 3.2, ACCENT_RED),
        ("LISFLOOD-FP\n2D Surface\nModel", 8.5, 3.2, ACCENT_RED),
    ]
    for label, x, y, fc in boxes_L2:
        flow_box(ax, label, x, y, w=2.4, h=0.75, fc=fc, fontsize=7)
    # coupling arrow
    ax.annotate("", xy=(6.2, 3.2), xytext=(5.7, 3.2),
                arrowprops=dict(arrowstyle="<->", color=ACCENT_RED, lw=2))
    ax.text(6.0, 2.88, "Coupled 1D/2D\nExchange", ha="center", fontsize=6.5,
            color=ACCENT_RED, fontweight="bold")

    # ── Layer 3 — AI & Intelligence ───────────────────────────────────────
    boxes_L3 = [
        ("GNN\nSurrogate\nEngine", 3.5, 7.0, "#1A237E"),
        ("Drainage\nAnomaly\nEngine", 7.0, 7.0, "#4A148C"),
        ("Confidence\n& Uncertainty\nEngine", 10.5, 7.0, "#880E4F"),
        ("Time-to-Flood\nEngine", 14.0, 7.0, TEAL),
        ("Flood Impact\nMetrics", 3.5, 6.0, BLUE_MID),
        ("Risk\nClassification", 7.0, 6.0, ACCENT_AMB),
        ("What-if\nSimulation", 10.5, 6.0, ACCENT_GRN),
    ]
    for label, x, y, fc in boxes_L3:
        flow_box(ax, label, x, y, w=2.4, h=0.6, fc=fc, fontsize=7)

    # ── Layer 4 — Outputs ─────────────────────────────────────────────────
    boxes_L4 = [
        ("GIS\nDashboard\n(MapLibre)", 2.5, 9.2, TEAL),
        ("Flood-Safe\nRouting\n(OSRM)", 6.0, 9.2, BLUE_LIGHT),
        ("Shelter\nEngine", 9.5, 9.2, ACCENT_GRN),
        ("Municipal\nCommand\nCenter", 13.0, 9.2, BLUE_DARK),
        ("Historical\nReplay &\nValidation", 2.5, 8.3, GREY_MED),
        ("Alert &\nWarning\nSystem", 6.0, 8.3, ACCENT_AMB),
        ("Scenario\nSimulation", 9.5, 8.3, "#5E35B1"),
        ("API\nGateway", 13.0, 8.3, BLUE_MID),
    ]
    for label, x, y, fc in boxes_L4:
        flow_box(ax, label, x, y, w=2.3, h=0.65, fc=fc, fontsize=7)

    # ── Layer 5 — Citizen & Emergency ──────────────────────────────────────
    boxes_L5 = [
        ("Citizen\nPWA", 3.0, 10.55, TEAL_LIGHT),
        ("SOS &\nRescue", 6.5, 10.55, ACCENT_RED),
        ("Rescue\nDispatch", 10.0, 10.55, "#E65100"),
        ("Offline\nSOS Queue", 13.5, 10.55, GREY_MED),
    ]
    for label, x, y, fc in boxes_L5:
        flow_box(ax, label, x, y, w=2.2, h=0.55, fc=fc, fontsize=7)

    # title
    ax.text(8, 10.96, "HYDROGRAPH — SYSTEM ARCHITECTURE OVERVIEW",
            ha="center", fontsize=11, fontweight="bold", color=BLUE_DARK)
    fig.tight_layout(pad=0.2)
    return save_fig("diag_01_system_arch.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 2 — DATA INGESTION WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────

def diag_data_ingestion():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 2: Data Ingestion & Quality Control Workflow",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    sources = [("Radar\n(IMD)", 1.5, TEAL),
               ("River/Dam\n(CWC)", 4.0, BLUE_LIGHT),
               ("GIS/DEM", 6.5, BLUE_MID),
               ("Telemetry\n(optional)", 9.0, "#5E35B1"),
               ("Citizen\nReport", 11.5, ACCENT_AMB)]

    for label, x, fc in sources:
        flow_box(ax, label, x, 6.3, w=2.0, h=0.7, fc=fc)
        flow_box(ax, "Source\nAdapter", x, 5.4, w=2.0, h=0.6, fc=GREY_MED, textcolor=BLACK)
        arrow_down(ax, x, 5.95, 5.72)

    # converge to pipeline
    for _, x, _ in sources:
        ax.annotate("", xy=(7.0, 4.55), xytext=(x, 5.1),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2,
                                   connectionstyle="arc3,rad=0.0"))

    pipeline = [
        ("Schema Validation", 4.4, BLUE_MID),
        ("Timestamp Validation", 4.4, BLUE_MID),
        ("Coordinate Validation", 4.4, BLUE_MID),
        ("Data Quality Control", 4.4, BLUE_LIGHT),
        ("Spatial Alignment → UTM", 4.4, TEAL),
        ("Feature Extraction", 4.4, TEAL),
        ("Normalized Data Store\n(PostGIS)", 4.4, ACCENT_GRN),
    ]
    y = 4.4
    for label, w, fc in pipeline:
        flow_box(ax, label, 7.0, y, w=w, h=0.48, fc=fc)
        if y > 0.9:
            arrow_down(ax, 7.0, y - 0.24, y - 0.56)
        y -= 0.65

    # quality badge
    flow_box(ax, "Data Quality Score\nGOOD / MODERATE / POOR", 11.8, 2.8,
             w=2.8, h=0.7, fc=ACCENT_AMB, fontsize=8)
    ax.annotate("", xy=(11.0, 2.9), xytext=(9.3, 2.9),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_AMB, lw=1.5))
    ax.text(10.1, 2.65, "Quality\nReport", ha="center", fontsize=7, color=ACCENT_AMB)

    return save_fig("diag_02_ingestion.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 3 — RADAR NOWCASTING
# ─────────────────────────────────────────────────────────────────────────────

def diag_nowcasting():
    fig, ax = plt.subplots(figsize=(10, 9))
    ax.set_xlim(0, 10); ax.set_ylim(0, 9); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 3: Radar Rainfall Nowcasting Pipeline (PySTEPS)",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Radar t-30 min", 2.0), ("Radar t-20 min", 4.0),
              ("Radar t-10 min", 6.0), ("Radar t (current)", 8.0)]
    for label, x in inputs:
        flow_box(ax, label, x, 8.3, w=1.8, h=0.55, fc=TEAL, fontsize=7.5)
        ax.annotate("", xy=(5.0, 7.45), xytext=(x, 8.02),
                    arrowprops=dict(arrowstyle="-|>", color=TEAL, lw=1.2,
                                   connectionstyle="arc3,rad=0.0"))

    steps = ["Preprocessing &\nNoise Handling",
             "Z-R Conversion\n(configurable)",
             "Optical-Flow Estimation\n(Lucas-Kanade / DARTS)",
             "Storm-Cell Motion\nField",
             "Extrapolation",
             "Ensemble Generation\n(multiple realisations)",
             "0–3 h Rainfall Nowcast\n(probabilistic)"]
    y = 7.25
    for step in steps:
        flow_box(ax, step, 5.0, y, w=4.0, h=0.5, fc=BLUE_MID)
        if y > 0.9:
            arrow_down(ax, 5.0, y - 0.25, y - 0.6)
        y -= 0.75

    # output timeline
    times = ["+15m", "+30m", "+45m", "+60m", "+90m", "+120m", "+180m"]
    for i, t in enumerate(times):
        bx = 0.8 + i * 1.25
        flow_box(ax, t, bx, 0.38, w=1.1, h=0.42, fc=ACCENT_AMB, fontsize=7.5)
    ax.text(5.0, 0.75, "← Forecast Horizon (uncertainty increases →)",
            ha="center", fontsize=7.5, color=BLUE_DARK, style="italic")

    return save_fig("diag_03_nowcasting.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 4 — CLOUDBURST DETECTION
# ─────────────────────────────────────────────────────────────────────────────

def diag_cloudburst():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 4: Cloudburst / Flash-Flood Detection Module",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Rainfall\nIntensity", 1.5),
              ("Accumulation\nRate", 3.5),
              ("Intensity\nAcceleration", 5.5),
              ("Storm-Cell\nConcentration", 7.5),
              ("Cell\nPersistence", 9.2)]
    for label, x in inputs[:-1]:
        flow_box(ax, label, x, 5.3, w=1.7, h=0.65, fc=TEAL, fontsize=7.5)
    flow_box(ax, inputs[-1][0], inputs[-1][1], 5.3, w=1.7, h=0.65, fc=TEAL, fontsize=7.5)

    for _, x in inputs:
        ax.annotate("", xy=(5.0, 4.35), xytext=(x, 4.97),
                    arrowprops=dict(arrowstyle="-|>", color=TEAL, lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Extreme-Rainfall\nDetector", 5.0, 4.05, w=3.5, h=0.5, fc=ACCENT_RED)
    arrow_down(ax, 5.0, 3.80, 3.35)

    outputs = [("Normal\nRainfall", 1.5, ACCENT_GRN),
               ("Heavy Rain\nAlert", 3.5, ACCENT_AMB),
               ("Extreme\nRain Alert", 6.5, "#E65100"),
               ("Flash-Flood\nRisk", 8.5, ACCENT_RED)]
    for label, x, fc in outputs:
        flow_box(ax, label, x, 2.95, w=1.7, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(x, 3.27), xytext=(5.0, 3.35),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.1))

    ax.text(5.0, 2.25,
            "Note: System provides earliest reliable warning from radar evidence.\n"
            "Cloudburst predictability has inherent limits — uncertainty is always shown.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic",
            bbox=dict(fc="#FFF9C4", ec=ACCENT_AMB, boxstyle="round,pad=0.3"))
    return save_fig("diag_04_cloudburst.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 5 — RIVER/DAM WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────

def diag_river_dam():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 5: River & Dam Flood Workflow",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    sources = [("River Stage\n& Discharge", 2.0), ("Reservoir\nLevel", 4.5),
               ("Dam Discharge\n/ Release", 7.0), ("Official\nFlood Forecast", 9.2)]
    for label, x in sources:
        flow_box(ax, label, x, 6.3, w=2.0, h=0.65, fc="#5E35B1", fontsize=7.5)
        ax.annotate("", xy=(5.0, 5.45), xytext=(x, 5.97),
                    arrowprops=dict(arrowstyle="-|>", color="#5E35B1", lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    pipeline = [
        "CWC Data Validation",
        "Upstream Hydrograph\nConstruction",
        "Boundary Condition\nfor Urban Domain",
        "River Flood Propagation",
        "Urban Inundation\nInteraction",
        "Street / Building\nImpact Assessment",
    ]
    y = 5.2
    for step in pipeline:
        flow_box(ax, step, 5.0, y, w=4.2, h=0.48, fc=BLUE_MID if y > 3 else TEAL)
        if y > 1.2:
            arrow_down(ax, 5.0, y - 0.24, y - 0.6)
        y -= 0.7

    # attribution box
    flow_box(ax, "Flood Source Attribution\n(Rainfall / River / Dam / Combined)",
             5.0, 0.6, w=5.5, h=0.65, fc=ACCENT_AMB, fontsize=8)
    ax.text(5.0, 0.15,
            "Note: System consumes authoritative upstream hydrological information.\n"
            "It does NOT predict dam-release decisions.",
            ha="center", fontsize=7.5, color=BLUE_DARK, style="italic")
    return save_fig("diag_05_river_dam.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 6 — DEM PROCESSING
# ─────────────────────────────────────────────────────────────────────────────

def diag_dem():
    fig, ax = plt.subplots(figsize=(9, 8))
    ax.set_xlim(0, 9); ax.set_ylim(0, 8); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 6: DEM Processing Pipeline",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)
    steps = [
        ("Raw DEM / DTM Input", TEAL),
        ("CRS Projection → Local UTM", BLUE_MID),
        ("Resampling (target resolution)", BLUE_MID),
        ("Void / NoData Filling", BLUE_LIGHT),
        ("Hydrological Conditioning\n(Pit Removal, Burning Drains)", ACCENT_AMB),
        ("Slope & Aspect Calculation", BLUE_LIGHT),
        ("Flow Direction (D8 / MFD)", BLUE_LIGHT),
        ("Flow Accumulation", BLUE_LIGHT),
        ("Depression Identification", ACCENT_RED),
        ("Surface Flow Terrain Model", ACCENT_GRN),
    ]
    y = 7.4
    for label, fc in steps:
        flow_box(ax, label, 4.5, y, w=5.0, h=0.48, fc=fc)
        if y > 0.8:
            arrow_down(ax, 4.5, y - 0.24, y - 0.55)
        y -= 0.68
    ax.text(4.5, 0.2,
            "Note: 2 m resolution only where suitable data are available for the pilot zone.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic")
    return save_fig("diag_06_dem.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 7 — DRAINAGE GRAPH
# ─────────────────────────────────────────────────────────────────────────────

def diag_drainage_graph():
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 12); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 7: Stormwater Drainage Directed Graph Structure",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    nodes = {
        "I1": (1.5, 5.0, "Inlet\nI-1", "#26C6DA"),
        "I2": (4.0, 5.0, "Inlet\nI-2", "#26C6DA"),
        "I3": (6.5, 5.0, "Inlet\nI-3", "#26C6DA"),
        "M1": (1.5, 3.5, "Manhole\nN-1", BLUE_LIGHT),
        "M2": (4.0, 3.5, "Manhole\nN-2", BLUE_LIGHT),
        "M3": (6.5, 3.5, "Manhole\nN-3", BLUE_LIGHT),
        "J1": (3.2, 2.2, "Junction\nJ-1", BLUE_MID),
        "J2": (6.0, 2.2, "Junction\nJ-2", BLUE_MID),
        "S1": (4.8, 1.1, "Storage\nS-1", "#5E35B1"),
        "OF": (4.8, 0.1, "OUTFALL", TEAL),
    }
    edges = [
        ("I1","M1"), ("I2","M2"), ("I3","M3"),
        ("M1","J1"), ("M2","J1"), ("M3","J2"),
        ("J1","S1"), ("J2","S1"), ("S1","OF")
    ]

    for nid, (x, y, label, fc) in nodes.items():
        circ = plt.Circle((x, y), 0.35, fc=hex2rgb(fc), ec=hex2rgb(BLUE_DARK),
                           linewidth=1.5, zorder=3)
        ax.add_patch(circ)
        ax.text(x, y, label, ha="center", va="center", fontsize=7,
                fontweight="bold", color="white", zorder=4, multialignment="center")

    for fr, to in edges:
        x1, y1 = nodes[fr][0], nodes[fr][1]
        x2, y2 = nodes[to][0], nodes[to][1]
        ax.annotate("", xy=(x2, y2 + 0.38), xytext=(x1, y1 - 0.38),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_MID,
                                   lw=2.0, mutation_scale=14), zorder=2)

    # pipe labels
    pipe_labels = [("P1 — 600mm", 1.5, 4.25), ("P2 — 600mm", 4.0, 4.25),
                   ("P3 — 600mm", 6.5, 4.25), ("C1 — 900mm", 2.3, 2.85),
                   ("C2 — 900mm", 5.2, 2.85), ("Main — 1200mm", 4.8, 1.65)]
    for label, x, y in pipe_labels:
        ax.text(x, y, label, ha="center", fontsize=6.5, color=BLUE_DARK, style="italic")

    # legend
    for fc, label in [(TEAL, "Outfall"), (BLUE_MID, "Junction/Manhole"),
                      ("#26C6DA", "Inlet"), ("#5E35B1", "Storage Node")]:
        ax.plot([], [], "o", color=fc, markersize=10, label=label)
    ax.legend(loc="lower right", fontsize=8, title="Node Type")
    return save_fig("diag_07_drainage.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 8 — SURFACE/DRAINAGE COUPLING
# ─────────────────────────────────────────────────────────────────────────────

def diag_coupling():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 8: 1D/2D Surface–Drainage Coupling (Central Technical Differentiator)",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    # Normal flow path (left)
    ax.text(3.5, 6.7, "NORMAL FLOW PATH", ha="center", fontsize=9,
            fontweight="bold", color=ACCENT_GRN)
    normal = ["Rainfall", "Surface Runoff", "Street / Road", "Drain Inlet",
              "SWMM 1D\nDrainage Network", "Pipe Capacity OK", "Outfall → River/Canal"]
    column_flow(ax, normal, 3.5, 6.3, step=0.82, fc=TEAL, w=2.6)

    # Overloaded path (right)
    ax.text(10.5, 6.7, "CAPACITY-EXCEEDED PATH", ha="center", fontsize=9,
            fontweight="bold", color=ACCENT_RED)
    overloaded = ["Rainfall", "Surface Runoff", "Street / Road", "Drain Inlet",
                  "SWMM 1D\nDrainage Network", "Capacity Exceeded\n(Surcharge)", "Backflow /\nNode Flooding",
                  "Surface Flooding\n(LISFLOOD-FP 2D)"]
    column_flow(ax, overloaded, 10.5, 6.3, step=0.72, fc=ACCENT_RED, w=2.6)

    # Coupling exchange
    ax.annotate("", xy=(7.2, 3.3), xytext=(5.9, 3.3),
                arrowprops=dict(arrowstyle="<->", color=BLUE_DARK, lw=2.5, mutation_scale=16))
    ax.text(7.0, 3.05, "Coupling\nTimestep\n(1–5 min)", ha="center", fontsize=7.5,
            color=BLUE_DARK, fontweight="bold")

    # boxes
    flow_box(ax, "1D Domain\n(SWMM)", 3.5, 2.85, w=2.4, h=0.6, fc=BLUE_MID)
    flow_box(ax, "2D Domain\n(LISFLOOD-FP)", 10.5, 2.85, w=2.4, h=0.6, fc=BLUE_MID)

    ax.text(7.0, 0.35,
            "Data exchanged at each coupling timestep: water head at inlets, surface water depth,\n"
            "inflow/outflow at drainage junctions. Timestep configurable after performance testing.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic",
            bbox=dict(fc="#E3F2FD", ec=BLUE_LIGHT, boxstyle="round,pad=0.3"))
    return save_fig("diag_08_coupling.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 9 — HYDRAULIC SIMULATION WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────

def diag_hydraulic():
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 9: Coupled Hydraulic Simulation Workflow",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Rainfall\nNowcast", 2.0, TEAL), ("DEM / Terrain\nModel", 4.5, BLUE_MID),
              ("Drainage\nGraph", 7.0, BLUE_LIGHT), ("River/Dam\nBoundary", 9.5, "#5E35B1")]
    for label, x, fc in inputs:
        flow_box(ax, label, x, 6.3, w=2.1, h=0.65, fc=fc)
        ax.annotate("", xy=(6.0, 5.35), xytext=(x, 5.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "SWMM 1D\nHydraulic Engine", 4.0, 5.0, w=3.0, h=0.55, fc=ACCENT_RED)
    flow_box(ax, "LISFLOOD-FP 2D\nSurface Solver", 8.0, 5.0, w=3.0, h=0.55, fc=ACCENT_RED)
    ax.annotate("", xy=(6.45, 5.0), xytext=(5.52, 5.0),
                arrowprops=dict(arrowstyle="<->", color=ACCENT_RED, lw=2, mutation_scale=14))

    flow_box(ax, "Coupled Simulation\n(1D + 2D exchange)", 6.0, 4.0, w=4.5, h=0.55, fc=BLUE_DARK)
    arrow_down(ax, 6.0, 4.7, 4.27)

    outputs = [("Water Depth\n(cm)", 1.8, TEAL), ("Flow Velocity\n(m/s)", 4.0, TEAL),
               ("Flood Extent\n(polygon)", 6.2, TEAL), ("Duration\n(min)", 8.4, TEAL),
               ("Drainage\nState", 10.5, TEAL)]
    for label, x, fc in outputs:
        flow_box(ax, label, x, 2.95, w=2.0, h=0.6, fc=fc)
        ax.annotate("", xy=(x, 3.24), xytext=(6.0, 3.72),
                    arrowprops=dict(arrowstyle="-|>", color=TEAL, lw=1.1))
    arrow_down(ax, 6.0, 3.72, 3.24)

    flow_box(ax, "Flood Impact Engine → Confidence → GIS Dashboard",
             6.0, 2.1, w=6.5, h=0.55, fc=ACCENT_GRN)
    return save_fig("diag_09_hydraulic.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 10 — GNN TRAINING
# ─────────────────────────────────────────────────────────────────────────────

def diag_gnn_training():
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.set_xlim(0, 10); ax.set_ylim(0, 8); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 10: Offline Hydraulic Simulation → GNN Training Pipeline",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    scenarios = [("Moderate Rain", 1.5), ("Heavy Rain", 3.5), ("Extreme Rain", 5.5),
                 ("River Rise", 7.5), ("Drain Blockage\nScenario", 9.2)]
    for label, x in scenarios:
        flow_box(ax, label, x, 7.3, w=1.8, h=0.65, fc=TEAL, fontsize=7.5)
        ax.annotate("", xy=(5.0, 6.45), xytext=(x, 6.97),
                    arrowprops=dict(arrowstyle="-|>", color=TEAL, lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    pipeline_left = [
        ("Hydraulic Simulator\n(SWMM + LISFLOOD-FP)", ACCENT_RED),
        ("Flood Simulation\nOutputs", BLUE_MID),
        ("Training Dataset\n(water depth, velocity,\nduration, drainage state)", BLUE_LIGHT),
        ("Graph Construction\n(road/drain/cell nodes + edges)", BLUE_MID),
        ("ST-GNN Training\n(PyTorch Geometric)", "#1A237E"),
        ("Validation vs\nHeld-out Simulations", ACCENT_AMB),
        ("GNN Deployment\n(with fallback)", ACCENT_GRN),
    ]
    y = 6.2
    for label, fc in pipeline_left:
        flow_box(ax, label, 5.0, y, w=4.5, h=0.52, fc=fc)
        if y > 0.6:
            arrow_down(ax, 5.0, y - 0.26, y - 0.65)
        y -= 0.78

    ax.text(5.0, 0.2,
            "⚠  The GNN is not trusted until validated against held-out hydraulic simulations.\n"
            "If GNN accuracy is insufficient, system falls back to hydraulic simulator.",
            ha="center", fontsize=8, color=ACCENT_RED, fontweight="bold",
            bbox=dict(fc="#FFEBEE", ec=ACCENT_RED, boxstyle="round,pad=0.3"))
    return save_fig("diag_10_gnn_training.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 11 — GNN INFERENCE
# ─────────────────────────────────────────────────────────────────────────────

def diag_gnn_inference():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 11: Real-Time GNN Inference Pipeline",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Current Rainfall\n(radar)", 1.5, TEAL),
              ("Drainage State\n(previous step)", 3.8, BLUE_MID),
              ("Terrain Features\n(DEM-derived)", 6.2, BLUE_LIGHT),
              ("River Condition", 8.5, "#5E35B1")]
    for label, x, fc in inputs:
        flow_box(ax, label, x, 6.3, w=2.1, h=0.65, fc=fc)
        ax.annotate("", xy=(5.0, 5.45), xytext=(x, 5.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Spatial-Temporal GNN\n(sub-second inference)", 5.0, 5.1, w=4.5, h=0.55, fc="#1A237E")
    arrow_down(ax, 5.0, 4.82, 4.32)
    flow_box(ax, "Future Inundation Estimates\n(per road/node/cell)", 5.0, 4.0, w=4.5, h=0.55, fc=BLUE_MID)
    arrow_down(ax, 5.0, 3.72, 3.25)
    flow_box(ax, "Confidence Check\n(compare vs physics expected range)", 5.0, 2.95, w=4.5, h=0.55, fc=ACCENT_AMB)

    # branch
    ax.annotate("", xy=(2.5, 2.3), xytext=(4.5, 2.67),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_RED, lw=1.5))
    ax.annotate("", xy=(7.5, 2.3), xytext=(5.5, 2.67),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_GRN, lw=1.5))

    flow_box(ax, "FALLBACK\nHydraulic Simulator", 2.5, 1.95, w=2.8, h=0.6, fc=ACCENT_RED)
    flow_box(ax, "GNN Output\nAccepted", 7.5, 1.95, w=2.8, h=0.6, fc=ACCENT_GRN)

    ax.text(2.5, 2.57, "Low\nconfidence", ha="center", fontsize=7, color=ACCENT_RED)
    ax.text(7.5, 2.57, "High\nconfidence", ha="center", fontsize=7, color=ACCENT_GRN)

    return save_fig("diag_11_gnn_inference.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 12 — DRAINAGE ANOMALY
# ─────────────────────────────────────────────────────────────────────────────

def diag_anomaly():
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 12); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 12: Drainage Anomaly & Capacity-Reduction Engine",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    flow_box(ax, "Physics Model\nPrediction", 2.5, 5.3, w=2.8, h=0.6, fc=BLUE_MID)
    flow_box(ax, "Observed / Reported\nWater Depth", 8.5, 5.3, w=2.8, h=0.6, fc=TEAL)

    ax.annotate("", xy=(5.5, 4.6), xytext=(3.4, 5.0),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))
    ax.annotate("", xy=(6.5, 4.6), xytext=(7.6, 5.0),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))

    flow_box(ax, "Residual\nAnalysis", 6.0, 4.3, w=2.6, h=0.55, fc=ACCENT_AMB)
    arrow_down(ax, 6.0, 4.02, 3.55)
    flow_box(ax, "Persistent Residual\nPattern Detection", 6.0, 3.25, w=2.6, h=0.55, fc=ACCENT_AMB)
    arrow_down(ax, 6.0, 2.97, 2.5)
    flow_box(ax, "Possible Drainage\nAnomaly Detected", 6.0, 2.2, w=2.6, h=0.55, fc=ACCENT_RED)
    arrow_down(ax, 6.0, 1.92, 1.45)

    outputs = [("Blockage /\nSedimentation\nHypothesis", 2.5, "#880E4F"),
               ("Reduced\nCapacity\nEstimate", 5.0, ACCENT_RED),
               ("Confidence\n& Evidence\nSummary", 7.5, ACCENT_AMB),
               ("→ Field\nInspection\nRequest", 10.0, ACCENT_GRN)]
    for label, x, fc in outputs:
        flow_box(ax, label, x, 1.15, w=2.2, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(x, 1.47), xytext=(6.0, 1.45),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.1))

    ax.text(6.0, 0.3,
            "⚠  This is NOT physical detection of underground blockage/damage.\n"
            "Output is an inferred hypothesis requiring field verification.",
            ha="center", fontsize=8, color=ACCENT_RED, fontweight="bold",
            bbox=dict(fc="#FFEBEE", ec=ACCENT_RED, boxstyle="round,pad=0.3"))
    return save_fig("diag_12_anomaly.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 13 — FLOOD IMPACT
# ─────────────────────────────────────────────────────────────────────────────

def diag_flood_impact():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 13: Flood Impact Calculation Engine",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Water Depth", 1.5, TEAL), ("Flow Velocity", 3.5, BLUE_MID),
              ("Flood Duration", 5.5, BLUE_LIGHT), ("Road Criticality", 7.5, BLUE_MID),
              ("Nearby\nFacilities", 9.2, "#5E35B1")]
    for label, x, fc in inputs:
        flow_box(ax, label, x, 5.3, w=1.7, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(5.0, 4.45), xytext=(x, 4.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.1,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Impact Score\nCalculation", 5.0, 4.15, w=3.5, h=0.55, fc=BLUE_DARK)
    arrow_down(ax, 5.0, 3.87, 3.4)

    risk_labels = [("<5cm\nLOW", 1.5, ACCENT_GRN), ("5–15cm\nMODERATE", 3.5, ACCENT_AMB),
                   ("15–30cm\nHIGH", 6.0, "#E65100"), (">30cm\nSEVERE", 8.5, ACCENT_RED)]
    for label, x, fc in risk_labels:
        flow_box(ax, label, x, 3.1, w=1.9, h=0.6, fc=fc)
        ax.annotate("", xy=(x, 3.39), xytext=(5.0, 3.4),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.2))

    arrow_down(ax, 5.0, 2.79, 2.35)
    flow_box(ax, "Time-to-Flood + Depth Timeline\n(per road segment)", 5.0, 2.05, w=5.0, h=0.55, fc=TEAL)
    ax.text(5.0, 0.4,
            "Thresholds are configurable and must be calibrated to local vehicle/road guidance.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic")
    return save_fig("diag_13_impact.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 14 — CONFIDENCE
# ─────────────────────────────────────────────────────────────────────────────

def diag_confidence():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 14: Confidence & Uncertainty Engine",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    factors = [("Radar\nFreshness", 1.2), ("DEM\nQuality", 2.8), ("Drainage\nCoverage", 4.4),
               ("Model\nAgreement", 6.0), ("Historical\nValidation", 7.6), ("Forecast\nLead Time", 9.2)]
    for label, x in factors:
        flow_box(ax, label, x, 5.3, w=1.5, h=0.65, fc=BLUE_LIGHT, fontsize=7.5)
        ax.annotate("", xy=(5.2, 4.45), xytext=(x, 4.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.0,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Confidence Weighting\nEngine", 5.2, 4.15, w=3.5, h=0.55, fc=BLUE_DARK)
    arrow_down(ax, 5.2, 3.87, 3.3)

    # uncertainty range visualization
    x_arr = np.linspace(0.5, 9.5, 100)
    y_base = 2.7
    ax.fill_between(x_arr, y_base - 0.5, y_base + 0.5,
                    alpha=0.2, color=hex2rgb(BLUE_LIGHT), label="Uncertainty range")
    ax.plot(x_arr, [y_base] * len(x_arr), color=hex2rgb(TEAL), lw=2.5, label="Expected value")
    ax.set_xlim(0, 10)
    ax.text(5.2, 2.65, "Expected Value", ha="center", fontsize=8, color=TEAL, fontweight="bold")
    ax.text(5.2, 3.25, "Upper bound", ha="center", fontsize=7.5, color=BLUE_LIGHT)
    ax.text(5.2, 2.05, "Lower bound", ha="center", fontsize=7.5, color=BLUE_LIGHT)
    ax.text(5.2, 3.1, "↑ Uncertainty Increases with Lead Time →",
            ha="center", fontsize=7.5, color=BLUE_DARK, style="italic")

    flow_box(ax, "Output: Depth + Confidence % + Range [lower, upper]\n+ Data Quality Flag",
             5.2, 1.2, w=6.5, h=0.65, fc=ACCENT_GRN, fontsize=8)
    return save_fig("diag_14_confidence.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 15 — ROUTING
# ─────────────────────────────────────────────────────────────────────────────

def diag_routing():
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 12); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 15: Flood-Safe Routing Engine (OSRM + Dynamic Weights)",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs_l = [("Road Network\nGraph", 1.5, BLUE_MID), ("Flood Depth\nPer Road", 4.0, ACCENT_RED),
                ("Risk\nClassification", 6.5, ACCENT_AMB), ("Road\nClosure", 9.0, "#880E4F"),
                ("Emergency\nPriority", 11.0, BLUE_DARK)]
    for label, x, fc in inputs_l:
        flow_box(ax, label, x, 5.3, w=2.0, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(6.0, 4.45), xytext=(x, 4.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.0,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Dynamic Edge-Weight\nCalculation\nCost = Travel Time × Flood Penalty",
             6.0, 4.1, w=4.5, h=0.65, fc=BLUE_DARK)
    arrow_down(ax, 6.0, 3.77, 3.3)
    flow_box(ax, "OSRM Routing Engine", 6.0, 3.0, w=4.0, h=0.55, fc=TEAL)
    arrow_down(ax, 6.0, 2.72, 2.25)

    modes = [("Citizen Mode\nSafety + Time", 2.5, TEAL),
             ("Transit Mode\nSafety + Continuity", 6.0, BLUE_MID),
             ("Emergency Mode\nSafety + Priority", 9.5, ACCENT_RED)]
    for label, x, fc in modes:
        flow_box(ax, label, x, 1.95, w=2.8, h=0.65, fc=fc)
        ax.annotate("", xy=(x, 2.27), xytext=(6.0, 2.25),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.2))

    ax.text(6.0, 0.4,
            "Penalty table: Low ×1 | Moderate ×2 | High ×10 | Severe ∞ (avoid)\n"
            "All penalties configurable by municipal operator.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic")
    return save_fig("diag_15_routing.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 16 — SHELTER SELECTION
# ─────────────────────────────────────────────────────────────────────────────

def diag_shelter():
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_xlim(0, 9); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 16: Smart Shelter Selection Algorithm",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    steps = [
        ("Citizen Location + Situation", BLUE_MID),
        ("Retrieve Candidate Shelters\n(within radius)", BLUE_LIGHT),
        ("Remove Flooded Shelters", ACCENT_RED),
        ("Check Capacity\n(occupancy < max)", ACCENT_AMB),
        ("Check Route Safety\n(flood-safe path available?)", ACCENT_AMB),
        ("Check Accessibility\n(medical, power, food)", BLUE_LIGHT),
        ("Rank Remaining Shelters", TEAL),
        ("Recommend Safest\nOperational Shelter", ACCENT_GRN),
    ]
    y = 6.4
    for label, fc in steps:
        flow_box(ax, label, 4.5, y, w=4.8, h=0.52, fc=fc)
        if y > 1.1:
            arrow_down(ax, 4.5, y - 0.26, y - 0.62)
        y -= 0.73

    # failure case
    flow_box(ax, "No safe shelter available →\nAlert authorities + suggest alternate zone",
             4.5, 0.45, w=5.5, h=0.6, fc=ACCENT_RED, fontsize=7.5)
    return save_fig("diag_16_shelter.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 17 — SOS WORKFLOW
# ─────────────────────────────────────────────────────────────────────────────

def diag_sos():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_xlim(0, 10); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 17: Citizen SOS Workflow",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    steps_main = [
        ("Citizen presses\n'I AM IN DANGER'", ACCENT_RED),
        ("PWA collects: location, people,\nchildren, elderly, medical, depth", BLUE_MID),
        ("SOS queued locally\n(IndexedDB)", BLUE_LIGHT),
        ("Internet available?", ACCENT_AMB),
    ]
    y = 6.4
    for label, fc in steps_main:
        flow_box(ax, label, 5.0, y, w=4.5, h=0.52, fc=fc)
        if y > 5.0:
            arrow_down(ax, 5.0, y - 0.26, y - 0.6)
        y -= 0.7

    # YES branch
    flow_box(ax, "YES → HTTPS/API\nSOS Server", 2.5, 4.75, w=2.4, h=0.52, fc=ACCENT_GRN)
    ax.annotate("", xy=(2.5, 5.06), xytext=(4.3, 5.08),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_GRN, lw=1.3))
    ax.text(3.0, 5.2, "YES", fontsize=8, color=ACCENT_GRN, fontweight="bold")

    # NO branch
    flow_box(ax, "NO → SMS Gateway\nFallback", 7.5, 4.75, w=2.4, h=0.52, fc=ACCENT_AMB)
    ax.annotate("", xy=(7.5, 5.06), xytext=(5.7, 5.08),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_AMB, lw=1.3))
    ax.text(6.8, 5.2, "NO", fontsize=8, color=ACCENT_AMB, fontweight="bold")

    # merge
    for x in [2.5, 7.5]:
        ax.annotate("", xy=(5.0, 4.0), xytext=(x, 4.49),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.0))

    flow_box(ax, "SOS Server — Priority Engine", 5.0, 3.7, w=4.5, h=0.52, fc=BLUE_DARK)
    arrow_down(ax, 5.0, 3.44, 2.97)
    flow_box(ax, "Prioritised SOS Queue\n(people, medical, flood severity)", 5.0, 2.67, w=4.5, h=0.52, fc=BLUE_MID)
    arrow_down(ax, 5.0, 2.41, 1.94)
    flow_box(ax, "Rescue Team Dispatch\n(flood-safe route)", 5.0, 1.64, w=4.5, h=0.52, fc=ACCENT_GRN)

    ax.text(5.0, 0.4,
            "⚠  SOS cannot be transmitted if NO communication medium exists.\n"
            "Offline queue retries automatically when connectivity is restored.",
            ha="center", fontsize=8, color=ACCENT_RED, fontweight="bold",
            bbox=dict(fc="#FFEBEE", ec=ACCENT_RED, boxstyle="round,pad=0.3"))
    return save_fig("diag_17_sos.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 18 — OFFLINE SOS
# ─────────────────────────────────────────────────────────────────────────────

def diag_offline_sos():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 18: Offline SOS — Local Queue & Retry Architecture",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    steps_main = [("SOS Triggered", ACCENT_RED), ("IndexedDB\nLocal Storage", BLUE_MID),
                  ("Network Check\n(periodic retry)", ACCENT_AMB),
                  ("Network Available?", BLUE_LIGHT)]
    y = 5.3
    for label, fc in steps_main:
        flow_box(ax, label, 5.0, y, w=3.5, h=0.52, fc=fc)
        if y > 3.5:
            arrow_down(ax, 5.0, y - 0.26, y - 0.6)
        y -= 0.7

    flow_box(ax, "YES → Transmit SOS\nvia Internet or SMS", 2.5, 3.45, w=2.8, h=0.52, fc=ACCENT_GRN)
    flow_box(ax, "NO → Wait & Retry\n(exponential backoff)", 7.5, 3.45, w=2.8, h=0.52, fc=ACCENT_AMB)

    for x in [2.5, 7.5]:
        ax.annotate("", xy=(x, 3.73), xytext=(5.0, 3.7),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.1))

    ax.annotate("", xy=(2.5, 2.9), xytext=(2.5, 3.19),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT_GRN, lw=1.3))
    flow_box(ax, "SOS Server\nReceives & Processes", 2.5, 2.6, w=2.8, h=0.55, fc=BLUE_DARK)

    # optional peer relay
    peer_rect = plt.Rectangle((6.5, 1.3), 3.0, 1.5, fc="#F3E5F5", ec="#7B1FA2", lw=1.5, ls="--")
    ax.add_patch(peer_rect)
    ax.text(8.0, 2.35, "[OPTIONAL — EXPERIMENTAL]\nBluetooth/Wi-Fi Direct\nPeer Relay Mesh",
            ha="center", va="center", fontsize=7.5, color="#7B1FA2", fontweight="bold",
            multialignment="center")

    ax.text(5.0, 0.4,
            "⚠  If absolutely no communication medium exists, no software-only system can transmit data.",
            ha="center", fontsize=8, color=ACCENT_RED, fontweight="bold",
            bbox=dict(fc="#FFEBEE", ec=ACCENT_RED, boxstyle="round,pad=0.3"))
    return save_fig("diag_18_offline_sos.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 19 — COMMAND CENTER
# ─────────────────────────────────────────────────────────────────────────────

def diag_command_center():
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.set_xlim(0, 12); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 19: Emergency Command Center — Information Flows",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    inputs = [("Live Flood\nMap", 0.8, TEAL), ("SOS\nReports", 2.4, ACCENT_RED),
              ("Rescue Team\nLocations", 4.0, BLUE_MID), ("Shelter\nStatus", 5.6, ACCENT_GRN),
              ("Blocked\nRoads", 7.2, ACCENT_AMB), ("Drain\nAnomalies", 8.8, "#5E35B1"),
              ("Rainfall\n& River", 10.4, BLUE_LIGHT)]
    for label, x, fc in inputs:
        flow_box(ax, label, x, 5.3, w=1.5, h=0.65, fc=fc, fontsize=7)
        ax.annotate("", xy=(6.0, 4.25), xytext=(x, 4.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.0,
                                   connectionstyle="arc3,rad=0.0"))

    flow_box(ax, "Municipal Emergency Command Center\n(Unified Dashboard)", 6.0, 3.95,
             w=6.0, h=0.65, fc=BLUE_DARK, fontsize=9)
    arrow_down(ax, 6.0, 3.62, 3.1)

    actions = [("Create Road\nClosure", 1.5, ACCENT_RED), ("Mark Shelter\nUnavailable", 3.5, ACCENT_AMB),
               ("Assign Rescue\nTeam", 5.5, ACCENT_GRN), ("Publish\nWarning", 7.5, BLUE_MID),
               ("Mark Drain\nfor Inspection", 9.5, "#5E35B1")]
    for label, x, fc in actions:
        flow_box(ax, label, x, 2.8, w=1.9, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(x, 3.12), xytext=(6.0, 3.1),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.1))
    return save_fig("diag_19_command_center.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 20 — CITIZEN TO RESCUE
# ─────────────────────────────────────────────────────────────────────────────

def diag_citizen_rescue():
    fig, ax = plt.subplots(figsize=(9, 10))
    ax.set_xlim(0, 9); ax.set_ylim(0, 10); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 20: Complete Citizen-to-Rescue End-to-End Workflow",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    steps = [
        ("Flood Forecast Generated", BLUE_MID),
        ("Citizen Warning Pushed\n(PWA / SMS)", TEAL),
        ("Citizen Trapped by Flooding", ACCENT_RED),
        ("SOS Activated\n(I AM IN DANGER)", ACCENT_RED),
        ("Location + Details Captured", BLUE_LIGHT),
        ("Priority Score Calculated", ACCENT_AMB),
        ("Nearest Available Rescue Team", ACCENT_GRN),
        ("Flood-Safe Route Calculated", TEAL),
        ("Team Dispatched", ACCENT_GRN),
        ("Rescue Completed", ACCENT_GRN),
        ("Shelter Recommended", TEAL),
        ("Case Closed ✓", ACCENT_GRN),
    ]
    y = 9.4
    for label, fc in steps:
        flow_box(ax, label, 4.5, y, w=5.2, h=0.52, fc=fc)
        if y > 0.5:
            arrow_down(ax, 4.5, y - 0.26, y - 0.62)
        y -= 0.72

    statuses = ["RECEIVED", "VERIFIED", "ASSIGNED", "EN ROUTE", "RESCUED", "CLOSED"]
    for i, s in enumerate(statuses):
        bx = 0.7; by = 9.4 - i * 0.72 * 1.1 - 3.5
        ax.text(1.0, by + 0.1, f"● {s}", fontsize=7, color=BLUE_MID, fontweight="bold")
    return save_fig("diag_20_citizen_rescue.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 21 — WHAT-IF SCENARIO
# ─────────────────────────────────────────────────────────────────────────────

def diag_what_if():
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10); ax.set_ylim(0, 6); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 21: What-If Scenario Simulation Engine",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    flow_box(ax, "Baseline Flood Simulation", 5.0, 5.4, w=4.5, h=0.55, fc=BLUE_MID)
    arrow_down(ax, 5.0, 5.12, 4.65)
    flow_box(ax, "Operator Selects Scenario", 5.0, 4.35, w=4.5, h=0.55, fc=BLUE_DARK)
    arrow_down(ax, 5.0, 4.07, 3.6)

    scenarios = [("Rainfall\n+10/+20/+50%", 1.5, TEAL), ("Drain Capacity\n100/75/50/25%", 3.8, ACCENT_AMB),
                 ("River Level\nNormal→Extreme", 6.2, BLUE_LIGHT), ("Road\nOpen/Closed", 8.5, "#5E35B1")]
    for label, x, fc in scenarios:
        flow_box(ax, label, x, 3.3, w=2.0, h=0.65, fc=fc, fontsize=7.5)
        ax.annotate("", xy=(x, 3.62), xytext=(5.0, 3.6),
                    arrowprops=dict(arrowstyle="-|>", color=fc, lw=1.2))

    for x in [1.5, 3.8, 6.2, 8.5]:
        ax.annotate("", xy=(5.0, 2.45), xytext=(x, 2.97),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.1))

    flow_box(ax, "Run Scenario Simulation", 5.0, 2.15, w=4.5, h=0.55, fc=BLUE_MID)
    arrow_down(ax, 5.0, 1.87, 1.4)
    flow_box(ax, "Compare: Depth | Extent | Time-to-Flood\nAffected Roads / Buildings / Shelters",
             5.0, 1.1, w=5.5, h=0.65, fc=TEAL)
    return save_fig("diag_21_whatif.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 22 — HISTORICAL REPLAY
# ─────────────────────────────────────────────────────────────────────────────

def diag_historical():
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.set_xlim(0, 9); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 22: Historical Event Replay & Validation",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    steps = [("Historical Rainfall Event\n(IMD Archive)", TEAL),
             ("Replay Rainfall Timeline\n(T, T+15, T+30, ...)", BLUE_MID),
             ("Run HydroGraph Model", BLUE_DARK),
             ("Generate Predicted Flood\nProgression", BLUE_LIGHT),
             ("Compare vs Observed\nFlooding (reports/photos)", ACCENT_AMB),
             ("Compute Accuracy Metrics\n(F1, MAE, IoU, timing error)", ACCENT_GRN)]
    y = 6.4
    for label, fc in steps:
        flow_box(ax, label, 4.5, y, w=5.0, h=0.52, fc=fc)
        if y > 1.1:
            arrow_down(ax, 4.5, y - 0.26, y - 0.6)
        y -= 0.72

    # animation timeline
    times = ["10:00", "10:15", "10:30", "10:45", "11:00", "11:30"]
    for i, t in enumerate(times):
        bx = 0.8 + i * 1.4
        col = hex2rgb(ACCENT_RED) if i > 2 else hex2rgb(ACCENT_AMB)
        rect = plt.Rectangle((bx - 0.5, 0.2), 1.0, 0.5, fc=col, ec="grey", lw=0.8)
        ax.add_patch(rect)
        ax.text(bx, 0.45, t, ha="center", va="center", fontsize=7.5,
                color="white", fontweight="bold")

    ax.text(4.5, 0.1, "← Flood Expansion Timeline →",
            ha="center", fontsize=7.5, color=BLUE_DARK, style="italic")
    return save_fig("diag_22_historical.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 23 — FAIL-SAFE
# ─────────────────────────────────────────────────────────────────────────────

def diag_failsafe():
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 23: Fail-Safe Degradation Architecture",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    failures = [
        ("GNN Failure", "→ Hydraulic\nSimulator Fallback", ACCENT_RED, ACCENT_GRN, 2.0),
        ("Radar Unavailable", "→ Latest Valid Data\n+ Uncertainty Increase", ACCENT_AMB, TEAL, 4.5),
        ("Routing Failure", "→ Internal\nGraph Routing", BLUE_DARK, BLUE_MID, 7.0),
        ("Internet Down\n(SOS)", "→ Offline Queue\n+ SMS Fallback", "#7B1FA2", ACCENT_AMB, 9.5),
        ("Drain Data\nIncomplete", "→ Model Runs\nLower Confidence", BLUE_LIGHT, BLUE_MID, 11.5),
    ]

    for fail_label, fallback_label, fc_fail, fc_fallback, x in failures:
        flow_box(ax, fail_label, x, 6.0, w=2.0, h=0.65, fc=fc_fail, fontsize=7.5)
        arrow_down(ax, x, 5.67, 5.0)
        flow_box(ax, "⚠ DETECTED", x, 4.7, w=2.0, h=0.45, fc=ACCENT_AMB, fontsize=7)
        arrow_down(ax, x, 4.47, 3.9)
        flow_box(ax, fallback_label, x, 3.6, w=2.0, h=0.65, fc=fc_fallback, fontsize=7.5)
        arrow_down(ax, x, 3.27, 2.7)
        flow_box(ax, "DEGRADED\nOPERATION\n(Transparent)", x, 2.4, w=2.0, h=0.65,
                 fc=BLUE_MID, fontsize=7)

    flow_box(ax, "System Health: GREEN / YELLOW / RED\n(Observability Dashboard)",
             6.0, 1.0, w=7.0, h=0.65, fc=ACCENT_GRN)
    ax.text(6.0, 0.25,
            "All degradations are surfaced to the operator. No silent failure.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic")
    return save_fig("diag_23_failsafe.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 24 — DEPLOYMENT ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────────────

def diag_deployment():
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12); ax.set_ylim(0, 7); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 24: Docker-Based Deployment Architecture",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    services = [
        ("Browser / PWA\n(React + MapLibre)", 2.0, 6.2, "#26C6DA"),
        ("FastAPI\nBackend", 2.0, 5.2, BLUE_MID),
        ("Redis\nCache/Queue", 5.5, 5.2, ACCENT_AMB),
        ("Celery/RQ\nWorkers", 5.5, 4.2, BLUE_LIGHT),
        ("PostgreSQL\n+ PostGIS", 2.0, 4.2, TEAL),
        ("EPA SWMM\nEngine", 9.0, 6.2, ACCENT_RED),
        ("LISFLOOD\nEngine", 9.0, 5.2, ACCENT_RED),
        ("GNN Service\n(PyTorch)", 9.0, 4.2, "#1A237E"),
        ("OSRM\nRouting", 9.0, 3.2, TEAL),
        ("Object Storage\n(Raster/NetCDF)", 2.0, 3.2, GREY_MED),
    ]
    for label, x, y, fc in services:
        flow_box(ax, label, x, y, w=2.5, h=0.65, fc=fc, fontsize=7.5)

    # Docker boundary
    docker_rect = plt.Rectangle((0.3, 2.7), 11.4, 4.2, fc="none", ec=BLUE_DARK,
                                  linewidth=2.0, ls="--")
    ax.add_patch(docker_rect)
    ax.text(0.5, 6.65, "Docker Compose Environment", fontsize=8,
            color=BLUE_DARK, fontweight="bold")

    # connections
    connections = [(2.0, 5.87, 2.0, 5.52), (2.0, 4.87, 2.0, 4.52),
                   (3.25, 5.2, 4.25, 5.2), (5.5, 4.87, 5.5, 4.52),
                   (2.0, 3.87, 2.0, 3.52), (3.25, 4.2, 4.25, 4.2)]
    for x1, y1, x2, y2 in connections:
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))

    # API gateway
    flow_box(ax, "API Gateway\n(nginx)", 5.5, 6.2, w=2.5, h=0.65, fc=BLUE_DARK)
    ax.annotate("", xy=(3.25, 6.2), xytext=(4.25, 6.2),
                arrowprops=dict(arrowstyle="<->", color=BLUE_DARK, lw=1.2))
    ax.annotate("", xy=(7.75, 6.2), xytext=(6.75, 6.2),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))
    ax.annotate("", xy=(7.75, 5.2), xytext=(6.75, 5.2),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))
    ax.annotate("", xy=(7.75, 4.2), xytext=(6.75, 4.2),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))
    ax.annotate("", xy=(7.75, 3.2), xytext=(6.75, 3.2),
                arrowprops=dict(arrowstyle="-|>", color=BLUE_DARK, lw=1.2))

    ax.text(6.0, 0.4, "All services containerised with Docker. MVP uses Docker Compose.",
            ha="center", fontsize=8, color=BLUE_DARK, style="italic")
    return save_fig("diag_24_deployment.png")


# ─────────────────────────────────────────────────────────────────────────────
#  DIAGRAM 25 — ER DIAGRAM
# ─────────────────────────────────────────────────────────────────────────────

def diag_er():
    fig, ax = plt.subplots(figsize=(16, 10))
    ax.set_xlim(0, 16); ax.set_ylim(0, 10); ax.axis("off")
    fig.patch.set_facecolor("white")
    ax.set_title("Figure 25: Database Entity-Relationship Diagram",
                 fontsize=11, fontweight="bold", color=BLUE_DARK, pad=8)

    tables = {
        "users":           (0.4, 8.5, ["id", "name", "role", "phone"]),
        "roads":           (0.4, 6.5, ["id", "geometry", "road_class", "criticality", "status"]),
        "drain_nodes":     (0.4, 4.5, ["id", "geometry", "node_type", "elevation", "capacity"]),
        "drain_edges":     (0.4, 2.5, ["id", "from_node", "to_node", "diameter", "slope", "capacity"]),
        "rainfall_obs":    (5.5, 9.0, ["id", "timestamp", "geometry", "intensity", "source", "quality"]),
        "rainfall_fcst":   (5.5, 7.2, ["id", "forecast_time", "valid_time", "rainfall", "confidence"]),
        "flood_fcst":      (5.5, 5.2, ["id", "road_id", "valid_time", "depth", "velocity", "risk", "confidence"]),
        "drain_anomalies": (5.5, 3.2, ["id", "asset_id", "anomaly_type", "est_capacity", "confidence"]),
        "shelters":        (5.5, 1.2, ["id", "geometry", "capacity", "occupancy", "status", "medical"]),
        "sos_reports":     (11.0, 8.5, ["id", "location", "timestamp", "people", "medical", "priority", "status"]),
        "rescue_teams":    (11.0, 6.5, ["id", "location", "team_type", "availability", "status"]),
        "simulations":     (11.0, 4.5, ["id", "scenario", "rainfall", "drainage", "result", "created_at"]),
    }

    def draw_table(ax, name, x, y, fields):
        w = 4.0; row_h = 0.28
        header_h = 0.38
        total_h = header_h + len(fields) * row_h
        # header
        header = plt.Rectangle((x, y - header_h), w, header_h,
                                 fc=hex2rgb(BLUE_MID), ec=hex2rgb(BLUE_DARK), lw=1.2)
        ax.add_patch(header)
        ax.text(x + w/2, y - header_h/2, name.upper(), ha="center", va="center",
                fontsize=7.5, fontweight="bold", color="white")
        # rows
        for i, field in enumerate(fields):
            by = y - header_h - (i + 1) * row_h
            bg = hex2rgb("#E3F2FD") if i % 2 == 0 else "white"
            row = plt.Rectangle((x, by), w, row_h, fc=bg, ec=hex2rgb(GREY_MED), lw=0.5)
            ax.add_patch(row)
            ax.text(x + 0.1, by + row_h/2, ("PK  " if field == "id" else "    ") + field,
                    va="center", fontsize=6.5, color=BLACK)
        return x + w/2, y - header_h/2, x + w/2, y - total_h

    centers = {}
    for name, (x, y, fields) in tables.items():
        cx, cy, _, _ = draw_table(ax, name, x, y, fields)
        centers[name] = (cx, y - 0.19)

    # relationships
    rels = [("flood_fcst", "roads"), ("flood_fcst", "rainfall_fcst"),
            ("drain_anomalies", "drain_nodes"), ("sos_reports", "rescue_teams"),
            ("drain_edges", "drain_nodes")]
    for a, b in rels:
        ax.annotate("", xy=centers[b], xytext=centers[a],
                    arrowprops=dict(arrowstyle="-", color=GREY_MED, lw=1.0,
                                   connectionstyle="arc3,rad=0.0"))
    return save_fig("diag_25_er.png")


# ─────────────────────────────────────────────────────────────────────────────
#  UI MOCKUPS
# ─────────────────────────────────────────────────────────────────────────────

def ui_command_center():
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor(hex2rgb(BG_HEADER))

    # header bar
    header = plt.axes([0, 0.93, 1, 0.07])
    header.set_facecolor(hex2rgb(BLUE_DARK)); header.axis("off")
    header.text(0.01, 0.5, "🌊  HYDROGRAPH", color="white", fontsize=14,
                fontweight="bold", va="center")
    header.text(0.5, 0.5, "MUNICIPAL EMERGENCY COMMAND CENTER", color="white",
                fontsize=12, fontweight="bold", va="center", ha="center")
    header.text(0.85, 0.7, "⚠  FLOOD ALERT ACTIVE", color=hex2rgb(ACCENT_AMB),
                fontsize=10, fontweight="bold", va="center")
    header.text(0.85, 0.3, "24 Aug 2026  |  22:30 IST", color=hex2rgb(GREY_MED),
                fontsize=8, va="center")

    # sidebar
    sidebar = plt.axes([0, 0.0, 0.18, 0.93])
    sidebar.set_facecolor(hex2rgb("#0A1929")); sidebar.axis("off")
    sidebar.text(0.5, 0.97, "LIVE METRICS", color="white", fontsize=9,
                 fontweight="bold", ha="center", va="top")
    metrics = [("CRITICAL ROADS", "12", ACCENT_RED), ("HIGH RISK", "28", "#E65100"),
               ("MODERATE", "47", ACCENT_AMB), ("SOS ACTIVE", "6", ACCENT_RED),
               ("RESCUE TEAMS", "8", ACCENT_GRN), ("SHELTERS OK", "14", ACCENT_GRN),
               ("RAINFALL", "78 mm/hr", TEAL), ("DRAIN UTIL.", "92%", ACCENT_AMB)]
    y = 0.90
    for label, val, col in metrics:
        sidebar.text(0.1, y, label, color=hex2rgb(GREY_MED), fontsize=7.5)
        sidebar.text(0.5, y - 0.028, val, color=hex2rgb(col), fontsize=11,
                     fontweight="bold", ha="center")
        y -= 0.095

    # map area (simulated)
    mapax = plt.axes([0.18, 0.35, 0.56, 0.58])
    mapax.set_facecolor("#1A2940")
    mapax.set_xlim(0, 10); mapax.set_ylim(0, 8)
    mapax.set_xticks([]); mapax.set_yticks([])
    for _ in range(18):
        x1, y1 = np.random.uniform(0, 9), np.random.uniform(0, 7)
        x2, y2 = x1 + np.random.uniform(-2, 2), y1 + np.random.uniform(-2, 2)
        mapax.plot([x1, x2], [y1, y2], color="#2A4060", lw=1.2, alpha=0.7)
    # flood overlay
    flood_x = [3, 4.5, 5, 4, 3.2]
    flood_y = [3, 2.5, 4, 5, 4]
    mapax.fill(flood_x, flood_y, color=hex2rgb(ACCENT_RED), alpha=0.5)
    mapax.fill([6, 7.5, 7, 6.5], [5, 4.5, 6, 6], color=hex2rgb(ACCENT_AMB), alpha=0.4)
    # SOS markers
    mapax.scatter([4, 6.8], [4, 5.2], c=hex2rgb(ACCENT_RED), s=120, marker="*",
                  zorder=5, label="SOS")
    mapax.scatter([2, 8], [6, 2], c=hex2rgb(ACCENT_GRN), s=80, marker="^",
                  zorder=5, label="Rescue Team")
    mapax.legend(loc="upper left", facecolor="#0D2B45", labelcolor="white",
                 fontsize=8, edgecolor="none")
    mapax.set_title("Live Flood Map — Pilot Zone", color="white", fontsize=9, pad=4)

    # time slider
    sliderax = plt.axes([0.18, 0.27, 0.56, 0.06])
    sliderax.set_facecolor(hex2rgb("#0A1929")); sliderax.axis("off")
    times = ["NOW", "+15m", "+30m", "+45m", "+60m", "+90m", "+120m", "+180m"]
    for i, t in enumerate(times):
        fc = hex2rgb(TEAL) if i == 0 else hex2rgb("#1A2940")
        rect = plt.Rectangle((i/8, 0.1), 0.11, 0.8, fc=fc, ec="grey", lw=0.5,
                               transform=sliderax.transAxes)
        sliderax.add_patch(rect)
        sliderax.text(i/8 + 0.055, 0.5, t, ha="center", va="center",
                      color="white", fontsize=7.5, transform=sliderax.transAxes,
                      fontweight="bold" if i == 0 else "normal")

    # hotspot panel
    hotax = plt.axes([0.75, 0.35, 0.24, 0.58])
    hotax.set_facecolor(hex2rgb("#0A1929")); hotax.axis("off")
    hotax.text(0.5, 0.97, "TOP FLOOD HOTSPOTS", color="white", fontsize=9,
               fontweight="bold", ha="center", va="top")
    hotspots = [("1. Station Rd, MH-12", "38 cm", ACCENT_RED),
                ("2. Market Junction", "29 cm", ACCENT_RED),
                ("3. Bridge Rd", "24 cm", "#E65100"),
                ("4. East Colony Ave", "17 cm", ACCENT_AMB),
                ("5. Sector 5 Main", "12 cm", ACCENT_AMB)]
    y = 0.88
    for name, depth, col in hotspots:
        hotax.text(0.05, y, name, color="white", fontsize=8.5)
        hotax.text(0.7, y, depth, color=hex2rgb(col), fontsize=9, fontweight="bold")
        y -= 0.12

    # alert panel
    alertax = plt.axes([0.18, 0.0, 0.56, 0.26])
    alertax.set_facecolor(hex2rgb("#0A1929")); alertax.axis("off")
    alertax.text(0.02, 0.92, "⚠  ACTIVE ALERTS", color=hex2rgb(ACCENT_RED),
                 fontsize=9, fontweight="bold")
    alerts = [("22:28", "CRITICAL", "Station Rd: 38 cm depth — SEVERE risk"),
              ("22:24", "HIGH", "Drain Node DN-47 at surcharge — inspect"),
              ("22:20", "SOS", "SOS-10284: 4 people trapped — rescue dispatched"),
              ("22:15", "INFO", "Reservoir upstream: +0.8 m in 30 min")]
    y = 0.78
    for t, level, msg in alerts:
        col = ACCENT_RED if level == "CRITICAL" else (ACCENT_RED if level == "SOS" else ACCENT_AMB)
        alertax.text(0.02, y, t, color=hex2rgb(GREY_MED), fontsize=8)
        alertax.text(0.10, y, f"[{level}]", color=hex2rgb(col), fontsize=8, fontweight="bold")
        alertax.text(0.25, y, msg, color="white", fontsize=8)
        y -= 0.17

    fig.suptitle("UI Screen 1 — Municipal Command Center (Conceptual Mockup)",
                 color=hex2rgb(GREY_MED), fontsize=8, y=0.005)
    return save_fig("ui_01_command_center.png")


def ui_citizen_pwa():
    fig = plt.figure(figsize=(6, 11))
    fig.patch.set_facecolor(hex2rgb(BG_HEADER))
    ax = fig.add_axes([0.05, 0.0, 0.9, 1.0])
    ax.set_facecolor(hex2rgb(BG_HEADER)); ax.axis("off")
    ax.set_xlim(0, 6); ax.set_ylim(0, 11)

    # phone frame
    phone = FancyBboxPatch((0.3, 0.3), 5.4, 10.4,
                           boxstyle="round,pad=0.15,rounding_size=0.4",
                           fc=hex2rgb("#121212"), ec=hex2rgb(GREY_MED), lw=2)
    ax.add_patch(phone)

    # header
    flow_box(ax, "🌊  HydroGraph", 3.0, 10.3, w=5.0, h=0.55, fc=BLUE_DARK, fontsize=10)
    flow_box(ax, "⚠  FLOOD ALERT — Your area", 3.0, 9.6, w=4.8, h=0.45, fc=ACCENT_RED, fontsize=9)

    # location card
    flow_box(ax, "📍 Station Road, Zone 3\n🌧 Rainfall: 78 mm/hr", 3.0, 8.7,
             w=4.8, h=0.7, fc=BLUE_MID, fontsize=9)

    # risk card
    flow_box(ax, "Current Flood Risk: HIGH\nEstimated depth: 24 cm\nTime to severe: ~18 min",
             3.0, 7.65, w=4.8, h=0.85, fc="#E65100", fontsize=9)

    # route button
    flow_box(ax, "🗺  Show Safe Route", 3.0, 6.65, w=4.5, h=0.55, fc=ACCENT_GRN, fontsize=10)
    flow_box(ax, "🏥  Nearest Safe Shelter →", 3.0, 5.95, w=4.5, h=0.55, fc=TEAL, fontsize=10)

    # mini map
    mapbox = FancyBboxPatch((0.6, 4.2), 4.8, 1.4,
                             boxstyle="round,pad=0.05",
                             fc=hex2rgb("#1A2940"), ec=hex2rgb(BLUE_MID), lw=1)
    ax.add_patch(mapbox)
    ax.text(3.0, 4.92, "[Map: safe route highlighted in green]",
            ha="center", va="center", color=hex2rgb(GREY_MED), fontsize=8)

    # SOS button
    sos = plt.Circle((3.0, 3.2), 0.9, fc=hex2rgb(ACCENT_RED),
                     ec=hex2rgb("#8B0000"), lw=3, zorder=5)
    ax.add_patch(sos)
    ax.text(3.0, 3.2, "I AM\nIN DANGER", ha="center", va="center",
            fontsize=9, fontweight="bold", color="white", zorder=6, multialignment="center")

    flow_box(ax, "📡 Offline mode — SOS stored locally", 3.0, 1.9,
             w=4.8, h=0.45, fc=ACCENT_AMB, fontsize=8)
    flow_box(ax, "📱 Progressive Web App — No installation required", 3.0, 1.2,
             w=4.8, h=0.45, fc=GREY_MED, textcolor=BLACK, fontsize=8)

    ax.text(3.0, 0.55, "UI Screen 7 — Citizen PWA (Conceptual Mockup)",
            ha="center", fontsize=7.5, color=hex2rgb(GREY_MED))
    return save_fig("ui_07_citizen_pwa.png")


def ui_street_detail():
    fig, ax = plt.subplots(figsize=(10, 7))
    ax.set_facecolor(hex2rgb("#0A1929")); ax.axis("off")
    ax.set_xlim(0, 10); ax.set_ylim(0, 7)
    fig.patch.set_facecolor(hex2rgb("#0A1929"))

    ax.text(5.0, 6.7, "Street Detail Panel — Station Road, R-102",
            ha="center", fontsize=11, fontweight="bold", color="white")

    # depth gauge
    gauge_ax = fig.add_axes([0.06, 0.3, 0.2, 0.55])
    gauge_ax.set_facecolor(hex2rgb("#0A1929")); gauge_ax.axis("off")
    gauge_ax.set_xlim(0, 2); gauge_ax.set_ylim(0, 60)
    # water column
    water = plt.Rectangle((0.5, 0), 1.0, 31, fc=hex2rgb(BLUE_LIGHT), alpha=0.7)
    gauge_ax.add_patch(water)
    gauge_ax.axhline(15, color=hex2rgb(ACCENT_AMB), lw=1.5, ls="--", label="HIGH threshold")
    gauge_ax.axhline(30, color=hex2rgb(ACCENT_RED), lw=1.5, ls="--", label="SEVERE threshold")
    gauge_ax.text(1.0, 31, "  31 cm", color="white", fontsize=10, fontweight="bold", va="bottom")
    gauge_ax.text(1.0, 0.5, "Water Depth\nGauge", ha="center", color="white",
                  fontsize=8, fontweight="bold")

    # info cards
    info = [("Current Depth", "31 cm", ACCENT_RED), ("Forecast Peak", "44 cm", ACCENT_RED),
            ("Time-to-Flood", "34 min", ACCENT_AMB), ("Flood Duration", "~52 min", ACCENT_AMB),
            ("Velocity", "0.48 m/s", TEAL), ("Drain Utilisation", "96%", ACCENT_RED),
            ("Rainfall", "78 mm/hr", BLUE_LIGHT), ("Confidence", "87%", ACCENT_GRN),
            ("Cause", "Surface + Drain Stress", BLUE_MID), ("Action", "AVOID > +30 min", ACCENT_RED)]
    cols = 2
    for i, (label, val, col) in enumerate(info):
        c = i % cols; r = i // cols
        x = 3.2 + c * 3.2; y = 5.8 - r * 0.95
        card = FancyBboxPatch((x - 1.4, y - 0.38), 2.8, 0.76,
                              boxstyle="round,pad=0.05",
                              fc=hex2rgb("#1A2940"), ec=hex2rgb(BLUE_MID), lw=0.8)
        ax.add_patch(card)
        ax.text(x - 1.2, y + 0.15, label, color=hex2rgb(GREY_MED), fontsize=8)
        ax.text(x - 1.2, y - 0.15, val, color=hex2rgb(col), fontsize=10, fontweight="bold")

    # time-to-flood timeline
    times = ["+0", "+15", "+30", "+45", "+60"]
    depths = [8, 14, 22, 31, 38]
    timeline_ax = fig.add_axes([0.3, 0.05, 0.65, 0.18])
    timeline_ax.set_facecolor(hex2rgb("#0A1929"))
    colors_t = [ACCENT_GRN, ACCENT_AMB, "#E65100", ACCENT_RED, ACCENT_RED]
    bars = timeline_ax.bar(times, depths, color=[hex2rgb(c) for c in colors_t], width=0.6)
    timeline_ax.axhline(15, color=hex2rgb(ACCENT_AMB), lw=1, ls="--", alpha=0.7)
    timeline_ax.axhline(30, color=hex2rgb(ACCENT_RED), lw=1, ls="--", alpha=0.7)
    timeline_ax.set_facecolor(hex2rgb("#0A1929"))
    timeline_ax.tick_params(colors="white"); timeline_ax.spines[:].set_color(hex2rgb(BLUE_MID))
    for spine in timeline_ax.spines.values(): spine.set_color(hex2rgb(BLUE_MID))
    timeline_ax.set_title("Depth Forecast (cm)", color="white", fontsize=8, pad=2)
    for bar, d in zip(bars, depths):
        timeline_ax.text(bar.get_x() + bar.get_width()/2, d + 0.5, f"{d}",
                         ha="center", color="white", fontsize=8, fontweight="bold")

    ax.text(5.0, 0.25, "UI Screen 3 — Street Detail Panel (Conceptual Mockup)",
            ha="center", fontsize=7.5, color=hex2rgb(GREY_MED))
    return save_fig("ui_03_street_detail.png")


def ui_sos_screen():
    fig = plt.figure(figsize=(6, 10))
    fig.patch.set_facecolor(hex2rgb("#1A0000"))
    ax = fig.add_axes([0.05, 0.0, 0.9, 1.0])
    ax.set_facecolor(hex2rgb("#1A0000")); ax.axis("off")
    ax.set_xlim(0, 6); ax.set_ylim(0, 10)

    flow_box(ax, "🌊  HYDROGRAPH — EMERGENCY SOS", 3.0, 9.6, w=5.5, h=0.55,
             fc=ACCENT_RED, fontsize=10)

    # SOS button big
    sos = plt.Circle((3.0, 7.8), 1.2, fc=hex2rgb(ACCENT_RED),
                     ec=hex2rgb("#8B0000"), lw=4, zorder=5)
    ax.add_patch(sos)
    ax.text(3.0, 7.8, "I AM IN\nDANGER", ha="center", va="center",
            fontsize=13, fontweight="bold", color="white", zorder=6, multialignment="center")

    # form fields
    fields = [("Number of people:", "4"), ("Children:", "1"),
              ("Elderly:", "1"), ("Medical emergency:", "YES"),
              ("Water depth (approx):", "~60 cm")]
    y = 6.2
    for label, val in fields:
        ax.text(0.5, y, label, color="white", fontsize=9)
        flow_box(ax, val, 4.5, y, w=1.8, h=0.38, fc=BLUE_MID, fontsize=9)
        y -= 0.52

    flow_box(ax, "📷 Add Photo (optional)", 3.0, 3.35, w=4.8, h=0.45, fc=BLUE_MID, fontsize=9)
    flow_box(ax, "📍 Location: Auto-detected\n13.0827° N, 80.2707° E", 3.0, 2.7,
             w=4.8, h=0.55, fc=BLUE_DARK, fontsize=9)
    flow_box(ax, "🚨 SEND SOS", 3.0, 1.85, w=4.0, h=0.65, fc=ACCENT_RED, fontsize=11)
    flow_box(ax, "⚡ Offline mode — SOS saved locally", 3.0, 1.05,
             w=4.8, h=0.45, fc=ACCENT_AMB, fontsize=8)
    ax.text(3.0, 0.4, "UI Screen 8 — Citizen SOS (Conceptual Mockup)",
            ha="center", fontsize=7.5, color=hex2rgb(GREY_MED))
    return save_fig("ui_08_sos.png")


# ─────────────────────────────────────────────────────────────────────────────
#  GENERATE ALL DIAGRAMS
# ─────────────────────────────────────────────────────────────────────────────

def generate_all_diagrams():
    print("Generating architecture diagrams...")
    d = {}
    fns = [
        ("arch", diag_system_architecture),
        ("ingestion", diag_data_ingestion),
        ("nowcast", diag_nowcasting),
        ("cloudburst", diag_cloudburst),
        ("river", diag_river_dam),
        ("dem", diag_dem),
        ("drainage", diag_drainage_graph),
        ("coupling", diag_coupling),
        ("hydraulic", diag_hydraulic),
        ("gnn_train", diag_gnn_training),
        ("gnn_infer", diag_gnn_inference),
        ("anomaly", diag_anomaly),
        ("impact", diag_flood_impact),
        ("confidence", diag_confidence),
        ("routing", diag_routing),
        ("shelter", diag_shelter),
        ("sos", diag_sos),
        ("offline_sos", diag_offline_sos),
        ("cmd_center", diag_command_center),
        ("citizen_rescue", diag_citizen_rescue),
        ("whatif", diag_what_if),
        ("historical", diag_historical),
        ("failsafe", diag_failsafe),
        ("deploy", diag_deployment),
        ("er", diag_er),
        ("ui_cmd", ui_command_center),
        ("ui_pwa", ui_citizen_pwa),
        ("ui_street", ui_street_detail),
        ("ui_sos", ui_sos_screen),
    ]
    for key, fn in fns:
        print(f"  -> {key}")
        try:
            d[key] = fn()
        except Exception as e:
            print(f"    ⚠ Error in {key}: {e}")
            d[key] = None
    return d


# ─────────────────────────────────────────────────────────────────────────────
#  PDF BUILDER — STYLES
# ─────────────────────────────────────────────────────────────────────────────

def make_styles():
    base = getSampleStyleSheet()
    styles = {}

    def S(name, parent="Normal", **kw):
        # Look up parent in custom styles first, then in ReportLab base stylesheet
        parent_style = styles.get(parent) or base[parent]
        s = ParagraphStyle(name, parent=parent_style, **kw)
        styles[name] = s
        return s

    S("DocTitle", "Title", fontSize=28, textColor=colors.HexColor(BLUE_DARK),
      spaceAfter=8, alignment=TA_CENTER, fontName="Helvetica-Bold")
    S("DocSubtitle", fontSize=14, textColor=colors.HexColor(TEAL),
      spaceAfter=4, alignment=TA_CENTER, fontName="Helvetica-Bold")
    S("CoverTag", fontSize=11, textColor=colors.HexColor(BLUE_MID),
      alignment=TA_CENTER, fontName="Helvetica")
    S("H1", fontSize=16, textColor=colors.HexColor(WHITE),
      backColor=colors.HexColor(BLUE_DARK), spaceBefore=12, spaceAfter=6,
      leftIndent=-12, rightIndent=-12, leading=24,
      fontName="Helvetica-Bold", alignment=TA_LEFT)
    S("H2", fontSize=13, textColor=colors.HexColor(WHITE),
      backColor=colors.HexColor(BLUE_MID), spaceBefore=8, spaceAfter=4,
      leftIndent=-6, rightIndent=-6, leading=18,
      fontName="Helvetica-Bold")
    S("H3", fontSize=11, textColor=colors.HexColor(BLUE_DARK),
      spaceBefore=6, spaceAfter=3, fontName="Helvetica-Bold",
      borderPad=2)
    # Body is defined BEFORE Bullet so Bullet can inherit from it
    S("Body", fontSize=9.5, textColor=colors.HexColor(BLACK),
      leading=14, spaceAfter=4, alignment=TA_JUSTIFY, fontName="Helvetica")
    S("Bullet", "Body", bulletText="-", leftIndent=16, spaceAfter=2)
    S("Code", fontSize=8.5, fontName="Courier",
      backColor=colors.HexColor(GREY_LIGHT), leftIndent=12, rightIndent=12,
      spaceBefore=4, spaceAfter=4, leading=12)
    S("Caption", fontSize=8, textColor=colors.HexColor(BLUE_MID),
      alignment=TA_CENTER, spaceAfter=8, spaceBefore=2,
      fontName="Helvetica-Oblique")
    S("FigureLabel", fontSize=9, textColor=colors.HexColor(BLUE_DARK),
      alignment=TA_CENTER, fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=2)
    S("Note", fontSize=8.5, textColor=colors.HexColor("#5D4037"),
      backColor=colors.HexColor("#FFF8E1"), leftIndent=10, rightIndent=10,
      spaceBefore=4, spaceAfter=4, leading=12, fontName="Helvetica-Oblique")
    S("Warning", fontSize=8.5, textColor=colors.HexColor(ACCENT_RED),
      backColor=colors.HexColor("#FFEBEE"), leftIndent=10, rightIndent=10,
      spaceBefore=4, spaceAfter=4, leading=12, fontName="Helvetica-Bold")
    S("Quote", fontSize=10, textColor=colors.HexColor(BLUE_DARK),
      backColor=colors.HexColor(BG_ALT), leftIndent=16, rightIndent=16,
      spaceBefore=6, spaceAfter=6, leading=15, fontName="Helvetica-Oblique",
      borderPad=4)
    return styles



# ─────────────────────────────────────────────────────────────────────────────
#  TABLE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

H_BLUE  = colors.HexColor(BLUE_MID)
H_DARK  = colors.HexColor(BLUE_DARK)
H_TEAL  = colors.HexColor(TEAL)
C_ALT   = colors.HexColor(BG_ALT)
C_WHITE = colors.white
C_RED   = colors.HexColor(ACCENT_RED)
C_AMB   = colors.HexColor(ACCENT_AMB)
C_GRN   = colors.HexColor(ACCENT_GRN)

def table_style(header_bg=H_BLUE, alt=True):
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(GREY_MED)),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_WHITE, C_ALT] if alt else [C_WHITE]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]
    return TableStyle(cmds)

def img_flowable(path, width_cm=15.0, caption=None, label=None, styles=None):
    items = []
    # A4 usable width with 2+1.5 margins = 17.5cm; header/footer consume ~2.5cm height
    # Frame height ≈ 744 pts. Limit image height to 60% of page body = ~17cm
    max_w_pt = min(width_cm, 16.5) * cm
    max_h_pt = 17.0 * cm
    if path and os.path.exists(path):
        try:
            from PIL import Image as PILImage
            pil_img = PILImage.open(path)
            orig_w, orig_h = pil_img.size
            aspect = orig_h / orig_w
            desired_w = max_w_pt
            desired_h = desired_w * aspect
            # If too tall, scale down by height
            if desired_h > max_h_pt:
                desired_h = max_h_pt
                desired_w = desired_h / aspect
            img = Image(path, width=desired_w, height=desired_h)
            img.hAlign = "CENTER"
            items.append(img)
        except Exception as e:
            print(f"  [img warn] {path}: {e}")
    if label:
        items.append(Paragraph(label, styles["FigureLabel"]))
    if caption:
        items.append(Paragraph(caption, styles["Caption"]))
    return items


def section_h1(title, styles):
    return [Spacer(1, 0.2*cm), Paragraph(f"  {title}", styles["H1"]), Spacer(1, 0.15*cm)]

def section_h2(title, styles):
    return [Spacer(1, 0.15*cm), Paragraph(f"  {title}", styles["H2"]), Spacer(1, 0.1*cm)]

def section_h3(title, styles):
    return [Paragraph(title, styles["H3"])]

def body(text, styles):
    return Paragraph(text, styles["Body"])

def bullet(text, styles):
    return Paragraph(f"  - {text}", styles["Body"])

def note(text, styles):
    return Paragraph(f"[NOTE]  {text}", styles["Note"])

def warning(text, styles):
    return Paragraph(f"[!]  {text}", styles["Warning"])

def quote(text, styles):
    return Paragraph(f'"{text}"', styles["Quote"])

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor(GREY_MED), spaceAfter=4)



# ─────────────────────────────────────────────────────────────────────────────
#  PAGE TEMPLATE CALLBACKS
# ─────────────────────────────────────────────────────────────────────────────

PAGE_W, PAGE_H = A4

def on_page(canvas, doc):
    canvas.saveState()
    # footer bar
    canvas.setFillColor(colors.HexColor(BLUE_DARK))
    canvas.rect(0, 0, PAGE_W, 0.7 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(1.5 * cm, 0.22 * cm, "HydroGraph — Urban Flood Nowcasting System")
    canvas.drawString(PAGE_W / 2 - 1 * cm, 0.22 * cm,
                      f"SIH 2026 | Problem Statement 26085")
    canvas.drawRightString(PAGE_W - 1.5 * cm, 0.22 * cm, f"Page {doc.page}")
    # header stripe
    canvas.setFillColor(colors.HexColor(BLUE_DARK))
    canvas.rect(0, PAGE_H - 0.8 * cm, PAGE_W, 0.8 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor(TEAL_LIGHT))
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(1.5 * cm, PAGE_H - 0.55 * cm, "HYDROGRAPH")
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(PAGE_W / 2, PAGE_H - 0.55 * cm,
                             "Product Requirements Document | Smart India Hackathon 2026")
    canvas.restoreState()

def on_cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor(BLUE_DARK))
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # accent stripe
    canvas.setFillColor(colors.HexColor(TEAL))
    canvas.rect(0, PAGE_H * 0.6, PAGE_W, 6, fill=1, stroke=0)
    canvas.restoreState()


# ─────────────────────────────────────────────────────────────────────────────
#  CONTENT BUILDER
# ─────────────────────────────────────────────────────────────────────────────

def build_content(styles, diags):
    P = Paragraph
    SP = Spacer
    PB = PageBreak
    story = []

    def add(*items):
        for item in items:
            if isinstance(item, list):
                story.extend(item)
            else:
                story.append(item)

    # ── COVER PAGE ────────────────────────────────────────────────────────────
    add(SP(1, 6 * cm))
    add(P("🌊  HYDROGRAPH", styles["DocTitle"]))
    add(SP(1, 0.3*cm))
    add(P("High-Resolution Urban Flood Nowcasting<br/>&amp; Emergency Response System", styles["DocSubtitle"]))
    add(SP(1, 0.5*cm))
    add(HRFlowable(width="60%", thickness=2, color=colors.HexColor(TEAL), spaceAfter=8))
    add(P("Product Requirements Document", styles["CoverTag"]))
    add(SP(1, 0.3*cm))
    add(P("Smart India Hackathon 2026", styles["CoverTag"]))
    add(P("Problem Statement ID: 26085", styles["CoverTag"]))
    add(SP(1, 0.5*cm))
    add(P("Ministry of Earth Sciences (MoES)", styles["CoverTag"]))
    add(P("National Centre for Medium Range Weather Forecasting (NCMRWF)", styles["CoverTag"]))
    add(SP(1, 0.3*cm))
    add(P("Category: Software  |  Theme: Disaster Management", styles["CoverTag"]))
    add(SP(1, 1.0*cm))
    add(HRFlowable(width="40%", thickness=1, color=colors.HexColor(BLUE_MID), spaceAfter=8))
    add(P("Version 1.0  |  August 2026  |  Confidential — SIH Submission", styles["CoverTag"]))
    add(PB())

    # ── EXECUTIVE SUMMARY ─────────────────────────────────────────────────────
    add(*section_h1("1. Executive Summary", styles))
    add(quote(
        "HydroGraph transforms fragmented weather, terrain, drainage and emergency information "
        "into a unified street-level flood intelligence system. Instead of merely telling authorities "
        "that heavy rain is coming, it estimates where water will accumulate, when roads may become "
        "unsafe, how drainage stress contributes to the event, how confident the prediction is, "
        "which routes remain usable, which shelters are safe, and where emergency teams should "
        "respond first.", styles))
    add(body(
        "Urban flooding in Indian metros — Mumbai, Delhi, Chennai — kills hundreds annually and "
        "causes billions in economic damage. Traditional Numerical Weather Prediction (NWP) models "
        "answer the question 'how much rain?' but not 'which street floods first?' and 'how long "
        "until conditions become dangerous?'. HydroGraph closes this gap by coupling rainfall "
        "nowcasting, terrain physics, underground drainage hydraulics, AI acceleration, and "
        "citizen-facing emergency tools into one integrated, software-only platform.", styles))

    # Key outputs table
    kpi_data = [
        ["Output", "Description", "Confidence"],
        ["Street-level flood depth", "Water depth per road segment (cm)", "Model-dependent"],
        ["Time-to-Flood", "Minutes before threshold is breached", "±15 min target"],
        ["Flood-safe routes", "OSRM-powered safe routing", "Real-time"],
        ["Shelter recommendation", "Capacity + route + flood-safe check", "Data-dependent"],
        ["Citizen SOS", "Location + priority + rescue dispatch", "Internet/SMS required"],
        ["Drainage anomaly", "Inferred capacity reduction (hypothesis)", "Field verification needed"],
        ["What-if simulation", "Scenario comparison for authorities", "Model-dependent"],
    ]
    add(Table(kpi_data, colWidths=[5*cm, 7*cm, 4.5*cm], style=table_style()))
    add(SP(1, 0.3*cm))

    # ── PROBLEM STATEMENT ─────────────────────────────────────────────────────
    add(*section_h1("2. Problem Statement", styles))
    add(*section_h2("2.1 Background", styles))
    add(body(
        "Urban flooding is a hyper-local phenomenon dictated by micro-topography, concrete "
        "imperviousness, and heavily strained invisible drainage networks. The monsoon season "
        "delivers intense short-duration rainfall events (cloudbursts), overwhelming storm-water "
        "systems designed for average loads. Key facts:", styles))
    for b in ["Mumbai 2005 flood: 944 mm in 24 hours, over 1,000 deaths.",
              "Chennai 2015 flood: ₹20,000+ crore damage.",
              "Delhi experiences annual waterlogging at 200+ junctions.",
              "Drainage networks are under-documented, ageing, and often blocked.",
              "NWP models provide city-scale rainfall but not street-level inundation."]:
        add(bullet(b, styles))

    add(*section_h2("2.2 Gap Analysis", styles))
    gap_data = [
        ["Gap", "Current State", "HydroGraph Solution"],
        ["Rainfall → Flood translation", "NWP gives rainfall amount only", "Coupled 1D/2D hydraulic model"],
        ["Street-level prediction", "Not available operationally", "Per-road depth & timing estimates"],
        ["Drainage modelling", "Rarely done in real-time", "SWMM graph model + surcharge detection"],
        ["Emergency routing", "Manual decisions", "Dynamic flood-aware OSRM routing"],
        ["Citizen SOS", "Phone calls / ad hoc", "PWA with priority queue and dispatch"],
        ["Uncertainty disclosure", "Binary forecasts", "Confidence % + uncertainty range"],
    ]
    add(Table(gap_data, colWidths=[4.5*cm, 5.5*cm, 6.5*cm], style=table_style()))
    add(SP(1, 0.3*cm))

    # ── GOALS ─────────────────────────────────────────────────────────────────
    add(*section_h1("3. Goals & Objectives", styles))
    goals = [
        ("G-01", "Provide 0–3 hour street-level flood nowcasts for a pilot urban zone."),
        ("G-02", "Couple rainfall, terrain, and drainage into one unified simulation."),
        ("G-03", "Generate per-road water depth, velocity, duration, and time-to-flood estimates."),
        ("G-04", "Deliver real-time flood-safe routing for citizens and emergency services."),
        ("G-05", "Enable citizen SOS with automated rescue prioritisation."),
        ("G-06", "Provide a municipal command centre for operational decision support."),
        ("G-07", "Quantify prediction uncertainty and communicate it transparently."),
        ("G-08", "Detect drainage anomalies via model residuals, not physical sensors."),
        ("G-09", "Support historical event replay for validation and demonstration."),
        ("G-10", "Remain software-only, open-source, cost-effective, and city-independent."),
    ]
    goal_data = [["ID", "Goal"]] + [[g[0], g[1]] for g in goals]
    add(Table(goal_data, colWidths=[2*cm, 14.5*cm], style=table_style()))
    add(SP(1, 0.3*cm))

    # ── SYSTEM ARCHITECTURE ───────────────────────────────────────────────────
    add(PB())
    add(*section_h1("4. System Architecture", styles))
    add(body(
        "HydroGraph is organised into five functional layers. Every layer is modular and "
        "independently deployable. The system follows the principle: "
        "<b>Physics for trust, AI for speed, uncertainty for honesty, fallback systems for reliability.</b>", styles))
    add(*img_flowable(diags.get("arch"), 16.0,
        "All five architectural layers from external data acquisition through to emergency response.",
        "Figure 1: HydroGraph — Complete System Architecture Overview", styles))
    add(SP(1, 0.3*cm))

    layer_data = [
        ["Layer", "Name", "Key Components"],
        ["1", "External Data", "IMD Radar, CWC River/Dam, GIS/DEM, Optional Telemetry, Citizen Reports"],
        ["2", "Data Ingestion", "Adapters, Schema Validation, QC, Spatial Alignment, PostGIS Store"],
        ["3", "Physics Engine", "PySTEPS Nowcasting, DEM Processing, EPA SWMM, LISFLOOD-FP, 1D/2D Coupling"],
        ["4", "AI & Intelligence", "ST-GNN Surrogate, Anomaly Engine, Confidence Engine, Impact Engine"],
        ["5", "Response & Output", "GIS Dashboard, Routing, Shelter, Citizen PWA, SOS, Command Centre"],
    ]
    add(Table(layer_data, colWidths=[1.5*cm, 4*cm, 11*cm], style=table_style()))
    add(SP(1, 0.3*cm))

    # ── DATA LAYER ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("5. External Data Layer", styles))
    add(*section_h2("5.1 IMD Doppler Weather Radar", styles))
    add(body(
        "The primary rainfall observation and nowcasting source. IMD operates a network of "
        "S-band and C-band Doppler Weather Radars (DWR) across India. The system ingests radar "
        "reflectivity fields and, where raw reflectivity is available, applies a configurable "
        "Z-R relationship (Z = aR^b) to derive rainfall intensity. Default coefficients follow "
        "Marshall-Palmer (a=200, b=1.6) but are adjustable per region.", styles))
    add(note("The Z-R relationship is configurable per deployment zone. No single universal "
             "equation is assumed.", styles))

    add(*section_h2("5.2 CWC River & Dam Data", styles))
    add(body(
        "The Central Water Commission (CWC) provides real-time river stage, discharge, and "
        "reservoir level data. The system consumes official upstream hydrological information "
        "and translates it into downstream urban impact. HydroGraph does NOT predict dam-release "
        "decisions — it reacts to authoritative information provided by competent authorities.", styles))
    add(warning("HydroGraph does not predict or control dam releases. It consumes official "
                "CWC data only.", styles))

    add(*section_h2("5.3 GIS Terrain & Infrastructure", styles))
    gis_data = [
        ["Dataset", "Source", "Priority", "Usage"],
        ["DEM/DTM", "ISRO Bhuvan / SRTM / LiDAR", "Required", "Terrain, flow direction, slope"],
        ["Road network", "OpenStreetMap / municipal GIS", "Required", "Routing, impact assessment"],
        ["Drainage pipes", "Municipal GIS", "Required", "SWMM model, drainage graph"],
        ["Buildings", "OSM / survey", "Recommended", "Exposure assessment"],
        ["Land cover", "ISRO / Bhuvan / OSM", "Recommended", "Imperviousness estimation"],
        ["Shelters", "Municipal database", "Recommended", "Shelter engine"],
        ["Water bodies", "OSM / survey", "Required", "Boundary conditions"],
    ]
    add(Table(gis_data, colWidths=[3.5*cm, 4.5*cm, 3*cm, 5.5*cm], style=table_style()))

    add(*section_h2("5.4 Municipal IoT Telemetry (Optional External Adapter)", styles))
    add(body(
        "Where a municipality already operates water-level sensors, ultrasonic depth sensors, "
        "or flow telemetry, HydroGraph provides a TelemetryAdapter to ingest those readings. "
        "This component is entirely optional. The core system operates without any sensors.", styles))
    add(warning("HydroGraph deploys NO hardware sensors. It only consumes data from existing "
                "municipal infrastructure where available.", styles))

    add(*section_h2("5.5 Citizen Telemetry", styles))
    add(body(
        "Citizens contribute real-time ground truth through the Progressive Web App (PWA): "
        "flood reports, water depth estimates, blocked drain reports, SOS activations, and "
        "photographs. All citizen data is validated before use.", styles))

    # ── DATA INGESTION ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("6. Data Ingestion & Quality Control", styles))
    add(*img_flowable(diags.get("ingestion"), 15.0,
        "Data from each source passes through its own adapter and a unified quality control "
        "pipeline before being stored in the PostGIS normalised data store.",
        "Figure 2: Data Ingestion & Quality Control Workflow", styles))

    add(*section_h2("6.1 Source Adapters", styles))
    adapter_data = [
        ["Adapter", "Input Format", "Protocol", "Fallback Behaviour"],
        ["RadarAdapter", "NetCDF / HDF5 / GeoTIFF", "FTP / HTTP / WebSocket", "Use latest valid frame + increase uncertainty"],
        ["RiverAdapter", "CWC XML/JSON / CSV", "HTTP REST", "Mark river condition as unknown"],
        ["ReservoirAdapter", "CWC portal feed", "HTTP scrape / API", "Mark dam condition as unknown"],
        ["GISAdapter", "GeoJSON / Shapefile / GeoTIFF", "File / HTTP", "Use cached layer + flag staleness"],
        ["TelemetryAdapter", "Vendor-specific", "MQTT / REST", "Skip if unavailable"],
        ["CitizenReportAdapter", "JSON / SMS text", "HTTP / SMS Gateway", "Ignore if malformed"],
    ]
    add(Table(adapter_data, colWidths=[3.5*cm, 3.5*cm, 3*cm, 6.5*cm], style=table_style()))

    add(*section_h2("6.2 Data Quality Control", styles))
    add(body(
        "Every incoming dataset is scored on four dimensions: Data Freshness, Spatial Coverage, "
        "Completeness, and Anomaly Count. The aggregate score (GOOD / MODERATE / POOR) directly "
        "feeds the Confidence Engine. A POOR-quality data source reduces prediction confidence "
        "and widens uncertainty bounds rather than silently degrading the forecast.", styles))
    qc_data = [
        ["Check", "Trigger", "Action"],
        ["Missing values", ">10% null cells", "Interpolate or flag POOR"],
        ["Invalid coordinates", "Outside bounding box", "Reject record"],
        ["Duplicate records", "Same timestamp + location", "Deduplicate"],
        ["Stale data", "Age > configured threshold", "Use with staleness flag"],
        ["Unrealistic rainfall", ">500 mm/hr at pixel", "Cap and flag anomaly"],
        ["Broken geometries", "Self-intersecting polygons", "Repair with GDAL or reject"],
        ["Disconnected drain edges", "Orphan nodes in graph", "Flag incomplete network"],
        ["Invalid DEM cells", "NoData / spike values", "Fill using IDW"],
    ]
    add(Table(qc_data, colWidths=[4.5*cm, 5*cm, 7*cm], style=table_style()))

    # ── SPATIAL ALIGNMENT ─────────────────────────────────────────────────────
    add(*section_h2("6.3 Spatial Alignment", styles))
    add(body(
        "All geospatial data must share a common Coordinate Reference System (CRS). "
        "The system automatically determines the appropriate local projected CRS (UTM zone) "
        "from the pilot area's centroid. Projected CRS is preferred over geographic CRS "
        "for distance, area, and slope calculations — operations that assume Euclidean geometry. "
        "For Chennai: EPSG:32644 (UTM Zone 44N). For Mumbai: EPSG:32643. For Delhi: EPSG:32643. "
        "Each deployment selects the correct zone programmatically.", styles))

    # ── DEM PROCESSING ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("7. DEM Processing & Terrain Modelling", styles))
    add(*img_flowable(diags.get("dem"), 12.0,
        "Hydrological conditioning ensures water routing physics are correct. "
        "Depression identification locates urban flood-prone low points.",
        "Figure 6: DEM Processing Pipeline", styles))
    add(note(
        "A 2 m resolution DEM is the target for the selected pilot zone ONLY where suitable "
        "LiDAR or high-resolution survey data are available. Where only SRTM (30 m) or "
        "Cartosat-DEM (10 m) is available, the system uses the best available resolution "
        "and explicitly reduces prediction confidence.", styles))

    dem_req_data = [
        ["FR-DEM-001", "System SHALL ingest and project DEM to local UTM CRS.", "Must Have"],
        ["FR-DEM-002", "System SHALL perform hydrological conditioning (pit removal, drain burning).", "Must Have"],
        ["FR-DEM-003", "System SHALL compute slope, aspect, flow direction, and flow accumulation.", "Must Have"],
        ["FR-DEM-004", "System SHALL identify surface depressions and low-lying zones.", "Must Have"],
        ["FR-DEM-005", "System SHALL reduce confidence when DEM resolution is coarser than target.", "Must Have"],
    ]
    add(Table(dem_req_data, colWidths=[3*cm, 10.5*cm, 3*cm], style=table_style()))

    # ── RAINFALL NOWCASTING ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("8. Rainfall Nowcasting Module", styles))
    add(*img_flowable(diags.get("nowcast"), 14.0,
        "PySTEPS generates probabilistic ensemble nowcasts by extrapolating storm-cell "
        "motion fields estimated from consecutive radar frames.",
        "Figure 3: Radar Rainfall Nowcasting Pipeline", styles))
    add(body(
        "PySTEPS (Python Short-Term Ensemble Prediction System) is an open-source framework "
        "for short-range probabilistic precipitation nowcasting [1]. It estimates storm-cell "
        "motion using optical-flow algorithms (e.g., Lucas-Kanade, DARTS), then extrapolates "
        "rain fields forward in time while generating an ensemble of realisations to quantify "
        "uncertainty. Uncertainty increases monotonically with lead time.", styles))

    fcst_data = [
        ["Lead Time", "Typical Skill", "HydroGraph Use"],
        ["0–30 min", "High", "Primary nowcast — high confidence"],
        ["30–60 min", "Good", "Secondary nowcast — moderate confidence"],
        ["60–120 min", "Moderate", "Guidance only — widened uncertainty"],
        ["120–180 min", "Low", "Trend indication — very wide uncertainty"],
    ]
    add(Table(fcst_data, colWidths=[4*cm, 4.5*cm, 8*cm], style=table_style()))

    add(*section_h2("8.1 Cloudburst / Flash-Flood Detection", styles))
    add(*img_flowable(diags.get("cloudburst"), 13.0,
        "The extreme-rainfall detector monitors multiple radar-derived indicators simultaneously. "
        "It does NOT guarantee cloudburst prediction — it provides the earliest reliable signal.",
        "Figure 4: Cloudburst / Flash-Flood Detection Module", styles))

    # ── RIVER & DAM MODULE ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("9. River & Dam Flood Module", styles))
    add(*img_flowable(diags.get("river"), 13.0,
        "CWC data is ingested and converted into upstream boundary conditions for the "
        "urban hydraulic model. Flood source attribution distinguishes rainfall-driven "
        "vs river-overflow vs dam-release events.",
        "Figure 5: River & Dam Flood Workflow", styles))
    add(body(
        "Many Indian urban floods are not caused by local rainfall alone. River backwater, "
        "dam controlled releases, and tidal effects can inundate urban areas under dry-sky "
        "conditions. HydroGraph ingests official CWC river stage, discharge, and reservoir-level "
        "data and translates it into downstream urban boundary conditions.", styles))
    add(warning(
        "HydroGraph does NOT predict dam-release decisions. It acts on official information "
        "provided by CWC or dam authorities. Information latency from upstream to system "
        "may range from minutes to hours depending on CWC data availability.", styles))

    # Flood source attribution
    add(*section_h2("9.1 Flood Source Attribution (Conceptual)", styles))
    add(body(
        "The system estimates the relative contribution of each flood driver to observed "
        "inundation. This is a conceptual decomposition based on model inputs, not a "
        "physically guaranteed decomposition.", styles))

    attr_data = [
        ["Flood Driver", "Example Contribution", "Data Source"],
        ["Local rainfall", "70%", "IMD Doppler Radar"],
        ["River overflow", "20%", "CWC river stage"],
        ["Drainage surcharge", "10%", "SWMM model output"],
        ["Dam/reservoir release", "0–100% (event-dependent)", "CWC dam telemetry"],
    ]
    add(Table(attr_data, colWidths=[4.5*cm, 4*cm, 8*cm], style=table_style()))

    # ── DRAINAGE GRAPH ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("10. Stormwater Drainage Network Model", styles))
    add(*img_flowable(diags.get("drainage"), 15.0,
        "The stormwater network is represented as a directed weighted graph. "
        "Nodes are manholes, inlets, junctions, and outfalls. "
        "Edges are pipes, culverts, and canals with physical attributes.",
        "Figure 7: Stormwater Drainage Directed Graph", styles))

    add(*section_h2("10.1 Node Attributes", styles))
    node_data = [
        ["Attribute", "Type", "Description"],
        ["node_id", "String", "Unique identifier"],
        ["latitude / longitude", "Float", "Geographic location"],
        ["elevation", "Float (m)", "Ground elevation from DEM"],
        ["rim_level", "Float (m)", "Top of manhole cover elevation"],
        ["invert_level", "Float (m)", "Bottom of inlet/pipe elevation"],
        ["storage", "Float (m³)", "Available storage volume"],
        ["inlet_capacity", "Float (m³/s)", "Maximum inflow rate"],
        ["node_type", "Enum", "manhole / inlet / junction / outfall / storage"],
    ]
    add(Table(node_data, colWidths=[3.5*cm, 2.5*cm, 10.5*cm], style=table_style()))

    add(*section_h2("10.2 Edge Attributes", styles))
    edge_data = [
        ["Attribute", "Type", "Description"],
        ["edge_id", "String", "Unique identifier"],
        ["from_node / to_node", "String", "Directed connectivity"],
        ["length", "Float (m)", "Pipe length"],
        ["diameter", "Float (m)", "Pipe diameter or hydraulic radius"],
        ["shape", "Enum", "circular / box / egg / arch"],
        ["slope", "Float (m/m)", "Hydraulic gradient"],
        ["roughness", "Float", "Manning's n coefficient"],
        ["capacity", "Float (m³/s)", "Full-pipe flow capacity (design)"],
    ]
    add(Table(edge_data, colWidths=[4*cm, 2.5*cm, 10*cm], style=table_style()))

    add(note(
        "In many Indian municipalities, complete drainage-network GIS data does not exist. "
        "Where data are incomplete, the system marks that catchment as having reduced "
        "confidence and flags it to operators for data collection.", styles))

    # ── HYDRAULIC SIMULATION ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("11. Hydraulic Simulation Engine", styles))
    add(*section_h2("11.1 EPA SWMM — 1D Drainage Hydraulics", styles))
    add(body(
        "The Storm Water Management Model (SWMM), developed by the US Environmental Protection "
        "Agency (EPA), is one of the most widely validated urban drainage simulation tools in "
        "the world [2]. HydroGraph uses SWMM (via PySWMM Python bindings) to simulate: "
        "rainfall-runoff, pipe-flow routing, surcharge, reverse flow, node flooding, and "
        "storage dynamics. Using a validated open-source model instead of writing a custom "
        "hydraulic solver ensures scientific credibility and reduces validation burden.", styles))

    add(*section_h2("11.2 LISFLOOD-FP — 2D Surface Hydraulics", styles))
    add(body(
        "LISFLOOD-FP is a raster-based 2D hydrodynamic model developed at the University of "
        "Bristol [3]. It simulates shallow-water flow over terrain, producing water depth and "
        "velocity fields. HydroGraph uses LISFLOOD-FP (or an equivalent validated 2D solver) "
        "to model surface overland flow. Initial deployment covers a limited pilot zone only.", styles))
    add(warning(
        "Real-time city-wide 2 m resolution 2D hydraulic simulation on ordinary hardware is NOT "
        "computationally feasible. HydroGraph deploys LISFLOOD-FP on a limited pilot zone. "
        "Larger coverage requires GPU acceleration or pre-computed scenario tables.", styles))

    add(*img_flowable(diags.get("hydraulic"), 15.0,
        "Rainfall, DEM, drainage graph, and river boundary conditions feed into the coupled "
        "1D+2D simulation. Outputs are water depth, velocity, extent, and duration.",
        "Figure 9: Coupled Hydraulic Simulation Workflow", styles))

    add(*section_h2("11.3 Surface–Drainage Coupling (Technical Differentiator)", styles))
    add(*img_flowable(diags.get("coupling"), 16.0,
        "Water is exchanged bidirectionally between the 2D surface domain and the 1D drainage "
        "domain at each coupling timestep. When drainage capacity is exceeded, backflow onto "
        "the surface creates street flooding.",
        "Figure 8: 1D/2D Surface–Drainage Coupling", styles))
    add(body(
        "The coupling timestep is configurable. An initial value of 1–5 minutes is recommended "
        "for the pilot zone, with refinement after performance benchmarking. At each coupling "
        "step: (1) surface water depth at inlet locations is passed to SWMM; (2) SWMM computes "
        "pipe flows and node hydraulic heads; (3) surcharge (node flooding) is returned to "
        "LISFLOOD-FP as a surface water source term; (4) the 2D model propagates the flood "
        "wave across terrain.", styles))

    # ── OFFLINE + GNN ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("12. Offline Simulation & GNN Surrogate", styles))
    add(*section_h2("12.1 Offline Hydraulic Simulation for Training Data", styles))
    add(*img_flowable(diags.get("gnn_train"), 14.0,
        "Hundreds of synthetic and historical rainfall scenarios are simulated offline using "
        "the full coupled hydraulic model to generate a rich training dataset for the GNN.",
        "Figure 10: Offline Hydraulic Simulation → GNN Training", styles))
    add(body(
        "Because coupled SWMM + LISFLOOD-FP simulation is computationally expensive, it "
        "cannot run at real-time speed for every forecast update. The solution is to train "
        "a Spatial-Temporal Graph Neural Network (ST-GNN) as a fast surrogate model. "
        "The GNN approximates the physics model's output at a fraction of the computational "
        "cost.", styles))

    add(*section_h2("12.2 Real-Time GNN Inference", styles))
    add(*img_flowable(diags.get("gnn_infer"), 13.0,
        "At inference time, the GNN receives current rainfall, terrain, and drainage state "
        "inputs and produces near-instantaneous flood predictions. A confidence check "
        "determines whether to trust the GNN or fall back to the hydraulic simulator.",
        "Figure 11: Real-Time GNN Inference Pipeline", styles))
    add(warning(
        "The GNN CANNOT be trusted until validated against held-out hydraulic simulations. "
        "If GNN confidence is insufficient or error exceeds threshold, the system automatically "
        "falls back to the physics-based hydraulic model. The GNN never silently replaces physics.", styles))

    gnn_req_data = [
        ["FR-GNN-001", "GNN SHALL be trained exclusively on physics-based simulation outputs.", "Must Have"],
        ["FR-GNN-002", "GNN SHALL have validation and test dataset separate from training data.", "Must Have"],
        ["FR-GNN-003", "GNN SHALL include confidence monitoring and drift detection.", "Must Have"],
        ["FR-GNN-004", "GNN failure SHALL trigger automatic hydraulic simulator fallback.", "Must Have"],
        ["FR-GNN-005", "GNN models SHALL be versioned with reproducible training pipelines.", "Must Have"],
        ["FR-GNN-006", "Target: GNN RMSE vs hydraulic model ≤ 5 cm on held-out validation data.", "Target"],
    ]
    add(Table(gnn_req_data, colWidths=[3*cm, 10.5*cm, 3*cm], style=table_style()))

    # ── ANOMALY ENGINE ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("13. Drainage Anomaly & Capacity-Reduction Engine", styles))
    add(*img_flowable(diags.get("anomaly"), 15.0,
        "Persistent residuals between model predictions and observations/reports trigger "
        "the anomaly engine. Output is an inferred hypothesis, NOT a confirmed physical "
        "detection of underground blockage or damage.",
        "Figure 12: Drainage Anomaly & Capacity-Reduction Engine", styles))
    add(warning(
        "The Anomaly Engine does NOT physically detect underground blockage, garbage, "
        "sedimentation, or pipe damage. All outputs are inferred hypotheses based on "
        "model residuals and must be confirmed by field inspection.", styles))
    add(body(
        "The engine uses: physics model predictions, available telemetry if external sensors "
        "already exist, citizen flood reports, historical flood data, maintenance records, "
        "and hydraulic residuals. When the predicted depth consistently under-estimates "
        "observed/reported depth at a node, the engine flags a possible capacity reduction.", styles))

    cap_data = [
        ["Scenario", "Normal Depth", "Estimated Actual Depth", "Inferred Capacity"],
        ["25% capacity loss", "8 cm", "12 cm", "75%"],
        ["50% capacity loss", "8 cm", "23 cm", "50%"],
        ["75% capacity loss", "8 cm", "41 cm", "25%"],
    ]
    add(Table(cap_data, colWidths=[4.5*cm, 4*cm, 4.5*cm, 3.5*cm], style=table_style()))

    # ── FLOOD IMPACT ENGINE ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("14. Flood Impact & Risk Engine", styles))
    add(*img_flowable(diags.get("impact"), 13.0,
        "Water depth, velocity, duration, and road criticality are combined into a "
        "per-road risk score and classification.",
        "Figure 13: Flood Impact Calculation Engine", styles))

    add(*section_h2("14.1 Risk Classification Thresholds", styles))
    add(note(
        "These thresholds are initial prototypes and must be calibrated against local vehicle "
        "types, road standards, and municipal guidance. They do not represent universal "
        "safety standards.", styles))
    risk_data = [
        ["Risk Level", "Depth (cm)", "Road Status", "Routing Penalty"],
        ["LOW", "< 5", "Normal", "×1.0"],
        ["MODERATE", "5–15", "Use caution", "×2.0"],
        ["HIGH", "15–30", "Avoid recommended", "×10.0"],
        ["SEVERE", "> 30", "Closed / avoid", "∞ (blocked)"],
    ]
    add(Table(risk_data, colWidths=[3.5*cm, 3*cm, 5*cm, 5*cm], style=table_style()))

    add(*section_h2("14.2 Time-to-Flood Feature", styles))
    add(body(
        "Time-to-Flood is one of the most actionable outputs of HydroGraph. For each road "
        "segment, the system forecasts the time until depth exceeds a configured threshold "
        "(e.g., HIGH risk). This converts a static risk map into an early-warning countdown.", styles))

    ttf_example = [
        ["Time", "Estimated Depth", "Risk Level"],
        ["Now", "3 cm", "LOW"],
        ["+15 min", "5 cm", "MODERATE"],
        ["+30 min", "11 cm", "MODERATE"],
        ["+45 min", "18 cm", "HIGH"],
        ["+60 min", "29 cm", "HIGH"],
        ["+75 min", "38 cm", "SEVERE"],
    ]
    add(Table(ttf_example, colWidths=[4*cm, 5*cm, 7.5*cm], style=table_style()))
    add(body("→  High-risk flooding expected in approximately 42 minutes on Road R-102.", styles))

    # ── CONFIDENCE ENGINE ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("15. Confidence & Uncertainty Engine", styles))
    add(*img_flowable(diags.get("confidence"), 13.0,
        "Multiple data-quality and model-agreement factors are weighted to produce a "
        "per-prediction confidence percentage and uncertainty range.",
        "Figure 14: Confidence & Uncertainty Engine", styles))
    add(body(
        "Every prediction in HydroGraph is accompanied by: (1) Predicted value; "
        "(2) Confidence percentage; (3) Uncertainty bounds [lower, upper]; "
        "(4) Data quality flag. Operators and citizens always see how reliable a "
        "prediction is. A POOR data quality flag widens uncertainty bounds and "
        "reduces confidence regardless of model output.", styles))

    conf_example = [
        ["Parameter", "Value"],
        ["Predicted water depth", "27 cm"],
        ["Expected range (18th–82nd percentile)", "21–34 cm"],
        ["Confidence", "86%"],
        ["Data quality", "GOOD"],
        ["Radar freshness", "8 minutes old"],
        ["DEM quality", "10 m resolution (reduced confidence)"],
    ]
    add(Table(conf_example, colWidths=[8*cm, 8.5*cm], style=table_style(alt=False)))

    add(*section_h2("15.1 Factors that Reduce Confidence", styles))
    for f in ["Older radar data or radar unavailable",
              "Coarser DEM resolution",
              "Incomplete drainage network data",
              "Longer forecast lead time",
              "Poor historical validation at this location",
              "Conflicting river and rainfall signals",
              "GNN operating outside training distribution"]:
        add(bullet(f, styles))

    # ── GIS DASHBOARD ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("16. GIS Dashboard", styles))
    add(*img_flowable(diags.get("ui_cmd"), 16.0,
        "The Municipal Command Centre provides a unified real-time view of flood forecasts, "
        "SOS incidents, rescue team positions, shelter status, and alerts.",
        "Figure — UI Screen 1: Municipal Command Centre (Conceptual Mockup)", styles))
    add(*img_flowable(diags.get("ui_street"), 15.0,
        "The Street Detail Panel shows all per-road impact metrics with a depth-forecast "
        "timeline bar chart.",
        "Figure — UI Screen 3: Street Detail Panel (Conceptual Mockup)", styles))

    dashboard_layers = [
        ["Layer", "Description", "Update Frequency"],
        ["Rainfall heatmap", "Current and forecast rainfall intensity", "Every radar scan (~5–10 min)"],
        ["Flood depth overlay", "Per-road colour-coded depth", "Every forecast cycle"],
        ["Flood velocity", "Flow velocity vectors", "Every forecast cycle"],
        ["Drainage stress", "Pipe utilisation percentage", "Every SWMM run"],
        ["Drainage anomalies", "Flagged nodes with anomaly confidence", "Event-driven"],
        ["River / dam influence", "River extent + dam-affected zones", "CWC data refresh"],
        ["SOS reports", "Aggregated icons (not individual)", "Real-time"],
        ["Rescue teams", "Team locations", "Real-time"],
        ["Shelters", "Capacity + status", "Event-driven"],
        ["Safe routes", "Highlighted paths on request", "On demand"],
    ]
    add(Table(dashboard_layers, colWidths=[4*cm, 7.5*cm, 5*cm], style=table_style()))

    # ── ROUTING ─────────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("17. Flood-Safe Routing Engine", styles))
    add(*img_flowable(diags.get("routing"), 15.0,
        "OSRM road-network routing is enhanced with dynamic flood-risk edge weights. "
        "Three routing modes serve different user needs.",
        "Figure 15: Flood-Safe Routing Engine", styles))
    add(body(
        "HydroGraph integrates OSRM (Open Source Routing Machine) [4], an open-source "
        "routing engine, with a dynamic edge-weight layer derived from real-time flood "
        "predictions. Every road segment's routing cost is modified by a flood-risk "
        "multiplier, causing severe-risk roads to be avoided automatically.", styles))

    routing_req = [
        ["FR-ROUTE-001", "System SHALL compute flood-safe routes on request.", "Must Have"],
        ["FR-ROUTE-002", "Routing SHALL apply configurable flood-risk edge penalties.", "Must Have"],
        ["FR-ROUTE-003", "SEVERE-risk roads SHALL be blocked from routing.", "Must Have"],
        ["FR-ROUTE-004", "Emergency mode SHALL prioritise route reliability over travel time.", "Must Have"],
        ["FR-ROUTE-005", "Routing SHALL fall back to internal graph routing if OSRM unavailable.", "Must Have"],
        ["FR-ROUTE-006", "Target: ≥90% of recommended routes avoid predicted high-risk segments.", "Target"],
    ]
    add(Table(routing_req, colWidths=[3*cm, 10.5*cm, 3*cm], style=table_style()))

    # ── SHELTER ENGINE ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("18. Shelter Recommendation Engine", styles))
    add(*img_flowable(diags.get("shelter"), 12.0,
        "The shelter algorithm filters candidates on flood safety, capacity, route safety, "
        "and accessibility before recommending the optimal shelter.",
        "Figure 16: Smart Shelter Selection Algorithm", styles))
    add(body(
        "Simply recommending the nearest shelter is insufficient during flooding — "
        "the nearest shelter may be flooded, full, inaccessible, or unreachable by a safe route. "
        "HydroGraph applies a multi-criteria filter and ranking algorithm.", styles))

    shelter_attrs = [
        ["Attribute", "Description"],
        ["Location", "GPS coordinates + address"],
        ["Capacity", "Maximum occupancy"],
        ["Current occupancy", "Live count if available"],
        ["Status", "Open / Closed / Full / Flooded"],
        ["Flood safety", "Is the shelter itself within a flood zone?"],
        ["Route safety", "Is there a flood-safe path from citizen to shelter?"],
        ["Medical support", "On-site medical facility or staff"],
        ["Food / water / power", "Basic amenity availability"],
        ["Accessibility", "Wheelchair, elderly, children access"],
    ]
    add(Table(shelter_attrs, colWidths=[5*cm, 11.5*cm], style=table_style()))

    # ── CITIZEN PWA & SOS ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("19. Citizen PWA & SOS System", styles))
    add(*img_flowable(diags.get("ui_pwa"), 8.0,
        "The Citizen PWA is a mobile-first Progressive Web App requiring no installation. "
        "It provides warnings, safe routes, shelter info, and the SOS button.",
        "Figure — UI Screen 7: Citizen PWA (Conceptual Mockup)", styles))
    add(*img_flowable(diags.get("ui_sos"), 8.0,
        "The SOS screen collects minimal but critical information — location, people count, "
        "children, elderly, medical emergency — with a large emergency button.",
        "Figure — UI Screen 8: SOS Screen (Conceptual Mockup)", styles))

    add(*img_flowable(diags.get("sos"), 13.0,
        "SOS transmits via internet first, then falls back to SMS. "
        "Offline queue retries automatically when connectivity returns.",
        "Figure 17: Citizen SOS Workflow", styles))
    add(*img_flowable(diags.get("offline_sos"), 13.0,
        "Offline SOS is stored in IndexedDB and automatically retried. "
        "Peer relay via Bluetooth/Wi-Fi Direct is an experimental optional feature.",
        "Figure 18: Offline SOS Architecture", styles))

    add(warning(
        "If absolutely no communication medium exists — no internet, no SMS, no relay — "
        "no software-only system can transmit SOS data remotely. This is a fundamental "
        "physical limitation, not a design flaw.", styles))

    add(*section_h2("19.1 SOS Prioritisation Algorithm", styles))
    add(body("SOS reports are ranked by a weighted scoring function:", styles))
    sos_factors = [
        ["Factor", "Weight", "Example"],
        ["Medical emergency", "High", "Reported medical emergency +50 pts"],
        ["People count", "High", "Per person +10 pts"],
        ["Children present", "High", "+25 pts per child"],
        ["Elderly present", "High", "+20 pts per elderly"],
        ["Reported water depth", "Medium", "Per 10 cm +8 pts"],
        ["Flood severity at location", "Medium", "SEVERE +30 pts"],
        ["Time waiting", "Medium", "Per 10 min +5 pts"],
        ["Building vulnerability", "Low", "Ground floor +10 pts"],
    ]
    add(Table(sos_factors, colWidths=[5*cm, 3*cm, 8.5*cm], style=table_style()))

    # ── COMMAND CENTER & RESCUE ─────────────────────────────────────────────────
    add(PB())
    add(*section_h1("20. Emergency Command Centre & Rescue Dispatch", styles))
    add(*img_flowable(diags.get("cmd_center"), 14.0,
        "Municipal operators see all flood, SOS, rescue, and shelter information in one view "
        "and can take direct action from the command centre.",
        "Figure 19: Emergency Command Centre", styles))
    add(*img_flowable(diags.get("citizen_rescue"), 12.0,
        "The complete citizen-to-rescue workflow from flood warning through SOS, "
        "dispatch, rescue, and shelter recommendation.",
        "Figure 20: Complete Citizen-to-Rescue Workflow", styles))

    rescue_statuses = [
        ["Status", "Meaning", "Trigger"],
        ["RECEIVED", "SOS logged in system", "PWA submission"],
        ["VERIFIED", "Location confirmed", "Automatic geocode + flood check"],
        ["ASSIGNED", "Rescue team assigned", "Operator / auto-dispatch"],
        ["EN ROUTE", "Team is travelling", "Team confirms departure"],
        ["RESCUED", "Citizen reached", "Team confirms"],
        ["CLOSED", "Case resolved", "Team + operator confirm"],
    ]
    add(Table(rescue_statuses, colWidths=[3*cm, 5*cm, 8.5*cm], style=table_style()))

    # ── WHAT-IF ─────────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("21. What-If Scenario Simulation", styles))
    add(*img_flowable(diags.get("whatif"), 13.0,
        "Operators can test the impact of changed rainfall, drainage capacity, river level, "
        "or road-closure scenarios against the baseline simulation.",
        "Figure 21: What-If Scenario Simulation Engine", styles))

    add(*section_h1("22. Historical Event Replay", styles))
    add(*img_flowable(diags.get("historical"), 12.0,
        "Replaying historical events validates model skill and powers the SIH demonstration "
        "without waiting for a real flood event during judging.",
        "Figure 22: Historical Event Replay & Validation", styles))

    # ── VALIDATION ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("23. Validation & Accuracy Targets", styles))
    add(warning(
        "No fixed accuracy numbers are claimed without validation. The following are "
        "engineering TARGETS. Actual performance must be measured and reported after "
        "validation against historical events with observed data.", styles))

    val_data = [
        ["Metric", "Target", "Measurement Method"],
        ["Flood location F1 score", "≥ 0.80", "Binary flood/no-flood classification vs observations"],
        ["Water depth MAE", "≤ 10 cm (where observations exist)", "Gauge / citizen report comparison"],
        ["Time-to-flood error", "≤ 15 minutes", "Observed vs predicted flood onset time"],
        ["Flood area IoU", "≥ 0.65", "Predicted vs mapped flood extent"],
        ["Routing safety", "≥ 90% routes avoid high-risk segments", "Post-event route audit"],
        ["GNN vs SWMM RMSE", "≤ 5 cm on held-out data", "Cross-validation"],
        ["GNN inference latency", "< 1 second per forecast cycle", "Benchmarking"],
    ]
    add(Table(val_data, colWidths=[5*cm, 5*cm, 6.5*cm], style=table_style()))
    add(note(
        "If actual testing produces different values, the PRD and demonstration materials "
        "must report actual measured values rather than targets.", styles))

    # ── FAIL-SAFE ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("24. Fail-Safe Architecture", styles))
    add(*img_flowable(diags.get("failsafe"), 15.0,
        "Every major component has a defined degradation path. The system never fails silently. "
        "All degradations are surfaced to operators.",
        "Figure 23: Fail-Safe Degradation Architecture", styles))

    failsafe_data = [
        ["Failure", "Detection", "Fallback", "User Impact"],
        ["GNN fails", "Confidence check / error threshold", "Hydraulic simulator", "Slower predictions"],
        ["Radar unavailable", "Freshness check", "Latest valid radar + increased uncertainty", "Wider confidence range"],
        ["Drainage data incomplete", "Graph connectivity check", "Model runs; lower confidence shown", "Reduced accuracy disclosed"],
        ["OSRM unavailable", "Health check", "Internal Dijkstra/A* routing", "Reduced route quality"],
        ["Internet down (SOS)", "Connection check", "Offline queue + SMS fallback", "Delayed SOS delivery"],
        ["Database down", "Health check", "Cache / read-only mode", "No new predictions"],
    ]
    add(Table(failsafe_data, colWidths=[3.5*cm, 4*cm, 4.5*cm, 4.5*cm], style=table_style()))

    # ── DATABASE & API ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("25. Data Architecture", styles))
    add(*img_flowable(diags.get("er"), 16.0,
        "All major entities and their relationships in the HydroGraph PostgreSQL/PostGIS database.",
        "Figure 25: Database Entity-Relationship Diagram", styles))

    add(*section_h1("26. API Architecture", styles))
    api_data = [
        ["Method", "Endpoint", "Purpose", "Auth"],
        ["GET", "/api/v1/forecast/latest", "Latest flood forecast for full pilot zone", "Operator"],
        ["GET", "/api/v1/hotspots", "Top N highest-risk road segments", "Public"],
        ["GET", "/api/v1/flood/{road_id}", "Flood metrics for a specific road", "Public"],
        ["GET", "/api/v1/drainage/status", "Drainage network utilisation", "Operator"],
        ["GET", "/api/v1/drainage/anomalies", "Flagged anomaly nodes", "Operator"],
        ["POST", "/api/v1/simulation", "Trigger what-if scenario simulation", "Operator"],
        ["POST", "/api/v1/route", "Request flood-safe route", "Public"],
        ["GET", "/api/v1/shelters/safe", "List safe shelters (filtered)", "Public"],
        ["POST", "/api/v1/sos", "Submit SOS report", "Public (rate limited)"],
        ["GET", "/api/v1/sos/priority", "Prioritised SOS queue", "Rescue/Operator"],
        ["POST", "/api/v1/rescue/assign", "Assign rescue team to SOS", "Operator"],
        ["POST", "/api/v1/road/closure", "Create manual road closure", "Operator"],
        ["GET", "/api/v1/system/health", "System observability summary", "Admin"],
    ]
    add(Table(api_data, colWidths=[2*cm, 5.5*cm, 6*cm, 3*cm], style=table_style()))

    # ── TECH STACK ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("27. Technology Stack", styles))
    tech_data = [
        ["Category", "Technology", "Purpose"],
        ["Frontend", "React + TypeScript", "Interactive web UI"],
        ["Frontend", "MapLibre GL JS", "Vector tile map rendering"],
        ["Frontend", "Tailwind CSS", "Styling"],
        ["Frontend", "Recharts", "Charts and timelines"],
        ["Backend", "Python 3.11 + FastAPI", "REST API and orchestration"],
        ["Backend", "Pydantic", "Data validation"],
        ["Geospatial", "GDAL / Rasterio / GeoPandas", "Raster/vector processing"],
        ["Geospatial", "Shapely / PyProj", "Geometry and projection"],
        ["Database", "PostgreSQL + PostGIS", "Spatial data storage and querying"],
        ["Numerical", "NumPy / SciPy", "Numerical computation"],
        ["Nowcasting", "PySTEPS", "Probabilistic rainfall nowcasting"],
        ["Hydraulic", "EPA SWMM / PySWMM", "1D drainage simulation"],
        ["Hydraulic", "LISFLOOD-FP (or equivalent)", "2D surface flood simulation"],
        ["AI/ML", "PyTorch + PyTorch Geometric", "ST-GNN training and inference"],
        ["Routing", "OSRM", "Road-network routing"],
        ["Cache/Queue", "Redis", "Session cache, task queue"],
        ["Workers", "Celery / RQ", "Background simulation tasks"],
        ["Deployment", "Docker + Docker Compose", "Containerisation"],
        ["Storage", "PostgreSQL / MinIO", "Relational + object storage"],
    ]
    add(Table(tech_data, colWidths=[3*cm, 5*cm, 8.5*cm], style=table_style()))

    # ── SECURITY ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("28. Security & Privacy", styles))
    sec_data = [
        ["Measure", "Details"],
        ["HTTPS everywhere", "All API and PWA traffic over TLS 1.2+"],
        ["JWT authentication", "Token-based auth for all non-public endpoints"],
        ["Role-based access control", "Citizen / Operator / Rescue / Authority / Admin"],
        ["SOS data encryption", "Location and personal data encrypted at rest and in transit"],
        ["Minimal data collection", "Only data necessary for SOS is collected"],
        ["Audit logging", "All operator actions logged with timestamp and user ID"],
        ["API rate limiting", "SOS endpoint: max 5 per device per 10 minutes"],
        ["Input validation", "All user input validated server-side before processing"],
        ["SOS location privacy", "Public dashboard shows aggregated clusters, not individual locations"],
        ["Data retention", "SOS personal data deleted after 90 days or case closure"],
    ]
    add(Table(sec_data, colWidths=[5*cm, 11.5*cm], style=table_style()))

    # ── DEPLOYMENT ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("29. Deployment Architecture", styles))
    add(*img_flowable(diags.get("deploy"), 15.0,
        "All HydroGraph services are containerised using Docker. The MVP uses Docker Compose. "
        "Kubernetes can be evaluated if scale requirements demand it.",
        "Figure 24: Docker-Based Deployment Architecture", styles))

    docker_services = [
        ["Service", "Image Base", "Description"],
        ["frontend", "node:20 + nginx", "React app served via nginx"],
        ["backend", "python:3.11-slim", "FastAPI application"],
        ["postgres-postgis", "postgis/postgis:15", "Spatial database"],
        ["redis", "redis:7-alpine", "Cache and task queue"],
        ["worker", "python:3.11-slim", "Celery background workers"],
        ["swmm-engine", "python:3.11-slim", "PySWMM hydraulic simulation"],
        ["lisflood-engine", "custom C/python", "2D surface hydraulic solver"],
        ["gnn-service", "pytorch/pytorch:2.x", "GNN inference API"],
        ["routing-service", "osrm/osrm-backend", "OSRM routing engine"],
        ["object-storage", "minio/minio", "Raster and netCDF file storage"],
    ]
    add(Table(docker_services, colWidths=[4*cm, 4.5*cm, 8*cm], style=table_style()))

    # ── DEMONSTRATION SCENARIOS ─────────────────────────────────────────────────
    add(PB())
    add(*section_h1("30. Demonstration Scenarios", styles))
    add(*section_h2("30.1 Scenario A — Severe Monsoon Rainfall", styles))

    scenario_a = [
        ["T", "Event", "System Response"],
        ["T = 0", "Radar detects approaching heavy cell", "Rainfall nowcast initiated; no risk flag"],
        ["T +15 min", "Nowcast shows intensification to 65 mm/hr", "HEAVY RAIN alert; surface runoff model started"],
        ["T +30 min", "Runoff accumulates; drain utilisation 72%", "Flood map shows MODERATE risk on 12 roads"],
        ["T +45 min", "Drain utilisation reaches 90%", "Safe routes pre-computed; shelter list updated"],
        ["T +60 min", "Node DN-47 reaches surcharge", "Surcharge backflow into streets; HIGH risk flagged"],
        ["T +75 min", "8 roads exceed HIGH threshold", "Roads turn red on map; emergency routing active"],
        ["T +90 min", "Citizen SOS received", "SOS #10284 created; rescue team dispatched via safe route"],
        ["T +120 min", "Rainfall eases; drainage recovering", "Depth forecasts declining; roads re-opening"],
    ]
    add(Table(scenario_a, colWidths=[2.5*cm, 6.5*cm, 7.5*cm], style=table_style()))

    add(*section_h2("30.2 Scenario B — Dam / Reservoir Release", styles))
    add(body(
        "Upstream dam authorities announce a controlled release. CWC data shows river discharge "
        "rising from 800 m³/s to 2,400 m³/s over 3 hours. HydroGraph ingests the updated "
        "boundary conditions, propagates the flood wave through the urban domain, identifies "
        "low-lying zones at risk from river backwater, generates evacuation routes, and updates "
        "shelter availability. The system clearly labels the flood source as 'Dam/Reservoir Release'.", styles))

    add(*section_h2("30.3 Scenario C — Drainage Anomaly Detection", styles))
    add(body(
        "During a heavy-rain event, the physics model predicts 8 cm at Junction J-23. "
        "Citizen reports and available telemetry indicate 30 cm. Over three consecutive "
        "update cycles, the residual persists. The Anomaly Engine flags J-23 with: "
        "'Possible capacity reduction 60–80%. Confidence 74%. Recommended action: field inspection.' "
        "Operators are alerted and a maintenance team is dispatched. The system runs a "
        "50% capacity blockage scenario to show the likely flood impact if the anomaly persists.", styles))

    add(*section_h2("30.4 Scenario D — SOS with Network Failure", styles))
    add(body(
        "A citizen activates SOS in an area with lost internet connectivity. The PWA stores "
        "the SOS in IndexedDB. After 7 minutes, a partial SMS connection is restored. The "
        "SMS fallback transmits the SOS to the gateway. The server receives the SOS, "
        "calculates priority, and dispatches a rescue team via a flood-safe route.", styles))
    add(warning(
        "If no communication medium exists at all — no internet, no SMS signal, no peer relay — "
        "the SOS cannot be transmitted. This is a fundamental physical limitation that "
        "no software-only system can overcome.", styles))

    # ── MVP SCOPE ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("31. MVP Scope & Development Roadmap", styles))
    add(*section_h2("31.1 MVP Must Have", styles))
    mvp_must = ["Pilot zone selection and GIS data ingestion",
                "Rainfall nowcasting using PySTEPS",
                "DEM processing and terrain model",
                "Drainage graph construction and SWMM integration",
                "2D surface model (LISFLOOD-FP or equivalent) for pilot zone",
                "Coupled 1D/2D flood simulation",
                "Per-road flood depth, velocity, and time-to-flood",
                "GIS dashboard with time slider",
                "Flood-safe routing (OSRM)",
                "Confidence engine and uncertainty ranges",
                "Historical event replay for validation",
                "Docker Compose deployment"]
    for item in mvp_must:
        add(bullet(item, styles))

    add(*section_h2("31.2 MVP Should Have", styles))
    mvp_should = ["River/dam boundary integration",
                  "Drainage anomaly detection engine",
                  "Shelter recommendation engine",
                  "Citizen PWA with flood risk and SOS",
                  "What-if scenario simulation"]
    for item in mvp_should:
        add(bullet(item, styles))

    add(*section_h2("31.3 Future Scope", styles))
    future = ["ST-GNN surrogate with full validation pipeline",
              "Large-city multi-zone deployment",
              "GPU-accelerated hydraulic simulation",
              "Additional radar data providers",
              "Advanced mobile application with offline maps",
              "Camera/CCTV integration for visual depth estimation",
              "Municipal workflow automation",
              "National-level scaling to multiple pilot cities"]
    for item in future:
        add(bullet(item, styles))

    road_data = [
        ["Phase", "Deliverable", "Duration (indicative)"],
        ["1", "Data & GIS foundation: DEM, drainage, roads ingested", "2 weeks"],
        ["2", "Rainfall nowcasting: PySTEPS pipeline working", "1 week"],
        ["3", "Drainage graph: NetworkX model + SWMM integration", "2 weeks"],
        ["4", "2D surface model: LISFLOOD-FP on pilot zone", "2 weeks"],
        ["5", "1D/2D coupling: coupled simulation running", "2 weeks"],
        ["6", "Flood impact engine: depth, velocity, time-to-flood", "1 week"],
        ["7", "GIS dashboard: MapLibre map + time slider", "1.5 weeks"],
        ["8", "Routing: OSRM + dynamic flood weights", "1 week"],
        ["9", "Shelter + PWA + SOS", "2 weeks"],
        ["10", "Historical validation + demo preparation", "1 week"],
    ]
    add(Table(road_data, colWidths=[1.5*cm, 10.5*cm, 4.5*cm], style=table_style()))

    # ── LIMITATIONS ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("32. Limitations", styles))
    limitations = [
        ("L-01", "Radar availability", "IMD DWR coverage and data-access agreements vary by city. System degrades with lower-quality rainfall input."),
        ("L-02", "Drainage data completeness", "Municipal drain GIS is often incomplete or unavailable. Missing data reduces confidence."),
        ("L-03", "DEM resolution", "High-resolution DEM may not exist for every pilot area. SRTM (30 m) significantly reduces depth accuracy in flat terrain."),
        ("L-04", "Unknown underground blockage", "The system cannot physically detect underground garbage, sedimentation, or pipe damage. It can only infer anomalies from residuals."),
        ("L-05", "Communication failure", "SOS cannot be transmitted without any communication medium. Offline queue handles temporary outages only."),
        ("L-06", "Cloudburst predictability", "Convective initiation is inherently difficult to predict. Skill decreases rapidly beyond 60 minutes."),
        ("L-07", "Dam-release latency", "Upstream dam decisions may not reach the system promptly. Information latency is outside HydroGraph's control."),
        ("L-08", "GNN generalisation", "GNN may perform poorly on extreme or novel rainfall events outside its training distribution."),
        ("L-09", "Historical validation", "Where historical flood observations are sparse or unreliable, quantitative validation is limited."),
        ("L-10", "Scale", "Full metro-wide real-time 2D simulation is not computationally feasible on modest hardware without pre-computation or GPU."),
    ]
    lim_data = [["ID", "Limitation", "Mitigation"]] + [[l[0], l[1], l[2]] for l in limitations]
    add(Table(lim_data, colWidths=[1.5*cm, 4*cm, 11*cm], style=table_style()))

    # ── ACCEPTANCE CRITERIA ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("33. Acceptance Criteria", styles))
    ac_data = [
        ["AC-ID", "Criterion", "Pass Condition"],
        ["AC-01", "Rainfall ingestion", "Valid radar data → rainfall nowcast within 2 minutes"],
        ["AC-02", "Flood simulation", "DEM + drainage data → coupled flood simulation completes without error"],
        ["AC-03", "Risk classification", "Depth > HIGH threshold → road flagged HIGH/SEVERE on dashboard"],
        ["AC-04", "Flood-safe routing", "Flooded road → excluded from recommended route"],
        ["AC-05", "Shelter exclusion", "Flooded shelter → excluded from recommendations"],
        ["AC-06", "SOS creation", "SOS submitted → incident created within 5 seconds"],
        ["AC-07", "Offline SOS", "No internet → SOS stored locally → retransmitted when connection restored"],
        ["AC-08", "Confidence degradation", "Poor-quality data → confidence decreases + uncertainty widens"],
        ["AC-09", "GNN fallback", "GNN confidence below threshold → hydraulic model automatically used"],
        ["AC-10", "Historical replay", "Historical event → model runs → predicted vs observed overlay shown"],
        ["AC-11", "Drainage anomaly flag", "Persistent residual > threshold → anomaly alert generated"],
        ["AC-12", "What-if simulation", "Operator changes drainage capacity → model recomputes and compares"],
    ]
    add(Table(ac_data, colWidths=[2*cm, 5*cm, 9.5*cm], style=table_style()))

    # ── COMPETITIVE DIFFERENTIATION ─────────────────────────────────────────────
    add(PB())
    add(*section_h1("34. Competitive Differentiation", styles))
    diff_data = [
        ["Differentiator", "Description"],
        ["Coupled 1D/2D hydraulics", "SWMM + LISFLOOD-FP coupling — not just rainfall overlay on map"],
        ["Multi-source flood fusion", "Rainfall + river + dam + terrain + drainage in one model"],
        ["Time-to-Flood feature", "Countdown to dangerous depth — actionable warning, not static map"],
        ["Explainable flood cause", "'Surface accumulation + drainage stress' — not a black-box result"],
        ["Drainage anomaly intelligence", "Physics-residual-based capacity reduction inference"],
        ["Physics-trained GNN surrogate", "AI accelerates physics — does not replace it"],
        ["Confidence-aware prediction", "Every prediction has confidence %, range, and data quality flag"],
        ["What-if scenario engine", "Operators test drainage, rainfall, and river scenarios"],
        ["Flood-safe routing", "Dynamic OSRM with flood-risk weights — three user modes"],
        ["Shelter intelligence", "Multi-criteria shelter selection beyond nearest-first"],
        ["Offline-resilient SOS", "IndexedDB queue + SMS fallback — works under degraded connectivity"],
        ["Complete citizen-to-rescue", "Flood warning → SOS → dispatch → shelter in one platform"],
    ]
    add(Table(diff_data, colWidths=[5.5*cm, 11*cm], style=table_style()))

    # ── COST ANALYSIS ─────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("35. Cost Analysis & Open-Source Rationale", styles))
    cost_data = [
        ["Component", "Technology", "Cost"],
        ["Rainfall nowcasting", "PySTEPS", "Free / open-source"],
        ["Hydraulic 1D model", "EPA SWMM / PySWMM", "Free / public domain"],
        ["Hydraulic 2D model", "LISFLOOD-FP", "Free for research / academic use"],
        ["GIS processing", "GDAL / Rasterio / GeoPandas", "Free / open-source"],
        ["Database", "PostgreSQL + PostGIS", "Free / open-source"],
        ["AI framework", "PyTorch + PyTorch Geometric", "Free / open-source"],
        ["Routing", "OSRM", "Free / open-source"],
        ["Frontend", "React + MapLibre GL JS", "Free / open-source"],
        ["Deployment", "Docker / Docker Compose", "Free / open-source"],
        ["Cloud compute", "Any cloud / on-premise", "Operational cost — not zero"],
        ["Data access", "IMD / CWC / OSM", "Government data — access agreements required"],
    ]
    add(Table(cost_data, colWidths=[4.5*cm, 5.5*cm, 6.5*cm], style=table_style()))
    add(note(
        "HydroGraph does NOT claim zero operational cost. Infrastructure, cloud compute, "
        "data-access agreements, and maintenance are real costs. The open-source stack "
        "eliminates software licensing costs.", styles))

    # ── IMPACT ────────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("36. Impact & Value Proposition", styles))
    add(body(
        "HydroGraph targets three categories of impact: lives saved, economic protection, "
        "and operational efficiency. It does not claim to prevent flooding — it aims to "
        "reduce the consequences of flooding by providing earlier, more specific, and "
        "more actionable intelligence.", styles))

    impact_data = [
        ["Stakeholder", "Current Pain", "HydroGraph Value"],
        ["Citizen commuter", "No warning until flooding occurs", "30–90 min time-to-flood warning + safe route"],
        ["Emergency services", "Ad hoc deployment; unknown severity", "Priority-ranked SOS + flood-safe dispatch route"],
        ["Municipal authority", "Reactive decisions after flooding", "Proactive command centre + what-if planning"],
        ["Traffic management", "Road closures discovered reactively", "Predictive road-risk alerts for rerouting"],
        ["Hydrologist / engineer", "No coupled real-time tool", "Physics-based coupled simulation + anomaly detection"],
        ["Medical services", "No pre-positioning for floods", "Predicted affected zones → pre-position resources"],
    ]
    add(Table(impact_data, colWidths=[4*cm, 5.5*cm, 7*cm], style=table_style()))

    # ── ETHICAL STATEMENT ─────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("37. Ethical & Operational Safety Statement", styles))
    add(quote(
        "HydroGraph is a decision-support system, not a substitute for official emergency "
        "instructions. Official government warnings and emergency directives from authorised "
        "civil defence, disaster management, and municipal authorities always take precedence. "
        "HydroGraph predictions carry confidence estimates and uncertainty ranges. "
        "Human decision-making authority is never overridden by the system.", styles))

    add(body(
        "The following operational safety principles apply:", styles))
    safety = ["Official government warnings always have priority over HydroGraph predictions.",
              "All predictions include confidence and uncertainty information.",
              "The system discloses limitations proactively, not reactively.",
              "Rescue dispatch decisions are made by human operators, not autonomous AI.",
              "Citizen SOS data is treated as sensitive personal information.",
              "Model outputs are labelled as predictions/estimates, not ground truth.",
              "The system is a tool for human decision support — not a replacement for expertise."]
    for s in safety:
        add(bullet(s, styles))

    # ── REFERENCES ─────────────────────────────────────────────────────────────
    add(PB())
    add(*section_h1("38. References", styles))
    refs = [
        "[1] Pulkkinen, S., et al. (2019). PySTEPS: an open-source Python library for "
        "probabilistic precipitation nowcasting. Geoscientific Model Development, 12(10), 4185–4219.",
        "[2] US EPA SWMM: Storm Water Management Model Reference Manual Vol. I–III. "
        "EPA/600/R-17/111. 2017.",
        "[3] Bates, P.D., et al. (2010). A simple inertial formulation of the shallow water "
        "equations for efficient two-dimensional flood inundation modelling. "
        "Journal of Hydrology, 387(1–2), 33–45. (LISFLOOD-FP).",
        "[4] Luxen, D., & Vetter, C. (2011). Real-time routing with OpenStreetMap data. "
        "Proceedings of the 19th ACM SIGSPATIAL International Conference on Advances in GIS.",
        "[5] IMD Doppler Weather Radar Network — India Meteorological Department. "
        "https://mausam.imd.gov.in",
        "[6] Central Water Commission (CWC) — Real-Time Flood Monitoring. "
        "https://cwc.gov.in",
        "[7] OpenStreetMap Foundation. https://openstreetmap.org",
        "[8] ISRO Bhuvan Geoportal — Indian DEM and GIS data. https://bhuvan.nrsc.gov.in",
        "[9] PostGIS Documentation. https://postgis.net/docs/",
        "[10] OSRM (Open Source Routing Machine) Documentation. http://project-osrm.org",
    ]
    for ref in refs:
        add(bullet(ref, styles))

    # ── ONE-PAGE EXECUTIVE SUMMARY ─────────────────────────────────────────────
    add(PB())
    add(*section_h1("39. One-Page Executive Summary", styles))
    add(body("<b>Problem:</b> Urban flooding cannot be predicted reliably from rainfall alone. "
             "Knowing how much rain will fall does not tell a city which street will flood first, "
             "how deep the water will be, or when evacuation should begin.", styles))
    add(body("<b>Solution:</b> HydroGraph couples rainfall nowcasting, river/dam data, "
             "high-resolution terrain, and underground drainage hydraulics into one integrated "
             "physics-first simulation platform, accelerated by a validated AI surrogate.", styles))

    summary_io = [
        ["Inputs", "Outputs"],
        ["IMD Doppler Radar rainfall", "Street-level flood depth (cm)"],
        ["CWC river/dam data", "Flood velocity and duration"],
        ["DEM / terrain model", "Time-to-Flood (minutes)"],
        ["Drainage network graph", "Flood risk classification (LOW→SEVERE)"],
        ["Citizen SOS reports", "Flood-safe routes (3 modes)"],
        ["Optional municipal telemetry", "Safe shelter recommendations"],
        ["", "Drainage anomaly alerts (inferred)"],
        ["", "Confidence % + uncertainty range"],
        ["", "Citizen SOS + rescue dispatch"],
    ]
    add(Table(summary_io, colWidths=[8*cm, 8.5*cm], style=table_style()))
    add(SP(1, 0.3*cm))
    add(quote(
        "Physics for trust, AI for speed, uncertainty for honesty, fallback systems for reliability.", styles))
    add(quote(
        "Predict → Explain → Warn → Route → Evacuate → Rescue.", styles))
    add(quote(
        "HydroGraph transforms fragmented weather, terrain, drainage and emergency information "
        "into a unified street-level flood intelligence system.", styles))

    return story


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("HydroGraph PRD Generator — SIH 2026")
    print("=" * 60)

    # 1. Generate all diagram images
    diags = generate_all_diagrams()
    print(f"\n✓ Generated {len(diags)} diagram images in {IMG_DIR}")

    # 2. Build styles
    styles = make_styles()

    # 3. Build story (content)
    print("\nBuilding PDF content...")
    story = build_content(styles, diags)

    # 4. Render PDF
    print(f"\nRendering PDF → {PDF_PATH}")
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2.0 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title="HydroGraph PRD — SIH 2026",
        author="HydroGraph Team — SIH 2026",
        subject="Urban Flood Nowcasting System",
    )
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)

    size_mb = os.path.getsize(PDF_PATH) / 1024 / 1024
    print(f"\n{'='*60}")
    print(f"✅  PDF generated successfully!")
    print(f"   Path : {PDF_PATH}")
    print(f"   Size : {size_mb:.2f} MB")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
