"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

type RawCharacter = { id: string; name: string; characterType: string };
type CharRoles = Record<string, string[]>; // characterId -> role names
type RawRelationship = {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  type: string;
  note: string | null;
};
type RawSpecies = { id: string; name: string; color: string; shape: string };

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

type Shape = "circle" | "triangle" | "diamond" | "square";
type SpeciesInfo = { color: string; shape: Shape };

// ── Default species ───────────────────────────────────────────────────────────

const DEFAULT_SPECIES: Record<string, SpeciesInfo> = {
  Human:       { color: "#4a8c5c", shape: "circle" },
  Vampire:     { color: "#8b2635", shape: "triangle" },
  Werewolf:    { color: "#3a6b9e", shape: "circle" },
  Wizard:      { color: "#7a4a9e", shape: "diamond" },
  Shapeshifter:{ color: "#9e6a3a", shape: "circle" },
  Ghost:       { color: "#7a7a8a", shape: "circle" },
};
const FALLBACK_SPECIES: SpeciesInfo = { color: "#6a7a9e", shape: "circle" };

function getSpeciesInfo(name: string, custom: RawSpecies[]): SpeciesInfo {
  const key = Object.keys(DEFAULT_SPECIES).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  if (key) return DEFAULT_SPECIES[key];
  const found = custom.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (found) return { color: found.color, shape: found.shape as Shape };
  return FALLBACK_SPECIES;
}

// ── SVG shape helpers ─────────────────────────────────────────────────────────

function NodeShape({
  cx, cy, r, shape, color,
  onMouseEnter, onMouseLeave,
}: {
  cx: number; cy: number; r: number; shape: Shape; color: string;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}) {
  const props = { fill: color, opacity: 0.85, onMouseEnter, onMouseLeave };
  if (shape === "triangle") {
    const pts = `${cx},${cy - r} ${cx + r * 0.866},${cy + r * 0.5} ${cx - r * 0.866},${cy + r * 0.5}`;
    return <polygon points={pts} {...props} className="node-shape" />;
  }
  if (shape === "diamond") {
    const pts = `${cx},${cy - r} ${cx + r * 0.7},${cy} ${cx},${cy + r} ${cx - r * 0.7},${cy}`;
    return <polygon points={pts} {...props} className="node-shape" />;
  }
  if (shape === "square") {
    const s = r * 1.25;
    return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} {...props} className="node-shape" />;
  }
  return <circle cx={cx} cy={cy} r={r} {...props} className="node-shape" />;
}

// Tiny shape for legend / UI
function LegendShape({ shape, color, size = 10 }: { shape: Shape; color: string; size?: number }) {
  const s = size;
  if (shape === "triangle") {
    const pts = `${s},${0} ${s * 2},${s * 1.6} ${0},${s * 1.6}`;
    return <svg width={s * 2} height={s * 1.6} style={{ flexShrink: 0 }}><polygon points={pts} fill={color} opacity={0.85} /></svg>;
  }
  if (shape === "diamond") {
    const pts = `${s},${0} ${s * 1.5},${s * 0.8} ${s},${s * 1.6} ${s * 0.5},${s * 0.8}`;
    return <svg width={s * 2} height={s * 1.6} style={{ flexShrink: 0 }}><polygon points={pts} fill={color} opacity={0.85} /></svg>;
  }
  if (shape === "square") {
    return <svg width={s * 1.4} height={s * 1.4} style={{ flexShrink: 0 }}><rect x={0} y={0} width={s * 1.4} height={s * 1.4} fill={color} opacity={0.85} /></svg>;
  }
  return <svg width={s * 2} height={s * 2} style={{ flexShrink: 0 }}><circle cx={s} cy={s} r={s} fill={color} opacity={0.85} /></svg>;
}

// ── Node size ─────────────────────────────────────────────────────────────────

// Fixed small uniform radius for all nodes — matches the style of the species legend
const NODE_R = 7;

// ── Relationship styling ─────────────────────────────────────────────────────

const REL_COLOR: Record<string, string> = {
  relative: "#9e8a6c",
  friend:   "#5a8a6e",
  enemy:    "#8b2635",
};
const REL_LABEL: Record<string, string> = {
  relative: "Family",
  friend:   "Friend",
  enemy:    "Enemy",
};
const REL_DASH: Record<string, string> = {
  relative: "6 3",
  friend:   "none",
  enemy:    "3 3",
};
const CUSTOM_COLOR = "#6a7a9e";

