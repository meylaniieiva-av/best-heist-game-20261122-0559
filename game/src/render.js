// The Velvet Vault — everything the player sees, drawn on one canvas:
// the marble hall, the carpet, the cases, the sweeping cones, the thief,
// the smoke, and the HUD. One clear job: draw the game.
import { TILE, COLS, ROWS, HUD_H, VIEW_W, VIEW_H, MAP, TUNING } from './config.js';
import { tileAt, tileCenter, castRay } from './world.js';

const GOLD = '#d8a94e';
const VELVET = '#7e1f2e';
const FLOOR_A = '#232a3d';
const FLOOR_B = '#202638';
const WALL = '#10141f';
const WALL_TOP = '#2c3550';

// Build a vision cone as a fan of short rays: the polygon stops at walls,
// so a cone visibly dies behind a case instead of shining through it.
function conePolygon(x, y, angle, range, halfAngle) {
  const rays = 26;
  const pts = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(x, y, a, range);
    pts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return pts;
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  const pts = conePolygon(x, y, angle, range, halfAngle);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, time) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      const t = tileAt(col, row);
      if (t === '#') {
        ctx.fillStyle = WALL;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(x, y, TILE, 5);
        continue;
      }
      ctx.fillStyle = (col + row) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(x, y, TILE, TILE);
      // A faint marble vein on every other tile.
      if ((col * 7 + row * 13) % 5 === 0) {
        ctx.strokeStyle = 'rgba(216,169,78,0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + TILE - 8);
        ctx.lineTo(x + TILE - 10, y + 10);
        ctx.stroke();
      }
      // The velvet carpet runs down the centre aisle to the vault.
      if ((col === 15 || col === 16) && row >= 3 && row <= 16) {
        ctx.fillStyle = 'rgba(126,31,46,0.55)';
        ctx.fillRect(x + 4, y, TILE - 8, TILE);
        ctx.fillStyle = 'rgba(216,169,78,0.5)';
        ctx.fillRect(x + 4, y, 2, TILE);
        ctx.fillRect(x + TILE - 6, y, 2, TILE);
      }
      void time;
    }
  }
}

function drawCasesAndVault(ctx, time, diamondTaken, crackProgress) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      const x = col * TILE;
      const y = HUD_H + row * TILE;
      if (t === 'C') {
        ctx.fillStyle = '#31435c';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = 'rgba(140,200,230,0.25)';
        ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 4.5, y + 4.5, TILE - 9, TILE - 9);
        // A glint inside the case.
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x + 10, y + 10, 5, 5);
      } else if (t === 'V') {
        ctx.fillStyle = '#3a2f22';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3.5, y + 3.5, TILE - 7, TILE - 7);
      } else if (t === 'D') {
        // The pedestal under the Velvet Diamond.
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(x + 8, y + 12, TILE - 16, TILE - 12);
        ctx.fillStyle = '#6b5d49';
        ctx.fillRect(x + 6, y + 8, TILE - 12, 8);
        if (!diamondTaken) {
          const pulse = 0.7 + 0.3 * Math.sin(time * 3);
          const cx = x + TILE / 2;
          const cy = y + 2;
          const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
          glow.addColorStop(0, `rgba(120,220,255,${0.55 * pulse})`);
          glow.addColorStop(1, 'rgba(120,220,255,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(cx - 26, cy - 26, 52, 52);
          // The diamond itself: a small faceted gem.
          ctx.fillStyle = '#9be8ff';
          ctx.beginPath();
          ctx.moveTo(cx - 9, cy - 2);
          ctx.lineTo(cx, cy - 11);
          ctx.lineTo(cx + 9, cy - 2);
          ctx.lineTo(cx, cy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#e8fbff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 9, cy - 2);
          ctx.lineTo(cx + 9, cy - 2);
          ctx.moveTo(cx, cy - 11);
          ctx.lineTo(cx, cy + 8);
          ctx.stroke();
          // Crack progress ring while the thief works the vault.
          if (crackProgress > 0) {
            ctx.strokeStyle = GOLD;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 20, -Math.PI / 2, -Math.PI / 2 + crackProgress * Math.PI * 2);
            ctx.stroke();
          }
        }
      } else if (t === 'E') {
        ctx.fillStyle = '#1b2b1b';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#7ec98f';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IN', x + TILE / 2, y + TILE / 2 + 4);
      } else if (t === 'X') {
        ctx.fillStyle = '#2b1b1b';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#ff9d5c';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OUT', x + TILE / 2, y + TILE / 2 + 4);
      }
    }
  }
}

