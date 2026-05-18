import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Application, Graphics } from "pixi.js";

import { interpolateMovementEntity } from "../engine/movement/movementPlayback";
import {
  sanitizeMovementPathRecord,
  type MovementPathEntityType,
  type MovementPathRecord,
} from "../engine/shared/movementPaths";
import {
  clampNormalizedPoint,
  type NormalizedPoint,
} from "../engine/shared/normalization";
import {
  createSandboxViewportMapper,
  drawSandboxMovementPath,
  drawSandboxPathAnchors,
  drawSandboxPitch,
  type SandboxViewportMapper,
} from "../sandbox/movement/movementSandboxRenderer";

type SandboxEntity = {
  id: string;
  label: string;
  entityType: MovementPathEntityType;
  color: number;
  start: NormalizedPoint;
  end: NormalizedPoint;
  radius: number;
};

const SANDBOX_ENTITIES: readonly SandboxEntity[] = [
  {
    id: "p1",
    label: "Player 1",
    entityType: "player",
    color: 0x38bdf8,
    start: { x: 18, y: 24 },
    end: { x: 80, y: 34 },
    radius: 10,
  },
  {
    id: "p2",
    label: "Player 2",
    entityType: "player",
    color: 0x4ade80,
    start: { x: 22, y: 62 },
    end: { x: 72, y: 56 },
    radius: 10,
  },
  {
    id: "p3",
    label: "Player 3",
    entityType: "player",
    color: 0xf472b6,
    start: { x: 38, y: 42 },
    end: { x: 64, y: 66 },
    radius: 10,
  },
  {
    id: "ball-1",
    label: "Ball",
    entityType: "ball",
    color: 0xfef08a,
    start: { x: 30, y: 50 },
    end: { x: 76, y: 50 },
    radius: 7,
  },
];

const ROOT_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(1200px 650px at 50% -30%, rgba(56, 189, 248, 0.20), rgba(3, 7, 18, 0.96))",
  margin: 0,
  display: "grid",
  placeItems: "center",
};

const BOARD_STYLE: CSSProperties = {
  width: "min(94vw, 1120px)",
  height: "min(82vh, 720px)",
  borderRadius: "14px",
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  boxShadow: "0 24px 54px rgba(2, 6, 23, 0.52)",
  background: "#0b1220",
};

const PANEL_STYLE: CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  bottom: "16px",
  width: "min(94vw, 1120px)",
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  background: "rgba(8, 15, 31, 0.86)",
  backdropFilter: "blur(8px)",
  display: "grid",
  gap: "10px",
  padding: "12px",
  color: "#e2e8f0",
  fontFamily: "Inter, system-ui, sans-serif",
};

const ROW_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "8px",
};

const BUTTON_STYLE: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.45)",
  borderRadius: "10px",
  background: "rgba(15, 23, 42, 0.86)",
  color: "#e2e8f0",
  fontSize: "13px",
  fontWeight: 600,
  padding: "7px 10px",
  cursor: "pointer",
};

const INPUT_STYLE: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.45)",
  borderRadius: "8px",
  background: "rgba(15, 23, 42, 0.82)",
  color: "#e2e8f0",
  fontSize: "13px",
  fontWeight: 600,
  padding: "7px 9px",
};

function upsertPath(paths: readonly MovementPathRecord[], nextPath: MovementPathRecord): MovementPathRecord[] {
  let replaced = false;
  const updated = paths.map((path) => {
    if (
      path.entityType === nextPath.entityType &&
      path.entityId === nextPath.entityId &&
      path.phaseIndex === nextPath.phaseIndex
    ) {
      replaced = true;
      return nextPath;
    }
    return path;
  });
  return replaced ? updated : [...updated, nextPath];
}

function getEntityById(entityId: string): SandboxEntity {
  return SANDBOX_ENTITIES.find((entity) => entity.id === entityId) ?? SANDBOX_ENTITIES[0]!;
}

function buildDemoCurve(entity: SandboxEntity): NormalizedPoint[] {
  const direction = entity.entityType === "ball" ? 1 : -1;
  const bend = entity.entityType === "ball" ? 18 : 12;
  return [
    entity.start,
    clampNormalizedPoint({
      x: entity.start.x + (entity.end.x - entity.start.x) * 0.3,
      y: entity.start.y + bend * direction,
    }),
    clampNormalizedPoint({
      x: entity.start.x + (entity.end.x - entity.start.x) * 0.7,
      y: entity.end.y - bend * direction,
    }),
    entity.end,
  ];
}

