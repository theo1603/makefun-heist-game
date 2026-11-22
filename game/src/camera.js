// Wall-mounted security cameras. A camera sweeps its cone back and forth
// across its arc and never moves. Being in a camera's cone raises the alarm
// directly (cameras do not chase, but they never blink). The world reads
// `seesPlayer` each step and charges the alarm for it.
import { CAMERA } from './config.js';
import { canSee } from './vision.js';

export class SecurityCamera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.phase = 0;
    this.angle = def.baseAngle;
    this.seesPlayer = false;
  }

  update(dt, player, walls, clouds) {
    this.phase += dt * this.speed;
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    const sight = canSee(
      this, this.angle, CAMERA.visionRange, CAMERA.visionHalfAngle, player, walls, clouds,
    );
    this.seesPlayer = sight.seen;
    return sight;
  }
}
