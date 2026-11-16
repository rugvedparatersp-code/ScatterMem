
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const API = "https://scattermem-api.onrender.com";

const colors = {
  document: "#A78BFA",
  finding: "#22D3EE",
  task: "#FBBF24",
  decision: "#34D399"
};

const icons = {
  document: "▤",
  finding: "✧",
  task: "✓",
  decision: "◇"
};

const filters = [
  "all",
  "document",
  "finding",
  "decision",
  "task"
];



function buildNodes(records) {
  const categories = [
    {
      type: "document",
      title: "DOCUMENTS",
      x: 0,
      y: 0,
      width: 390,
      color: "#A78BFA",
      columns: 2
    },
    {
      type: "finding",
      title: "FINDINGS",
      x: 440,
      y: 0,
      width: 570,
      color: "#22D3EE",
      columns: 4
    },
    {
      type: "decision",
      title: "DECISIONS",
      x: 1060,
      y: 0,
      width: 390,
      color: "#34D399",
      columns: 2
    },
    {
      type: "task",
      title: "TASKS",
      x: 1500,
      y: 0,
      width: 350,
      color: "#FBBF24",
      columns: 2
    }
  ];

  const icons = {
    document: "▤",
    finding: "✧",
    decision: "◇",
    task: "✓"
  };

  const nodes = [];

  categories.forEach(category => {
    const items = records.filter(
      item => item.type === category.type
    );

    const rows = Math.max(1, Math.ceil(items.length / category.columns));
    const height = Math.max(250, 115 + rows * 125);

    // Background container for each cluster
    nodes.push({
      id: `cluster-${category.type}`,
      type: "group",
      position: { x: category.x, y: category.y },
      data: { label: "" },
      selectable: false,
      draggable: false,
      style: {
        width: category.width,
        height,
        background: `${category.color}0D`,
        border: `1px dashed ${category.color}88`,
        borderRadius: 28,
        zIndex: -1
      }
    });

    // Cluster heading
    nodes.push({
      id: `heading-${category.type}`,
      position: { x: 18, y: 15 },
      parentId: `cluster-${category.type}`,
      extent: "parent",
      draggable: false,
      selectable: false,
      data: {
        label: (
          <div style={{
            color: category.color,
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: 2
          }}>
            {icons[category.type]} {category.title}
            <span style={{
              marginLeft: 10,
              fontSize: 11,
              opacity: 0.7
            }}>
              {items.length}
            </span>
          </div>
        )
      },
      style: {
        width: category.width - 35,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 5
      }
    });

    // Records inside the cluster
    items.forEach((item, index) => {
      const column = index % category.columns;
      const row = Math.floor(index / category.columns);

      nodes.push({
        id: item.id,
        parentId: `cluster-${category.type}`,
        extent: "parent",
        position: {
          x: 18 + column * (category.width / category.columns),
          y: 65 + row * 125
        },
        data: {
          label: (
            <div style={{ padding: "5px 3px" }}>
              <div style={{
                color: category.color,
                fontSize: 10,
                fontWeight: 800,
                marginBottom: 8,
                letterSpacing: 1
              }}>
                {icons[category.type]} {category.type}
              </div>
              <div style={{
                color: "#F8FAFC",
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1.5
              }}>
                {item.label}
              </div>
            </div>
          ),
          record: item.details,
          recordType: category.type,
          title: item.label
        },
        style: {
          width: category.type === "finding" ? 125 : 155,
          background: "#151D30",
          border: `1px solid ${category.color}`,
          borderRadius: 12,
          padding: 8,
          boxShadow: `0 0 15px ${category.color}18`
        }
      });
    });
  });

  return nodes;
}


