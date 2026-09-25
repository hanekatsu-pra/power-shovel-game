import * as THREE from 'three';
import { getHandDrawnIllustrationGradient } from './handDrawnStyle';
import { ExcavatorAngles } from '../types';

export const EXCAVATOR_LIMITS = {
  boomMin: -0.55, // Lowest dig limit
  boomMax: 0.75,  // Highest lift limit
  armMin: -1.5708, // Full curl IN (-90 degrees)
  armMax: 0.15,    // Full extend OUT
  bucketMin: -1.722, // Full dump
  bucketMax: 0.2618, // Full scoop (+15 degrees)
};

// At the reset boom/arm pose, their rotations add +0.4 rad to the bucket.
// This offset makes angles.bucket = 0 the visually level, open-forward neutral.
const BUCKET_NEUTRAL_JOINT_OFFSET = -0.4;

// Bucket dimensions (Three.js units: 1.0 = 1 metre).
// Exported so the physics simulation can share the visual bucket dimensions later.
export const BUCKET_OUTER_WIDTH = 0.42;
export const BUCKET_INNER_WIDTH = 0.38;
export const BUCKET_INNER_DEPTH = 0.40;
export const BUCKET_SIDE_HEIGHT = 0.22;
export const BUCKET_WALL_THICKNESS = 0.02;

// Local-space bucket cavity reference planes.
export const BUCKET_INNER_FLOOR_Y = -0.32;
export const BUCKET_INNER_TOP_Y = BUCKET_INNER_FLOOR_Y + BUCKET_SIDE_HEIGHT;
export const BUCKET_INNER_BACK_Z = 0.02;
export const BUCKET_INNER_FRONT_Z = BUCKET_INNER_BACK_Z + BUCKET_INNER_DEPTH;


export class ExcavatorModel {
  public rootGroup: THREE.Group;
  public undercarriageGroup: THREE.Group;
  public upperStructureGroup: THREE.Group;
  public boomJoint: THREE.Group;
  public armJoint: THREE.Group;
  public bucketJoint: THREE.Group;
  public bucketMesh: THREE.Group;

  public cameraMount: THREE.Object3D;
  public cameraLookTarget: THREE.Object3D;

  public bucketCenterWorldPos: THREE.Vector3 = new THREE.Vector3();
  public bucketTeethWorldPos: THREE.Vector3 = new THREE.Vector3();
  public bucketDirectionWorld: THREE.Vector3 = new THREE.Vector3();
  public armJointWorldPos: THREE.Vector3 = new THREE.Vector3();
  public bucketJointWorldPos: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'KOMATSU_PC01';

    const handDrawnGrad = getHandDrawnIllustrationGradient();

    // ====================================================
    // Clean solid materials
    // ====================================================
    // Komatsu Vibrant Construction Ochre Yellow
    const animeYellowMat = new THREE.MeshToonMaterial({
      color: 0xfbbf24,
      gradientMap: handDrawnGrad,
    });
    // Dark Charcoal / Graphite Undercarriage
    const darkSteelMat = new THREE.MeshToonMaterial({
      color: 0x334155,
      gradientMap: handDrawnGrad,
    });
    // Rubber Track Material
    const rubberTrackMat = new THREE.MeshToonMaterial({
      color: 0x1e293b,
      gradientMap: handDrawnGrad,
    });
    // Komatsu Accent Kobalt Blue Line
    const komatsuBlueMat = new THREE.MeshToonMaterial({
      color: 0x0284c7,
      gradientMap: handDrawnGrad,
    });
    // Chrome Rod Material (for pilot levers)
    const chromeRodMat = new THREE.MeshToonMaterial({
      color: 0xf8fafc,
      gradientMap: handDrawnGrad,
    });
    // Seat Vinyl
    const seatMat = new THREE.MeshToonMaterial({
      color: 0x0f172a,
      gradientMap: handDrawnGrad,
    });

    // ====================================================
    // 1. Undercarriage (下部走行体) with Rounded Rubber Tracks
    // ====================================================
    this.undercarriageGroup = new THREE.Group();
    this.undercarriageGroup.name = 'Undercarriage';
    this.rootGroup.add(this.undercarriageGroup);

    // Center Chassis Frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 1.25), darkSteelMat);
    chassis.position.y = 0.22;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.undercarriageGroup.add(chassis);

