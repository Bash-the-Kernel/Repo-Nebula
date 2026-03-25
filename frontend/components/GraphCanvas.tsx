import { useMemo } from "react";
import ReactFlow, { Background, Controls, Edge, MiniMap, Node } from "reactflow";
import type { ArchitectureGraph } from "@repo-nebula/shared";

interface GraphCanvasProps {
  graph: ArchitectureGraph;
}

function buildFlowNodesAndEdges(graph: ArchitectureGraph): { nodes: Node[]; edges: Edge[] } {
  const layerGap = 280;
  const rowGap = 90;

  const nodes: Node[] = graph.nodes.map((node, index) => {
    const layer = node.type === "folder" ? 0 : node.type === "file" ? 1 : 2;
    const row = index % 10;

    return {
      id: node.id,
      type: "default",
      position: {
        x: 80 + layer * layerGap,
        y: 80 + row * rowGap + Math.floor(index / 10) * 20
      },
      data: {
        label: `${node.label} (${node.type})`
      },
      draggable: true
    };
  });

  const edges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.type,
    animated: edge.type === "import",
    style: {
      strokeWidth: edge.type === "import" ? 1.8 : 1.3
    }
  }));

  return { nodes, edges };
}

export function GraphCanvas({ graph }: GraphCanvasProps) {
  const flowData = useMemo(() => buildFlowNodesAndEdges(graph), [graph]);

  return (
    <div className="h-[72vh] rounded-2xl border border-line bg-white">
      <ReactFlow nodes={flowData.nodes} edges={flowData.edges} fitView>
        <MiniMap />
        <Controls showInteractive />
        <Background gap={20} />
      </ReactFlow>
    </div>
  );
}
