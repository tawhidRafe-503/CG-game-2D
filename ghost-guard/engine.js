/* ═══════════════════════════════════════════════════════════════════════
   GHOST GUARD  –  engine.js (Demolition Edition)
   Stealth game with vision cone raycasting, AI state machine,
   tactical BOOM bombs to blast walls & reach sealed diamonds,
   guard stun & sound investigation mechanics, and 8 challenging levels!
═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const COLS = 22, ROWS = 16;
let CELL = 42;

const TILE = Object.freeze({
  FLOOR:     0,
  WALL:      1,
  START:     2,
  EXIT:      3,
  GEM:       4,
  SHADOW:    5,
  BREAKABLE: 6, // Cracked / Destructible wall (breakable with BOOM)
});

const GS = Object.freeze({
  PATROL:    'patrol',
  SUSPICIOUS:'suspicious',
  ALERT:     'alert',
  SEARCHING: 'searching',
});

const PLAYER_SPEED_NORMAL = 2.6;  // px/frame at 60fps
const PLAYER_SPEED_SNEAK  = 1.3;
const PLAYER_RADIUS       = 0.3;  // fraction of CELL
const DETECTION_HOLD      = 0.35; // seconds in cone before ALERT
const MAX_LIVES           = 3;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  8 HANDCRAFTED LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Map chars:
// # = Unbreakable Wall      . = Floor       S = Start       E = Exit
// G = Diamond (Gem)         B = Breakable (Cracked) Wall    P = Bomb Ammo Pickup
// D = Shadow Floor (Hard to spot player)
// Each row MUST be exactly COLS (22) characters, 16 rows total.

const LEVELS = [

  /* ── Level 1 · The Lobby ─────────────────────────────────────────── */
  {
    name:     'Level 1 – The Lobby',
    subtitle: 'Learn the basics. Plant a BOOM to smash cracked walls!',
    bombs:    3,
    map: [
      '######################',
      '#S.........#.........#',
      '#..........#.........#',
      '#..........#...G.....#',
      '#..........#.........#',
      '#..........#...BBB...#',
      '#.....##...#...BGB...#',
      '#.....#....#...BBB...#',
      '#.....#..............#',
      '#.....##...G.........#',
      '#....................#',
      '#....................#',
      '#......G.......P.....#',
      '#....................#',
      '#..................E.#',
      '######################',
    ],
    guards: [
      { col:16, row:2,  angle:Math.PI/2, fov:Math.PI*0.55, range:6.5, speed:1.2,
        patrol:[{c:16,r:2},{c:16,r:13},{c:19,r:13},{c:19,r:2}] },
      { col:3,  row:2,  angle:0,         fov:Math.PI*0.52, range:5.5, speed:1.0,
        patrol:[{c:2,r:2},{c:9,r:2},{c:9,r:13},{c:2,r:13}] },
    ],
  },

  /* ── Level 2 · The Gallery ───────────────────────────────────────── */
  {
    name:     'Level 2 – The Gallery',
    subtitle: 'Narrow corridors. Demolish walls to reach locked gems.',
    bombs:    3,
    map: [
      '######################',
      '#S...................#',
      '#..######............#',
      '#..#....#............#',
      '#..#..G.#............#',
      '#..###B##....#########',
      '#.................#..#',
      '#.................#..#',
      '#####...BBBB......#..#',
      '#...#...B..B..G...#..#',
      '#...#...BGBB......#..#',
      '#...#########.....#..#',
      '#............#....#..#',
      '#............#....G..#',
      '#..P.........#......E#',
      '######################',
    ],
    guards: [
      { col:15, row:2,  angle:Math.PI,     fov:Math.PI*0.58, range:6, speed:1.2,
        patrol:[{c:19,r:2},{c:13,r:2},{c:13,r:7},{c:19,r:7}] },
      { col:2,  row:10, angle:Math.PI/2,   fov:Math.PI*0.55, range:6, speed:1.1,
        patrol:[{c:2,r:7},{c:2,r:13},{c:6,r:13},{c:6,r:7}] },
      { col:15, row:11, angle:-Math.PI/2,  fov:Math.PI*0.52, range:5.5, speed:1.3,
        patrol:[{c:14,r:11},{c:19,r:11},{c:19,r:14},{c:14,r:14}] },
    ],
  },

  /* ── Level 3 · The Archive ───────────────────────────────────────── */
  {
    name:     'Level 3 – The Archive',
    subtitle: 'Dense shelves. Shatter secret vaults; guards investigate noises.',
    bombs:    3,
    map: [
      '######################',
      '#S...................#',
      '#.######......######.#',
      '#.#....#......#....#.#',
      '#.#..G.#......#....#.#',
      '#.#....#......#..G.#.#',
      '#.##B###......#....#.#',
      '#.............###B##.#',
      '#.######...BB........#',
      '#.#....#...BG........#',
      '#.#....#..GBB........#',
      '#.#..G.#.............#',
      '#.#....#####....P....#',
      '#.#..........######..#',
      '#.#..........#....E..#',
      '######################',
    ],
    guards: [
      { col:10, row:2,  angle:Math.PI/2,   fov:Math.PI*0.60, range:6,   speed:1.1,
        patrol:[{c:10,r:2},{c:10,r:6},{c:10,r:2}] },
      { col:16, row:4,  angle:Math.PI/2,   fov:Math.PI*0.58, range:6,   speed:1.2,
        patrol:[{c:16,r:2},{c:16,r:12},{c:19,r:12},{c:19,r:2}] },
      { col:3,  row:10, angle:-Math.PI/2,  fov:Math.PI*0.55, range:5.5, speed:1.0,
        patrol:[{c:3,r:9},{c:3,r:14},{c:7,r:14},{c:7,r:9}] },
      { col:13, row:10, angle:0,           fov:Math.PI*0.55, range:6,   speed:1.3,
        patrol:[{c:11,r:10},{c:19,r:10},{c:19,r:13},{c:11,r:13}] },
    ],
  },

  /* ── Level 4 · The Server Room ───────────────────────────────────── */
  {
    name:     'Level 4 – The Server Room',
    subtitle: 'High speed sweeps. Crack open server vaults for gems.',
    bombs:    4,
    map: [
      '######################',
      '#S..................E#',
      '####.##.##.##.##.#####',
      '#...........BGB......#',
      '#.##.##.##.##BB.##.##.',
      '#....................#',
      '#.##.##.##.##.##.##.##',
      '#....BGB..........P..#',
      '#.##.##B.##.##.##.##.#',
      '#....................#',
      '#.##.##.##.##.##.##.##',
      '#...........BGB......#',
      '#.##.##.##.##BB.##.##.',
      '#....................#',
      '####.##.##.##.##.#####',
      '######################',
    ],
    guards: [
      { col:5,  row:3,  angle:0,           fov:Math.PI*0.62, range:7, speed:1.4,
        patrol:[{c:1,r:3},{c:20,r:3},{c:20,r:5},{c:1,r:5}] },
      { col:15, row:5,  angle:Math.PI,     fov:Math.PI*0.62, range:7, speed:1.4,
        patrol:[{c:20,r:5},{c:1,r:5},{c:1,r:7},{c:20,r:7}] },
      { col:5,  row:7,  angle:0,           fov:Math.PI*0.62, range:7, speed:1.5,
        patrol:[{c:1,r:7},{c:20,r:7},{c:20,r:9},{c:1,r:9}] },
      { col:15, row:9,  angle:Math.PI,     fov:Math.PI*0.60, range:7, speed:1.4,
        patrol:[{c:20,r:9},{c:1,r:9},{c:1,r:11},{c:20,r:11}] },
      { col:5,  row:11, angle:0,           fov:Math.PI*0.62, range:7, speed:1.5,
        patrol:[{c:1,r:11},{c:20,r:11},{c:20,r:13},{c:1,r:13}] },
    ],
  },

  /* ── Level 5 · The Vault ─────────────────────────────────────────── */
  {
    name:     'Level 5 – The Vault',
    subtitle: 'Reinforced bunker. Guard response is instant.',
    bombs:    4,
    map: [
      '######################',
      '#S#.......#.......#.E#',
      '#.#.#####.#.#####.#..#',
      '#...#.....#.....#....#',
      '#.###.###.#.###.###..#',
      '#.#...#...#...#...#..#',
      '#.#.###.#####.###.#..#',
      '#...#.G..BBB..G.#....#',
      '#.#.#.###BGB###.#.#..#',
      '#.#...#..BBB..#...#..#',
      '#.###.#.#####.#.###..#',
      '#.....#...G...#......#',
      '#.#####.#...#.#####..#',
      '#.G.....#...#.....G..#',
      '#.#######.P.#######..#',
      '######################',
    ],
    guards: [
      { col:5,  row:3,  angle:0,          fov:Math.PI*0.65, range:6,   speed:1.3,
        patrol:[{c:1,r:3},{c:9,r:3},{c:9,r:6},{c:1,r:6}] },
      { col:16, row:3,  angle:Math.PI,    fov:Math.PI*0.65, range:6,   speed:1.3,
        patrol:[{c:20,r:3},{c:12,r:3},{c:12,r:6},{c:20,r:6}] },
      { col:10, row:7,  angle:Math.PI/2,  fov:Math.PI*0.70, range:6.5, speed:1.2,
        patrol:[{c:10,r:5},{c:10,r:13}] },
      { col:3,  row:10, angle:-Math.PI/2, fov:Math.PI*0.65, range:6,   speed:1.4,
        patrol:[{c:1,r:8},{c:9,r:8},{c:9,r:13},{c:1,r:13}] },
      { col:18, row:10, angle:-Math.PI/2, fov:Math.PI*0.65, range:6,   speed:1.4,
        patrol:[{c:20,r:8},{c:12,r:8},{c:12,r:13},{c:20,r:13}] },
      { col:10, row:12, angle:Math.PI/2,  fov:Math.PI*0.68, range:5.5, speed:1.5,
        patrol:[{c:10,r:11},{c:10,r:14}] },
    ],
  },

  /* ── Level 6 · The Quarantine Sector (HARD) ──────────────────────── */
  {
    name:     'Level 6 – The Quarantine',
    subtitle: 'Hazardous containment. 3 sealed cells require strategic booms.',
    bombs:    5,
    map: [
      '######################',
      '#S.....#..B...#.....E#',
      '#.DDDD.#.BBBB.#.DDDD.#',
      '#.D..D.#.BG.B.#.D..D.#',
      '#.D..D.#.BBBB.#.D..D.#',
      '#......#......#......#',
      '####.#####B####.######',
      '#....................#',
      '#.##.BBBB.##.BBBB.##.#',
      '#....BG.B....BG.B....#',
      '#.##.BBBB.##.BBBB.##.#',
      '#....................#',
      '####.##########.######',
      '#.DD....DD....DD...P.#',
      '#....................#',
      '######################',
    ],
    guards: [
      { col:4,  row:5,  angle:0,         fov:Math.PI*0.65, range:6.5, speed:1.4,
        patrol:[{c:1,r:5},{c:9,r:5},{c:9,r:1},{c:1,r:1}] },
      { col:17, row:5,  angle:Math.PI,   fov:Math.PI*0.65, range:6.5, speed:1.4,
        patrol:[{c:20,r:5},{c:12,r:5},{c:12,r:1},{c:20,r:1}] },
      { col:5,  row:7,  angle:0,         fov:Math.PI*0.60, range:7,   speed:1.5,
        patrol:[{c:1,r:7},{c:20,r:7},{c:20,r:11},{c:1,r:11}] },
      { col:10, row:11, angle:Math.PI,   fov:Math.PI*0.60, range:7,   speed:1.5,
        patrol:[{c:20,r:11},{c:1,r:11},{c:1,r:7},{c:20,r:7}] },
      { col:3,  row:14, angle:0,         fov:Math.PI*0.65, range:6.5, speed:1.3,
        patrol:[{c:1,r:14},{c:20,r:14}] },
    ],
  },

  /* ── Level 7 · The Shadow Citadel (VERY HARD) ────────────────────── */
  {
    name:     'Level 7 – The Citadel',
    subtitle: '7 elite sentinels. Demolish walls to create escape routes.',
    bombs:    5,
    map: [
      '######################',
      '#S.......#......#....#',
      '#..#####.#.####.#.##.#',
      '#..#...#.#.#..#.#.##.#',
      '#..#.G.#.B.#..#.B..E.#',
      '#..##B##.#.####.######',
      '#........#...........#',
      '#.######.BBBBBB.####.#',
      '#.#....#.B.G..B.#..#.#',
      '#.#.##.#.BBBBBB.#..#.#',
      '#.#..#.#........#..#.#',
      '#.##.#.##########..#.#',
      '#....#..D....D..#....#',
      '#.####..D.G..D..####.#',
      '#P..................P#',
      '######################',
    ],
    guards: [
      { col:3,  row:1,  angle:0,         fov:Math.PI*0.65, range:6.5, speed:1.4,
        patrol:[{c:1,r:1},{c:8,r:1},{c:8,r:6},{c:1,r:6}] },
      { col:14, row:1,  angle:0,         fov:Math.PI*0.65, range:6.5, speed:1.4,
        patrol:[{c:10,r:1},{c:19,r:1},{c:19,r:6},{c:10,r:6}] },
      { col:2,  row:8,  angle:Math.PI/2, fov:Math.PI*0.65, range:6,   speed:1.3,
        patrol:[{c:2,r:6},{c:2,r:12}] },
      { col:18, row:8,  angle:Math.PI/2, fov:Math.PI*0.65, range:6,   speed:1.4,
        patrol:[{c:18,r:6},{c:18,r:12}] },
      { col:5,  row:14, angle:0,         fov:Math.PI*0.65, range:6.5, speed:1.5,
        patrol:[{c:1,r:14},{c:10,r:14}] },
      { col:15, row:14, angle:Math.PI,   fov:Math.PI*0.65, range:6.5, speed:1.5,
        patrol:[{c:20,r:14},{c:11,r:14}] },
      { col:10, row:10, angle:Math.PI/2, fov:Math.PI*0.70, range:6,   speed:1.3,
        patrol:[{c:9,r:10},{c:12,r:10}] },
    ],
  },

  /* ── Level 8 · The Obsidian Core (ULTIMATE MASTER LEVEL) ─────────── */
  {
    name:     'Level 8 – Obsidian Core',
    subtitle: 'The ultimate vault. 8 lethal guards. Master your booms.',
    bombs:    6,
    map: [
      '######################',
      '#S.......#......#...E#',
      '#.######.#.####.#.####',
      '#.#....#.#.#..#.#....#',
      '#.#.##.#.B.#..#.####.#',
      '#...##.#.#.####......#',
      '####.#.#.#....######.#',
      '#G...#.B.BBBB.B.#...G#',
      '####.#.#.BGBB.#.#.####',
      '#....#.#.BBBB.#.#....#',
      '#.####.#......#.#.##.#',
      '#.#....########.#.##.#',
      '#.#.##.....B....#....#',
      '#.#..#.###BGB###.###.#',
      '#P..................P#',
      '######################',
    ],
    guards: [
      { col:4,  row:1,  angle:0,         fov:Math.PI*0.68, range:6.5, speed:1.6,
        patrol:[{c:1,r:1},{c:8,r:1},{c:8,r:5},{c:1,r:5}] },
      { col:15, row:1,  angle:Math.PI,   fov:Math.PI*0.68, range:6.5, speed:1.6,
        patrol:[{c:19,r:1},{c:10,r:1},{c:10,r:5},{c:19,r:5}] },
      { col:2,  row:7,  angle:Math.PI/2, fov:Math.PI*0.70, range:6,   speed:1.5,
        patrol:[{c:2,r:7},{c:2,r:11}] },
      { col:18, row:7,  angle:Math.PI/2, fov:Math.PI*0.70, range:6,   speed:1.5,
        patrol:[{c:18,r:7},{c:18,r:11}] },
      { col:5,  row:14, angle:0,         fov:Math.PI*0.68, range:6.5, speed:1.6,
        patrol:[{c:1,r:14},{c:10,r:14}] },
      { col:15, row:14, angle:Math.PI,   fov:Math.PI*0.68, range:6.5, speed:1.6,
        patrol:[{c:20,r:14},{c:11,r:14}] },
      { col:10, row:9,  angle:Math.PI/2, fov:Math.PI*0.70, range:6,   speed:1.5,
        patrol:[{c:8,r:9},{c:13,r:9}] },
      { col:10, row:12, angle:-Math.PI/2,fov:Math.PI*0.70, range:6,   speed:1.5,
        patrol:[{c:8,r:12},{c:13,r:12}] },
    ],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GAME STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let canvas, ctx;
let levelIndex = 0;
let lives = MAX_LIVES;
let globalGems = 0;

let tiles       = [];      // 2D grid
let gemList     = [];      // {c,r,collected,anim}
let bombPickups = [];      // {c,r,collected}
let exitCell    = {c:0, r:0};
let startCell   = {c:0, r:0};

let player      = {};
let guards      = [];
let particles   = [];
let bombs       = [];      // Active placed bombs
let explosions  = [];      // Expanding shockwave FX
let scorchMarks = [];      // Ground marks after detonation

let bombCount   = 3;
let bombRechargeTimer = 0; // Backup recharge so player never softlocks

let keys        = {};
let gamePhase   = 'menu';  // menu | playing | caught | levelcomplete | gameover | victory
let catchCooldown = 0;
let detectionBar  = 0;

let animId   = null;
let lastTime = 0;

let sessionStats = { time:0, catches:0, gemsTotal:0, wallsBlown:0 };
let levelStartTime = 0;

let unlockedLevels  = [0];
let completedLevels = [];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AUDIO (Web Audio API – Procedural SFX)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type, dur, vol=0.3, delay=0) {
  try {
    const ac  = getAudio();
    const osc = ac.createOscillator();
    const gain= ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gain.gain.setValueAtTime(vol, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + dur + 0.05);
  } catch(e) {}
}