function drawLoot(ctx, time, loot) {
  for (const item of loot) {
    if (item.taken) continue;
    const p = tileCenter(item.col, item.row);
    const bob = Math.sin(time * 2 + item.col) * 2;
    const glow = ctx.createRadialGradient(p.x, p.y + bob, 2, p.x, p.y + bob, 24);
    glow.addColorStop(0, 'rgba(255,214,110,0.5)');
    glow.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 24, p.y + bob - 24, 48, 48);
    ctx.fillStyle = '#ffd66e';
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a1f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#8a6a1f';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', p.x, p.y + bob + 3);
  }
}

function drawGuard(ctx, guard) {
  // The cone first, so the body sits on top of it.
  const fill = guard.alerted
    ? 'rgba(255,80,60,0.20)'
    : 'rgba(255,214,110,0.15)';
  const edge = guard.alerted ? 'rgba(255,80,60,0.5)' : 'rgba(255,214,110,0.4)';
  drawCone(ctx, guard.x, guard.y, guard.angle, guard.range, guard.halfAngle, fill, edge);
  // Body: a navy uniform with a cap, facing its patrol direction.
  ctx.fillStyle = '#2e3d5c';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, TUNING.guardRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8fa3c8';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = guard.x + Math.cos(guard.angle) * 10;
  const fy = guard.y + Math.sin(guard.angle) * 10;
  ctx.fillStyle = '#dfe8ff';
  ctx.beginPath();
  ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.alerted ? '#ff5040' : '#ffd66e';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.alerted ? '!' : guard.name[0], guard.x, guard.y - 19);
}

function drawCamera(ctx, camera, now) {
  const disabled = now < camera.disabledUntil;
  const fill = disabled ? 'rgba(120,120,120,0.10)' : 'rgba(255,70,70,0.16)';
  const edge = disabled ? 'rgba(150,150,150,0.4)' : 'rgba(255,70,70,0.45)';
  if (!disabled) {
    drawCone(ctx, camera.x, camera.y, camera.angle, camera.range, camera.halfAngle, fill, edge);
  }
  // The mount: a small dark box on the wall, its lens pointing down the cone.
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(camera.x - 9, camera.y - 9, 18, 18);
  ctx.strokeStyle = disabled ? '#777' : '#ff5a5a';
  ctx.lineWidth = 2;
  ctx.strokeRect(camera.x - 9.5, camera.y - 9.5, 19, 19);
  const lx = camera.x + Math.cos(camera.angle) * 12;
  const ly = camera.y + Math.sin(camera.angle) * 12;
  ctx.fillStyle = disabled ? '#666' : '#ff2e2e';
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (disabled) {
    ctx.fillStyle = '#bbb';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFF', camera.x, camera.y - 14);
  }
}

