
import { useEffect, useState } from "react";

const colors = {
  critical: "#F85149",
  warning: "#D29922",
  info: "#58A6FF",
  background: "#0D1117",
  border: "#30363D",
  text: "#E6EDF3",
  muted: "#8B949E",
  green: "#3FB950"
};

const categoryLabels = {
  stale_document: "Stale Document",
  overdue_task: "Overdue Task",
  unassigned_task: "Unassigned Task",
  pending_review: "Pending Review",
  missing_evidence: "Missing Evidence"
};

const categoryIcons = {
  stale_document: "▤",
  overdue_task: "◷",
  unassigned_task: "◎",
  pending_review: "✓",
  missing_evidence: "△"
};

export default function MemoryPulse({ apiRequest }) {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  async function loadMemoryPulse() {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/memory-pulse");
      setPulse(data);
    } catch (err) {
      setError(err.message || "Could not load Memory Pulse.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemoryPulse();
  }, []);

  const summary = pulse?.summary || {};
  const alerts = pulse?.alerts || [];

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "All") return true;
    if (filter === "Critical") return alert.severity === "critical";
    if (filter === "Warnings") return alert.severity === "warning";
    return alert.type === filter;
  });

  const summaryCards = [
    {
      label: "Total Alerts",
      value: summary.total_alerts ?? 0,
      color: colors.info,
      icon: "◈"
    },
    {
      label: "Critical Issues",
      value: summary.critical ?? 0,
      color: colors.critical,
      icon: "!"
    },
    {
      label: "Warnings",
      value: summary.warnings ?? 0,
      color: colors.warning,
      icon: "△"
    },
    {
      label: "Stale Documents",
      value: summary.stale_documents ?? 0,
      color: "#A78BFA",
      icon: "▤"
    }
  ];

  const secondaryStats = [
    ["Overdue Tasks", summary.overdue_tasks],
    ["Unassigned Tasks", summary.unassigned_tasks],
    ["Pending Reviews", summary.pending_reviews],
    ["Missing Evidence", summary.missing_evidence]
  ];

  const cardStyle = {
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "20px"
  };

  const buttonStyle = {
    background: "#21262D",
    border: `1px solid ${colors.border}`,
    borderRadius: "7px",
    padding: "9px 14px",
    color: colors.text,
    cursor: "pointer",
    fontSize: "13px"
  };

  return (
    <div style={{ color: colors.text }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div>
          <p className="eyebrow">PROJECT KNOWLEDGE MONITOR</p>
          <h1 style={{ margin: "8px 0" }}>Memory Pulse</h1>
          <p style={{ color: colors.muted, margin: 0 }}>
            Monitor forgotten knowledge, overdue work and unresolved project gaps.
          </p>
        </div>

        <button
          style={buttonStyle}
          onClick={loadMemoryPulse}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Pulse"}
        </button>
      </div>

      {error && (
        <div style={{
          ...cardStyle,
          borderColor: colors.critical,
          color: "#FF7B72",
          marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      {loading && !pulse && (
        <div className="empty-state">
          Scanning project memory...
        </div>
      )}

      {pulse && (
        <>
          <div style={{
            ...cardStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <div>
              <p className="eyebrow">MEMORY HEALTH STATUS</p>
              <h2 style={{ margin: "8px 0" }}>
                {summary.total_alerts === 0
                  ? "Your project memory looks healthy"
                  : "Your project needs attention"}
              </h2>
              <p style={{ color: colors.muted, margin: 0 }}>
                {summary.total_alerts === 0
                  ? "No issues were detected in the latest scan."
                  : `${summary.total_alerts} items need attention.`}
              </p>
            </div>

            <div style={{
              fontSize: "38px",
              color: summary.critical > 0
                ? colors.critical
                : summary.total_alerts > 0
                  ? colors.warning
                  : colors.green
            }}>
              {summary.critical > 0 ? "!" :
                summary.total_alerts > 0 ? "◈" : "✓"}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "14px",
            marginBottom: "25px"
          }}>
            {summaryCards.map(item => (
              <div key={item.label} style={cardStyle}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span style={{ color: colors.muted, fontSize: "13px" }}>
                    {item.label}
                  </span>
                  <span style={{ color: item.color, fontSize: "20px" }}>
                    {item.icon}
                  </span>
                </div>
                <h2 style={{
                  fontSize: "30px",
                  margin: "15px 0 0",
                  color: item.color
                }}>
                  {item.value}
                </h2>
              </div>
            ))}
          </div>

          <div style={{
            ...cardStyle,
            marginBottom: "25px"
          }}>
            <h3 style={{ marginTop: 0 }}>Additional Checks</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
              gap: "15px"
            }}>
              {secondaryStats.map(([label, value]) => (
                <div key={label} style={{
                  borderLeft: `3px solid ${colors.border}`,
                  paddingLeft: "12px"
                }}>
                  <p style={{
                    color: colors.muted,
                    fontSize: "13px",
                    margin: "0 0 6px"
                  }}>
                    {label}
                  </p>
                  <strong style={{ fontSize: "22px" }}>
                    {value ?? 0}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "15px"
          }}>
            <div>
              <h2 style={{ margin: "0 0 5px" }}>Detected Alerts</h2>
              <p style={{ color: colors.muted, margin: 0, fontSize: "13px" }}>
                Issues identified during the latest memory scan.
              </p>
            </div>

            <select
              value={filter}
              onChange={event => setFilter(event.target.value)}
              style={{
                ...buttonStyle,
                background: colors.background
              }}
            >
              <option value="All">All alerts</option>
              <option value="Critical">Critical</option>
              <option value="Warnings">Warnings</option>
              <option value="stale_document">Stale documents</option>
              <option value="overdue_task">Overdue tasks</option>
              <option value="unassigned_task">Unassigned tasks</option>
              <option value="pending_review">Pending reviews</option>
              <option value="missing_evidence">Missing evidence</option>
            </select>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="empty-state">
              {alerts.length === 0
                ? "No memory issues detected. Your project is up to date!"
                : "No alerts match this filter."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {filteredAlerts.map(alert => {
                const severityColor =
                  alert.severity === "critical"
                    ? colors.critical
                    : colors.warning;

                return (
                  <div
                    key={alert.id}
                    style={{
                      ...cardStyle,
                      borderLeft: `4px solid ${severityColor}`,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        flexWrap: "wrap"
                      }}>
                        <span style={{
                          color: severityColor,
                          fontSize: "18px"
                        }}>
                          {categoryIcons[alert.type] || "◈"}
                        </span>

                        <strong>{alert.title}</strong>

                        <span style={{
                          color: severityColor,
                          background: `${severityColor}18`,
                          border: `1px solid ${severityColor}55`,
                          borderRadius: "20px",
                          padding: "3px 9px",
                          fontSize: "10px",
                          textTransform: "uppercase"
                        }}>
                          {alert.severity}
                        </span>
                      </div>

                      <p style={{
                        color: colors.muted,
                        fontSize: "13px",
                        margin: "12px 0"
                      }}>
                        {alert.description}
                      </p>

                      <p style={{
                        color: colors.info,
                        fontSize: "12px",
                        margin: 0
                      }}>
                        Suggested action: {alert.next_action}
                      </p>

                      <p style={{
                        color: colors.muted,
                        fontSize: "11px",
                        marginBottom: 0
                      }}>
                        {categoryLabels[alert.type] || alert.type}
                        {" · "}
                        {alert.record_type}
                        {" · ID: "}
                        {alert.record_id}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p style={{
            color: colors.muted,
            fontSize: "11px",
            textAlign: "right",
            marginTop: "20px"
          }}>
            Last scanned: {pulse.generated_at
              ? new Date(pulse.generated_at).toLocaleString()
              : "Not available"}
          </p>
        </>
      )}
    </div>
  );
}
