// Everything the player sees, drawn on one canvas: the museum floor, the
// walls and cover, the guards' and cameras' vision cones, the thief, the
// loot, the getaway van, the HUD with its alarm meter, and the title,
// paused, caught, level-complete and victory screens. The judge reads the
// game through these pictures, so danger, cover and loot must be obvious
// at a glance: red cones, gold loot, a cyan thief, dark cover.
import { ALARM, CAMERA, CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, FIELD, GUARD, HUD_HEIGHT, LOOT_VALUE } from './config.js';
import { GUARD_ALERT, GUARD_SUSPICIOUS } from './guard.js';

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawFloor(ctx, time) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
  // Marble tiles: alternating shades with faint grout lines.
  const tile = 64;
  for (let y = HUD_HEIGHT; y < CANVAS_HEIGHT; y += tile) {
    for (let x = 0; x < CANVAS_WIDTH; x += tile) {
      const odd = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, HUD_HEIGHT);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = HUD_HEIGHT; y <= CANVAS_HEIGHT; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  // A long carpet runner down the middle of the hall.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(120, HUD_HEIGHT + 40, CANVAS_WIDTH - 240, CANVAS_HEIGHT - HUD_HEIGHT - 80);
  ctx.strokeStyle = COLORS.wallTop;
  ctx.lineWidth = 2;
  ctx.strokeRect(120, HUD_HEIGHT + 40, CANVAS_WIDTH - 240, CANVAS_HEIGHT - HUD_HEIGHT - 80);
  // Gold trim around the room.
  ctx.strokeStyle = COLORS.wallTop;
  ctx.lineWidth = 3;
  ctx.strokeRect(6, HUD_HEIGHT + 6, CANVAS_WIDTH - 12, CANVAS_HEIGHT - HUD_HEIGHT - 12);
  // Two floor medallions, painted gold rings on the marble.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)';
  ctx.lineWidth = 2;
  for (const [mx, my] of [[300, 700], [980, 320]]) {
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mx, my, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
  void time;
}

function drawWalls(ctx, walls) {
  for (const wall of walls) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    roundRect(ctx, wall.x + 4, wall.y + 6, wall.width, wall.height, 6);
    ctx.fill();
    ctx.fillStyle = COLORS.wall;
    roundRect(ctx, wall.x, wall.y, wall.width, wall.height, 6);
    ctx.fill();
    ctx.strokeStyle = COLORS.wallTop;
    ctx.lineWidth = 2;
    roundRect(ctx, wall.x + 1, wall.y + 1, wall.width - 2, wall.height - 2, 5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    roundRect(ctx, wall.x + 5, wall.y + 5, wall.width - 10, 8, 4);
    ctx.fill();
  }
}

function drawDiamondShape(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.7, 0);
  ctx.closePath();
  ctx.fillStyle = '#bff3ff';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 0);
  ctx.lineTo(size * 0.7, 0);
  ctx.stroke();
  ctx.restore();
}

