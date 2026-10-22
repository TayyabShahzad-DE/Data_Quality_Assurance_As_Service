import { useState } from "react";
import "../styles/profiling.css";

export default function Profiling({ datasetStats, onGoToUpload }) {
  const [activeTab, setActiveTab]           = useState("overview");
  const [selectedColumn, setSelectedColumn] = useState(null);

  // ── Agar file upload nahi hui ──────────────────────────────────────────
  if (!datasetStats) {
    return (
      <div className="profiling-container">
        <div className="profiling-header">
          <h2>📊 Data Profiling Analysis</h2>
          <p>No dataset loaded yet.</p>
        </div>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📂</div>
          <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>Please upload a file first</h3>
          <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>
            Sidebar mein "Upload" button click karo, file upload karo, phir yahan wapas aao.
          </p>
          {onGoToUpload && (
            <button className="btn-action primary" onClick={onGoToUpload}>
              📤 Go to Upload
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Real data ──────────────────────────────────────────────────────────
  const {
    fileName, fileSize, uploadDate,
    rows, columns, missing, duplicates,
    columnProfiles = [],
  } = datasetStats;

  const typeCounts = columnProfiles.reduce((acc, col) => {
    acc[col.type] = (acc[col.type] || 0) + 1;
    return acc;
  }, {});

  const typeColors = {
    String:  "#6c56f5",
    Integer: "#10b981",
    Float:   "#f59e0b",
    Date:    "#8b5cf6",
    Boolean: "#ec4899",
  };

  const totalCells      = rows * columns || 1;
  const completeness    = +((1 - missing / totalCells) * 100).toFixed(1);
  const uniquenessScore = rows > 0 ? +((1 - duplicates / rows) * 100).toFixed(1) : 100;
  const overallScore    = +((completeness * 0.5 + uniquenessScore * 0.5)).toFixed(1);

  const dataQualityMetrics = [
    {
      metric: "Completeness",
      score: completeness,
      status: completeness >= 95 ? "excellent" : completeness >= 85 ? "good" : "moderate",
      description: "Overall data completeness rate",
    },
    {
      metric: "Uniqueness",
      score: uniquenessScore,
      status: uniquenessScore >= 98 ? "excellent" : uniquenessScore >= 90 ? "good" : "moderate",
      description: "Percentage of unique records",
    },
    {
      metric: "Overall Quality",
      score: overallScore,
      status: overallScore >= 95 ? "excellent" : overallScore >= 85 ? "good" : "moderate",
      description: "Combined quality indicator",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent": return "#10b981";
      case "good":      return "#3b82f6";
      case "moderate":  return "#f59e0b";
      case "poor":      return "#ef4444";
      default:          return "#6b7280";
    }
  };

  // ── SVG Bar Chart helper ───────────────────────────────────────────────
  const BarChart = ({ data, color = "#6c56f5", valueKey = "value", labelKey = "label", title }) => {
    const max = Math.max(...data.map((d) => d[valueKey]), 1);
    const barW = Math.max(30, Math.floor(520 / data.length) - 10);
    const chartH = 160;
    return (
      <div className="viz-chart-box">
        {title && <h4 className="viz-chart-title">{title}</h4>}
        <div style={{ overflowX: "auto" }}>
          <svg
            width={Math.max(560, data.length * (barW + 12))}
            height={chartH + 60}
            style={{ display: "block" }}
          >
            {/* Y gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = chartH - (pct / 100) * chartH;
              return (
                <g key={pct}>
                  <line x1="40" y1={y + 4} x2={Math.max(560, data.length * (barW + 12))} y2={y + 4}
                    stroke="#e5e7eb" strokeWidth="1" />
                  <text x="34" y={y + 8} textAnchor="end"
                    fontSize="10" fill="#9ca3af">
                    {Math.round((pct / 100) * max)}
                  </text>
                </g>
              );
            })}
            {/* Bars */}
            {data.map((d, i) => {
              const barH = Math.max(2, (d[valueKey] / max) * chartH);
              const x    = 48 + i * (barW + 12);
              const y    = chartH - barH + 4;
              return (
                <g key={i}>
                  <rect
                    x={x} y={y} width={barW} height={barH}
                    fill={d.color || color} rx="4" opacity="0.88"
                  />
                  <text
                    x={x + barW / 2} y={y - 4}
                    textAnchor="middle" fontSize="10" fill="#374151" fontWeight="600"
                  >
                    {d[valueKey]}
                  </text>
                  <text
                    x={x + barW / 2} y={chartH + 22}
                    textAnchor="middle" fontSize="10" fill="#6b7280"
                  >
                    {String(d[labelKey]).length > 8
                      ? String(d[labelKey]).slice(0, 7) + "…"
                      : d[labelKey]}
                  </text>
                </g>
              );
            })}
            {/* X axis */}
            <line x1="40" y1={chartH + 4} x2={Math.max(560, data.length * (barW + 12))} y2={chartH + 4}
              stroke="#d1d5db" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    );
  };

  // ── SVG Donut Chart helper ─────────────────────────────────────────────
  const DonutChart = ({ segments, title, centerText, centerSub }) => {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    const r = 70, cx = 100, cy = 100, stroke = 28;
    const circ = 2 * Math.PI * r;
    let cumulative = 0;
    return (
      <div className="viz-chart-box">
        {title && <h4 className="viz-chart-title">{title}</h4>}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <svg width="200" height="200" style={{ flexShrink: 0 }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
            {segments.map((seg, i) => {
              const pct   = seg.value / total;
              const dash  = pct * circ;
              const gap   = circ - dash;
              const offset = circ * 0.25 - cumulative * circ;
              cumulative  += pct;
              return (
                <circle
                  key={i} cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              );
            })}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">
              {centerText}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#6b7280">
              {centerSub}
            </text>
          </svg>
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            {segments.map((seg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "3px",
                  background: seg.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: "0.82rem", color: "#374151" }}>
                  {seg.label}
                </span>
                <span style={{ fontSize: "0.78rem", color: "#9ca3af", marginLeft: "auto" }}>
                  {((seg.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Horizontal Bar helper ──────────────────────────────────────────────
  const HorizBar = ({ label, value, max, color, suffix = "" }) => (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "0.82rem", color, fontWeight: 700 }}>
          {value}{suffix}
        </span>
      </div>
      <div style={{
        height: 10, background: "#f3f4f6", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${Math.min(100, (value / (max || 1)) * 100)}%`,
          background: color,
          borderRadius: 99,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );

  // ── Visualizations Tab ─────────────────────────────────────────────────
  const VisualizationsTab = () => {
    const [vizTab, setVizTab] = useState("types");

    const typeSegments = Object.entries(typeCounts).map(([t, c]) => ({
      label: t, value: c, color: typeColors[t] || "#6b7280",
    }));

    const nullData = columnProfiles
      .filter((c) => c.nulls > 0)
      .sort((a, b) => b.nulls - a.nulls)
      .slice(0, 12)
      .map((c) => ({ label: c.name, value: c.nulls, color: "#ef4444" }));

    const uniqueData = columnProfiles
      .slice(0, 12)
      .map((c) => ({ label: c.name, value: c.unique, color: typeColors[c.type] || "#6c56f5" }));

    const qualitySegments = [
      { label: "Complete cells",  value: totalCells - missing,  color: "#10b981" },
      { label: "Missing cells",   value: missing,               color: "#ef4444" },
    ];

    const dupSegments = [
      { label: "Unique rows",     value: rows - duplicates,     color: "#6c56f5" },
      { label: "Duplicate rows",  value: duplicates,            color: "#f59e0b" },
    ];

    const vizTabs = [
      { id: "types",    label: "📊 Data Types" },
      { id: "nulls",    label: "⚠️ Null Values" },
      { id: "unique",   label: "🔢 Unique Values" },
      { id: "quality",  label: "✨ Quality" },
    ];

    return (
      <div className="visualizations-section">
        <div className="viz-header">
          <h3>📊 Data Visualizations</h3>
          <p>Visual breakdown of your dataset — real data se generated charts</p>
        </div>

        {/* Sub-tabs */}
        <div className="viz-subtabs">
          {vizTabs.map((t) => (
            <button
              key={t.id}
              className={`viz-subtab-btn ${vizTab === t.id ? "active" : ""}`}
              onClick={() => setVizTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Data Types ── */}
        {vizTab === "types" && (
          <div className="viz-grid">
            <DonutChart
              segments={typeSegments}
              title="Column Types Distribution"
              centerText={columns}
              centerSub="Total Cols"
            />
            <BarChart
              data={typeSegments.map((s) => ({ label: s.label, value: s.value, color: s.color }))}
              title="Columns per Type"
              valueKey="value"
              labelKey="label"
            />
          </div>
        )}

        {/* ── Null Values ── */}
        {vizTab === "nulls" && (
          <div className="viz-grid-full">
            {nullData.length === 0 ? (
              <div className="viz-empty">
                <div style={{ fontSize: "3rem" }}>✅</div>
                <h4>No Missing Values!</h4>
                <p>Aapka dataset bilkul complete hai — koi null values nahi mili.</p>
              </div>
            ) : (
              <>
                <BarChart
                  data={nullData}
                  title={`Top ${nullData.length} Columns with Missing Values`}
                  valueKey="value"
                  labelKey="label"
                  color="#ef4444"
                />
                <div className="viz-null-detail">
                  <h4 style={{ marginBottom: "1rem", color: "#374151" }}>
                    Null values per column:
                  </h4>
                  {nullData.map((d) => (
                    <HorizBar
                      key={d.label}
                      label={d.label}
                      value={d.value}
                      max={rows}
                      color="#ef4444"
                      suffix={` / ${rows}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Unique Values ── */}
        {vizTab === "unique" && (
          <div className="viz-grid-full">
            <BarChart
              data={uniqueData}
              title="Unique Values per Column"
              valueKey="value"
              labelKey="label"
            />
            <div className="viz-unique-detail">
              <h4 style={{ marginBottom: "1rem", color: "#374151" }}>
                Uniqueness ratio per column:
              </h4>
              {columnProfiles.slice(0, 15).map((col) => {
                const ratio = rows > 0 ? ((col.unique / rows) * 100).toFixed(1) : 0;
                const color = ratio >= 90 ? "#10b981" : ratio >= 50 ? "#6c56f5" : "#f59e0b";
                return (
                  <HorizBar
                    key={col.name}
                    label={col.name}
                    value={+ratio}
                    max={100}
                    color={color}
                    suffix="%"
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quality ── */}
        {vizTab === "quality" && (
          <div className="viz-grid">
            <DonutChart
              segments={qualitySegments}
              title="Data Completeness"
              centerText={`${completeness}%`}
              centerSub="Complete"
            />
            <DonutChart
              segments={dupSegments}
              title="Row Uniqueness"
              centerText={`${uniquenessScore}%`}
              centerSub="Unique"
            />

            {/* Quality score gauges */}
            <div className="viz-chart-box viz-quality-gauges">
              <h4 className="viz-chart-title">Quality Dimensions</h4>
              {dataQualityMetrics.map((m) => (
                <HorizBar
                  key={m.metric}
                  label={m.metric}
                  value={m.score}
                  max={100}
                  color={getStatusColor(m.status)}
                  suffix="%"
                />
              ))}
            </div>

            {/* Summary stats */}
            <div className="viz-chart-box viz-summary-stats">
              <h4 className="viz-chart-title">Dataset Summary</h4>
              <div className="viz-summary-grid">
                {[
                  { label: "Total Cells",    value: (rows * columns).toLocaleString(), icon: "🔢" },
                  { label: "Missing Cells",  value: missing,                            icon: "⚠️" },
                  { label: "Duplicate Rows", value: duplicates,                         icon: "🔄" },
                  { label: "Clean Rows",     value: (rows - duplicates).toLocaleString(), icon: "✅" },
                  { label: "Columns",        value: columns,                            icon: "📋" },
                  { label: "Data Types",     value: Object.keys(typeCounts).length,     icon: "🏷️" },
                ].map((s) => (
                  <div key={s.label} className="viz-summary-item">
                    <span className="viz-summary-icon">{s.icon}</span>
                    <span className="viz-summary-value">{s.value}</span>
                    <span className="viz-summary-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="profiling-container">

      {/* Header */}
      <div className="profiling-header">
        <h2>📊 Data Profiling Analysis</h2>
        <p>Comprehensive analysis of your dataset structure and quality</p>
      </div>

      {/* Dataset info card */}
      <div className="dataset-info-card">
        <div className="info-header">
          <h3>📁 Dataset Information</h3>
          <span className="dataset-badge">Active</span>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">File Name:</span>
            <span className="info-value">{fileName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Rows:</span>
            <span className="info-value">{rows.toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Columns:</span>
            <span className="info-value">{columns}</span>
          </div>
          <div className="info-item">
            <span className="info-label">File Size:</span>
            <span className="info-value">{fileSize}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Upload Date:</span>
            <span className="info-value">{uploadDate}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className="info-value status-success">✅ Loaded</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profiling-tabs">
        {[
          { id: "overview",        label: "📋 Overview" },
          { id: "columns",         label: "📊 Columns" },
          { id: "statistics",      label: "📈 Statistics" },
          { id: "quality",         label: "✨ Quality Metrics" },
          { id: "visualizations",  label: "📊 Visualizations" },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div className="tab-content">

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="overview-section">
            <div className="overview-stats-grid">
              <div className="overview-stat-card">
                <div className="stat-icon-large">📊</div>
                <div className="stat-details">
                  <h3>Data Dimensions</h3>
                  <p className="stat-number">{rows} × {columns}</p>
                  <span className="stat-label">Rows × Columns</span>
                </div>
              </div>
              <div className="overview-stat-card">
                <div className="stat-icon-large">⚠️</div>
                <div className="stat-details">
                  <h3>Missing Values</h3>
                  <p className="stat-number warning">{missing}</p>
                  <span className="stat-label">Total null values</span>
                </div>
              </div>
              <div className="overview-stat-card">
                <div className="stat-icon-large">🔄</div>
                <div className="stat-details">
                  <h3>Duplicates</h3>
                  <p className="stat-number">{duplicates}</p>
                  <span className="stat-label">Duplicate rows found</span>
                </div>
              </div>
              <div className="overview-stat-card">
                <div className="stat-icon-large">📝</div>
                <div className="stat-details">
                  <h3>Data Types</h3>
                  <p className="stat-number">{Object.keys(typeCounts).length}</p>
                  <span className="stat-label">Different data types</span>
                </div>
              </div>
            </div>

            <div className="data-types-distribution">
              <h3>📊 Data Types Distribution</h3>
              <div className="type-bars">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="type-bar-item">
                    <div className="type-info">
                      <span className="type-name">{type}</span>
                      <span className="type-count">{count} column{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="type-bar">
                      <div
                        className="type-fill"
                        style={{
                          width:      `${(count / columns) * 100}%`,
                          background: typeColors[type] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COLUMNS ───────────────────────────────────────────────────── */}
        {activeTab === "columns" && (
          <div className="columns-section">
            <div className="columns-header">
              <h3>📊 Column Analysis</h3>
              <p>Detailed information about each column in your dataset</p>
            </div>
            {columnProfiles.length === 0 ? (
              <p style={{ color: "#6b7280", padding: "2rem" }}>No column data available.</p>
            ) : (
              <div className="columns-table-container">
                <table className="columns-table">
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Null Values</th>
                      <th>Unique Values</th>
                      <th>Mean / Mode</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnProfiles.map((col, index) => (
                      <tr key={index} className={selectedColumn === col.name ? "selected" : ""}>
                        <td>
                          <div className="column-name">
                            <span className="column-icon">📝</span>{col.name}
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${col.type.toLowerCase()}`}>
                            {col.type}
                          </span>
                        </td>
                        <td>
                          <span className={col.nulls > 0 ? "text-warning" : "text-success"}>
                            {col.nulls}
                          </span>
                        </td>
                        <td>{col.unique}</td>
                        <td>{col.mean}</td>
                        <td>
                          <button
                            className="btn-view-details"
                            onClick={() =>
                              setSelectedColumn(col.name === selectedColumn ? null : col.name)
                            }
                          >
                            {selectedColumn === col.name ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedColumn && (() => {
              const col = columnProfiles.find((c) => c.name === selectedColumn);
              if (!col) return null;
              const completenessVal =
                rows > 0 ? (((rows - col.nulls) / rows) * 100).toFixed(1) : "N/A";
              return (
                <div className="column-details-panel">
                  <h4>📊 Detailed Analysis: {selectedColumn}</h4>
                  <div className="details-grid">
                    <div className="detail-card">
                      <span className="detail-label">Completeness:</span>
                      <span className="detail-value">{completenessVal}%</span>
                    </div>
                    <div className="detail-card">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{col.type}</span>
                    </div>
                    <div className="detail-card">
                      <span className="detail-label">Unique Values:</span>
                      <span className="detail-value">{col.unique}</span>
                    </div>
                    <div className="detail-card">
                      <span className="detail-label">Null Count:</span>
                      <span className="detail-value">{col.nulls}</span>
                    </div>
                    {col.mode && (
                      <div className="detail-card">
                        <span className="detail-label">Most Frequent:</span>
                        <span className="detail-value">{col.mode}</span>
                      </div>
                    )}
                  </div>
                  {col.frequencyMap && (
                    <div className="frequency-chart" style={{ marginTop: "1rem" }}>
                      <h5 style={{ marginBottom: "0.5rem" }}>Top Values</h5>
                      {Object.entries(col.frequencyMap).map(([key, value]) => {
                        const pct = (value / rows * 100).toFixed(1);
                        return (
                          <div key={key} className="freq-bar-item">
                            <div className="freq-label-row">
                              <span className="freq-label">{key}</span>
                              <span className="freq-count">{value} ({pct}%)</span>
                            </div>
                            <div className="freq-bar">
                              <div className="freq-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── STATISTICS ────────────────────────────────────────────────── */}
        {activeTab === "statistics" && (
          <div className="statistics-section">
            <div className="stats-category">
              <h3>📈 Numerical Columns Statistics</h3>
              {columnProfiles.filter((c) => c.numericStats).length === 0 ? (
                <p style={{ color: "#6b7280" }}>No numerical columns found.</p>
              ) : (
                columnProfiles.filter((c) => c.numericStats).map((col) => (
                  <div key={col.name} className="stat-box">
                    <h4>{col.name}</h4>
                    <div className="stat-metrics-grid">
                      {Object.entries(col.numericStats).map(([k, v]) => (
                        <div key={k} className="metric-item">
                          <span className="metric-label">
                            {k.charAt(0).toUpperCase() + k.slice(1)}:
                          </span>
                          <span className="metric-value">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="distribution-visual">
                      <div className="box-plot">
                        <div className="box-plot-line" />
                        <div className="box-plot-box" style={{ left: "20%", width: "40%" }}>
                          <div className="box-plot-median" style={{ left: "45%" }} />
                        </div>
                      </div>
                      <div className="distribution-labels">
                        <span>Min</span><span>Q1</span>
                        <span>Median</span><span>Q3</span><span>Max</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="stats-category">
              <h3>📊 Categorical Columns Statistics</h3>
              {columnProfiles.filter((c) => c.frequencyMap).length === 0 ? (
                <p style={{ color: "#6b7280" }}>No categorical columns with frequency data.</p>
              ) : (
                columnProfiles.filter((c) => c.frequencyMap).map((col) => (
                  <div key={col.name} className="stat-box">
                    <h4>{col.name}</h4>
                    <div className="categorical-info">
                      <div className="cat-stat">
                        <span className="cat-label">Unique Values:</span>
                        <span className="cat-value">{col.unique}</span>
                      </div>
                      <div className="cat-stat">
                        <span className="cat-label">Most Frequent:</span>
                        <span className="cat-value">{col.mode}</span>
                      </div>
                    </div>
                    <div className="frequency-chart">
                      {Object.entries(col.frequencyMap).map(([key, value]) => {
                        const pct = (value / rows * 100).toFixed(1);
                        return (
                          <div key={key} className="freq-bar-item">
                            <div className="freq-label-row">
                              <span className="freq-label">{key}</span>
                              <span className="freq-count">{value} ({pct}%)</span>
                            </div>
                            <div className="freq-bar">
                              <div className="freq-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── QUALITY METRICS ───────────────────────────────────────────── */}
        {activeTab === "quality" && (
          <div className="quality-section">
            <div className="quality-header">
              <h3>✨ Data Quality Dimensions</h3>
              <p>Comprehensive quality assessment based on industry standards</p>
            </div>
            <div className="quality-metrics-grid">
              {dataQualityMetrics.map((metric, index) => (
                <div key={index} className="quality-metric-card">
                  <div className="metric-header">
                    <h4>{metric.metric}</h4>
                    <span className="metric-score" style={{ color: getStatusColor(metric.status) }}>
                      {metric.score}%
                    </span>
                  </div>
                  <p className="metric-description">{metric.description}</p>
                  <div className="metric-progress">
                    <div
                      className="metric-progress-fill"
                      style={{
                        width:      `${metric.score}%`,
                        background: getStatusColor(metric.status),
                      }}
                    />
                  </div>
                  <span className={`metric-status ${metric.status}`}>
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
            <div className="overall-quality-score">
              <h3>🎯 Overall Quality Score</h3>
              <div className="score-circle">
                <svg width="200" height="200">
                  <circle cx="100" cy="100" r="80"
                    fill="none" stroke="#e5e7eb" strokeWidth="20" />
                  <circle cx="100" cy="100" r="80"
                    fill="none" stroke="#6c56f5" strokeWidth="20"
                    strokeDasharray="502.4"
                    strokeDashoffset={502.4 - (502.4 * overallScore) / 100}
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <div className="score-text">
                  <span className="score-number">{overallScore}</span>
                  <span className="score-label">Quality Score</span>
                </div>
              </div>
              <p className="score-interpretation">
                {overallScore >= 95
                  ? "✅ Your dataset shows excellent quality."
                  : overallScore >= 85
                  ? "✅ Your dataset shows good quality with minor improvements needed."
                  : "⚠️ Your dataset needs quality improvements."}
              </p>
            </div>
          </div>
        )}

        {/* ── VISUALIZATIONS ────────────────────────────────────────────── */}
        {activeTab === "visualizations" && <VisualizationsTab />}

      </div>

      {/* Action buttons */}
      <div className="profiling-actions">
        <button
          className="btn-action primary"
          onClick={() => setActiveTab("visualizations")}
        >
          📊 View Visualizations
        </button>
        {onGoToUpload && (
          <button className="btn-action secondary" onClick={onGoToUpload}>
            📤 Upload New File
          </button>
        )}
      </div>

    </div>
  );
}