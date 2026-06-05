"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

type RawCharacter = { id: string; name: string; characterType: string };
type RawRelationship = {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  type: string;
  note: string | null;
};

type SimNode = {
  id: string;
  name: string;
  characterType: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type SimEdge = {
  id: string;
  from: string;
  to: string;
  type: string;
  note: string | null;
};

// ── Relationship styling ─────────────────────────────────────────────────────

const REL_COLOR: Record<string, string> = {
  relative: "#9e8a6c", // muted gold-brown
  friend: "#5a8a6e",   // muted green
  enemy: "#8b2635",    // crimson
};
const REL_LABEL: Record<string, string> = {
  relative: "Family",
  friend: "Friend",
  enemy: "Enemy",
};
const REL_DASH: Record<string, string> = {
  relative: "6 3",
  friend: "none",
  enemy: "3 3",
};
const CUSTOM_COLOR = "#6a7a9e"; // muted blue-grey for user-defined types

// ── Force simulation (no external dependency) ─────────────────────────────────
//
// A simple Verlet-style force simulation with:
//   • charge repulsion between all pairs
//   • spring attraction along edges
//   • weak centering gravity
//   • velocity damping

const REPULSION = 4800;
const SPRING_LEN = 160;
const SPRING_K = 0.04;
const GRAVITY = 0.012;
const DAMPING = 0.82;
const ITERATIONS = 280;

function runSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  cx: number,
  cy: number
): SimNode[] {
  if (nodes.length === 0) return nodes;

  // Work on a mutable copy
  const ns = nodes.map((n) => ({ ...n }));
  const idxById = new Map(ns.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Dampen velocity
    for (const n of ns) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
    }

    // Charge repulsion (O(n²) — fine for story-bible character counts)
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i], b = ns[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = REPULSION / dist2;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // Spring attraction along edges (bidirectional)
    for (const e of edges) {
      const ai = idxById.get(e.from);
      const bi = idxById.get(e.to);
      if (ai === undefined || bi === undefined) continue;
      const a = ns[ai], b = ns[bi];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = dist - SPRING_LEN;
      const fx = (dx / dist) * SPRING_K * stretch;
      const fy = (dy / dist) * SPRING_K * stretch;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Gravity toward center
    for (const n of ns) {
      n.vx += (cx - n.x) * GRAVITY;
      n.vy += (cy - n.y) * GRAVITY;
    }

    // Integrate
    for (const n of ns) {
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return ns;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConnectionsMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<SimEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pan/zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragState = useRef<{ startX: number; startY: number; txStart: number; tyStart: number } | null>(null);

  // Tooltip state (hovered edge note)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // ── Fetch & layout ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/connections")
      .then((r) => r.json())
      .then(({ characters, relationships }: { characters: RawCharacter[]; relationships: RawRelationship[] }) => {
        if (cancelled) return;

        const W = containerRef.current?.clientWidth ?? 700;
        const H = containerRef.current?.clientHeight ?? 500;
        const cx = W / 2;
        const cy = H / 2;

        // Initialize nodes at random positions around center
        const initial: SimNode[] = characters.map((c) => ({
          ...c,
          x: cx + (Math.random() - 0.5) * 200,
          y: cy + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0,
        }));

        const simEdges: SimEdge[] = relationships.map((r) => ({
          id: r.id,
          from: r.fromCharacterId,
          to: r.toCharacterId,
          type: r.type,
          note: r.note,
        }));

        const settled = runSimulation(initial, simEdges, cx, cy);
        setNodes(settled);
        setEdges(simEdges);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load connection data.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Pan handling ────────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      txStart: transform.x,
      tyStart: transform.y,
    };
  }, [transform.x, transform.y]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setTransform((t) => ({ ...t, x: dragState.current!.txStart + dx, y: dragState.current!.tyStart + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragState.current = null;
  }, []);

  // ── Zoom handling ────────────────────────────────────────────────────────────

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({
      ...t,
      scale: Math.min(3, Math.max(0.25, t.scale * delta)),
    }));
  }, []);

  // ── Node position lookup ─────────────────────────────────────────────────────

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>
          Drawing connections…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "#d4848e" }}>{error}</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", textAlign: "center" }}>
          No characters yet. Add characters and their relationships<br />to see the connections map.
        </p>
      </div>
    );
  }

  const NODE_R = 28;

  return (
    <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden", cursor: dragState.current ? "grabbing" : "grab" }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block", userSelect: "none" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          {/* Arrow markers for known relationship types */}
          {Object.entries(REL_COLOR).map(([type, color]) => (
            <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={color} opacity={0.7} />
            </marker>
          ))}
          {/* Fallback marker for custom / user-defined types */}
          <marker id="arrow-custom" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CUSTOM_COLOR} opacity={0.7} />
          </marker>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* ── Edges ── */}
          {edges.map((e) => {
            const a = nodeById.get(e.from);
            const b = nodeById.get(e.to);
            if (!a || !b) return null;

            // Shorten line so arrowhead doesn't overlap node circle
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const x1 = a.x + (dx / dist) * (NODE_R + 2);
            const y1 = a.y + (dy / dist) * (NODE_R + 2);
            const x2 = b.x - (dx / dist) * (NODE_R + 10);
            const y2 = b.y - (dy / dist) * (NODE_R + 10);

            const isKnown = e.type in REL_COLOR;
            const color = isKnown ? REL_COLOR[e.type] : CUSTOM_COLOR;
            const dash = REL_DASH[e.type] ?? "none";
            const markerKey = isKnown ? e.type : "custom";

            return (
              <g key={e.id}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={color}
                  strokeWidth={1.8}
                  strokeDasharray={dash}
                  strokeOpacity={0.65}
                  markerEnd={`url(#arrow-${markerKey})`}
                />
                {/* Invisible wider hit area for tooltip */}
                {e.note && (
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="transparent"
                    strokeWidth={12}
                    style={{ cursor: "help" }}
                    onMouseEnter={(ev) => {
                      setTooltip({ x: ev.clientX, y: ev.clientY, text: e.note! });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )}
                {/* Edge label mid-point */}
                {e.note && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 5}
                    textAnchor="middle"
                    fill={color}
                    fontSize={10}
                    fontFamily="var(--font-body)"
                    opacity={0.85}
                  >
                    {e.note}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {nodes.map((n) => (
            <g
              key={n.id}
              data-node="true"
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/admin/characters/${n.id}`)}
            >
              {/* Outer glow ring on hover — using filter trick */}
              <circle
                cx={n.x} cy={n.y} r={NODE_R + 4}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth={1.5}
                opacity={0}
                className="node-glow"
              />
              <circle
                cx={n.x} cy={n.y} r={NODE_R}
                fill="var(--color-bg-elevated)"
                stroke="var(--color-border)"
                strokeWidth={1.5}
                onMouseEnter={(e) => {
                  const g = e.currentTarget.parentElement;
                  const glow = g?.querySelector(".node-glow") as SVGCircleElement | null;
                  if (glow) glow.setAttribute("opacity", "0.6");
                  e.currentTarget.setAttribute("stroke", "var(--color-gold)");
                }}
                onMouseLeave={(e) => {
                  const g = e.currentTarget.parentElement;
                  const glow = g?.querySelector(".node-glow") as SVGCircleElement | null;
                  if (glow) glow.setAttribute("opacity", "0");
                  e.currentTarget.setAttribute("stroke", "var(--color-border)");
                }}
              />
              {/* Character type abbreviation */}
              <text
                x={n.x} y={n.y - 3}
                textAnchor="middle"
                fill="var(--color-ink-faint)"
                fontSize={9}
                fontFamily="var(--font-body)"
                letterSpacing="0.08em"
                style={{ textTransform: "uppercase", pointerEvents: "none" }}
              >
                {n.characterType.slice(0, 3).toUpperCase()}
              </text>
              {/* Name label below node */}
              <text
                x={n.x} y={n.y + NODE_R + 16}
                textAnchor="middle"
                fill="var(--color-ink)"
                fontSize={12}
                fontFamily="var(--font-heading)"
                fontWeight={400}
                style={{ pointerEvents: "none" }}
              >
                {n.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* ── Legend ── */}
      <div
        style={{
          position: "absolute",
          bottom: "1rem",
          right: "1rem",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "0.6rem 0.9rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        {Object.entries(REL_LABEL).map(([type, label]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width={32} height={10}>
              <line x1={0} y1={5} x2={28} y2={5} stroke={REL_COLOR[type]} strokeWidth={2} strokeDasharray={REL_DASH[type]} opacity={0.8} />
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--color-ink-muted)" }}>
              {label}
            </span>
          </div>
        ))}
        {/* Custom types present in the current data */}
        {[...new Set(edges.map((e) => e.type).filter((t) => !(t in REL_COLOR)))].sort().map((type) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width={32} height={10}>
              <line x1={0} y1={5} x2={28} y2={5} stroke={CUSTOM_COLOR} strokeWidth={2} opacity={0.8} />
            </svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", letterSpacing: "0.08em", color: "var(--color-ink-muted)", textTransform: "capitalize" }}>
              {type}
            </span>
          </div>
        ))}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.65rem",
          color: "var(--color-ink-faint)",
          fontStyle: "italic",
          marginTop: "0.2rem",
        }}>
          Drag to pan · scroll to zoom · click a node
        </p>
      </div>

      {/* ── Tooltip ── */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 8,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "3px",
            padding: "0.25rem 0.6rem",
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-ink-muted)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