function drawSmoke(ctx, clouds) {
  for (const c of clouds) {
    const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.radius);
    g.addColorStop(0, 'rgba(200,205,215,0.75)');
    g.addColorStop(1, 'rgba(200,205,215,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, thief, time) {
  const bob = thief.moving ? Math.sin(time * 12) * 1.5 : 0;
  // A soft shadow under the thief.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 11, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Black coat, pale mask stripe, facing the last move direction.
  ctx.fillStyle = '#0d0d12';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y + bob, TUNING.thiefRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = thief.x + Math.cos(thief.angle) * 7;
  const fy = thief.y + Math.sin(thief.angle) * 7 + bob;
  ctx.fillStyle = '#f2f2f7';
  ctx.fillRect(fx - 6, fy - 2.5, 12, 5);
  if (thief.sneaking) {
    ctx.fillStyle = '#9fb4d8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', thief.x, thief.y - 20);
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0b0e16';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f0e6cf';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('THE VELVET VAULT', 18, 30);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('a midnight heist · grab the diamond · reach the OUT door', 18, 52);

  // Alarm meter.
  const mx = 470;
  const mw = 260;
  ctx.fillStyle = '#8fa3c8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', mx, 24);
  ctx.fillStyle = '#1a2132';
  ctx.fillRect(mx, 32, mw, 16);
  const alarm = Math.max(0, Math.min(100, state.alarm));
  const ac = alarm < 40 ? '#7ec98f' : alarm < 75 ? '#ffb347' : '#ff5040';
  ctx.fillStyle = ac;
  ctx.fillRect(mx, 32, (mw * alarm) / 100, 16);
  ctx.strokeStyle = '#5a6a8a';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 0.5, 32.5, mw, 16);
  if (alarm >= 75) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('THEY SEE YOU — break line of sight!', mx, 66);
  }

  // Loot, tools, timer.
  ctx.fillStyle = '#f0e6cf';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◆ ${state.score} pts`, 790, 32);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`loot ${state.lootTaken}/${state.lootTotal} · smoke ${state.smoke} [1] · EMP ${state.emp} [2]`, 790, 52);

  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60).toString().padStart(2, '0');
  ctx.fillStyle = '#f0e6cf';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${secs}`, VIEW_W - 18, 32);
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(state.objective, VIEW_W - 18, 52);
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5,7,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 300);
  ctx.fillStyle = '#f0e6cf';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 350 + i * 28);
  });
  ctx.fillStyle = '#8fa3c8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Press R to run it again · Enter to start', VIEW_W / 2, 350 + lines.length * 28 + 18);
}

export function draw(ctx, game, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, time);
  drawLoot(ctx, time, game.loot);
  drawCasesAndVault(ctx, time, game.diamondTaken, game.crackProgress);
  for (const camera of game.cameras) drawCamera(ctx, camera, game.now);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawSmoke(ctx, game.clouds);
  if (game.phase === 'playing' || game.phase === 'caught' || game.phase === 'escaped') {
    drawThief(ctx, game.thief, time);
  }
  drawHud(ctx, {
    alarm: game.alarm,
    score: game.score,
    lootTaken: game.loot.filter((l) => l.taken).length,
    lootTotal: game.loot.length,
    smoke: game.smokeCharges,
    emp: game.empCharges,
    elapsed: game.elapsed,
    objective: game.diamondTaken
      ? 'Diamond secured — get to the OUT door!'
      : 'Reach the vault — hold E at the pedestal',
  });

  if (game.phase === 'title') {
    drawOverlay(ctx, 'THE VELVET VAULT', [
      'A museum after midnight. Three guards, two cameras, one diamond.',
      'WASD / arrows to move · Shift to sneak · E to crack the vault',
      '1 smoke bomb · 2 EMP — stay out of the cones, or the alarm fills.',
    ], GOLD);
  } else if (game.phase === 'caught') {
    drawOverlay(ctx, 'BUSTED', [
      `The alarm hit 100% — the guards have you, ${game.score} points banked.`,
      `Time in the hall: ${Math.floor(game.elapsed)}s · loot taken: ${game.loot.filter((l) => l.taken).length}`,
    ], '#ff5040');
  } else if (game.phase === 'escaped') {
    drawOverlay(ctx, 'CLEAN GETAWAY', [
      `The Velvet Diamond is yours — ${game.score} points in ${Math.floor(game.elapsed)}s.`,
      'The night guard will find an empty pedestal at dawn.',
    ], '#7ec98f');
  }
}