function sfxGem()    { playTone(880,'sine',.08,.25); playTone(1100,'sine',.12,.2,.08); }
function sfxCaught() { playTone(200,'sawtooth',.4,.3); playTone(100,'square',.5,.3,.1); }
function sfxAlert()  { playTone(440,'square',.1,.35); playTone(660,'square',.15,.3,.12); }
function sfxExit()   {
  [523,659,784,1047].forEach((f,i)=>playTone(f,'sine',.18,.25,i*.09));
}
function sfxStep()   { playTone(120,'sine',.04,.04); }
function sfxFuse()   { playTone(950,'square',.04,.15); }
function sfxPickup() { playTone(540,'triangle',.09,.25); playTone(780,'sine',.14,.25,.08); }

// Punchy synthesized BOOM explosion (Rumble + Noise burst)
function sfxBoom() {
  try {
    const ac = getAudio();
    // Low rumble
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, ac.currentTime + 0.45);
    gain.gain.setValueAtTime(0.55, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + 0.5);

    // Noise burst
    const bufferSize = ac.sampleRate * 0.4;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, ac.currentTime);
    filter.frequency.linearRampToValueAtTime(180, ac.currentTime + 0.35);
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.65, ac.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.42);
    noise.connect(filter); filter.connect(nGain); nGain.connect(ac.destination);
    noise.start(); noise.stop(ac.currentTime + 0.42);
  } catch(e) {}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CANVAS SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function resizeCanvas() {
  const wrap  = document.getElementById('canvas-wrap');
  const maxW  = wrap.clientWidth  - 4;
  const maxH  = wrap.clientHeight - 4;
  CELL = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
  canvas.width  = CELL * COLS;
  canvas.height = CELL * ROWS;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAP PARSING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function parseMap(lvl) {
  tiles       = [];
  gemList     = [];
  bombPickups = [];

  lvl.map.forEach((row, r) => {
    const tileRow = [];
    for (let c = 0; c < COLS; c++) {
      const ch = row[c] || '.';
      switch (ch) {
        case '#': tileRow.push(TILE.WALL);      break;
        case 'B': tileRow.push(TILE.BREAKABLE); break; // Cracked wall
        case 'S': tileRow.push(TILE.START);     startCell = {c, r}; break;
        case 'E': tileRow.push(TILE.EXIT);      exitCell  = {c, r}; break;
        case 'G': tileRow.push(TILE.FLOOR);
                  gemList.push({c, r, collected:false, anim:0, sparkle:0}); break;
        case 'P': tileRow.push(TILE.FLOOR);
                  bombPickups.push({c, r, collected:false}); break;
        case 'D': tileRow.push(TILE.SHADOW);    break;
        default:  tileRow.push(TILE.FLOOR);     break;
      }
    }
    tiles.push(tileRow);
  });
}

function isWall(c, r) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return true;
  return tiles[r][c] === TILE.WALL || tiles[r][c] === TILE.BREAKABLE;
}

