import { useState, useEffect, useCallback } from "react";

const API = "https://postgres-production-49a2.up.railway.app/api/v1";
const TENANT = "00000000-0000-0000-0000-000000000001";

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-Id": TENANT,
};

const api = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { headers, ...opts });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

// ── SEVERITY CONFIG ──────────────────────────────────────────────
const SEV = {
  critical: { color: "#e8453a", bg: "rgba(232,69,58,0.1)", label: "CRITICAL" },
  high:     { color: "#d4820a", bg: "rgba(212,130,10,0.1)", label: "HIGH" },
  medium:   { color: "#c9a227", bg: "rgba(201,162,39,0.1)", label: "MEDIUM" },
  low:      { color: "#4a9b6f", bg: "rgba(74,155,111,0.1)", label: "LOW" },
};

const STATE_COLOR = {
  non_compliant: "#e8453a",
  expiring_soon: "#d4820a",
  compliant:     "#4a9b6f",
  unknown:       "#666",
  unverifiable:  "#555",
};

const fmt = (n) =>
  n >= 1000000
    ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `$${(n / 1000).toFixed(0)}K`
    : `$${n}`;

// ── STYLES ───────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'DM Mono', 'Courier New', monospace", fontWeight: 400,
    background: "#080808",
    color: "#e8e4df",
    minHeight: "100vh",
    display: "flex",
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: "#0c0c0c",
    borderRight: "1px solid rgba(232,228,223,0.08)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },
  logo: {
    padding: "0 24px 32px",
    borderBottom: "1px solid rgba(232,228,223,0.08)",
    marginBottom: 8,
  },
  logoText: {
    fontSize: 13,
    letterSpacing: "0.1em",
    color: "#e8453a",
    fontWeight: 500,
  },
  logoSub: {
    fontSize: 10,
    color: "rgba(232,228,223,0.3)",
    letterSpacing: "0.08em",
    marginTop: 4,
  },
  navItem: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 24px",
    cursor: "pointer",
    fontSize: 11,
    letterSpacing: "0.08em",
    color: active ? "#e8e4df" : "rgba(232,228,223,0.35)",
    background: active ? "rgba(232,69,58,0.08)" : "transparent",
    borderLeft: active ? "2px solid #e8453a" : "2px solid transparent",
    transition: "all 0.15s",
    userSelect: "none",
  }),
  main: {
    flex: 1,
    overflowY: "auto",
    background: "#080808",
  },
  topbar: {
    padding: "20px 32px",
    borderBottom: "1px solid rgba(232,228,223,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    background: "rgba(8,8,8,0.95)",
    backdropFilter: "blur(8px)",
    zIndex: 10,
  },
  pageTitle: {
    fontSize: 13,
    letterSpacing: "0.12em",
    color: "rgba(232,228,223,0.5)",
    textTransform: "uppercase",
  },
  liveTag: {
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#4a9b6f",
    background: "rgba(74,155,111,0.1)",
    padding: "4px 10px",
    border: "1px solid rgba(74,155,111,0.2)",
  },
  content: {
    padding: "32px",
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 32,
  },
  card: {
    background: "#0f0f0f",
    border: "1px solid rgba(232,228,223,0.08)",
    padding: "24px",
  },
  cardLabel: {
    fontSize: 10,
    letterSpacing: "0.15em",
    color: "rgba(232,228,223,0.3)",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  cardBig: {
    fontSize: 36,
    fontWeight: 500,
    lineHeight: 1,
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 11,
    color: "rgba(232,228,223,0.3)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
  },
  th: {
    textAlign: "left",
    padding: "8px 16px",
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "rgba(232,228,223,0.3)",
    borderBottom: "1px solid rgba(232,228,223,0.08)",
    textTransform: "uppercase",
    fontWeight: 400,
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(232,228,223,0.05)",
    verticalAlign: "middle",
  },
  badge: (sev) => ({
    display: "inline-block",
    padding: "3px 8px",
    fontSize: 10,
    letterSpacing: "0.1em",
    color: SEV[sev]?.color || "#666",
    background: SEV[sev]?.bg || "rgba(100,100,100,0.1)",
    border: `1px solid ${SEV[sev]?.color || "#666"}33`,
  }),
  stateBadge: (state) => ({
    display: "inline-block",
    padding: "3px 8px",
    fontSize: 10,
    letterSpacing: "0.08em",
    color: STATE_COLOR[state] || "#666",
    background: `${STATE_COLOR[state]}18` || "rgba(100,100,100,0.1)",
    border: `1px solid ${STATE_COLOR[state]}33` || "1px solid #66633",
  }),
  btn: (variant = "default") => ({
    padding: "7px 16px",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    border: variant === "primary"
      ? "1px solid #e8453a"
      : variant === "green"
      ? "1px solid #4a9b6f"
      : "1px solid rgba(232,228,223,0.15)",
    background: variant === "primary"
      ? "rgba(232,69,58,0.1)"
      : variant === "green"
      ? "rgba(74,155,111,0.1)"
      : "transparent",
    color: variant === "primary"
      ? "#e8453a"
      : variant === "green"
      ? "#4a9b6f"
      : "rgba(232,228,223,0.5)",
    transition: "all 0.15s",
    fontFamily: "inherit",
  }),
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: "0.15em",
    color: "rgba(232,228,223,0.4)",
    textTransform: "uppercase",
  },
  empty: {
    padding: "48px 32px",
    textAlign: "center",
    fontSize: 12,
    color: "rgba(232,228,223,0.2)",
    border: "1px solid rgba(232,228,223,0.06)",
  },
  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalBox: {
    background: "#0f0f0f",
    border: "1px solid rgba(232,228,223,0.12)",
    padding: 40,
    maxWidth: 600,
    width: "100%",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 8,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  modalLabel: {
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "rgba(232,228,223,0.3)",
    textTransform: "uppercase",
    marginBottom: 4,
    marginTop: 16,
  },
  modalVal: {
    fontSize: 13,
    color: "#e8e4df",
    lineHeight: 1.6,
  },
  input: {
    width: "100%",
    background: "rgba(232,228,223,0.04)",
    border: "1px solid rgba(232,228,223,0.12)",
    color: "#e8e4df",
    padding: "10px 14px",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    marginTop: 4,
    boxSizing: "border-box",
  },
  spinner: {
    padding: "80px 32px",
    textAlign: "center",
    fontSize: 11,
    color: "rgba(232,228,223,0.2)",
    letterSpacing: "0.1em",
  },
};

