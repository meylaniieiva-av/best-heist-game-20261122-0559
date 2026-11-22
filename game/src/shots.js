// The Velvet Vault — staged scenes for the entry's screenshots: the same
// game, posed by a URL query (?shot=start|play|alarm|getaway&seed=N), so
// each screenshot is a real render of the game's own code. One clear job:
// pose the game for its photographs.
import { DIAMOND, SPAWN } from './config.js';
import { tileCenter } from './world.js';

// Place the thief and the watchers for one named shot, then hand the game
// back to its loop. Every pose is deterministic for its seed.
export function applyShot(game, shot, seed) {
  const rngSeed = (seed * 7919 + shot.length * 131) >>> 0;
  void rngSeed;
  const at = (col, row) => tileCenter(col, row);

  if (shot === 'start') {
    // The thief slips in; the hall is calm, cones sweeping far away.
    game.phase = 'playing';
    game.thief.x = at(SPAWN.col, SPAWN.row).x;
    game.thief.y = at(SPAWN.col, SPAWN.row).y;
    game.thief.angle = -Math.PI / 2;
    game.alarm = 4;
    game.elapsed = 3;
  } else if (shot === 'play') {
    // Mid-heist: the thief ducks behind a case in the centre hall while
    // Rook's cone sweeps past and a camera watches the right corridor.
    game.phase = 'playing';
    const p = at(13, 10);
    game.thief.x = p.x;
    game.thief.y = p.y;
    game.thief.angle = Math.PI;
    game.thief.sneaking = true;
    game.elapsed = 47;
    game.score = 150;
    game.loot[0].taken = true; // the gold bars are already pocketed
    // Rook mid-patrol, cone crossing the thief's case.
    game.guards[0].x = at(18, 9).x;
    game.guards[0].y = at(18, 9).y;
    game.guards[0].angle = Math.PI;
    game.guards[0].waypointIndex = 0;
    game.guards[0].pauseLeft = 0;
    // Bishop halfway down the left gallery.
    game.guards[1].x = at(3, 8).x;
    game.guards[1].y = at(3, 8).y;
    game.guards[1].angle = Math.PI / 2;
    game.guards[1].waypointIndex = 1;
    game.alarm = 22;
  } else if (shot === 'alarm') {
    // Caught in the open: the alarm is nearly full, Knight is charging in,
    // and the thief is sprinting for the cases with a smoke cloud blooming.
    game.phase = 'playing';
    const p = at(20, 11);
    game.thief.x = p.x;
    game.thief.y = p.y;
    game.thief.angle = Math.PI;
    game.elapsed = 96;
    game.score = 350;
    game.loot[0].taken = true;
    game.loot[2].taken = true;
    game.alarm = 78;
    game.smokeCharges = 1;
    game.clouds.push({ x: p.x - 40, y: p.y + 10, radius: 95, until: game.now + 6 });
    game.guards[2].x = at(19, 8).x;
    game.guards[2].y = at(19, 8).y;
    game.guards[2].angle = Math.PI / 2;
    game.guards[2].chaseUntil = game.now + 3.5;
    game.guards[2].lastSeenX = p.x;
    game.guards[2].lastSeenY = p.y;
    game.guards[2].alerted = true;
    game.guards[0].x = at(24, 9).x;
    game.guards[0].y = at(24, 9).y;
    game.guards[0].angle = Math.PI;
    game.guards[0].waypointIndex = 0;
  } else if (shot === 'getaway') {
    // The diamond is in the bag and the thief is at the OUT door, the
    // hall behind them, the alarm falling as the guards lose the trail.
    game.phase = 'playing';
    const p = at(30, 9);
    game.thief.x = p.x;
    game.thief.y = p.y;
    game.thief.angle = 0;
    game.diamondTaken = true;
    game.elapsed = 148;
    game.score = 1350;
    game.loot.forEach((l) => {
      l.taken = true;
    });
    game.alarm = 31;
    game.guards[0].x = at(22, 9).x;
    game.guards[0].y = at(22, 9).y;
    game.guards[0].angle = Math.PI;
    game.guards[0].waypointIndex = 0;
    game.guards[1].x = at(3, 6).x;
    game.guards[1].y = at(3, 6).y;
    game.guards[1].angle = -Math.PI / 2;
    game.guards[1].waypointIndex = 0;
  } else {
    return false;
  }
  void DIAMOND;
  return true;
}

// The shot names the screenshots use, in the order they are taken.
export const SHOT_NAMES = ['start', 'play', 'alarm', 'getaway'];
