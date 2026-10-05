import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ExcavatorModel,
  EXCAVATOR_LIMITS,
  BUCKET_OUTER_WIDTH,
  BUCKET_INNER_FLOOR_Y,
  BUCKET_INNER_TOP_Y,
  BUCKET_INNER_BACK_Z,
  BUCKET_INNER_FRONT_Z,
  BUCKET_WALL_THICKNESS,
} from './three/excavatorModel';
import { ConstructionScene } from './three/constructionScene';
import { PhysicsSim, COMBO_ENABLED } from './three/physicsSim';
import { VirtualJoystick } from './components/VirtualJoystick';
import { GameHUD } from './components/GameHUD';
import { DebugPanel } from './components/DebugPanel';
import { LeverGuideModal } from './components/LeverGuideModal';
import { OrientationWarning } from './components/OrientationWarning';
import { GameOverModal } from './components/GameOverModal';
import { StartScreen } from './components/StartScreen';
import { HandDrawnIllustrationOverlay } from './components/CrayonOverlay';
import { soundManager } from './audio/soundManager';
import { LeverInput, ExcavatorAngles, GameStats, GameMode } from './types';

const DEBUG = true;
type CollisionState = 'NONE' | 'POOL_RAIL' | 'DUMP_BASKET';
type EntryScreen = 'start' | 'notice' | 'game';

