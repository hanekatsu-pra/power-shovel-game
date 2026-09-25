import * as THREE from 'three';
import { ScoopableBall } from '../types';
import {
  ExcavatorModel,
  BUCKET_INNER_WIDTH,
  BUCKET_INNER_FLOOR_Y,
  BUCKET_INNER_TOP_Y,
  BUCKET_INNER_BACK_Z,
  BUCKET_INNER_FRONT_Z,
} from './excavatorModel';
import { DumpBedBounds, ReturnUnitTrajectory } from './constructionScene';
import { soundManager } from '../audio/soundManager';

export const COMBO_ENABLED = false;
export const GOLD_BALL_ENABLED = false;

const BUCKET_BALL_SLOTS = Array.from({ length: 50 }, (_, index): [number, number, number] => {
  const layer = Math.floor(index / 25);
  const layerSlot = index % 25;
  const row = Math.floor(layerSlot / 5);
  const col = layerSlot % 5;

  return [
    -0.152 + col * 0.076,
    -0.282 + layer * 0.078,
    0.062 + row * 0.078,
  ];
});

export class PhysicsSim {
  public balls: ScoopableBall[] = [];
  public ballsGroup: THREE.Group;
  private instancedMesh!: THREE.InstancedMesh;
  private dummyObj: THREE.Object3D = new THREE.Object3D();

  private prevBucketPos: THREE.Vector3 = new THREE.Vector3();
  public bucketVel: THREE.Vector3 = new THREE.Vector3();
  public onBallLoadedCallback?: (loadedCount: number, ballId: number, isGolden?: boolean) => void;
  public onMultiScoopDumpCallback?: (dumpCount: number, comboMultiplier: number) => void;

  private consecutiveDumpCombo: number = 0;
  private lastDumpTime: number = 0;
  private spillAccumulator: number = 0;
  private spillRate: number = 0;
  private spillWarmup: number = 0;
  private submergedSlotCount: number = 0;

  // 76mm diameter soft colorful balls -> radius 0.038m
  public readonly ballRadius: number = 0.038;

  // Pool boundaries (2.4m x 2.4m centered at x: 0, z: 2.25)
  // Transparent acrylic walls extend up to Y = 0.38m
  private poolBounds = {
    minX: -1.16,
    maxX: 1.16,
    minZ: 1.09,
    maxZ: 3.41,
    floorY: 0.02,
    wallY: 0.38,
  };

  // Ball surface level in pool when resting full
  private readonly ballSurfaceY: number = 0.33;

  private returnTrajectory: ReturnUnitTrajectory = {
    conveyorBottom: new THREE.Vector3(1.48, 0.20, 2.99),
    conveyorTop: new THREE.Vector3(1.48, 1.16, 2.99),
    chuteEntry: new THREE.Vector3(1.39, 1.10, 3.10),
    chuteExit: new THREE.Vector3(1.05, 0.95, 3.10),
  };

  // High performance spatial grid (16x16 = 256 cells)
  private readonly gridCols: number = 16;
  private readonly gridRows: number = 16;
  private gridHeads: Int32Array = new Int32Array(256);
  private ballNext: Int32Array = new Int32Array(5000);
  private bucketInvMatrix: THREE.Matrix4 = new THREE.Matrix4();

  // 0: none, 1: basket wait, 2: unit intake, 3: vertical conveyor,
  // 4: chute handoff, 5: chute travel, 6: pool drop.
  private ballReturnTimers: Float32Array = new Float32Array(5000);
  private ballReturnPhase: Int8Array = new Int8Array(5000);
  private ballReturnStartTimes: Float32Array = new Float32Array(5000);
  private returnClock: number = 0;
  private nextReturnStartTime: number = 0;

  constructor(
    scene: THREE.Scene,
    pitCenter: THREE.Vector3,
    returnTrajectory?: ReturnUnitTrajectory
  ) {
    this.ballsGroup = new THREE.Group();
    this.ballsGroup.name = 'ScoopableColorBalls';
    scene.add(this.ballsGroup);
    if (returnTrajectory) this.returnTrajectory = returnTrajectory;

    this.spawnMassiveBalls(pitCenter);
  }

  private getReturnLaneOffset(ballIndex: number): number {
    return ((ballIndex % 3) - 1) * 0.075;
  }

