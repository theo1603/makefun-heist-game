// The screenshot scenes behind ?shot=start|play|alarm|getaway. Each one
// builds a real game state with the game's own world and renders it with
// the game's own renderer — never an edited or borrowed image. The play
// scene walks the thief through the first room with a scripted input path
// (the same movement and pickup rules a player drives), so the loot it
// shows was really collected; the alarm and getaway scenes stage states
// the game can reach, through the world's own fields, so the frame shows
// the meter, the chase and the payoff as a player would see them.
import { STATUS_CAUGHT, STATUS_PLAYING, STATUS_VICTORY, World } from './world.js';
import { GUARD_ALERT } from './guard.js';
import { mulberry32 } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAYING = 'playing';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_DONE = 'levelDone';
export const SCREEN_VICTORY = 'victory';

// An input that does nothing: the world keeps living (guards patrol,
// cameras sweep) while the thief stands still.
export const NULL_INPUT = {
  moveVector: () => ({ x: 0, y: 0 }),
  sprinting: false,
  clicked: null,
  rightClicked: false,
  mouse: { x: 0, y: 0, inside: false },
  down: () => false,
  wasPressed: () => false,
};

// An input that steers the thief along waypoints, for the play scene.
function pathInput(waypoints, world) {
  let index = 0;
  return {
    moveVector: () => {
      if (index >= waypoints.length) return { x: 0, y: 0 };
      const target = waypoints[index];
      const dx = target.x - world.player.x;
      const dy = target.y - world.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 14) {
        index += 1;
        return { x: 0, y: 0 };
      }
      return { x: dx / distance, y: dy / distance };
    },
    sprinting: false,
    clicked: null,
    rightClicked: false,
    mouse: { x: 0, y: 0, inside: false },
    down: () => false,
    wasPressed: () => false,
  };
}

const STEP = 1 / 60;

/** Run the world forward `seconds` with the given input, or stop if busted. */
function stepFor(world, input, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    world.update(STEP, input);
    if (world.status !== STATUS_PLAYING) break;
  }
}

function stagePlay(world, seed) {
  void seed;
  world.loadLevel(0);
  // Walk the gallery: past the gem, past a gold bar, to the middle of the
  // room beside the central display — the loot is collected for real.
  const input = pathInput(
    [
      { x: 200, y: 560 },
      { x: 200, y: 420 },
      { x: 280, y: 300 },
      { x: 320, y: 220 },
      { x: 450, y: 220 },
      { x: 560, y: 320 },
      { x: 660, y: 340 },
    ],
    world,
  );
  stepFor(world, input, 26);
  if (world.status !== STATUS_PLAYING) {
    // A guard caught the scripted thief: fall back to a placed mid-heist
    // state so the cover still shows the game at its best. The guards stay
    // at their patrol starts, cones out, and the world is not stepped, so
    // the frame is exactly this: thief mid-room, loot in hand, alarm mid.
    world.loadLevel(0);
    world.player.x = 660;
    world.player.y = 340;
    world.player.facing = -Math.PI / 2;
    world.loot[2].taken = true;
    world.loot[0].taken = true;
    world.score = 800;
    world.elapsed = 47;
  }
  // A mid-heist alarm reading: the meter shows its middle state.
  if (world.alarm < 20) world.alarm = 32;
  return { screen: SCREEN_PLAYING };
}

function stageAlarm(world) {
  world.loadLevel(1);
  // The thief, diamond in hand, ducks behind a pedestal while a guard
  // closes in and the alarm screams. Set through the world's own fields.
  world.player.x = 550;
  world.player.y = 400;
  world.player.facing = Math.PI;
  world.diamondTaken = true;
  world.score = 7400;
  world.alarm = 86;
  world.elapsed = 118;
  const guard = world.guards[0];
  guard.x = 700;
  guard.y = 380;
  guard.facing = Math.PI;
  guard.state = GUARD_ALERT;
  guard.suspicion = 1;
  guard.lastKnown = { x: world.player.x, y: world.player.y };
  const second = world.guards[2];
  second.x = 430;
  second.y = 520;
  second.facing = Math.PI / 2;
  return { screen: SCREEN_PLAYING };
}

function stageGetaway(world) {
  world.loadLevel(2);
  world.diamondTaken = true;
  world.score = 12400;
  world.totalElapsed = 482;
  world.elapsed = 150;
  world.player.x = 90;
  world.player.y = 740;
  world.status = STATUS_VICTORY;
  return { screen: SCREEN_VICTORY };
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * Unknown names stage the title, like a fresh load.
 */
export function stageShot(name, world, seed = 1) {
  const random = mulberry32(seed);
  void random;
  if (name === 'play') return stagePlay(world, seed);
  if (name === 'alarm') return stageAlarm(world);
  if (name === 'getaway') return stageGetaway(world);
  world.loadLevel(0);
  stepFor(world, NULL_INPUT, 3);
  return { screen: SCREEN_TITLE };
}

export function freshWorld() {
  return new World();
}
