// The game state and its rules: movement and collision, tools, detection,
// the alarm meter, loot, the vault crack and the getaway. The renderer draws
// this state; the input module feeds it. Nothing here touches the DOM, so
// the whole simulation can run headless for testing.
import { ALARM, CAMERA, FIELD, GUARD, LEVEL_BONUS, LOOT_VALUE, PLAYER, TOOLS } from './config.js';
import { LEVELS, levelCount } from './levels.js';
import { Guard, GUARD_ALERT, GUARD_SUSPICIOUS } from './guard.js';
import { SecurityCamera } from './camera.js';
import { SmokeCloud, ThrownCoin, clampThrow } from './tools.js';
import { playCaught, playCoin, playCrack, playPickup, playSmoke, playWin, setAlarmHum, stopAlarmHum } from './audio.js';

export const STATUS_PLAYING = 'playing';
export const STATUS_CAUGHT = 'caught';
export const STATUS_LEVEL_DONE = 'levelDone';
export const STATUS_VICTORY = 'victory';

function circleHitsWalls(x, y, radius, walls) {
  for (const wall of walls) {
    const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.width));
    const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.height));
    if (Math.hypot(x - closestX, y - closestY) < radius) return true;
  }
  return false;
}

export class World {
  constructor() {
    this.score = 0;
    this.totalElapsed = 0;
    this.levelIndex = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    this.level = def;
    this.player = {
      x: def.player.x,
      y: def.player.y,
      facing: -Math.PI / 2,
      sprinting: false,
      moving: false,
    };
    this.guards = def.guards.map((guardDef) => new Guard(guardDef));
    this.cameras = def.cameras.map((cameraDef) => new SecurityCamera(cameraDef));
    this.loot = def.loot.map((item) => ({ ...item, taken: false }));
    this.coins = [];
    this.clouds = [];
    this.rings = [];
    this.floaters = [];
    this.coinsLeft = TOOLS.coinsPerLevel;
    this.smokeLeft = TOOLS.smokePerLevel;
    this.alarm = 0;
    this.elapsed = 0;
    this.diamondTaken = false;
    this.crackProgress = 0;
    this.status = STATUS_PLAYING;
    this.statusReason = '';
    this.scoreAtLevelStart = this.score;
    this.noiseTimer = 0;
    this.lockdownCalled = false;
    this.cameraSees = false;
    this.levelBonus = 0;
    stopAlarmHum();
  }

  get levelName() {
    return this.level.name;
  }

  get lootTakenCount() {
    return this.loot.filter((item) => item.taken).length;
  }

  get isLastLevel() {
    return this.levelIndex >= levelCount() - 1;
  }

  /** Every guard in earshot turns to investigate the noise. */
  noiseAt(x, y, radius) {
    this.rings.push({ x, y, maxRadius: radius, age: 0 });
    for (const guard of this.guards) {
      if (Math.hypot(guard.x - x, guard.y - y) <= radius) guard.hearNoise(x, y);
    }
  }

  addFloater(x, y, text, color = '#ffd54a') {
    this.floaters.push({ x, y, text, color, age: 0 });
  }

  throwCoin(target) {
    if (this.coinsLeft <= 0 || this.status !== STATUS_PLAYING) return;
    this.coinsLeft -= 1;
    this.coins.push(new ThrownCoin(this.player, clampThrow(this.player, target)));
  }

  dropSmoke() {
    if (this.smokeLeft <= 0 || this.status !== STATUS_PLAYING) return;
    this.smokeLeft -= 1;
    this.clouds.push(new SmokeCloud(this.player.x, this.player.y));
    playSmoke();
  }

  get nearVault() {
    const vault = this.level.vault;
    return !this.diamondTaken && Math.hypot(this.player.x - vault.x, this.player.y - vault.y) < vault.radius + 14;
  }

  get atExit() {
    const exit = this.level.exit;
    return (
      this.player.x > exit.x && this.player.x < exit.x + exit.width &&
      this.player.y > exit.y && this.player.y < exit.y + exit.height
    );
  }

