import {
  clampNormalizedPoint,
  type NormalizedPoint,
} from "../shared/normalization";

const DEFAULT_SMOOTHING_SAMPLES_PER_SEGMENT = 8;

function catmullRomScalar(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function catmullRomPoint(points: readonly NormalizedPoint[], segmentIndex: number, t: number): NormalizedPoint {
  const p0 = points[Math.max(0, segmentIndex - 1)] ?? points[0]!;
  const p1 = points[segmentIndex] ?? points[0]!;
  const p2 = points[Math.min(points.length - 1, segmentIndex + 1)] ?? p1;
  const p3 = points[Math.min(points.length - 1, segmentIndex + 2)] ?? p2;
  return clampNormalizedPoint({
    x: catmullRomScalar(p0.x, p1.x, p2.x, p3.x, t),
    y: catmullRomScalar(p0.y, p1.y, p2.y, p3.y, t),
  });
}

export function smoothMovementPathPoints(
  points: readonly NormalizedPoint[],
  samplesPerSegment = DEFAULT_SMOOTHING_SAMPLES_PER_SEGMENT,
): NormalizedPoint[] {
  if (points.length <= 2) {
    return points.map((point) => clampNormalizedPoint(point));
  }
  const samples = Math.max(2, Math.floor(samplesPerSegment));
  const smoothed: NormalizedPoint[] = [];
  for (let segmentIndex = 0; segmentIndex < points.length - 1; segmentIndex += 1) {
    for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
      const t = sampleIndex / samples;
      smoothed.push(catmullRomPoint(points, segmentIndex, t));
    }
  }
  smoothed.push(clampNormalizedPoint(points[points.length - 1]!));
  return smoothed;
}

export function interpolateMovementPathPoint(
  points: readonly NormalizedPoint[],
  progress: number,
): NormalizedPoint | null {
  // Pure interpolation only: no Pixi, React, timers, or GSAP. A future GSAP
  // bridge can consume this sampled point stream or swap the time source while
  // preserving the same movement path records.
  if (points.length <= 0) return null;
  const boundedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  if (points.length === 1) return clampNormalizedPoint(points[0]!);
  const smoothed = smoothMovementPathPoints(points);
  let totalDistance = 0;
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1];
    const current = smoothed[index];
    if (!previous || !current) continue;
    totalDistance += Math.hypot(current.x - previous.x, current.y - previous.y);
  }
  if (totalDistance <= 0) return clampNormalizedPoint(smoothed[smoothed.length - 1]!);

  const targetDistance = totalDistance * boundedProgress;
  let traveledDistance = 0;
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1];
    const current = smoothed[index];
    if (!previous || !current) continue;
    const segmentDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    if (segmentDistance <= 0) continue;
    if (traveledDistance + segmentDistance >= targetDistance) {
      const segmentProgress = (targetDistance - traveledDistance) / segmentDistance;
      return clampNormalizedPoint({
        x: previous.x + (current.x - previous.x) * segmentProgress,
        y: previous.y + (current.y - previous.y) * segmentProgress,
      });
    }
    traveledDistance += segmentDistance;
  }
  return clampNormalizedPoint(smoothed[smoothed.length - 1]!);
}
