// The three rooms of the Meridian Museum, hardest last. Each level is data:
// walls (cover that blocks movement and sight), guard patrols, sweeping
// cameras, side loot, the vault case holding the Aurora Diamond, and the
// getaway door. The engine in world.js reads this and nothing else.
export const LEVELS = [
  {
    name: 'Level 1 — The Marble Gallery',
    subtitle: 'Two guards, one camera. Learn the cones.',
    player: { x: 190, y: 690 },
    exit: { x: 24, y: 700, width: 150, height: 84 },
    vault: { x: 1088, y: 150, radius: 46 },
    walls: [
      { x: 560, y: 380, width: 160, height: 120, label: 'display' },
      { x: 300, y: 300, width: 90, height: 90, label: 'pedestal' },
      { x: 880, y: 420, width: 90, height: 90, label: 'pedestal' },
      { x: 240, y: 140, width: 200, height: 40, label: 'case' },
      { x: 980, y: 620, width: 140, height: 60, label: 'planter' },
      { x: 420, y: 560, width: 60, height: 60, label: 'column' },
      { x: 760, y: 240, width: 60, height: 60, label: 'column' },
    ],
    guards: [
      { path: [[420, 210], [900, 210], [900, 320], [420, 320]], pause: 1.1 },
      { path: [[300, 640], [700, 640], [700, 520], [300, 520]], pause: 1.1 },
    ],
    cameras: [
      { x: 640, y: 74, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55 },
    ],
    loot: [
      { x: 320, y: 220, kind: 'goldbar' },
      { x: 1050, y: 560, kind: 'painting' },
      { x: 200, y: 420, kind: 'gem' },
      { x: 700, y: 700, kind: 'goldbar' },
      { x: 950, y: 260, kind: 'gem' },
    ],
  },
  {
    name: 'Level 2 — The Vault Hall',
    subtitle: 'Three guards, two cameras. Mind the crossfire.',
    player: { x: 190, y: 690 },
    exit: { x: 24, y: 700, width: 150, height: 84 },
    vault: { x: 1088, y: 150, radius: 46 },
    walls: [
      { x: 300, y: 200, width: 60, height: 120, label: 'case' },
      { x: 620, y: 420, width: 60, height: 120, label: 'case' },
      { x: 900, y: 160, width: 60, height: 260, label: 'case' },
      { x: 420, y: 620, width: 220, height: 50, label: 'display' },
      { x: 760, y: 140, width: 220, height: 50, label: 'display' },
      { x: 480, y: 300, width: 140, height: 60, label: 'pedestal' },
      { x: 820, y: 520, width: 140, height: 60, label: 'pedestal' },
      { x: 180, y: 420, width: 60, height: 60, label: 'column' },
    ],
    guards: [
      { path: [[220, 160], [700, 160], [700, 360], [220, 360]], pause: 0.9 },
      { path: [[1020, 300], [1020, 640], [800, 640], [800, 300]], pause: 0.9 },
      { path: [[400, 580], [700, 580], [700, 720], [400, 720]], pause: 1.2 },
    ],
    cameras: [
      { x: 400, y: 74, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.6 },
      { x: 1060, y: 74, baseAngle: Math.PI / 2, sweep: 0.8, speed: 0.45 },
    ],
    loot: [
      { x: 200, y: 160, kind: 'painting' },
      { x: 560, y: 220, kind: 'goldbar' },
      { x: 1140, y: 480, kind: 'gem' },
      { x: 700, y: 560, kind: 'goldbar' },
      { x: 300, y: 700, kind: 'gem' },
      { x: 1000, y: 700, kind: 'painting' },
    ],
  },
  {
    name: 'Level 3 — The Gilded Vault',
    subtitle: 'Four guards, three cameras. One clean run.',
    player: { x: 190, y: 690 },
    exit: { x: 24, y: 700, width: 150, height: 84 },
    vault: { x: 1088, y: 150, radius: 46 },
    walls: [
      { x: 240, y: 160, width: 180, height: 44, label: 'case' },
      { x: 700, y: 160, width: 180, height: 44, label: 'case' },
      { x: 440, y: 340, width: 60, height: 180, label: 'case' },
      { x: 820, y: 300, width: 60, height: 220, label: 'case' },
      { x: 560, y: 420, width: 160, height: 60, label: 'display' },
      { x: 240, y: 560, width: 200, height: 44, label: 'case' },
      { x: 880, y: 560, width: 200, height: 44, label: 'case' },
      { x: 1060, y: 380, width: 60, height: 120, label: 'column' },
      { x: 180, y: 320, width: 60, height: 60, label: 'column' },
    ],
    guards: [
      { path: [[300, 260], [640, 260], [640, 320], [300, 320]], pause: 0.8 },
      { path: [[960, 260], [1180, 260], [1180, 540], [960, 540]], pause: 0.8 },
      { path: [[220, 640], [560, 640], [560, 740], [220, 740]], pause: 1.0 },
      { path: [[700, 620], [1040, 620], [1040, 720], [700, 720]], pause: 1.0 },
    ],
    cameras: [
      { x: 320, y: 74, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.65 },
      { x: 640, y: 74, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.5 },
      { x: 1000, y: 74, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.6 },
    ],
    loot: [
      { x: 180, y: 200, kind: 'gem' },
      { x: 520, y: 240, kind: 'goldbar' },
      { x: 1150, y: 240, kind: 'painting' },
      { x: 640, y: 510, kind: 'goldbar' },
      { x: 320, y: 640, kind: 'gem' },
      { x: 980, y: 700, kind: 'painting' },
      { x: 700, y: 740, kind: 'gem' },
    ],
  },
];

export function levelCount() {
  return LEVELS.length;
}