    // Center Slewing Turntable
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.12, 24), darkSteelMat);
    turntable.position.y = 0.36;
    this.undercarriageGroup.add(turntable);

    // Rounded Rubber Crawlers (Left & Right)
    [-0.46, 0.46].forEach((xSide) => {
      const crawler = new THREE.Group();
      crawler.position.set(xSide, 0.2, 0);

      // Track central section
      const trackMid = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.9), rubberTrackMat);
      trackMid.position.y = 0;
      crawler.add(trackMid);

      // Rounded Front Idler Wheel
      const frontCurved = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 20), rubberTrackMat);
      frontCurved.rotation.z = Math.PI / 2;
      frontCurved.position.set(0, 0, 0.45);
      crawler.add(frontCurved);

      // Rounded Rear Drive Sprocket Wheel
      const rearCurved = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 20), rubberTrackMat);
      rearCurved.rotation.z = Math.PI / 2;
      rearCurved.position.set(0, 0, -0.45);
      crawler.add(rearCurved);

      // Steel Sprocket Hub
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 14), darkSteelMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(0, 0, -0.45);
      crawler.add(hub);

      this.undercarriageGroup.add(crawler);
    });

    // ====================================================
    // 2. Upper Structure (上部旋回体)
    // ====================================================
    this.upperStructureGroup = new THREE.Group();
    this.upperStructureGroup.name = 'UpperStructure';
    this.upperStructureGroup.position.y = 0.42;
    this.rootGroup.add(this.upperStructureGroup);

    // Main Cabin Body
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.46, 1.15), animeYellowMat);
    cabin.position.set(0, 0.23, -0.05);
    cabin.castShadow = true;
    this.upperStructureGroup.add(cabin);

    // Komatsu blue side decal stripe
    [-0.395, 0.395].forEach((xSide) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.08), komatsuBlueMat);
      stripe.position.set(xSide, 0.26, -0.05);
      stripe.rotation.y = xSide > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.upperStructureGroup.add(stripe);
    });

    // Engine Hood & Counterweight (Rear)
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.24, 0.38), animeYellowMat);
    hood.position.set(0, 0.52, -0.38);
    hood.castShadow = true;
    this.upperStructureGroup.add(hood);

    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.35, 0.16), darkSteelMat);
    counterweight.position.set(0, 0.28, -0.66);
    this.upperStructureGroup.add(counterweight);

    // Ride-on Ergonomic Saddle Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.46), seatMat);
    seat.position.set(0, 0.52, -0.12);
    this.upperStructureGroup.add(seat);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), seatMat);
    backrest.position.set(0, 0.65, -0.32);
    this.upperStructureGroup.add(backrest);

    // Footrest Steps (Left & Right)
    [-0.45, 0.45].forEach((xSide) => {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.55), darkSteelMat);
      step.position.set(xSide, 0.04, 0.18);
      this.upperStructureGroup.add(step);
    });

    // Dual Pilot Levers & Console Tower
    const consoleTower = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.25), darkSteelMat);
    consoleTower.position.set(0, 0.55, 0.25);
    this.upperStructureGroup.add(consoleTower);

    [-0.14, 0.14].forEach((xSide) => {
      const leverBoot = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.06, 12), rubberTrackMat);
      leverBoot.position.set(xSide, 0.72, 0.25);
      const leverStick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), chromeRodMat);
      leverStick.position.set(xSide, 0.8, 0.25);
      const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), animeYellowMat);
      leverKnob.position.set(xSide, 0.88, 0.25);
      this.upperStructureGroup.add(leverBoot, leverStick, leverKnob);
    });

    // Boom Pivot Pin Mount
    const boomMountL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.22), animeYellowMat);
    boomMountL.position.set(-0.16, 0.38, 0.54);
    const boomMountR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.22), animeYellowMat);
    boomMountR.position.set(0.16, 0.38, 0.54);
    this.upperStructureGroup.add(boomMountL, boomMountR);

    // ====================================================
    // 3. Boom Assembly (コマツPC01E実機仕様: 一体成型イエロー・上部1/3から約30度下向き屈曲)
    // ====================================================
    this.boomJoint = new THREE.Group();
    this.boomJoint.name = 'BoomJoint';
    this.boomJoint.position.set(0, 0.42, 0.56);
    this.upperStructureGroup.add(this.boomJoint);

    // Boom Root Pivot Pin
    const boomPin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 14), darkSteelMat);
    boomPin.rotation.z = Math.PI / 2;
    this.boomJoint.add(boomPin);

    // Root Pivot Boss (根元の黄色いボス補強部)
    const rootBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.20, 16), animeYellowMat);
    rootBoss.rotation.z = Math.PI / 2;
    rootBoss.castShadow = true;
    this.boomJoint.add(rootBoss);

    // Lower Boom Section (根元から上方向2/3まで力強く伸びる主ブーム)
    // Starts at (0,0,0), rises up to apex knuckle at (0, 0.62, 0.48)
    const lowerLen = 0.82;
    const boomLower = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.22, lowerLen),
      animeYellowMat
    );
    boomLower.position.set(0, 0.31, 0.24);
    // Angle: atan2(0.48, 0.62) ≈ 0.66 rad (~38 degrees forward from vertical)
    boomLower.rotation.x = -0.66;
    boomLower.castShadow = true;
    this.boomJoint.add(boomLower);

    // Knuckle Apex (上部1/3の屈曲頂点: 滑らかな曲面ナックル)
    const knuckleApex = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, 0.16, 18),
      animeYellowMat
    );
    knuckleApex.position.set(0, 0.62, 0.48);
    knuckleApex.rotation.z = Math.PI / 2;
    knuckleApex.castShadow = true;
    this.boomJoint.add(knuckleApex);

    // Upper Boom Section (頂点からアーム接合部へ約30度下側へ屈曲して伸びる上部ブーム)
    // Deflects ~30 degrees downward relative to lower section (-0.66 + 0.52 = -0.14 rad)
    const upperLen = 0.52;
    const boomUpper = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.19, upperLen),
      animeYellowMat
    );
    boomUpper.position.set(0, 0.61, 0.72);
    boomUpper.rotation.x = -0.14; // ~30 degrees downward bend from lower boom
    boomUpper.castShadow = true;
    this.boomJoint.add(boomUpper);

    // Arm Pin Boss at Boom Tip (ブーム先端のアーム接続ボス)
    const armPinBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.18, 16), animeYellowMat);
    armPinBoss.position.set(0, 0.60, 0.94);
    armPinBoss.rotation.z = Math.PI / 2;
    armPinBoss.castShadow = true;
    this.boomJoint.add(armPinBoss);

    // ====================================================
    // 4. Arm Assembly (アーム)
    // ====================================================
    this.armJoint = new THREE.Group();
    this.armJoint.name = 'ArmJoint';
    this.armJoint.position.set(0, 0.60, 0.94);
    this.boomJoint.add(this.armJoint);

    const armPin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 12), darkSteelMat);
    armPin.rotation.z = Math.PI / 2;
    this.armJoint.add(armPin);

    // Arm Body
    const armBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.92), animeYellowMat);
    armBody.position.set(0, 0.02, 0.38);
    armBody.castShadow = true;
    this.armJoint.add(armBody);

    // ====================================================
    // 5. Bucket Assembly (バケット)
    // ====================================================
    this.bucketJoint = new THREE.Group();
    this.bucketJoint.name = 'BucketJoint';
    this.bucketJoint.position.set(0, 0.02, 0.86);
    this.armJoint.add(this.bucketJoint);

    const bktPin = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.26, 12), darkSteelMat);
    bktPin.rotation.z = Math.PI / 2;
    this.bucketJoint.add(bktPin);

    // Detailed Bucket Mesh (open-top/open-front cup for holding balls)
    this.bucketMesh = new THREE.Group();
    this.bucketMesh.name = 'BucketCavity';
    // The cavity is authored toward local +Z, but the attachment's actual
    // cutting/front direction is the opposite side of bucketJoint.
    // Rotate the complete bucket so its opening and teeth face the ball pool.
    this.bucketMesh.rotation.y = Math.PI;
    this.bucketJoint.add(this.bucketMesh);

    // Nearly vertical back plate. Together with the flat floor this creates
    // a clear L-shaped cavity when viewed from the side.
    const bktBack = new THREE.Mesh(
      new THREE.BoxGeometry(BUCKET_OUTER_WIDTH, BUCKET_SIDE_HEIGHT, BUCKET_WALL_THICKNESS),
      darkSteelMat
    );
    bktBack.position.set(
      0,
      BUCKET_INNER_FLOOR_Y + BUCKET_SIDE_HEIGHT / 2,
      BUCKET_INNER_BACK_Z - BUCKET_WALL_THICKNESS / 2
    );
    bktBack.castShadow = true;
    this.bucketMesh.add(bktBack);

    // Flat bottom scoop plate. It extends slightly beneath the back plate and
    // reaches the open front lip while preserving 0.40 m of clear inner depth.
    const floorDepth = BUCKET_INNER_DEPTH + BUCKET_WALL_THICKNESS;
    const bktFloor = new THREE.Mesh(
      new THREE.BoxGeometry(BUCKET_OUTER_WIDTH, BUCKET_WALL_THICKNESS, floorDepth),
      darkSteelMat
    );
    bktFloor.position.set(
      0,
      BUCKET_INNER_FLOOR_Y - BUCKET_WALL_THICKNESS / 2,
      BUCKET_INNER_BACK_Z + BUCKET_INNER_DEPTH / 2 - BUCKET_WALL_THICKNESS / 2
    );
    bktFloor.castShadow = true;
    this.bucketMesh.add(bktFloor);

    // Left & right cheek plates. Their inner faces define the 0.38 m usable width.
    const sideX = BUCKET_INNER_WIDTH / 2 + BUCKET_WALL_THICKNESS / 2;
    const sideDepth = BUCKET_INNER_DEPTH + BUCKET_WALL_THICKNESS;
    [-sideX, sideX].forEach((sx) => {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(BUCKET_WALL_THICKNESS, BUCKET_SIDE_HEIGHT, sideDepth),
        darkSteelMat
      );
      cheek.position.set(
        sx,
        BUCKET_INNER_FLOOR_Y + BUCKET_SIDE_HEIGHT / 2,
        BUCKET_INNER_BACK_Z + BUCKET_INNER_DEPTH / 2 - BUCKET_WALL_THICKNESS / 2
      );
      cheek.castShadow = true;
      this.bucketMesh.add(cheek);
    });

    // 3 excavator teeth, resized and repositioned for the narrower 0.42 m lip.
    const toothLength = 0.10;
    const toothRadius = 0.025;
    const toothAngle = Math.PI / 2 + Math.PI / 18;
    const toothCenterZ = BUCKET_INNER_FRONT_Z + toothLength * 0.35;
    const toothCenterY = BUCKET_INNER_FLOOR_Y - 0.005;
    [-0.13, 0, 0.13].forEach((tx) => {
      const tooth = new THREE.Mesh(
        new THREE.ConeGeometry(toothRadius, toothLength, 4),
        animeYellowMat
      );
      tooth.rotation.x = toothAngle;
      tooth.position.set(tx, toothCenterY, toothCenterZ);
      tooth.castShadow = true;
      this.bucketMesh.add(tooth);
    });

    // Center marker of the usable box-shaped cavity.
    const pocket = new THREE.Object3D();
    pocket.name = 'BucketPocket';
    pocket.position.set(
      0,
      BUCKET_INNER_FLOOR_Y + BUCKET_SIDE_HEIGHT / 2,
      BUCKET_INNER_BACK_Z + BUCKET_INNER_DEPTH / 2
    );
    this.bucketMesh.add(pocket);

    // Center marker at the cutting edge, just ahead of the open front lip.
    const teethMarker = new THREE.Object3D();
    teethMarker.name = 'BucketTeeth';
    teethMarker.position.set(
      0,
      toothCenterY + Math.cos(toothAngle) * toothLength / 2,
      toothCenterZ + Math.sin(toothAngle) * toothLength / 2
    );
    this.bucketMesh.add(teethMarker);

    // ====================================================
    // 6. Camera Mount: TRUE LEFT-REAR PERSPECTIVE (左斜め後方視点)
    // ====================================================
    this.cameraMount = new THREE.Object3D();
    this.cameraMount.name = 'LeftRearCameraMount';
    this.cameraMount.position.set(1.95, 2.1, -2.15);
    this.upperStructureGroup.add(this.cameraMount);

    this.cameraLookTarget = new THREE.Object3D();
    this.cameraLookTarget.name = 'CameraLookTarget';
    this.cameraLookTarget.position.set(-0.2, 0.65, 2.1);
    this.upperStructureGroup.add(this.cameraLookTarget);

    // Initial angles
    this.setAngles({
      swing: 0,
      boom: 0.15,
      arm: -0.3,
      bucket: 0.2,
    });
  }

  /**
   * Updates physical joint rotations with correct tilt directions!
   * - boom: positive angles.boom tilts boom DOWN forward into pool
   * - arm: positive angles.arm extends arm OUT upward/forward
   * - bucket: 0 is level/open-forward neutral; positive curls inward for digging
   */
  public setAngles(angles: ExcavatorAngles) {
    this.upperStructureGroup.rotation.y = angles.swing;
    this.boomJoint.rotation.x = angles.boom;
    this.armJoint.rotation.x = -angles.arm;
    this.bucketJoint.rotation.x = angles.bucket + BUCKET_NEUTRAL_JOINT_OFFSET;

    // Immediately update world matrix & positions so queries are always up-to-date
    this.updateWorldPositions();
  }

  public updateWorldPositions() {
    this.rootGroup.updateMatrixWorld(true);

    const pocket = this.bucketMesh.getObjectByName('BucketPocket');
    if (pocket) {
      pocket.getWorldPosition(this.bucketCenterWorldPos);
    } else {
      this.bucketMesh.getWorldPosition(this.bucketCenterWorldPos);
    }

    const teeth = this.bucketMesh.getObjectByName('BucketTeeth');
    if (teeth) {
      teeth.getWorldPosition(this.bucketTeethWorldPos);
    } else {
      this.bucketTeethWorldPos.copy(this.bucketCenterWorldPos);
    }

    this.armJoint.getWorldPosition(this.armJointWorldPos);
    this.bucketJoint.getWorldPosition(this.bucketJointWorldPos);

    // Define bucket forward semantically: from the cavity centre to the real
    // tooth-tip marker. This remains correct even when the bucket mesh is
    // reoriented relative to bucketJoint.
    this.bucketDirectionWorld
      .subVectors(this.bucketTeethWorldPos, this.bucketCenterWorldPos)
      .normalize();
  }
}
