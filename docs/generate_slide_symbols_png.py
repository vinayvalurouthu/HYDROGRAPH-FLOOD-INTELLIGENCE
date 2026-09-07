import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'DejaVu Sans']
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, Arc, Wedge, Ellipse
import matplotlib.patheffects as pe

# Palette definition matching reference slide
BLUE_DARK   = "#0D47A1"
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
GREY_LIGHT  = "#F8FAFC"
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

# ─── VECTOR SYMBOL GENERATORS ───

def icon_html(ax, x, y, s=0.18):
    # Orange shield
    pts = np.array([[x-s, y+s*1.1], [x+s, y+s*1.1], [x+s*0.8, y-s*0.8], [x, y-s*1.2], [x-s*0.8, y-s*0.8]])
    ax.add_patch(Polygon(pts, facecolor="#E44D26", edgecolor="none", zorder=4))
    # Right half darker
    pts_r = np.array([[x, y+s*1.1], [x+s, y+s*1.1], [x+s*0.8, y-s*0.8], [x, y-s*1.2]])
    ax.add_patch(Polygon(pts_r, facecolor="#F16529", edgecolor="none", zorder=5))
    ax.text(x, y-s*0.05, "5", fontsize=10, fontweight="bold", color="white", ha="center", va="center", zorder=6)

def icon_css(ax, x, y, s=0.18):
    # Blue shield
    pts = np.array([[x-s, y+s*1.1], [x+s, y+s*1.1], [x+s*0.8, y-s*0.8], [x, y-s*1.2], [x-s*0.8, y-s*0.8]])
    ax.add_patch(Polygon(pts, facecolor="#1572B6", edgecolor="none", zorder=4))
    pts_r = np.array([[x, y+s*1.1], [x+s, y+s*1.1], [x+s*0.8, y-s*0.8], [x, y-s*1.2]])
    ax.add_patch(Polygon(pts_r, facecolor="#33A9DC", edgecolor="none", zorder=5))
    ax.text(x, y-s*0.05, "3", fontsize=10, fontweight="bold", color="white", ha="center", va="center", zorder=6)

def icon_js(ax, x, y, s=0.18):
    draw_card(ax, x-s, y-s, s*2, s*2, "#F7DF1E", "none", radius=0.04, zorder=4)
    ax.text(x+s*0.15, y-s*0.15, "JS", fontsize=9.5, fontweight="bold", color="#000000", ha="center", va="center", zorder=5)

def icon_react(ax, x, y, s=0.22):
    # Cyan atom
    ax.add_patch(Circle((x, y), s*0.22, facecolor="#00D8FF", edgecolor="none", zorder=5))
    ax.add_patch(Ellipse((x, y), s*2.2, s*0.75, angle=0, fill=False, edgecolor="#00D8FF", linewidth=1.5, zorder=4))
    ax.add_patch(Ellipse((x, y), s*2.2, s*0.75, angle=60, fill=False, edgecolor="#00D8FF", linewidth=1.5, zorder=4))
    ax.add_patch(Ellipse((x, y), s*2.2, s*0.75, angle=120, fill=False, edgecolor="#00D8FF", linewidth=1.5, zorder=4))

def icon_tailwind(ax, x, y, s=0.2):
    # Twin cyan waves
    t = np.linspace(-s, s, 50)
    w1 = y + 0.08 * np.sin(t / s * np.pi)
    w2 = y - 0.08 + 0.08 * np.sin(t / s * np.pi)
    ax.plot(x + t, w1, color="#38BDF8", lw=3.2, zorder=4)
    ax.plot(x + t, w2, color="#0EA5E9", lw=2.5, zorder=4)

def icon_leaflet(ax, x, y, s=0.2):
    # Green leaf
    pts = np.array([[x, y-s], [x+s*0.8, y-s*0.2], [x+s*0.7, y+s*0.7], [x, y+s], [x-s*0.7, y+s*0.4], [x-s*0.6, y-s*0.4]])
    ax.add_patch(Polygon(pts, facecolor="#199900", edgecolor="#0F6600", lw=1, zorder=4))
    ax.plot([x, x], [y-s, y+s*0.7], color="#FFFFFF", lw=1.2, zorder=5)

def icon_recharts(ax, x, y, s=0.2):
    # Mini colorful bar chart
    cols = ["#8884D8", "#82CA9D", "#FFC658"]
    heights = [s*0.8, s*1.4, s*1.0]
    for i in range(3):
        bx = x - s*0.7 + i*s*0.7
        bh = heights[i]
        draw_card(ax, bx, y - s*0.6, s*0.5, bh, cols[i], "none", radius=0.02, zorder=4)