export default function MovementFoundationSandboxPage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapperRef = useRef<SandboxViewportMapper>(createSandboxViewportMapper(960, 640));
  const appRef = useRef<Application | null>(null);
  const pitchGraphicRef = useRef<Graphics | null>(null);
  const pathGraphicRef = useRef<Graphics | null>(null);
  const anchorGraphicRef = useRef<Graphics | null>(null);
  const entityGraphicRef = useRef<Graphics | null>(null);

  const [selectedEntityId, setSelectedEntityId] = useState(SANDBOX_ENTITIES[0]!.id);
  const [movementPaths, setMovementPaths] = useState<MovementPathRecord[]>([]);
  const [draftPoints, setDraftPoints] = useState<NormalizedPoint[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);

  const movementPathsRef = useRef<MovementPathRecord[]>(movementPaths);
  const draftPointsRef = useRef<NormalizedPoint[]>(draftPoints);
  const selectedEntityIdRef = useRef(selectedEntityId);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const progressRef = useRef(progress);

  movementPathsRef.current = movementPaths;
  draftPointsRef.current = draftPoints;
  selectedEntityIdRef.current = selectedEntityId;
  isPlayingRef.current = isPlaying;
  speedRef.current = speed;
  progressRef.current = progress;

  const selectedEntity = useMemo(() => getEntityById(selectedEntityId), [selectedEntityId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    void (async () => {
      const app = new Application();
      await app.init({
        width: host.clientWidth || 960,
        height: host.clientHeight || 640,
        background: "#091325",
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      });
      if (disposed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }
      appRef.current = app;
      host.appendChild(app.canvas as HTMLCanvasElement);
      app.canvas.style.width = "100%";
      app.canvas.style.height = "100%";
      app.canvas.style.display = "block";
      app.canvas.style.touchAction = "none";

      const pitchGraphic = new Graphics();
      const pathGraphic = new Graphics();
      const anchorGraphic = new Graphics();
      const entityGraphic = new Graphics();
      pitchGraphicRef.current = pitchGraphic;
      pathGraphicRef.current = pathGraphic;
      anchorGraphicRef.current = anchorGraphic;
      entityGraphicRef.current = entityGraphic;
      app.stage.addChild(pitchGraphic, pathGraphic, anchorGraphic, entityGraphic);

      const interactionLayer = new Graphics();
      interactionLayer.eventMode = "static";
      interactionLayer.zIndex = 10;
      app.stage.sortableChildren = true;
      app.stage.addChild(interactionLayer);

      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        app.renderer.resize(width, height);
        mapperRef.current = createSandboxViewportMapper(width, height, 24);
        interactionLayer.clear();
        interactionLayer
          .rect(0, 0, width, height)
          .fill({ color: 0xffffff, alpha: 0.0001 });
      };

      const drawScene = () => {
        const mapper = mapperRef.current;
        const pitch = pitchGraphicRef.current;
        const paths = pathGraphicRef.current;
        const anchors = anchorGraphicRef.current;
        const entities = entityGraphicRef.current;
        if (!pitch || !paths || !anchors || !entities) return;

        drawSandboxPitch(pitch, mapper);
        paths.clear();
        anchors.clear();
        entities.clear();

        const selectedId = selectedEntityIdRef.current;
        const activePaths = movementPathsRef.current;
        for (const path of activePaths) {
          drawSandboxMovementPath({
            graphic: paths,
            mapper,
            path,
            emphasized: path.entityId === selectedId,
          });
        }

        const selected = getEntityById(selectedId);
        if (draftPointsRef.current.length > 0) {
          const previewPoints = [selected.start, ...draftPointsRef.current, selected.end];
          drawSandboxMovementPath({
            graphic: anchors,
            mapper,
            path: { entityType: selected.entityType, points: previewPoints },
            emphasized: true,
          });
          drawSandboxPathAnchors({
            graphic: anchors,
            mapper,
            points: draftPointsRef.current,
            color: 0xf8fafc,
          });
        }

        for (const entity of SANDBOX_ENTITIES) {
          const interpolated =
            interpolateMovementEntity({
              paths: activePaths,
              entityType: entity.entityType,
              entityId: entity.id,
              phaseIndex: 0,
              fromPoint: entity.start,
              toPoint: entity.end,
              progress: progressRef.current,
              fallbackPath: [entity.start, entity.end],
              minPointDistance: 0.5,
            }) ?? entity.start;
          const world = mapper.normalizedToWorld(interpolated);
          entities
            .circle(world.x, world.y, entity.radius)
            .fill({ color: entity.color, alpha: 0.98 })
            .stroke({
              color: entity.id === selectedId ? 0xf8fafc : 0x0f172a,
              width: entity.id === selectedId ? 2.2 : 1.2,
              alpha: 0.95,
              alignment: 0.5,
            });
        }
      };

      interactionLayer.on("pointerdown", (event) => {
        const pointerEvent = event as {
          getLocalPosition?: (target: unknown) => { x: number; y: number };
          data?: { getLocalPosition?: (target: unknown) => { x: number; y: number } };
        };
        const stagePoint =
          pointerEvent.getLocalPosition?.(app.stage) ??
          pointerEvent.data?.getLocalPosition?.(app.stage);
        if (!stagePoint) return;
        const nextPoint = clampNormalizedPoint(mapperRef.current.worldToNormalized(stagePoint));
        setDraftPoints((previous) => [...previous, nextPoint]);
      });

      const onTick = ({ deltaMS }: { deltaMS: number }) => {
        if (!isPlayingRef.current) {
          drawScene();
          return;
        }
        const nextProgress = Math.min(
          1,
          progressRef.current + (Math.max(0, deltaMS) * Math.max(0.2, speedRef.current)) / 7000,
        );
        progressRef.current = nextProgress;
        setProgress(nextProgress);
        if (nextProgress >= 1) {
          setIsPlaying(false);
        }
        drawScene();
      };

      app.ticker.add(onTick);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();
      drawScene();
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      const app = appRef.current;
      if (!app) return;
      try {
        host.removeChild(app.canvas as HTMLCanvasElement);
      } catch {
        // already removed
      }
      app.ticker.stop();
      app.destroy(true, { children: true, texture: true });
      appRef.current = null;
      pitchGraphicRef.current = null;
      pathGraphicRef.current = null;
      anchorGraphicRef.current = null;
      entityGraphicRef.current = null;
    };
  }, []);

  const applyPathRecord = (entity: SandboxEntity, points: readonly NormalizedPoint[]) => {
    const record = sanitizeMovementPathRecord({
      id: `sandbox-${entity.id}-phase-0`,
      entityId: entity.id,
      entityType: entity.entityType,
      phaseIndex: 0,
      points,
      metadata: { source: "movement-foundation-sandbox" },
    });
    if (!record) return;
    setMovementPaths((previous) => upsertPath(previous, record));
  };

  const commitDraftForSelectedEntity = () => {
    if (draftPoints.length <= 0) return;
    applyPathRecord(selectedEntity, [selectedEntity.start, ...draftPoints, selectedEntity.end]);
    setDraftPoints([]);
  };

  const assignDemoCurveForSelectedEntity = () => {
    applyPathRecord(selectedEntity, buildDemoCurve(selectedEntity));
    setDraftPoints([]);
  };

  const clearSelectedPath = () => {
    setMovementPaths((previous) =>
      previous.filter(
        (path) =>
          !(
            path.entityId === selectedEntity.id &&
            path.entityType === selectedEntity.entityType &&
            path.phaseIndex === 0
          ),
      ),
    );
    setDraftPoints([]);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setProgress(0);
    progressRef.current = 0;
  };

  return (
    <div style={ROOT_STYLE}>
      <div ref={hostRef} style={BOARD_STYLE} />
      <div style={PANEL_STYLE}>
        <div style={ROW_STYLE}>
          <strong style={{ fontSize: "13px", letterSpacing: "0.01em" }}>Movement Foundation Sandbox</strong>
          <span style={{ fontSize: "12px", opacity: 0.8 }}>
            Click pitch to add draft points for selected entity.
          </span>
        </div>
        <div style={ROW_STYLE}>
          <label style={{ fontSize: "12px", opacity: 0.9 }} htmlFor="entity-select">
            Entity
          </label>
          <select
            id="entity-select"
            value={selectedEntityId}
            style={INPUT_STYLE}
            onChange={(event) => {
              setSelectedEntityId(event.target.value);
              setDraftPoints([]);
            }}
          >
            {SANDBOX_ENTITIES.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.label}
              </option>
            ))}
          </select>
          <button type="button" style={BUTTON_STYLE} onClick={commitDraftForSelectedEntity}>
            Save Drawn Path
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={assignDemoCurveForSelectedEntity}>
            Assign Demo Curve
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={() => setDraftPoints([])}>
            Clear Draft
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={clearSelectedPath}>
            Remove Entity Path
          </button>
        </div>
        <div style={ROW_STYLE}>
          <button type="button" style={BUTTON_STYLE} onClick={() => setIsPlaying(true)}>
            Play
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={() => setIsPlaying(false)}>
            Pause
          </button>
          <button type="button" style={BUTTON_STYLE} onClick={resetPlayback}>
            Reset
          </button>
          <label htmlFor="speed-range" style={{ fontSize: "12px", opacity: 0.9 }}>
            Speed
          </label>
          <input
            id="speed-range"
            type="range"
            min={0.4}
            max={2.4}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
          <span style={{ fontSize: "12px", opacity: 0.9 }}>{speed.toFixed(1)}x</span>
          <span style={{ fontSize: "12px", opacity: 0.9 }}>Progress {(progress * 100).toFixed(0)}%</span>
          <span style={{ fontSize: "12px", opacity: 0.78 }}>
            Paths saved: {movementPaths.length} · Draft points: {draftPoints.length}
          </span>
        </div>
      </div>
    </div>
  );
}
