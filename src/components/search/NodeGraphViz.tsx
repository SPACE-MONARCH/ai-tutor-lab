"use client";

import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import { GraphNode, GraphEdge, GraphSearchStep } from "@/lib/search-algorithms";

interface NodeGraphVizProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodesChange: (nodes: GraphNode[]) => void;
  onEdgesChange: (edges: GraphEdge[]) => void;
  startNode: string;
  goalNode: string;
  onSetStart: (id: string) => void;
  onSetGoal: (id: string) => void;
  activeTool: string;
  stampWeight: number;
  stepData?: GraphSearchStep;
  title: string;
  isPlaying: boolean;
}

export function NodeGraphViz({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  startNode,
  goalNode,
  onSetStart,
  onSetGoal,
  activeTool,
  stampWeight,
  stepData,
  title,
  isPlaying,
}: NodeGraphVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Initialize Cytoscape once
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#131313",
            "border-width": 2,
            "border-color": "#262626",
            label: "data(id)",
            color: "#adaaaa",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 12,
            "font-family": "Space Grotesk",
            width: 40,
            height: 40,
            "transition-property": "background-color, border-color, width, height",
            "transition-duration": 200,
          },
        },
        {
          selector: "edge",
          style: {
            width: "3px",
            "line-color": "#262626",
            "curve-style": "bezier",
            label: "data(weight)",
            color: "#adaaaa",
            "font-size": 10,
            "text-background-color": "#131313",
            "text-background-opacity": 1,
            "text-background-padding": "2px",
            "transition-property": "line-color, width",
            "transition-duration": 200,
          },
        },
        // START node
        {
          selector: "node[isStart]",
          style: {
            "background-color": "#2ff801",
            "border-color": "#8eff71",
            color: "#0d6100",
          },
        },
        // GOAL node
        {
          selector: "node[isGoal]",
          style: {
            "background-color": "#d873ff",
            "border-color": "#ebadff",
            color: "#39004f",
          },
        },
        // FRONTIER node
        {
          selector: "node[isFrontier]",
          style: {
            "background-color": "rgba(0, 212, 236, 0.1)",
            "border-color": "rgba(0, 212, 236, 0.5)",
            color: "#00d4ec",
          },
        },
        // EXPLORED node
        {
          selector: "node[isExplored]",
          style: {
            "background-color": "#262626",
          },
        },
        // CURRENT node
        {
          selector: "node[isCurrent]",
          style: {
            "background-color": "rgba(0, 212, 236, 0.5)",
            "border-color": "#00e3fd",
            width: 45,
            height: 45,
          },
        },
        // PATH node
        {
          selector: "node.isPath",
          style: {
            "background-color": "rgba(142, 255, 113, 0.4)",
            "border-color": "#8eff71",
            "border-width": 4,
          },
        },
        // PATH edge
        {
          selector: "edge.isPath",
          style: {
            "line-color": "#8eff71",
            width: "4px",
          },
        },
        // SELECTED node (for edge creation)
        {
          selector: ".isSelected",
          style: {
            "border-color": "#fff",
            "border-width": 4,
          },
        },
      ],
      layout: { name: "preset" },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  // Sync elements
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().remove();

    cy.add([
      ...nodes.map((n) => ({
        data: { id: n.id },
        position: { x: n.x || 0, y: n.y || 0 },
      })),
      ...edges.map((e, index) => ({
        data: {
          id: `e${index}`,
          source: e.source,
          target: e.target,
          weight: e.weight,
        },
      })),
    ]);
  }, [nodes, edges]);

  // Apply visual states (start, goal, search steps)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("isSelected isPath");
    cy.edges().removeClass("isPath");
    cy.nodes().data("isStart", false);
    cy.nodes().data("isGoal", false);
    cy.nodes().data("isFrontier", false);
    cy.nodes().data("isExplored", false);
    cy.nodes().data("isCurrent", false);

    // Apply specific badges
    cy.getElementById(startNode).data("isStart", true);
    cy.getElementById(goalNode).data("isGoal", true);

    if (selectedNode) {
      cy.getElementById(selectedNode).addClass("isSelected");
    }

    if (stepData) {
      stepData.explored.forEach((id) => cy.getElementById(id).data("isExplored", true));
      stepData.frontier.forEach((id) => cy.getElementById(id).data("isFrontier", true));
      cy.getElementById(stepData.current).data("isCurrent", true);

      if (stepData.path) {
        stepData.path.forEach((id, i) => {
          cy.getElementById(id).addClass("isPath");
          if (i > 0) {
            const prev = stepData.path![i - 1];
            // Find edge connecting prev and id
            cy.edges(`[source="${prev}"][target="${id}"], [source="${id}"][target="${prev}"]`).addClass("isPath");
          }
        });
      }
    }
  }, [startNode, goalNode, stepData, selectedNode, nodes, edges]);

  // Event Listeners for Interaction
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const handleTapNode = (evt: cytoscape.EventObject) => {
      if (isPlaying) return;
      const node = evt.target;
      const id = node.id();

      if (activeTool === "start") {
        onSetStart(id);
      } else if (activeTool === "goal") {
        onSetGoal(id);
      } else if (activeTool === "empty") {
        // Delete Node
        onNodesChange(nodes.filter((n) => n.id !== id));
        onEdgesChange(edges.filter((e) => e.source !== id && e.target !== id));
      } else if (activeTool === "wall") {
        // Select for Edge creation
        if (!selectedNode) {
          setSelectedNode(id);
        } else {
          if (selectedNode !== id) {
            // Check if edge exists
            const exists = edges.find(
              (e) => (e.source === selectedNode && e.target === id) || (e.source === id && e.target === selectedNode)
            );
            if (!exists) {
              onEdgesChange([...edges, { source: selectedNode, target: id, weight: stampWeight }]);
            }
          }
          setSelectedNode(null);
        }
      }
    };

    const handleTapBg = (evt: cytoscape.EventObject) => {
      if (isPlaying) return;
      if (evt.target === cy) {
        if (activeTool === "wall") {
          // Add Node on background tap
          const newId = `n${Date.now().toString().slice(-4)}`;
          onNodesChange([...nodes, { id: newId, x: evt.position.x, y: evt.position.y }]);
        }
        setSelectedNode(null);
      }
    };

    const handleTapEdge = (evt: cytoscape.EventObject) => {
      if (isPlaying) return;
      const edge = evt.target;
      const source = edge.data("source");
      const target = edge.data("target");

      if (activeTool === "weight") {
        onEdgesChange(
          edges.map((e) =>
            (e.source === source && e.target === target) || (e.source === target && e.target === source)
              ? { ...e, weight: stampWeight }
              : e
          )
        );
      } else if (activeTool === "empty") {
        // Erase Edge
        onEdgesChange(
          edges.filter(
            (e) => !((e.source === source && e.target === target) || (e.source === target && e.target === source))
          )
        );
      }
    };

    const handleDragFree = (evt: cytoscape.EventObject) => {
      // Sync node positions back to React state when dragged
      const draggedNode = evt.target;
      const id = draggedNode.id();
      const pos = draggedNode.position();
      onNodesChange(nodes.map(n => n.id === id ? { ...n, x: pos.x, y: pos.y } : n));
    };

    cy.on("tap", "node", handleTapNode);
    cy.on("tap", handleTapBg);
    cy.on("tap", "edge", handleTapEdge);
    cy.on("dragfree", "node", handleDragFree);

    return () => {
      cy.off("tap", "node", handleTapNode);
      cy.off("tap", handleTapBg);
      cy.off("tap", "edge", handleTapEdge);
      cy.off("dragfree", "node", handleDragFree);
    };
  }, [nodes, edges, activeTool, stampWeight, selectedNode, isPlaying, onNodesChange, onEdgesChange, onSetStart, onSetGoal]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center text-[#8eff71] font-bold font-['Space_Grotesk'] tracking-wider">
        <span>{title}</span>
        {stepData && (
          <span className="text-xs px-2 py-1 bg-[#262626] rounded-md text-white border border-white/5">
            Cost: {stepData.stats.pathCost} | Expanded: {stepData.stats.nodesExpanded}
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full h-[320px] sm:h-[400px] md:h-[480px] bg-[#1a1a1a] rounded-xl border border-white/5 shadow-inner"
        style={{ touchAction: "none" }} // Fix for mobile pinch/pan
      />
    </div>
  );
}
