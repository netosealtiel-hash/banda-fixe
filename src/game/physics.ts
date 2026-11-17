import { LandmarkDef, SceneViewMode } from './types';

export interface BoxCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export interface PhysicsBodyState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  grounded: boolean;
}

export const PHYSICS_GRAVITY = -22;
export const PHYSICS_JUMP_VELOCITY = 8.6;
export const PLAYER_RADIUS = 0.44;
export const BALL_RADIUS = 0.34;

export function buildOutdoorColliders(landmarks: LandmarkDef[]): BoxCollider[] {
  const list: BoxCollider[] = [];
  for (const lm of landmarks) {
    // Low flat beach pads don't block walking
    if (lm.height < 0.7 || lm.category === 'Transporte') continue;
    const hw = lm.width * 0.48;
    const hd = lm.depth * 0.48;
    list.push({
      id: lm.id,
      minX: lm.x - hw,
      maxX: lm.x + hw,
      minZ: lm.z - hd,
      maxZ: lm.z + hd,
      height: lm.height,
    });
  }
  return list;
}

export function buildRoomColliders(sceneView: SceneViewMode): BoxCollider[] {
  if (sceneView === 'company_room') {
    return [
      { id: 'desk_left', minX: -5.45, maxX: -2.95, minZ: -2.45, maxZ: -1.15, height: 1.4 },
      { id: 'desk_center', minX: -1.25, maxX: 1.25, minZ: -2.45, maxZ: -1.15, height: 1.4 },
      { id: 'desk_right', minX: 2.95, maxX: 5.45, minZ: -2.45, maxZ: -1.15, height: 1.4 },
    ];
  }
  if (sceneView === 'home_room') {
    return [
      { id: 'bed', minX: -6.45, maxX: -3.75, minZ: -5.3, maxZ: -2.05, height: 1.1 },
      { id: 'tv_console', minX: -1.9, maxX: 0.9, minZ: -5.55, maxZ: -4.65, height: 1.7 },
      { id: 'sofa', minX: -2.15, maxX: 1.15, minZ: -0.45, maxZ: 0.75, height: 1.0 },
      { id: 'coffee_table', minX: -1.45, maxX: 0.45, minZ: -2.2, maxZ: -1.0, height: 0.5 },
      { id: 'kitchen', minX: 2.85, maxX: 6.5, minZ: -5.45, maxZ: -4.25, height: 2.2 },
      { id: 'bathtub', minX: 3.7, maxX: 6.3, minZ: 0.05, maxZ: 1.55, height: 0.7 },
    ];
  }
  return [];
}

/**
 * Resolves 2D circle vs AABB collisions smoothly so characters slide around
 * buildings, walls, and furniture instead of clipping straight through them.
 */
export function resolveCircleColliders(
  x: number,
  z: number,
  radius: number,
  colliders: BoxCollider[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
): { x: number; z: number; collided: boolean } {
  let rx = Math.max(bounds.minX, Math.min(bounds.maxX, x));
  let rz = Math.max(bounds.minZ, Math.min(bounds.maxZ, z));
  let collided = rx !== x || rz !== z;

  for (let pass = 0; pass < 2; pass++) {
    for (const box of colliders) {
      const closestX = Math.max(box.minX, Math.min(rx, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(rz, box.maxZ));
      const dx = rx - closestX;
      const dz = rz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        collided = true;
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const push = radius - dist;
          rx += (dx / dist) * push;
          rz += (dz / dist) * push;
        } else {
          // Center is inside AABB: push out along nearest edge
          const penLeft = Math.abs(rx - box.minX);
          const penRight = Math.abs(box.maxX - rx);
          const penTop = Math.abs(rz - box.minZ);
          const penBot = Math.abs(box.maxZ - rz);
          const minPen = Math.min(penLeft, penRight, penTop, penBot);
          if (minPen === penLeft) rx = box.minX - radius;
          else if (minPen === penRight) rx = box.maxX + radius;
          else if (minPen === penTop) rz = box.minZ - radius;
          else rz = box.maxZ + radius;
        }
      }
    }
  }

  rx = Math.max(bounds.minX, Math.min(bounds.maxX, rx));
  rz = Math.max(bounds.minZ, Math.min(bounds.maxZ, rz));
  return { x: rx, z: rz, collided };
}

