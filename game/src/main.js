// The Velvet Vault — the game itself: state, the frame loop, the alarm,
// the tools, the vault crack, the loot and the getaway. One clear job: run
// the heist.
import {
  TILE, VIEW_W, VIEW_H, HUD_H, SPAWN, DIAMOND, EXIT_TILE,
  SIDE_LOOT, TUNING,
} from './config.js';
import { tileCenter, tileOf, moveCircle, hasLineOfSight } from './world.js';
import { makeGuards, makeCameras, updateGuard, updateCamera, alertGuard } from './guards.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { draw } from './render.js';
import { applyShot } from './shots.js';
import { seedFrom } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}

function newGame() {
  const spawn = tileCenter(SPAWN.col, SPAWN.row);
  return {
    phase: 'title', // title | playing | caught | escaped
    now: 0,
    elapsed: 0,
    alarm: 0,
    score: 0,
    diamondTaken: false,
    crackProgress: 0,
    smokeCharges: TUNING.smokeCharges,
    empCharges: TUNING.empCharges,
    thief: {
      x: spawn.x,
      y: spawn.y,
      angle: -Math.PI / 2,
      sneaking: false,
      moving: false,
    },
    guards: makeGuards(),
    cameras: makeCameras(),
    loot: SIDE_LOOT.map((l) => ({ ...l, taken: false })),
    clouds: [], // {x, y, radius, until}
    spottedAt: -10, // last time any cone held the thief
    stepAt: 0,
    announced: '',
  };
}

const game = newGame();
const input = makeInput();
const audio = makeAudio();
input.attach(canvas);
fitCanvas();
window.addEventListener('resize', fitCanvas);

function announce(text) {
  if (text === game.announced) return;
  game.announced = text;
  statusEl.textContent = text;
}

// Distance from the thief to the diamond pedestal, in pixels.
function diamondDistance() {
  const d = tileCenter(DIAMOND.col, DIAMOND.row);
  return Math.hypot(game.thief.x - d.x, game.thief.y - d.y);
}

function nearExit() {
  const e = tileOf(game.thief.x, game.thief.y);
  return e.col === EXIT_TILE.col && e.row === EXIT_TILE.row;
}