// ── Force simulation ──────────────────────────────────────────────────────────

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
  cy: number,
  charRoles: CharRoles
): SimNode[] {
  if (nodes.length === 0) return nodes;
  const ns = nodes.map((n) => ({ ...n }));
  const idxById = new Map(ns.map((n, i) => [n.id, i]));

  // Y target for protagonists: top 20% of the canvas
  const protagonistY = cy * 0.35;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (const n of ns) { n.vx *= DAMPING; n.vy *= DAMPING; }

    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i], b = ns[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist2 = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(dist2);
        const force = REPULSION / dist2;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
      }
    }

    for (const e of edges) {
      const ai = idxById.get(e.from), bi = idxById.get(e.to);
      if (ai === undefined || bi === undefined) continue;
      const a = ns[ai], b = ns[bi];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = dist - SPRING_LEN;
      const fx = (dx / dist) * SPRING_K * stretch, fy = (dy / dist) * SPRING_K * stretch;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }

    for (const n of ns) {
      const roles = charRoles[n.id] ?? [];
      if (roles.includes("Protagonist")) {
        // Strong pull toward top-center
        n.vx += (cx - n.x) * GRAVITY * 0.9;
        n.vy += (protagonistY - n.y) * GRAVITY * 3.5;
      } else {
        n.vx += (cx - n.x) * GRAVITY;
        n.vy += (cy - n.y) * GRAVITY;
      }
    }
    for (const n of ns) { n.x += n.vx; n.y += n.vy; }
  }
  return ns;
}

// ── Species Panel (read-only) ─────────────────────────────────────────────────

