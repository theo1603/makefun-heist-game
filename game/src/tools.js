// The thief's tools, both bought with a limited count per level:
//   - Decoy coin: thrown at a clicked point. It lands with a clink and a
//     noise ring; guards in earshot go to investigate the landing spot.
//   - Smoke pellet: bursts at the thief's feet into a cloud that blocks
//     every vision cone for a few seconds, for a dash across open floor.
// The world owns the counts; this module owns the thrown things and clouds.
import { TOOLS } from './config.js';

export class ThrownCoin {
  constructor(from, target) {
    this.x = from.x;
    this.y = from.y;
    this.startX = from.x;
    this.startY = from.y;
    this.targetX = target.x;
    this.targetY = target.y;
    this.flight = 0;
    this.flightSeconds = 0.45;
    this.landed = false;
    this.ringAge = 0;
  }

  update(dt) {
    if (!this.landed) {
      this.flight += dt / this.flightSeconds;
      if (this.flight >= 1) {
        this.flight = 1;
        this.landed = true;
        this.x = this.targetX;
        this.y = this.targetY;
      } else {
        this.x = this.startX + (this.targetX - this.startX) * this.flight;
        this.y = this.startY + (this.targetY - this.startY) * this.flight;
      }
    } else {
      this.ringAge += dt;
    }
  }

  get done() {
    return this.landed && this.ringAge > 1.2;
  }
}

export class SmokeCloud {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = TOOLS.smokeRadius;
    this.remaining = TOOLS.smokeSeconds;
    this.total = TOOLS.smokeSeconds;
  }

  update(dt) {
    this.remaining = Math.max(0, this.remaining - dt);
  }

  get alive() {
    return this.remaining > 0;
  }

  covers(point) {
    return this.alive && Math.hypot(point.x - this.x, point.y - this.y) < this.radius;
  }
}

/** Clamp a throw target to the coin's range from the thrower. */
export function clampThrow(from, target) {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= TOOLS.coinThrowRange) return { x: target.x, y: target.y };
  const scale = TOOLS.coinThrowRange / distance;
  return { x: from.x + dx * scale, y: from.y + dy * scale };
}