// ── COMPONENTS ───────────────────────────────────────────────────

function Spinner() {
  return <div style={S.spinner}>LOADING DATA...</div>;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{label}</div>
      <div style={{ ...S.cardBig, color: color || "#e8e4df" }}>{value}</div>
      {sub && <div style={S.cardSub}>{sub}</div>}
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────
function Dashboard({ suppliers, breaches, obligations, onNav }) {
  const totalExposure = breaches
    .filter((b) => b.status === "detected" || b.status === "acknowledged" || b.status === "remediating")
    .reduce((s, b) => s + parseFloat(b.estimated_exposure_usd || 0), 0);

  const activeBreaches = breaches.filter(
    (b) => b.status === "detected" || b.status === "acknowledged" || b.status === "remediating"
  );

  const criticalCount = activeBreaches.filter((b) => b.severity === "critical").length;

  const compliantObl = obligations.filter((o) => o.compliance_state === "compliant").length;
  const totalObl = obligations.length;
  const complianceRate = totalObl > 0 ? Math.round((compliantObl / totalObl) * 100) : 0;

  const recentBreaches = [...activeBreaches]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const atRiskSuppliers = suppliers
    .filter((s) => activeBreaches.some((b) => b.supplier_id === s.id))
    .slice(0, 5);

  return (
    <div style={S.content}>
      {/* KPI ROW */}
      <div style={S.grid4}>
        <StatCard
          label="Active Breaches"
          value={activeBreaches.length}
          sub={`${criticalCount} critical`}
          color={activeBreaches.length > 0 ? "#e8453a" : "#4a9b6f"}
        />
        <StatCard
          label="Total Exposure"
          value={fmt(totalExposure)}
          sub="open PO value at risk"
          color={totalExposure > 100000 ? "#e8453a" : "#e8e4df"}
        />
        <StatCard
          label="Compliance Rate"
          value={`${complianceRate}%`}
          sub={`${compliantObl} of ${totalObl} obligations`}
          color={complianceRate < 80 ? "#d4820a" : "#4a9b6f"}
        />
        <StatCard
          label="Suppliers Monitored"
          value={suppliers.length}
          sub="active this tenant"
        />
      </div>

      <div style={S.grid2}>
        {/* ACTIVE BREACHES */}
        <div style={S.card}>
          <div style={S.sectionHead}>
            <div style={S.sectionTitle}>Active Breaches</div>
            <button style={S.btn("primary")} onClick={() => onNav("breaches")}>
              View All →
            </button>
          </div>
          {recentBreaches.length === 0 ? (
            <div style={{ ...S.empty, border: "none", padding: "32px 0" }}>
              No active breaches
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Supplier</th>
                  <th style={S.th}>Severity</th>
                  <th style={S.th}>Exposure</th>
                  <th style={S.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBreaches.map((b) => (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => onNav("breaches")}>
                    <td style={S.td}>
                      <div style={{ fontSize: 11, color: "rgba(232,228,223,0.5)" }}>
                        {suppliers.find((s) => s.id === b.supplier_id)?.name || b.supplier_id.slice(0, 8)}
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={S.badge(b.severity)}>{b.severity.toUpperCase()}</span>
                    </td>
                    <td style={{ ...S.td, color: "#e8453a", fontSize: 12 }}>
                      {fmt(parseFloat(b.estimated_exposure_usd))}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: 10, color: "rgba(232,228,223,0.35)", letterSpacing: "0.08em" }}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* AT-RISK SUPPLIERS */}
        <div style={S.card}>
          <div style={S.sectionHead}>
            <div style={S.sectionTitle}>At-Risk Suppliers</div>
            <button style={S.btn()} onClick={() => onNav("suppliers")}>
              All Suppliers →
            </button>
          </div>
          {atRiskSuppliers.length === 0 ? (
            <div style={{ ...S.empty, border: "none", padding: "32px 0" }}>
              No suppliers at risk
            </div>
          ) : (
            atRiskSuppliers.map((s) => {
              const sb = activeBreaches.filter((b) => b.supplier_id === s.id);
              const maxSev = sb.find((b) => b.severity === "critical")
                ? "critical"
                : sb.find((b) => b.severity === "high")
                ? "high"
                : "medium";
              const exp = sb.reduce((t, b) => t + parseFloat(b.estimated_exposure_usd || 0), 0);
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(232,228,223,0.05)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(232,228,223,0.3)", marginTop: 2 }}>
                      {sb.length} breach{sb.length > 1 ? "es" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "#e8453a" }}>{fmt(exp)}</span>
                    <span style={S.badge(maxSev)}>{maxSev.toUpperCase()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* OBLIGATION STATE BREAKDOWN */}
      <div style={S.card}>
        <div style={{ ...S.sectionHead, marginBottom: 20 }}>
          <div style={S.sectionTitle}>Obligation State Breakdown</div>
          <button style={S.btn()} onClick={() => onNav("obligations")}>
            View Obligations →
          </button>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["compliant", "expiring_soon", "non_compliant", "unknown", "unverifiable"].map((state) => {
            const count = obligations.filter((o) => o.compliance_state === state).length;
            const pct = totalObl > 0 ? (count / totalObl) * 100 : 0;
            return (
              <div key={state} style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "rgba(232,228,223,0.3)", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
                  {state.replace("_", " ")}
                </div>
                <div style={{ height: 4, background: "rgba(232,228,223,0.06)", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: STATE_COLOR[state] }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 500, color: STATE_COLOR[state] }}>{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── BREACHES ─────────────────────────────────────────────────────
function Breaches({ breaches, suppliers, obligations, reload }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("active");
  const [acting, setActing] = useState(false);
  const [notes, setNotes] = useState("");

  const filtered = breaches.filter((b) => {
    if (filter === "active") return ["detected", "acknowledged", "remediating"].includes(b.status);
    if (filter === "resolved") return ["resolved", "dismissed"].includes(b.status);
    return true;
  });

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name || id.slice(0, 8);
  const oblName = (id) => obligations.find((o) => o.id === id)?.name || id.slice(0, 8);

  const act = async (action) => {
    setActing(true);
    try {
      await api(`/breaches/${selected.id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ notes, acknowledged_by: "operator" }),
      });
      await reload();
      setSelected(null);
      setNotes("");
    } catch (e) {
      alert(e.message);
    }
    setActing(false);
  };

  return (
    <div style={S.content}>
      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
        {["active", "resolved", "all"].map((f) => (
          <button
            key={f}
            style={{
              ...S.btn(filter === f ? "primary" : "default"),
              padding: "8px 20px",
            }}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={S.empty}>No breaches in this view</div>
      ) : (
        <div style={S.card}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Supplier</th>
                <th style={S.th}>Obligation</th>
                <th style={S.th}>Severity</th>
                <th style={S.th}>Exposure</th>
                <th style={S.th}>Regulatory</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Detected</th>
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setSelected(b)}>
                  <td style={S.td}>{supplierName(b.supplier_id)}</td>
                  <td style={{ ...S.td, maxWidth: 180, fontSize: 11, color: "rgba(232,228,223,0.6)" }}>
                    {oblName(b.obligation_id)}
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(b.severity)}>{b.severity.toUpperCase()}</span>
                  </td>
                  <td style={{ ...S.td, color: "#e8453a", fontWeight: 500 }}>
                    {fmt(parseFloat(b.estimated_exposure_usd))}
                  </td>
                  <td style={S.td}>
                    {b.regulatory_flags?.length > 0 ? (
                      b.regulatory_flags.map((f) => (
                        <span key={f} style={{ ...S.badge("critical"), marginRight: 4 }}>{f}</span>
                      ))
                    ) : (
                      <span style={{ color: "rgba(232,228,223,0.2)", fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(232,228,223,0.4)" }}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontSize: 10, color: "rgba(232,228,223,0.25)" }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, color: "#e8453a" }}>VIEW →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BREACH DETAIL MODAL */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#e8453a", marginBottom: 8 }}>
                  BREACH RECORD
                </div>
                <div style={S.modalTitle}>{supplierName(selected.supplier_id)}</div>
                <div style={{ fontSize: 12, color: "rgba(232,228,223,0.4)" }}>
                  {oblName(selected.obligation_id)}
                </div>
              </div>
              <span style={S.badge(selected.severity)}>{selected.severity.toUpperCase()}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div style={{ ...S.card, padding: 16 }}>
                <div style={S.cardLabel}>Financial Exposure</div>
                <div style={{ fontSize: 28, color: "#e8453a", fontWeight: 500 }}>
                  {fmt(parseFloat(selected.estimated_exposure_usd))}
                </div>
              </div>
              <div style={{ ...S.card, padding: 16 }}>
                <div style={S.cardLabel}>Regulatory Flags</div>
                <div style={{ fontSize: 14 }}>
                  {selected.regulatory_flags?.length > 0
                    ? selected.regulatory_flags.join(", ")
                    : "None"}
                </div>
              </div>
            </div>

            <div style={S.modalLabel}>Recommended Action</div>
            <div style={{
              ...S.modalVal,
              background: "rgba(232,69,58,0.06)",
              border: "1px solid rgba(232,69,58,0.15)",
              padding: "16px",
              fontSize: 12,
              lineHeight: 1.7,
            }}>
              {selected.recommended_action}
            </div>

            <div style={S.modalLabel}>Breach ID</div>
            <div style={{ ...S.modalVal, fontSize: 11, color: "rgba(232,228,223,0.3)", fontFamily: "inherit" }}>
              {selected.id}
            </div>

            <div style={S.modalLabel}>Detected</div>
            <div style={S.modalVal}>{new Date(selected.created_at).toLocaleString()}</div>

            {/* ACTIONS */}
            {["detected", "acknowledged", "remediating"].includes(selected.status) && (
              <>
                <div style={{ ...S.modalLabel, marginTop: 24 }}>Notes (optional)</div>
                <input
                  style={S.input}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {selected.status === "detected" && (
                    <button style={S.btn("default")} onClick={() => act("acknowledge")} disabled={acting}>
                      Acknowledge
                    </button>
                  )}
                  {selected.status === "acknowledged" && (
                    <button style={S.btn("default")} onClick={() => act("remediate")} disabled={acting}>
                      Start Remediation
                    </button>
                  )}
                  {selected.status === "remediating" && (
                    <button style={S.btn("green")} onClick={() => act("resolve")} disabled={acting}>
                      Mark Resolved ✓
                    </button>
                  )}
                  <button style={S.btn()} onClick={() => act("dismiss")} disabled={acting}>
                    Dismiss
                  </button>
                </div>
              </>
            )}

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button style={S.btn()} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUPPLIERS ────────────────────────────────────────────────────
function Suppliers({ suppliers, obligations, breaches }) {
  const [selected, setSelected] = useState(null);

  const getSupplierState = (sid) => {
    const activeB = breaches.filter(
      (b) => b.supplier_id === sid && ["detected", "acknowledged", "remediating"].includes(b.status)
    );
    if (activeB.some((b) => b.severity === "critical")) return "critical";
    if (activeB.some((b) => b.severity === "high")) return "high";
    if (activeB.length > 0) return "medium";
    return "compliant";
  };

  const supplierObls = selected
    ? obligations.filter((o) => o.supplier_id === selected.id)
    : [];

  return (
    <div style={S.content}>
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Supplier</th>
              <th style={S.th}>Code</th>
              <th style={S.th}>Country</th>
              <th style={S.th}>Obligations</th>
              <th style={S.th}>Active Breaches</th>
              <th style={S.th}>Status</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => {
              const oblCount = obligations.filter((o) => o.supplier_id === s.id).length;
              const bCount = breaches.filter(
                (b) => b.supplier_id === s.id && ["detected", "acknowledged", "remediating"].includes(b.status)
              ).length;
              const state = getSupplierState(s.id);
              return (
                <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => setSelected(s)}>
                  <td style={S.td}>{s.name}</td>
                  <td style={{ ...S.td, fontSize: 11, color: "rgba(232,228,223,0.4)" }}>{s.code}</td>
                  <td style={{ ...S.td, fontSize: 11 }}>{s.country || "—"}</td>
                  <td style={{ ...S.td, fontSize: 12 }}>{oblCount}</td>
                  <td style={S.td}>
                    {bCount > 0 ? (
                      <span style={{ color: "#e8453a", fontSize: 12 }}>{bCount}</span>
                    ) : (
                      <span style={{ color: "rgba(232,228,223,0.2)", fontSize: 11 }}>0</span>
                    )}
                  </td>
                  <td style={S.td}>
                    {state === "compliant" ? (
                      <span style={{ fontSize: 10, color: "#4a9b6f", letterSpacing: "0.08em" }}>COMPLIANT</span>
                    ) : (
                      <span style={S.badge(state)}>{state.toUpperCase()}</span>
                    )}
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, color: "rgba(232,228,223,0.3)" }}>VIEW →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SUPPLIER DETAIL MODAL */}
      {selected && (
        <div style={S.modal} onClick={() => setSelected(null)}>
          <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(232,228,223,0.3)", marginBottom: 8 }}>
                SUPPLIER RECORD
              </div>
              <div style={S.modalTitle}>{selected.name}</div>
              <div style={{ fontSize: 11, color: "rgba(232,228,223,0.3)", marginTop: 4 }}>
                {selected.code} · {selected.country || "Unknown"} · Tier {selected.tier || 1}
              </div>
            </div>

            <div style={S.modalLabel}>Obligations ({supplierObls.length})</div>
            {supplierObls.length === 0 ? (
              <div style={{ fontSize: 12, color: "rgba(232,228,223,0.2)", padding: "16px 0" }}>
                No obligations registered
              </div>
            ) : (
              supplierObls.map((o) => (
                <div
                  key={o.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid rgba(232,228,223,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12 }}>{o.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(232,228,223,0.3)", marginTop: 2 }}>
                      {o.obligation_type.toUpperCase()}
                      {o.expires_at ? ` · expires ${o.expires_at}` : ""}
                    </div>
                  </div>
                  <span style={S.stateBadge(o.compliance_state)}>
                    {o.compliance_state.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              ))
            )}

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button style={S.btn()} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AUDIT ────────────────────────────────────────────────────────
function Audit({ obligations }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedObl, setSelectedObl] = useState("");

  const confirmedObls = obligations.filter((o) => o.confirmed_by);

  const runExport = async () => {
    if (!selectedObl) return;
    setLoading(true);
    try {
      const data = await api(`/audit/export?obligation_id=${selectedObl}`);
      setResult(data);
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const verifyChain = async () => {
    if (!selectedObl) return;
    setLoading(true);
    try {
      const data = await api(`/audit/verify/${selectedObl}`);
      alert(
        data.chain_intact
          ? `✓ Chain intact — ${data.total_events} events verified`
          : `⚠ Chain BROKEN — ${data.failures.length} integrity failures`
      );
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const downloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chainbreak-audit-${selectedObl.slice(0, 8)}.json`;
    a.click();
  };

  return (
    <div style={S.content}>
      <div style={S.card}>
        <div style={S.cardLabel}>Generate Audit Package</div>
        <p style={{ fontSize: 12, color: "rgba(232,228,223,0.4)", marginBottom: 24, lineHeight: 1.7 }}>
          Export a cryptographically signed, tamper-evident audit record for any obligation.
          Formatted for AS9100 / ISO 13485 audit requirements.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={S.modalLabel}>Select Obligation</div>
          <select
            style={{ ...S.input, marginTop: 8 }}
            value={selectedObl}
            onChange={(e) => { setSelectedObl(e.target.value); setResult(null); }}
          >
            <option value="">Select an obligation...</option>
            {confirmedObls.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.compliance_state.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.btn("primary")} onClick={runExport} disabled={!selectedObl || loading}>
            {loading ? "Loading..." : "Export Audit Package"}
          </button>
          <button style={S.btn()} onClick={verifyChain} disabled={!selectedObl || loading}>
            Verify Chain Integrity
          </button>
          {result && (
            <button style={S.btn("green")} onClick={downloadJSON}>
              Download JSON ↓
            </button>
          )}
        </div>
      </div>

      {result && (
        <div style={{ ...S.card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={S.sectionTitle}>Audit Export Results</div>
            <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
              <span style={{ color: result.chain_intact ? "#4a9b6f" : "#e8453a" }}>
                {result.chain_intact ? "✓ CHAIN INTACT" : "⚠ CHAIN BROKEN"}
              </span>
              <span style={{ color: "rgba(232,228,223,0.3)" }}>
                {result.total_records} records
              </span>
            </div>
          </div>

          {result.records.map((r, i) => (
            <div
              key={r.id}
              style={{
                padding: "16px",
                marginBottom: 8,
                background: "rgba(232,228,223,0.02)",
                border: `1px solid ${r.integrity === "OK" ? "rgba(74,155,111,0.15)" : "rgba(232,69,58,0.3)"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(232,228,223,0.3)", letterSpacing: "0.1em" }}>
                  EVENT #{r.sequence_number} · {r.source_adapter.toUpperCase()}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={S.stateBadge(r.result)}>{r.result.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: r.integrity === "OK" ? "#4a9b6f" : "#e8453a" }}>
                    {r.integrity}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(232,228,223,0.4)", marginBottom: 4 }}>
                {new Date(r.verified_at).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, fontFamily: "inherit", color: "rgba(232,228,223,0.2)", wordBreak: "break-all" }}>
                hash: {r.content_hash}
              </div>
              <div style={{ fontSize: 10, fontFamily: "inherit", color: "rgba(232,228,223,0.15)", wordBreak: "break-all" }}>
                sig: {r.signature}
              </div>
              {r.raw_response && (
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(232,228,223,0.35)" }}>
                  {Object.entries(r.raw_response).map(([k, v]) => (
                    <span key={k} style={{ marginRight: 16 }}>
                      {k}: <span style={{ color: "rgba(232,228,223,0.6)" }}>{String(v)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [suppliers, setSuppliers] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, b, o] = await Promise.all([
        api("/suppliers/"),
        api("/breaches/"),
        api("/obligations/"),
      ]);
      setSuppliers(s);
      setBreaches(b);
      setObligations(o);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const NAV = [
    { id: "dashboard", icon: "◈", label: "DASHBOARD" },
    { id: "breaches",  icon: "⚠", label: "BREACHES" },
    { id: "suppliers", icon: "◎", label: "SUPPLIERS" },
    { id: "obligations", icon: "≡", label: "OBLIGATIONS" },
    { id: "audit",     icon: "⛓", label: "AUDIT CHAIN" },
  ];

  const activeBreachCount = breaches.filter(
    (b) => ["detected", "acknowledged", "remediating"].includes(b.status)
  ).length;

  return (
    <div style={S.app}>
      {/* SIDEBAR */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoText}>CHAINBREAK</div>
          <div style={S.logoSub}>ZORYNEX INFRASTRUCTURE</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {NAV.map((n) => (
            <div key={n.id} style={S.navItem(page === n.id)} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.id === "breaches" && activeBreachCount > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: "#e8453a",
                  color: "#fff",
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 0,
                  fontWeight: 500,
                }}>
                  {activeBreachCount}
                </span>
              )}
            </div>
          ))}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(232,228,223,0.08)" }}>
          <div style={{ fontSize: 9, color: "rgba(232,228,223,0.2)", letterSpacing: "0.08em", marginBottom: 4 }}>
            TENANT
          </div>
          <div style={{ fontSize: 10, color: "rgba(232,228,223,0.3)" }}>
            acme-aerospace
          </div>
          {lastSync && (
            <div style={{ fontSize: 9, color: "rgba(232,228,223,0.15)", marginTop: 8 }}>
              synced {lastSync.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div style={S.topbar}>
          <div style={S.pageTitle}>
            {NAV.find((n) => n.id === page)?.label}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={S.liveTag}>● LIVE</span>
            <button style={S.btn()} onClick={load}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : page === "dashboard" ? (
          <Dashboard
            suppliers={suppliers}
            breaches={breaches}
            obligations={obligations}
            onNav={setPage}
          />
        ) : page === "breaches" ? (
          <Breaches
            breaches={breaches}
            suppliers={suppliers}
            obligations={obligations}
            reload={load}
          />
        ) : page === "suppliers" ? (
          <Suppliers
            suppliers={suppliers}
            obligations={obligations}
            breaches={breaches}
          />
        ) : page === "obligations" ? (
          <div style={S.content}>
            <div style={S.card}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Obligation</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Supplier</th>
                    <th style={S.th}>State</th>
                    <th style={S.th}>Expires</th>
                    <th style={S.th}>Last Verified</th>
                    <th style={S.th}>Confirmed</th>
                  </tr>
                </thead>
                <tbody>
                  {obligations.map((o) => (
                    <tr key={o.id}>
                      <td style={S.td}>{o.name}</td>
                      <td style={{ ...S.td, fontSize: 10, color: "rgba(232,228,223,0.35)", letterSpacing: "0.08em" }}>
                        {o.obligation_type.toUpperCase()}
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: "rgba(232,228,223,0.5)" }}>
                        {suppliers.find((s) => s.id === o.supplier_id)?.name || o.supplier_id.slice(0, 8)}
                      </td>
                      <td style={S.td}>
                        <span style={S.stateBadge(o.compliance_state)}>
                          {o.compliance_state.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: o.expires_at ? "rgba(232,228,223,0.5)" : "rgba(232,228,223,0.2)" }}>
                        {o.expires_at || "—"}
                      </td>
                      <td style={{ ...S.td, fontSize: 11, color: "rgba(232,228,223,0.3)" }}>
                        {o.last_verified_at ? new Date(o.last_verified_at).toLocaleDateString() : "Never"}
                      </td>
                      <td style={S.td}>
                        {o.confirmed_by ? (
                          <span style={{ fontSize: 10, color: "#4a9b6f" }}>✓</span>
                        ) : (
                          <span style={{ fontSize: 10, color: "rgba(232,228,223,0.2)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : page === "audit" ? (
          <Audit obligations={obligations} />
        ) : null}
      </div>
    </div>
  );
}