def icon_fastapi(ax, x, y, s=0.22):
    # Teal circle with white lightning bolt
    ax.add_patch(Circle((x, y), s, facecolor="#009688", edgecolor="none", zorder=4))
    pts = np.array([[x+s*0.1, y+s*0.6], [x-s*0.4, y], [x, y], [x-s*0.1, y-s*0.6], [x+s*0.4, y], [x, y]])
    ax.add_patch(Polygon(pts, facecolor="white", edgecolor="none", zorder=5))

def icon_python(ax, x, y, s=0.22):
    # Blue and yellow interlocking snakes
    ax.add_patch(Circle((x-s*0.2, y+s*0.2), s*0.45, facecolor="#3572A5", edgecolor="none", zorder=4))
    ax.add_patch(Circle((x+s*0.2, y-s*0.2), s*0.45, facecolor="#FFD43B", edgecolor="none", zorder=4))
    ax.add_patch(Circle((x-s*0.25, y+s*0.3), s*0.1, facecolor="white", edgecolor="none", zorder=5))
    ax.add_patch(Circle((x+s*0.25, y-s*0.3), s*0.1, facecolor="white", edgecolor="none", zorder=5))

def icon_sqlite(ax, x, y, s=0.22):
    # Database cylinder stack
    for i, dy in enumerate([s*0.4, 0, -s*0.4]):
        ax.add_patch(Ellipse((x, y+dy), s*1.6, s*0.6, facecolor="#003B57", edgecolor="#002233", lw=1, zorder=4+i))
        ax.add_patch(Ellipse((x, y+dy+0.03), s*1.4, s*0.45, facecolor="#0284C7", edgecolor="none", zorder=5+i))

def icon_postgis(ax, x, y, s=0.22):
    # Globe with latitude/longitude grid lines
    ax.add_patch(Circle((x, y), s, facecolor="#336791", edgecolor="#1D3C55", lw=1.2, zorder=4))
    ax.add_patch(Ellipse((x, y), s*1.8, s*0.8, fill=False, edgecolor="white", lw=1, zorder=5))
    ax.plot([x, x], [y-s, y+s], color="white", lw=1, zorder=5)
    ax.plot([x-s, x+s], [y, y], color="white", lw=1, zorder=5)

def icon_docker(ax, x, y, s=0.22):
    # Blue container ship / whale
    ax.add_patch(Circle((x, y), s, facecolor="#2496ED", edgecolor="none", zorder=4))
    # Container boxes
    for row in range(2):
        for col in range(3):
            bx = x - s*0.45 + col*s*0.32
            by = y - s*0.15 + row*s*0.28
            draw_card(ax, bx, by, s*0.26, s*0.22, "white", "#1D78BE", lw=0.8, radius=0.01, zorder=5)

def icon_osrm(ax, x, y, s=0.22):
    # Road navigation marker & path
    ax.add_patch(Circle((x, y), s, facecolor="#16A34A", edgecolor="none", zorder=4))
    # White turning arrow
    ax.plot([x-s*0.4, x, x], [y-s*0.3, y-s*0.3, y+s*0.4], color="white", lw=2.2, zorder=5)
    ax.add_patch(Polygon([[x-s*0.25, y+s*0.3], [x+s*0.25, y+s*0.3], [x, y+s*0.6]], facecolor="white", edgecolor="none", zorder=5))

# ─── PLATFORM & SIMULATION ICONS ───

def icon_radar(ax, x, y, s=0.3):
    # Radar dish + signal waves
    dish = Arc((x-s*0.2, y-s*0.1), s*1.6, s*1.6, angle=0, theta1=290, theta2=70, color=PURPLE_DARK, lw=2.5, zorder=4)
    ax.add_patch(dish)
    ax.plot([x-s*0.2, x+s*0.2], [y-s*0.1, y+s*0.2], color=PURPLE_DARK, lw=2, zorder=4)
    # Stand
    ax.plot([x-s*0.4, x-s*0.2], [y-s*0.5, y-s*0.1], color=PURPLE_DARK, lw=2.2, zorder=4)
    ax.plot([x-s*0.6, x-s*0.2], [y-s*0.5, y-s*0.5], color=PURPLE_DARK, lw=2.5, zorder=4)
    # Emitting pulse rings
    for r in [0.2, 0.4, 0.6]:
        arc = Arc((x+s*0.2, y+s*0.2), r, r, angle=0, theta1=30, theta2=90, color=PURPLE_MID, lw=1.8, zorder=4)
        ax.add_patch(arc)

