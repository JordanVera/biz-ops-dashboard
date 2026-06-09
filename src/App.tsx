import { useState, useEffect } from "react";
import type {
  BizOpsData,
  DeptEntry,
  DeptTemplate,
  EntryFormProps,
  MiniBarProps,
  StatusPillProps,
} from "./types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR = new Date().getFullYear();

const DEPT_TEMPLATES: DeptTemplate[] = [
  {
    id: "hr",
    label: "HR PeopleOps",
    lead: "Walter Griffin",
    color: "#1B3A6B",
    icon: "👥",
    kpis: [
      { label: "Open Requisitions Filled", unit: "%", target: 100 },
      { label: "Policy Compliance", unit: "%", target: 100 },
      { label: "Training Sessions Held", unit: "sessions", target: 2 },
      { label: "Benefits Enrollment", unit: "%", target: 100 },
    ],
  },
  {
    id: "facilities",
    label: "Facilities & Vendors",
    lead: "Craig Hawkins",
    color: "#2C5282",
    icon: "🏛️",
    kpis: [
      { label: "Vendor Performance Score", unit: "%", target: 95 },
      { label: "Maintenance SLA Met", unit: "%", target: 100 },
      { label: "Asset Audits Completed", unit: "%", target: 100 },
      { label: "Open Work Orders", unit: "orders", target: 0 },
    ],
  },
  {
    id: "it",
    label: "Information Technology",
    lead: "Ryan Dampier",
    color: "#7B4A1E",
    icon: "💻",
    kpis: [
      { label: "System Uptime", unit: "%", target: 99.5 },
      { label: "Tickets Resolved <24h", unit: "%", target: 95 },
      { label: "Security Incidents", unit: "incidents", target: 0 },
      { label: "Digital Proposals", unit: "proposals", target: 2 },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    lead: "Marie McGee",
    color: "#276749",
    icon: "📊",
    kpis: [
      { label: "Bills Paid On Time", unit: "%", target: 100 },
      { label: "Budget Variance", unit: "%", target: 5 },
      { label: "Reports Submitted On Time", unit: "%", target: 100 },
      { label: "Bank Reconciliations", unit: "completed", target: 1 },
    ],
  },
  {
    id: "security",
    label: "Security",
    lead: "Steven Taylor",
    color: "#2B6CB0",
    icon: "🛡️",
    kpis: [
      { label: "Security Incidents", unit: "incidents", target: 0 },
      { label: "Staff Credentialed", unit: "%", target: 100 },
      { label: "Emergency Drills Held", unit: "drills", target: 1 },
      { label: "Event Coverage Rate", unit: "%", target: 100 },
    ],
  },
  {
    id: "admin",
    label: "Administrative Ops",
    lead: "Sierra",
    color: "#553C9A",
    icon: "📋",
    kpis: [
      { label: "Tasks Completed On Time", unit: "%", target: 100 },
      { label: "Meeting Notes Distributed", unit: "%", target: 100 },
      { label: "Confidentiality Breaches", unit: "incidents", target: 0 },
      { label: "Same-Day Response Rate", unit: "%", target: 100 },
    ],
  },
];

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
function getDefaultVals(dept: DeptTemplate): number[] {
  return dept.kpis.map((k) =>
    k.unit === "%"
      ? k.target
      : k.unit === "incidents" || k.unit === "orders"
      ? 0
      : k.target
  );
}

function StatusPill({ value, target, unit, small }: StatusPillProps) {
  let status: string;
  if (unit === "incidents" || unit === "orders")
    status =
      value === 0 ? "on-track" : value <= 2 ? "watch" : "needs-attention";
  else if (unit === "%") {
    const isLower = target <= 5;
    if (isLower)
      status =
        value <= target
          ? "on-track"
          : value <= target + 3
          ? "watch"
          : "needs-attention";
    else
      status =
        value >= target
          ? "on-track"
          : value >= target - 8
          ? "watch"
          : "needs-attention";
  } else
    status =
      value >= target
        ? "on-track"
        : value >= target * 0.75
        ? "watch"
        : "needs-attention";
  const [bg, text, label] =
    status === "on-track"
      ? ["#D1FAE5", "#065F46", "On Track"]
      : status === "watch"
      ? ["#FEF3C7", "#92400E", "Monitor"]
      : ["#FEE2E2", "#991B1B", "Attention"];
  return (
    <span
      style={{
        background: bg,
        color: text,
        borderRadius: 20,
        padding: small ? "2px 8px" : "3px 10px",
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        fontFamily: "Arial",
        letterSpacing: 0.3,
      }}
    >
      {label}
    </span>
  );
}

function MiniBar({ value, target, unit, color }: MiniBarProps) {
  const isLower = unit === "incidents" || unit === "orders";
  const pct = isLower
    ? value === 0
      ? 100
      : Math.max(5, 100 - value * 25)
    : unit === "%"
    ? Math.min(100, value)
    : Math.min(100, (value / Math.max(target, 1)) * 100);
  const good = isLower
    ? value <= target
    : unit === "%"
    ? value >= target - 8
    : value >= target * 0.75;
  return (
    <div
      style={{
        background: "#2A3F5F",
        borderRadius: 4,
        height: 6,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: good ? color : "#F59E0B",
          borderRadius: 4,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

function EntryForm({ dept, monthKey, data, onSave, onClose }: EntryFormProps) {
  const existing = data[monthKey]?.[dept.id];
  const [values, setValues] = useState(
    existing?.values ?? getDefaultVals(dept)
  );
  const [tasks, setTasks] = useState(
    existing?.tasks?.length
      ? [...existing.tasks, ...Array(4).fill("")].slice(0, 4)
      : ["", "", "", ""]
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(dept.id, monthKey, {
      values,
      tasks: tasks.filter((t) => t.trim()),
      notes,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#0D1B2E",
          border: `2px solid ${dept.color}`,
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "92vh",
          overflowY: "auto",
          padding: "22px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: "bold", color: "#fff" }}>
              {dept.icon} {dept.label}
            </div>
            <div
              style={{ color: "#94B8E0", fontSize: 11, fontStyle: "italic" }}
            >
              Enter monthly data
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            color: "#B8962E",
            fontSize: 9,
            letterSpacing: 2,
            fontFamily: "Arial",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          KPI Values
        </div>
        {dept.kpis.map((kpi, i) => (
          <div key={i} style={{ marginBottom: 13 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "#94B8E0",
                fontFamily: "Arial",
                marginBottom: 4,
              }}
            >
              {kpi.label}{" "}
              <span style={{ color: "#4A6080" }}>
                · target: {kpi.target}
                {kpi.unit === "%" ? "%" : ` ${kpi.unit}`}
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              value={values[i]}
              onChange={(e) => {
                const v = [...values];
                v[i] = parseFloat(e.target.value) || 0;
                setValues(v);
              }}
              style={{
                width: "100%",
                background: "#1A2E4A",
                border: `1px solid ${dept.color}70`,
                borderRadius: 8,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 15,
                fontFamily: "Arial",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <div
          style={{
            color: "#B8962E",
            fontSize: 9,
            letterSpacing: 2,
            fontFamily: "Arial",
            textTransform: "uppercase",
            marginTop: 18,
            marginBottom: 10,
          }}
        >
          Priority Tasks (up to 4)
        </div>
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            placeholder={`Task ${i + 1}…`}
            value={tasks[i] ?? ""}
            onChange={(e) => {
              const t = [...tasks];
              t[i] = e.target.value;
              setTasks(t);
            }}
            style={{
              width: "100%",
              background: "#1A2E4A",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "9px 12px",
              color: "#fff",
              fontSize: 13,
              fontFamily: "Arial",
              marginBottom: 7,
              boxSizing: "border-box",
            }}
          />
        ))}

        <div
          style={{
            color: "#B8962E",
            fontSize: 9,
            letterSpacing: 2,
            fontFamily: "Arial",
            textTransform: "uppercase",
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Notes / Comments
        </div>
        <textarea
          placeholder="Context, wins, blockers…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            background: "#1A2E4A",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#fff",
            fontSize: 13,
            fontFamily: "Arial",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              background: "rgba(255,255,255,0.06)",
              border: "none",
              borderRadius: 10,
              color: "#94B8E0",
              fontSize: 13,
              fontFamily: "Arial",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: "12px",
              background: dept.color,
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 13,
              fontFamily: "Arial",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "✓ Save Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [selectedYear] = useState(CURRENT_YEAR);
  const [activeView, setActiveView] = useState<"overview" | "detail">(
    "overview"
  );
  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [data, setData] = useState<BizOpsData>({});
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");

  const monthKey = getMonthKey(selectedYear, selectedMonth);
  const activeDept = DEPT_TEMPLATES.find((d) => d.id === activeDeptId);
  const editingDept = DEPT_TEMPLATES.find((d) => d.id === editingDeptId);

  useEffect(() => {
    async function load() {
      try {
        const result = await window.storage.get("bizops-v1");
        if (result?.value) setData(JSON.parse(result.value));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveEntry(
    deptId: string,
    mKey: string,
    entry: DeptEntry
  ) {
    const updated = {
      ...data,
      [mKey]: { ...(data[mKey] || {}), [deptId]: entry },
    };
    setData(updated);
    try {
      await window.storage.set("bizops-v1", JSON.stringify(updated));
      setSaveMsg("✓ Saved");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch {
      setSaveMsg("Save failed — try again");
    }
  }

  const getDeptVals = (dept: DeptTemplate, mKey: string) =>
    data[mKey]?.[dept.id]?.values ?? getDefaultVals(dept);
  const getDeptTasks = (dept: DeptTemplate, mKey: string) =>
    data[mKey]?.[dept.id]?.tasks ?? [];
  const getDeptNotes = (dept: DeptTemplate, mKey: string) =>
    data[mKey]?.[dept.id]?.notes ?? "";
  const hasData = (dept: DeptTemplate, mKey: string) =>
    !!data[mKey]?.[dept.id];

  function getScore(dept: DeptTemplate, mKey: string) {
    const vals = getDeptVals(dept, mKey);
    return dept.kpis.reduce((sum: number, kpi, ki) => {
      const v = vals[ki];
      const isLower = kpi.unit === "incidents" || kpi.unit === "orders";
      return (
        sum +
        (isLower
          ? v <= kpi.target
            ? 1
            : 0
          : kpi.unit === "%"
          ? v >= kpi.target - 8
            ? 1
            : 0
          : v >= kpi.target * 0.75
          ? 1
          : 0)
      );
    }, 0);
  }

  if (loading)
    return (
      <div
        style={{
          background: "#0F1E35",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#B8962E", fontSize: 16, fontFamily: "Arial" }}>
          Loading…
        </div>
      </div>
    );

  const totalKPIs = DEPT_TEMPLATES.length * 4;
  const onTrackCount = DEPT_TEMPLATES.reduce(
    (s, d) => s + getScore(d, monthKey),
    0
  );
  const updatedCount = DEPT_TEMPLATES.filter((d) =>
    hasData(d, monthKey)
  ).length;

  return (
    <div
      style={{
        fontFamily: "'Georgia', serif",
        background: "#0F1E35",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0A1628 0%, #1B3A6B 100%)",
          borderBottom: "2px solid #B8962E",
          padding: "16px 16px 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                color: "#B8962E",
                fontSize: 8,
                letterSpacing: 4,
                fontFamily: "Arial",
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              The Lighthouse Church & Ministries
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              Business Operations
            </div>
            <div style={{ fontSize: 13, color: "#fff", opacity: 0.8 }}>
              Dashboard
            </div>
            <div
              style={{
                color: "#94B8E0",
                fontSize: 10,
                marginTop: 3,
                fontStyle: "italic",
              }}
            >
              CSO: Ivy McGregor
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {saveMsg && (
              <div
                style={{
                  color: "#6EE7B7",
                  fontSize: 11,
                  fontFamily: "Arial",
                  fontWeight: "bold",
                  marginBottom: 4,
                }}
              >
                {saveMsg}
              </div>
            )}
            {activeView === "detail" && (
              <button
                onClick={() => {
                  setActiveView("overview");
                  setActiveDeptId(null);
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "Arial",
                }}
              >
                ← Overview
              </button>
            )}
          </div>
        </div>
        {/* Month tabs */}
        <div
          style={{ marginTop: 12, display: "flex", gap: 3, flexWrap: "wrap" }}
        >
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(i)}
              style={{
                background:
                  selectedMonth === i ? "#B8962E" : "rgba(255,255,255,0.06)",
                color: selectedMonth === i ? "#fff" : "#94B8E0",
                border: "none",
                borderRadius: 6,
                padding: "5px 9px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "Arial",
                fontWeight: selectedMonth === i ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 14px 40px" }}>
        {/* Month heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 15, color: "#B8962E", fontWeight: "bold" }}>
            {MONTH_FULL[selectedMonth]} {selectedYear}
          </div>
          <div
            style={{
              flex: 1,
              height: 1,
              background:
                "linear-gradient(to right, rgba(184,150,46,0.35), transparent)",
            }}
          />
          {activeView === "overview" && (
            <div style={{ fontSize: 9, color: "#4A6080", fontFamily: "Arial" }}>
              Tap card · ✏️ to update
            </div>
          )}
        </div>

        {activeView === "overview" ? (
          <>
            {/* Stats row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {[
                { label: "Depts", value: "6" },
                { label: "KPIs", value: String(totalKPIs) },
                {
                  label: "On Track",
                  value: `${Math.round((onTrackCount / totalKPIs) * 100)}%`,
                },
                { label: "Updated", value: `${updatedCount}/6` },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 9,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#94B8E0",
                      fontSize: 8,
                      fontFamily: "Arial",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#B8962E",
                      marginTop: 2,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Dept cards 2-col */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}
            >
              {DEPT_TEMPLATES.map((dept) => {
                const vals = getDeptVals(dept, monthKey);
                const updated = hasData(dept, monthKey);
                return (
                  <div
                    key={dept.id}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${dept.color}45`,
                      borderTop: `3px solid ${dept.color}`,
                      borderRadius: 11,
                      padding: "12px 12px 10px",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() => setEditingDeptId(dept.id)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: dept.color,
                        border: "none",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 11,
                        padding: "3px 8px",
                        cursor: "pointer",
                        fontFamily: "Arial",
                        zIndex: 1,
                      }}
                    >
                      ✏️
                    </button>
                    <div
                      onClick={() => {
                        setActiveDeptId(dept.id);
                        setActiveView("detail");
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            background: dept.color,
                            borderRadius: 6,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {dept.icon}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: 11,
                              color: "#fff",
                              lineHeight: 1.2,
                            }}
                          >
                            {dept.label}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: "#6B8CAE",
                              fontStyle: "italic",
                            }}
                          >
                            {dept.lead}
                          </div>
                        </div>
                      </div>
                      {!updated && (
                        <div
                          style={{
                            background: "rgba(184,150,46,0.12)",
                            border: "1px solid rgba(184,150,46,0.25)",
                            borderRadius: 5,
                            padding: "4px 7px",
                            marginBottom: 7,
                            fontSize: 9,
                            color: "#B8962E",
                            fontFamily: "Arial",
                            textAlign: "center",
                          }}
                        >
                          Tap ✏️ to enter this month's data
                        </div>
                      )}
                      {dept.kpis.map((kpi, ki) => (
                        <div key={ki} style={{ marginBottom: 5 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                color: "#94B8E0",
                                fontFamily: "Arial",
                              }}
                            >
                              {kpi.label}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: 3,
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#fff",
                                  fontWeight: "bold",
                                  fontFamily: "Arial",
                                }}
                              >
                                {vals[ki]}
                                {kpi.unit === "%" ? "%" : ""}
                              </span>
                              <StatusPill
                                value={vals[ki]}
                                target={kpi.target}
                                unit={kpi.unit}
                                small
                              />
                            </div>
                          </div>
                          <MiniBar
                            value={vals[ki]}
                            target={kpi.target}
                            unit={kpi.unit}
                            color={dept.color}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Year heatmap */}
            <div
              style={{
                marginTop: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 11,
                padding: "12px 12px",
              }}
            >
              <div
                style={{
                  color: "#B8962E",
                  fontSize: 8,
                  fontFamily: "Arial",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Year-at-a-Glance — {selectedYear}
              </div>
              {DEPT_TEMPLATES.map((dept) => (
                <div
                  key={dept.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 62,
                      fontSize: 8,
                      color: "#94B8E0",
                      fontFamily: "Arial",
                      flexShrink: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {dept.label}
                  </div>
                  <div style={{ display: "flex", gap: 2, flex: 1 }}>
                    {MONTHS.map((m, mi) => {
                      const mk = getMonthKey(selectedYear, mi);
                      const score = getScore(dept, mk);
                      const nd = !hasData(dept, mk);
                      const pct = score / dept.kpis.length;
                      const bg = nd
                        ? "#1A2E4A"
                        : pct === 1
                        ? dept.color
                        : pct >= 0.75
                        ? "#B8962E"
                        : "#991B1B";
                      const isSel = mi === selectedMonth;
                      return (
                        <div
                          key={m}
                          onClick={() => setSelectedMonth(mi)}
                          style={{
                            flex: 1,
                            height: 20,
                            background: bg,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            border: isSel
                              ? "1.5px solid #fff"
                              : "1.5px solid transparent",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 6,
                              fontFamily: "Arial",
                              color: nd ? "#2A4A6A" : "#fff",
                              fontWeight: "bold",
                            }}
                          >
                            {m}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 7,
                  justifyContent: "flex-end",
                }}
              >
                {[
                  ["On Track", "#1B3A6B"],
                  ["Monitor", "#B8962E"],
                  ["Attention", "#991B1B"],
                  ["No Data", "#1A2E4A"],
                ].map(([l, c]) => (
                  <div
                    key={l}
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: c,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 8,
                        color: "#6B8CAE",
                        fontFamily: "Arial",
                      }}
                    >
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : activeDept ? (
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  background: activeDept.color,
                  borderRadius: 9,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                {activeDept.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: "bold" }}>
                  {activeDept.label}
                </div>
                <div
                  style={{
                    color: "#94B8E0",
                    fontSize: 11,
                    fontStyle: "italic",
                  }}
                >
                  Lead: {activeDept.lead}
                </div>
              </div>
              <button
                onClick={() => setEditingDeptId(activeDept.id)}
                style={{
                  background: activeDept.color,
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  padding: "8px 13px",
                  cursor: "pointer",
                  fontFamily: "Arial",
                  fontWeight: "bold",
                }}
              >
                ✏️ Update
              </button>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${activeDept.color}40`,
                borderRadius: 11,
                padding: "14px",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  color: "#B8962E",
                  fontSize: 8,
                  letterSpacing: 2,
                  fontFamily: "Arial",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {MONTH_FULL[selectedMonth]} KPIs
              </div>
              {activeDept.kpis.map((kpi, ki) => {
                const val = getDeptVals(activeDept, monthKey)[ki];
                return (
                  <div
                    key={ki}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 7,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#D1E5F5",
                          fontFamily: "Arial",
                        }}
                      >
                        {kpi.label}
                      </span>
                      <StatusPill
                        value={val}
                        target={kpi.target}
                        unit={kpi.unit}
                      />
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div style={{ flex: 1 }}>
                        <MiniBar
                          value={val}
                          target={kpi.target}
                          unit={kpi.unit}
                          color={activeDept.color}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: "bold",
                          fontFamily: "Arial",
                        }}
                      >
                        {val}
                        {kpi.unit === "%" ? "%" : ` ${kpi.unit}`}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: "#6B8CAE",
                          fontFamily: "Arial",
                        }}
                      >
                        / {kpi.target}
                        {kpi.unit === "%" ? "%" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {getDeptTasks(activeDept, monthKey).length > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 11,
                  padding: "14px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    color: "#B8962E",
                    fontSize: 8,
                    letterSpacing: 2,
                    fontFamily: "Arial",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Priority Tasks
                </div>
                {getDeptTasks(activeDept, monthKey).map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 9,
                      marginBottom: 8,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 3,
                        border: `2px solid ${activeDept.color}`,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "#D1E5F5",
                        fontFamily: "Arial",
                        lineHeight: 1.4,
                      }}
                    >
                      {t}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {getDeptNotes(activeDept, monthKey) && (
              <div
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderLeft: `4px solid ${activeDept.color}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "12px 14px",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    color: "#B8962E",
                    fontSize: 8,
                    letterSpacing: 2,
                    fontFamily: "Arial",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Notes
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#94B8E0",
                    fontFamily: "Arial",
                    lineHeight: 1.6,
                  }}
                >
                  {getDeptNotes(activeDept, monthKey)}
                </div>
              </div>
            )}

            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 11,
                padding: "14px",
              }}
            >
              <div
                style={{
                  color: "#B8962E",
                  fontSize: 8,
                  letterSpacing: 2,
                  fontFamily: "Arial",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                12-Month Trend
              </div>
              {activeDept.kpis.map((kpi, ki) => (
                <div key={ki} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#94B8E0",
                      fontFamily: "Arial",
                      marginBottom: 5,
                    }}
                  >
                    {kpi.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-end",
                      height: 40,
                    }}
                  >
                    {MONTHS.map((m, mi) => {
                      const mk = getMonthKey(selectedYear, mi);
                      const val = getDeptVals(activeDept, mk)[ki];
                      const nd = !hasData(activeDept, mk);
                      const isLower =
                        kpi.unit === "incidents" || kpi.unit === "orders";
                      const pct = isLower
                        ? val === 0
                          ? 100
                          : 15
                        : Math.min(
                            100,
                            kpi.unit === "%"
                              ? val
                              : (val / Math.max(kpi.target, 1)) * 100
                          );
                      const good = isLower
                        ? val <= kpi.target
                        : kpi.unit === "%"
                        ? val >= kpi.target - 8
                        : val >= kpi.target * 0.75;
                      const isSel = mi === selectedMonth;
                      return (
                        <div
                          key={m}
                          onClick={() => setSelectedMonth(mi)}
                          style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              height: 32,
                              display: "flex",
                              alignItems: "flex-end",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: `${Math.max(8, pct)}%`,
                                background: nd
                                  ? "#1A2E4A"
                                  : good
                                  ? activeDept.color
                                  : "#F59E0B",
                                opacity: isSel ? 1 : 0.5,
                                borderRadius: "2px 2px 0 0",
                                border: isSel ? "1px solid #fff" : "none",
                                minHeight: 3,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 6,
                              color: isSel ? "#fff" : "#3D5A80",
                              fontFamily: "Arial",
                            }}
                          >
                            {m}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            color: "#1E3352",
            fontSize: 8,
            fontFamily: "Arial",
            letterSpacing: 1,
          }}
        >
          LIGHTHOUSE CHURCH & MINISTRIES · BUSINESS OPERATIONS · OFFICE OF THE
          CSO
        </div>
      </div>

      {editingDeptId && editingDept && (
        <EntryForm
          dept={editingDept}
          monthKey={monthKey}
          data={data}
          onSave={handleSaveEntry}
          onClose={() => setEditingDeptId(null)}
        />
      )}
    </div>
  );
}