const BUCKET_COLLISION_LOCAL_POINTS: THREE.Vector3[] = [];
for (const x of [-BUCKET_OUTER_WIDTH / 2, 0, BUCKET_OUTER_WIDTH / 2]) {
  for (const y of [
    BUCKET_INNER_FLOOR_Y - BUCKET_WALL_THICKNESS,
    BUCKET_INNER_TOP_Y + BUCKET_WALL_THICKNESS,
  ]) {
    for (const z of [
      BUCKET_INNER_BACK_Z - BUCKET_WALL_THICKNESS,
      (BUCKET_INNER_BACK_Z + BUCKET_INNER_FRONT_Z) / 2,
      BUCKET_INNER_FRONT_Z + 0.10,
    ]) {
      BUCKET_COLLISION_LOCAL_POINTS.push(new THREE.Vector3(x, y, z));
    }
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameViewportRef = useRef<HTMLDivElement>(null);

  // Excavator dynamic joint state refs
  const anglesRef = useRef<ExcavatorAngles>({
    swing: Math.PI,
    boom: 0.42,
    arm: -0.3,
    bucket: 0.1,
  });

  const leftInputRef = useRef<LeverInput>({ x: 0, y: 0, active: false });
  const rightInputRef = useRef<LeverInput>({ x: 0, y: 0, active: false });

  // UI state
  const [entryScreen, setEntryScreen] = useState<EntryScreen>('start');
  const [currentActionText, setCurrentActionText] = useState<string>('');
  const [showIdleInstruction, setShowIdleInstruction] = useState(false);
  const [guardWarningText, setGuardWarningText] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'leftRear' | 'centerRear' | 'cab'>('leftRear');
  const [engineState, setEngineState] = useState<'off' | 'starting' | 'running'>('off');
  const [bucketScoopCount, setBucketScoopCount] = useState<number>(0);
  const [bucketFloorAngle, setBucketFloorAngle] = useState<number>(0);
  const [spillRate, setSpillRate] = useState<number>(0);
  const [submergedSlotCount, setSubmergedSlotCount] = useState<number>(0);
  const [collisionState, setCollisionState] = useState<CollisionState>('NONE');
  const [collisionDebug, setCollisionDebug] = useState({
    currentCollision: 'NONE',
    candidateCollision: 'NONE',
    currentPenetration: 0,
    candidatePenetration: 0,
    currentMinY: 0,
    candidateMinY: 0,
    currentCenterY: 0,
    candidateCenterY: 0,
    currentMaxY: 0,
    candidateMaxY: 0,
    currentBoom: 0,
    candidateBoom: 0,
    decision: 'ALLOW',
    reason: 'NONE',
  });
  const [comboBannerText, setComboBannerText] = useState<string>('');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    ballsLoaded: 0,
    totalBalls: 1000,
    goldenBallsLoaded: 0,
    criticalCount: 0,
    combo: 1,
    operatorRank: '🐣 ひよこ見習い',
    timeRemaining: 180,
    isGameOver: false,
    mode: 'challenge',
  });

  // Three.js instances ref
  const simRef = useRef<PhysicsSim | null>(null);
  const excavatorRef = useRef<ExcavatorModel | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const constructionSceneRef = useRef<ConstructionScene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const comboTimerRef = useRef<number | null>(null);  const criticalFullBucketSeenRef = useRef(false);
  const criticalDropStartedAtRef = useRef<number | null>(null);
  const criticalTriggeredRef = useRef(false);
  const criticalLoadedBaselineRef = useRef(0);
  const confirmedBasketEntriesRef = useRef(0);
  const criticalRestoreTimerRef = useRef<number | null>(null);
  const audienceReactionActiveRef = useRef(false);
  const audienceReactionTimersRef = useRef<number[]>([]);
  const dumpMonitorActiveRef = useRef(false);
  const dumpMonitorStartBucketCountRef = useRef(0);
  const dumpMonitorStartLoadedRef = useRef(0);
  const dumpMonitorEmptySinceRef = useRef<number | null>(null);
  const dumpMonitorLastLoadedRef = useRef(0);
  const isGameOverRef = useRef(false);
  const challengeStartTimersRef = useRef<number[]>([]);
  const gameEndTimerRef = useRef<number | null>(null);
  const gameEndSequenceVersionRef = useRef(0);

  const engineStateRef = useRef<'off' | 'starting' | 'running'>('off');
  const cameraModeRef = useRef<'leftRear' | 'centerRear' | 'cab'>('leftRear');

  useEffect(() => {
    engineStateRef.current = engineState;
  }, [engineState]);

  useEffect(() => {
    isGameOverRef.current = stats.isGameOver;
  }, [stats.isGameOver]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Keep the help bubble out of the way while the player is operating either lever.
  useEffect(() => {
    if (currentActionText) {
      setShowIdleInstruction(false);
      return;
    }
    const timer = window.setTimeout(() => setShowIdleInstruction(true), 5000);
    return () => window.clearTimeout(timer);
  }, [currentActionText]);

  // Toggle audio
  const handleToggleMute = useCallback(() => {
    const nextMute = soundManager.toggleMute();
    setIsMuted(nextMute);
  }, []);

  // Cycle camera angle
  const handleCycleCamera = useCallback(() => {
    setCameraMode((prev) => {
      if (prev === 'leftRear') return 'centerRear';
      if (prev === 'centerRear') return 'cab';
      return 'leftRear';
    });
  }, []);

  const clearChallengeCountdown = useCallback(() => {
    challengeStartTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    challengeStartTimersRef.current = [];
    setCountdownValue(null);
  }, []);

  const clearGameEndSequence = useCallback(() => {
    gameEndSequenceVersionRef.current += 1;
    if (gameEndTimerRef.current !== null) {
      window.clearTimeout(gameEndTimerRef.current);
      gameEndTimerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearChallengeCountdown();
      clearGameEndSequence();
    },
    [clearChallengeCountdown, clearGameEndSequence]
  );

  // Engine starter ignition key handlers
  const handleStartEngine = useCallback(() => {
    if (stats.mode !== 'challenge' || engineStateRef.current !== 'off') return;
    clearChallengeCountdown();
    soundManager.enableAudio();
    engineStateRef.current = 'starting';
    setEngineState('starting');
    soundManager.playIgnitionStarter();

    const schedule = (callback: () => void, delay: number) => {
      challengeStartTimersRef.current.push(window.setTimeout(callback, delay));
    };
    schedule(() => {
      setCountdownValue(3);
      soundManager.playChallengeCountdown();
    }, 1300);
    schedule(() => setCountdownValue(2), 2300);
    schedule(() => setCountdownValue(1), 3300);
    schedule(() => setCountdownValue(0), 4300);
    schedule(() => {
      setCountdownValue(null);
      engineStateRef.current = 'running';
      setEngineState('running');
      challengeStartTimersRef.current = [];
    }, 5300);
  }, [clearChallengeCountdown, stats.mode]);

  const handleStopEngine = useCallback(() => {
    clearChallengeCountdown();
    engineStateRef.current = 'off';
    setEngineState('off');
    soundManager.silenceEngine();
  }, [clearChallengeCountdown, clearGameEndSequence]);

  // Toggle game mode
  const handleToggleMode = useCallback(() => {
    clearChallengeCountdown();
    clearGameEndSequence();
    isGameOverRef.current = false;
    const switchingToChallenge = stats.mode === 'free';

    if (switchingToChallenge) {
      anglesRef.current = {
        swing: Math.PI,
        boom: 0.42,
        arm: -0.3,
        bucket: 0.1,
      };
      excavatorRef.current?.setAngles(anglesRef.current);

      if (simRef.current && constructionSceneRef.current) {
        simRef.current.resetBalls(constructionSceneRef.current.pitCenter);
        constructionSceneRef.current.updateLoadedCountDisplay(0);
      }
    }

    setStats((prev) => {
      const nextMode: GameMode = prev.mode === 'free' ? 'challenge' : 'free';
      if (nextMode === 'challenge') {
        // Challenge mode requires turning ignition key to start
        setEngineState('off');
      } else {
        setEngineState('running');
      }
      return {
        ...prev,
        mode: nextMode,
        score: 0,
        ballsLoaded: 0,
        goldenBallsLoaded: 0,
        criticalCount: 0,
        combo: 1,
        operatorRank: '🐣 ひよこ見習い',
        timeRemaining: 180,
        isGameOver: false,
      };
    });
  }, [clearChallengeCountdown, clearGameEndSequence, stats.mode]);
  // Reset excavator and balls
  const handleResetGame = useCallback(() => {
    clearChallengeCountdown();
    clearGameEndSequence();
    isGameOverRef.current = false;
    anglesRef.current = {
      swing: Math.PI,
      boom: 0.42,
      arm: -0.3,
      bucket: 0.1,
    };
    if (excavatorRef.current) {
      excavatorRef.current.setAngles(anglesRef.current);
    }
    if (simRef.current && constructionSceneRef.current) {
      simRef.current.resetBalls(constructionSceneRef.current.pitCenter);
      constructionSceneRef.current.updateLoadedCountDisplay(0);
    }
    setStats((prev) => {
      if (prev.mode === 'challenge') {
        setEngineState('off');
      }
      return {
        ...prev,
        score: 0,
        ballsLoaded: 0,
        goldenBallsLoaded: 0,
        criticalCount: 0,
        combo: 1,
        operatorRank: '🐣 ひよこ見習い',
        timeRemaining: 180,
        isGameOver: false,
      };
    });
    setBucketScoopCount(0);
    criticalFullBucketSeenRef.current = false;
    criticalDropStartedAtRef.current = null;
    criticalTriggeredRef.current = false;
    criticalLoadedBaselineRef.current = 0;
    confirmedBasketEntriesRef.current = 0;
    dumpMonitorActiveRef.current = false;
    dumpMonitorStartBucketCountRef.current = 0;
    dumpMonitorStartLoadedRef.current = 0;
    dumpMonitorEmptySinceRef.current = null;
    dumpMonitorLastLoadedRef.current = 0;
    setGuardWarningText('');
    setComboBannerText('');
  }, [clearChallengeCountdown, clearGameEndSequence]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Hand-Drawn Illustration Style Warm Watercolor Sky / Studio Background
    const bgCol = 0xfefce8; // Warm drawing paper cream
    scene.background = new THREE.Color(bgCol);
    scene.fog = new THREE.FogExp2(bgCol, 0.012);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      48,
      1,
      0.1,
      60
    );
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Hand-Drawn Illustration Warm Lighting
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 1.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.85);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0008;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.65);
    fillLight.position.set(-10, 12, -6);
    scene.add(fillLight);

    // Build Attraction Scene with Conveyor and Return Chute
    const constructionScene = new ConstructionScene();
    constructionSceneRef.current = constructionScene;
    scene.add(constructionScene.sceneGroup);

    // Build KOMATSU PC01 Micro Excavator with Hand-Drawn Illustration Style
    const excavator = new ExcavatorModel();
    excavatorRef.current = excavator;
    scene.add(excavator.rootGroup);

    // Build 216 Dense Colorful Balls in Square Pool with Uniform Distribution
    const sim = new PhysicsSim(
      scene,
      constructionScene.pitCenter,
      constructionScene.returnTrajectory
    );
    simRef.current = sim;

    // Callback when any ball is loaded into the dump bed
    sim.onBallLoadedCallback = (_loadedCount, _ballId, _isGolden) => {
      // Balls already in flight may arrive after time-up, but no longer count.
      if (isGameOverRef.current) return;
      confirmedBasketEntriesRef.current += 1;
      setStats((prev) => {
        const nextCount = prev.ballsLoaded + 1;

        // Each callback is one newly confirmed basket entry. The ball-back
        // return path does not invoke this callback, so it cannot double-count.
        constructionScene.updateLoadedCountDisplay(nextCount);

        return {
          ...prev,
          ballsLoaded: nextCount,
        };
      });
    };

    // Callback for Multi-Scoop Dump Combos
    sim.onMultiScoopDumpCallback = (dumpCount, comboMultiplier) => {
      if (!COMBO_ENABLED) return;
      setStats((prev) => ({ ...prev, combo: comboMultiplier }));

      let banner = '';
      if (dumpCount >= 5) {
        banner = `メガすくい大漁 (${dumpCount}個)！ COMBO x${comboMultiplier}`;
      } else if (dumpCount >= 3) {
        banner = `豪快！ダブルすくい (${dumpCount}個)！ x${comboMultiplier}`;
      } else if (comboMultiplier > 1) {
        banner = `連続ダンプ！ COMBO x${comboMultiplier}`;
      } else {
        banner = `ナイスつみこみ！ +100pt`;
      }

      setComboBannerText(banner);
      if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
      clearAudienceReactionTimers();
      comboTimerRef.current = window.setTimeout(() => {
        setComboBannerText('');
      }, 2600);
    };

    // Camera initial position sync: TRUE LEFT-REAR VIEW (左斜め後方)
    excavator.updateWorldPositions();
    const camPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    excavator.cameraMount.position.set(1.95, 2.1, -2.15);
    excavator.cameraLookTarget.position.set(-0.2, 0.65, 2.1);
    excavator.cameraMount.getWorldPosition(camPos);
    excavator.cameraLookTarget.getWorldPosition(lookTarget);
    camera.position.copy(camPos);
    camera.lookAt(lookTarget);

    // Window Resize Handler
    const handleResize = () => {
      if (!canvas) return;
      const viewport = window.visualViewport;
      const viewportWidth = Math.round(viewport?.width ?? window.innerWidth);
      const viewportHeight = Math.round(viewport?.height ?? window.innerHeight);
      const container = gameViewportRef.current;
      if (container) {
        container.style.setProperty('--game-viewport-width', `${viewportWidth}px`);
        container.style.setProperty('--game-viewport-height', `${viewportHeight}px`);
      }
      const bounds = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(bounds.width || viewportWidth));
      const h = Math.max(1, Math.round(bounds.height || viewportHeight));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    // Animation Render Loop
    let lastTime = performance.now();
    let animationFrameId: number;
    let nextAmbientSpectatorChangeAt = performance.now() + 4500;
    const clearAudienceReactionTimers = () => {
      audienceReactionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      audienceReactionTimersRef.current = [];
    };
    const playAudienceReaction = (reaction: 'critical' | 'disappointed', cutIndex: number) => {
      clearAudienceReactionTimers();
      audienceReactionActiveRef.current = true;
      constructionScene.setSpectatorReactionCut(cutIndex, reaction, 0);
      audienceReactionTimersRef.current.push(window.setTimeout(() => {
        constructionScene.setSpectatorReactionCut(cutIndex, reaction, 1);
      }, 100));
      audienceReactionTimersRef.current.push(window.setTimeout(() => {
        constructionScene.setSpectatorReactionCut(1, reaction, 0);
      }, 5000));
      audienceReactionTimersRef.current.push(window.setTimeout(() => {
        constructionScene.setSpectatorReactionCut(1, reaction, 1);
      }, 5100));
      audienceReactionTimersRef.current.push(window.setTimeout(() => {
        audienceReactionActiveRef.current = false;
        audienceReactionTimersRef.current = [];
        nextAmbientSpectatorChangeAt = performance.now() + 4000 + Math.random() * 2000;
      }, 5200));
    };
    let scoopCheckTicker = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const left = leftInputRef.current;
      const right = rightInputRef.current;

      const actions: string[] = [];
      let wallWarning = '';
      let frameCollision: CollisionState = 'NONE';

      // Check engine status: If engine is OFF or starting, machine cannot move
      const isEngineRunning = engineStateRef.current === 'running';

      if (!isEngineRunning) {
        if (
          Math.abs(left.x) > 0.05 ||
          Math.abs(left.y) > 0.05 ||
          Math.abs(right.x) > 0.05 ||
          Math.abs(right.y) > 0.05
        ) {
          wallWarning =
            engineStateRef.current === 'starting'
              ? '⚠️ セルモーター始動中...少々お待ちください'
              : '⚠️ エンジン停止中：イグニッションキーをひねって始動してください';
        }
        soundManager.updateHydraulicLoad(0);
      } else {
        // Update audio load with joystick deflection
        // Sounds are ONLY emitted when levers are actively moved! Zero noise when idle.
        const totalDeflection = Math.max(
          Math.hypot(left.x, left.y),
          Math.hypot(right.x, right.y)
        );
        soundManager.updateHydraulicLoad(totalDeflection);

        const poolBounds = constructionScene.poolBounds;
        const dumpBed = constructionScene.dumpBedBounds;

        const getBucketCollisionDepths = (testAngles: ExcavatorAngles) => {
          excavator.setAngles(testAngles);
          const points = BUCKET_COLLISION_LOCAL_POINTS.map((point) =>
            point.clone().applyMatrix4(excavator.bucketMesh.matrixWorld)
          );

          let poolRail = 0;
          let dumpBasket = 0;
          let poolRailPenetration = 0;
          let dumpBasketPenetration = 0;
          let activePenetration: 'poolRail' | 'dumpBasket' = 'poolRail';
          const addWallDepth = (
            point: THREE.Vector3,
            axis: 'x' | 'z',
            plane: number,
            halfBand: number,
            crossMin: number,
            crossMax: number,
            minY: number,
            maxY: number
          ) => {
            const cross = axis === 'x' ? point.z : point.x;
            if (point.y < minY || point.y > maxY || cross < crossMin || cross > crossMax) {
              return 0;
            }
            const depth = Math.max(0, halfBand - Math.abs(point[axis] - plane));
            if (activePenetration === 'poolRail') {
              poolRailPenetration += depth;
            } else {
              dumpBasketPenetration += depth;
            }
            return depth;
          };

          // Acrylic wall plus the highest corner joint; points above this height
          // pass over the pool rail without being treated as a collision.
          const poolBand = 0.05;
          const poolMinY = -0.01;
          const poolMaxY = poolBounds.height + 0.062;
          for (const point of points) {
            poolRail = Math.max(
              poolRail,
              addWallDepth(
                point,
                'x',
                poolBounds.minX,
                poolBand,
                poolBounds.minZ - poolBand,
                poolBounds.maxZ + poolBand,
                poolMinY,
                poolMaxY
              ),
              addWallDepth(
                point,
                'x',
                poolBounds.maxX,
                poolBand,
                poolBounds.minZ - poolBand,
                poolBounds.maxZ + poolBand,
                poolMinY,
                poolMaxY
              ),
              addWallDepth(
                point,
                'z',
                poolBounds.minZ,
                poolBand,
                poolBounds.minX - poolBand,
                poolBounds.maxX + poolBand,
                poolMinY,
                poolMaxY
              ),
              addWallDepth(
                point,
                'z',
                poolBounds.maxZ,
                poolBand,
                poolBounds.minX - poolBand,
                poolBounds.maxX + poolBand,
                poolMinY,
                poolMaxY
              )
            );
          }

          activePenetration = 'dumpBasket';

          // The visual walls sit slightly inside the scoring bounds. Only the wall bands
          // are blocked; the open space above the basket remains available for dumping.
          const dumpBand = 0.04;
          const dumpMinY = dumpBed.floorY - 0.04;
          const dumpSideWallMaxY =
            0.62 + 0.275 * Math.cos(0.12) + 0.025 * Math.sin(0.12) + 0.015;
          const dumpFrontWallMaxY = 0.52 + 0.175 + 0.015;
          const dumpRearWallMaxY =
            0.54 + 0.20 * Math.cos(0.12) + 0.025 * Math.sin(0.12) + 0.015;
          const dumpMinX = dumpBed.minX + 0.10;
          const dumpMaxX = dumpBed.maxX - 0.10;
          const dumpMinZ = dumpBed.minZ + 0.05;
          const dumpMaxZ = dumpBed.maxZ - 0.05;
          for (const point of points) {
            dumpBasket = Math.max(
              dumpBasket,
              addWallDepth(
                point,
                'x',
                dumpMinX,
                dumpBand,
                dumpMinZ - dumpBand,
                dumpMaxZ + dumpBand,
                dumpMinY,
                dumpSideWallMaxY
              ),
              addWallDepth(
                point,
                'x',
                dumpMaxX,
                dumpBand,
                dumpMinZ - dumpBand,
                dumpMaxZ + dumpBand,
                dumpMinY,
                dumpSideWallMaxY
              ),
              addWallDepth(
                point,
                'z',
                dumpMinZ,
                dumpBand,
                dumpMinX - dumpBand,
                dumpMaxX + dumpBand,
                dumpMinY,
                dumpRearWallMaxY
              ),
              addWallDepth(
                point,
                'z',
                dumpMaxZ,
                dumpBand,
                dumpMinX - dumpBand,
                dumpMaxX + dumpBand,
                dumpMinY,
                dumpFrontWallMaxY
              )
            );
          }

          return {
            poolRail: poolRailPenetration,
            dumpBasket: dumpBasketPenetration,
            minY: Math.min(...points.map((point) => point.y)),
            maxY: Math.max(...points.map((point) => point.y)),
            centerY: excavator.bucketCenterWorldPos.y,
          };
        };

        const getBlockingCollision = (
          candidateAngles: ExcavatorAngles,
          forcedBlockReason?: 'VERTICAL_GUARD',
          ignoreDumpBasket = false
        ): CollisionState => {
          const currentDepths = getBucketCollisionDepths(anglesRef.current);
          const candidateDepths = getBucketCollisionDepths(candidateAngles);
          const penetrationEpsilon = 0.0001;
          const blocksNewEntryOrDeeperCollision = (
            currentPenetration: number,
            candidatePenetration: number
          ) => {
            const currentCollision = currentPenetration > penetrationEpsilon;
            const candidateCollision = candidatePenetration > penetrationEpsilon;
            if (!currentCollision) return candidateCollision;
            return candidatePenetration > currentPenetration + penetrationEpsilon;
          };
          const poolBlocked = blocksNewEntryOrDeeperCollision(currentDepths.poolRail, candidateDepths.poolRail);
          const dumpBlocked = blocksNewEntryOrDeeperCollision(currentDepths.dumpBasket, candidateDepths.dumpBasket);
          const effectiveDumpBlocked = dumpBlocked && !ignoreDumpBasket;
          const collision = poolBlocked || effectiveDumpBlocked
            ? poolBlocked && (!effectiveDumpBlocked ||
                candidateDepths.poolRail - currentDepths.poolRail >=
                  candidateDepths.dumpBasket - currentDepths.dumpBasket)
              ? 'POOL_RAIL'
              : 'DUMP_BASKET'
            : 'NONE';
          const currentTotal = currentDepths.poolRail + currentDepths.dumpBasket;
          const candidateTotal = candidateDepths.poolRail + candidateDepths.dumpBasket;
          const currentCollision = currentDepths.poolRail > penetrationEpsilon
            ? 'POOL_RAIL'
            : currentDepths.dumpBasket > penetrationEpsilon
              ? 'DUMP_BASKET'
              : 'NONE';
          const candidateCollision = candidateDepths.poolRail > penetrationEpsilon
            ? 'POOL_RAIL'
            : candidateDepths.dumpBasket > penetrationEpsilon
              ? 'DUMP_BASKET'
              : 'NONE';
          const collisionReason = collision === 'NONE'
            ? 'ALLOW'
            : currentCollision === 'NONE'
              ? 'NEW_COLLISION'
              : 'PENETRATION_INCREASE';
          setCollisionDebug({
            currentCollision,
            candidateCollision,
            currentPenetration: currentTotal,
            candidatePenetration: candidateTotal,
            currentMinY: currentDepths.minY,
            candidateMinY: candidateDepths.minY,
            currentCenterY: currentDepths.centerY,
            candidateCenterY: candidateDepths.centerY,
            currentMaxY: currentDepths.maxY,
            candidateMaxY: candidateDepths.maxY,
            currentBoom: anglesRef.current.boom,
            candidateBoom: candidateAngles.boom,
            decision: forcedBlockReason ? 'BLOCK' : collision === 'NONE' ? 'ALLOW' : 'BLOCK',
            reason: forcedBlockReason || collisionReason,
          });
          return collision;
        };

        const showCollisionWarning = (collision: CollisionState) => {
          frameCollision = collision;
          wallWarning =
            collision === 'POOL_RAIL'
              ? 'プール壁ガード：障害物へ侵入する操作を停止しました'
              : 'バスケット壁ガード：障害物へ侵入する操作を停止しました';
        };

        // ==========================================================
        // Attachment lowest point helper for floor limit guard
        // ==========================================================
        const FLOOR_LIMIT_Y = 0.022; // Pool floor is at Y = 0.020
        const getAttachmentLowestY = (testAngles: ExcavatorAngles): number => {
          excavator.setAngles(testAngles);
          return Math.min(
            excavator.bucketTeethWorldPos.y,
            excavator.bucketCenterWorldPos.y,
            excavator.bucketJointWorldPos.y
          );
        };
        const curLowestY = getAttachmentLowestY(anglesRef.current);

        // ==========================================================
        // 1. Arm Lever (UP: OUT / DOWN: IN) - 地面リミット制限付き
        // ==========================================================
        if (Math.abs(left.y) > 0.05) {
          const armSpeed = 0.95;
          const candArm = Math.max(
            EXCAVATOR_LIMITS.armMin,
            Math.min(EXCAVATOR_LIMITS.armMax, anglesRef.current.arm + left.y * armSpeed * delta)
          );
          const candAngles = { ...anglesRef.current, arm: candArm };
          const candLowestY = getAttachmentLowestY(candAngles);
          if (candLowestY >= FLOOR_LIMIT_Y || candLowestY >= curLowestY - 0.001) {
            const collision = getBlockingCollision(candAngles);
            const isRising = candLowestY > curLowestY + 0.001;
            if (isRising || collision === 'NONE') {
              anglesRef.current.arm = candArm;
            } else {
              showCollisionWarning(collision);
            }
          } else {
            getBlockingCollision(candAngles, 'VERTICAL_GUARD');
            wallWarning = '地面リミット：これ以上深くは入れません (ブームを上げてください)';
          }
          actions.push(left.y > 0 ? '▲ アーム OUT' : '▼ アーム IN');
        }

        // ==========================================================
        // 2. Boom Lever (UP: DOWN / DOWN: UP) - 地面リミット制限付き
        // ==========================================================
        if (Math.abs(right.y) > 0.05) {
          const boomSpeed = 0.85;
          // right.y > 0 is UP (ブーム DOWN = 降下, increases boom angle)
          // right.y < 0 is DOWN (ブーム UP = 上昇, decreases boom angle)
          const candBoom = Math.max(
            EXCAVATOR_LIMITS.boomMin,
            Math.min(EXCAVATOR_LIMITS.boomMax, anglesRef.current.boom + right.y * boomSpeed * delta)
          );
          const candAngles = { ...anglesRef.current, boom: candBoom };
          const candLowestY = getAttachmentLowestY(candAngles);
          if (candLowestY >= FLOOR_LIMIT_Y || candLowestY >= curLowestY - 0.001) {
            const collision = getBlockingCollision(candAngles);
            const isRising = candLowestY > curLowestY + 0.001;
            if (isRising || collision === 'NONE') {
              anglesRef.current.boom = candBoom;
            } else {
              showCollisionWarning(collision);
            }
          } else {
            getBlockingCollision(candAngles, 'VERTICAL_GUARD');
            wallWarning = '地面リミット：これ以上深くは入れません (ブームを上げてください)';
          }
          actions.push(right.y > 0 ? '▲ ブーム DOWN (降下)' : '▼ ブーム UP (上昇)');
        }

        // ==========================================================
        // 3. Bucket Lever (LEFT: 掘削 / RIGHT: ダンプ) - すくい角度拡張対応
        // ==========================================================
        if (Math.abs(right.x) > 0.05) {
          const bucketSpeed = 1.35;
          const candBucket = Math.max(
            EXCAVATOR_LIMITS.bucketMin,
            Math.min(EXCAVATOR_LIMITS.bucketMax, anglesRef.current.bucket - right.x * bucketSpeed * delta)
          );
          const candAngles = { ...anglesRef.current, bucket: candBucket };
          const isDumpDirection = candBucket < anglesRef.current.bucket;
          const collision = getBlockingCollision(candAngles, undefined, isDumpDirection);
          if (collision === 'NONE') {
            anglesRef.current.bucket = candBucket;
          } else {
            showCollisionWarning(collision);
          }
          actions.push(right.x < 0 ? '◀ バケット掘削 (すくい)' : '▶ バケットダンプ (投下)');
        }

        // Automatic surface glide: keep bucket teeth gracefully on or above pool floor
        const postLowestY = getAttachmentLowestY(anglesRef.current);
        if (postLowestY < FLOOR_LIMIT_Y) {
          anglesRef.current.boom = Math.max(
            EXCAVATOR_LIMITS.boomMin,
            anglesRef.current.boom - (FLOOR_LIMIT_Y - postLowestY) * 1.5
          );
        }

        // ==========================================================
        // 4. Swing Lever (LEFT: 左旋回 / RIGHT: 右旋回)
        // No fixed angular limit: only the shared obstacle guard can stop rotation.
        // ==========================================================
        if (Math.abs(left.x) > 0.05) {
          const swingSpeed = 0.82;
          const candSwing = anglesRef.current.swing + (-left.x * swingSpeed * delta);

          const candAngles = { ...anglesRef.current, swing: candSwing };
          const collision = getBlockingCollision(candAngles);
          if (collision === 'NONE') {
            anglesRef.current.swing = candSwing;
          } else {
            showCollisionWarning(collision);
          }
          actions.push(left.x > 0 ? '▶ 右旋回' : '◀ 左旋回');
        }

        const currentDepths = getBucketCollisionDepths(anglesRef.current);
        const collisionEpsilon = 0.0001;
        frameCollision = currentDepths.poolRail > collisionEpsilon
          ? 'POOL_RAIL'
          : currentDepths.dumpBasket > collisionEpsilon
            ? 'DUMP_BASKET'
            : 'NONE';
      }

      setCurrentActionText(actions.join(' + '));
      setGuardWarningText(wallWarning);
      setCollisionState(frameCollision);

      // Apply angles to 3D Excavator model
      excavator.setAngles(anglesRef.current);

      const bucketCountBeforePhysics = sim.getScoopedCount();

      // Update color ball physics
      sim.update(
        delta,
        excavator,
        anglesRef.current.bucket,
        constructionScene.dumpBedBounds
      );

      // Critical: each full 50-ball bucket arms a fresh attempt.
      const scoopedNow = sim.getScoopedCount();
      if (scoopedNow >= 50 && !criticalFullBucketSeenRef.current) {
        criticalFullBucketSeenRef.current = true;
        criticalTriggeredRef.current = false;
        criticalDropStartedAtRef.current = null;
        criticalLoadedBaselineRef.current = confirmedBasketEntriesRef.current;
      }
      // The first confirmed basket entry starts this attempt's five-second clock.
      if (criticalFullBucketSeenRef.current && !criticalTriggeredRef.current && criticalDropStartedAtRef.current === null
        && confirmedBasketEntriesRef.current > criticalLoadedBaselineRef.current) {
        criticalDropStartedAtRef.current = performance.now();
      }
      if (criticalFullBucketSeenRef.current && !criticalTriggeredRef.current && criticalDropStartedAtRef.current !== null) {
        const enteredThisAttempt = confirmedBasketEntriesRef.current - criticalLoadedBaselineRef.current;
        if (enteredThisAttempt >= 50 && performance.now() - criticalDropStartedAtRef.current <= 5000) {
          criticalTriggeredRef.current = true;
          criticalFullBucketSeenRef.current = false;
          setStats((prev) => ({ ...prev, criticalCount: prev.criticalCount + 1 }));
          soundManager.playSuccessChime();
          dumpMonitorActiveRef.current = false;
          playAudienceReaction('critical', 7);
        } else if (performance.now() - criticalDropStartedAtRef.current > 5000) {
          criticalFullBucketSeenRef.current = false;
        }
      }
      // Periodically update bucket scoop count for HUD (every 6 frames)
      // Disappointment monitor: arm only after a loaded bucket has left the pool.
      const bucketPosition = excavator.bucketCenterWorldPos;
      const poolMonitorMargin = 0.12;
      const isBucketOutsidePool =
        bucketPosition.x < constructionScene.poolBounds.minX - poolMonitorMargin ||
        bucketPosition.x > constructionScene.poolBounds.maxX + poolMonitorMargin ||
        bucketPosition.z < constructionScene.poolBounds.minZ - poolMonitorMargin ||
        bucketPosition.z > constructionScene.poolBounds.maxZ + poolMonitorMargin;
      const isAboveDumpBasket =
        bucketPosition.x >= constructionScene.dumpBedBounds.minX &&
        bucketPosition.x <= constructionScene.dumpBedBounds.maxX &&
        bucketPosition.z >= constructionScene.dumpBedBounds.minZ &&
        bucketPosition.z <= constructionScene.dumpBedBounds.maxZ &&
        bucketPosition.y >= constructionScene.dumpBedBounds.floorY;
      const isDumpMonitoringZone = isBucketOutsidePool || isAboveDumpBasket;

      if (!dumpMonitorActiveRef.current && bucketCountBeforePhysics > 0 && isDumpMonitoringZone) {
        dumpMonitorActiveRef.current = true;
        dumpMonitorStartBucketCountRef.current = Math.max(1, bucketCountBeforePhysics);
        dumpMonitorStartLoadedRef.current = confirmedBasketEntriesRef.current;
        dumpMonitorEmptySinceRef.current = null;
      }
      if (dumpMonitorActiveRef.current) {
        if (!isDumpMonitoringZone) {
          dumpMonitorActiveRef.current = false;
          dumpMonitorEmptySinceRef.current = null;
        } else if (scoopedNow === 0) {
          if (dumpMonitorEmptySinceRef.current === null) {
            dumpMonitorEmptySinceRef.current = performance.now();
          } else if (performance.now() - dumpMonitorEmptySinceRef.current >= 1000) {
            const loadedDuringDump = confirmedBasketEntriesRef.current - dumpMonitorStartLoadedRef.current;
            const successRatio = loadedDuringDump / dumpMonitorStartBucketCountRef.current;
            if (successRatio <= 0.10 && !audienceReactionActiveRef.current) {
              soundManager.playDisappointedChime();
              playAudienceReaction('disappointed', 8);
            }
            dumpMonitorLastLoadedRef.current = confirmedBasketEntriesRef.current;
            dumpMonitorActiveRef.current = false;
            dumpMonitorEmptySinceRef.current = null;
          }
        } else {
          dumpMonitorEmptySinceRef.current = null;
        }
      }
      if (!audienceReactionActiveRef.current && performance.now() >= nextAmbientSpectatorChangeAt) {
        constructionScene.setRandomAmbientSpectatorCuts(4 + Math.floor(Math.random() * 3));
        nextAmbientSpectatorChangeAt = performance.now() + 4000 + Math.random() * 2000;
      }

      scoopCheckTicker++;
      if (scoopCheckTicker % 6 === 0) {
        setBucketScoopCount(sim.getScoopedCount());
        setSpillRate(sim.getSpillRate());
        setSubmergedSlotCount(sim.getSubmergedSlotCount());
        const floorDirection = new THREE.Vector3(0, 0, 1)
          .transformDirection(excavator.bucketMesh.matrixWorld);
        setBucketFloorAngle(
          Math.atan2(floorDirection.y, Math.hypot(floorDirection.x, floorDirection.z))
        );
      }

      // Decorative mall walkers are visual-only and never affect physics or controls.
      constructionScene.updateMallWalkers(delta);

      // Camera update using active cameraModeRef: TRUE LEFT-REAR PERSPECTIVE (左斜め後方視点)
      const currentCameraMode = cameraModeRef.current;
      if (currentCameraMode === 'leftRear') {
        excavator.cameraMount.position.set(1.95, 2.1, -2.15);
        excavator.cameraLookTarget.position.set(-0.2, 0.65, 2.1);
      } else if (currentCameraMode === 'centerRear') {
        excavator.cameraMount.position.set(0, 2.2, -2.6);
        excavator.cameraLookTarget.position.set(0, 0.7, 2.2);
      } else {
        // Driver operator perspective (cab)
        excavator.cameraMount.position.set(0.35, 1.25, -0.4);
        excavator.cameraLookTarget.position.set(-0.1, 0.65, 2.4);
      }

      excavator.cameraMount.getWorldPosition(camPos);
      excavator.cameraLookTarget.getWorldPosition(lookTarget);
      camera.position.lerp(camPos, 0.92);
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      renderer.dispose();
      soundManager.silenceEngine();
      if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    };
  }, []);

  // Challenge mode timer: ONLY counts down when engine is running!
  useEffect(() => {
    if (stats.mode !== 'challenge' || stats.isGameOver || engineState !== 'running') return;

    const timer = setInterval(() => {
      setStats((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timer);
          if (!isGameOverRef.current) {
            isGameOverRef.current = true;
            soundManager.silenceEngine();
            engineStateRef.current = 'off';
            setEngineState('off');
            const sequenceVersion = gameEndSequenceVersionRef.current;
            soundManager.playTimeUpSequence(() => {
              if (gameEndSequenceVersionRef.current !== sequenceVersion) return;
              gameEndTimerRef.current = window.setTimeout(() => {
                if (gameEndSequenceVersionRef.current !== sequenceVersion) return;
                gameEndTimerRef.current = null;
                setStats((current) => ({ ...current, isGameOver: true }));
              }, 180);
            });
          }
          return { ...prev, timeRemaining: 0, isGameOver: false };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stats.mode, stats.isGameOver, engineState]);

  // Silence engine when guide is open
  useEffect(() => {
    if (isGuideOpen) {
      soundManager.setGameActive(false);
    } else {
      soundManager.setGameActive(true);
    }
  }, [isGuideOpen]);

  return (
    <div
      id="game-viewport-container"
      ref={gameViewportRef}
      className="fixed inset-0 overflow-hidden select-none touch-none bg-slate-900 font-sans"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block touch-none" />

      {entryScreen === 'game' && (<>
      {/* Hand-Drawn Illustration Style Watercolor Paper & Framing Overlay */}
      <HandDrawnIllustrationOverlay
        actionText={currentActionText}
        comboText={COMBO_ENABLED ? comboBannerText : ''}
      />

      {DEBUG && (
        <div className="mobile-debug-hidden">
        <DebugPanel
          bucketCount={bucketScoopCount}
          swingAngle={anglesRef.current.swing}
          bucketAngle={anglesRef.current.bucket}
          bucketFloorAngle={bucketFloorAngle}
          spillRate={spillRate}
          submergedSlotCount={submergedSlotCount}
          armAngle={anglesRef.current.arm}
          boomAngle={anglesRef.current.boom}
          collisionState={collisionState}
          collisionDebug={collisionDebug}
        />
        </div>
      )}

      {countdownValue !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none" aria-live="assertive">
          <div className="min-w-[0.9em] text-center text-[clamp(7rem,25vw,18rem)] leading-none font-black text-amber-300 drop-shadow-[0_0_18px_rgba(120,53,15,0.95)] [text-shadow:4px_4px_0_#1e293b,-3px_-3px_0_#1e293b,3px_-3px_0_#1e293b,-3px_3px_0_#1e293b] animate-pulse">
            {countdownValue}
          </div>
        </div>
      )}
      {/* Heads-up display with score, status, controls, and aligned camera & ignition key windows */}
      <GameHUD
        stats={stats}
        comboEnabled={COMBO_ENABLED}
        currentActionText={currentActionText}
        guardWarningText={guardWarningText}
        isMuted={isMuted}
        cameraMode={cameraMode}
        engineState={engineState}
        showIdleInstruction={showIdleInstruction}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideOpen(true)}
        onResetGame={handleResetGame}
        onToggleMode={handleToggleMode}
        onCycleCamera={handleCycleCamera}
        onStartEngine={handleStartEngine}
        onStopEngine={handleStopEngine}
      />

      {/* Dual Virtual Joysticks with Strict 4-Way Gating */}
      <div className="absolute inset-x-0 bottom-0 sm:bottom-1 px-1 sm:px-2 flex justify-between items-end pointer-events-none z-30">
        {/* Left Lever: アーム & 旋回 */}
        <VirtualJoystick
          id="left-joystick-controller"
          side="left"
          title="左レバー"
          labels={{
            up: 'アーム OUT',
            down: 'アーム IN',
            left: '左旋回',
            right: '右旋回',
          }}
          onChange={(input) => {
            leftInputRef.current = input;
          }}
        />

        {/* Right Lever: ブーム & バケット */}
        <VirtualJoystick
          id="right-joystick-controller"
          side="right"
          title="右レバー"
          labels={{
            up: 'ブーム DOWN',
            down: 'ブーム UP',
            left: 'バケット掘削',
            right: 'バケットダンプ',
          }}
          onChange={(input) => {
            rightInputRef.current = input;
          }}
        />
      </div>

      </>)}

      {/* Portrait mode orientation warning */}
      <OrientationWarning />

      <StartScreen
        view={entryScreen}
        onStart={() => setEntryScreen('game')}
        onOpenNotice={() => setEntryScreen('notice')}
        onBack={() => setEntryScreen('start')}
      />

      {/* Guide & Results Modals */}
      <LeverGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <GameOverModal stats={stats} onRestart={handleResetGame} />
    </div>
  );
}