def icon_swmm_pipe(ax, x, y, s=0.3):
    # Pipe conduit cross section
    ax.add_patch(Circle((x, y), s*0.8, fill=False, edgecolor=PURPLE_DARK, lw=2.8, zorder=4))
    # Water filling lower half
    w_pts = []
    for deg in range(190, 350, 10):
        rad = np.radians(deg)
        w_pts.append([x + s*0.75*np.cos(rad), y + s*0.75*np.sin(rad)])
    w_pts.append([x - s*0.75*np.cos(np.radians(190)), y + s*0.75*np.sin(np.radians(350))])
    ax.add_patch(Wedge((x, y), s*0.75, 180, 360, facecolor=BLUE_MID, edgecolor="none", zorder=5))
    ax.plot([x-s*0.75, x+s*0.75], [y, y], color=BLUE_DARK, lw=1.8, zorder=6)

def icon_lisflood_surface(ax, x, y, s=0.3):
    # 2D surface grid with inundation water layer
    # 3 terrain blocks
    for i, ox in enumerate([-s*0.6, 0, s*0.6]):
        draw_card(ax, x+ox-s*0.25, y-s*0.6, s*0.5, s*0.4, "#D1D5DB", "#9CA3AF", lw=1, radius=0.02, zorder=4)
    # Wavy water top layer
    t = np.linspace(-s*0.8, s*0.8, 40)
    w_wave = y + s*0.1 + 0.06 * np.sin(t / s * 2 * np.pi)
    ax.plot(x + t, w_wave, color=BLUE_MID, lw=3, zorder=5)
    ax.plot(x + t, w_wave - 0.12, color=BLUE_LIGHT, lw=2, zorder=5)

def icon_coupling_flux(ax, x, y, s=0.3):
    # Bi-directional exchange flux arrows
    ax.plot([x-s*0.8, x+s*0.8], [y+s*0.4, y+s*0.4], color=PURPLE_DARK, lw=2, zorder=4) # surface
    ax.plot([x-s*0.8, x+s*0.8], [y-s*0.4, y-s*0.4], color=GREY_MID, lw=2, zorder=4) # pipe
    # Manhole shaft
    ax.plot([x-s*0.3, x-s*0.3], [y-s*0.4, y+s*0.4], color=GREY_BDR, lw=1.5, ls="--", zorder=4)
    ax.plot([x+s*0.3, x+s*0.3], [y-s*0.4, y+s*0.4], color=GREY_BDR, lw=1.5, ls="--", zorder=4)
    # Two vertical arrows
    draw_arrow(ax, x-s*0.1, y-s*0.25, x-s*0.1, y+s*0.3, PURPLE_MID, lw=2.2)
    draw_arrow(ax, x+s*0.1, y+s*0.25, x+s*0.1, y-s*0.3, BLUE_MID, lw=2.2)

def icon_dam_boundary(ax, x, y, s=0.3):
    # Dam barrier with discharge
    pts = [[x-s*0.7, y-s*0.6], [x-s*0.2, y+s*0.5], [x+s*0.1, y+s*0.5], [x+s*0.6, y-s*0.6]]
    ax.add_patch(Polygon(pts, facecolor=PURPLE_DARK, edgecolor="none", zorder=4))
    # Upstream reservoir water (left)
    ax.add_patch(Rectangle((x-s*0.9, y-s*0.6), s*0.3, s*0.8, facecolor=BLUE_MID, edgecolor="none", zorder=3))
    # Spillway water discharge (right)
    ax.plot([x+s*0.1, x+s*0.7], [y+s*0.3, y-s*0.5], color=BLUE_LIGHT, lw=3, zorder=5)

# ─── VISUALIZATION ICONS ───

def icon_depth_contours(ax, x, y, s=0.3):
    # Concentric topographic depth contour rings
    for r, col in zip([s*0.8, s*0.55, s*0.3], ["#FED7AA", "#FB923C", "#EA580C"]):
        ax.add_patch(Ellipse((x, y), r*1.8, r*1.2, fill=True, facecolor=col, edgecolor=ORANGE_DARK, lw=1, zorder=4))
    ax.text(x, y, "35cm", fontsize=7.5, fontweight="bold", color="white", ha="center", va="center", zorder=5)

def icon_hotspot_matrix(ax, x, y, s=0.3):
    # Warning triangle with rank indicator
    pts = [[x, y+s*0.7], [x+s*0.8, y-s*0.6], [x-s*0.8, y-s*0.6]]
    ax.add_patch(Polygon(pts, facecolor="#FBBF24", edgecolor=ORANGE_MID, lw=1.5, zorder=4))
    ax.text(x, y-s*0.1, "!", fontsize=13, fontweight="bold", color=ORANGE_DARK, ha="center", va="center", zorder=5)

