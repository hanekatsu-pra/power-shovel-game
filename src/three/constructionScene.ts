import * as THREE from 'three';
import { getHandDrawnIllustrationGradient } from './handDrawnStyle';
import { characterProfileById, characterProfiles, spectatorPlacements } from './characterProfiles';
/** Vite discovers every spectator image; profiles only need to store the asset path. */
const spectatorAssetUrls = import.meta.glob('../assets/spectators/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function getSpectatorAssetUrl(asset: string): string | undefined {
  return spectatorAssetUrls[`../assets/spectators/${asset}`];
}

// The main banner is centered on the front wall. Only a single child may occupy its foreground.
const FRONT_BANNER_VIEWER_ZONE = { minX: -1.89, maxX: 1.89, minZ: 4.15, maxZ: 6.90 };

function validateCharacterRegistry() {
  const profileIds = new Set<string>();
  const sceneSlots = new Set<number>();
  const warnings: string[] = [];

  for (const profile of characterProfiles) {
    if (profileIds.has(profile.id)) warnings.push(`Duplicate profile ID: ${profile.id}`);
    profileIds.add(profile.id);

    const placement = spectatorPlacements[profile.id];
    if (profile.useAsSpectator) {
      if (!placement) warnings.push(`${profile.id}: viewer is enabled but has no placement.`);
      if (!getSpectatorAssetUrl(placement?.viewingAsset ?? profile.spectatorAsset)) {
        warnings.push(`${profile.id}: viewer image could not be resolved.`);
      }
      if (placement?.sceneSlot !== undefined) {
        if (sceneSlots.has(placement.sceneSlot)) warnings.push(`Duplicate viewer scene slot: ${placement.sceneSlot}`);
        sceneSlots.add(placement.sceneSlot);
      }
      if (placement
        && placement.x >= FRONT_BANNER_VIEWER_ZONE.minX
        && placement.x <= FRONT_BANNER_VIEWER_ZONE.maxX
        && placement.z >= FRONT_BANNER_VIEWER_ZONE.minZ
        && placement.z <= FRONT_BANNER_VIEWER_ZONE.maxZ
        && !profile.isSingleChild) {
        warnings.push(`${profile.id}: only a single child may be placed in front of the main banner.`);
      }
      if (placement?.audienceLayer === 'child-front' && !profile.isSingleChild) {
        warnings.push(`${profile.id}: the tora-pole front row is reserved for single child characters.`);
      }
      if (placement?.audienceLayer === 'adult-rear' && profile.isSingleChild) {
        warnings.push(`${profile.id}: a single child should use the tora-pole front row.`);
      }
    }

    if (profile.useAsWalker) {
      if (!profile.walkingAssets || profile.walkingAssets.length !== 4) {
        warnings.push(`${profile.id}: walker is enabled but does not define four walking cuts.`);
      } else if (profile.walkingAssets.some((asset) => !getSpectatorAssetUrl(asset))) {
        warnings.push(`${profile.id}: one or more walking images could not be resolved.`);
      }
    }
  }

  const placedViewers = characterProfiles
    .filter((profile) => profile.useAsSpectator && spectatorPlacements[profile.id])
    .map((profile) => ({ profile, placement: spectatorPlacements[profile.id] }));
  for (let index = 0; index < placedViewers.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < placedViewers.length; otherIndex += 1) {
      const current = placedViewers[index];
      const other = placedViewers[otherIndex];
      const distance = Math.hypot(current.placement.x - other.placement.x, current.placement.z - other.placement.z);
      const minimumDistance = (current.placement.clearanceRadius ?? 0.45) + (other.placement.clearanceRadius ?? 0.45);
      if (distance < minimumDistance) {
        warnings.push(`${current.profile.id} and ${other.profile.id}: viewer placements are too close (${distance.toFixed(2)} < ${minimumDistance.toFixed(2)}).`);
      }
    }
  }

  if (warnings.length > 0) console.warn('[CharacterRegistry]', warnings);
}
/** Development-only: set true to draw non-interactive ID labels. */
const SHOW_OBJECT_IDS = false;
/** Temporary locator for the illustrated-person prototype only. */
const HIGHLIGHT_SPECTATOR_01 = false;

function registerObjectId(object: THREE.Object3D, id: string, type: string, label: string, labelHeight = 0) {
  object.name = id;
  object.userData.id = id;
  object.userData.type = type;
  object.traverse((child) => {
    if (child !== object) child.userData.ownerId = id;
  });
  if (!SHOW_OBJECT_IDS) return;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 48;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = 'rgba(15, 23, 42, 0.82)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = 'bold 28px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
  sprite.name = `${id}__debug_label`;
  sprite.userData.ownerId = id;
  sprite.userData.debugOnly = true;
  sprite.position.set(0, labelHeight, 0);
  sprite.scale.set(0.72, 0.27, 1);
  sprite.renderOrder = 999;
  object.add(sprite);
}

function addSpectator01Highlight(person: THREE.Group, height: number) {
  if (!HIGHLIGHT_SPECTATOR_01) return;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = 'rgba(127, 0, 90, 0.90)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#ffffff';
    context.lineWidth = 7;
    context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    context.fillStyle = '#ffffff';
    context.font = 'bold 58px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('S01', canvas.width / 2, canvas.height / 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
  label.name = 'spectator_01__highlight_label';
  label.userData.ownerId = 'spectator_01';
  label.userData.debugOnly = true;
  label.userData.nonInteractive = true;
  label.position.set(0, height + 0.38, 0);
  label.scale.set(1.05, 0.39, 1);
  label.renderOrder = 1000;
  label.raycast = () => {};
  person.add(label);

}
export interface DumpBedBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floorY: number;
  wallHeight: number;
  center: THREE.Vector3;
}

export interface ReturnUnitTrajectory {
  conveyorBottom: THREE.Vector3;
  conveyorTop: THREE.Vector3;
  chuteEntry: THREE.Vector3;
  chuteExit: THREE.Vector3;
}

export class ConstructionScene {
  public sceneGroup: THREE.Group;
  public dumpTruckGroup: THREE.Group;
  public returnUnitGroup: THREE.Group;
  public dumpBedBounds: DumpBedBounds;
  public pitCenter: THREE.Vector3;
  public poolBounds: { minX: number; maxX: number; minZ: number; maxZ: number; height: number };
  public returnTrajectory?: ReturnUnitTrajectory;
  public scoreMeshCanvas: HTMLCanvasElement;
  public scoreTexture: THREE.CanvasTexture
  private spectator01Illustration?: THREE.Sprite;
  private spectator01FrontTexture?: THREE.Texture;
  private spectator01SideTexture?: THREE.Texture;
  private spectator02Illustration?: THREE.Sprite;
  private spectator02SideTexture?: THREE.Texture;
  private spectator02FrontTexture?: THREE.Texture;
  // A slot is a fixed pedestrian lane; the character profile is rotated only when that slot re-enters.
  private mallWalkers: Array<{
    id: string;
    sprite: THREE.Sprite;
    poseTextures: THREE.Texture[];
    characterId: string;
    characterPoolIndex: number;
    route: THREE.Vector3[];
    routeProgress: number;
    routeSpeed: number;
    baseRouteSpeed: number;
    startDelay: number;
    spawnCount: number;
    phase: number;
  }> = [];
  private mallWalkerFrame = 0;

  private mallWalkerPoseSets: Record<string, THREE.Texture[]> = {};
  /** Reused on route completion; every profile has its own four walking cuts. */
  // The pool is rebuilt from profiles marked useAsWalker.
  private mallWalkerCharacterPool: string[] = [];
  /** Debug order cursor: 101+ first, then the available 01+ profiles. */
  private mallWalkerNextCharacterIndex = 0;
  private mallWalkerSpeedMultipliers = [0.86, 0.91, 0.96, 1.00, 1.04, 1.09, 1.14];
  private mallCharacterCatalog: Record<string, { viewingVariants: string[]; walkingPoses?: THREE.Texture[] }> = {};
  private spectatorCutTextures: Record<string, THREE.Texture> = {};

  /** Each character's walking multiplier is managed in its profile. */
  private getMallWalkerCharacterScale(characterId: string) {
    return characterProfileById[characterId]?.walkerScale ?? 1;
  }

  /** Keeps a stable world size; the PerspectiveCamera supplies the visual depth. */
  private updateMallWalkerScale(sprite: THREE.Sprite, characterId: string, _worldZ: number) {
    const characterScale = this.getMallWalkerCharacterScale(characterId);
    const scale = characterScale;
    const textureImage = (sprite.material as THREE.SpriteMaterial).map?.image as { width?: number; height?: number } | undefined;
    const aspect = textureImage?.width && textureImage?.height ? textureImage.width / textureImage.height : 2 / 3;
    sprite.scale.set(2.31 * aspect * scale, 2.31 * scale, 1);
  }
  /** Uses a deterministic debug sequence while avoiding duplicates already on-screen. */
  private pickUnusedMallWalkerCharacter(excludedSprite: THREE.Sprite) {
    const activeCharacterIds = new Set(
      this.mallWalkers
        .filter((walker) => walker.sprite !== excludedSprite)
        .map((walker) => walker.characterId),
    );
    for (let offset = 0; offset < this.mallWalkerCharacterPool.length; offset++) {
      const index = (this.mallWalkerNextCharacterIndex + offset) % this.mallWalkerCharacterPool.length;
      const id = this.mallWalkerCharacterPool[index];
      if (!activeCharacterIds.has(id)) {
        this.mallWalkerNextCharacterIndex = (index + 1) % this.mallWalkerCharacterPool.length;
        return id;
      }
    }
    const fallback = this.mallWalkerCharacterPool[this.mallWalkerNextCharacterIndex];
    this.mallWalkerNextCharacterIndex = (this.mallWalkerNextCharacterIndex + 1) % this.mallWalkerCharacterPool.length;
    return fallback;
  }  /** Sofa footprint plus visual clearance for the billboard width. Checked only at spawn. */
  private ensureMallWalkerRouteAvoidsSofa(route: THREE.Vector3[]) {
    const bounds = { minX: -9.70, maxX: -6.70, minZ: -2.00, maxZ: 2.00 };
    const segmentCrossesBounds = (from: THREE.Vector3, to: THREE.Vector3) => {
      const samples = 24;
      for (let index = 0; index <= samples; index++) {
        const t = index / samples;
        const x = THREE.MathUtils.lerp(from.x, to.x, t);
        const z = THREE.MathUtils.lerp(from.z, to.z, t);
        if (x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ) return true;
      }
      return false;
    };
    const isSafe = route.slice(0, -1).every((point, index) => !segmentCrossesBounds(point, route[index + 1]));
    if (isSafe) return route;

    const start = route[0];
    const end = route[route.length - 1];
    const travelsToPositiveZ = end.z > start.z;
    const averageX = route.reduce((sum, point) => sum + point.x, 0) / route.length;
    const bypassX = averageX < (bounds.minX + bounds.maxX) / 2 ? bounds.minX - 0.35 : bounds.maxX + 0.35;
    const entryZ = travelsToPositiveZ ? bounds.minZ - 0.35 : bounds.maxZ + 0.35;
    const exitZ = travelsToPositiveZ ? bounds.maxZ + 0.35 : bounds.minZ - 0.35;
    return [start.clone(), new THREE.Vector3(bypassX, 0, entryZ), new THREE.Vector3(bypassX, 0, exitZ), end.clone()];
  }
  /** Returns an inspectable ID/type/world-position listing for debug tools. */
  public getObjectIdList() {
    this.sceneGroup.updateMatrixWorld(true);
    const entries: Array<{ id: string; type: string; x: number; y: number; z: number }> = [];
    this.sceneGroup.traverse((object) => {
      if (typeof object.userData.id !== 'string') return;
      const world = object.getWorldPosition(new THREE.Vector3());
      entries.push({
        id: object.userData.id,
        type: typeof object.userData.type === 'string' ? object.userData.type : 'unknown',
        x: world.x,
        y: world.y,
        z: world.z,
      });
    });
    return entries;
  }
  private getReactionSpectatorSprites(reaction: 'critical' | 'disappointed' | 'ambient') {
    const entries: Array<{ sprite: THREE.Sprite; profile: (typeof characterProfiles)[number] }> = [];
    this.sceneGroup.traverse((object) => {
      if (!(object instanceof THREE.Sprite)) return;
      const ownerId = object.userData.ownerId;
      if (typeof ownerId !== 'string' || !ownerId.startsWith('spectator_')) return;
      const profile = characterProfileById[ownerId];
      if (!profile) return;
      const override = reaction === 'critical'
        ? profile.criticalEnabled
        : reaction === 'disappointed'
          ? profile.disappointedEnabled
          : undefined;
      if (reaction === 'ambient' || (override ?? true)) entries.push({ sprite: object, profile });
    });
    return entries;
  }

