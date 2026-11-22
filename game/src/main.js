// Boot and the game loop. Owns the screen state machine (title, playing,
// paused, caught, level done, victory), steps the world, and hands each
// frame to the renderer. With ?shot=<name> in the URL it stages one of the
// screenshot scenes instead of the title screen.
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { STATUS_CAUGHT, STATUS_LEVEL_DONE, STATUS_PLAYING, STATUS_VICTORY, World } from './world.js';
import { Input } from './input.js';
import { unlockAudio } from './audio.js';
import {
  drawCaughtScreen,
  drawGame,
  drawLevelDoneScreen,
  drawPausedScreen,
  drawTitleScreen,
  drawVictoryScreen,
} from './render.js';
import {
  NULL_INPUT,
  SCREEN_CAUGHT,
  SCREEN_LEVEL_DONE,
  SCREEN_PAUSED,
  SCREEN_PLAYING,
  SCREEN_TITLE,
  SCREEN_VICTORY,
  stageShot,
} from './shots.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

let world = new World();
let screen = SCREEN_TITLE;
if (shotName) {
  const staged = stageShot(shotName, world, seed);
  screen = staged.screen;
}

const input = new Input(canvas);
let lastTime = performance.now();
let time = 0;

function syncScreenWithWorld() {
  if (world.status === STATUS_CAUGHT && screen === SCREEN_PLAYING) screen = SCREEN_CAUGHT;
  if (world.status === STATUS_LEVEL_DONE && screen === SCREEN_PLAYING) screen = SCREEN_LEVEL_DONE;
  if (world.status === STATUS_VICTORY && screen === SCREEN_PLAYING) screen = SCREEN_VICTORY;
}

function handleKeys() {
  if (input.wasPressed('enter')) {
    unlockAudio();
    if (screen === SCREEN_TITLE) screen = SCREEN_PLAYING;
    else if (screen === SCREEN_LEVEL_DONE) {
      world.nextLevel();
      screen = SCREEN_PLAYING;
    }
  }
  if (input.wasPressed('p')) {
    if (screen === SCREEN_PLAYING) screen = SCREEN_PAUSED;
    else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAYING;
  }
  if (input.wasPressed('r')) {
    if (screen === SCREEN_CAUGHT) {
      world.retryLevel();
      screen = SCREEN_PLAYING;
    } else if (screen === SCREEN_VICTORY) {
      world = new World();
      screen = SCREEN_TITLE;
    }
  }
  if (input.wasPressed(' ') || input.clicked) unlockAudio();
}

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  time += dt;

  handleKeys();
  if (shotName) {
    // A staged screenshot scene stays exactly as staged: the frame the
    // screenshot takes is the frame stageShot built. The renderer still
    // animates (sparkles, pulses) from the clock.
  } else if (screen === SCREEN_PLAYING) {
    world.update(dt, input);
  } else if (screen === SCREEN_TITLE) {
    // The title shows the room alive behind it: guards on patrol.
    world.update(dt, NULL_INPUT);
    if (world.status !== STATUS_PLAYING) world.loadLevel(world.levelIndex);
  }
  syncScreenWithWorld();

  if (screen === SCREEN_TITLE) drawTitleScreen(ctx, world, time);
  else if (screen === SCREEN_PAUSED) drawPausedScreen(ctx, world, time);
  else if (screen === SCREEN_CAUGHT) drawCaughtScreen(ctx, world);
  else if (screen === SCREEN_LEVEL_DONE) drawLevelDoneScreen(ctx, world);
  else if (screen === SCREEN_VICTORY) drawVictoryScreen(ctx, world);
  else drawGame(ctx, world, time);

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
