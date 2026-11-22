// Guard patrol AI. A guard walks its waypoint loop, pauses to look around,
// and reacts to what it sees and hears:
//   patrol -> suspicious (a glimpse, or a noise) -> alert (a clear sighting)
// Suspicion builds while the thief is in the cone and fades when hidden.
// An alert guard chases the thief's last known position; touching the thief
// while alert ends the run. The world owns the alarm; the guard only reports.
import { GUARD } from './config.js';
import { canSee } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_ALERT = 'alert';

function moveToward(guard, target, speed, dt, walls) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  const nx = guard.x + (dx / distance) * step;
  const ny = guard.y + (dy / distance) * step;
  // Guards slide along walls: try each axis separately.
  if (!hitsWall(nx, guard.y, walls)) guard.x = nx;
  if (!hitsWall(guard.x, ny, walls)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return distance <= step + 0.5;
}

function hitsWall(x, y, walls) {
  const r = GUARD.radius;
  for (const wall of walls) {
    if (x + r > wall.x && x - r < wall.x + wall.width && y + r > wall.y && y - r < wall.y + wall.height) {
      return true;
    }
  }
  return false;
}

export class Guard {
  constructor(def) {
    this.path = def.path.map(([x, y]) => ({ x, y }));
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.waypoint = 1 % this.path.length;
    this.pauseFor = def.pause ?? GUARD.pauseAtWaypoint;
    this.pauseLeft = 0;
    this.facing = Math.atan2(
      this.path[this.waypoint].y - this.y,
      this.path[this.waypoint].x - this.x,
    );
    this.state = GUARD_PATROL;
    this.suspicion = 0;
    this.investigate = null;
    this.lastKnown = null;
    this.lookTimer = 0;
    this.searchLeft = 0;
  }

  /** A noise at (x, y): turn suspicious and go look, unless already alert. */
  hearNoise(x, y) {
    if (this.state === GUARD_ALERT) return;
    this.state = GUARD_SUSPICIOUS;
    this.investigate = { x, y };
    this.suspicion = Math.max(this.suspicion, GUARD.suspiciousAt);
    this.searchLeft = 4;
  }

  update(dt, player, walls, clouds, sprinting) {
    const sight = canSee(
      this, this.facing, GUARD.visionRange, GUARD.visionHalfAngle, player, walls, clouds,
    );
    if (sight.seen) {
      const closeness = 1 - sight.distance / GUARD.visionRange;
      let rate = GUARD.detectBase + GUARD.detectClose * closeness;
      if (sprinting) rate *= GUARD.detectSprintMultiplier;
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      this.lastKnown = { x: player.x, y: player.y };
    } else {
      this.suspicion = Math.max(0, this.suspicion - GUARD.decayPerSecond * dt);
    }

    if (this.suspicion >= 1) {
      this.state = GUARD_ALERT;
    } else if (this.state === GUARD_ALERT && this.suspicion < GUARD.suspiciousAt) {
      // Lost the thief: fall back to searching the last known spot.
      this.state = GUARD_SUSPICIOUS;
      this.investigate = this.lastKnown ? { ...this.lastKnown } : null;
      this.searchLeft = 4;
    } else if (this.state === GUARD_PATROL && this.suspicion >= GUARD.suspiciousAt) {
      this.state = GUARD_SUSPICIOUS;
      this.investigate = this.lastKnown ? { ...this.lastKnown } : { x: this.x, y: this.y };
      this.searchLeft = 4;
    }

    if (this.state === GUARD_ALERT) {
      const target = sight.seen ? player : this.lastKnown;
      if (target) moveToward(this, target, GUARD.chaseSpeed, dt, walls);
      return;
    }

    if (this.state === GUARD_SUSPICIOUS) {
      if (this.investigate) {
        const arrived = moveToward(this, this.investigate, GUARD.investigateSpeed, dt, walls);
        if (arrived) {
          // Look around for a moment, then give up and resume the patrol.
          this.lookTimer += dt;
          this.facing += dt * 1.8;
          this.searchLeft -= dt;
          if (this.searchLeft <= 0) {
            this.state = GUARD_PATROL;
            this.investigate = null;
            this.suspicion = 0;
          }
        }
      } else {
        this.state = GUARD_PATROL;
      }
      return;
    }

    // Patrol: walk the loop, pausing at each waypoint to scan.
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      this.facing += Math.sin(this.lookTimer * 2) * dt * 0.9;
      this.lookTimer += dt;
      return;
    }
    const target = this.path[this.waypoint];
    if (moveToward(this, target, GUARD.patrolSpeed, dt, walls)) {
      this.waypoint = (this.waypoint + 1) % this.path.length;
      this.pauseLeft = this.pauseFor;
    }
  }

  /** True when the guard has the thief in hand: alert and touching. */
  catches(player) {
    return this.state === GUARD_ALERT && Math.hypot(player.x - this.x, player.y - this.y) < GUARD.catchRadius;
  }
}