function ManageSpeciesPanel({ customSpecies }: { customSpecies: RawSpecies[] }) {
  const allSpecies = [
    ...Object.entries(DEFAULT_SPECIES).map(([n, s]) => ({ id: n, name: n, ...s, isDefault: true })),
    ...customSpecies.map((s) => ({ ...s, isDefault: false })),
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: "240px",
        background: "var(--color-bg-elevated)",
        borderLeft: "1px solid var(--color-border)",
        overflowY: "auto",
        padding: "1rem",
        zIndex: 5,
      }}
    >
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-gold)", marginBottom: "0.75rem" }}>
        Species
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {allSpecies.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <LegendShape shape={s.shape as Shape} color={s.color} size={8} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: s.isDefault ? "var(--color-ink-muted)" : "var(--color-ink)", flex: 1 }}>
              {s.name}
            </span>
            {!s.isDefault && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--color-ink-faint)", textTransform: "uppercase" }}>
                custom
              </span>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "1rem", lineHeight: 1.5 }}>
        Add custom species from a character page.
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConnectionsMap() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [edges, setEdges] = useState<SimEdge[]>([]);
  const [customSpecies, setCustomSpecies] = useState<RawSpecies[]>([]);
  const [charRoles, setCharRoles] = useState<CharRoles>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSpeciesPanel, setShowSpeciesPanel] = useState(false);

  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragState = useRef<{ startX: number; startY: number; txStart: number; tyStart: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const fetchData = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/connections")
      .then((r) => r.json())
      .then(({ characters, relationships, species, charRoles: roles }: {
        characters: RawCharacter[];
        relationships: RawRelationship[];
        species: RawSpecies[];
        charRoles: CharRoles;
      }) => {
        if (cancelled) return;

        const W = containerRef.current?.clientWidth ?? 700;
        const H = containerRef.current?.clientHeight ?? 500;
        const cx = W / 2, cy = H / 2;

        const initial: SimNode[] = characters.map((c) => ({
          ...c,
          x: cx + (Math.random() - 0.5) * 200,
          y: cy + (Math.random() - 0.5) * 200,
          vx: 0, vy: 0,
        }));
        const simEdges: SimEdge[] = relationships.map((r) => ({
          id: r.id, from: r.fromCharacterId, to: r.toCharacterId, type: r.type, note: r.note,
        }));

        setNodes(runSimulation(initial, simEdges, cx, cy, roles ?? {}));
        setEdges(simEdges);
        setCustomSpecies(species);
        setCharRoles(roles ?? {});
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError("Could not load connection data."); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cancel = fetchData();
    return cancel;
  }, [fetchData]);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest("[data-node]")) return;
    e.preventDefault();
    dragState.current = { startX: e.clientX, startY: e.clientY, txStart: transform.x, tyStart: transform.y };
  }, [transform.x, transform.y]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragState.current) return;
    setTransform((t) => ({ ...t, x: dragState.current!.txStart + (e.clientX - dragState.current!.startX), y: dragState.current!.tyStart + (e.clientY - dragState.current!.startY) }));
  }, []);

  const onMouseUp = useCallback(() => { dragState.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setTransform((t) => ({ ...t, scale: Math.min(3, Math.max(0.25, t.scale * (e.deltaY > 0 ? 0.9 : 1.1))) }));
  }, []);

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  if (loading) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic" }}>Drawing connections…</p>
    </div>;
  }
  if (error) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-body)", color: "#d4848e" }}>{error}</p>
    </div>;
  }
  if (nodes.length === 0) {
    return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-body)", color: "var(--color-ink-faint)", fontStyle: "italic", textAlign: "center" }}>
        No characters yet. Add characters and their relationships<br />to see the connections map.
      </p>
    </div>;
  }

  // All unique species present in the current data
  const presentSpeciesNames = [...new Set(nodes.map((n) => n.characterType))].sort();

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
          {Object.entries(REL_COLOR).map(([type, color]) => (
            <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={color} opacity={0.7} />
            </marker>
          ))}
          <marker id="arrow-custom" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={CUSTOM_COLOR} opacity={0.7} />
          </marker>
        </defs>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* ── Edges ── */}
          {edges.map((e) => {
            const a = nodeById.get(e.from), b = nodeById.get(e.to);
            if (!a || !b) return null;
            const dx = b.x - a.x, dy = b.y - a.y;
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
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.8} strokeDasharray={dash} strokeOpacity={0.65} markerEnd={`url(#arrow-${markerKey})`} />
                {e.note && (
                  <>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={12} style={{ cursor: "help" }}
                      onMouseEnter={(ev) => setTooltip({ x: ev.clientX, y: ev.clientY, text: e.note! })}
                      onMouseLeave={() => setTooltip(null)} />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 5} textAnchor="middle" fill={color} fontSize={10} fontFamily="var(--font-body)" opacity={0.85}>{e.note}</text>
                  </>
                )}
              </g>
            );
          })}

          {/* ── Nodes ── */}
          {nodes.map((n) => {
            const sp = getSpeciesInfo(n.characterType, customSpecies);
            return (
              <g key={n.id} data-node="true" style={{ cursor: "pointer" }}
                onClick={() => router.push(`/admin/characters/${n.id}`)}>
                {/* Hover glow */}
                <circle cx={n.x} cy={n.y} r={NODE_R + 5} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} opacity={0} className="node-glow" />
                {/* Small uniform species symbol */}
                <NodeShape
                  cx={n.x} cy={n.y} r={NODE_R}
                  shape={sp.shape} color={sp.color}
                  onMouseEnter={(e) => {
                    const g = (e.currentTarget as SVGElement).parentElement;
                    const glow = g?.querySelector(".node-glow") as SVGCircleElement | null;
                    if (glow) glow.setAttribute("opacity", "0.5");
                  }}
                  onMouseLeave={(e) => {
                    const g = (e.currentTarget as SVGElement).parentElement;
                    const glow = g?.querySelector(".node-glow") as SVGCircleElement | null;
                    if (glow) glow.setAttribute("opacity", "0");
                  }}
                />
                {/* Name label — to the right of the symbol, with stroke halo for readability */}
                <text
                  x={n.x + NODE_R + 5}
                  y={n.y + 4}
                  textAnchor="start"
                  fill="var(--color-ink)"
                  fontSize={11}
                  fontFamily="var(--font-body)"
                  stroke="var(--color-bg)"
                  strokeWidth={3}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* ── Legend (bottom-left) ── */}
      <div
        style={{
          position: "absolute", bottom: "1rem", left: "1rem",
          background: "rgba(22,18,26,0.92)",
          border: "1px solid var(--color-border)",
          borderRadius: "4px",
          padding: "0.6rem 0.85rem",
          display: "flex", flexDirection: "column", gap: "0.35rem",
          maxWidth: showSpeciesPanel ? "0" : "220px",
          overflow: "hidden",
          transition: "max-width 0.2s",
          pointerEvents: showSpeciesPanel ? "none" : "auto",
          opacity: showSpeciesPanel ? 0 : 1,
        }}
      >
        {/* Relationship types */}
        {Object.entries(REL_LABEL).map(([type, label]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width={30} height={10}><line x1={0} y1={5} x2={26} y2={5} stroke={REL_COLOR[type]} strokeWidth={2} strokeDasharray={REL_DASH[type]} opacity={0.8} /></svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--color-ink-muted)" }}>{label}</span>
          </div>
        ))}
        {[...new Set(edges.map((e) => e.type).filter((t) => !(t in REL_COLOR)))].sort().map((type) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg width={30} height={10}><line x1={0} y1={5} x2={26} y2={5} stroke={CUSTOM_COLOR} strokeWidth={2} opacity={0.8} /></svg>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--color-ink-muted)", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0.15rem 0" }} />

        {/* Species symbols */}
        {presentSpeciesNames.map((name) => {
          const sp = getSpeciesInfo(name, customSpecies);
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <LegendShape shape={sp.shape} color={sp.color} size={8} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--color-ink-muted)" }}>{name}</span>
            </div>
          );
        })}

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.65rem", color: "var(--color-ink-faint)", fontStyle: "italic", marginTop: "0.2rem" }}>
          Drag · scroll to zoom · click node
        </p>
      </div>

      {/* ── Manage Species toggle ── */}
      <button
        type="button"
        onClick={() => setShowSpeciesPanel((v) => !v)}
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: showSpeciesPanel ? "rgba(201,168,76,0.12)" : "rgba(22,18,26,0.88)",
          border: `1px solid ${showSpeciesPanel ? "var(--color-gold-dim)" : "var(--color-border)"}`,
          borderRadius: "3px",
          padding: "0.3rem 0.75rem",
          color: showSpeciesPanel ? "var(--color-gold)" : "var(--color-ink-muted)",
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          letterSpacing: "0.06em",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        {showSpeciesPanel ? "← Map" : "Species"}
      </button>

      {/* ── Species panel (read-only) ── */}
      {showSpeciesPanel && (
        <ManageSpeciesPanel customSpecies={customSpecies} />
      )}

      {/* ── Tooltip ── */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 12, top: tooltip.y - 8,
          background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
          borderRadius: "3px", padding: "0.25rem 0.6rem",
          fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-ink-muted)",
          pointerEvents: "none", zIndex: 10,
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
