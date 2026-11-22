// Tuning and shared constants for The Meridian Heist.
// One place for every number the game balances on: canvas size, speeds,
// vision ranges, alarm rates and the palette the renderer draws with.
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 64;

// Playfield: the room the thief crosses. The HUD bar sits above it.
export const FIELD = { x: 0, y: HUD_HEIGHT, width: CANVAS_WIDTH, height: CANVAS_HEIGHT - HUD_HEIGHT };

export const PLAYER = {
  radius: 12,
  walkSpeed: 175,
  sprintSpeed: 265,
  // How far a sprinting thief is heard; walking is silent.
  sprintNoiseRadius: 135,
  crackSeconds: 1.2,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  chaseSpeed: 158,
  investigateSpeed: 110,
  visionRange: 195,
  // Half-angle of the vision cone, in radians.
  visionHalfAngle: 0.61,
  // Suspicion 0..1: above SUSPICIOUS the guard investigates, at 1 it chases.
  suspiciousAt: 0.45,
  // Suspicion gained per second at point-blank range, scaled by distance.
  detectBase: 0.5,
  detectClose: 1.0,
  detectSprintMultiplier: 1.6,
  decayPerSecond: 0.35,
  // Touching the thief while chasing ends the run.
  catchRadius: 26,
  pauseAtWaypoint: 1.1,
};

export const CAMERA = {
  visionRange: 285,
  visionHalfAngle: 0.49,
  sweepSpeed: 0.55,
  alarmPerSecond: 16,
};

export const ALARM = {
  max: 100,
  guardAlertPerSecond: 22,
  guardSuspiciousPerSecond: 4,
  decayPerSecond: 5,
  // Above this, every guard is drawn toward the thief's last known spot.
  lockdownAt: 70,
};

export const TOOLS = {
  coinsPerLevel: 3,
  smokePerLevel: 2,
  coinThrowRange: 330,
  coinNoiseRadius: 150,
  smokeRadius: 72,
  smokeSeconds: 5,
  vaultCrackNoiseRadius: 230,
};

export const LOOT_VALUE = {
  diamond: 5000,
  painting: 800,
  goldbar: 500,
  gem: 300,
};

export const LEVEL_BONUS = 1000;

// Palette: a night-blueprint museum. Gold is loot, red is danger, cyan is the thief.
export const COLORS = {
  floor: '#101a2e',
  floorAlt: '#0d1526',
  floorLine: '#1a2947',
  wall: '#2a3550',
  wallTop: '#c9a227',
  wallEdge: '#1c2438',
  carpet: '#1d2f52',
  coneGuard: 'rgba(255, 176, 32, 0.20)',
  coneGuardEdge: 'rgba(255, 176, 32, 0.55)',
  coneAlert: 'rgba(255, 64, 64, 0.30)',
  coneCamera: 'rgba(255, 80, 80, 0.16)',
  coneCameraEdge: 'rgba(255, 80, 80, 0.5)',
  guardBody: '#33415e',
  guardHead: '#e8c39e',
  thief: '#0e7490',
  thiefOutline: '#67e8f9',
  loot: '#ffd54a',
  lootGlow: 'rgba(255, 213, 74, 0.35)',
  exit: '#34d399',
  smoke: 'rgba(148, 163, 184, 0.5)',
  hudBg: 'rgba(6, 10, 20, 0.92)',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  alarmLow: '#34d399',
  alarmMid: '#fbbf24',
  alarmHigh: '#ef4444',
};
