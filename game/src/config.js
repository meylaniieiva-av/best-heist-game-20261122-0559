// The Velvet Vault — configuration: the museum floor plan, the rules of the
// heist, and every number the rest of the game tunes against. One clear job:
// hold the level and the tuning, nothing else.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const HUD_H = 80;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = HUD_H + ROWS * TILE; // 800

// The floor plan, one character per tile. '#' wall, '.' floor, 'C' display
// case (cover: blocks movement and sight), 'V' vault wall, 'D' the Velvet
// Diamond pedestal, 'E' entrance, 'X' getaway door, 'L' side loot.
// Three ways through the hall: the left gallery of cases, the open centre
// aisle under the carpet, and the right corridor past the cameras.
export const MAP = [
  '################################',
  '#......C.......VVV......C......#',
  '#......C.......VDV......C......#',
  '#......C.......V.V......C......#',
  '#...........C......C...........#',
  '#..L.......C.......C........L..#',
  '#...........C......C...........#',
  '#....C.........C.......C.......#',
  '#....C.........C.......C.......#',
  '#....C.........................X',
  '#....C......C...L...C.....C....#',
  '#...........C......C......C....#',
  '#..C........C......C...........#',
  '#..C...........................#',
  '#......C.......C.......C.......#',
  '#......C.......C.......C.......#',
  '#..............................#',
  '###############EE###############',
];

export const SPAWN = { col: 16, row: 16 }; // just inside the entrance, on the open carpet lane
export const DIAMOND = { col: 16, row: 2 }; // the Velvet Diamond pedestal
export const EXIT_TILE = { col: 31, row: 9 }; // the getaway door

export const SIDE_LOOT = [
  { col: 3, row: 5, name: 'Gold bars', points: 150 },
  { col: 28, row: 5, name: 'Sunset painting', points: 150 },
  { col: 16, row: 10, name: 'Jade figurine', points: 200 },
];

// Guard patrols: waypoints in tile coordinates, walked in order and looped.
export const GUARDS = [
  {
    name: 'Rook',
    waypoints: [
      { col: 7, row: 9 },
      { col: 28, row: 9 },
    ],
    speed: 62, // px per second
    pauseSec: 1.2,
    range: 230,
    halfAngle: 0.61, // ~35 degrees
  },
  {
    name: 'Bishop',
    waypoints: [
      { col: 3, row: 4 },
      { col: 3, row: 11 },
    ],
    speed: 55,
    pauseSec: 1.6,
    range: 215,
    halfAngle: 0.61,
  },
  {
    name: 'Knight',
    waypoints: [
      { col: 17, row: 4 },
      { col: 17, row: 8 },
      { col: 21, row: 8 },
      { col: 21, row: 4 },
    ],
    speed: 70,
    pauseSec: 0.9,
    range: 225,
    halfAngle: 0.61,
  },
];

// Wall cameras: mounted on a wall tile, sweeping their cone back and forth.
export const CAMERAS = [
  {
    name: 'Cam A',
    col: 10,
    row: 0, // mounted on the north wall
    baseAngle: Math.PI / 2, // facing down into the hall
    sweep: 0.7, // radians either side of base
    sweepSec: 3.2, // seconds for one full sweep
    range: 280,
    halfAngle: 0.49, // ~28 degrees
  },
  {
    name: 'Cam B',
    col: 31,
    row: 13, // mounted on the east wall
    baseAngle: Math.PI, // facing left into the hall
    sweep: 0.6,
    sweepSec: 2.6,
    range: 280,
    halfAngle: 0.49,
  },
];

export const TUNING = {
  thiefWalk: 150, // px/s
  thiefSneak: 78, // px/s while holding Shift; half the detection rate
  thiefRadius: 13,
  guardRadius: 14,
  // Alarm: 0-100. Rises while any cone holds the thief in sight, falls
  // while hidden. At 100 the thief is caught.
  alarmRisePerSec: 46, // at point-blank, standing, in a guard cone
  alarmRiseCamera: 34, // in a camera cone
  alarmFallPerSec: 16,
  sneakFactor: 0.5, // detection multiplier while sneaking
  distanceFalloff: 0.45, // detection at max range is this fraction of close
  // When a guard has seen the thief recently it hurries to the last spot.
  guardChaseSpeed: 118,
  guardMemorySec: 3.5,
  // Tools. Smoke hides the thief; EMP silences the cameras.
  smokeCharges: 2,
  smokeRadius: 95,
  smokeSec: 6,
  empCharges: 1,
  empSec: 12,
  // The vault: hold E beside the pedestal to crack it.
  crackSec: 2.5,
  crackRange: 58, // px from the pedestal centre
  pointsDiamond: 1000,
  timeBonusPerSec: 4, // left of a 240 s par, at escape
  parSec: 240,
};