function isShadow(c, r) {
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
  return tiles[r][c] === TILE.SHADOW;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RAYCASTING VISION CONE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const RAY_STEP = 0.18;  // fraction of CELL per step
const NUM_RAYS = 72;

function castRay(ox, oy, angle, maxDist) {
  const step = CELL * RAY_STEP;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let x = ox, y = oy, dist = 0;

  while (dist < maxDist) {
    x += dx; y += dy; dist += step;
    const col = Math.floor(x / CELL);
    const row = Math.floor(y / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return {x, y};
    // Ray blocks on unbreakable wall OR cracked breakable wall!
    if (tiles[row][col] === TILE.WALL || tiles[row][col] === TILE.BREAKABLE) {
      return {x: x - dx*0.5, y: y - dy*0.5};
    }
  }
  return {x, y};
}

function buildConePolygon(guard) {
  // If stunned, vision cone is collapsed
  if (guard.stunTimer > 0) return [];

  const ox = guard.x, oy = guard.y;
  const halfFov = guard.fov / 2;
  const range   = guard.range * CELL;
  const pts = [];

  for (let i = 0; i <= NUM_RAYS; i++) {
    const angle = guard.lookAngle - halfFov + (guard.fov * i / NUM_RAYS);
    const hit   = castRay(ox, oy, angle, range);
    pts.push(hit);
  }
  return pts;
}

// Geometric detection
function guardCanSeePlayer(guard) {
  if (guard.stunTimer > 0) return 0; // Stunned guards cannot see

  const dx   = player.x - guard.x;
  const dy   = player.y - guard.y;
  const dist = Math.hypot(dx, dy);

  const effectiveRange = guard.range * CELL *
    (guard.state === GS.ALERT ? 1.3 : guard.state === GS.SUSPICIOUS ? 1.1 : 1.0);
  if (dist > effectiveRange) return 0;

  const angleToPlayer = Math.atan2(dy, dx);
  let diff = angleToPlayer - guard.lookAngle;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  const effectiveFov = guard.fov *
    (guard.state === GS.ALERT ? 1.35 : guard.state === GS.SUSPICIOUS ? 1.15 : 1.0);
  const halfFov = effectiveFov / 2;
  if (Math.abs(diff) > halfFov) return 0;

  const coneFraction = 1 - Math.abs(diff) / halfFov;

  if (isShadow(Math.floor(player.x/CELL), Math.floor(player.y/CELL))) {
    if (dist > effectiveRange * 0.4) return 0;
  }

  const sneakMod = player.sneaking ? 0.55 : 1.0;

  const steps = Math.max(8, Math.ceil(dist / (CELL * 0.3)));
  for (let i = 1; i <= steps; i++) {
    const t  = i / steps;
    const rx = guard.x + dx * t;
    const ry = guard.y + dy * t;
    const col = Math.floor(rx / CELL);
    const row = Math.floor(ry / CELL);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return 0;
    if (tiles[row][col] === TILE.WALL || tiles[row][col] === TILE.BREAKABLE) return 0;
  }

  const distFactor = 1 - (dist / effectiveRange);
  return coneFraction * distFactor * sneakMod;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PLAYER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let stepTimer = 0;

function initPlayer() {
  player = {
    x: (startCell.c + 0.5) * CELL,
    y: (startCell.r + 0.5) * CELL,
    radius: CELL * PLAYER_RADIUS,
    sneaking: false,
    moving: false,
    trail: [],
    angle: 0,
    detectTimer: 0,
    bobPhase: 0,
  };
}

function updatePlayer(dt) {
  const speed = (player.sneaking ? PLAYER_SPEED_SNEAK : PLAYER_SPEED_NORMAL) * (CELL / 42);
  let dx = 0, dy = 0;

  if (keys['ArrowLeft']  || keys['a'] || keys['A']) dx -= 1;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;
  if (keys['ArrowUp']    || keys['w'] || keys['W']) dy -= 1;
  if (keys['ArrowDown']  || keys['s'] || keys['S']) dy += 1;

  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

  player.moving = (dx !== 0 || dy !== 0);
  player.sneaking = player.moving && (keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight']);

  if (player.moving) {
    player.angle = Math.atan2(dy, dx);
    stepTimer -= dt;
    if (stepTimer <= 0) {
      if (!player.sneaking) sfxStep();
      stepTimer = player.sneaking ? 0.5 : 0.3;
    }
    player.bobPhase += dt * 8;
  }

  // AABB collision with walls
  const nx = player.x + dx * speed;
  const ny = player.y + dy * speed;
  const r  = player.radius;

  if (!collidesWithWalls(nx, player.y, r)) player.x = nx;
  if (!collidesWithWalls(player.x, ny, r)) player.y = ny;

  // Trail
  if (player.moving) {
    player.trail.unshift({x: player.x, y: player.y, alpha: 0.55});
    if (player.trail.length > 10) player.trail.pop();
  }
  player.trail.forEach(t => { t.alpha *= 0.82; });
  player.trail = player.trail.filter(t => t.alpha > 0.02);

  // Gem collection
  const pc = Math.floor(player.x / CELL);
  const pr = Math.floor(player.y / CELL);
  for (const gem of gemList) {
    if (!gem.collected && gem.c === pc && gem.r === pr) {
      gem.collected = true;
      globalGems++;
      sessionStats.gemsTotal++;
      sfxGem();
      spawnGemParticles(gem.c * CELL + CELL/2, gem.r * CELL + CELL/2);
      updateHUD();
    }
  }

  // Bomb Ammo pickup collection
  for (const p of bombPickups) {
    if (!p.collected && p.c === pc && p.r === pr) {
      p.collected = true;
      bombCount += 2;
      sfxPickup();
      spawnSparkParticles(p.c * CELL + CELL/2, p.r * CELL + CELL/2, '#ff9800', 16);
      updateHUD();
    }
  }

  // Exit check
  if (pc === exitCell.c && pr === exitCell.r) {
    const allCollected = gemList.every(g => g.collected);
    if (allCollected) {
      triggerLevelComplete();
    }
  }
}

function collidesWithWalls(cx, cy, r) {
  const checks = [
    {x: cx - r, y: cy - r},
    {x: cx + r, y: cy - r},
    {x: cx - r, y: cy + r},
    {x: cx + r, y: cy + r},
  ];
  for (const pt of checks) {
    const col = Math.floor(pt.x / CELL);
    const row = Math.floor(pt.y / CELL);
    if (isWall(col, row)) return true;
  }
  return false;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BOMB & DEMOLITION SYSTEM (BOOM!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function placeBomb() {
  if (gamePhase !== 'playing') return;
  if (bombCount <= 0) {
    flashBombCount();
    return;
  }

  const pc = Math.floor(player.x / CELL);
  const pr = Math.floor(player.y / CELL);

  // Prevent multiple bombs on the same cell
  if (bombs.some(b => b.c === pc && b.r === pr)) return;

  bombCount--;
  sfxFuse();

  bombs.push({
    c: pc,
    r: pr,
    x: (pc + 0.5) * CELL,
    y: (pr + 0.5) * CELL,
    timer: 1.8,
    maxTimer: 1.8,
    sparkTimer: 0,
  });

  updateHUD();
}

function flashBombCount() {
  const el = document.getElementById('hud-bombs');
  if (el) {
    el.style.transform = 'scale(1.25)';
    el.style.borderColor = '#ff3355';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
      el.style.borderColor = '';
    }, 250);
  }
}

function updateBombs(dt) {
  // Safe auto-recharge if player ran out of bombs and uncollected gems are still trapped
  if (bombCount === 0) {
    bombRechargeTimer += dt;
    if (bombRechargeTimer >= 8.0) {
      bombCount++;
      bombRechargeTimer = 0;
      updateHUD();
    }
  } else {
    bombRechargeTimer = 0;
  }

  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    b.timer -= dt;
    b.sparkTimer -= dt;

    if (b.sparkTimer <= 0) {
      // Fuse sparks
      const sx = b.x + CELL * 0.16 + (Math.random()-0.5)*4;
      const sy = b.y - CELL * 0.28 + (Math.random()-0.5)*4;
      spawnParticle(sx, sy, Math.random()>0.5 ? '#ffff00' : '#ff4500',
        (Math.random()-0.5)*2, -Math.random()*2 - 0.5, 0.25, 2.5);
      b.sparkTimer = 0.06;
    }

    if (b.timer <= 0) {
      detonateBomb(b);
      bombs.splice(i, 1);
    }
  }

  // Update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.life -= dt;
    if (ex.life <= 0) explosions.splice(i, 1);
  }
}

function detonateBomb(b) {
  sfxBoom();

  // Screen shake
  const wrap = document.getElementById('canvas-wrap');
  wrap.classList.remove('shake');
  void wrap.offsetWidth;
  wrap.classList.add('shake');

  // Register shockwave
  explosions.push({
    x: b.x,
    y: b.y,
    maxRadius: CELL * 1.6,
    life: 0.42,
    maxLife: 0.42,
  });

  // Scorch mark
  scorchMarks.push({ x: b.x, y: b.y, alpha: 0.85 });
  if (scorchMarks.length > 25) scorchMarks.shift();

  // Blast destruction: Check 3x3 surrounding tiles
  let wallShattered = false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const tc = b.c + dc;
      const tr = b.r + dr;
      if (tc >= 0 && tc < COLS && tr >= 0 && tr < ROWS) {
        if (tiles[tr][tc] === TILE.BREAKABLE) {
          tiles[tr][tc] = TILE.FLOOR; // Demolished!
          wallShattered = true;
          sessionStats.wallsBlown++;
          scorchMarks.push({ x: (tc + 0.5) * CELL, y: (tr + 0.5) * CELL, alpha: 0.75 });

          // Wall rubble particles
          for (let p = 0; p < 24; p++) {
            const angle = Math.random() * Math.PI * 2;
            const spd   = Math.random() * 4 + 1.5;
            spawnParticle(
              (tc + 0.5) * CELL, (tr + 0.5) * CELL,
              Math.random() > 0.4 ? '#ff9800' : '#4a5568',
              Math.cos(angle)*spd, Math.sin(angle)*spd - 1,
              0.6 + Math.random()*0.5, Math.random()*4 + 2
            );
          }
        }
      }
    }
  }

  // Explosion fireball & smoke particles
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4.5 + 1;
    spawnParticle(b.x, b.y, Math.random() > 0.3 ? '#ff5500' : '#ffcc00',
      Math.cos(a)*s, Math.sin(a)*s - 0.5, 0.45 + Math.random()*0.4, Math.random()*4+2);
  }
  for (let i = 0; i < 15; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 2 + 0.5;
    spawnParticle(b.x, b.y, 'rgba(40,40,50,0.6)',
      Math.cos(a)*s, Math.sin(a)*s - 1, 0.8 + Math.random()*0.5, Math.random()*6+4);
  }

  // Guard interactions: Stun if close; Sound Alert if within hearing
  for (const g of guards) {
    const dist = Math.hypot(g.x - b.x, g.y - b.y);

    if (dist < CELL * 1.7) {
      // Guard stunned by explosion!
      g.stunTimer  = 4.5;
      g.state      = GS.SUSPICIOUS;
      g.stateTimer = 4.5;
      g.detectionAccum = 0;
      // Stars particles
      for (let s = 0; s < 10; s++) {
        spawnParticle(g.x, g.y, '#facc15', (Math.random()-0.5)*3, -Math.random()*3 - 1, 0.8, 3);
      }
    } else if (dist < CELL * 16 && g.stunTimer <= 0) {
      // Guard hears explosion & rushes to investigate the BOOM!
      g.lastKnownX = b.x;
      g.lastKnownY = b.y;
      g.state      = GS.ALERT;
      g.stateTimer = 5.0;
      g.alertFlash = 1;
    }
  }

  // Check if player stood too close to their own blast
  const pDist = Math.hypot(player.x - b.x, player.y - b.y);
  if (pDist < CELL * 1.35) {
    catchPlayer("Caught in your own blast! Take cover after planting bombs!");
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GUARD AI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function initGuards(lvl) {
  guards = lvl.guards.map((def, idx) => ({
    id: idx,
    x: (def.col + 0.5) * CELL,
    y: (def.row + 0.5) * CELL,
    startCol: def.col,
    startRow: def.row,
    startAngle: def.angle,
    lookAngle:  def.angle,
    moveAngle:  def.angle,
    fov:        def.fov,
    range:      def.range,
    speed:      def.speed,
    patrol:     def.patrol,
    patrolIdx:  0,
    state:      GS.PATROL,
    stateTimer: 0,
    detectionAccum: 0,
    lastKnownX: 0,
    lastKnownY: 0,
    searchOscPhase: 0,
    alertFlash: 0,
    stunTimer:  0,
    cone: [],
  }));
}

function resetGuardsToPatrol() {
  guards.forEach(g => {
    g.state          = GS.PATROL;
    g.stateTimer     = 0;
    g.detectionAccum = 0;
    g.alertFlash     = 0;
    g.stunTimer      = 0;
  });
}

function lerpAngle(from, to, t) {
  let diff = to - from;
  while (diff >  Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return from + diff * Math.min(1, t);
}

function updateGuards(dt) {
  let anyAlert = false;

  for (const g of guards) {
    // If stunned, tick down and skip movement/detection
    if (g.stunTimer > 0) {
      g.stunTimer -= dt;
      g.cone = [];
      continue;
    }

    const detStrength = guardCanSeePlayer(g);

    switch (g.state) {
      case GS.PATROL: {
        movePatrol(g, dt);
        g.lookAngle = lerpAngle(g.lookAngle, g.moveAngle, dt * 5);

        if (detStrength > 0) {
          g.detectionAccum += detStrength * dt;
          if (g.detectionAccum >= DETECTION_HOLD) {
            enterAlert(g);
          } else if (g.detectionAccum >= DETECTION_HOLD * 0.4) {
            g.state = GS.SUSPICIOUS;
            g.stateTimer = 2.5;
            g.searchOscPhase = 0;
          }
        } else {
          g.detectionAccum = Math.max(0, g.detectionAccum - dt * 0.5);
        }
        break;
      }

      case GS.SUSPICIOUS: {
        g.stateTimer -= dt;
        g.searchOscPhase += dt * 2.2;
        g.lookAngle += Math.sin(g.searchOscPhase) * dt * 2.8;

        if (detStrength > 0) {
          g.detectionAccum += detStrength * dt * 2;
          if (g.detectionAccum >= DETECTION_HOLD) enterAlert(g);
        } else {
          g.detectionAccum = Math.max(0, g.detectionAccum - dt * 0.8);
        }

        if (g.stateTimer <= 0) {
          g.state = GS.PATROL;
          g.detectionAccum = 0;
        }
        break;
      }

      case GS.ALERT: {
        anyAlert = true;
        g.alertFlash = (g.alertFlash + dt * 8) % (Math.PI * 2);

        const tlx = g.lastKnownX, tly = g.lastKnownY;
        const tdx = tlx - g.x, tdy = tly - g.y;
        const td  = Math.hypot(tdx, tdy);

        if (td > CELL * 0.4) {
          const spd = g.speed * CELL * 0.018 * 1.6 * dt * 60;
          const nx  = g.x + (tdx/td)*spd;
          const ny  = g.y + (tdy/td)*spd;
          if (!collidesWithWalls(nx, g.y, CELL*0.35)) g.x = nx;
          if (!collidesWithWalls(g.x, ny, CELL*0.35)) g.y = ny;
          g.moveAngle = Math.atan2(tdy, tdx);
        }

        if (detStrength > 0) {
          g.lastKnownX = player.x;
          g.lastKnownY = player.y;
          g.stateTimer = 3.5;
        }

        const targetLookAngle = Math.atan2(tly - g.y, tlx - g.x);
        g.lookAngle = lerpAngle(g.lookAngle, targetLookAngle, dt * 8);
        g.stateTimer -= dt;
        if (g.stateTimer <= 0) enterSearching(g);

        // Catch check
        if (Math.hypot(player.x - g.x, player.y - g.y) < CELL * 0.7) {
          catchPlayer("Spotted and captured by guard!");
          return;
        }
        break;
      }

      case GS.SEARCHING: {
        g.stateTimer -= dt;
        g.searchOscPhase += dt * 1.8;
        g.lookAngle += Math.sin(g.searchOscPhase) * dt * 2.5;

        if (detStrength > 0.3) enterAlert(g);

        if (g.stateTimer <= 0) {
          g.state = GS.PATROL;
          g.detectionAccum = 0;
        }
        break;
      }
    }

    g.cone = buildConePolygon(g);
  }

  document.getElementById('hud-alert').classList.toggle('hidden', !anyAlert);
  detectionBar = Math.max(0, ...guards.map(g => g.stunTimer > 0 ? 0 : g.detectionAccum / DETECTION_HOLD));
}

function movePatrol(g, dt) {
  if (!g.patrol || g.patrol.length < 2) return;
  const wp  = g.patrol[g.patrolIdx % g.patrol.length];
  const tx  = (wp.c + 0.5) * CELL;
  const ty  = (wp.r + 0.5) * CELL;
  const dx  = tx - g.x;
  const dy  = ty - g.y;
  const dist= Math.hypot(dx, dy);

  if (dist < CELL * 0.15) {
    g.patrolIdx = (g.patrolIdx + 1) % g.patrol.length;
    return;
  }

  const spd = g.speed * CELL * 0.018 * dt * 60;
  const nx  = g.x + (dx/dist)*spd;
  const ny  = g.y + (dy/dist)*spd;
  g.moveAngle = Math.atan2(dy, dx);

  if (!collidesWithWalls(nx, g.y, CELL*0.35)) g.x = nx;
  if (!collidesWithWalls(g.x, ny, CELL*0.35)) g.y = ny;
}

function enterAlert(g) {
  if (g.state !== GS.ALERT) sfxAlert();
  g.state         = GS.ALERT;
  g.stateTimer    = 5.0;
  g.lastKnownX    = player.x;
  g.lastKnownY    = player.y;
  g.detectionAccum= 1;
}

function enterSearching(g) {
  g.state      = GS.SEARCHING;
  g.stateTimer = 4.0;
  g.searchOscPhase = 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CATCH / LIVES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function catchPlayer(reason = "Captured by guard!") {
  if (catchCooldown > 0) return;
  catchCooldown = 3;
  lives--;
  sessionStats.catches++;
  sfxCaught();
  spawnCaughtParticles(player.x, player.y);

  const wrap = document.getElementById('canvas-wrap');
  wrap.classList.remove('shake');
  void wrap.offsetWidth;
  wrap.classList.add('shake');

  if (lives <= 0) {
    setTimeout(() => showScreen('gameover'), 1200);
    document.getElementById('go-detail').textContent =
      `Failed on "${LEVELS[levelIndex].name}". ${reason}`;
  } else {
    document.getElementById('caught-title').textContent =
      reason.includes("blast") ? "💥 BLASTED!" : "🚨 CAUGHT!";
    document.getElementById('caught-lives-left').textContent =
      `${lives} ${lives===1?'life':'lives'} remaining`;
    document.getElementById('caught-hint').textContent = reason;
    showScreen('caught');
    setTimeout(() => {
      respawnPlayer();
      updateHUD();
      showScreen('playing');
    }, 1500);
  }
  updateHUD();
}

function respawnPlayer() {
  initPlayer();
  resetGuardsToPatrol();
  catchCooldown = 0;
  detectionBar  = 0;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PARTICLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function spawnParticle(x, y, color, vx, vy, life, size) {
  particles.push({x, y, vx, vy, life, maxLife:life, color, size});
}

function spawnGemParticles(x, y) {
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 3 + 1;
    spawnParticle(x, y, '#fbbf24', Math.cos(a)*s, Math.sin(a)*s,
      0.5 + Math.random()*0.5, Math.random()*3+1);
  }
}

function spawnSparkParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 3.5 + 1;
    spawnParticle(x, y, color, Math.cos(a)*s, Math.sin(a)*s,
      0.4 + Math.random()*0.4, Math.random()*3+1);
  }
}

function spawnCaughtParticles(x, y) {
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 4 + 1;
    spawnParticle(x, y, '#ff3355', Math.cos(a)*s, Math.sin(a)*s - 1,
      0.8 + Math.random()*0.6, Math.random()*4+2);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.08;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ANIMATIONS (GEMS / PICKUPS)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let gemAnimPhase = 0;
function updateGems(dt) {
  gemAnimPhase += dt * 2.2;
  gemList.forEach(g => {
    if (!g.collected) { g.anim = gemAnimPhase; }
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RENDERING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function render(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Floor & Walls ──────────────────────────
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tile = tiles[r][c];
      const x = c * CELL, y = r * CELL;

      if (tile === TILE.WALL) {
        // Unbreakable Bedrock Wall
        ctx.fillStyle = '#0d1424';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, y, CELL, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x, y, 3, CELL);
      } else if (tile === TILE.BREAKABLE) {
        // Cracked / Breakable Wall (Target for BOOM)
        ctx.fillStyle = '#1c2233';
        ctx.fillRect(x, y, CELL, CELL);

        // Brick mortar pattern
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, CELL - 2, CELL - 2);

        // Glowing orange fissure cracks
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x + CELL * 0.2, y + 2);
        ctx.lineTo(x + CELL * 0.45, y + CELL * 0.45);
        ctx.lineTo(x + CELL * 0.35, y + CELL * 0.7);
        ctx.lineTo(x + CELL * 0.8, y + CELL - 2);
        ctx.moveTo(x + CELL * 0.45, y + CELL * 0.45);
        ctx.lineTo(x + CELL * 0.85, y + CELL * 0.35);
        ctx.stroke();

        // Subtle crack glow center
        ctx.fillStyle = 'rgba(245,158,11,0.22)';
        ctx.beginPath();
        ctx.arc(x + CELL * 0.45, y + CELL * 0.45, 5, 0, Math.PI * 2);
        ctx.fill();

        // Brick icon
        ctx.font = `${CELL * 0.32}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧱', x + CELL / 2, y + CELL / 2);
      } else if (tile === TILE.SHADOW) {
        // Shadow hiding zone
        ctx.fillStyle = '#060a14';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.fillStyle = 'rgba(0,0,30,.4)';
        ctx.fillRect(x, y, CELL, CELL);
      } else {
        // Standard floor
        ctx.fillStyle = '#111927';
        ctx.fillRect(x, y, CELL, CELL);
        ctx.strokeStyle = 'rgba(255,255,255,0.025)';
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(x + 0.25, y + 0.25, CELL - 0.5, CELL - 0.5);
      }
    }
  }

  // ── Scorch Marks ──────────────────────────
  for (const sm of scorchMarks) {
    ctx.fillStyle = `rgba(5, 5, 12, ${sm.alpha * 0.75})`;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, CELL * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Start & Exit ──────────────────────────
  drawStartTile();
  drawExitTile();

  // ── Vision Cones ──────────────────────────
  ctx.save();
  guards.forEach(g => renderVisionCone(g));
  ctx.restore();

  // ── Gems / Diamonds ───────────────────────
  gemList.forEach(g => { if (!g.collected) drawGem(g); });

  // ── Bomb Pickups ──────────────────────────
  bombPickups.forEach(p => { if (!p.collected) drawBombPickup(p); });

  // ── Active Bombs ──────────────────────────
  drawBombs();

  // ── Shockwave Explosions ──────────────────
  drawExplosions();

  // ── Guards ────────────────────────────────
  guards.forEach(g => drawGuard(g, dt));

  // ── Player trail ──────────────────────────
  player.trail.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.x, t.y, player.radius * 0.6, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0,212,255,${t.alpha * 0.35})`;
    ctx.fill();
  });

  // ── Player ────────────────────────────────
  drawPlayer(dt);

  // ── Particles ─────────────────────────────
  particles.forEach(p => {
    const a = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * a, 0, Math.PI*2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = a;
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ── Detection Warning Bar ─────────────────
  if (detectionBar > 0.05 && gamePhase === 'playing') {
    drawDetectionBar();
  }

  // ── Pause Overlay ─────────────────────────
  if (gamePhase === 'paused') {
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function renderVisionCone(g) {
  const pts = g.cone;
  if (!pts || pts.length < 3) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();

  const range = g.range * CELL;
  const grad  = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, range);

  let edgeColor;
  switch (g.state) {
    case GS.PATROL:
      grad.addColorStop(0, 'rgba(255,255,150,0.22)');
      grad.addColorStop(1, 'rgba(255,255,120,0.04)');
      edgeColor = 'rgba(255,255,150,0.55)';
      break;
    case GS.SUSPICIOUS:
      grad.addColorStop(0, 'rgba(255,175,0,0.32)');
      grad.addColorStop(1, 'rgba(255,150,0,0.06)');
      edgeColor = 'rgba(255,175,0,0.80)';
      break;
    case GS.ALERT:
      const flash = (Math.sin(g.alertFlash) + 1) * 0.5;
      grad.addColorStop(0, `rgba(255,50,${Math.round(50*flash)},${0.38+flash*0.12})`);
      grad.addColorStop(1, 'rgba(255,50,50,0.06)');
      edgeColor = `rgba(255,${Math.round(50+flash*100)},50,0.95)`;
      break;
    case GS.SEARCHING:
      grad.addColorStop(0, 'rgba(255,120,0,0.26)');
      grad.addColorStop(1, 'rgba(255,100,0,0.04)');
      edgeColor = 'rgba(255,130,0,0.65)';
      break;
    default:
      grad.addColorStop(0, 'rgba(255,255,150,0.18)');
      grad.addColorStop(1, 'rgba(255,255,150,0.03)');
      edgeColor = 'rgba(255,255,150,0.4)';
  }

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawGuard(g, dt) {
  const cx = g.x, cy = g.y;
  const r  = CELL * 0.36;

  // Stunned indicator
  if (g.stunTimer > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(250,204,21,0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = '#222831';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dizzy face
    ctx.font = `${r * 1.05}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('😵', cx, cy);

    // Rotating dizzy stars
    const starAngle = performance.now() * 0.005;
    for (let s = 0; s < 3; s++) {
      const a  = starAngle + (s * Math.PI * 2 / 3);
      const sx = cx + Math.cos(a) * (r + 7);
      const sy = cy - 12 + Math.sin(a) * 4;
      ctx.font = `${CELL * 0.28}px sans-serif`;
      ctx.fillText('⭐', sx, sy);
    }
    return;
  }

  // Normal guard rendering
  let glowColor;
  switch (g.state) {
    case GS.PATROL:     glowColor = 'rgba(255,255,150,0.3)'; break;
    case GS.SUSPICIOUS: glowColor = 'rgba(255,175,0,0.4)';  break;
    case GS.ALERT:      glowColor = 'rgba(255,50,50,0.55)';  break;
    case GS.SEARCHING:  glowColor = 'rgba(255,120,0,0.4)';   break;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI*2);
  ctx.fillStyle = glowColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  let bodyColor;
  switch (g.state) {
    case GS.PATROL:     bodyColor = '#1a3a5c'; break;
    case GS.SUSPICIOUS: bodyColor = '#3a2800'; break;
    case GS.ALERT:      bodyColor = '#3a0010'; break;
    case GS.SEARCHING:  bodyColor = '#2a1800'; break;
  }
  ctx.fillStyle = bodyColor;
  ctx.fill();
  ctx.strokeStyle = g.state === GS.ALERT ? '#ff3355' :
                    g.state === GS.SUSPICIOUS ? '#ff9800' :
                    g.state === GS.SEARCHING ? '#ff6600' : '#4a8ab5';
  ctx.lineWidth   = 2.5;
  ctx.stroke();

  // Direction indicator
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(g.lookAngle) * r * 1.3,
             cy + Math.sin(g.lookAngle) * r * 1.3);
  ctx.strokeStyle = g.state === GS.ALERT ? '#ff6688' :
                    g.state === GS.SUSPICIOUS ? '#ffbb44' : '#88ccff';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.stroke();
  ctx.lineCap     = 'butt';

  // Emoji face
  ctx.font        = `${r * 1.05}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillText(g.state === GS.ALERT ? '😡' :
               g.state === GS.SUSPICIOUS ? '🤔' :
               g.state === GS.SEARCHING  ? '🔍' : '😐', cx, cy);

  // State icon above guard
  if (g.state !== GS.PATROL) {
    const icon = g.state === GS.ALERT ? '❗' :
                 g.state === GS.SUSPICIOUS ? '❓' : '🔍';
    ctx.font = `${CELL * 0.42}px sans-serif`;
    ctx.fillText(icon, cx, cy - r - 10);
  }

  // Detection arc
  if (g.detectionAccum > 0 && g.state !== GS.ALERT) {
    const pct = g.detectionAccum / DETECTION_HOLD;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 7, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2);
    ctx.strokeStyle = `rgba(255,200,0,${pct})`;
    ctx.lineWidth   = 3;
    ctx.stroke();
  }

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawPlayer(dt) {
  const cx = player.x;
  const cy = player.y + Math.sin(player.bobPhase) * 2;
  const r  = player.radius;

  // Outer glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
  grad.addColorStop(0, 'rgba(0,212,255,0.25)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.5, 0, Math.PI*2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fillStyle = player.sneaking ? 'rgba(0,180,220,0.75)' : 'rgba(0,212,255,0.85)';
  ctx.fill();
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Ghost emoji
  ctx.font        = `${r * 1.3}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillText('👻', cx, cy);

  // Sneak indicator
  if (player.sneaking) {
    ctx.font      = `${CELL * 0.3}px sans-serif`;
    ctx.fillStyle = 'rgba(0,212,255,0.75)';
    ctx.fillText('🥷', cx, cy - r - 10);
  }

  ctx.textAlign   = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawGem(gem) {
  const cx = gem.c * CELL + CELL/2;
  const cy = gem.r * CELL + CELL/2;
  const bob = Math.sin(gem.anim) * 3;
  const scale = 0.9 + Math.sin(gem.anim * 1.3) * 0.1;

  // Glow
  const grad = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, CELL * 0.45);
  grad.addColorStop(0, 'rgba(251,191,36,0.45)');
  grad.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.beginPath();
  ctx.arc(cx, cy + bob, CELL * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Gem emoji
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(scale, scale);
  ctx.font        = `${CELL * 0.55}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillText('💎', 0, 0);
  ctx.restore();
}

function drawBombPickup(p) {
  const cx = p.c * CELL + CELL/2;
  const cy = p.r * CELL + CELL/2;
  const bob = Math.sin(gemAnimPhase * 1.5 + p.c) * 3;

  ctx.font = `${CELL * 0.52}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧨', cx, cy + bob);
}

function drawBombs() {
  for (const b of bombs) {
    const pulse = 1 + Math.sin(b.timer * 14) * 0.12;

    ctx.save();
    ctx.translate(b.x, b.y);

    // Blast radius dotted warning ring
    ctx.beginPath();
    ctx.arc(0, 0, CELL * 1.45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.setLineDash([]);

    // Warning glow before detonation
    if (b.timer < 0.65) {
      ctx.beginPath();
      ctx.arc(0, 0, CELL * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 50, 50, 0.45)';
      ctx.fill();
    }

    ctx.scale(pulse, pulse);
    ctx.font = `${CELL * 0.65}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 0);

    ctx.restore();
  }
}

function drawExplosions() {
  for (const ex of explosions) {
    const progress = 1 - (ex.life / ex.maxLife);
    const curR = ex.maxRadius * Math.sin(progress * Math.PI * 0.5);
    const alpha = Math.max(0, ex.life / ex.maxLife);

    ctx.save();
    const grad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, curR);
    grad.addColorStop(0, `rgba(255, 255, 200, ${alpha * 0.85})`);
    grad.addColorStop(0.4, `rgba(255, 120, 20, ${alpha * 0.65})`);
    grad.addColorStop(1, `rgba(255, 50, 50, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 220, 100, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

function drawStartTile() {
  const x = startCell.c * CELL, y = startCell.r * CELL;
  ctx.fillStyle = 'rgba(0,232,122,0.15)';
  ctx.fillRect(x, y, CELL, CELL);
  ctx.strokeStyle = 'rgba(0,232,122,0.5)';
  ctx.lineWidth   = 2;
  ctx.strokeRect(x+1, y+1, CELL-2, CELL-2);
  ctx.font        = `${CELL*0.45}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.fillStyle   = '#00e87a';
  ctx.fillText('S', x + CELL/2, y + CELL/2);
  ctx.textAlign   = 'left';
  ctx.textBaseline= 'alphabetic';
}

function drawExitTile() {
  const x = exitCell.c * CELL, y = exitCell.r * CELL;
  const allDone = gemList.every(g => g.collected);
  const col = allDone ? 'rgba(0,232,122,0.35)' : 'rgba(100,100,100,0.15)';
  ctx.fillStyle = col;
  ctx.fillRect(x, y, CELL, CELL);
  if (allDone) {
    ctx.strokeStyle = 'rgba(0,232,122,0.7)';
    ctx.lineWidth   = 2.5;
    ctx.strokeRect(x+1, y+1, CELL-2, CELL-2);
  }
  ctx.font        = `${CELL*0.55}px sans-serif`;
  ctx.textAlign   = 'center';
  ctx.textBaseline= 'middle';
  ctx.globalAlpha = allDone ? 1 : 0.4;
  ctx.fillText('🚪', x + CELL/2, y + CELL/2);
  ctx.globalAlpha = 1;
  ctx.textAlign   = 'left';
  ctx.textBaseline= 'alphabetic';
}

function drawDetectionBar() {
  const barW = canvas.width * 0.55;
  const barH = 6;
  const bx   = (canvas.width - barW) / 2;
  const by   = canvas.height - 16;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);

  const col = detectionBar < 0.5 ? '#fbbf24' : detectionBar < 0.85 ? '#ff9800' : '#ff3355';
  ctx.fillStyle = col;
  ctx.fillRect(bx, by, barW * Math.min(1, detectionBar), barH);

  ctx.font      = `bold ${CELL*0.28}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText('👁 DETECTION', canvas.width/2, by - 6);
  ctx.textAlign = 'left';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HUD UPDATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateHUD() {
  const lvl = LEVELS[levelIndex];
  document.getElementById('hud-level-name').textContent = lvl.name;

  const collected = gemList.filter(g => g.collected).length;
  document.getElementById('hud-gems').textContent = `💎 ${collected} / ${gemList.length}`;

  const bombEl = document.getElementById('hud-bombs');
  if (bombEl) {
    bombEl.textContent = `💣 ${bombCount}`;
    bombEl.classList.toggle('empty', bombCount <= 0);
  }

  const boomBtn = document.getElementById('hud-boom-btn');
  if (boomBtn) {
    boomBtn.disabled = (bombCount <= 0);
  }

  const hearts = '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, MAX_LIVES - lives));
  document.getElementById('hud-lives').textContent = hearts;

  document.getElementById('hud-sneak').classList.toggle('hidden', !player.sneaking);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LEVEL FLOW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadLevel(idx) {
  levelIndex   = idx;
  const lvl    = LEVELS[idx];

  parseMap(lvl);
  initPlayer();
  initGuards(lvl);
  particles    = [];
  bombs        = [];
  explosions   = [];
  scorchMarks  = [];
  detectionBar = 0;
  catchCooldown= 0;
  stepTimer    = 0;
  bombCount    = lvl.bombs || 3;
  bombRechargeTimer = 0;
  levelStartTime = performance.now();

  updateHUD();
  updateLevelSelectUI();
}

function triggerLevelComplete() {
  sfxExit();
  gamePhase = 'levelcomplete';

  if (!completedLevels.includes(levelIndex)) completedLevels.push(levelIndex);
  if (levelIndex + 1 < LEVELS.length && !unlockedLevels.includes(levelIndex+1)) {
    unlockedLevels.push(levelIndex + 1);
  }
  savePersist();

  const elapsed = ((performance.now() - levelStartTime) / 1000).toFixed(1);
  document.getElementById('lc-name').textContent  = LEVELS[levelIndex].name;
  document.getElementById('lc-stats').innerHTML   =
    `Time: <strong>${elapsed}s</strong> &nbsp;|&nbsp; Lives remaining: <strong>${lives}</strong> &nbsp;|&nbsp; Bombs remaining: <strong>${bombCount}</strong>`;

  const nextBtn = document.getElementById('lc-next-btn');
  if (levelIndex + 1 < LEVELS.length) {
    nextBtn.style.display = 'block';
    nextBtn.textContent   = `▶ NEXT: ${LEVELS[levelIndex+1].name}`;
  } else {
    nextBtn.style.display = 'none';
  }

  showScreen('levelcomplete');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GAME LOOP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function gameLoop(ts) {
  animId = requestAnimationFrame(gameLoop);

  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  if (gamePhase === 'playing') {
    if (catchCooldown > 0) catchCooldown -= dt;
    updatePlayer(dt);
    updateGuards(dt);
    updateBombs(dt);
    updateGems(dt);
    updateParticles(dt);
    updateHUD();
  } else if (gamePhase === 'caught') {
    updateParticles(dt);
    updateBombs(dt);
  }

  if (gamePhase !== 'menu') render(dt);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SCREEN MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SCREENS = ['start','pause','caught','gameover','levelcomplete','victory'];

function showScreen(name) {
  SCREENS.forEach(id => {
    const el = document.getElementById(id + '-screen');
    if (el) el.classList.remove('active');
  });
  if (name && name !== 'playing') {
    const el = document.getElementById(name + '-screen');
    if (el) el.classList.add('active');
  }
  gamePhase = name === 'playing' ? 'playing' : name;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PERSIST (localStorage)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function loadPersist() {
  try {
    const d = JSON.parse(localStorage.getItem('ghostguard_save') || '{}');
    unlockedLevels  = d.unlocked  || [0];
    completedLevels = d.completed || [];
  } catch(e) {
    unlockedLevels  = [0];
    completedLevels = [];
  }
}

function savePersist() {
  try {
    localStorage.setItem('ghostguard_save', JSON.stringify({
      unlocked:  unlockedLevels,
      completed: completedLevels,
    }));
  } catch(e) {}
}

function updateLevelSelectUI() {
  const btns = document.querySelectorAll('.level-btn');
  btns.forEach((btn, i) => {
    btn.classList.remove('unlocked','locked','completed','active');
    if (completedLevels.includes(i))  btn.classList.add('completed','unlocked');
    else if (unlockedLevels.includes(i)) btn.classList.add('unlocked');
    else                               btn.classList.add('locked');
    if (i === levelIndex)              btn.classList.add('active');
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INPUT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function setupInput() {
  document.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Plant bomb on SPACE or B or KeyB
    if ((e.code === 'Space' || e.key === ' ' || e.key === 'b' || e.key === 'B') && gamePhase === 'playing') {
      e.preventDefault();
      placeBomb();
      return;
    }

    if (e.key === 'Escape') {
      if (gamePhase === 'playing') { showScreen('pause'); }
      else if (gamePhase === 'pause') { showScreen('playing'); }
    }
  });

  document.addEventListener('keyup', e => { delete keys[e.key]; });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INIT & EVENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  loadPersist();
  resizeCanvas();

  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  setupInput();
  updateLevelSelectUI();

  // ── Button wiring ──────────────────────────

  document.getElementById('start-btn').onclick = () => {
    lives = MAX_LIVES;
    sessionStats = { time:0, catches:0, gemsTotal:0, wallsBlown:0 };
    loadLevel(levelIndex);
    showScreen('playing');
    requestAnimationFrame(ts => { lastTime = ts; gameLoop(ts); });
  };

  // Interactive BOOM button on HUD
  const boomBtn = document.getElementById('hud-boom-btn');
  if (boomBtn) {
    boomBtn.onclick = () => {
      placeBomb();
    };
  }

  // Level select buttons
  document.querySelectorAll('.level-btn').forEach((btn, i) => {
    btn.onclick = () => {
      if (btn.classList.contains('locked')) return;
      levelIndex = i;
      document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('start-btn').textContent = `▶ PLAY ${LEVELS[i].name}`;
    };
  });

  document.getElementById('resume-btn').onclick = () => showScreen('playing');
  document.getElementById('quit-btn').onclick   = () => {
    showScreen('start');
    updateLevelSelectUI();
  };

  document.getElementById('go-restart-btn').onclick = () => {
    lives = MAX_LIVES;
    loadLevel(levelIndex);
    showScreen('playing');
  };
  document.getElementById('go-menu-btn').onclick = () => {
    showScreen('start');
    updateLevelSelectUI();
  };

  document.getElementById('lc-next-btn').onclick = () => {
    if (levelIndex + 1 < LEVELS.length) {
      levelIndex++;
      loadLevel(levelIndex);
      showScreen('playing');
    } else {
      document.getElementById('v-stats').innerHTML =
        `Diamonds collected: <strong>${sessionStats.gemsTotal}</strong><br>
         Walls demolished: <strong>${sessionStats.wallsBlown}</strong><br>
         Times caught: <strong>${sessionStats.catches}</strong>`;
      showScreen('victory');
    }
  };

  document.getElementById('lc-menu-btn').onclick = () => {
    showScreen('start');
    updateLevelSelectUI();
  };

  document.getElementById('v-restart-btn').onclick = () => {
    levelIndex = 0; lives = MAX_LIVES;
    sessionStats = {time:0,catches:0,gemsTotal:0,wallsBlown:0};
    loadLevel(0);
    showScreen('playing');
  };
  document.getElementById('v-menu-btn').onclick = () => {
    showScreen('start'); updateLevelSelectUI();
  };

  showScreen('start');
});