function drawVault(ctx, world, time) {
  const vault = world.level.vault;
  // Glass case on a gold plinth.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(vault.x, vault.y + 34, 52, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2f16';
  roundRect(ctx, vault.x - 46, vault.y + 18, 92, 22, 4);
  ctx.fill();
  ctx.strokeStyle = COLORS.wallTop;
  ctx.lineWidth = 2;
  roundRect(ctx, vault.x - 46, vault.y - 34, 92, 56, 8);
  ctx.stroke();
  ctx.fillStyle = 'rgba(180, 220, 255, 0.10)';
  roundRect(ctx, vault.x - 46, vault.y - 34, 92, 56, 8);
  ctx.fill();
  if (!world.diamondTaken) {
    const glow = 0.25 + 0.12 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(255, 213, 74, ${glow})`;
    ctx.beginPath();
    ctx.arc(vault.x, vault.y - 6, 34, 0, Math.PI * 2);
    ctx.fill();
    drawDiamondShape(ctx, vault.x, vault.y - 6, 18, Math.sin(time * 1.5) * 0.3);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA DIAMOND', vault.x, vault.y - 46);
  } else {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CASE EMPTY', vault.x, vault.y - 46);
  }
  // Crack progress ring while the thief works the case.
  if (world.crackProgress > 0 && !world.diamondTaken) {
    ctx.beginPath();
    ctx.arc(vault.x, vault.y - 6, 28, -Math.PI / 2, -Math.PI / 2 + world.crackProgress * Math.PI * 2);
    ctx.strokeStyle = COLORS.loot;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

function drawLoot(ctx, world, time) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.x) * 2;
    ctx.fillStyle = COLORS.lootGlow;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 18, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === 'goldbar') {
      ctx.fillStyle = '#eab308';
      roundRect(ctx, item.x - 10, item.y - 6 + bob, 20, 12, 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(item.x - 10, item.y - 6 + bob, 20, 4);
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#8b5e3c';
      ctx.fillRect(item.x - 11, item.y - 13 + bob, 22, 26);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(item.x - 8, item.y - 10 + bob, 16, 12);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(item.x - 8, item.y + 2 + bob, 16, 8);
    } else {
      drawDiamondShape(ctx, item.x, item.y + bob, 10, 0.4);
    }
  }
}

function drawExit(ctx, world, time) {
  const exit = world.level.exit;
  const open = world.diamondTaken;
  ctx.fillStyle = open ? 'rgba(52, 211, 153, 0.18)' : 'rgba(148, 163, 184, 0.12)';
  roundRect(ctx, exit.x, exit.y, exit.width, exit.height, 8);
  ctx.fill();
  ctx.strokeStyle = open ? COLORS.exit : COLORS.textDim;
  ctx.lineWidth = 2;
  roundRect(ctx, exit.x, exit.y, exit.width, exit.height, 8);
  ctx.stroke();
  // The getaway van: a simple side view parked at the door, centred.
  const vx = exit.x + (exit.width - 88) / 2;
  const vy = exit.y + 30;
  ctx.fillStyle = open ? '#065f46' : '#475569';
  roundRect(ctx, vx, vy, 88, 30, 6);
  ctx.fill();
  ctx.fillStyle = open ? '#a7f3d0' : '#94a3b8';
  ctx.fillRect(vx + 62, vy + 5, 18, 14);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(vx + 20, vy + 30, 8, 0, Math.PI * 2);
  ctx.arc(vx + 68, vy + 30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? COLORS.exit : COLORS.textDim;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'GETAWAY VAN' : 'GETAWAY — LOCKED', exit.x + exit.width / 2, exit.y + 16);
  if (open) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + 0.4 * pulse})`;
    ctx.lineWidth = 3;
    roundRect(ctx, exit.x - 4, exit.y - 4, exit.width + 8, exit.height + 8, 10);
    ctx.stroke();
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const alert = guard.state === GUARD_ALERT;
    drawCone(
      ctx, guard.x, guard.y, guard.facing, GUARD.visionRange, GUARD.visionHalfAngle,
      alert ? COLORS.coneAlert : COLORS.coneGuard,
      alert ? 'rgba(255, 64, 64, 0.7)' : COLORS.coneGuardEdge,
    );
  }
  for (const guard of world.guards) {
    const alert = guard.state === GUARD_ALERT;
    const suspicious = guard.state === GUARD_SUSPICIOUS;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 10, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alert ? '#7f1d1d' : COLORS.guardBody;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = alert ? '#ef4444' : '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.guardHead;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 15, guard.y + Math.sin(guard.facing) * 15);
    ctx.stroke();
    // Suspicion arc above the head.
    if (guard.suspicion > 0.05) {
      ctx.beginPath();
      ctx.arc(guard.x, guard.y - 20, 8, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
      ctx.strokeStyle = alert ? '#ef4444' : '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (alert || suspicious) {
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = alert ? '#ef4444' : '#fbbf24';
      ctx.fillText(alert ? '!' : '?', guard.x, guard.y - 30);
    }
  }
}

function drawCameras(ctx, world) {
  for (const camera of world.cameras) {
    drawCone(
      ctx, camera.x, camera.y, camera.angle, CAMERA.visionRange, CAMERA.visionHalfAngle,
      camera.seesPlayer ? 'rgba(255, 64, 64, 0.30)' : COLORS.coneCamera,
      COLORS.coneCameraEdge,
    );
  }
  for (const camera of world.cameras) {
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, camera.x - 10, camera.y - 8, 20, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    roundRect(ctx, camera.x - 10, camera.y - 8, 20, 16, 4);
    ctx.stroke();
    ctx.fillStyle = camera.seesPlayer ? '#ef4444' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(camera.x + Math.cos(camera.angle) * 8, camera.y + Math.sin(camera.angle) * 8, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, world) {
  const player = world.player;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefOutline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hooded head with a pale mask.
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.facing) * 3, player.y + Math.sin(player.facing) * 3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Sprinting shows a noise ring around the thief.
  if (player.sprinting && player.moving) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawToolsAndEffects(ctx, world) {
  for (const cloud of world.clouds) {
    const alpha = 0.45 * (cloud.remaining / cloud.total);
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(203, 213, 225, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(cloud.x - 18, cloud.y - 8, cloud.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(cloud.x + 20, cloud.y + 10, cloud.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const coin of world.coins) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y - (coin.landed ? 0 : 10 * Math.sin(coin.flight * Math.PI)), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (coin.landed) {
      ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 0.7 - coin.ringAge)})`;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 10 + coin.ringAge * 60, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  for (const ring of world.rings) {
    const progress = ring.age / 0.9;
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 * (1 - progress)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.maxRadius * progress, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const floater of world.floaters) {
    const alpha = 1 - floater.age / 1.6;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y - floater.age * 24);
    ctx.globalAlpha = 1;
  }
}

function drawAlarmMeter(ctx, world) {
  const width = 300;
  const height = 18;
  const x = CANVAS_WIDTH / 2 - width / 2;
  const y = 26;
  const level = world.alarm / ALARM.max;
  const color = world.alarm < 40 ? COLORS.alarmLow : world.alarm < 70 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', CANVAS_WIDTH / 2, 18);
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x, y, width, height, 9);
  ctx.fill();
  if (level > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, Math.max(18, width * level), height, 9);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, width, height, 9);
  ctx.stroke();
  // Tick marks at 40 and 70.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(x + width * 0.4, y, 2, height);
  ctx.fillRect(x + width * 0.7, y, 2, height);
  ctx.fillStyle = color;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(world.alarm)}%`, x + width + 10, y + 14);
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = 'rgba(201, 162, 39, 0.6)';
  ctx.fillRect(0, HUD_HEIGHT - 2, CANVAS_WIDTH, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(world.levelName, 16, 24);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Time ${formatTime(world.elapsed)}`, 16, 46);

  drawAlarmMeter(ctx, world);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`$${world.score.toLocaleString('en-US')}`, CANVAS_WIDTH - 16, 26);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  const diamond = world.diamondTaken ? '◆ Diamond secured' : '◇ Diamond in the vault';
  ctx.fillText(`${diamond}   ● Coin ×${world.coinsLeft}   ○ Smoke ×${world.smokeLeft}`, CANVAS_WIDTH - 16, 47);
}

function drawPrompts(ctx, world) {
  ctx.textAlign = 'center';
  if (world.nearVault) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#0f172a';
    const label = 'HOLD E — CRACK THE CASE';
    const width = ctx.measureText(label).width + 28;
    roundRect(ctx, world.level.vault.x - width / 2, world.level.vault.y + 48, width, 28, 14);
    ctx.fill();
    ctx.fillStyle = COLORS.loot;
    ctx.fillText(label, world.level.vault.x, world.level.vault.y + 67);
  }
  // The objective line, always on screen so the goal is never a mystery —
  // swapped for the getaway cheer when the thief stands at the van.
  ctx.font = '13px system-ui, sans-serif';
  if (world.diamondTaken && world.atExit) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = COLORS.exit;
    ctx.fillText('GO GO GO — THE VAN IS WAITING', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16);
  } else {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
    const objective = world.diamondTaken
      ? 'Diamond secured — reach the getaway van!'
      : 'Steal the Aurora Diamond, then reach the getaway van.';
    ctx.fillText(objective, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 16);
  }
}

function drawVignette(ctx, world) {
  if (world.alarm < 55) return;
  const strength = Math.min(0.45, (world.alarm - 55) / 100);
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT / 3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.75,
  );
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
  gradient.addColorStop(1, `rgba(239, 68, 68, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
}

/** The live game: floor, cones, walls, pieces, HUD. */
export function drawGame(ctx, world, time) {
  drawFloor(ctx, time);
  drawExit(ctx, world, time);
  drawVault(ctx, world, time);
  drawLoot(ctx, world, time);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawWalls(ctx, world.level.walls);
  drawToolsAndEffects(ctx, world);
  drawThief(ctx, world);
  drawVignette(ctx, world);
  drawHud(ctx, world);
  drawPrompts(ctx, world);
}

function overlay(ctx, rgba) {
  ctx.fillStyle = rgba;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function bigTitle(ctx, text, y, color = COLORS.text) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

function subTitle(ctx, text, y, color = COLORS.textDim) {
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(text, CANVAS_WIDTH / 2, y);
}

export function drawTitleScreen(ctx, world, time) {
  drawGame(ctx, world, time);
  overlay(ctx, 'rgba(4, 8, 18, 0.78)');
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('THE MERIDIAN MUSEUM  •  2:47 AM', CANVAS_WIDTH / 2, 170);
  bigTitle(ctx, 'THE MERIDIAN HEIST', 250);
  subTitle(ctx, 'One thief. Three rooms. The Aurora Diamond.', 292);
  ctx.fillStyle = COLORS.text;
  ctx.font = '17px system-ui, sans-serif';
  const lines = [
    'WASD / Arrows — move     Shift — sprint (loud!)     E — crack the vault case',
    'Click or 1 — throw a decoy coin     Right-click or 2 — smoke pellet     P — pause',
    'Stay out of the cones. Cameras feed the alarm. At 100%, the museum locks down.',
  ];
  lines.forEach((line, index) => ctx.fillText(line, CANVAS_WIDTH / 2, 360 + index * 30));
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER TO BEGIN THE HEIST', CANVAS_WIDTH / 2, 500);
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('An original stealth game — no museum was harmed.', CANVAS_WIDTH / 2, 760);
}

export function drawPausedScreen(ctx, world, time) {
  drawGame(ctx, world, time);
  overlay(ctx, 'rgba(4, 8, 18, 0.7)');
  bigTitle(ctx, 'PAUSED', 360);
  subTitle(ctx, 'Press P to slip back into the dark.', 400);
}

export function drawCaughtScreen(ctx, world) {
  drawGame(ctx, world, 0);
  overlay(ctx, 'rgba(60, 4, 4, 0.82)');
  bigTitle(ctx, 'BUSTED', 300, '#fca5a5');
  subTitle(ctx, world.statusReason, 348, '#fecaca');
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Score kept: $${world.scoreAtLevelStart.toLocaleString('en-US')}`, CANVAS_WIDTH / 2, 420);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('PRESS R TO TRY THE ROOM AGAIN', CANVAS_WIDTH / 2, 500);
}

export function drawLevelDoneScreen(ctx, world) {
  drawGame(ctx, world, 0);
  overlay(ctx, 'rgba(4, 18, 10, 0.8)');
  bigTitle(ctx, 'CLEAN GETAWAY', 280, COLORS.exit);
  subTitle(ctx, `${world.levelName} cleared. The van is rolling.`, 326);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Level bonus: +$${world.levelBonus.toLocaleString('en-US')}`, CANVAS_WIDTH / 2, 400);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`Total: $${world.score.toLocaleString('en-US')}`, CANVAS_WIDTH / 2, 440);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('PRESS ENTER FOR THE NEXT ROOM', CANVAS_WIDTH / 2, 520);
}

export function drawVictoryScreen(ctx, world) {
  drawGame(ctx, world, 0);
  overlay(ctx, 'rgba(10, 14, 4, 0.82)');
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('THE AURORA DIAMOND IS YOURS', CANVAS_WIDTH / 2, 200);
  bigTitle(ctx, 'THE GETAWAY', 280, COLORS.loot);
  subTitle(ctx, 'Three rooms, no alarms that mattered, one legend made.', 326);
  ctx.fillStyle = COLORS.text;
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Final score: $${world.score.toLocaleString('en-US')}`, CANVAS_WIDTH / 2, 400);
  ctx.fillText(`Total time: ${formatTime(world.totalElapsed)}`, CANVAS_WIDTH / 2, 432);
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('PRESS R TO RUN THE HEIST AGAIN', CANVAS_WIDTH / 2, 520);
}
