# makefun-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/theo1603/makefun-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/theo1603/makefun-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Meridian Heist** — an original top-down stealth game: cross three
museum rooms past patrolling guards with vision cones and sweeping security
cameras, crack the vault case, steal the Aurora Diamond, and reach the
getaway van before the alarm meter hits 100%. Decoy coins lure guards away,
smoke pellets blind the cones, and sprinting is fast but loud. Pure static
files — no build step, no network, no libraries. Keyboard and mouse.

## Run it

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080 — WASD/arrows move, Shift sprints, E cracks the
# vault case, click/1 throws a decoy coin, right-click/2 drops smoke, P pauses
```

`main.ts` (Node 22, standard library only) hands the game in: it copies
`game/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

## Screenshots

`?shot=start|play|alarm|getaway` stages each scene from the game's own code:

- `1-play.jpg` — mid-heist in the Marble Gallery (the cover)
- `2-title.jpg` — the title screen
- `3-alarm.jpg` — lockdown at 86% alarm in the Vault Hall
- `4-getaway.jpg` — the getaway after the Gilded Vault

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
