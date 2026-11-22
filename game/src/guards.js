// The Velvet Vault — the people and lenses watching the hall: guards walk
// their patrols and chase what they have just seen; cameras sweep their
// cones on a fixed rhythm. One clear job: the watchers and their sight.
import { GUARDS, CAMERAS, TUNING, HUD_H } from './config.js';
import { tileCenter, hasLineOfSight } from './world.js';

export function makeGuards() {
  return GUARDS.map((g) => {
    const start = tileCenter(g.waypoints[0].col, g.waypoints[0].row);
    return {
      name: g.name,
      waypoints: g.waypoints.map((w) => tileCenter(w.col, w.row)),
      waypointIndex: 1,
      x: start.x,
      y: start.y,
      angle: 0,
      speed: g.speed,
      pauseSec: g.pauseSec,
      pauseLeft: 0,
      range: g.range,
      halfAngle: g.halfAngle,
      // Chase state: set when the guard has a fresh sighting.
      chaseUntil: 0,
      lastSeenX: 0,
      lastSeenY: 0,
      alerted: false,
    };
  });
}

export function makeCameras() {
  return CAMERAS.map((c) => {
    const mount = tileCenter(c.col, c.row);
    return {
      name: c.name,
      x: mount.x,
      y: mount.y,
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      sweepSec: c.sweepSec,
      range: c.range,
      halfAngle: c.halfAngle,
      phase: 0,
      angle: c.baseAngle,
      disabledUntil: 0,
    };
  });
}

// How strongly does a cone hold the thief? 0 when out of range, out of
// angle, behind a wall, or hidden in smoke; 1 at point-blank, falling off
// with distance. Sneaking halves it.
function coneHold(ox, oy, angle, range, halfAngle, tx, ty, sneaking, clouds) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return 0;
  if (!hasLineOfSight(ox, oy, tx, ty)) return 0;
  // Smoke swallows sight outright.
  for (const c of clouds) {
    if (Math.hypot(tx - c.x, ty - c.y) <= c.radius) return 0;
  }
  const near = 1 - (1 - TUNING.distanceFalloff) * (dist / range);
  return near * (sneaking ? TUNING.sneakFactor : 1);
}

// Advance one guard by dt seconds. Returns its cone hold on the thief
// (0..1), or 0 while it is pausing to look around.
export function updateGuard(guard, dt, now, thief, clouds) {
  // Chase: hurry to the last place the thief was seen.
  if (now < guard.chaseUntil) {
    guard.alerted = true;
    const dx = guard.lastSeenX - guard.x;
    const dy = guard.lastSeenY - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      const step = Math.min(dist, TUNING.guardChaseSpeed * dt);
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      guard.angle = Math.atan2(dy, dx);
    } else {
      guard.chaseUntil = 0; // arrived, lost the trail
    }
    return coneHold(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle,
      thief.x, thief.y, thief.sneaking, clouds);
  }
  guard.alerted = false;

  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    // Look around while waiting: slow scan of the hall.
    guard.angle += dt * 0.9;
    return coneHold(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle,
      thief.x, thief.y, thief.sneaking, clouds);
  }

  const target = guard.waypoints[guard.waypointIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = target.x;
    guard.y = target.y;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pauseSec;
  } else {
    guard.x += (dx / dist) * step;
    guard.y += (dy / dist) * step;
    guard.angle = Math.atan2(dy, dx);
  }
  return coneHold(guard.x, guard.y, guard.angle, guard.range, guard.halfAngle,
    thief.x, thief.y, thief.sneaking, clouds);
}

// A fresh sighting: the guard remembers where, and gives chase.
export function alertGuard(guard, now, tx, ty) {
  guard.chaseUntil = now + TUNING.guardMemorySec;
  guard.lastSeenX = tx;
  guard.lastSeenY = ty;
}

// Advance one camera's sweep by dt seconds. Returns its cone hold on the
// thief, or 0 while the EMP has it offline.
export function updateCamera(camera, dt, now, thief, clouds) {
  if (now < camera.disabledUntil) return 0;
  camera.phase += dt / camera.sweepSec;
  // Triangle wave: sweep out and back, no jump at the ends.
  const tri = 1 - Math.abs(1 - ((camera.phase % 2) + 2) % 2);
  camera.angle = camera.baseAngle + (tri * 2 - 1) * camera.sweep;
  return coneHold(camera.x, camera.y, camera.angle, camera.range, camera.halfAngle,
    thief.x, thief.y, thief.sneaking, clouds);
}

export { HUD_H };