  private applySpectatorCut(sprite: THREE.Sprite, profile: (typeof characterProfiles)[number], cutIndex: number) {
    const fallbackAsset = cutIndex === 7
      ? profile.spectatorAsset.replace('viewing-01-smile.png', 'viewing-07-banzai.png')
      : cutIndex === 8
        ? profile.spectatorAsset.replace('viewing-01-smile.png', 'viewing-08-disappointed.png')
        : profile.spectatorAsset;
    const asset = profile.viewingAssets?.[cutIndex - 1] ?? fallbackAsset;
    const url = asset && getSpectatorAssetUrl(asset);
    if (!url) return;
    const texture = this.spectatorCutTextures[asset] ?? new THREE.TextureLoader().load(url);
    this.spectatorCutTextures[asset] = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = sprite.material as THREE.SpriteMaterial;
    if (material.map === texture) return;
    material.map = texture;
    material.needsUpdate = true;
  }

  /** Switches every registered stationary spectator. Kept for compatibility. */
  public setSpectatorViewingCut(cutIndex: number) {
    this.sceneGroup.traverse((object) => {
      if (!(object instanceof THREE.Sprite)) return;
      const ownerId = object.userData.ownerId;
      if (typeof ownerId !== 'string' || !ownerId.startsWith('spectator_')) return;
      const profile = characterProfileById[ownerId];
      if (profile) this.applySpectatorCut(object, profile, cutIndex);
    });
  }

  /** Applies a reaction to all spectators unless disabled by a per-profile override. */
  public setSpectatorReactionCut(cutIndex: number, reaction: 'critical' | 'disappointed', batch?: 0 | 1) {
    const entries = this.getReactionSpectatorSprites(reaction);
    entries.forEach((entry, index) => {
      if (batch !== undefined && index % 2 !== batch) return;
      this.applySpectatorCut(entry.sprite, entry.profile, cutIndex);
    });
  }

  /** Changes a random sample of spectators with complete viewing-cut assets. */
  public setRandomAmbientSpectatorCuts(count: number) {
    const entries = this.getReactionSpectatorSprites('ambient').filter(({ profile }) => (profile.viewingAssets?.length ?? 0) >= 6);
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    entries.slice(0, Math.min(count, entries.length)).forEach((entry) => {
      const cutIndex = Math.random() < 0.5 ? 1 : 2 + Math.floor(Math.random() * 5);
      this.applySpectatorCut(entry.sprite, entry.profile, cutIndex);
    });
  }
  constructor() {
    this.sceneGroup = new THREE.Group();
    this.sceneGroup.name = 'PC01AttractionScene';
    // Preload normal and banzai cuts before gameplay, so critical switching never
    // starts image IO during lever movement.
    const preloadLoader = new THREE.TextureLoader();
    characterProfiles.filter((profile) => profile.useAsSpectator).forEach((profile) => {
      const assets = [
        profile.viewingAssets?.[0] ?? profile.spectatorAsset,
        profile.viewingAssets?.[6] ?? profile.spectatorAsset.replace('viewing-01-smile.png', 'viewing-07-banzai.png'),
        profile.viewingAssets?.[7] ?? profile.spectatorAsset.replace('viewing-01-smile.png', 'viewing-08-disappointed.png'),
      ];
      assets.forEach((asset) => {
        const url = getSpectatorAssetUrl(asset);
        if (!url || this.spectatorCutTextures[asset]) return;
        const texture = preloadLoader.load(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        this.spectatorCutTextures[asset] = texture;
      });
    });

    const celGradient = getHandDrawnIllustrationGradient();

    // Hand-Drawn Illustration Style Materials (手描きイラスト�E絵本風)
    const floorTileMat = new THREE.MeshToonMaterial({
      color: 0xfefce8, // Warm drawing paper cream showroom floor
      gradientMap: celGradient,
    });
    const zoneMat = new THREE.MeshToonMaterial({
      color: 0xf1f5f9,
      gradientMap: celGradient,
    });
    const pipeMetalMat = new THREE.MeshToonMaterial({
      color: 0x94a3b8,
      gradientMap: celGradient,
    });
    const pipeJointMat = new THREE.MeshToonMaterial({
      color: 0x334155,
      gradientMap: celGradient,
    });
    const clearPanelMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.82,
      opacity: 0.45,
      transparent: true,
      roughness: 0.1,
      metalness: 0.0,
      ior: 1.45,
    });
    const poolFloorMat = new THREE.MeshToonMaterial({
      color: 0x0284c7, // Warm cobalt picture-book pool floor
      gradientMap: celGradient,
    });

    // 1. Clean Anime Showroom Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24.5, 40), floorTileMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-2.25, 0, 0);
    floor.receiveShadow = true;
    this.sceneGroup.add(floor);
    this.buildMallFloorOverlay(celGradient);

