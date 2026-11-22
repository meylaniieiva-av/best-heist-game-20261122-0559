# The Velvet Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/meylaniieiva-av/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/meylaniieiva-av/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A midnight heist in a museum after closing. Sneak past three patrolling guards and two sweeping cameras, crack the vault, pocket the Velvet Diamond — and get out the service door before the alarm fills. Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network: the game is plain static files under `game/`.

## How to play

- **WASD / arrows** — move. **Shift** — sneak (slower, half as visible).
- **E** — hold beside the diamond pedestal to crack the vault (2.5 s), or walk over side loot to pocket it.
- **1** — smoke bomb (2 charges): a cloud no cone can see through, 6 s.
- **2** — EMP (1 charge): the cameras go dark for 12 s.
- **R** — restart. **M** — mute.

The alarm rises while a guard's cone or a camera's cone holds you in sight, and falls while you stay hidden. At 100% you are caught. Grab the diamond, then reach the **OUT** door on the east wall for a clean getaway — the faster you escape, the bigger the time bonus.

Three ways through the hall: the left gallery of display cases, the open centre aisle under the red carpet, or the right corridor past the cameras. Each route reads differently, and the patrols force you to time your moves.

## Files

- `game/src/config.js` — the floor plan, patrols, cameras, tuning.
- `game/src/world.js` — geometry: collision, line of sight, sight rays.
- `game/src/guards.js` — guard patrols, chases, camera sweeps, detection.
- `game/src/input.js` — keyboard and mouse.
- `game/src/audio.js` — WebAudio sounds, synthesized, no audio files.
- `game/src/render.js` — everything drawn on the canvas.
- `game/src/shots.js` — staged screenshot scenes (`?shot=start|play|alarm|getaway`).
- `game/src/main.js` — the game loop, alarm, tools, vault, getaway.
- `main.ts` — the make.fun entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=gd575amq&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
