# 👻 Ghost Guard – Demolition Edition
### *A 2D Stealth-Action & Tactical Raycasting Demolition Game*
**Computer Graphics (CG) Lab Project**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Canvas API](https://img.shields.io/badge/Canvas_2D_API-000000?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript ES6+](https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-4A154B?style=for-the-badge&logo=audio&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge)

---

## 📖 Overview

**Ghost Guard: Demolition Edition** is a top-down 2D stealth and tactical puzzle game built natively for the web. Players take on the role of an ethereal operative infiltrating 8 high-security, labyrinthine facilities. 

To succeed, you must evade vigilant sentinels equipped with **dynamic raycasted field-of-view (FOV) vision cones**, sneak through shadowy sectors, deploy **tactical demolition charges (BOOM bombs)** to demolish cracked walls, retrieve sealed diamonds, lure guards with acoustic noise, and safely reach the extraction portal.

Built entirely with **vanilla web technologies** (HTML5 Canvas, pure JavaScript ES6+, CSS3, and the Web Audio API) with **zero external libraries or engines**.

---

## 🎮 Game Instructions & Mechanics

### 🎯 Primary Objectives
1. **Retrieve All Diamonds (💎):** Locate and collect every diamond hidden across each security sector. Certain diamonds are locked behind reinforced cracked walls!
2. **Infiltrate & Escape (🚪):** Once all diamonds in the sector are gathered, the exit hatch unlocks. Reach the exit to clear the mission.
3. **Preserve Your Lives (❤️):** You possess **3 lives** to conquer all 8 sectors. Getting caught by a guard or caught inside your own demolition blast consumes a life.

---

### 🕹️ Controls & Keybindings

| Key / Input | Action | Tactical Usage |
| :--- | :--- | :--- |
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or <kbd>↑</kbd> <kbd>←</kbd> <kbd>↓</kbd> <kbd>→</kbd> | **Movement** | Move the ghost smoothly through corridors. |
| <kbd>SHIFT</kbd> *(Hold)* | **Sneak Mode** | Halves movement speed, silences footsteps, and slashes guard detection build-up rate by **45%**. |
| <kbd>SPACE</kbd> or <kbd>B</kbd> | **Plant BOOM Bomb** | Deploys a demolition charge on your current tile (1.8-second fuse). |
| **💣 BOOM HUD Button** | **Click to Bomb** | On-screen button alternative to plant charges. |
| <kbd>ESC</kbd> | **Pause / Resume** | Pauses gameplay and opens the tactical overlay. |
| **Mouse Click** | **UI Navigation** | Select levels, adjust settings, and navigate menu buttons. |

---

### 💥 Tactical Demolition & Explosions
- **Cracked Walls (🧱):** These breakable masonry barriers block your path and hide confidential diamonds. Plant a bomb adjacent to them to blast them into rubble.
- **Acoustic Noise & Guard Luring:** Explosions generate a loud acoustic blast (16-tile radius). Nearby guards hear the detonation and abandon their patrol route to investigate the epicenter. Use this strategically to draw sentinels away from guarded objectives!
- **Concussive Stun:** Guards caught directly in the explosion epicenter are knocked dizzy (**😵**) for **4.5 seconds**, temporarily collapsing their vision cones.
- **Self-Damage / Friendly Fire:** Take cover! Standing inside your own blast radius will damage you and deduct a life.
- **Ammo Pickups (🧨):** Collect ammo crates scattered across maps to gain **+2 additional bombs**.
- **Failsafe Auto-Recharge:** If your bomb supply reaches zero while diamonds remain sealed behind walls, an 8-second emergency cooldown grants a replacement bomb to prevent softlocks.

---

### 👁️ Guard AI & Detection System
Guards navigate pre-calculated patrol waypoints and continuously evaluate their surroundings via real-time line-of-sight raycasting.

| Sentinel State | Indicator | Behavior & Vision Cone |
| :--- | :---: | :--- |
| **Patrol** | 🟡 Yellow Cone / 😐 | Follows standard patrol loops at normal pace. |
| **Suspicious** | 🟠 Orange Cone / 🤔 / ❓ | Hesitates and sweeps gaze back and forth when detecting fleeting movement. |
| **Alert** | 🔴 Pulsing Red Cone / 😡 / ❗ | Player visually confirmed or explosion heard! Sentinel sprints towards the target at 160% speed. |
| **Searching** | 🟠 Orange Cone / 🔍 | Arrives at last known position and sweeps the area before returning to patrol. |
| **Stunned** | ⭐ Rotating Stars / 😵 | Guard is knocked out by a nearby bomb blast for 4.5s; vision cone is completely disabled. |

#### 🌑 Shadow Tiles (D):
Certain sectors feature darkened floor tiles. Stepping into these shadow areas cloaks the operative, cutting guard visual perception range down to **40%**.

---

### 🗺️ Sector Progression (8 Challenging Levels)
1. **Level 1 – The Lobby:** Introduction to sneaking and blasting cracked walls.
2. **Level 2 – The Gallery:** Narrow corridors, multiple sentinels, and locked chambers.
3. **Level 3 – The Archive:** Dense library shelves, acoustic guard luring challenges.
4. **Level 4 – The Server Room:** High-speed patrol sweeps requiring precision timing.
5. **Level 5 – The Vault:** Reinforced bunker with tight reaction windows.
6. **Level 6 – The Quarantine (Hard):** Hazardous containment sector featuring 3 sealed blast cells.
7. **Level 7 – The Citadel (Very Hard):** 7 elite sentinels guarding multiple fortified sectors.
8. **Level 8 – Obsidian Core (Master Level):** The ultimate high-security subterranean stronghold with 8 lethal guards.

*Note: Level progress is automatically saved in your browser via `localStorage`.*

---

## 🛠️ Technologies Used

| Technology | Purpose & Implementation Details |
| :--- | :--- |
| **HTML5 Canvas 2D API** | Renders all graphics at 60 FPS: tiles, character sprites, vision cones, radial gradient lighting, particle simulations, shockwaves, scorch marks, and HUD warnings. |
| **Vanilla JavaScript (ES6+)** | Zero dependencies or third-party engines. Core logic includes the game loop (`requestAnimationFrame`), custom 2D raycasting math, particle physics, circular & AABB collision detection, and Finite State Machine (FSM) guard AI. |
| **Web Audio API** | 100% procedural sound synthesis. Generates all SFX dynamically in real time (sine wave gem chimes, sawtooth warning sirens, square-wave alerts, and realistic white-noise/low-pass filtered explosive detonations). No external audio files required! |
| **CSS3 & Flexbox / Grid** | Glassmorphism UI styling, responsive viewport scaling, pulsing neon accents, custom `@keyframes` animations, and reactive screen-shake effects during explosions. |
| **HTML5 Web Storage (`localStorage`)** | Seamless persistent storage for unlocked levels, completed missions, and gameplay statistics without requiring a backend server. |

---

## 📐 Computer Graphics & Algorithmic Concepts

This project demonstrates foundational concepts from **Computer Graphics** and **Game Engine Architecture**:

### 1. 2D Raycasting (Line-of-Sight & Vision Cones)
- Each guard casts **72 discrete rays** distributed across their visual field of view ($\text{FOV} \approx 90^\circ - 120^\circ$).
- Rays step through 2D space along the directional vector:
  $$\Delta x = \cos(\theta) \cdot \text{step}, \quad \Delta y = \sin(\theta) \cdot \text{step}$$
- Rays test against the discrete spatial grid. When a ray collides with solid geometry (unbreakable walls or cracked destructible walls), ray propagation stops and returns the hit coordinate.
- The resulting boundary points form a **polygon mesh** filled using `CanvasRenderingContext2D.createRadialGradient` with a soft light falloff.

### 2. Trigonometric Angular Smoothing (Lerp)
- Guards rotate smoothly toward new headings rather than snapping instantly. Shortest-arc angular interpolation is computed using:
  $$\Delta \theta = ((\theta_{\text{target}} - \theta_{\text{current}} + \pi) \pmod{2\pi}) - \pi$$
  $$\theta_{\text{next}} = \theta_{\text{current}} + \Delta \theta \cdot \min(1, \Delta t \cdot \text{rate})$$

### 3. Particle Simulation & Emitters
- An integrated particle system manages hundreds of simultaneous dynamic particles for:
  - **Bomb Detonations:** High-velocity incandescent fireballs (`#ff5500`, `#ffcc00`) and slow-rising smoke clouds.
  - **Wall Demolitions:** Fragmented brick rubble particles with gravity vectors ($\vec{g} = [0, 0.08]$).
  - **Diamond Pickups & Fuses:** Luminous sparkles and fuse ember sparks.
  - **Concussion FX:** Revolving orbital stars rendered around stunned guards.

### 4. Collision Detection & Spatial Partitioning
- **Circle-to-AABB (Axis-Aligned Bounding Box):** Calculates smooth sliding collision responses for the player and guards against rectangular wall boundaries.
- **Euclidean Radius Checks:** Determines explosion shockwave coverage, diamond collection triggers, and acoustic hearing radiuses using `Math.hypot(dx, dy)`.

### 5. Camera & Screen FX
- **Procedural Screen Shake:** Explosions dynamically inject high-frequency CSS translation perturbations (`transform: translate3d(...)`) to convey impact weight and shockwave force.
- **Persistent Scorch Decals:** Detonation epicenters leave radial carbon scorch marks on the floor tiles.

---

## 📂 Project Directory Structure

```text
CG-game-2D/
├── README.md                  # Comprehensive project documentation
└── ghost-guard/
    ├── index.html             # Main game entry point & UI overlay templates
    ├── engine.js              # Complete 2D game engine, Raycasting, AI & Audio
    └── style.css              # Dark stealth theme, HUD layout & animations
```

---

## 🚀 How to Run the Game

No installations, build steps, package managers, or server runtimes are needed!

### Method 1: Direct Browser Launch (Easiest)
1. Navigate to the `ghost-guard` folder.
2. Double-click **`index.html`** or right-click $\rightarrow$ **Open With** $\rightarrow$ any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave, etc.).

### Method 2: Local HTTP Server (VS Code / Python)
If you prefer running through a local development server:
```bash
# Using Python 3
cd ghost-guard
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 🏆 Summary of Features
- ✅ **8 Handcrafted Levels** with progressive difficulty curves.
- ✅ **Dynamic 2D Raycasted Vision Cones** with realistic line-of-sight occlusion.
- ✅ **Tactical Demolition Mechanics** to demolish walls and stun enemies.
- ✅ **Multi-State Sentinel AI** (Patrol, Suspicious, Alert, Searching, Stunned).
- ✅ **Acoustic Hearing System** allowing sentinels to investigate detonations.
- ✅ **Procedural Web Audio Engine** generating 100% of sound effects synthesized on the fly.
- ✅ **Smooth Particle Engine** for explosions, smoke, rubble, sparks, and stars.
- ✅ **Local Storage Persistence** saving level unlock progress and statistics.

---

*Developed for the Computer Graphics (CG) Lab coursework.*