function update(dt) {
  game.now += dt;
  if (game.phase !== 'playing') return;
  game.elapsed += dt;

  // --- Move the thief.
  const vec = input.moveVector();
  const thief = game.thief;
  thief.sneaking = input.sneaking;
  thief.moving = vec !== null;
  if (vec) {
    const speed = thief.sneaking ? TUNING.thiefSneak : TUNING.thiefWalk;
    thief.angle = Math.atan2(vec.y, vec.x);
    const next = moveCircle(thief, vec.x * speed * dt, vec.y * speed * dt, TUNING.thiefRadius);
    thief.x = next.x;
    thief.y = next.y;
    if (game.now - game.stepAt > 0.34) {
      game.stepAt = game.now;
      audio.step(thief.sneaking);
    }
  }

  // --- The watchers look for the thief.
  let hold = 0;
  for (const guard of game.guards) {
    const h = updateGuard(guard, dt, game.now, thief, game.clouds);
    if (h > 0) {
      hold = Math.max(hold, h);
      alertGuard(guard, game.now, thief.x, thief.y);
    }
  }
  let cameraHold = 0;
  for (const camera of game.cameras) {
    cameraHold = Math.max(cameraHold, updateCamera(camera, dt, game.now, thief, game.clouds));
  }

  // --- The alarm answers what the cones see.
  const seen = hold > 0 || cameraHold > 0;
  if (seen) {
    const rise = Math.max(
      hold * TUNING.alarmRisePerSec,
      cameraHold * TUNING.alarmRiseCamera,
    );
    game.alarm += rise * dt;
    if (game.now - game.spottedAt > 1.2) audio.spotted();
    game.spottedAt = game.now;
  } else {
    game.alarm -= TUNING.alarmFallPerSec * dt;
  }
  game.alarm = Math.max(0, Math.min(100, game.alarm));
  if (game.alarm >= 100) {
    game.phase = 'caught';
    audio.caught();
    announce('Caught! The alarm reached 100 percent.');
    return;
  }

  // --- Smoke clouds thin out.
  game.clouds = game.clouds.filter((c) => game.now < c.until);

  // --- Tools: 1 drops smoke, 2 fires the EMP.
  if (input.wasPressed('1') && game.smokeCharges > 0) {
    game.smokeCharges -= 1;
    game.clouds.push({
      x: thief.x,
      y: thief.y,
      radius: TUNING.smokeRadius,
      until: game.now + TUNING.smokeSec,
    });
    audio.smoke();
  }
  if (input.wasPressed('2') && game.empCharges > 0) {
    game.empCharges -= 1;
    for (const camera of game.cameras) camera.disabledUntil = game.now + TUNING.empSec;
    audio.emp();
  }

  // --- Side loot: walk over it to pocket it.
  for (const item of game.loot) {
    if (item.taken) continue;
    const p = tileCenter(item.col, item.row);
    if (Math.hypot(thief.x - p.x, thief.y - p.y) < TILE * 0.7) {
      item.taken = true;
      game.score += item.points;
      audio.pickup();
      announce(`${item.name} pocketed, ${item.points} points.`);
    }
  }

  // --- The vault: hold E beside the pedestal to crack it.
  if (!game.diamondTaken) {
    if (input.keys.has('e') && diamondDistance() <= TUNING.crackRange) {
      const before = game.crackProgress;
      game.crackProgress += dt / TUNING.crackSec;
      if (Math.floor(game.crackProgress * 8) !== Math.floor(before * 8)) audio.crackTick();
      if (game.crackProgress >= 1) {
        game.diamondTaken = true;
        game.score += TUNING.pointsDiamond;
        audio.diamond();
        announce('The Velvet Diamond is yours. Get to the OUT door!');
      }
    } else {
      game.crackProgress = Math.max(0, game.crackProgress - dt * 2);
    }
  }

  // --- The getaway: diamond in the bag, reach the OUT door.
  if (game.diamondTaken && nearExit()) {
    const timeBonus = Math.max(0, TUNING.parSec - game.elapsed) * TUNING.timeBonusPerSec;
    game.score += Math.round(timeBonus);
    game.phase = 'escaped';
    audio.escape();
    announce(`Clean getaway! ${game.score} points.`);
  }

  // --- The HUD's one-line objective, for screen readers.
  if (game.alarm >= 75) announce('The alarm is nearly full — break line of sight!');
  else if (game.diamondTaken) announce('Diamond secured — reach the OUT door.');
  else announce('Reach the vault and hold E at the pedestal.');
}

function onKeyStart() {
  if (input.wasPressed('enter') || input.mouseClicked) {
    if (game.phase === 'title') {
      audio.unlock();
      game.phase = 'playing';
    }
  }
  if (input.wasPressed('r')) {
    const fresh = newGame();
    Object.assign(game, fresh);
    game.phase = 'playing';
    audio.unlock();
  }
  if (input.wasPressed('m')) audio.toggleMute();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  onKeyStart();
  if (game.phase === 'title' && (input.wasPressed('enter') || input.mouseClicked)) {
    game.phase = 'playing';
  }
  update(dt);
  draw(ctx, game, game.now);
  input.endFrame();
  requestAnimationFrame(frame);
}

// A staged shot (?shot=play&seed=1) poses the game before the first frame,
// so a screenshot is a real render of the game, never a mock-up.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const seed = seedFrom(params.get('seed'));
  if (applyShot(game, shot, seed)) {
    // Let the loop run a few frames so cones, smoke and guards settle.
    game.now = 0.6;
    for (const guard of game.guards) {
      updateGuard(guard, 0, game.now, game.thief, game.clouds);
    }
    for (const camera of game.cameras) {
      updateCamera(camera, 0, game.now, game.thief, game.clouds);
    }
  }
}

// A handle for play-testing from the outside (headless Chrome, CDP):
// `window.__velvet.game` is the live game state, nothing more.
window.__velvet = { game };

requestAnimationFrame(frame);
