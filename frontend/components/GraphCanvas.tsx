import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArchitectureGraph } from "@repo-nebula/shared";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

interface ForceNode {
  id: string;
  label?: string;
  type?: string;
  language?: string;
  cluster?: string;
  val?: number;
  x?: number;
  y?: number;
  z?: number;
}

interface ForceLink {
  source: string | ForceNode;
  target: string | ForceNode;
  type?: string;
  value?: number;
}

interface ForceGraphApi {
  zoomToFit: (durationMs?: number, paddingPx?: number, nodeFilter?: (node: unknown) => boolean) => void;
  centerAt: (x?: number, y?: number, durationMs?: number) => void;
  camera: () => {
    fov: number;
    aspect: number;
    position: { x: number; y: number; z: number };
  };
  cameraPosition: (
    position?: { x?: number; y?: number; z?: number },
    lookAt?: { x?: number; y?: number; z?: number },
    transitionMs?: number
  ) => void;
}

interface GraphCanvasProps {
  graph: ArchitectureGraph;
  autoCenter?: boolean;
  centerPadding?: number;
  viewportCenterBiasPx?: { x: number; y: number };
}

function getBarycenter(nodes: ForceNode[]): { x: number; y: number; z: number } {
  const positioned = nodes.filter(
    (node) =>
      typeof node.x === "number" &&
      Number.isFinite(node.x) &&
      typeof node.y === "number" &&
      Number.isFinite(node.y) &&
      typeof node.z === "number" &&
      Number.isFinite(node.z)
  );

  if (positioned.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const totals = positioned.reduce(
    (acc, node) => ({
      x: acc.x + (node.x as number),
      y: acc.y + (node.y as number),
      z: acc.z + (node.z as number)
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: totals.x / positioned.length,
    y: totals.y / positioned.length,
    z: totals.z / positioned.length
  };
}

export function GraphCanvas({
  graph,
  autoCenter = true,
  centerPadding = 110,
  viewportCenterBiasPx = { x: 0, y: 0 }
}: GraphCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [clusterMode, setClusterMode] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const graphRef = useRef<ForceGraphApi | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const lastCenterSignatureRef = useRef<string>("");
  const lastCenterAtRef = useRef<number>(0);

  const graphData = useMemo(() => {
    if (!clusterMode) {
      return {
        nodes: graph.nodes.map((node) => ({ ...node, val: Math.max(2, Math.min(40, node.size ?? 8)) })) as ForceNode[],
        links: graph.edges as ForceLink[]
      };
    }

    const clusterNodes = new Map<string, { id: string; label: string; cluster: string; val: number }>();
    const clusterLinks = new Map<string, { source: string; target: string; value: number; type: string }>();

    for (const node of graph.nodes) {
      const cluster = node.cluster ?? "misc";
      const id = `cluster:${cluster}`;
      const existing = clusterNodes.get(id);
      clusterNodes.set(id, {
        id,
        label: cluster,
        cluster,
        val: (existing?.val ?? 0) + 1
      });
    }

    for (const edge of graph.edges) {
      const sourceNode = graph.nodes.find((node) => node.id === edge.source);
      const targetNode = graph.nodes.find((node) => node.id === edge.target);
      if (!sourceNode || !targetNode) {
        continue;
      }
      const sourceCluster = `cluster:${sourceNode.cluster ?? "misc"}`;
      const targetCluster = `cluster:${targetNode.cluster ?? "misc"}`;
      if (sourceCluster === targetCluster) {
        continue;
      }
      const key = `${sourceCluster}->${targetCluster}`;
      const existing = clusterLinks.get(key);
      clusterLinks.set(key, {
        source: sourceCluster,
        target: targetCluster,
        value: (existing?.value ?? 0) + 1,
        type: edge.type
      });
    }

    return {
      nodes: Array.from(clusterNodes.values()),
      links: Array.from(clusterLinks.values())
    };
  }, [graph, clusterMode]);

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId);

  const performAutoCenter = useCallback(
    (reason: string, animateMs = 700) => {
      if (!autoCenter || !graphRef.current || !canvasContainerRef.current) {
        return;
      }

      const now = Date.now();
      if (now - lastCenterAtRef.current < 120 && reason === "resize") {
        return;
      }

      const nodes = graphData.nodes;
      const barycenter = getBarycenter(nodes);

      const signature = `${reason}:${nodes.length}:${Math.round(barycenter.x)}:${Math.round(barycenter.y)}:${Math.round(barycenter.z)}:${isPanelCollapsed}`;
      if (signature === lastCenterSignatureRef.current && reason !== "engine-stop") {
        return;
      }

      lastCenterSignatureRef.current = signature;
      lastCenterAtRef.current = now;

      graphRef.current.zoomToFit(animateMs, centerPadding);

      const camera = graphRef.current.camera();
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const viewportCenterX = window.innerWidth / 2 + viewportCenterBiasPx.x;
      const viewportCenterY = window.innerHeight / 2 + viewportCenterBiasPx.y;
      const canvasCenterX = containerRect.left + containerRect.width / 2;
      const canvasCenterY = containerRect.top + containerRect.height / 2;

      const deltaPxX = canvasCenterX - viewportCenterX;
      const deltaPxY = canvasCenterY - viewportCenterY;

      const depth = Math.max(1, Math.abs(camera.position.z - barycenter.z));
      const fovRad = (camera.fov * Math.PI) / 180;
      const worldHeight = 2 * depth * Math.tan(fovRad / 2);
      const worldWidth = worldHeight * camera.aspect;

      const worldPerPixelX = worldWidth / Math.max(1, containerRect.width);
      const worldPerPixelY = worldHeight / Math.max(1, containerRect.height);

      const offsetX = deltaPxX * worldPerPixelX;
      const offsetY = -deltaPxY * worldPerPixelY;

      graphRef.current.cameraPosition(
        undefined,
        {
          x: barycenter.x + offsetX,
          y: barycenter.y + offsetY,
          z: barycenter.z
        },
        animateMs
      );
    },
    [autoCenter, centerPadding, graphData.nodes, isPanelCollapsed, viewportCenterBiasPx.x, viewportCenterBiasPx.y]
  );

  const scheduleAutoCenter = useCallback(
    (reason: string, animateMs = 700) => {
      if (!autoCenter) {
        return;
      }

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
        }

        settleTimerRef.current = window.setTimeout(() => {
          performAutoCenter(reason, animateMs);
        }, 110);
      });
    },
    [autoCenter, performAutoCenter]
  );

  useEffect(() => {
    scheduleAutoCenter("data-change", 780);
  }, [graphData.nodes.length, graphData.links.length, clusterMode, isPanelCollapsed, scheduleAutoCenter]);

  useEffect(() => {
    if (!canvasContainerRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      scheduleAutoCenter("resize", 620);
    });

    observer.observe(canvasContainerRef.current);

    const handleWindowResize = () => {
      scheduleAutoCenter("window-resize", 620);
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
      }
    };
  }, [scheduleAutoCenter]);

  return (
    <div className={`grid gap-4 ${isPanelCollapsed ? "lg:grid-cols-[1fr_56px]" : "lg:grid-cols-[1fr_280px]"}`}>
      <div ref={canvasContainerRef} className="surface h-[72vh] overflow-hidden rounded-2xl">
        <ForceGraph3D
          ref={graphRef as never}
          graphData={graphData as never}
          backgroundColor="#090718"
          nodeLabel={(node: unknown) => {
            const n = node as { label?: string; type?: string; id?: string; language?: string };
            return `${n.label ?? n.id} ${n.type ? `(${n.type})` : ""} ${n.language ? `• ${n.language}` : ""}`;
          }}
          nodeAutoColorBy={(node: unknown) => {
            const n = node as { cluster?: string };
            return n.cluster ?? "default";
          }}
          linkWidth={(link: unknown) => {
            const l = link as { type?: string; value?: number };
            if (typeof l.value === "number") {
              return Math.min(4, 0.5 + l.value / 4);
            }
            return l.type === "import" ? 1.8 : 1.2;
          }}
          linkColor={(link: unknown) => {
            const l = link as { type?: string };
            if (l.type === "call") {
              return "#4be7ff";
            }
            if (l.type === "inheritance") {
              return "#ff8fd8";
            }
            if (l.type === "composition") {
              return "#8d67ff";
            }
            return "#9ab6ff";
          }}
          linkOpacity={0.58}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={1.2}
          enableNodeDrag
          cooldownTicks={160}
          d3VelocityDecay={0.3}
          d3AlphaDecay={0.015}
          onEngineStop={() => {
            scheduleAutoCenter("engine-stop", 900);
          }}
          onNodeClick={(node: unknown) => {
            const n = node as { id: string };
            setSelectedNodeId(n.id);
          }}
        />
      </div>

      <aside className="surface rounded-2xl p-4 text-sm">
        <button
          type="button"
          onClick={() => setIsPanelCollapsed((previous) => !previous)}
          className="mb-3 w-full rounded-lg border border-line px-2 py-1 text-xs uppercase tracking-wide text-ink/70"
        >
          {isPanelCollapsed ? "Open Panel" : "Collapse Panel"}
        </button>

        {isPanelCollapsed ? null : (
          <>
        <h3 className="font-display text-lg glow-text">Viewer Controls</h3>
        <p className="mt-2 text-ink/70">Rotate, pan, and zoom directly in the 3D graph canvas.</p>

        <button
          type="button"
          onClick={() => setClusterMode((previous) => !previous)}
          className="mt-4 w-full rounded-lg border border-line px-3 py-2 text-left"
        >
          {clusterMode ? "Expand Clusters" : "Collapse To Clusters"}
        </button>

        <div className="mt-4 border-t border-line pt-4">
          <h4 className="font-semibold">Selected Node</h4>
          {selectedNode ? (
            <>
              <p className="mt-2 text-ink">{selectedNode.label}</p>
              <p className="text-ink/70">Type: {selectedNode.type}</p>
              <p className="text-ink/70">Language: {selectedNode.language ?? "unknown"}</p>
              <p className="text-ink/70">Cluster: {selectedNode.cluster ?? "n/a"}</p>
            </>
          ) : (
            <p className="mt-2 text-ink/70">Click a node to inspect details and follow dependency chains.</p>
          )}
        </div>
          </>
        )}
      </aside>
    </div>
  );
}