def icon_safe_evac(ax, x, y, s=0.3):
    # Isochrone green pathway
    ax.plot([x-s*0.6, x-s*0.1, x+s*0.6], [y-s*0.5, y+s*0.2, y+s*0.6], color=GREEN_MID, lw=3.2, zorder=4)
    # Start & end waypoints
    ax.add_patch(Circle((x-s*0.6, y-s*0.5), s*0.18, facecolor=BLUE_MID, edgecolor="white", lw=1.2, zorder=5))
    ax.add_patch(Circle((x+s*0.6, y+s*0.6), s*0.18, facecolor=GREEN_DARK, edgecolor="white", lw=1.2, zorder=5))

def icon_drain_surcharge(ax, x, y, s=0.3):
    # Underground pipe with surcharge water fountain
    ax.plot([x-s*0.8, x+s*0.8], [y-s*0.3, y-s*0.3], color=ORANGE_DARK, lw=3, zorder=4)
    # Vertical surcharge spray
    ax.plot([x, x], [y-s*0.3, y+s*0.5], color=BLUE_MID, lw=2.5, zorder=5)
    ax.plot([x-s*0.25, x, x+s*0.25], [y+s*0.2, y+s*0.5, y+s*0.2], color=BLUE_MID, lw=2, zorder=5)

def icon_sandbox(ax, x, y, s=0.3):
    # 2 Control adjustment sliders
    for dy, tx in zip([s*0.25, -s*0.25], [-s*0.2, s*0.3]):
        ax.plot([x-s*0.7, x+s*0.7], [y+dy, y+dy], color=GREY_BDR, lw=2.5, zorder=4)
        ax.add_patch(Circle((x+tx, y+dy), s*0.2, facecolor=ORANGE_MID, edgecolor="white", lw=1.2, zorder=5))

# ─── PLATFORM ACTION ICONS ───

def icon_map_layer(ax, x, y, s=0.25):
    # 3-fold folded map
    pts1 = [[x-s*0.8, y-s*0.6], [x-s*0.3, y-s*0.4], [x-s*0.3, y+s*0.6], [x-s*0.8, y+s*0.4]]
    pts2 = [[x-s*0.3, y-s*0.4], [x+s*0.3, y-s*0.6], [x+s*0.3, y+s*0.4], [x-s*0.3, y+s*0.6]]
    pts3 = [[x+s*0.3, y-s*0.6], [x+s*0.8, y-s*0.4], [x+s*0.8, y+s*0.6], [x+s*0.3, y+s*0.4]]
    ax.add_patch(Polygon(pts1, facecolor="#93C5FD", edgecolor=BLUE_MID, lw=1, zorder=4))
    ax.add_patch(Polygon(pts2, facecolor="#60A5FA", edgecolor=BLUE_MID, lw=1, zorder=4))
    ax.add_patch(Polygon(pts3, facecolor="#3B82F6", edgecolor=BLUE_MID, lw=1, zorder=4))

def icon_hotspot_pin(ax, x, y, s=0.25):
    # Location pin with exclamation point
    pts = [[x, y-s*0.6], [x+s*0.45, y], [x+s*0.45, y+s*0.3], [x-s*0.45, y+s*0.3], [x-s*0.45, y]]
    ax.add_patch(Polygon(pts, facecolor=BLUE_MID, edgecolor="none", zorder=4))
    ax.add_patch(Circle((x, y+s*0.25), s*0.45, facecolor=BLUE_MID, edgecolor="none", zorder=4))
    ax.add_patch(Circle((x, y+s*0.25), s*0.2, facecolor="white", edgecolor="none", zorder=5))

def icon_safe_route(ax, x, y, s=0.25):
    # Navigation route with turn arrow
    ax.plot([x-s*0.5, x+s*0.1, x+s*0.1], [y-s*0.5, y-s*0.5, y+s*0.4], color=BLUE_MID, lw=2.8, zorder=4)
    ax.add_patch(Polygon([[x-s*0.1, y+s*0.3], [x+s*0.3, y+s*0.3], [x+s*0.1, y+s*0.6]], facecolor=BLUE_MID, edgecolor="none", zorder=5))

def icon_shelter_building(ax, x, y, s=0.25):
    # Building with first-aid cross
    ax.add_patch(Rectangle((x-s*0.5, y-s*0.5), s, s*0.8, facecolor=BLUE_LIGHT, edgecolor=BLUE_MID, lw=1.2, zorder=4))
    # Roof pediment
    pts = [[x-s*0.6, y+s*0.3], [x+s*0.6, y+s*0.3], [x, y+s*0.7]]
    ax.add_patch(Polygon(pts, facecolor=BLUE_MID, edgecolor="none", zorder=4))
    # Medical cross
    ax.plot([x, x], [y-s*0.3, y+s*0.1], color=RED_MID, lw=2.5, zorder=5)
    ax.plot([x-s*0.2, x+s*0.2], [y-s*0.1, y-s*0.1], color=RED_MID, lw=2.5, zorder=5)

