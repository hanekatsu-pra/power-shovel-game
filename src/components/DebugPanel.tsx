interface DebugPanelProps {
  bucketCount: number;
  swingAngle: number;
  bucketAngle: number;
  bucketFloorAngle: number;
  spillRate: number;
  submergedSlotCount: number;
  armAngle: number;
  boomAngle: number;
  collisionState: 'NONE' | 'POOL_RAIL' | 'DUMP_BASKET';
  collisionDebug: {
    currentCollision: string;
    candidateCollision: string;
    currentPenetration: number;
    candidatePenetration: number;
    currentMinY: number;
    candidateMinY: number;
    currentCenterY: number;
    candidateCenterY: number;
    currentMaxY: number;
    candidateMaxY: number;
    currentBoom: number;
    candidateBoom: number;
    decision: string;
    reason: string;
  };
}

const formatAngle = (radians: number) =>
  radians.toFixed(2) + ' rad / ' + (radians * 180 / Math.PI).toFixed(1) + '°';
const formatDegrees = (radians: number) => (radians * 180 / Math.PI).toFixed(1) + '°';

export const DebugPanel = ({
  bucketCount,
  swingAngle,
  bucketAngle,
  bucketFloorAngle,
  spillRate,
  submergedSlotCount,
  armAngle,
  boomAngle,
  collisionState,
  collisionDebug,
}: DebugPanelProps) => (
  <div
    style={{
      position: 'absolute',
      top: 96,
      left: 16,
      zIndex: 30,
      padding: '8px 10px',
      borderRadius: 8,
      background: 'rgba(15, 23, 42, 0.82)',
      border: '1px solid rgba(56, 189, 248, 0.45)',
      color: '#e2e8f0',
      fontSize: 12,
      lineHeight: 1.6,
      pointerEvents: 'none',
      fontFamily: 'monospace',
    }}
  >
    <div style={{ color: '#7dd3fc', fontWeight: 700 }}>DEBUG</div>
    <div>Bucket Count : {bucketCount}</div>
    <div>Swing Angle : {formatAngle(swingAngle)}</div>
    <div>Bucket Angle : {formatAngle(bucketAngle)}</div>
    <div>Bucket Floor Angle : {formatDegrees(bucketFloorAngle)}</div>
    <div>Spill Rate : {spillRate.toFixed(1)} balls/s</div>
    <div>Submerged Slots : {submergedSlotCount} / 50</div>
    <div>Submerged Ratio : {Math.round(submergedSlotCount / 50 * 100)}%</div>
    <div>Arm Angle : {formatAngle(armAngle)}</div>
    <div>Boom Angle : {formatAngle(boomAngle)}</div>
    <div>Collision : {collisionState}</div>
    <div style={{ marginTop: 4, color: '#fbbf24' }}>Collision Guard</div>
    <div>Current Collision : {collisionDebug.currentCollision}</div>
    <div>Candidate Collision : {collisionDebug.candidateCollision}</div>
    <div>Current Penetration Total : {collisionDebug.currentPenetration.toFixed(4)}</div>
    <div>Candidate Penetration Total : {collisionDebug.candidatePenetration.toFixed(4)}</div>
    <div>Penetration Delta : {(collisionDebug.candidatePenetration - collisionDebug.currentPenetration).toFixed(4)}</div>
    <div>Current Bucket MinY : {collisionDebug.currentMinY.toFixed(4)}</div>
    <div>Candidate Bucket MinY : {collisionDebug.candidateMinY.toFixed(4)}</div>
    <div>Bucket MinY Delta : {(collisionDebug.candidateMinY - collisionDebug.currentMinY).toFixed(4)}</div>
    <div>Current Bucket CenterY : {collisionDebug.currentCenterY.toFixed(4)}</div>
    <div>Candidate Bucket CenterY : {collisionDebug.candidateCenterY.toFixed(4)}</div>
    <div>Bucket CenterY Delta : {(collisionDebug.candidateCenterY - collisionDebug.currentCenterY).toFixed(4)}</div>
    <div>Current Bucket MaxY : {collisionDebug.currentMaxY.toFixed(4)}</div>
    <div>Candidate Bucket MaxY : {collisionDebug.candidateMaxY.toFixed(4)}</div>
    <div>Bucket MaxY Delta : {(collisionDebug.candidateMaxY - collisionDebug.currentMaxY).toFixed(4)}</div>
    <div>Current Boom Angle : {formatAngle(collisionDebug.currentBoom)}</div>
    <div>Candidate Boom Angle : {formatAngle(collisionDebug.candidateBoom)}</div>
    <div>Boom Angle Delta : {formatAngle(collisionDebug.candidateBoom - collisionDebug.currentBoom)}</div>
    <div>Decision : {collisionDebug.decision}</div>
    <div>Block Reason : {collisionDebug.reason}</div>
  </div>
);
