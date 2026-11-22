// The Velvet Vault — the museum itself: parse the floor plan, answer
// "is this tile solid?", move a circle without clipping through walls, and
// test line of sight between two points. One clear job: the world geometry.
import { TILE, COLS, ROWS, MAP, HUD_H } from './config.js';

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return MAP[row][col];
}

// Solid to movement: walls, cases, vault walls, the diamond pedestal.
// The entrance and the getaway door are open floor.
export function isSolid(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'C' || t === 'V' || t === 'D';
}

// Blocks sight: walls, cases and vault walls. The pedestal itself is low.
export function blocksSight(col, row) {
  const t = tileAt(col, row);
  return t === '#' || t === 'C' || t === 'V';
}

export function tileCenter(col, row) {
  return { x: (col + 0.5) * TILE, y: HUD_H + (row + 0.5) * TILE };
}

export function tileOf(x, y) {
  return {
    col: Math.floor(x / TILE),
    row: Math.floor((y - HUD_H) / TILE),
  };
}

// Move a circle of `radius` by (dx, dy), sliding along walls instead of
// sticking: try the full step, then each axis on its own.
export function moveCircle(pos, dx, dy, radius) {
  const hit = (x, y) => {
    const r = radius;
    const c0 = Math.floor((x - r) / TILE);
    const c1 = Math.floor((x + r) / TILE);
    const r0 = Math.floor((y - HUD_H - r) / TILE);
    const r1 = Math.floor((y - HUD_H + r) / TILE);
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        if (!isSolid(col, row)) continue;
        const bx = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
        const by = Math.max(HUD_H + row * TILE, Math.min(y, HUD_H + (row + 1) * TILE));
        const ddx = x - bx;
        const ddy = y - by;
        if (ddx * ddx + ddy * ddy < r * r) return true;
      }
    }
    return false;
  };
  let { x, y } = pos;
  if (!hit(x + dx, y + dy)) {
    x += dx;
    y += dy;
  } else if (!hit(x + dx, y)) {
    x += dx;
  } else if (!hit(x, y + dy)) {
    y += dy;
  }
  return { x, y };
}

// Line of sight: sample the segment in small steps; a sight-blocking tile
// anywhere along it breaks the view. Cheap, and fair to both sides.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const p = tileOf(x0 + dx * t, y0 + dy * t);
    if (blocksSight(p.col, p.row)) return false;
  }
  return true;
}

// Cast one sight ray from (x, y) along `angle` until it hits a
// sight-blocking tile or `maxDist`; returns the distance it travelled.
export function castRay(x, y, angle, maxDist) {
  const step = 6;
  const dx = Math.cos(angle) * step;
  const dy = Math.sin(angle) * step;
  let px = x;
  let py = y;
  let travelled = 0;
  while (travelled < maxDist) {
    px += dx;
    py += dy;
    travelled += step;
    const p = tileOf(px, py);
    if (blocksSight(p.col, p.row)) return travelled;
  }
  return maxDist;
}

// Is the thief standing inside a smoke cloud?
export function inSmoke(x, y, clouds) {
  for (const c of clouds) {
    if (Math.hypot(x - c.x, y - c.y) <= c.radius) return true;
  }
  return false;
}