def icon_sos_beacon(ax, x, y, s=0.25):
    # Red circle SOS beacon
    ax.add_patch(Circle((x, y), s*0.8, facecolor=RED_MID, edgecolor="#991B1B", lw=1.5, zorder=4))
    ax.text(x, y, "SOS", fontsize=8.5, fontweight="bold", color="white", ha="center", va="center", zorder=5)
    # Radiating waves
    for r in [s*1.1, s*1.35]:
        ax.add_patch(Arc((x, y), r*2, r*2, angle=0, theta1=45, theta2=135, color=RED_MID, lw=1.2, zorder=3))

# ─── USER ICONS ───

def icon_sdma_gov(ax, x, y, s=0.18):
    # Classical civic building with 3 columns & roof
    pts = [[x-s*1.1, y+s*0.2], [x+s*1.1, y+s*0.2], [x, y+s*0.9]]
    ax.add_patch(Polygon(pts, facecolor="white", edgecolor="none", zorder=4))
    for ox in [-s*0.7, 0, s*0.7]:
        ax.plot([x+ox, x+ox], [y-s*0.6, y+s*0.2], color="white", lw=2, zorder=4)
    ax.plot([x-s*1.1, x+s*1.1], [y-s*0.6, y-s*0.6], color="white", lw=2, zorder=4)

def icon_responder_shield(ax, x, y, s=0.18):
    # Protection shield with rescue star
    pts = [[x-s*0.8, y+s*0.8], [x+s*0.8, y+s*0.8], [x+s*0.7, y-s*0.2], [x, y-s*0.9], [x-s*0.7, y-s*0.2]]
    ax.add_patch(Polygon(pts, facecolor="white", edgecolor="none", zorder=4))
    ax.plot([x, x], [y-s*0.4, y+s*0.5], color=BLUE_MID, lw=2.2, zorder=5)
    ax.plot([x-s*0.4, x+s*0.4], [y+s*0.05, y+s*0.05], color=BLUE_MID, lw=2.2, zorder=5)

def icon_citizens_group(ax, x, y, s=0.18):
    # 3 user silhouettes
    ax.add_patch(Circle((x, y+s*0.3), s*0.32, facecolor="white", edgecolor="none", zorder=4))
    ax.add_patch(Ellipse((x, y-s*0.4), s*1.1, s*0.6, facecolor="white", edgecolor="none", zorder=4))
    # Side silhouettes
    ax.add_patch(Circle((x-s*0.6, y+s*0.15), s*0.24, facecolor=(1, 1, 1, 0.7), edgecolor="none", zorder=3))
    ax.add_patch(Circle((x+s*0.6, y+s*0.15), s*0.24, facecolor=(1, 1, 1, 0.7), edgecolor="none", zorder=3))

