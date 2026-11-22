// Vision math: who can see the thief. A watcher sees a point when it is
// inside the cone (range and angle) and the line of sight is not cut by a
// wall. Smoke clouds also block sight. Pure functions, no game state.
function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/** True when (x, y) lies inside the cone from (ox, oy) facing `angle`. */
export function inCone(ox, oy, angle, range, halfAngle, x, y) {
  const dx = x - ox;
  const dy = y - oy;
  const distance = Math.hypot(dx, dy);
  if (distance > range) return false;
  if (distance < 1) return true;
  return Math.abs(angleDifference(Math.atan2(dy, dx), angle)) <= halfAngle;
}

// Segment (x1,y1)-(x2,y2) against an axis-aligned rectangle. Standard
// slab test: returns true when the segment crosses the rect.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.width) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.width - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.height) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.height - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when no wall stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

/** True when the segment passes through any smoke cloud. */
export function blockedBySmoke(x1, y1, x2, y2, clouds) {
  for (const cloud of clouds) {
    if (cloud.remaining <= 0) continue;
    // Distance from the cloud centre to the segment.
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    let t = lengthSq === 0 ? 0 : ((cloud.x - x1) * dx + (cloud.y - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    if (Math.hypot(cloud.x - closestX, cloud.y - closestY) < cloud.radius) return true;
  }
  return false;
}

/**
 * Full vision test: in the cone, line of sight clear, and no smoke in the
 * way. Returns { seen, distance } so callers can scale detection by range.
 */
export function canSee(watcher, angle, range, halfAngle, target, walls, clouds) {
  const distance = Math.hypot(target.x - watcher.x, target.y - watcher.y);
  if (!inCone(watcher.x, watcher.y, angle, range, halfAngle, target.x, target.y)) {
    return { seen: false, distance };
  }
  if (!hasLineOfSight(watcher.x, watcher.y, target.x, target.y, walls)) {
    return { seen: false, distance };
  }
  if (blockedBySmoke(watcher.x, watcher.y, target.x, target.y, clouds)) {
    return { seen: false, distance };
  }
  return { seen: true, distance };
}