function NexusMapContent({ token }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showConnections, setShowConnections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flow, setFlow] = useState(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/nexus-map`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.detail || "Unable to load graph data.");
}

const result = await response.json();

      setNodes(buildNodes(result.nodes || []));

      setEdges((result.edges || []).map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relationship,
        type: "smoothstep",
        animated: true,
        style: {
            stroke: "#A78BFA",
            strokeWidth: 2,
            strokeDasharray: "8 5",
             filter: "drop-shadow(0 0 5px #8B5CF6)"
        },
        labelStyle: { fill: "#C4B5FD", fontSize: 10 }
      })));

      setSummary(result.summary || {});
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);


const visibleNodes = useMemo(() => {
  const matchingRecords = nodes.filter(node => {
    if (!node.data?.recordType) return false;

    const typeMatches =
      filter === "all" || node.data.recordType === filter;

    const searchMatches =
      (node.data.title || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    return typeMatches && searchMatches;
  });

  const visibleIds = new Set(
    matchingRecords.map(node => node.id)
  );

  if (showConnections) {
    edges.forEach(edge => {
      if (visibleIds.has(edge.source)) {
        visibleIds.add(edge.target);
      }

      if (visibleIds.has(edge.target)) {
        visibleIds.add(edge.source);
      }
    });
  }

  const visibleRecords = nodes.filter(node =>
    node.data?.recordType && visibleIds.has(node.id)
  );

  const visibleTypes = new Set(
    visibleRecords.map(node => node.data.recordType)
  );

  return nodes.filter(node => {
    if (node.id.startsWith("cluster-")) {
      return visibleTypes.has(node.id.replace("cluster-", ""));
    }

    if (node.id.startsWith("heading-")) {
      return visibleTypes.has(node.id.replace("heading-", ""));
    }

    return node.data?.recordType && visibleIds.has(node.id);
  });
}, [nodes, edges, filter, search, showConnections]);


  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map(node => node.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    if (!showConnections) return [];

    return edges.filter(edge =>
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target)
    );
  }, [edges, showConnections, visibleNodeIds]);

  const resetView = () => {
    if (flow) {
      flow.fitView({ padding: 0.2, duration: 500, maxZoom: 0.9 });
    }
  };

  const selectNode = (_, node) => setSelected(node);

  return (
    <div style={{
      color: "#F8FAFC",
      padding: "24px",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <div style={{
            color: "#A78BFA",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2
          }}>
            PROJECT CONNECTION INTELLIGENCE
          </div>
          <h1 style={{ fontSize: 30, margin: "8px 0" }}>
            NEXUS MAP
          </h1>
          <p style={{ color: "#94A3B8", margin: 0 }}>
            Explore and understand your project knowledge.
          </p>
        </div>

        <button onClick={loadGraph} style={buttonStyle}>
          ↻ Refresh
        </button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(125px,1fr))",
        gap: 12,
        marginBottom: 22
      }}>
        {[
          ["Documents", summary.documents, colors.document],
          ["Findings", summary.findings, colors.finding],
          ["Decisions", summary.decisions, colors.decision],
          ["Tasks", summary.tasks, colors.task],
          ["Connections", summary.total_connections, "#A78BFA"]
        ].map(([label, value, color]) => (
          <div key={label} style={{
            background: "#151D30",
            border: "1px solid #293650",
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ color: "#94A3B8", fontSize: 12 }}>
              {label}
            </div>
            <div style={{
              color,
              fontSize: 27,
              fontWeight: 800,
              marginTop: 7
            }}>
              {value ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        marginBottom: 14
      }}>
        {filters.map(item => (
          <button
            key={item}
            onClick={() => {
              setFilter(item);
              setSelected(null);
            }}
            style={{
              ...buttonStyle,
              background: filter === item ? "#7656E8" : "#151D30",
              border: "1px solid #35415C",
              textTransform: "capitalize"
            }}
          >
            {item === "all" ? "All records" : item + "s"}
          </button>
        ))}

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project records..."
          style={{
            flex: 1,
            minWidth: 180,
            padding: "11px 14px",
            background: "#151D30",
            border: "1px solid #35415C",
            borderRadius: 9,
            color: "white",
            outline: "none"
          }}
        />
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 12
      }}>
        <div style={{ color: "#94A3B8", fontSize: 12 }}>
          Showing {visibleNodes.length} of {nodes.length} records
        </div>

        <button
          onClick={() => setShowConnections(!showConnections)}
          style={{
            ...buttonStyle,
            background: showConnections ? "#49327F" : "#151D30"
          }}
        >
          {showConnections ? "Hide connections" : "Show connections"}
        </button>
      </div>

      <div style={{
        height: "min(68vh, 700px)",
        minHeight: 450,
        width: "100%",
        background: "#0B1120",
        border: "1px solid #293650",
        borderRadius: 15,
        overflow: "hidden",
        position: "relative"
      }}>
        {loading ? (
          <div style={{ padding: 30, color: "#94A3B8" }}>
            Loading project knowledge...
          </div>
        ) : error ? (
          <div style={{ padding: 30, color: "#FCA5A5" }}>
            {error}
          </div>
        ) : visibleNodes.length === 0 ? (
          <div style={{ padding: 30, color: "#94A3B8" }}>
            No matching records found.
          </div>
        ) : (
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={selectNode}
            onInit={instance => {
              setFlow(instance);
              setTimeout(() => {
                instance.fitView({
                  padding: 0.2,
                  maxZoom: 0.85
                });
              }, 100);
            }}
            fitView
            minZoom={0.08}
            maxZoom={2.5}
            defaultEdgeOptions={{ type: "smoothstep" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#334155"
              gap={24}
              size={1}
            />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={node => colors[node.data.recordType] || "#64748B"}
              maskColor="rgba(5,10,25,0.75)"
            />
          </ReactFlow>
        )}

        <button
          onClick={resetView}
          style={{
            ...buttonStyle,
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 5
          }}
        >
          Fit graph
        </button>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        marginTop: 16
      }}>
        {Object.entries(colors).map(([type, color]) => (
          <div key={type} style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            color: "#CBD5E1",
            fontSize: 12
          }}>
            <span style={{
              height: 9,
              width: 9,
              borderRadius: "50%",
              background: color
            }} />
            <span style={{ textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{
          marginTop: 18,
          padding: 20,
          background: "#151D30",
          border: "1px solid #35415C",
          borderRadius: 13
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{
              color: colors[selected.data.recordType],
              fontWeight: 800,
              fontSize: 12,
              textTransform: "uppercase"
            }}>
              {selected.data.recordType} details
            </div>
            <button
              onClick={() => setSelected(null)}
              style={buttonStyle}
            >
              Close
            </button>
          </div>

          <h3>{selected.data.title}</h3>

          <pre style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            color: "#CBD5E1",
            fontSize: 12,
            lineHeight: 1.7,
            maxHeight: 350,
            overflowY: "auto"
          }}>
            {JSON.stringify(selected.data.record || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  background: "#7656E8",
  border: "1px solid #8B75F5",
  color: "#FFFFFF",
  padding: "10px 15px",
  borderRadius: 9,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700
};

export default function NexusMap({ token }) {
  return <NexusMapContent token={token} />;
}