# ─── MAIN SLIDE BUILDER ───

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
    ax.plot([0.62, 0.72, 0.80, 0.88, 0.98], [10.35, 10.42, 10.35, 10.28, 10.35], color=BLUE_MID, lw=2.2, zorder=4)
    ax.plot([0.62, 0.72, 0.80, 0.88, 0.98], [10.27, 10.34, 10.27, 10.20, 10.27], color=BLUE_DARK, lw=1.8, zorder=4)

    ax.text(1.25, 10.44, "HYDROGRAPH", fontsize=16, fontweight="bold", color=BLUE_DARK, va="center", zorder=3)
    ax.text(1.25, 10.24, "Urban Flood Intelligence & Command Platform", fontsize=8.5, fontweight="bold", color=GREY_MID, va="center", zorder=3)

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

    # ─── 2. LEFT SIDEBAR: TECH-STACK (WITH REAL LOGO SYMBOLS) ───
    draw_card(ax, 0.4, 0.5, 3.2, 9.15, "#FFFFFF", BLUE_BORDER, lw=1.8, radius=0.12)
    
    # Title
    ax.text(0.6, 9.35, "TECH-STACK", fontsize=13.5, fontweight="bold", color=BLUE_MID, va="center", zorder=3)
    ax.plot([0.6, 3.4], [9.15, 9.15], color=BLUE_LIGHT, lw=2, zorder=3)

    # 2.1 FRONTEND LOGOS (Row 1: HTML, CSS, JS; Row 2: React, Tailwind, Leaflet)
    ax.text(0.6, 8.9, "FRONTEND", fontsize=9.5, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    
    fe_logos = [
        (icon_html, "HTML5", 0.95, 8.45),
        (icon_css, "CSS3", 1.85, 8.45),
        (icon_js, "JavaScript", 2.75, 8.45),
        (icon_react, "React 19", 0.95, 7.65),
        (icon_tailwind, "Tailwind", 1.85, 7.65),
        (icon_leaflet, "Leaflet GIS", 2.75, 7.65),
    ]
    for fn, label, lx, ly in fe_logos:
        fn(ax, lx, ly + 0.12)
        ax.text(lx, ly - 0.18, label, fontsize=8, fontweight="bold", color=GREY_DARK, ha="center", va="center", zorder=4)

    ax.plot([0.6, 3.4], [7.25, 7.25], color=GREY_BDR, lw=1, ls=":", zorder=3)

    # 2.2 BACKEND & DATABASE LOGOS
    ax.text(0.6, 7.0, "BACKEND & DATABASE", fontsize=9.5, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    be_logos = [
        (icon_fastapi, "FastAPI", 1.0, 6.5),
        (icon_python, "Python", 2.0, 6.5),
        (icon_sqlite, "SQLite", 2.9, 6.5),
        (icon_postgis, "PostGIS", 1.5, 5.7),
        (icon_docker, "Docker", 2.5, 5.7),
    ]
    for fn, label, lx, ly in be_logos:
        fn(ax, lx, ly + 0.12)
        ax.text(lx, ly - 0.18, label, fontsize=8, fontweight="bold", color=GREY_DARK, ha="center", va="center", zorder=4)

    ax.plot([0.6, 3.4], [5.3, 5.3], color=GREY_BDR, lw=1, ls=":", zorder=3)

    # 2.3 AI & SIMULATION LOGOS
    ax.text(0.6, 5.05, "AI & HYDRODYNAMIC", fontsize=9.5, fontweight="bold", color=GREY_MID, va="center", zorder=3)
    ai_logos = [
        (icon_radar, "PySTEPS", 1.0, 4.5),
        (icon_swmm_pipe, "SWMM", 2.0, 4.5),
        (icon_lisflood_surface, "LISFLOOD", 2.9, 4.5),
        (icon_osrm, "OSRM", 1.5, 3.7),
        (icon_recharts, "Analytics", 2.5, 3.7),
    ]
    for fn, label, lx, ly in ai_logos:
        fn(ax, lx, ly + 0.12, s=0.18)
        ax.text(lx, ly - 0.18, label, fontsize=8, fontweight="bold", color=GREY_DARK, ha="center", va="center", zorder=4)

    # GitHub link at bottom
    ax.plot([0.6, 3.4], [1.4, 1.4], color=GREY_BDR, lw=1, ls="--", zorder=3)
    ax.text(0.6, 1.15, "GitHub Repository:", fontsize=8.8, fontweight="bold", color=GREY_MID, zorder=3)
    ax.text(0.6, 0.85, "github.com/vinayvalurouthu/\nHYDROGRAPH-FLOOD-INTELLIGENCE", fontsize=7.2,
            fontweight="bold", color=BLUE_MID, zorder=3, family="monospace")

    # ─── 3. MAIN CANVAS ARCHITECTURE ───

    # ═════ LAYER 1: TOP ROW (USERS -> PLATFORM + AI LAYER) ═════
    # 1.1 USERS BOX (x=3.8, y=7.75, w=2.45, h=1.9)
    draw_card(ax, 3.8, 7.75, 2.45, 1.9, BLUE_MID, BLUE_DARK, lw=1.5, radius=0.1)
    ax.text(5.02, 9.38, "USERS", fontsize=11, fontweight="bold", color="white", ha="center", zorder=3)
    ax.plot([4.0, 6.05], [9.2, 9.2], color="white", lw=0.8, alpha=0.5, zorder=3)
    
    users = [
        (icon_sdma_gov, "Municipal SDMA", 8.8),
        (icon_responder_shield, "First Responders", 8.4),
        (icon_citizens_group, "Vulnerable Citizens", 8.0)
    ]
    for fn, u, uy in users:
        fn(ax, 4.25, uy)
        ax.text(4.65, uy, u, fontsize=9, fontweight="bold", color="white", va="center", zorder=4)

    # Arrow: Users -> Platform (Blue)
    draw_arrow(ax, 6.30, 8.7, 6.55, 8.7, BLUE_MID, lw=3)

    # 1.2 PLATFORM BOX (x=6.6, y=7.75, w=8.0, h=1.9)
    draw_card(ax, 6.6, 7.75, 8.0, 1.9, "#FFFFFF", BLUE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 6.75, 9.2, 7.7, 0.38, BLUE_MID, BLUE_MID, radius=0.06)
    ax.text(10.6, 9.39, "HYDROGRAPH COMMAND & DECISION PLATFORM", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    # 5 Action Capsules inside Platform (Icons + Names ONLY, no paragraphs)
    capsules = [
        (icon_map_layer, "Flood Map", 6.8),
        (icon_hotspot_pin, "Hotspots", 8.3),
        (icon_safe_route, "Safe Route", 9.8),
        (icon_shelter_building, "Smart Shelter", 11.3),
        (icon_sos_beacon, "Citizen SOS", 12.8),
    ]
    for fn, title, cap_x in capsules:
        draw_card(ax, cap_x, 7.95, 1.4, 1.1, BLUE_LIGHT, BLUE_BORDER, lw=1, radius=0.08)
        fn(ax, cap_x + 0.7, 8.65, s=0.22)
        ax.text(cap_x + 0.7, 8.18, title, fontsize=9.5, fontweight="bold", color=BLUE_DARK, ha="center", zorder=4)

    # 1.3 AI LAYER BOX (x=14.9, y=7.75, w=3.9, h=1.9)
    draw_card(ax, 14.9, 7.75, 3.9, 1.9, "#FFFFFF", GREEN_MID, lw=1.8, radius=0.1)
    draw_card(ax, 15.05, 9.2, 3.6, 0.38, GREEN_MID, GREEN_MID, radius=0.06)
    ax.text(16.85, 9.39, "AI & INTELLIGENCE LAYER", fontsize=11, fontweight="bold", color="white", ha="center", va="center", zorder=4)

    ai_items = [
        "PySTEPS Radar Nowcasting",
        "ST-GNN Inundation Surrogate",
        "Drainage Anomaly Residuals",
        "Multi-Sensor Confidence Score",
        "Real-Time Impact & Loss Calc"
    ]
    for i, item in enumerate(ai_items):
        py = 8.88 - i*0.25
        ax.add_patch(Circle((15.3, py), 0.05, facecolor=GREEN_MID, edgecolor="none", zorder=4))
        ax.text(15.55, py, item, fontsize=8.5, fontweight="bold", color=GREEN_DARK, va="center", zorder=4)

    # Arrow: Platform <-> AI (Green)
    draw_arrow(ax, 14.62, 8.7, 14.88, 8.7, GREEN_MID, lw=2.5)

    # ═════ LAYER 2: PHYSICS & HYDRODYNAMIC EXECUTION ENGINE (PURPLE) ═════
    # (x=3.8, y=5.45, w=15.0, h=1.95)
    draw_card(ax, 3.8, 5.45, 15.0, 1.95, "#FFFFFF", PURPLE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 3.95, 6.95, 14.7, 0.38, PURPLE_MID, PURPLE_MID, radius=0.06)
    ax.text(11.3, 7.14, "PHYSICS & HYDRODYNAMIC EXECUTION ENGINE", fontsize=11.5,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    # 5 Modules with REAL SYMBOLS + Single Clean Label (No paragraphs!)
    physics_mods = [
        (icon_radar, "PySTEPS", 4.05),
        (icon_swmm_pipe, "EPA SWMM", 7.05),
        (icon_lisflood_surface, "LISFLOOD-FP", 10.05),
        (icon_coupling_flux, "Coupled 1D/2D", 13.05),
        (icon_dam_boundary, "CWC Boundary", 16.05),
    ]
    for fn, title, px in physics_mods:
        draw_card(ax, px, 5.65, 2.7, 1.15, PURPLE_BG, PURPLE_BDR, lw=1, radius=0.08)
        fn(ax, px + 1.35, 6.42, s=0.28)
        ax.text(px + 1.35, 5.92, title, fontsize=11, fontweight="bold", color=PURPLE_DARK, ha="center", zorder=4)

    # Arrow: Platform -> Execution Engine (Purple)
    draw_arrow(ax, 10.6, 7.75, 10.6, 7.42, PURPLE_MID, lw=3)

    # ═════ LAYER 3: VISUALIZATION & RESULTS (ORANGE) + DATA MANAGEMENT (RED) ═════
    # 3.1 VISUALIZATION BOX (x=3.8, y=3.05, w=10.8, h=2.0)
    draw_card(ax, 3.8, 3.05, 10.8, 2.0, "#FFFFFF", ORANGE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 3.95, 4.6, 10.5, 0.38, ORANGE_MID, ORANGE_MID, radius=0.06)
    ax.text(9.2, 4.79, "VISUALIZATION & OPERATIONAL INTELLIGENCE", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    # 5 Visualization Cards with REAL SYMBOLS + Title
    viz_cards = [
        (icon_depth_contours, "Depth Contours", 4.0),
        (icon_hotspot_matrix, "Hotspot Matrix", 6.15),
        (icon_safe_evac, "Safe Evacuation", 8.3),
        (icon_drain_surcharge, "Drain Surcharge", 10.45),
        (icon_sandbox, "Scenario Sandbox", 12.6),
    ]
    for fn, title, vx in viz_cards:
        draw_card(ax, vx, 3.25, 1.95, 1.2, ORANGE_BG, ORANGE_BDR, lw=1, radius=0.08)
        fn(ax, vx + 0.97, 4.05, s=0.28)
        ax.text(vx + 0.97, 3.52, title, fontsize=10, fontweight="bold", color=ORANGE_DARK, ha="center", zorder=4)

    # Arrow: Execution Engine -> Visualization (Orange)
    draw_arrow(ax, 9.2, 5.45, 9.2, 5.08, ORANGE_MID, lw=3)

    # 3.2 DATA MANAGEMENT BOX (x=14.9, y=3.05, w=3.9, h=2.0)
    draw_card(ax, 14.9, 3.05, 3.9, 2.0, "#FFFFFF", RED_MID, lw=1.8, radius=0.1)
    draw_card(ax, 15.05, 4.6, 3.6, 0.38, RED_MID, RED_MID, radius=0.06)
    ax.text(16.85, 4.79, "OPERATIONAL DATA MANAGEMENT", fontsize=10.5,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    data_items = [
        "IMD Doppler Radar (DWR)",
        "CWC River & Dam Gauges",
        "OpenStreetMap & DEM Topology",
        "Citizen SOS Offline Queue",
        "Historical Flood Replay DB"
    ]
    for i, item in enumerate(data_items):
        py = 4.28 - i*0.27
        ax.add_patch(Circle((15.3, py), 0.05, facecolor=RED_MID, edgecolor="none", zorder=4))
        ax.text(15.55, py, item, fontsize=8.5, fontweight="bold", color=RED_DARK, va="center", zorder=4)

    # Arrow: Data Management -> Execution Engine (Red)
    draw_arrow(ax, 14.88, 4.15, 14.65, 4.15, RED_MID, lw=2.5)

    # ═════ LAYER 4: INFRASTRUCTURE (NAVY) + LEGEND ═════
    # 4.1 INFRASTRUCTURE (x=3.8, y=0.65, w=10.8, h=2.0)
    draw_card(ax, 3.8, 0.65, 10.8, 2.0, "#FFFFFF", BLUE_MID, lw=1.8, radius=0.1)
    draw_card(ax, 3.95, 2.2, 10.5, 0.38, BLUE_MID, BLUE_MID, radius=0.06)
    ax.text(9.2, 2.39, "INFRASTRUCTURE & SCALABLE ARCHITECTURE", fontsize=11,
            fontweight="bold", color="white", ha="center", va="center", zorder=4)

    infra_cards = [
        (icon_react, "React 19", 4.0),
        (icon_fastapi, "FastAPI", 6.15),
        (icon_sqlite, "SQLite / PostGIS", 8.3),
        (icon_osrm, "OSRM Engine", 10.45),
        (icon_docker, "Deployment", 12.6),
    ]
    for fn, title, ix in infra_cards:
        draw_card(ax, ix, 0.85, 1.95, 1.2, GREY_LIGHT, BLUE_BORDER, lw=1, radius=0.08)
        fn(ax, ix + 0.97, 1.62, s=0.26)
        ax.text(ix + 0.97, 1.15, title, fontsize=10.5, fontweight="bold", color=GREY_DARK, ha="center", zorder=4)

    # Arrow: Visualization -> Infrastructure
    draw_arrow(ax, 9.2, 3.05, 9.2, 2.68, BLUE_MID, lw=3)

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

    # Save output
    out_docs = os.path.join(os.path.dirname(__file__), "technical_approach_slide.png")
    plt.savefig(out_docs, dpi=160, bbox_inches="tight", facecolor="#F8FAFC")
    plt.close()
    print("Saved clean symbols slide PNG to:", out_docs)

    artifact_dir = r"C:\Users\vinay\.gemini\antigravity-ide\brain\0e167209-4c18-48f9-9d9f-4de3317d4b0d"
    if os.path.exists(artifact_dir):
        import shutil
        dest = os.path.join(artifact_dir, "technical_approach_slide.png")
        shutil.copy2(out_docs, dest)
        print("Copied PNG to artifacts:", dest)

if __name__ == "__main__":
    generate_slide()