  update(dt, input) {
    if (this.status !== STATUS_PLAYING) {
      this.updateCosmetics(dt);
      return;
    }
    this.elapsed += dt;
    this.totalElapsed += dt;

    // --- Movement: slide along walls, one axis at a time. ---
    const move = input.moveVector();
    const sprinting = input.sprinting && (move.x !== 0 || move.y !== 0);
    this.player.sprinting = sprinting;
    this.player.moving = move.x !== 0 || move.y !== 0;
    const speed = sprinting ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    if (this.player.moving) {
      this.player.facing = Math.atan2(move.y, move.x);
      const nx = this.player.x + move.x * speed * dt;
      const ny = this.player.y + move.y * speed * dt;
      if (!circleHitsWalls(nx, this.player.y, PLAYER.radius, this.level.walls)) this.player.x = nx;
      if (!circleHitsWalls(this.player.x, ny, PLAYER.radius, this.level.walls)) this.player.y = ny;
      this.player.x = Math.max(FIELD.x + PLAYER.radius, Math.min(FIELD.x + FIELD.width - PLAYER.radius, this.player.x));
      this.player.y = Math.max(FIELD.y + PLAYER.radius, Math.min(FIELD.y + FIELD.height - PLAYER.radius, this.player.y));
    }

    // Sprinting is loud: a regular noise pulse while running.
    if (sprinting) {
      this.noiseTimer -= dt;
      if (this.noiseTimer <= 0) {
        this.noiseTimer = 0.45;
        this.noiseAt(this.player.x, this.player.y, PLAYER.sprintNoiseRadius);
      }
    }

    // --- Tools. ---
    if (input.clicked) this.throwCoin(input.clicked);
    if (input.wasPressed('1') && input.mouse.inside) this.throwCoin(input.mouse);
    if (input.rightClicked || input.wasPressed('2')) this.dropSmoke();

    for (const coin of this.coins) {
      const wasLanded = coin.landed;
      coin.update(dt);
      if (coin.landed && !wasLanded) {
        playCoin();
        this.noiseAt(coin.x, coin.y, TOOLS.coinNoiseRadius);
      }
    }
    this.coins = this.coins.filter((coin) => !coin.done);
    for (const cloud of this.clouds) cloud.update(dt);
    this.clouds = this.clouds.filter((cloud) => cloud.alive);

    // --- Detection: cameras, then guards. ---
    this.cameraSees = false;
    let anyAlert = false;
    let anySuspicious = false;
    for (const camera of this.cameras) {
      camera.update(dt, this.player, this.level.walls, this.clouds);
      if (camera.seesPlayer) {
        this.cameraSees = true;
        this.alarm += CAMERA.alarmPerSecond * dt;
      }
    }
    for (const guard of this.guards) {
      guard.update(dt, this.player, this.level.walls, this.clouds, sprinting);
      if (guard.state === GUARD_ALERT) {
        anyAlert = true;
        this.alarm += ALARM.guardAlertPerSecond * dt;
      } else if (guard.state === GUARD_SUSPICIOUS) {
        anySuspicious = true;
        this.alarm += ALARM.guardSuspiciousPerSecond * dt;
      }
      if (guard.catches(this.player)) {
        this.busted('A guard caught you red-handed.');
        return;
      }
    }
    if (!anyAlert && !anySuspicious && !this.cameraSees) {
      this.alarm = Math.max(0, this.alarm - ALARM.decayPerSecond * dt);
    }
    this.alarm = Math.min(ALARM.max, this.alarm);
    setAlarmHum(this.alarm);

    // Lockdown: past 70 alarm, nearby guards converge on the thief.
    if (this.alarm >= ALARM.lockdownAt && !this.lockdownCalled) {
      this.lockdownCalled = true;
      for (const guard of this.guards) {
        if (Math.hypot(guard.x - this.player.x, guard.y - this.player.y) < 420) {
          guard.hearNoise(this.player.x, this.player.y);
        }
      }
      this.addFloater(this.player.x, this.player.y - 30, 'LOCKDOWN!', '#ef4444');
    }
    if (this.alarm >= ALARM.max) {
      this.busted('The alarm hit maximum — the museum locked down.');
      return;
    }

    // --- Loot: side pieces are picked up on touch. ---
    for (const item of this.loot) {
      if (!item.taken && Math.hypot(item.x - this.player.x, item.y - this.player.y) < 26) {
        item.taken = true;
        this.score += LOOT_VALUE[item.kind];
        this.addFloater(item.x, item.y - 18, `+$${LOOT_VALUE[item.kind].toLocaleString('en-US')}`);
        playPickup();
      }
    }

    // --- The vault: hold E to crack the case. Loud when it pops. ---
    if (this.nearVault) {
      if (input.down('e')) {
        this.crackProgress += dt / PLAYER.crackSeconds;
        if (this.crackProgress >= 1) {
          this.diamondTaken = true;
          this.score += LOOT_VALUE.diamond;
          this.addFloater(this.level.vault.x, this.level.vault.y - 40, 'AURORA DIAMOND +$5,000');
          playCrack();
          this.noiseAt(this.level.vault.x, this.level.vault.y, TOOLS.vaultCrackNoiseRadius);
        }
      } else {
        this.crackProgress = Math.max(0, this.crackProgress - dt * 2);
      }
    } else {
      this.crackProgress = 0;
    }

    // --- The getaway: the van only leaves with the diamond aboard. ---
    if (this.diamondTaken && this.atExit) {
      const timeBonus = Math.max(0, Math.round((240 - this.elapsed) * 5));
      this.levelBonus = LEVEL_BONUS + timeBonus;
      this.score += this.levelBonus;
      playWin();
      stopAlarmHum();
      this.status = this.isLastLevel ? STATUS_VICTORY : STATUS_LEVEL_DONE;
    }

    this.updateCosmetics(dt);
  }

  updateCosmetics(dt) {
    for (const ring of this.rings) ring.age += dt;
    this.rings = this.rings.filter((ring) => ring.age < 0.9);
    for (const floater of this.floaters) floater.age += dt;
    this.floaters = this.floaters.filter((floater) => floater.age < 1.6);
  }

  busted(reason) {
    this.status = STATUS_CAUGHT;
    this.statusReason = reason;
    stopAlarmHum();
    playCaught();
  }

  /** Retry the level: the score rewinds to where the level started. */
  retryLevel() {
    this.score = this.scoreAtLevelStart;
    this.loadLevel(this.levelIndex);
  }

  nextLevel() {
    if (this.isLastLevel) return;
    this.loadLevel(this.levelIndex + 1);
  }
}