export function stepCharacterPhysics(
  body: PhysicsBodyState,
  inputVx: number,
  inputVz: number,
  wantJump: boolean,
  dt: number,
  colliders: BoxCollider[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  radius: number = PLAYER_RADIUS,
): PhysicsBodyState {
  const accel = body.grounded ? 18 : 8;
  const blend = Math.min(1, dt * accel);
  const vx = body.vx + (inputVx - body.vx) * blend;
  const vz = body.vz + (inputVz - body.vz) * blend;

  let vy = body.vy;
  let grounded = body.grounded;
  if (wantJump && grounded) {
    vy = PHYSICS_JUMP_VELOCITY;
    grounded = false;
  }

  vy += PHYSICS_GRAVITY * dt;
  let ny = body.y + vy * dt;
  if (ny <= 0) {
    ny = 0;
    vy = 0;
    grounded = true;
  }

  const resolved = resolveCircleColliders(
    body.x + vx * dt,
    body.z + vz * dt,
    radius,
    colliders,
    bounds,
  );

  return {
    x: resolved.x,
    y: ny,
    z: resolved.z,
    vx: Math.abs(vx) < 0.02 ? 0 : vx,
    vy,
    vz: Math.abs(vz) < 0.02 ? 0 : vz,
    grounded,
  };
}

export function stepBallPhysics(
  ball: PhysicsBodyState,
  kickerX: number,
  kickerZ: number,
  kickerSpeed: number,
  dt: number,
  colliders: BoxCollider[],
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
): PhysicsBodyState {
  let { x, y, z, vx, vy, vz, grounded } = ball;

  // Kick detection when player/vehicle contacts the ball
  const dx = x - kickerX;
  const dz = z - kickerZ;
  const dist = Math.hypot(dx, dz);
  const contactDist = PLAYER_RADIUS + BALL_RADIUS + 0.12;
  if (dist < contactDist && dist > 1e-4) {
    const nx = dx / dist;
    const nz = dz / dist;
    const kickPower = Math.max(4.5, kickerSpeed * 1.45);
    vx = nx * kickPower;
    vz = nz * kickPower;
    vy = Math.max(vy, 2.8);
    grounded = false;
    x = kickerX + nx * (contactDist + 0.04);
    z = kickerZ + nz * (contactDist + 0.04);
  }

  // Gravity & bounce
  vy += PHYSICS_GRAVITY * dt;
  y += vy * dt;
  if (y <= 0) {
    y = 0;
    if (Math.abs(vy) > 1.4) {
      vy = -vy * 0.52;
      grounded = false;
    } else {
      vy = 0;
      grounded = true;
    }
  }

  // Rolling friction
  const damping = Math.exp(-(grounded ? 2.4 : 0.45) * dt);
  vx *= damping;
  vz *= damping;

  const prevX = x + vx * dt;
  const prevZ = z + vz * dt;
  const resolved = resolveCircleColliders(prevX, prevZ, BALL_RADIUS, colliders, bounds);

  // Reflect velocity off walls/buildings
  if (Math.abs(resolved.x - prevX) > 0.005) vx = -vx * 0.72;
  if (Math.abs(resolved.z - prevZ) > 0.005) vz = -vz * 0.72;

  return {
    x: resolved.x,
    y,
    z: resolved.z,
    vx: Math.abs(vx) < 0.05 ? 0 : vx,
    vy,
    vz: Math.abs(vz) < 0.05 ? 0 : vz,
    grounded,
  };
}
