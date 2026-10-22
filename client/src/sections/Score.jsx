  import { useState, useRef } from "react";
  import "../styles/score.css";

  export default function Score({ datasetStats, onGoToUpload }) {
    const [selectedDimension, setSelectedDimension] = useState(null);
    const [timeRange, setTimeRange]                 = useState("7days");
    const [isRefreshing, setIsRefreshing]           = useState(false);
    const [refreshKey, setRefreshKey]               = useState(0);   // re-mount animation
    const [isExporting, setIsExporting]             = useState(false);
    const reportRef                                 = useRef(null);

    // ── No data guard ──────────────────────────────────────────────────────
    if (!datasetStats) {
      return (
        <div className="score-container">
          <div className="score-header">
            <h2>📈 Data Quality Score</h2>
            <p>No dataset loaded yet.</p>
          </div>
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📂</div>
            <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>Please upload a file first</h3>
            <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>Upload a dataset to see quality scores.</p>
            {onGoToUpload && (
              <button className="btn-action primary" onClick={onGoToUpload}>📤 Go to Upload</button>
            )}
          </div>
        </div>
      );
    }

    const scoreData = datasetStats.scoreData;

    if (!scoreData) {
      return (
        <div className="score-container">
          <div className="score-header">
            <h2>📈 Data Quality Score</h2>
            <p>Score data not available for <strong>{datasetStats.fileName}</strong>.</p>
          </div>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: "#6b7280" }}>Please re-upload your file to generate scores.</p>
            {onGoToUpload && (
              <button className="btn-action primary" onClick={onGoToUpload} style={{ marginTop: "1rem" }}>
                📤 Re-upload File
              </button>
            )}
          </div>
        </div>
      );
    }

    const {
      overallScore,
      dimensions,
      issueBreakdown,
      totalRows,
      totalColumns,
      totalIssues,
    } = scoreData;

    const getScoreColor = (s) =>
      s >= 90 ? "#10b981" : s >= 80 ? "#3b82f6" : s >= 70 ? "#f59e0b" : "#ef4444";

    const getGradeColor = (g) =>
      g.startsWith("A") ? "#10b981" : g.startsWith("B") ? "#3b82f6" :
      g.startsWith("C") ? "#f59e0b" : "#ef4444";

    const getTrendIcon = (t) =>
      ({ up: "📈", down: "📉", stable: "➡️" }[t] ?? "➡️");

    const overallGrade =
      overallScore >= 90 ? "A" : overallScore >= 80 ? "B+" :
      overallScore >= 70 ? "B" : "C";

    const overallLabel =
      overallScore >= 90 ? "Excellent" : overallScore >= 80 ? "Good" :
      overallScore >= 70 ? "Fair" : "Poor";

    const issueBreakdownList = [
      { severity: "High",   count: issueBreakdown.high,   color: "#ef4444" },
      { severity: "Medium", count: issueBreakdown.medium, color: "#f59e0b" },
      { severity: "Low",    count: issueBreakdown.low,    color: "#3b82f6" },
    ];
    const totalIssuesAll =
      (issueBreakdown.high + issueBreakdown.medium + issueBreakdown.low) || 1;

    // ── 🔄 REFRESH SCORE ───────────────────────────────────────────────────
    const handleRefresh = () => {
      if (isRefreshing) return;
      setIsRefreshing(true);
      setSelectedDimension(null);
      setTimeout(() => {
        setRefreshKey((k) => k + 1);   // re-trigger SVG animation
        setIsRefreshing(false);
      }, 1200);
    };

    // ── 📥 EXPORT QUALITY REPORT (HTML → download) ────────────────────────
    const handleExport = () => {
      if (isExporting) return;
      setIsExporting(true);

      const now      = new Date().toLocaleString();
      const fileName = datasetStats.fileName ?? "dataset";

      const dimensionRows = dimensions
        .map(
          (d) => `
          <tr>
            <td>${d.name}</td>
            <td style="color:${getScoreColor(d.score)};font-weight:700">${d.score}%</td>
            <td style="color:${getGradeColor(d.grade)};font-weight:700">${d.grade}</td>
            <td>${getTrendIcon(d.trend)} ${d.trend}</td>
            <td style="font-size:13px;color:#6b7280">${d.description}</td>
          </tr>`
        )
        .join("");

      const issueRows = issueBreakdownList
        .map(
          (i) => `
          <tr>
            <td style="color:${i.color};font-weight:700">${i.severity}</td>
            <td style="font-weight:700">${i.count}</td>
            <td>
              <div style="background:#e5e7eb;border-radius:6px;height:12px;overflow:hidden">
                <div style="background:${i.color};width:${Math.round((i.count/totalIssuesAll)*100)}%;height:100%;border-radius:6px"></div>
              </div>
            </td>
          </tr>`
        )
        .join("");

      const priorityRows = (datasetStats.issues ?? [])
        .filter((i) => i.severity === "high" || i.severity === "medium")
        .slice(0, 5)
        .map(
          (i) => `
          <tr>
            <td>
              <span style="background:${i.severity==="high"?"#ef4444":"#f59e0b"};
                color:white;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">
                ${i.severity.toUpperCase()}
              </span>
            </td>
            <td style="font-weight:600">${i.type}</td>
            <td>${i.column ?? "—"}</td>
            <td style="color:#6b7280;font-size:13px">${i.description ?? ""}</td>
          </tr>`
        )
        .join("");

      const scoreBarWidth = overallScore;
      const industryWidth = 78.5;
      const bestWidth     = 95.3;

      const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Data Quality Report — ${fileName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1f2937;padding:40px}
      .report-wrapper{max-width:900px;margin:0 auto;background:white;border-radius:16px;
        box-shadow:0 4px 32px rgba(0,0,0,0.10);overflow:hidden}
      /* header */
      .rpt-header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
        color:white;padding:40px 48px;display:flex;justify-content:space-between;align-items:center}
      .rpt-header h1{font-size:28px;font-weight:800;margin-bottom:6px}
      .rpt-header p{font-size:14px;opacity:.85}
      .rpt-badge{background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);
        border-radius:12px;padding:16px 28px;text-align:center}
      .rpt-badge .score-num{font-size:52px;font-weight:900;line-height:1}
      .rpt-badge .score-lbl{font-size:13px;opacity:.9;margin-top:4px}
      /* sections */
      .rpt-body{padding:40px 48px}
      .section{margin-bottom:36px}
      .section-title{font-size:18px;font-weight:700;color:#1f2937;margin-bottom:16px;
        padding-bottom:10px;border-bottom:2px solid #e5e7eb;display:flex;align-items:center;gap:8px}
      /* stats mini */
      .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:8px}
      .stat-box{background:#f9fafb;padding:16px;border-radius:10px;border-left:4px solid #667eea}
      .stat-box .lbl{font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:6px}
      .stat-box .val{font-size:26px;font-weight:800;color:#1f2937}
      /* tables */
      table{width:100%;border-collapse:collapse;font-size:14px}
      th{background:#f3f4f6;padding:10px 14px;text-align:left;font-weight:700;
        color:#1f2937;font-size:12px;text-transform:uppercase;letter-spacing:.4px}
      td{padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
      tr:last-child td{border-bottom:none}
      tr:hover td{background:#fafafa}
      /* comparison */
      .cmp-row{display:flex;align-items:center;gap:16px;margin-bottom:14px}
      .cmp-lbl{min-width:160px;font-size:14px;font-weight:600;color:#1f2937}
      .cmp-track{flex:1;background:#e5e7eb;border-radius:8px;height:28px;overflow:hidden}
      .cmp-fill{height:100%;border-radius:8px;display:flex;align-items:center;
        justify-content:flex-end;padding-right:12px}
      .cmp-fill span{font-size:13px;font-weight:700;color:white}
      /* insight box */
      .insight{background:#f0f4ff;border-left:4px solid #667eea;
        border-radius:8px;padding:16px 20px;font-size:14px;color:#1f2937;line-height:1.7}
      /* footer */
      .rpt-footer{background:#f9fafb;border-top:2px solid #e5e7eb;
        padding:20px 48px;font-size:12px;color:#9ca3af;
        display:flex;justify-content:space-between}
      @media print{body{padding:0}.report-wrapper{box-shadow:none}}
    </style>
  </head>
  <body>
  <div class="report-wrapper">

    <!-- Header -->
    <div class="rpt-header">
      <div>
        <h1>📊 Data Quality Report</h1>
        <p>File: <strong>${fileName}</strong></p>
        <p style="margin-top:6px">Generated: ${now}</p>
        <p style="margin-top:4px">Grade: <strong>${overallGrade}</strong> &nbsp;|&nbsp; Status: <strong>${overallLabel}</strong></p>
      </div>
      <div class="rpt-badge">
        <div class="score-num" style="color:${getScoreColor(overallScore)}">${overallScore}</div>
        <div class="score-lbl">Quality Score</div>
      </div>
    </div>

    <div class="rpt-body">

      <!-- Dataset Summary -->
      <div class="section">
        <div class="section-title">📋 Dataset Summary</div>
        <div class="stats-row">
          <div class="stat-box"><div class="lbl">Total Rows</div><div class="val">${totalRows.toLocaleString()}</div></div>
          <div class="stat-box"><div class="lbl">Total Columns</div><div class="val">${totalColumns}</div></div>
          <div class="stat-box"><div class="lbl">Issues Found</div><div class="val" style="color:#ef4444">${totalIssues}</div></div>
          <div class="stat-box"><div class="lbl">Missing Cells</div><div class="val" style="color:#f59e0b">${datasetStats.missing ?? 0}</div></div>
        </div>
      </div>

      <!-- Quality Dimensions -->
      <div class="section">
        <div class="section-title">📐 Quality Dimensions</div>
        <table>
          <thead>
            <tr><th>Dimension</th><th>Score</th><th>Grade</th><th>Trend</th><th>Notes</th></tr>
          </thead>
          <tbody>${dimensionRows}</tbody>
        </table>
      </div>

      <!-- Issue Breakdown -->
      <div class="section">
        <div class="section-title">⚠️ Issues by Severity</div>
        <table>
          <thead><tr><th>Severity</th><th>Count</th><th>Distribution</th></tr></thead>
          <tbody>${issueRows}</tbody>
        </table>
      </div>

      <!-- Benchmark Comparison -->
      <div class="section">
        <div class="section-title">📊 Benchmark Comparison</div>
        <div class="cmp-row">
          <div class="cmp-lbl">Your Score</div>
          <div class="cmp-track">
            <div class="cmp-fill" style="width:${scoreBarWidth}%;background:linear-gradient(90deg,#667eea,#764ba2)">
              <span>${overallScore}%</span></div>
          </div>
        </div>
        <div class="cmp-row">
          <div class="cmp-lbl">Industry Average</div>
          <div class="cmp-track">
            <div class="cmp-fill" style="width:${industryWidth}%;background:linear-gradient(90deg,#3b82f6,#2563eb)">
              <span>78.5%</span></div>
          </div>
        </div>
        <div class="cmp-row">
          <div class="cmp-lbl">Best in Class</div>
          <div class="cmp-track">
            <div class="cmp-fill" style="width:${bestWidth}%;background:linear-gradient(90deg,#10b981,#059669)">
              <span>95.3%</span></div>
          </div>
        </div>
        <div class="insight">
          ${overallScore > 78.5
            ? `🎯 Your score is <strong>${(overallScore - 78.5).toFixed(1)}%</strong> above industry average.`
            : `⚠️ Your score is <strong>${(78.5 - overallScore).toFixed(1)}%</strong> below industry average.`
          }
          ${overallScore >= 90
            ? " Your dataset shows <strong>excellent quality</strong>."
            : overallScore >= 80
            ? " Good quality with some room for improvement."
            : " Address high-priority issues to improve the score."}
        </div>
      </div>

      ${priorityRows ? `
      <!-- Priority Actions -->
      <div class="section">
        <div class="section-title">🎯 Priority Actions</div>
        <table>
          <thead><tr><th>Severity</th><th>Issue Type</th><th>Column</th><th>Description</th></tr></thead>
          <tbody>${priorityRows}</tbody>
        </table>
      </div>` : ""}

    </div>

    <!-- Footer -->
    <div class="rpt-footer">
      <span>📊 Data Quality Report — ${fileName}</span>
      <span>Generated on ${now}</span>
    </div>

  </div>
  </body>
  </html>`;

      // Trigger download
      const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `quality_report_${fileName.replace(/\.[^/.]+$/, "")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setTimeout(() => setIsExporting(false), 800);
    };

    return (
      <div className="score-container" ref={reportRef}>

        <div className="score-header">
          <h2>📈 Data Quality Score</h2>
          <p>
            Comprehensive quality assessment for <strong>{datasetStats.fileName}</strong>
          </p>
        </div>

        {/* Overall score card */}
        <div className={`overall-score-card ${isRefreshing ? "refreshing" : ""}`} key={refreshKey}>
          <div className="score-left">
            <div className="score-circle-container">
              <svg width="220" height="220" className="score-svg">
                <circle cx="110" cy="110" r="90"
                  fill="none" stroke="#e5e7eb" strokeWidth="20" />
                <circle cx="110" cy="110" r="90"
                  fill="none"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="20"
                  strokeDasharray="565.2"
                  strokeDashoffset={565.2 - (565.2 * overallScore) / 100}
                  transform="rotate(-90 110 110)"
                  className="score-circle-fill"
                />
              </svg>
              <div className="score-text-center">
                <span className="score-number-large">{overallScore}</span>
                <span className="score-label-large">Quality Score</span>
              </div>
            </div>
          </div>

          <div className="score-right">
            <div className="score-info">
              <h3>Overall Data Quality</h3>
              <p className="score-grade" style={{ color: getScoreColor(overallScore) }}>
                Grade: {overallGrade} ({overallLabel})
              </p>
              <p className="score-interpretation">
                {overallScore >= 90
                  ? "Your dataset shows excellent quality. Keep it up!"
                  : overallScore >= 80
                  ? "Your dataset shows good quality with room for improvement."
                  : "Your dataset needs quality improvements. Address high-priority issues first."}
              </p>
            </div>

            <div className="score-stats-mini">
              <div className="stat-mini">
                <span className="stat-mini-label">Total Records</span>
                <span className="stat-mini-value">{totalRows.toLocaleString()}</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-label">Total Columns</span>
                <span className="stat-mini-value">{totalColumns}</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-label">Issues Found</span>
                <span className="stat-mini-value">{totalIssues}</span>
              </div>
              <div className="stat-mini">
                <span className="stat-mini-label">Missing Cells</span>
                <span className="stat-mini-value">{datasetStats.missing}</span>
              </div>
            </div>

            <div className="time-range-selector">
              {["7days", "30days", "90days"].map((t) => (
                <button
                  key={t}
                  className={`time-btn ${timeRange === t ? "active" : ""}`}
                  onClick={() => setTimeRange(t)}
                >
                  {t === "7days" ? "7 Days" : t === "30days" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dimensions grid */}
        <div className="dimensions-section">
          <h3>📋 Quality Dimensions Breakdown</h3>
          <div className="dimensions-grid">
            {dimensions.map((dim, i) => (
              <div
                key={i}
                className={`dimension-card ${selectedDimension === i ? "selected" : ""}`}
                onClick={() => setSelectedDimension(selectedDimension === i ? null : i)}
              >
                <div className="dimension-header">
                  <h4>{dim.name}</h4>
                  <span className="trend-icon">{getTrendIcon(dim.trend)}</span>
                </div>
                <div className="dimension-score-row">
                  <div className="dimension-score-circle">
                    <svg width="80" height="80">
                      <circle cx="40" cy="40" r="32"
                        fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32"
                        fill="none"
                        stroke={getScoreColor(dim.score)}
                        strokeWidth="8"
                        strokeDasharray="201"
                        strokeDashoffset={201 - (201 * dim.score) / 100}
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="dimension-score-text">
                      <span className="dimension-score-num">{dim.score}</span>
                    </div>
                  </div>
                  <div className="dimension-grade">
                    <span
                      className="grade-badge"
                      style={{
                        background: getGradeColor(dim.grade) + "20",
                        color:      getGradeColor(dim.grade),
                        border:     `2px solid ${getGradeColor(dim.grade)}`,
                      }}
                    >
                      {dim.grade}
                    </span>
                  </div>
                </div>
                <p className="dimension-description">{dim.description}</p>
                <div className="dimension-progress">
                  <div className="progress-bar-dim">
                    <div
                      className="progress-fill-dim"
                      style={{
                        width:      `${dim.score}%`,
                        background: getScoreColor(dim.score),
                      }}
                    />
                  </div>
                </div>
                <button className="btn-view-dimension">
                  {selectedDimension === i ? "Hide Details" : "View Details"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dimension detail panel */}
        {selectedDimension !== null && (() => {
          const dim = dimensions[selectedDimension];
          return (
            <div className="dimension-details-panel">
              <div className="details-panel-header">
                <h3>🔍 {dim.name} — Detailed Analysis</h3>
                <button
                  className="btn-close-panel"
                  onClick={() => setSelectedDimension(null)}
                >✕</button>
              </div>
              <div className="details-panel-content">
                <div className="details-metrics">
                  <h4>📊 Score Breakdown</h4>
                  <div className="metrics-grid">
                    <div className="metric-box">
                      <span className="metric-label">Score:</span>
                      <span className="metric-value">{dim.score}%</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Grade:</span>
                      <span className="metric-value">{dim.grade}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Trend:</span>
                      <span className="metric-value">{getTrendIcon(dim.trend)} {dim.trend}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Total Rows:</span>
                      <span className="metric-value">{totalRows.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>{dim.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Issue breakdown */}
        <div className="issue-breakdown-card">
          <h3>⚠️ Issues by Severity</h3>
          <div className="issue-breakdown-grid">
            {issueBreakdownList.map((item, i) => (
              <div key={i} className="issue-breakdown-item">
                <div className="issue-breakdown-bar">
                  <div
                    className="issue-bar-fill"
                    style={{
                      width:      `${(item.count / totalIssuesAll) * 100}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <div className="issue-breakdown-info">
                  <span className="issue-severity">{item.severity}</span>
                  <span className="issue-count" style={{ color: item.color }}>
                    {item.count} issues
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="issue-summary">
            <p>
              <strong>{totalIssues} total issues</strong> detected in{" "}
              <strong>{datasetStats.fileName}</strong>.{" "}
              {issueBreakdown.high > 0 && (
                <span style={{ color: "#ef4444" }}>
                  Focus on {issueBreakdown.high} high-severity issues first.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Score comparison */}
        <div className="score-comparison-card">
          <h3>📊 Score Comparison</h3>
          <div className="comparison-bars">
            <div className="comparison-row">
              <span className="comparison-label">Your Score</span>
              <div className="comparison-bar">
                <div
                  className="comparison-fill your-score"
                  style={{ width: `${overallScore}%` }}
                >
                  <span>{overallScore}%</span>
                </div>
              </div>
            </div>
            <div className="comparison-row">
              <span className="comparison-label">Industry Average</span>
              <div className="comparison-bar">
                <div className="comparison-fill industry-avg" style={{ width: "78.5%" }}>
                  <span>78.5%</span>
                </div>
              </div>
            </div>
            <div className="comparison-row">
              <span className="comparison-label">Best in Class</span>
              <div className="comparison-bar">
                <div className="comparison-fill best-class" style={{ width: "95.3%" }}>
                  <span>95.3%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="comparison-insight">
            <p>
              {overallScore > 78.5
                ? `🎯 Your score is ${(overallScore - 78.5).toFixed(1)}% above industry average.`
                : `⚠️ Your score is ${(78.5 - overallScore).toFixed(1)}% below industry average.`}
            </p>
          </div>
        </div>

        {/* Priority actions */}
        {datasetStats.issues && datasetStats.issues.length > 0 && (
          <div className="action-recommendations">
            <h3>🎯 Priority Actions</h3>
            <div className="actions-list">
              {datasetStats.issues
                .filter((i) => i.severity === "high")
                .slice(0, 2)
                .map((issue) => (
                  <div key={issue.id} className="action-item priority-critical">
                    <span className="action-priority">High</span>
                    <div className="action-content">
                      <h4>{issue.type} in "{issue.column}"</h4>
                      <p>{issue.description}</p>
                      <button className="btn-action-quick">Fix Now →</button>
                    </div>
                  </div>
                ))}
              {datasetStats.issues
                .filter((i) => i.severity === "medium")
                .slice(0, 1)
                .map((issue) => (
                  <div key={issue.id} className="action-item priority-medium">
                    <span className="action-priority">Medium</span>
                    <div className="action-content">
                      <h4>{issue.type} in "{issue.column}"</h4>
                      <p>{issue.description}</p>
                      <button className="btn-action-quick">Review →</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── ACTION BUTTONS ─────────────────────────────────────────────── */}
        <div className="score-actions">
          <button
            className={`btn-export-score ${isExporting ? "loading" : ""}`}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "⏳ Exporting..." : "📥 Export Quality Report"}
          </button>

          <button
            className={`btn-refresh-score ${isRefreshing ? "loading" : ""}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh Score"}
          </button>
        </div>

      </div>
    );
  }