    // Operator platform zone
    const workZone = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 7.5), zoneMat);
    workZone.rotation.x = -Math.PI / 2;
    workZone.position.set(0.3, 0.005, 1.8);
    workZone.receiveShadow = true;
    this.sceneGroup.add(workZone);

    // ==========================================
    // 2. Square Color Ball Pool (正方形のカラーボ�Eルプ�Eル)
    // ==========================================
    this.pitCenter = new THREE.Vector3(0, 0.15, 2.25);
    const poolSize = 2.4;
    const poolDepth = 0.38;
    this.poolBounds = {
      minX: -poolSize / 2,
      maxX: poolSize / 2,
      minZ: this.pitCenter.z - poolSize / 2,
      maxZ: this.pitCenter.z + poolSize / 2,
      height: poolDepth,
    };

    const poolFloor = new THREE.Mesh(new THREE.PlaneGeometry(poolSize, poolSize), poolFloorMat);
    poolFloor.rotation.x = -Math.PI / 2;
    poolFloor.position.set(0, 0.02, this.pitCenter.z);
    poolFloor.receiveShadow = true;
    this.sceneGroup.add(poolFloor);

    // Clear Acrylic Walls
    const wallHalf = poolSize / 2;
    const pZ = this.pitCenter.z;

    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(poolSize, poolDepth, 0.04), clearPanelMat);
    frontWall.position.set(0, poolDepth / 2, pZ + wallHalf);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(poolSize, poolDepth, 0.04), clearPanelMat);
    backWall.position.set(0, poolDepth / 2, pZ - wallHalf);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.04, poolDepth, poolSize), clearPanelMat);
    leftWall.position.set(-wallHalf, poolDepth / 2, pZ);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.04, poolDepth, poolSize), clearPanelMat);
    rightWall.position.set(wallHalf, poolDepth / 2, pZ);

    registerObjectId(poolFloor, 'ball_pool_01', 'event_equipment', 'POOL', 0.75);
    [frontWall, backWall, leftWall, rightWall].forEach((wall) => { wall.userData.ownerId = 'ball_pool_01'; });
    this.sceneGroup.add(frontWall, backWall, leftWall, rightWall);

    // Anime Pipe Railing around Pool
    const pipeRadius = 0.026;
    const pipeTopY = poolDepth + 0.02;

    const topRailF = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, poolSize + 0.08, 12), pipeMetalMat);
    topRailF.rotateZ(Math.PI / 2);
    topRailF.position.set(0, pipeTopY, pZ + wallHalf);

    const topRailB = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, poolSize + 0.08, 12), pipeMetalMat);
    topRailB.rotateZ(Math.PI / 2);
    topRailB.position.set(0, pipeTopY, pZ - wallHalf);

    const topRailL = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, poolSize + 0.08, 12), pipeMetalMat);
    topRailL.rotateX(Math.PI / 2);
    topRailL.position.set(-wallHalf, pipeTopY, pZ);

    const topRailR = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, poolSize + 0.08, 12), pipeMetalMat);
    topRailR.rotateX(Math.PI / 2);
    topRailR.position.set(wallHalf, pipeTopY, pZ);

    this.sceneGroup.add(topRailF, topRailB, topRailL, topRailR);

    // Corner vertical posts
    const corners = [
      [-wallHalf, pZ + wallHalf],
      [wallHalf, pZ + wallHalf],
      [-wallHalf, pZ - wallHalf],
      [wallHalf, pZ - wallHalf],
    ];

    corners.forEach(([cx, cz]) => {
      const vPost = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeTopY, 12), pipeMetalMat);
      vPost.position.set(cx, pipeTopY / 2, cz);

      const joint = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), pipeJointMat);
      joint.position.set(cx, pipeTopY, cz);

      const baseFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), pipeJointMat);
      baseFlange.position.set(cx, 0.01, cz);

      this.sceneGroup.add(vPost, joint, baseFlange);
    });

    // ==========================================
    // 3. Wheeled Dump Basket (プ�Eルの横に平行に配置)
    // ==========================================
    const basketX = 1.85;
    const basketZ = 1.75;

    this.dumpTruckGroup = new THREE.Group();
    this.dumpTruckGroup.position.set(basketX, 0, basketZ);
    this.dumpTruckGroup.rotation.y = 0; // Parallel along Z
    this.sceneGroup.add(this.dumpTruckGroup);

    this.buildDumpBasket(celGradient);
    registerObjectId(this.dumpTruckGroup, 'dump_basket_01', 'event_equipment', 'DUMP', 1.3);

    this.dumpBedBounds = {
      minX: basketX - 0.58,
      maxX: basketX + 0.58,
      minZ: basketZ - 0.72,
      maxZ: basketZ + 0.72,
      floorY: 0.36,
      wallHeight: 0.65,
      center: new THREE.Vector3(basketX, 0.45, basketZ),
    };

    // ==========================================
    // 4. Ball Back Unit (バスケチE��の後ろ・プ�Eルのすぐ隣に配置)
    // ==========================================
    this.returnUnitGroup = new THREE.Group();
    this.sceneGroup.add(this.returnUnitGroup);

    // Behind the basket (Z ≁E2.80) and right next to the pool (X ≁E1.48)
    const returnUnitX = 1.48;
    const returnUnitZ = 3.25;
    this.buildBallReturnUnit(celGradient, returnUnitX, returnUnitZ);
    registerObjectId(this.returnUnitGroup, 'ball_return_01', 'event_equipment', 'RETURN', 1.7);

    // ==========================================
    // 5. LED Scoreboard (別ユニットとして現状の位置に固宁E X = -0.16, Z = 3.65)
    // ==========================================
    const scoreGroup = new THREE.Group();
    const scoreX = -0.16;
    const scoreZ = 3.65;
    scoreGroup.position.set(scoreX, 0, scoreZ);
    // Align orientation parallel to the pool wall (facing straight towards pool and operator)
    scoreGroup.rotation.y = 0;

    const scorePostL = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, 1.35, 8), pipeMetalMat);
    scorePostL.position.set(-0.36, 0.675, 0);
    const scorePostR = new THREE.Mesh(new THREE.CylinderGeometry(pipeRadius, pipeRadius, 1.35, 8), pipeMetalMat);
    scorePostR.position.set(0.36, 0.675, 0);
    scoreGroup.add(scorePostL, scorePostR);

    this.scoreMeshCanvas = document.createElement('canvas');
    this.scoreMeshCanvas.width = 512;
    this.scoreMeshCanvas.height = 256;
    this.scoreTexture = new THREE.CanvasTexture(this.scoreMeshCanvas);
    this.updateLoadedCountDisplay(0);

    // Frame backing
    const frameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.52, 0.08),
      new THREE.MeshToonMaterial({ color: 0x1e293b, gradientMap: celGradient })
    );
    frameBox.position.set(0, 1.05, 0);
    scoreGroup.add(frameBox);

    // Front screen facing directly towards the pool & excavator (-Z direction)
    const signPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.88, 0.48),
      new THREE.MeshBasicMaterial({ map: this.scoreTexture })
    );
    signPlane.position.set(0, 1.05, -0.042);
    signPlane.rotation.y = Math.PI; // Face texture towards -Z (pool & operator)
    scoreGroup.add(signPlane);

    registerObjectId(scoreGroup, 'scoreboard_01', 'event_equipment', 'SCORE', 1.75);
    this.sceneGroup.add(scoreGroup);

    // ==========================================
    // 6. Visual-only safety fence for the compact event area.
    // It intentionally has no physics or collision representation.
    // ==========================================
    this.buildSafetyFence(celGradient);
    this.buildSpectatorTestModels(celGradient);
    this.buildEventDecorations(celGradient);
    this.buildMallBackground(celGradient);
    try {
      this.buildMallWalkers();
    } catch (error) {
      // Pedestrians are decorative: a missing optional image must never block the game itself.
      console.error('Mall walker setup skipped:', error);
    }
  }

  private buildSafetyFence(celGradient: THREE.CanvasTexture) {
    const fenceGroup = new THREE.Group();
    fenceGroup.name = 'EventSafetyFence_VisualOnly';

    // Keep the 3D forms, but add a subtle colored-pencil grain instead of flat plastic color.
    const createCrayonTexture = (baseColor: string, pencilColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = pencilColor;
      ctx.lineWidth = 1.3;
      ctx.globalAlpha = 0.22;
      for (let index = 0; index < 110; index++) {
        const x = (index * 37) % 128;
        const y = (index * 61) % 128;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 13 + (index % 7), y + 3 + (index % 5));
        ctx.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      return texture;
    };
    const yellowMat = new THREE.MeshToonMaterial({ map: createCrayonTexture('#facc15', '#a16207'), color: 0xffffff, gradientMap: celGradient });
    const blackMat = new THREE.MeshToonMaterial({ map: createCrayonTexture('#1e293b', '#0f172a'), color: 0xffffff, gradientMap: celGradient });
    const coneMat = new THREE.MeshToonMaterial({ map: createCrayonTexture('#f04b23', '#a52c1b'), color: 0xffffff, gradientMap: celGradient });
    // Keep the visual-only boundary close to the equipment while remaining outside the authored reach envelope.
    const fenceWidth = 6.6;
    const fenceDepth = 7.3;
    const fenceCenterZ = 0.35;
    const coneHeight = 0.771;
    const poleHeight = coneHeight - 0.132;
    const poleRadius = 0.038;
    // Keep the cone bases within the previous fence's visual outer footprint.
    const halfW = fenceWidth / 2 - 0.15;
    const halfD = fenceDepth / 2 - 0.15;

    // Four corners plus one cone at the middle of each side.
    const conePositions: Array<[number, number]> = [
      [-halfW, fenceCenterZ - halfD], [0, fenceCenterZ - halfD], [halfW, fenceCenterZ - halfD],
      [halfW, fenceCenterZ], [halfW, fenceCenterZ + halfD], [0, fenceCenterZ + halfD],
      [-halfW, fenceCenterZ + halfD], [-halfW, fenceCenterZ],
    ];
    conePositions.forEach(([x, z]) => {
      // Red square pedestal and a solid-red cone: no black rubber weight or reflective band.
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.396, 0.066, 0.396), coneMat);
      base.position.set(x, 0.033, z);
      fenceGroup.add(base);

      // A slightly taller, softly rounded cone: a small spherical cap replaces the sharp point.
      const coneBodyHeight = coneHeight - 0.066 - 0.035;
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.1815, coneBodyHeight, 16), coneMat);
      cone.position.set(x, 0.066 + coneBodyHeight / 2, z);
      fenceGroup.add(cone);
      const roundedTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), coneMat);
      roundedTip.position.set(x, coneHeight - 0.035, z);
      fenceGroup.add(roundedTip);

      // A real 3D collar wraps around the cone neck; the tora-pole meets this collar, not the cone tip.
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.0792, 0.0264, 8, 16), blackMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.set(x, coneHeight - 0.132, z);
      fenceGroup.add(collar);
    });

    const addToraPole = (start: [number, number], end: [number, number]) => {
      const dx = end[0] - start[0];
      const dz = end[1] - start[1];
      const length = Math.hypot(dx, dz);
      const centerX = (start[0] + end[0]) / 2;
      const centerZ = (start[1] + end[1]) / 2;
      const sectionCount = 5;
      for (let index = 0; index < sectionCount; index++) {
        const sectionLength = length / sectionCount + 0.008;
        const distance = -length / 2 + (index + 0.5) * (length / sectionCount);
        const section = new THREE.Mesh(
          new THREE.CylinderGeometry(poleRadius, poleRadius, sectionLength, 12),
          index % 2 === 0 ? yellowMat : blackMat
        );
        section.rotation.z = Math.PI / 2;
        section.rotation.y = -Math.atan2(dz, dx);
        section.position.set(centerX + (dx / length) * distance, poleHeight, centerZ + (dz / length) * distance);
        fenceGroup.add(section);
      }
    };

    for (let index = 0; index < conePositions.length; index++) {
      addToraPole(conePositions[index], conePositions[(index + 1) % conePositions.length]);
    }

    registerObjectId(fenceGroup, 'safety_fence_01', 'safety_equipment', 'FENCE', 0.9);
    this.sceneGroup.add(fenceGroup);
  }
  private buildSpectatorTestModels(celGradient: THREE.CanvasTexture) {
    validateCharacterRegistry();
    const spectators = new THREE.Group();
    spectators.name = 'SpectatorTestModels_VisualOnly';
    const skinMat = new THREE.MeshToonMaterial({ color: 0xf1c29b, gradientMap: celGradient });
    const hairMats = [0x3f2a22, 0x5b3a29, 0x1f2937].map((color) =>
      new THREE.MeshToonMaterial({ color, gradientMap: celGradient })
    );
    const shoeMat = new THREE.MeshToonMaterial({ color: 0x334155, gradientMap: celGradient });

    type SpectatorPose = 'watch' | 'lean' | 'wave' | 'clap';
    let spectatorCount = 0;
    let childCount = 0;
    let passerbyCount = 0;
    let peopleCreated = 0;
    const addSpectator = (
      x: number,
      z: number,
      height: number,
      shirtColor: number,
      hairIndex: number,
      pose: SpectatorPose,
      targetX: number,
      targetZ: number
    ) => {
      const person = new THREE.Group();
      const shirtMat = new THREE.MeshToonMaterial({ color: shirtColor, gradientMap: celGradient });
      // S01 anchors the rear row and S02 anchors the right-side viewing row.
      // All following people keep the existing low-poly construction unchanged.
      const illustratedProfile = characterProfiles.find(
        (profile) => profile.useAsSpectator && spectatorPlacements[profile.id]?.sceneSlot === peopleCreated
      );
      // The remaining simple figures are deliberately hidden; only registered hand-drawn spectators remain.
      if (!illustratedProfile) {
        peopleCreated += 1;
        return;
      }
      if (illustratedProfile) {
        const placement = spectatorPlacements[illustratedProfile.id];
        const illustrationUrl = getSpectatorAssetUrl(placement.viewingAsset ?? illustratedProfile.spectatorAsset);
        if (!illustrationUrl) {
          console.warn(`[CharacterRegistry] ${illustratedProfile.id}: fixed viewer image is missing.`);
          peopleCreated += 1;
          return;
        }
        const illustrationTexture = new THREE.TextureLoader().load(illustrationUrl);
        illustrationTexture.colorSpace = THREE.SRGBColorSpace;
        const illustration = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: illustrationTexture,
            transparent: true,
            alphaTest: 0.01,
            depthWrite: false,
          })
        );
        illustration.name = `${illustratedProfile.id}__handdrawn_billboard`;
        illustration.userData.ownerId = illustratedProfile.id;
        illustration.userData.nonInteractive = true;
        illustration.center.set(0.5, 0);
        const illustrationHeight = (placement.baseHeight ?? 2.25) * illustratedProfile.spectatorScale;
        illustration.scale.set(illustrationHeight * (placement.aspectRatio ?? 2 / 3), illustrationHeight, 1);
        illustration.renderOrder = 1;
        illustration.raycast = () => {};
        person.add(illustration);
      } else if (peopleCreated === 0) {
        const headRadius = height * 0.104;
        const upperLegLength = height * 0.205;
        const lowerLegLength = height * 0.175;
        const hipY = upperLegLength + lowerLegLength;
        const torsoHeight = height * 0.285;
        const bodyWidth = height * 0.132;
        const shoulderY = hipY + torsoHeight * 0.78;
        const headY = hipY + torsoHeight + height * 0.052 + headRadius * 0.86;
        const darkBlueMat = new THREE.MeshToonMaterial({ color: 0x164e9c, gradientMap: celGradient });
        const lightBlueMat = new THREE.MeshToonMaterial({ color: 0x4f9cf7, gradientMap: celGradient });
        const faceMat = new THREE.MeshToonMaterial({ color: 0xd79570, gradientMap: celGradient });
        const mouthMat = new THREE.MeshToonMaterial({ color: 0xb85c61, gradientMap: celGradient });
        const eyeMat = new THREE.MeshToonMaterial({ color: 0x243046, gradientMap: celGradient });
        const hairMat = hairMats[hairIndex];

        [-1, 1].forEach((side) => {
          const thigh = new THREE.Mesh(new THREE.CylinderGeometry(bodyWidth * 0.40, bodyWidth * 0.50, upperLegLength, 8), shoeMat);
          thigh.position.set(side * bodyWidth * 0.50, lowerLegLength + upperLegLength / 2, 0);
          thigh.rotation.z = side * 0.04;
          person.add(thigh);
          const shin = new THREE.Mesh(new THREE.CylinderGeometry(bodyWidth * 0.31, bodyWidth * 0.40, lowerLegLength, 8), shoeMat);
          shin.position.set(side * bodyWidth * 0.53, lowerLegLength / 2, height * 0.012);
          shin.rotation.z = side * -0.05;
          person.add(shin);
          const shoe = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.60, 10, 7), shoeMat);
          shoe.scale.set(1.18, 0.40, 1.46);
          shoe.position.set(side * bodyWidth * 0.53, bodyWidth * 0.20, -bodyWidth * 0.32);
          person.add(shoe);
        });

        const hips = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.92, 12, 8), darkBlueMat);
        hips.scale.set(1, 0.48, 0.78);
        hips.position.set(0, hipY + height * 0.012, 0);
        person.add(hips);
        const torso = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth, 14, 10), shirtMat);
        torso.scale.set(1.20, torsoHeight / (bodyWidth * 2), 0.82);
        torso.position.set(0, hipY + torsoHeight * 0.48, 0);
        person.add(torso);
        const chestHighlight = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.78, 12, 8), lightBlueMat);
        chestHighlight.scale.set(0.82, 0.82, 0.18);
        chestHighlight.position.set(-bodyWidth * 0.15, hipY + torsoHeight * 0.60, -bodyWidth * 0.68);
        person.add(chestHighlight);

        const neck = new THREE.Mesh(new THREE.CylinderGeometry(headRadius * 0.29, headRadius * 0.34, height * 0.068, 8), skinMat);
        neck.position.set(0, hipY + torsoHeight + height * 0.028, 0);
        person.add(neck);
        const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 14, 11), skinMat);
        head.scale.set(0.91, 1.14, 0.90);
        head.position.set(0, headY, 0);
        person.add(head);
        const cheekLeft = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.26, 8, 6), faceMat);
        cheekLeft.scale.set(1.0, 0.60, 0.16);
        cheekLeft.position.set(-headRadius * 0.54, headY - headRadius * 0.18, -headRadius * 0.82);
        person.add(cheekLeft);
        const cheekRight = cheekLeft.clone();
        cheekRight.position.x *= -1;
        person.add(cheekRight);

        const hairBack = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.045, 14, 10), hairMat);
        hairBack.scale.set(0.96, 1.10, 0.93);
        hairBack.position.set(0, headY + headRadius * 0.11, headRadius * 0.08);
        person.add(hairBack);
        const faceFront = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.91, 14, 10), skinMat);
        faceFront.scale.set(0.96, 1.12, 0.72);
        faceFront.position.set(0, headY - headRadius * 0.015, -headRadius * 0.17);
        person.add(faceFront);
        const hairTop = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.01, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
        hairTop.position.set(0, headY + headRadius * 0.25, -headRadius * 0.08);
        person.add(hairTop);
        [-1, 1].forEach((side) => {
          const sideHair = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.34, 8, 7), hairMat);
          sideHair.scale.set(0.64, 1.46, 0.50);
          sideHair.position.set(side * headRadius * 0.77, headY + headRadius * 0.04, -headRadius * 0.22);
          person.add(sideHair);
          const fringe = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.30, 8, 6), hairMat);
          fringe.scale.set(0.88, 1.15, 0.36);
          fringe.position.set(side * headRadius * 0.33, headY + headRadius * 0.38, -headRadius * 0.76);
          fringe.rotation.z = side * 0.18;
          person.add(fringe);
          const eye = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.092, 8, 6), eyeMat);
          eye.scale.set(0.72, 1.08, 0.30);
          eye.position.set(side * headRadius * 0.31, headY + headRadius * 0.02, -headRadius * 0.85);
          person.add(eye);
        });
        const nose = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.075, 8, 6), faceMat);
        nose.scale.set(0.70, 0.84, 0.76);
        nose.position.set(0, headY - headRadius * 0.10, -headRadius * 0.93);
        person.add(nose);
        const smile = new THREE.Mesh(new THREE.TorusGeometry(headRadius * 0.20, headRadius * 0.027, 6, 12, Math.PI), mouthMat);
        smile.rotation.set(0, Math.PI, 0);
        smile.position.set(0, headY - headRadius * 0.34, -headRadius * 0.91);
        person.add(smile);

        [-1, 1].forEach((side) => {
          const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(bodyWidth * 0.29, bodyWidth * 0.35, height * 0.17, 8), shirtMat);
          upperArm.position.set(side * bodyWidth * 1.16, shoulderY - height * 0.075, -height * 0.015);
          upperArm.rotation.z = side * 0.58;
          person.add(upperArm);
          const forearm = new THREE.Mesh(new THREE.CylinderGeometry(bodyWidth * 0.22, bodyWidth * 0.27, height * 0.145, 8), skinMat);
          forearm.position.set(side * bodyWidth * 1.35, shoulderY - height * 0.205, -height * 0.055);
          forearm.rotation.z = side * 0.30;
          person.add(forearm);
          const hand = new THREE.Mesh(new THREE.SphereGeometry(bodyWidth * 0.31, 9, 7), skinMat);
          hand.scale.set(0.82, 1.10, 0.70);
          hand.position.set(side * bodyWidth * 1.43, shoulderY - height * 0.285, -height * 0.075);
          person.add(hand);
        });      } else {
        const bodyRadius = height * 0.095;
        const legLength = height * 0.36;
        const torsoHeight = height * 0.35;
        const headRadius = height * 0.105;
        const shoulderY = legLength + torsoHeight * 0.82;

        [-1, 1].forEach((side) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.48, bodyRadius * 0.58, legLength, 8), shoeMat);
          leg.position.set(side * bodyRadius * 0.52, legLength / 2, 0);
          person.add(leg);
        });

        const torso = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 10, 8), shirtMat);
        torso.scale.set(1, torsoHeight / (bodyRadius * 2), 0.78);
        torso.position.set(0, legLength + torsoHeight / 2, 0);
        person.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 12, 10), skinMat);
        head.position.set(0, legLength + torsoHeight + headRadius * 0.92, 0);
        person.add(head);
        const hair = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 1.03, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMats[hairIndex]);
        hair.position.copy(head.position);
        hair.position.y += headRadius * 0.12;
        person.add(hair);

        const addArm = (side: number, angle: number) => {
          const arm = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.34, bodyRadius * 0.40, height * 0.31, 8), skinMat);
          arm.position.set(side * bodyRadius * 0.98, shoulderY - height * 0.13, 0);
          arm.rotation.z = side * angle;
          person.add(arm);
        };
        if (pose === 'wave') {
          addArm(-1, 0.15);
          addArm(1, -2.35);
        } else if (pose === 'clap') {
          addArm(-1, 0.72);
          addArm(1, -0.72);
        } else if (pose === 'lean') {
          addArm(-1, 0.42);
          addArm(1, -0.18);
          person.rotation.x = 0.12;
        } else {
          addArm(-1, 0.16);
          addArm(1, -0.16);
        }
      }
      const registeredPlacement = illustratedProfile ? spectatorPlacements[illustratedProfile.id] : undefined;
      person.position.set(registeredPlacement?.x ?? x, 0, registeredPlacement?.z ?? z);
      person.lookAt(targetX, height * 0.52, targetZ);
      const isPasserby = peopleCreated >= 19;
      const isChild = !isPasserby && height < 1.5;
      const id = illustratedProfile?.id ?? (isPasserby
        ? `passerby_${String(++passerbyCount).padStart(2, '0')}`
        : isChild
          ? `child_${String(++childCount).padStart(2, '0')}`
          : `spectator_${String(++spectatorCount).padStart(2, '0')}`);
      const label = illustratedProfile
        ? id.replace('spectator_', 'S')
        : isPasserby
          ? `PB${String(passerbyCount).padStart(2, '0')}`
          : isChild
            ? `C${String(childCount).padStart(2, '0')}`
            : `P${String(spectatorCount).padStart(2, '0')}`;
      const objectType = illustratedProfile ? 'spectator' : isPasserby ? 'passerby' : isChild ? 'child' : 'spectator';
      registerObjectId(person, id, objectType, label, height + 0.18);
      if (id === 'spectator_01') addSpectator01Highlight(person, height);
      peopleCreated += 1;
      spectators.add(person);
    };

    // Pool far side: two adults and one child, all outside the rear tora-pole.
    addSpectator(-2.35, 4.45, 1.978, 0x2563eb, 0, 'watch', -0.4, 2.25);
    addSpectator(2.35, 4.40, 1.900, 0xec4899, 1, 'clap', 1.05, 2.40);
    addSpectator(0.95, 4.29, 1.369, 0x38bdf8, 2, 'lean', 0, 2.25);
    // Pool far side: add three more viewers for a compact six-person row.
    addSpectator(-2.10, 4.34, 1.89, 0x16a34a, 1, 'watch', -0.3, 2.4);
    addSpectator(1.82, 4.27, 1.31, 0xa855f7, 0, 'wave', 0.3, 2.3);
    addSpectator(2.54, 4.36, 1.84, 0xeab308, 2, 'clap', 0.6, 2.35);

    // Dump basket side: four viewers outside the right tora-pole.
    addSpectator(-2.80, -4.65, 1.86, 0x0ea5e9, 1, 'lean', -0.4, 0.8);
    addSpectator(-3.60, 1.48, 1.25, 0xf43f5e, 0, 'watch', -0.6, 2.0);
    addSpectator(-3.74, -0.14, 1.949, 0xf97316, 2, 'wave', -0.4, 2.3);
    addSpectator(3.63, 2.55, 1.264, 0x22c55e, 0, 'watch', 0.7, 2.25);
    // Ball-back side: two viewers outside the right-rear tora-pole.
    addSpectator(3.71, 3.20, 1.92, 0x4f46e5, 0, 'watch', 1.45, 3.05);
    addSpectator(3.62, 3.64, 1.28, 0xf97316, 2, 'wave', 1.45, 3.20);

    // Independent fixed viewers are created from the shared placement registry.
    const addConfiguredSpectator = (id: string) => {
      const profile = characterProfileById[id];
      const placement = spectatorPlacements[id];
      const viewingUrl = profile && placement && getSpectatorAssetUrl(placement.viewingAsset ?? profile.spectatorAsset);
      if (!profile || !placement || !viewingUrl) {
        console.warn(`[CharacterRegistry] ${id}: fixed viewer could not be created.`);
        return;
      }
      const person = new THREE.Group();
      const texture = new THREE.TextureLoader().load(viewingUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, alphaTest: 0.01, depthWrite: false }));
      sprite.name = `${id}__handdrawn_billboard`;
      sprite.userData.ownerId = id;
      sprite.userData.nonInteractive = true;
      sprite.center.set(0.5, 0);
      const height = (placement.baseHeight ?? 2.25) * profile.spectatorScale;
      sprite.scale.set(height * (placement.aspectRatio ?? 2 / 3), height, 1);
      sprite.renderOrder = 1;
      sprite.raycast = () => {};
      person.add(sprite);
      person.position.set(placement.x, 0, placement.z);
      registerObjectId(person, id, 'spectator', id.replace('spectator_', 'S'), height + 0.18);
      spectators.add(person);
    };
    characterProfiles
      .filter((profile) => profile.useAsSpectator && spectatorPlacements[profile.id]?.sceneSlot === undefined)
      .forEach((profile) => addConfiguredSpectator(profile.id));
    // Right-side family group: three extra viewers outside the tora-pole.
    addSpectator(3.43, 1.48, 1.88, 0x2563eb, 1, 'watch', 1.1, 2.0);
    addSpectator(3.43, 2.26, 1.30, 0xf43f5e, 2, 'wave', 1.0, 2.25);
    addSpectator(4.18, 3.50, 1.80, 0x16a34a, 0, 'clap', 1.4, 2.8);
    // Left-rear side: one additional adult closes the viewing ring.
    addSpectator(-3.70, 2.75, 1.85, 0xf97316, 2, 'lean', -0.4, 2.3);

    // PC01 rear side: three viewers observing the operator side.
    addSpectator(-1.08, -3.43, 1.81, 0x14b8a6, 2, 'clap', -0.1, 0.9);
    addSpectator(-0.25, -3.43, 1.837, 0xd6b48a, 1, 'lean', 0, 0.9);
    addSpectator(1.08, -3.68, 1.24, 0xec4899, 0, 'watch', 0.2, 1.0);

    // Mall passers-by use the open B-side corridor and face along Z, separate
    // from the stationary event viewers around the safety fence.
    addSpectator(-5.05, -6.35, 1.82, 0x64748b, 0, 'watch', -5.05, 2.0);
    addSpectator(-6.15, -5.05, 1.27, 0xf59e0b, 1, 'wave', -6.15, 2.0);
    addSpectator(-7.20, -3.65, 1.76, 0x14b8a6, 2, 'watch', -7.20, 2.0);
    addSpectator(-5.35, -2.15, 1.91, 0xec4899, 0, 'lean', -5.35, 2.0);
    addSpectator(-6.65, -0.55, 1.31, 0x22c55e, 1, 'wave', -6.65, -5.0);
    addSpectator(-7.35, 1.95, 1.84, 0x2563eb, 2, 'watch', -7.35, -5.0);
    addSpectator(-5.15, 3.15, 1.25, 0xa855f7, 0, 'clap', -5.15, -5.0);
    addSpectator(-6.30, 4.55, 1.88, 0xf97316, 1, 'watch', -6.30, -5.0);
    addSpectator(-7.25, 6.10, 1.34, 0x38bdf8, 2, 'lean', -7.25, -5.0);
    addSpectator(-5.55, 6.85, 1.79, 0x16a34a, 0, 'wave', -5.55, -5.0);
    addSpectator(-6.85, 7.45, 1.24, 0xf43f5e, 1, 'watch', -6.85, -5.0);
    addSpectator(-7.75, -7.25, 1.86, 0xeab308, 2, 'lean', -7.75, 2.0);

    this.sceneGroup.add(spectators);
  }
  /**
   * A deliberately tiny sprite pool for a performance-safe mall-corridor walking test.
   * No shadows, no physics, no collision/raycast work, and no React state updates.
   */
  /**
   * Three image-only walkers: no shadows, physics, collision/raycast work, or React state updates.
   * Each sprite sheet contains front / side / back poses in three equal horizontal panels.
   */
  private buildMallWalkers() {
    this.mallWalkerCharacterPool = characterProfiles
      .filter((profile) => profile.useAsWalker && profile.walkingAssets && profile.walkingAssets.every((asset) => Boolean(getSpectatorAssetUrl(asset))))
      // Initial browser load uses the 101+ walking set first; 01-100 remain rare fallback entries.
      .sort((left, right) => {
        const leftNumber = Number(left.id.replace('spectator_', ''));
        const rightNumber = Number(right.id.replace('spectator_', ''));
        const leftPreferred = leftNumber >= 101;
        const rightPreferred = rightNumber >= 101;
        if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1;
        return leftNumber - rightNumber;
      })
      .map((profile) => profile.id);
    if (this.mallWalkerCharacterPool.length === 0) return;
    const loadSprite = (asset: string) => {
      const url = getSpectatorAssetUrl(asset);
      if (!url) throw new Error(`Missing walking image: ${asset}`);
      const texture = this.spectatorCutTextures[asset] ?? new THREE.TextureLoader().load(url);
      this.spectatorCutTextures[asset] = texture;
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    this.mallWalkerPoseSets = {};
    characterProfiles
      .filter((profile) => this.mallWalkerCharacterPool.includes(profile.id) && profile.walkingAssets)
      .forEach((profile) => {
        this.mallWalkerPoseSets[profile.id] = profile.walkingAssets!.map(loadSprite);
      });

    this.mallCharacterCatalog = {};
    characterProfiles.forEach((profile) => {
      this.mallCharacterCatalog[profile.id] = {
        viewingVariants: [...(profile.viewingAssets ?? [profile.spectatorAsset])],
        walkingPoses: this.mallWalkerPoseSets[profile.id],
      };
    });

    const point = (x: number, z: number) => new THREE.Vector3(x, 0, z);
    const walkers = new THREE.Group();
    walkers.name = 'MallWalkers_VisualOnly';
    // Each fixed ID owns one separate lane. Intermediate waypoints give a mix of
    // straight, diagonal, and gentle curved paths, leaving room around sofa islands.
    const walkerSpecs = [
      { id: 'mall_walker_01', characterPoolIndex: 0, routeSpeed: 0.0108, route: [point(-13.6, -19), point(-13.6, -9), point(-13.45, 2), point(-13.55, 10), point(-13.4, 18.5)] },
      { id: 'mall_walker_02', characterPoolIndex: 1, routeSpeed: 0.0113, route: [point(-11.75, 19), point(-12.25, 11), point(-12.7, 3), point(-12.15, -7), point(-11.85, -18)] },
      { id: 'mall_walker_03', characterPoolIndex: 2, routeSpeed: 0.0099, route: [point(-10.1, -18.5), point(-10.45, -10), point(-10.7, -1.5), point(-10.35, 7.5), point(-10.25, 18.5)] },
      { id: 'mall_walker_04', characterPoolIndex: 3, routeSpeed: 0.0117, route: [point(-9.9, 18.8), point(-10.15, 10), point(-10.4, 1), point(-10.0, -8.5), point(-9.85, -18.8)] },
      { id: 'mall_walker_05', characterPoolIndex: 4, routeSpeed: 0.0104, route: [point(-6.45, -19), point(-7.25, -11), point(-7.5, -3), point(-6.75, 6.5), point(-6.15, 18)] },
      { id: 'mall_walker_06', characterPoolIndex: 5, routeSpeed: 0.0111, route: [point(-4.85, 18.5), point(-5.7, 9), point(-5.25, 0), point(-4.55, -8), point(-5.35, -19)] },
    ];

    walkerSpecs.forEach((spec, index) => {
      const safeRoute = this.ensureMallWalkerRouteAvoidsSofa(spec.route);
      const startDelay = index * 5;
      const characterId = this.mallWalkerCharacterPool[spec.characterPoolIndex % this.mallWalkerCharacterPool.length];
      const poseTextures = this.mallWalkerPoseSets[characterId];
      if (!poseTextures) throw new Error(`Missing pose set: ${characterId}`);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: poseTextures[0], transparent: true, alphaTest: 0.01, depthWrite: false }));
      sprite.name = `${spec.id}__handdrawn_walker`;
      sprite.userData.id = spec.id;
      sprite.userData.characterId = characterId;
      sprite.userData.nonInteractive = true;
      sprite.center.set(0.5, 0);
      sprite.position.copy(safeRoute[0]);
      this.updateMallWalkerScale(sprite, characterId, sprite.position.z);
      sprite.visible = startDelay === 0;
      sprite.renderOrder = 0;
      sprite.raycast = () => {};
      walkers.add(sprite);
      this.mallWalkers.push({ ...spec, route: safeRoute, sprite, poseTextures, characterId, baseRouteSpeed: spec.routeSpeed, startDelay, spawnCount: index, routeProgress: 0, phase: index * 1.9 });
    });
    this.mallWalkerNextCharacterIndex = walkerSpecs.length % this.mallWalkerCharacterPool.length;
    this.sceneGroup.add(walkers);
  }

  /** Visual-only waypoint walkers. Phones avoid changing game interaction state. */
  public updateMallWalkers(delta: number) {
    if (this.mallWalkers.length === 0) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    this.mallWalkerFrame++;
    if (isMobile && this.mallWalkerFrame % 2 !== 0) return;
    const step = Math.min(delta * (isMobile ? 2 : 1), 0.05);
    this.mallWalkers.forEach((walker, laneIndex) => {
      if (walker.startDelay > 0) {
        walker.startDelay = Math.max(0, walker.startDelay - step);
        walker.sprite.visible = walker.startDelay === 0;
        return;
      }
      walker.routeProgress += walker.routeSpeed * step;
      if (walker.routeProgress >= 1) {
        walker.routeProgress = 0;
        walker.spawnCount++;
        walker.startDelay = 0;
        walker.sprite.visible = true;
        // Re-enter with another existing character, while the lane ID stays fixed.
        walker.characterId = this.pickUnusedMallWalkerCharacter(walker.sprite);
        walker.characterPoolIndex = this.mallWalkerCharacterPool.indexOf(walker.characterId);
        walker.poseTextures = this.mallWalkerPoseSets[walker.characterId];
        const speedIndex = (walker.spawnCount * 2 + laneIndex) % this.mallWalkerSpeedMultipliers.length;
        walker.routeSpeed = walker.baseRouteSpeed * this.mallWalkerSpeedMultipliers[speedIndex];
        walker.sprite.userData.characterId = walker.characterId;

      }
      const segmentCount = walker.route.length - 1;
      const scaledProgress = walker.routeProgress * segmentCount;
      const segment = Math.min(Math.floor(scaledProgress), segmentCount - 1);
      const segmentProgress = scaledProgress - segment;
      walker.sprite.position.lerpVectors(walker.route[segment], walker.route[segment + 1], segmentProgress);
      this.updateMallWalkerScale(walker.sprite, walker.characterId, walker.sprite.position.z);
      walker.phase += step * 5.0;
      walker.sprite.position.y = Math.max(0, Math.sin(walker.phase) * 0.018);
      const walksTowardBack = walker.route[walker.route.length - 1].z > walker.route[0].z;
      // Front/back until 30%; side direction through the corridor; back near the exit.
      const poseIndex = walker.routeProgress < 0.30 ? 0 : walker.routeProgress < 0.78 ? (walksTowardBack ? 2 : 1) : 3;
      const material = walker.sprite.material as THREE.SpriteMaterial;
      if (material.map !== walker.poseTextures[poseIndex]) {
        material.map = walker.poseTextures[poseIndex];
        material.needsUpdate = true;
      }
    });
  }
  private buildEventDecorations(celGradient: THREE.CanvasTexture) {
    const decorationGroup = new THREE.Group();
    decorationGroup.name = 'EventDecorations_VisualOnly';
    const yellowMat = new THREE.MeshToonMaterial({ color: 0xfacc15, gradientMap: celGradient });
    const blueMat = new THREE.MeshToonMaterial({ color: 0x0369a1, gradientMap: celGradient });
    const poleMat = new THREE.MeshToonMaterial({ color: 0x475569, gradientMap: celGradient });
    let noboriCount = 0;
    let boardCount = 0;

    const makeTextTexture = (lines: string[], portrait: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = portrait ? 256 : 512;
      canvas.height = portrait ? 640 : 512;
      const context = canvas.getContext('2d');
      if (!context) return new THREE.CanvasTexture(canvas);
      context.fillStyle = '#facc15';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#0369a1';
      context.fillRect(16, 16, canvas.width - 32, canvas.height - 32);
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      lines.forEach((line, index) => {
        context.font = `bold ${portrait ? 28 : 34}px sans-serif`;
        context.fillText(line, canvas.width / 2, canvas.height * (0.30 + index * 0.20), canvas.width - 38);
      });
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const addNobori = (x: number, z: number, lines: string[]) => {
      const poleHeight = 1.95;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, poleHeight, 8), poleMat);
      pole.position.set(x, poleHeight / 2, z);
      decorationGroup.add(pole);
      const bannerBack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.38, 0.035), yellowMat);
      bannerBack.position.set(x + 0.27, 1.15, z);
      decorationGroup.add(bannerBack);
      const bannerFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 1.30),
        new THREE.MeshBasicMaterial({ map: makeTextTexture(lines, true), side: THREE.DoubleSide })
      );
      bannerFace.position.set(x + 0.27, 1.15, z - 0.021);
      bannerFace.rotation.y = Math.PI;
      const noboriId = 'nobori_' + String(++noboriCount).padStart(2, '0');
      registerObjectId(pole, noboriId, 'nobori', `NB${String(noboriCount).padStart(2, '0')}`, poleHeight + 0.18);
      bannerBack.userData.ownerId = noboriId;
      bannerFace.userData.ownerId = noboriId;
      decorationGroup.add(bannerFace);
    };

    // Behind the rear spectator row, well outside the safety area and equipment.

    const boardWidth = 1.90;
    const boardHeight = 1.70;
    const boardText = ['すくって！', 'はこに入れて', 'めざせ高得点！'];
    const addSideBoard = (x: number, z: number, yaw: number) => {
      const boardGroup = new THREE.Group();
      boardGroup.position.set(x, 0, z);
      boardGroup.rotation.y = yaw;
      [-0.62, 0.62].forEach((offsetX) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), poleMat);
        leg.position.set(offsetX, 0.31, 0);
        boardGroup.add(leg);
      });
      const boardBack = new THREE.Mesh(new THREE.BoxGeometry(boardWidth, boardHeight, 0.06), yellowMat);
      boardBack.position.set(0, 1.16, 0);
      boardGroup.add(boardBack);
      const boardFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.76, 1.56),
        new THREE.MeshBasicMaterial({
          map: makeTextTexture(boardText, false),
          side: THREE.DoubleSide,
        })
      );
      boardFace.position.set(0, 1.16, -0.036);
      boardFace.rotation.y = Math.PI;
      boardGroup.add(boardFace);
      const boardId = `signboard_${String(++boardCount).padStart(2, '0')}`;
      registerObjectId(boardGroup, boardId, 'signboard', `SB${String(boardCount).padStart(2, '0')}`, 2.05);
      decorationGroup.add(boardGroup);
    };

    // Side-facing boards: left faces the event centre (+X), right faces it (-X).

    // Four hand-drawn nobori replace the previous low-poly flags and side boards.
    const handdrawnNoboriTextures = [
      new THREE.TextureLoader().load(new URL('../assets/mall-background/handdrawn-nobori-red.png', import.meta.url).href),
      new THREE.TextureLoader().load(new URL('../assets/mall-background/handdrawn-nobori-yellow.png', import.meta.url).href),
      new THREE.TextureLoader().load(new URL('../assets/mall-background/handdrawn-nobori-blue.png', import.meta.url).href),
      new THREE.TextureLoader().load(new URL('../assets/mall-background/handdrawn-nobori-green.png', import.meta.url).href),
    ];
    const handdrawnNoboriMats = handdrawnNoboriTextures.map((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    });
    const addCornerNobori = (x: number, z: number, material: THREE.MeshBasicMaterial) => {
      const nobori = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 2.70), material);
      nobori.position.set(x, 1.35, z);
      // Face the attraction centre from each corner of the safety-pole square.
      nobori.rotation.y = Math.atan2(-x, -z);
      nobori.renderOrder = 4;
      decorationGroup.add(nobori);
    };
    [
      [-3.42, -3.42], [3.42, -3.42], [3.42, 4.12], [-3.42, 4.12],
    ].forEach(([x, z], index) => addCornerNobori(x, z, handdrawnNoboriMats[index]));

    // Hand-drawn garland sections: each has two pushpins, a broad sagging cord, and eight flags.
    const garlandTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/handdrawn-pennant-garland.png', import.meta.url).href
    );
    garlandTexture.colorSpace = THREE.SRGBColorSpace;
    const garlandMat = new THREE.MeshBasicMaterial({
      map: garlandTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const addGarlandSection = (x: number, y: number, z: number, yaw: number, width: number) => {
      const section = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.2), garlandMat);
      section.position.set(x, y, z);
      section.rotation.y = yaw;
      section.renderOrder = 10;
      decorationGroup.add(section);
    };
    // Front wall: drawn in front of the hanging title banner.
    [-0.83, 3.003, 6.836].forEach((x) => addGarlandSection(x, 3.15, 6.70, Math.PI, 4.04));
    // Rear wall: same attached sections, facing into the game field.
    [-0.83, 3.003, 6.836].forEach((x) => addGarlandSection(x, 3.15, -6.98, 0, 4.04));
    // Right wall: several independently pinned sections continue along the entire side.
    [-8.11, -4.806, -1.502, 1.802, 5.106, 8.11].forEach((z) => addGarlandSection(8.43, 3.15, z, -Math.PI / 2, 3.478));
    this.sceneGroup.add(decorationGroup);
  }
  private buildMallFloorOverlay(celGradient: THREE.CanvasTexture) {
    const tileLineMat = new THREE.MeshToonMaterial({ color: 0xd6d3d1, gradientMap: celGradient });
    const tileGrid = new THREE.Group();
    tileGrid.name = 'MallTileOverlay_VisualOnly';
    // The left mall corridor is now a real, wider floor area: X = -14.5 to +10,
    // while the existing extended shop run continues from Z = -20 to +20.
    const visualFloorWidth = 24.5;
    const visualFloorCenterX = -2.25;
    for (let index = -10; index <= 10; index++) {
      const acrossX = new THREE.Mesh(new THREE.BoxGeometry(visualFloorWidth, 0.008, 0.018), tileLineMat);
      acrossX.position.set(visualFloorCenterX, 0.012, index * 2);
      tileGrid.add(acrossX);
    }
    for (let index = -7; index <= 5; index++) {
      const acrossZ = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 40), tileLineMat);
      acrossZ.position.set(index * 2, 0.012, 0);
      tileGrid.add(acrossZ);
    }
    this.sceneGroup.add(tileGrid);
  }

  private buildMallBackground(celGradient: THREE.CanvasTexture) {
    const background = new THREE.Group();
    background.name = 'MallBackground_VisualOnly';
    const wallMat = new THREE.MeshToonMaterial({ color: 0xf5f0e6, gradientMap: celGradient });
    const panelMat = new THREE.MeshToonMaterial({ color: 0xe7e1d5, gradientMap: celGradient });
    const columnMat = new THREE.MeshToonMaterial({ color: 0xe5e7eb, gradientMap: celGradient });
    const potMat = new THREE.MeshToonMaterial({ color: 0xc08457, gradientMap: celGradient });
    const trunkMat = new THREE.MeshToonMaterial({ color: 0x8b5a3c, gradientMap: celGradient });
    const leafMat = new THREE.MeshToonMaterial({ color: 0x65a30d, gradientMap: celGradient });
    const leafLightMat = new THREE.MeshToonMaterial({ color: 0x84cc16, gradientMap: celGradient });

    // C and D walls keep a broad B-side opening (x=-8.75 to -2.95) so the
    // open mall corridor passes straight through along Z.
    const wallSpanWidth = 11.70;
    const wallSpanCenterX = 2.90;
    const cWall = new THREE.Mesh(new THREE.BoxGeometry(wallSpanWidth, 3.8, 0.12), wallMat);
    cWall.position.set(wallSpanCenterX, 1.9, 7.15);
    const dWall = new THREE.Mesh(new THREE.BoxGeometry(wallSpanWidth, 3.8, 0.12), wallMat);
    dWall.position.set(wallSpanCenterX, 1.9, -7.15);
    background.add(cWall, dWall);

    // Adjustable front-wall banner. Its upper edge is currently about 80 cm below the ceiling.
    const frontBannerScale = 1.05;
    const frontBannerWidth = 3.6 * frontBannerScale;
    const frontBannerHeight = 2.03 * frontBannerScale;
    const frontBannerTopY = 3.0;
    const frontBannerTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/front-wall-powershovel-banner-handdrawn.png', import.meta.url).href
    );
    frontBannerTexture.colorSpace = THREE.SRGBColorSpace;
    const frontBannerMat = new THREE.MeshBasicMaterial({
      map: frontBannerTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const frontBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(frontBannerWidth, frontBannerHeight),
      frontBannerMat
    );
    frontBanner.name = 'FrontWall_PowerShovel_Handdrawn_Banner';
    frontBanner.position.set(
      wallSpanCenterX - 2.9,
      frontBannerTopY - frontBannerHeight / 2,
      6.97
    );
    // Face the game field so the Japanese lettering is not mirrored.
    frontBanner.rotation.y = Math.PI;
    frontBanner.renderOrder = 1;
    background.add(frontBanner);

    // Simple hanging hardware gives the illustration the presence of a real banner.
    const bannerHangerMat = new THREE.MeshToonMaterial({ color: 0xf8fafc, gradientMap: celGradient });
    const bannerRopeMat = new THREE.MeshToonMaterial({ color: 0xd9c7a1, gradientMap: celGradient });
    const bannerX = wallSpanCenterX - 2.9;
    const bannerCenterY = frontBannerTopY - frontBannerHeight / 2;
    [-1, 1].forEach((side) => {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.80, 8), bannerRopeMat);
      rope.position.set(bannerX + side * (frontBannerWidth * 0.40), 3.40, 6.94);
      background.add(rope);
    });
    const topRod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, frontBannerWidth + 0.18, 10), bannerHangerMat);
    topRod.rotation.z = Math.PI / 2;
    topRod.position.set(bannerX, frontBannerTopY + 0.02, 6.94);
    const bottomRod = topRod.clone();
    bottomRod.position.y = bannerCenterY - frontBannerHeight / 2 - 0.02;
    background.add(topRod, bottomRod);


    [0, 2.9, 5.8].forEach((x) => {
      const cSeam = new THREE.Mesh(new THREE.BoxGeometry(0.028, 3.5, 0.025), panelMat);
      cSeam.position.set(x, 1.9, 7.075);
      const dSeam = cSeam.clone();
      dSeam.position.z = -7.075;
      background.add(cSeam, dSeam);
    });
    const cTopTrim = new THREE.Mesh(new THREE.BoxGeometry(11.85, 0.16, 0.18), columnMat);
    cTopTrim.position.set(wallSpanCenterX, 3.68, 7.05);
    const dTopTrim = cTopTrim.clone();
    dTopTrim.position.z = -7.05;
    background.add(cTopTrim, dTopTrim);

    // Independently addressable, shoulder-height hand-drawn plants. Positions and size can be adjusted per ID.
    const addWallPlant = (id: string, assetPath: string, x: number, z: number, rotationY: number) => {
      const texture = new THREE.TextureLoader().load(new URL(assetPath, import.meta.url).href);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
      const plant = new THREE.Mesh(new THREE.PlaneGeometry(1.43, 2.00), material);
      plant.name = `Plant_${id}`;
      plant.userData.id = id;
      plant.position.set(x, 1.0, z);
      plant.rotation.y = rotationY;
      plant.renderOrder = 0;
      background.add(plant);
    };
    addWallPlant('正面01', '../assets/mall-background/plant-front-01-fiddleleaf-handdrawn.png', 8.00, 0.00, -Math.PI / 2);
    addWallPlant('正面02', '../assets/mall-background/plant-front-02-kentia-handdrawn.png', 6.85, 6.50, Math.PI);
    addWallPlant('背面01', '../assets/mall-background/plant-rear-01-monstera-handdrawn.png', -1.95, -6.50, 0);
    addWallPlant('背面02', '../assets/mall-background/plant-rear-02-rubber-handdrawn.png', 6.85, -6.50, 0);

    // A real left-side corridor: the storefront is farther out, while fixture and
    // column layers sit between it and the playable field for visible parallax.
    const shopBackdropTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/mall-glass-shops-handdrawn.png', import.meta.url).href
    );
    shopBackdropTexture.colorSpace = THREE.SRGBColorSpace;
    shopBackdropTexture.wrapS = THREE.RepeatWrapping;
    shopBackdropTexture.repeat.set(3.13, 1);

    const leftShopBackdropTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/left-side-shopfronts-no-corridor-handdrawn.png', import.meta.url).href
    );
    leftShopBackdropTexture.colorSpace = THREE.SRGBColorSpace;
    leftShopBackdropTexture.wrapS = THREE.RepeatWrapping;
    leftShopBackdropTexture.repeat.set(3.13, 1);
    const shopBackdropMat = new THREE.MeshBasicMaterial({
      map: leftShopBackdropTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const leftShopBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(40.0, 3.8), shopBackdropMat);
    leftShopBackdrop.name = 'LeftSide_Shops_Handdrawn_Backdrop';
    leftShopBackdrop.rotation.y = Math.PI / 2;
    leftShopBackdrop.position.set(-14.44, 1.9, 0);
    leftShopBackdrop.renderOrder = -1;
    background.add(leftShopBackdrop);

    // Left mall corridor lounge: six real low sofa modules, based on the hand-drawn 3×2 preview.
    const createSofaCrayonTexture = (fill: string, stroke: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, 96, 96);
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1.2;
      for (let index = 0; index < 80; index++) {
        const x = (index * 29) % 96;
        const y = (index * 47) % 96;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 12, y + 4 + (index % 4));
        ctx.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.8, 1.8);
      return texture;
    };
    const sofaColors: Array<[string, string]> = [
      ['#e8d4b5', '#a98461'],
      ['#f6ead6', '#bba27d'],
      ['#9a725c', '#5b3c2c'],
    ];
    const sofaMaterials = sofaColors.map(([fill, stroke]) => new THREE.MeshToonMaterial({
      map: createSofaCrayonTexture(fill, stroke), color: 0xffffff, gradientMap: celGradient,
    }));
    const sofaLounge = new THREE.Group();
    sofaLounge.name = 'mall_sofa_lounge_01';
    sofaLounge.userData.id = '左側面ローソファ01';
    const sofaCenterX = -8.20;
    const sofaCenterZ = 0;
    [-0.465, 0.465].forEach((xOffset, row) => {
      [-0.96, 0, 0.96].forEach((zOffset, column) => {
        const sofaColorRows = [[2, 1, 0], [1, 0, 2]]; // 奥: 茶・白・ベージュ / 手前: 白・ベージュ・茶
        const material = sofaMaterials[sofaColorRows[row][column]];
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.15, 0.87), material);
        base.position.set(sofaCenterX + xOffset, 0.075, sofaCenterZ + zOffset);
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.30, 0.90), material);
        cushion.position.set(sofaCenterX + xOffset, 0.30, sofaCenterZ + zOffset);
        const module = new THREE.Group();
        module.name = `mall_sofa_01_${row + 1}${column + 1}`;
        module.userData.id = `左側面ローソファ${row + 1}${column + 1}`;
        module.add(base, cushion);
        sofaLounge.add(module);
      });
    });
    registerObjectId(sofaLounge, 'mall_sofa_lounge_01', 'mall_furniture', 'SOFA', 0.35);
    background.add(sofaLounge);

    // Large crayon-style plant beside the lounge, separately addressable for later placement tuning.
    const sofaPlantTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/plant-left-sofa-01-strelitzia-crayon.png', import.meta.url).href
    );
    sofaPlantTexture.colorSpace = THREE.SRGBColorSpace;
    const sofaPlant = new THREE.Mesh(
      new THREE.PlaneGeometry(2.28, 3.42),
      new THREE.MeshBasicMaterial({ map: sofaPlantTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    sofaPlant.name = 'Plant_左側面ローソファ01';
    sofaPlant.userData.id = '左側面ローソファ植物01';
    sofaPlant.position.set(-8.20, 1.80, 1.80);
    sofaPlant.rotation.y = Math.PI / 2;
    sofaPlant.renderOrder = 0;
    background.add(sofaPlant);

    // Duplicate the full lounge ensemble toward the front and rear, keeping generous walking space between sets.
    const duplicateLoungeSet = (id: string, zOffset: number) => {
      const loungeClone = sofaLounge.clone(true);
      loungeClone.name = `mall_sofa_lounge_${id}`;
      loungeClone.userData.id = `左側面ローソファ${id}`;
      loungeClone.position.z = zOffset;
      loungeClone.traverse((child) => {
        if (child !== loungeClone && child.userData.id) child.userData.id = `${child.userData.id}_${id}`;
      });
      const plantClone = sofaPlant.clone();
      const benjaminTexture = new THREE.TextureLoader().load(
        new URL('../assets/mall-background/plant-left-sofa-01-benjamin-crayon.png', import.meta.url).href
      );
      benjaminTexture.colorSpace = THREE.SRGBColorSpace;
      plantClone.material = new THREE.MeshBasicMaterial({
        map: benjaminTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      });
      plantClone.name = `Plant_左側面ローソファ${id}_ベンジャミン`;
      plantClone.userData.id = `左側面ローソファ植物${id}_ベンジャミン`;
      plantClone.position.z += zOffset;
      background.add(loungeClone, plantClone);
    };
    duplicateLoungeSet('02_正面', 12.0);
    duplicateLoungeSet('03_背面', -12.0);
    // Right-side mall lounge: two 3-seat rows on either side of the central plant.
    const addRightSideSofaRow = (id: string, centerZ: number, colors: number[]) => {
      const rowGroup = new THREE.Group();
      rowGroup.name = `mall_right_sofa_row_${id}`;
      rowGroup.userData.id = `右側面ローソファ${id}`;
      const rightSofaX = 6.55;
      [-0.96, 0, 0.96].forEach((zOffset, index) => {
        const material = sofaMaterials[colors[index]];
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.15, 0.87), material);
        base.position.set(rightSofaX, 0.075, centerZ + zOffset);
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.30, 0.90), material);
        cushion.position.set(rightSofaX, 0.30, centerZ + zOffset);
        const module = new THREE.Group();
        module.name = `mall_right_sofa_${id}_${index + 1}`;
        module.userData.id = `右側面ローソファ${id}_${index + 1}`;
        module.add(base, cushion);
        rowGroup.add(module);
      });
      registerObjectId(rowGroup, `mall_right_sofa_row_${id}`, 'mall_furniture', 'SOFA', 0.35);
      background.add(rowGroup);
    };
    // Plant at the right wall remains unobstructed between the two rows.
    addRightSideSofaRow('01_正面側', 3.25, [2, 1, 0]);
    addRightSideSofaRow('02_背面側', -3.25, [1, 0, 2]);

    const rearStrelitziaTexture = new THREE.TextureLoader().load(
      new URL('../assets/mall-background/plant-rear-03-strelitzia-crayon.png', import.meta.url).href
    );
    rearStrelitziaTexture.colorSpace = THREE.SRGBColorSpace;
    const rearStrelitzia = new THREE.Mesh(
      new THREE.PlaneGeometry(1.20, 1.80),
      new THREE.MeshBasicMaterial({ map: rearStrelitziaTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    rearStrelitzia.name = 'Plant_背面03';
    rearStrelitzia.userData.id = '背面03';
    rearStrelitzia.position.set(2.50, 0.90, -6.50);
    rearStrelitzia.renderOrder = 0;
    background.add(rearStrelitzia);





    // Right-side floor-to-ceiling glass, with a deliberately pale suggestion of shops behind it.
    const rightShopTexture = shopBackdropTexture.clone();
    rightShopTexture.repeat.set(1.6, 1);
    rightShopTexture.needsUpdate = true;
    const rightShopMat = new THREE.MeshBasicMaterial({
      map: rightShopTexture,
      color: 0xf5f8f6,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const rightShopBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(20.10, 3.8), rightShopMat);
    rightShopBackdrop.rotation.y = Math.PI / 2;
    rightShopBackdrop.position.set(8.585, 1.9, 0);
    rightShopBackdrop.renderOrder = -1;
    background.add(rightShopBackdrop);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2edf0,
      transparent: true,
      opacity: 0.30,
      roughness: 0.30,
      metalness: 0.0,
    });
    const glassFrameMat = new THREE.MeshToonMaterial({ color: 0x9caeb6, gradientMap: celGradient });
    const rightPaneCenters = [-9, -7, -5, -3, -1, 1, 3, 5, 7, 9];
    const rightMullions = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10];
    rightPaneCenters.forEach((z) => {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.045, 3.68, 1.82), glassMat);
      pane.position.set(8.55, 1.88, z);
      background.add(pane);
    });
    rightMullions.forEach((z) => {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.09, 3.8, 0.08), glassFrameMat);
      mullion.position.set(8.55, 1.9, z);
      background.add(mullion);
    });
    const rightTopRail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.10, 20.10), glassFrameMat);
    rightTopRail.position.set(8.55, 3.75, 0);
    const rightBottomRail = rightTopRail.clone();
    rightBottomRail.position.y = 0.05;
    background.add(rightTopRail, rightBottomRail);




    this.sceneGroup.add(background);
  }
  private buildDumpBasket(celGradient: THREE.CanvasTexture) {
    const basketYellowMat = new THREE.MeshToonMaterial({
      color: 0xfacc15, // Anime vibrant construction yellow
      gradientMap: celGradient,
    });
    const wheelTireMat = new THREE.MeshToonMaterial({
      color: 0x1e293b,
      gradientMap: celGradient,
    });
    const rimMat = new THREE.MeshToonMaterial({
      color: 0xf1f5f9,
      gradientMap: celGradient,
    });

    const wheelOffsets = [
      { x: -0.55, z: 0.52 },
      { x: 0.55, z: 0.52 },
      { x: -0.55, z: -0.52 },
      { x: 0.55, z: -0.52 },
    ];

    wheelOffsets.forEach((wo) => {
      const wheelGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 18);
      wheelGeom.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(wheelGeom, wheelTireMat);
      tire.position.set(wo.x, 0.22, wo.z);
      tire.castShadow = true;

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.15, 14), rimMat);
      rim.rotateZ(Math.PI / 2);
      rim.position.set(wo.x, 0.22, wo.z);

      this.dumpTruckGroup.add(tire, rim);
    });

    [-0.52, 0.52].forEach((zAxle) => {
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.15, 8), rimMat);
      axle.rotateZ(Math.PI / 2);
      axle.position.set(0, 0.22, zAxle);
      this.dumpTruckGroup.add(axle);
    });

    // Hopper Basket Body (Parallel to pool along Z)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 1.35), basketYellowMat);
    floor.position.set(0, 0.36, 0);
    floor.receiveShadow = true;
    this.dumpTruckGroup.add(floor);

    // Front Wall (North towards conveyor intake)
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.35, 0.05), basketYellowMat);
    frontWall.position.set(0, 0.52, 0.67);
    this.dumpTruckGroup.add(frontWall);

    // Side Walls (Left & Right)
    [-0.48, 0.48].forEach((sx) => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 1.38), basketYellowMat);
      sideWall.position.set(sx, 0.62, 0);
      sideWall.rotation.z = sx > 0 ? -0.12 : 0.12;
      this.dumpTruckGroup.add(sideWall);
    });

    // Rear Wall (South - facing operator entrance)
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.40, 0.05), basketYellowMat);
    rearWall.position.set(0, 0.54, -0.67);
    rearWall.rotation.x = 0.12;
    this.dumpTruckGroup.add(rearWall);

    // Target bullseye ring on basket floor
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const targetRing = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.38, 20), ringMat);
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(0, 0.4, 0);
    this.dumpTruckGroup.add(targetRing);
  }

  private buildBallReturnUnit(
    celGradient: THREE.CanvasTexture,
    unitX: number,
    unitZ: number
  ) {
    const unitMat = new THREE.MeshToonMaterial({
      color: 0x0284c7, // Industrial Blue
      gradientMap: celGradient,
    });
    const panelMat = new THREE.MeshToonMaterial({
      color: 0x1e293b, // Dark Charcoal panel
      gradientMap: celGradient,
    });
    const trimMat = new THREE.MeshToonMaterial({
      color: 0xfbbf24, // Caution Yellow trim
      gradientMap: celGradient,
    });

    // Vertical rectangular tower (縦長の長方形ユニッチE
    const towerH = 1.35;
    const towerW = 0.52;
    const towerD = 0.36;

    // Main vertical box
    const mainBox = new THREE.Mesh(
      new THREE.BoxGeometry(towerW, towerH, towerD),
      unitMat
    );
    mainBox.position.set(unitX, towerH / 2, unitZ);
    mainBox.castShadow = true;
    mainBox.receiveShadow = true;
    this.returnUnitGroup.add(mainBox);

    // Front maintenance panel facing the pool (-Z direction)
    const frontPanel = new THREE.Mesh(
      new THREE.BoxGeometry(towerW - 0.08, towerH - 0.25, 0.02),
      panelMat
    );
    frontPanel.position.set(unitX, towerH / 2, unitZ - towerD / 2 - 0.01);
    this.returnUnitGroup.add(frontPanel);

    // Simple cross slats make the existing dark front panel read as a vertical conveyor.
    const conveyorSlatMat = new THREE.MeshToonMaterial({
      color: 0x475569,
      gradientMap: celGradient,
    });
    const conveyorFaceZ = frontPanel.position.z - 0.022;
    for (let index = 0; index < 7; index++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(towerW - 0.10, 0.018, 0.025),
        conveyorSlatMat
      );
      slat.position.set(unitX, 0.20 + index * 0.15, conveyorFaceZ);
      this.returnUnitGroup.add(slat);
    }

    // Yellow hazard stripe bar at top of unit
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(towerW + 0.02, 0.06, towerD + 0.02),
      trimMat
    );
    topBar.position.set(unitX, towerH + 0.03, unitZ);
    this.returnUnitGroup.add(topBar);

    // Status indicator beacon on top
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12),
      new THREE.MeshBasicMaterial({ color: 0x22c55e })
    );
    beacon.position.set(unitX, towerH + 0.1, unitZ);
    this.returnUnitGroup.add(beacon);

    // ==========================================
    // Basket Linkage: Intake Suction Conduit (バスケチE��連携吸引ダクチE
    // Connects basket rear (X: 1.80, Z: 2.47) to Return Unit (X: 1.48, Z: 2.70)
    // ==========================================
    const pipeMat = new THREE.MeshToonMaterial({
      color: 0x475569, // Industrial slate steel
      gradientMap: celGradient,
    });
    const intakeDuct = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.48, 12),
      pipeMat
    );
    intakeDuct.position.set(1.64, 0.42, 3.07);
    intakeDuct.rotation.x = Math.PI / 4;
    intakeDuct.rotation.z = -Math.PI / 5;
    this.returnUnitGroup.add(intakeDuct);

    // ==========================================
    // Return Chute: Slides balls back into the pool (プ�Eルへ返送するシューチE
    // Extends from unit across pool rim (X: 1.20) into pool interior
    // ==========================================
    const chuteMat = new THREE.MeshToonMaterial({
      color: 0xf59e0b, // Amber slide
      gradientMap: celGradient,
    });
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.04, 0.22),
      chuteMat
    );
    chute.position.set(1.22, 1.00, 3.22);
    chute.rotation.z = 0.28; // Tilted downward toward pool interior (-X)
    chute.rotation.y = -0.15;
    this.returnUnitGroup.add(chute);

    // Acrylic see-through side guides on chute
    const chuteGuideMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
    });
    [-0.10, 0.10].forEach((gz) => {
      const guide = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.08, 0.02),
        chuteGuideMat
      );
      guide.position.set(1.22, 1.03, 3.22 + gz);
      guide.rotation.z = 0.28;
      guide.rotation.y = -0.15;
      this.returnUnitGroup.add(guide);
    });

    const chuteEntry = new THREE.Vector3(0.17, 0.05, 0)
      .applyEuler(chute.rotation)
      .add(chute.position);
    const chuteExit = new THREE.Vector3(-0.17, 0.05, 0)
      .applyEuler(chute.rotation)
      .add(chute.position);
    this.returnTrajectory = {
      conveyorBottom: new THREE.Vector3(unitX, 0.20, conveyorFaceZ - 0.046),
      conveyorTop: new THREE.Vector3(unitX, 1.16, conveyorFaceZ - 0.046),
      chuteEntry,
      chuteExit,
    };
  }

  public updateLoadedCountDisplay(count: number) {
    const ctx = this.scoreMeshCanvas.getContext('2d');
    if (!ctx) return;

    // Hand-drawn illustrated signboard
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 256);

    // Warm double pen-line border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 488, 232);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 472, 216);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('積み込み数', 256, 68);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 84px sans-serif';
    ctx.fillText(`${count} 個`, 256, 175);

    this.scoreTexture.needsUpdate = true;
  }
}