  /**
   * Spawns exactly 4200 colorful balls packed organically and naturally in the pool (6 full layers).
   * Layer-supported viscoelastic distribution eliminates artificial grid lines and prevents any layer collapse.
   */
  public spawnMassiveBalls(_pitCenter: THREE.Vector3) {
    while (this.ballsGroup.children.length > 0) {
      const child = this.ballsGroup.children[0];
      this.ballsGroup.remove(child);
      if (child instanceof THREE.InstancedMesh) {
        child.geometry.dispose();
      }
    }
    this.balls = [];
    this.ballReturnTimers.fill(0);
    this.ballReturnPhase.fill(0);
    this.ballReturnStartTimes.fill(0);
    this.returnClock = 0;
    this.nextReturnStartTime = 0;

    const totalBalls = 4200;
    const r = this.ballRadius;

    // Cheerful anime construction ball pool colors + lucky golden balls
    const colors = [
      0xef4444, // Bright Red
      0x2563eb, // Royal Blue
      0x10b981, // Emerald Green
      0xf59e0b, // Amber Yellow
      0xec4899, // Vibrant Pink
      0x8b5cf6, // Violet
      0x06b6d4, // Sky Cyan
      0xf97316, // Tangy Orange
      0x14b8a6, // Aqua Teal
    ];

    const ballGeom = new THREE.SphereGeometry(r, 10, 8);
    const ballMat = new THREE.MeshStandardMaterial({
      roughness: 0.32,
      metalness: 0.05,
    });

    this.instancedMesh = new THREE.InstancedMesh(ballGeom, ballMat, totalBalls);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.ballsGroup.add(this.instancedMesh);

    const width = this.poolBounds.maxX - this.poolBounds.minX - r * 2.2;
    const depth = this.poolBounds.maxZ - this.poolBounds.minZ - r * 2.2;

    const ballsPerRow = 27;
    const ballsPerCol = 26;
    const ballsPerLayer = ballsPerRow * ballsPerCol; // 702 balls/layer
    const layerHeight = r * 1.35; // Dense close-packing vertical rise

    const tempColor = new THREE.Color();

    // 1. Organic distribution with randomized offsets and layer stagger (NO rigid grid alignment)
    for (let i = 0; i < totalBalls; i++) {
      const ballId = i + 1;
      const layer = Math.floor(i / ballsPerLayer);
      const indexInLayer = i % ballsPerLayer;
      const row = Math.floor(indexInLayer / ballsPerRow);
      const col = indexInLayer % ballsPerRow;

      // Heavy pseudo-random jitter + alternating row/layer shifts eliminates all straight lines
      const jitterX = (Math.random() - 0.5) * (r * 0.90);
      const jitterZ = (Math.random() - 0.5) * (r * 0.90);
      const jitterY = (Math.random() - 0.5) * (r * 0.35);
      const layerStaggerX = (layer % 2) * (r * 0.55);
      const layerStaggerZ = (Math.floor(layer / 2) % 2) * (r * 0.55);

      const u = (col + 0.5) / ballsPerRow;
      const v = (row + 0.5) / ballsPerCol;

      const x = THREE.MathUtils.clamp(
        this.poolBounds.minX + r * 1.2 + u * width + layerStaggerX + jitterX,
        this.poolBounds.minX + r + 0.01,
        this.poolBounds.maxX - r - 0.01
      );
      const z = THREE.MathUtils.clamp(
        this.poolBounds.minZ + r * 1.2 + v * depth + layerStaggerZ + jitterZ,
        this.poolBounds.minZ + r + 0.01,
        this.poolBounds.maxZ - r - 0.01
      );
      // Layer height strictly guarantees multi-tier volume from floor to top rim
      const y = THREE.MathUtils.clamp(
        this.poolBounds.floorY + r + layer * layerHeight + jitterY,
        this.poolBounds.floorY + r + 0.005,
        this.poolBounds.wallY - r - 0.008
      );

      // Random color selection: completely abolishes diagonal color banding
      const isGolden = GOLD_BALL_ENABLED && i % 349 === 11;
      if (isGolden) {
        tempColor.setHex(0xfacc15); // Sparkling Gold
      } else {
        tempColor.setHex(colors[Math.floor(Math.random() * colors.length)]);
      }
      this.instancedMesh.setColorAt(i, tempColor);

      this.balls.push({
        id: ballId,
        x,
        y,
        z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: r,
        color: `#${tempColor.getHexString()}`,
        isScooped: false,
        isLoaded: false,
        isGolden,
        scoopSlot: undefined,
      });
    }

    // 2. Pre-relaxation pass to resolve initial sphere intersections
    const cellW = (this.poolBounds.maxX - this.poolBounds.minX) / this.gridCols;
    const cellD = (this.poolBounds.maxZ - this.poolBounds.minZ) / this.gridRows;
    const diamSq = (r * 2) * (r * 2);
    const minD = r * 1.95;

    for (let pass = 0; pass < 6; pass++) {
      this.gridHeads.fill(-1);
      for (let i = 0; i < totalBalls; i++) {
        const b = this.balls[i];
        const gx = Math.max(0, Math.min(this.gridCols - 1, Math.floor((b.x - this.poolBounds.minX) / cellW)));
        const gz = Math.max(0, Math.min(this.gridRows - 1, Math.floor((b.z - this.poolBounds.minZ) / cellD)));
        const cellIdx = gz * this.gridCols + gx;
        this.ballNext[i] = this.gridHeads[cellIdx];
        this.gridHeads[cellIdx] = i;
      }

      for (let gz = 0; gz < this.gridRows; gz++) {
        for (let gx = 0; gx < this.gridCols; gx++) {
          let i = this.gridHeads[gz * this.gridCols + gx];
          while (i !== -1) {
            const b1 = this.balls[i];
            for (let ogz = Math.max(0, gz - 1); ogz <= Math.min(this.gridRows - 1, gz + 1); ogz++) {
              for (let ogx = Math.max(0, gx - 1); ogx <= Math.min(this.gridCols - 1, gx + 1); ogx++) {
                let j = this.gridHeads[ogz * this.gridCols + ogx];
                while (j !== -1) {
                  if (j > i) {
                    const b2 = this.balls[j];
                    const dx = b1.x - b2.x;
                    const dy = b1.y - b2.y;
                    const dz = b1.z - b2.z;
                    const dSq = dx * dx + dy * dy + dz * dz;
                    if (dSq < diamSq && dSq > 0.000001) {
                      const d = Math.sqrt(dSq);
                      const push = (minD - d) * 0.35;
                      const nx = dx / d;
                      const ny = dy / d;
                      const nz = dz / d;
                      b1.x += nx * push;
                      b1.y += ny * push * 0.4;
                      b1.z += nz * push;
                      b2.x -= nx * push;
                      b2.y -= ny * push * 0.4;
                      b2.z -= nz * push;
                    }
                  }
                  j = this.ballNext[j];
                }
              }
            }
            // Clamp within pool boundaries
            b1.x = THREE.MathUtils.clamp(b1.x, this.poolBounds.minX + r, this.poolBounds.maxX - r);
            b1.z = THREE.MathUtils.clamp(b1.z, this.poolBounds.minZ + r, this.poolBounds.maxZ - r);
            b1.y = THREE.MathUtils.clamp(b1.y, this.poolBounds.floorY + r, this.poolBounds.wallY - r - 0.008);
            b1.baseX = b1.x;
            b1.baseY = b1.y;
            b1.baseZ = b1.z;
            i = this.ballNext[i];
          }
        }
      }
    }

    // 3. Write initial transforms to InstancedMesh
    for (let i = 0; i < totalBalls; i++) {
      const b = this.balls[i];
      this.dummyObj.position.set(b.x, b.y, b.z);
      this.dummyObj.scale.set(1, 1, 1);
      this.dummyObj.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummyObj.matrix);
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public update(
    delta: number,
    excavator: ExcavatorModel,
    bucketAngle: number,
    dumpBed: DumpBedBounds
  ) {
    this.returnClock += delta;
    const bucketPos = excavator.bucketCenterWorldPos;
    const bucketTeeth = excavator.bucketTeethWorldPos;
    const bucketDir = excavator.bucketDirectionWorld;

    this.bucketVel.subVectors(bucketPos, this.prevBucketPos).divideScalar(Math.max(0.001, delta));
    this.prevBucketPos.copy(bucketPos);

    const bucketSpeedSq = this.bucketVel.lengthSq();
    const isLeverMotionApplied = bucketSpeedSq > 0.002;

    // Check if bucket is inside or near the pool ball volume
    const inPoolXZ =
      bucketPos.x >= this.poolBounds.minX - 0.12 &&
      bucketPos.x <= this.poolBounds.maxX + 0.12 &&
      bucketPos.z >= this.poolBounds.minZ - 0.12 &&
      bucketPos.z <= this.poolBounds.maxZ + 0.12;

    const isSubmergedInBalls =
      inPoolXZ &&
      (bucketPos.y <= this.ballSurfaceY + 0.08 || bucketTeeth.y <= this.ballSurfaceY + 0.08) &&
      bucketPos.y >= this.poolBounds.floorY - 0.10;

    const gravity = -9.8;
    const dt = Math.min(0.033, delta);
    const r = this.ballRadius;
    const ballDiam = r * 2;

    this.bucketInvMatrix.copy(excavator.bucketMesh.matrixWorld).invert();

    // Count the authored ball slots that are actually submerged in the pool.
    // This follows the cavity's real orientation rather than bucketAngle.
    let targetScoopCount = 0;
    for (const slot of BUCKET_BALL_SLOTS) {
      const worldSlot = new THREE.Vector3(slot[0], slot[1], slot[2])
        .applyMatrix4(excavator.bucketMesh.matrixWorld);
      if (
        worldSlot.y <= this.ballSurfaceY &&
        worldSlot.x >= this.poolBounds.minX &&
        worldSlot.x <= this.poolBounds.maxX &&
        worldSlot.z >= this.poolBounds.minZ &&
        worldSlot.z <= this.poolBounds.maxZ
      ) {
        targetScoopCount++;
      }
    }
    this.submergedSlotCount = targetScoopCount;

    // The inverse bucket matrix includes bucketMesh's 180-degree Y rotation,
    // so these bounds match the authored visual cavity directly. Closed faces
    // are inset by one ball radius to keep sphere centres clear of the walls.
    const cavityMinX = -BUCKET_INNER_WIDTH / 2 + r;
    const cavityMaxX = BUCKET_INNER_WIDTH / 2 - r;
    const cavityMinY = BUCKET_INNER_FLOOR_Y + r;
    const cavityMaxY = BUCKET_INNER_TOP_Y - r;
    const cavityMinZ = BUCKET_INNER_BACK_Z + r;
    const cavityMaxZ = BUCKET_INNER_FRONT_Z - r;
    const bucketTeethLocalPos = bucketTeeth.clone().applyMatrix4(this.bucketInvMatrix);

    // Keep held balls only while a substantial portion of the cavity is submerged.
    const isInPoolForRetention = targetScoopCount / BUCKET_BALL_SLOTS.length >= 0.3;
    const floorDirection = new THREE.Vector3(0, 0, 1)
      .transformDirection(excavator.bucketMesh.matrixWorld);
    const bucketFloorAngle = Math.atan2(
      floorDirection.y,
      Math.hypot(floorDirection.x, floorDirection.z)
    );
    const downwardFloorDegrees = Math.max(0, -THREE.MathUtils.radToDeg(bucketFloorAngle));

    if (isInPoolForRetention || downwardFloorDegrees <= 2) {
      this.spillRate = 0;
      this.spillAccumulator = 0;
      this.spillWarmup = 0;
    } else if (downwardFloorDegrees <= 5) {
      this.spillRate = THREE.MathUtils.lerp(2, 5, (downwardFloorDegrees - 2) / 3);
    } else if (downwardFloorDegrees <= 10) {
      this.spillRate = THREE.MathUtils.lerp(5, 15, (downwardFloorDegrees - 5) / 5);
    } else if (downwardFloorDegrees <= 20) {
      this.spillRate = THREE.MathUtils.lerp(15, 30, (downwardFloorDegrees - 10) / 10);
    } else {
      this.spillRate = THREE.MathUtils.lerp(30, 50, Math.min(1, (downwardFloorDegrees - 20) / 10));
    }

    if (!isInPoolForRetention && downwardFloorDegrees > 2) {
      this.spillWarmup = Math.min(1, this.spillWarmup + dt / 0.4);
      this.spillRate *= this.spillWarmup;
    }

    let scoopedCount = 0;
    const numBalls = this.balls.length;
    for (let i = 0; i < numBalls; i++) {
      if (this.balls[i].isScooped) scoopedCount++;
    }

    if (this.spillRate > 0 && scoopedCount > 0) {
      this.spillAccumulator += this.spillRate * dt;
      let ballsToSpill = Math.min(scoopedCount, Math.floor(this.spillAccumulator));
      this.spillAccumulator -= ballsToSpill;

      for (let i = 0; i < numBalls && ballsToSpill > 0; i++) {
        const b = this.balls[i];
        if (!b.isScooped) continue;

        b.isScooped = false;
        b.scoopSlot = undefined;
        b.x = bucketPos.x + bucketDir.x * 0.12 + (Math.random() - 0.5) * 0.06;
        b.y = bucketPos.y + bucketDir.y * 0.12;
        b.z = bucketPos.z + bucketDir.z * 0.12 + (Math.random() - 0.5) * 0.06;
        b.vx = this.bucketVel.x + bucketDir.x * (0.35 + Math.random() * 0.15);
        b.vy = this.bucketVel.y + bucketDir.y * 0.35 - 0.08;
        b.vz = this.bucketVel.z + bucketDir.z * (0.35 + Math.random() * 0.15);
        soundManager.playBucketClink();
        ballsToSpill--;
      }
    }

    const tempBallPos = new THREE.Vector3();
    const tempLocalPos = new THREE.Vector3();
    let newlyDumpedThisFrame = 0;
    const spilledBallIndices: number[] = [];
    const maxNewScoopsPerFrame = 3;
    let newScoopsThisFrame = 0;

    // A submerged bucket fills from the nearest free balls in its cavity,
    // opening, and tooth area instead of requiring them to already be inside.
    // Releasing takes priority over acquiring so a bucket at the pool surface
    // cannot spill a ball and immediately pick it up again in the same frame.
    if (this.spillRate <= 0 && scoopedCount < targetScoopCount) {
      const pickupCandidates: Array<{ index: number; distance: number }> = [];
      for (let i = 0; i < numBalls; i++) {
        const b = this.balls[i];
        if (b.isScooped || b.isLoaded || b.isSpilled || b.y > this.ballSurfaceY + 0.08) continue;

        tempBallPos.set(b.x, b.y, b.z);
        tempLocalPos.copy(tempBallPos).applyMatrix4(this.bucketInvMatrix);

        const isInPickupRegion =
          tempLocalPos.x >= cavityMinX - ballDiam &&
          tempLocalPos.x <= cavityMaxX + ballDiam &&
          tempLocalPos.y >= cavityMinY - r &&
          tempLocalPos.y <= cavityMaxY + r &&
          tempLocalPos.z >= cavityMinZ &&
          tempLocalPos.z <= bucketTeethLocalPos.z + ballDiam;

        if (isInPickupRegion) {
          pickupCandidates.push({ index: i, distance: tempBallPos.distanceTo(bucketPos) });
        }
      }

      pickupCandidates.sort((a, b) => a.distance - b.distance);
      const scoopLimit = Math.min(
        targetScoopCount - scoopedCount,
        maxNewScoopsPerFrame,
        pickupCandidates.length
      );
      for (let i = 0; i < scoopLimit; i++) {
        const b = this.balls[pickupCandidates[i].index];
        b.isScooped = true;
        b.scoopSlot = scoopedCount++;
        newScoopsThisFrame++;
        soundManager.playBucketClink();
      }
    }

    // ==========================================================
    // 1. Process Scoop, Dump, Free Balls & Layer-Stable Restoring
    // ==========================================================
    for (let i = 0; i < numBalls; i++) {
      const b = this.balls[i];

      // Handle balls cycling through Ball Back Unit
      if (b.isLoaded) {
        const phase = this.ballReturnPhase[i];
        const laneOffset = this.getReturnLaneOffset(i);
        if (phase === 1) {
          this.ballReturnTimers[i] += dt;
          if (this.returnClock >= this.ballReturnStartTimes[i]) {
            this.ballReturnPhase[i] = 2;
            this.ballReturnTimers[i] = 0;
            soundManager.playBucketClink();
          }
        } else if (phase === 2) {
          this.ballReturnTimers[i] += dt;
          const t = Math.min(1, this.ballReturnTimers[i] / 0.65);
          b.x = THREE.MathUtils.lerp(
            dumpBed.center.x + laneOffset * 0.4,
            this.returnTrajectory.conveyorBottom.x + laneOffset,
            t
          );
          b.z = THREE.MathUtils.lerp(
            dumpBed.center.z + 0.35,
            this.returnTrajectory.conveyorBottom.z,
            t
          );
          b.y = THREE.MathUtils.lerp(
            dumpBed.floorY + r,
            this.returnTrajectory.conveyorBottom.y,
            t
          );

          if (t >= 1) {
            this.ballReturnPhase[i] = 3;
            this.ballReturnTimers[i] = 0;
          }
        } else if (phase === 3) {
          this.ballReturnTimers[i] += dt;
          const t = Math.min(1, this.ballReturnTimers[i] / 2.4);
          b.x = this.returnTrajectory.conveyorBottom.x + laneOffset;
          b.y = THREE.MathUtils.lerp(
            this.returnTrajectory.conveyorBottom.y,
            this.returnTrajectory.conveyorTop.y,
            t
          );
          b.z = this.returnTrajectory.conveyorBottom.z;

          if (t >= 1) {
            this.ballReturnPhase[i] = 4;
            this.ballReturnTimers[i] = 0;
          }
        } else if (phase === 4) {
          this.ballReturnTimers[i] += dt;
          const t = Math.min(1, this.ballReturnTimers[i] / 0.25);
          b.x = THREE.MathUtils.lerp(
            this.returnTrajectory.conveyorTop.x + laneOffset,
            this.returnTrajectory.chuteEntry.x,
            t
          );
          b.y = THREE.MathUtils.lerp(
            this.returnTrajectory.conveyorTop.y,
            this.returnTrajectory.chuteEntry.y,
            t
          );
          b.z = THREE.MathUtils.lerp(
            this.returnTrajectory.conveyorTop.z,
            this.returnTrajectory.chuteEntry.z,
            t
          );

          if (t >= 1) {
            this.ballReturnPhase[i] = 5;
            this.ballReturnTimers[i] = 0;
          }
        } else if (phase === 5) {
          this.ballReturnTimers[i] += dt;
          const t = Math.min(1, this.ballReturnTimers[i] / 0.9);
          b.x = THREE.MathUtils.lerp(this.returnTrajectory.chuteEntry.x, this.returnTrajectory.chuteExit.x, t);
          b.y = THREE.MathUtils.lerp(this.returnTrajectory.chuteEntry.y, this.returnTrajectory.chuteExit.y, t);
          b.z = THREE.MathUtils.lerp(this.returnTrajectory.chuteEntry.z, this.returnTrajectory.chuteExit.z, t);

          if (t >= 1) {
            this.ballReturnPhase[i] = 6;
            this.ballReturnTimers[i] = 0;
          }
        } else if (phase === 6) {
          this.ballReturnTimers[i] += dt;
          const t = Math.min(1, this.ballReturnTimers[i] / 0.48);
          const dropT = t * t;
          b.x = this.returnTrajectory.chuteExit.x - 0.04 * t;
          b.y = THREE.MathUtils.lerp(this.returnTrajectory.chuteExit.y, this.ballSurfaceY, dropT);
          b.z = this.returnTrajectory.chuteExit.z;

          if (t >= 1) {
            b.isLoaded = false;
            b.isScooped = false;
            this.ballReturnPhase[i] = 0;
            this.ballReturnTimers[i] = 0;
            b.vx = -0.20 + (Math.random() - 0.5) * 0.10;
            b.vy = -0.08;
            b.vz = (Math.random() - 0.5) * 0.12;
            b.baseX = b.x;
            b.baseY = this.ballSurfaceY;
            b.baseZ = b.z;
          }
        }
        continue;
      }

      // A missed dump remains a normal ball on the showroom floor. It never
      // re-enters the pool or the basket scoring path after becoming spilled.
      if (b.isSpilled) {
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;

        if (b.y <= r) {
          b.y = r;
          b.vy = b.vy < -0.12 ? -b.vy * 0.32 : 0;
          b.vx *= 0.985;
          b.vz *= 0.985;
        }
        if (b.x <= -10 + r || b.x >= 10 - r) {
          b.x = THREE.MathUtils.clamp(b.x, -10 + r, 10 - r);
          b.vx *= -0.32;
        }
        if (b.z <= -10 + r || b.z >= 10 - r) {
          b.z = THREE.MathUtils.clamp(b.z, -10 + r, 10 - r);
          b.vz *= -0.32;
        }
        spilledBallIndices.push(i);
        continue;
      }

      // Scooped ball: locked inside bucket cavity
      if (b.isScooped) {
        {
          const slot = b.scoopSlot ?? 0;

          // バケットの中にボールが収まった状態の描画 1（整列して並んでしまう）
          // const col = slot % 3;
          // const row = Math.floor(slot / 3);

          // const localSlot = new THREE.Vector3(
          //   (col - 1) * 0.08,
          //   -0.21 + (row > 1 ? 0.04 : 0),
          //   0.06 + row * 0.055
          // );
          //

          const p = BUCKET_BALL_SLOTS[slot % BUCKET_BALL_SLOTS.length];
          const localSlot = new THREE.Vector3(p[0], p[1], p[2]);
        //

          localSlot.applyMatrix4(excavator.bucketMesh.matrixWorld);

          b.x = localSlot.x;
          b.y = localSlot.y;
          b.z = localSlot.z;
          b.vx = this.bucketVel.x;
          b.vy = this.bucketVel.y;
          b.vz = this.bucketVel.z;
        }
        continue;
      }

      // Free flying ball in mid-air (falling towards dump basket or returning from high dump)
      const isHighMidAir = b.y > this.ballSurfaceY + 0.08;
      if (isHighMidAir) {
        b.vy += gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;

        // Check if lands in Dump Basket
        if (
          b.x >= dumpBed.minX &&
          b.x <= dumpBed.maxX &&
          b.z >= dumpBed.minZ &&
          b.z <= dumpBed.maxZ &&
          b.y <= dumpBed.floorY + dumpBed.wallHeight + 0.35 &&
          b.y >= dumpBed.floorY - 0.10
        ) {
          b.isLoaded = true;
          b.y = dumpBed.floorY + r;
          b.vx = 0;
          b.vy = 0;
          b.vz = 0;
          this.ballReturnPhase[i] = 1;
          this.ballReturnTimers[i] = 0;
          this.ballReturnStartTimes[i] = Math.max(
            this.returnClock + 0.70,
            this.nextReturnStartTime
          );
          this.nextReturnStartTime = this.ballReturnStartTimes[i] + 0.22;

          soundManager.playDumpImpact();
          newlyDumpedThisFrame++;

          if (this.onBallLoadedCallback) {
            const totalLoaded = this.balls.filter((ball) => ball.isLoaded).length;
            this.onBallLoadedCallback(totalLoaded, b.id, b.isGolden);
          }
          continue;
        }

        // A ball that has descended outside the pool is a missed dump. Mark it
        // before the pool-bed logic can clamp it back into the pool.
        const isOutsidePool =
          b.x < this.poolBounds.minX || b.x > this.poolBounds.maxX ||
          b.z < this.poolBounds.minZ || b.z > this.poolBounds.maxZ;
        if (isOutsidePool && b.y <= this.ballSurfaceY + 0.08) {
          b.isSpilled = true;
          continue;
        }

        // If falls back into pool volume
        if (
          b.x >= this.poolBounds.minX &&
          b.x <= this.poolBounds.maxX &&
          b.z >= this.poolBounds.minZ &&
          b.z <= this.poolBounds.maxZ &&
          b.y <= this.ballSurfaceY
        ) {
          b.baseX = b.x;
          b.baseY = THREE.MathUtils.clamp(b.y, this.poolBounds.floorY + r, this.ballSurfaceY);
          b.baseZ = b.z;
          b.vx *= 0.3;
          b.vy = 0;
          b.vz *= 0.3;
        }
        continue;
      }

      // ==========================================================
      // Free Ball in Pool: Viscoelastic Granular Layer Bed
      // Prevents 1-layer collapse while allowing fluid displacement & backfill
      // ==========================================================
      const distToBucket = Math.hypot(b.x - bucketPos.x, b.z - bucketPos.z);
      const isNearBucket = distToBucket < 0.46 && Math.abs(b.y - bucketPos.y) < 0.42;

      // Bucket scoop interaction & tooth collision
      if (isNearBucket) {
        tempBallPos.set(b.x, b.y, b.z);
        tempLocalPos.copy(tempBallPos).applyMatrix4(this.bucketInvMatrix);

        const distTeeth = tempBallPos.distanceTo(bucketTeeth);
        const distPocket = tempBallPos.distanceTo(bucketPos);

        const insideCavity =
          tempLocalPos.x >= cavityMinX &&
          tempLocalPos.x <= cavityMaxX &&
          tempLocalPos.y >= cavityMinY &&
          tempLocalPos.y <= cavityMaxY &&
          tempLocalPos.z >= cavityMinZ &&
          tempLocalPos.z <= cavityMaxZ;

        // Teeth may capture a ball immediately in front of the open lip, but not
        // through a side wall, below the floor, above the side plates, or behind
        // the back plate. This preserves digging without treating a 0.22 m sphere
        // around the teeth as unrestricted bucket interior.
        const nearTeethDigging =
          distTeeth < 0.22 &&
          tempLocalPos.x >= cavityMinX &&
          tempLocalPos.x <= cavityMaxX &&
          tempLocalPos.y >= cavityMinY &&
          tempLocalPos.y <= cavityMaxY &&
          tempLocalPos.z >= BUCKET_INNER_FRONT_Z - ballDiam &&
          tempLocalPos.z <= bucketTeethLocalPos.z + r;

        // Pocket proximity is retained only inside the real cavity. It can no
        // longer pull balls through a wall or from behind/below the bucket.
        const nearPocketInside = distPocket < 0.28 && insideCavity;

        if (
          newScoopsThisFrame < maxNewScoopsPerFrame &&
          scoopedCount < targetScoopCount &&
          (insideCavity || nearTeethDigging || nearPocketInside)
        ) {
          b.isScooped = true;
          b.scoopSlot = scoopedCount;
          scoopedCount++;
          newScoopsThisFrame++;
          soundManager.playBucketClink();
          continue;
        } else if (isSubmergedInBalls && (distPocket < 0.34 || distTeeth < 0.26)) {
          // Displace balls outward and slightly upward around the bucket
          const dx = b.x - bucketPos.x;
          const dz = b.z - bucketPos.z;
          const distHoriz = Math.hypot(dx, dz) || 1;
          const push = THREE.MathUtils.lerp(0.85, 0.20, Math.min(distPocket, distTeeth) / 0.34);
          b.vx += (dx / distHoriz) * push;
          b.vz += (dz / distHoriz) * push;
          b.vy += push * 0.25; // Heaves upward around bucket
        }
      }

      // Viscoelastic Layer Restoring (Keeps multi-layer fullness, backfills holes fluidly!)
      const bx = b.baseX ?? b.x;
      const by = b.baseY ?? b.y;
      const bz = b.baseZ ?? b.z;

      const kLat = 7.5;   // Restoring speed horizontally (fluid backfill into holes)
      const kVert = 14.0; // Restoring speed vertically (maintains 6 layer thickness!)

      b.vx += (bx - b.x) * kLat * dt;
      b.vy += (by - b.y) * kVert * dt;
      b.vz += (bz - b.z) * kLat * dt;

      // Integrate motion
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      // Fluid drag & rolling friction
      b.vx *= 0.85;
      b.vy *= 0.85;
      b.vz *= 0.85;

      // Strict Pool Boundary Clamping (Never spills or sinks through floor)
      b.x = THREE.MathUtils.clamp(b.x, this.poolBounds.minX + r, this.poolBounds.maxX - r);
      b.z = THREE.MathUtils.clamp(b.z, this.poolBounds.minZ + r, this.poolBounds.maxZ - r);
      b.y = THREE.MathUtils.clamp(b.y, this.poolBounds.floorY + r, this.poolBounds.wallY - r);
    }

    // Reuse the existing ball radius and velocity model for the small set of
    // floor-spilled balls, so missed balls also separate from each other.
    for (let first = 0; first < spilledBallIndices.length; first++) {
      const a = this.balls[spilledBallIndices[first]];
      for (let second = first + 1; second < spilledBallIndices.length; second++) {
        const b = this.balls[spilledBallIndices[second]];
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const distance = Math.hypot(dx, dz);
        const minimumDistance = ballDiam;
        if (distance > 0.0001 && distance < minimumDistance) {
          const push = (minimumDistance - distance) * 0.5;
          const nx = dx / distance;
          const nz = dz / distance;
          a.x += nx * push;
          a.z += nz * push;
          b.x -= nx * push;
          b.z -= nz * push;
        }
      }
    }

    if (COMBO_ENABLED && newlyDumpedThisFrame > 0) {
      const now = performance.now();
      if (now - this.lastDumpTime < 8000) {
        this.consecutiveDumpCombo++;
      } else {
        this.consecutiveDumpCombo = 1;
      }
      this.lastDumpTime = now;
      if (this.onMultiScoopDumpCallback) {
        this.onMultiScoopDumpCallback(newlyDumpedThisFrame, this.consecutiveDumpCombo);
      }
    }

    // =========================================================================
    // 2. Inter-Ball Collision Relaxation in Bucket Neighborhood
    // Soft 3D separation spreads displacements naturally between balls
    // =========================================================================
    if (isSubmergedInBalls && isLeverMotionApplied) {
      const cellW = (this.poolBounds.maxX - this.poolBounds.minX) / this.gridCols;
      const cellD = (this.poolBounds.maxZ - this.poolBounds.minZ) / this.gridRows;

      const bktGx = Math.max(0, Math.min(this.gridCols - 1, Math.floor((bucketPos.x - this.poolBounds.minX) / cellW)));
      const bktGz = Math.max(0, Math.min(this.gridRows - 1, Math.floor((bucketPos.z - this.poolBounds.minZ) / cellD)));
      const checkR = 3;
      const minGx = Math.max(0, bktGx - checkR);
      const maxGx = Math.min(this.gridCols - 1, bktGx + checkR);
      const minGz = Math.max(0, bktGz - checkR);
      const maxGz = Math.min(this.gridRows - 1, bktGz + checkR);

      this.gridHeads.fill(-1);
      for (let i = 0; i < numBalls; i++) {
        const b = this.balls[i];
        if (b.isScooped || b.isLoaded) continue;
        const gx = Math.floor((b.x - this.poolBounds.minX) / cellW);
        const gz = Math.floor((b.z - this.poolBounds.minZ) / cellD);
        if (gx >= minGx && gx <= maxGx && gz >= minGz && gz <= maxGz) {
          const cellIdx = gz * this.gridCols + gx;
          this.ballNext[i] = this.gridHeads[cellIdx];
          this.gridHeads[cellIdx] = i;
        }
      }

      const diamSq = ballDiam * ballDiam;

      for (let gz = minGz; gz <= maxGz; gz++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          const cellIdx = gz * this.gridCols + gx;
          let i = this.gridHeads[cellIdx];

          while (i !== -1) {
            const b1 = this.balls[i];

            for (let ogz = gz; ogz <= Math.min(maxGz, gz + 1); ogz++) {
              const startX = ogz === gz ? gx : Math.max(minGx, gx - 1);
              const endX = Math.min(maxGx, gx + 1);

              for (let ogx = startX; ogx <= endX; ogx++) {
                const otherCellIdx = ogz * this.gridCols + ogx;
                let j = this.gridHeads[otherCellIdx];

                while (j !== -1) {
                  if (ogz === gz && ogx === gx && j <= i) {
                    j = this.ballNext[j];
                    continue;
                  }

                  const b2 = this.balls[j];
                  const dx = b1.x - b2.x;
                  const dy = b1.y - b2.y;
                  const dz = b1.z - b2.z;
                  const distSq = dx * dx + dy * dy + dz * dz;

                  if (distSq < diamSq && distSq > 0.000001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = Math.min(0.01, ballDiam - dist);
                    const push = overlap * 0.35;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;

                    b1.x += nx * push;
                    b1.y += ny * push * 0.35;
                    b1.z += nz * push;
                    b2.x -= nx * push;
                    b2.y -= ny * push * 0.35;
                    b2.z -= nz * push;
                  }

                  j = this.ballNext[j];
                }
              }
            }

            i = this.ballNext[i];
          }
        }
      }
    }

    // =========================================================================
    // 3. Batch Update InstancedMesh Matrix Buffer
    // =========================================================================
    for (let i = 0; i < numBalls; i++) {
      const b = this.balls[i];
      this.dummyObj.position.set(b.x, b.y, b.z);
      this.dummyObj.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummyObj.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public getScoopedCount(): number {
    return this.balls.filter((b) => b.isScooped).length;
  }

  public getSpillRate(): number {
    return this.spillRate;
  }

  public getSubmergedSlotCount(): number {
    return this.submergedSlotCount;
  }

  public resetBalls(pitCenter: THREE.Vector3) {
    this.spillAccumulator = 0;
    this.spillRate = 0;
    this.spillWarmup = 0;
    this.submergedSlotCount = 0;
    this.spawnMassiveBalls(pitCenter);
  }

  public getLoadedCount(): number {
    return this.balls.filter((b) => b.isLoaded).length;
  }
}
