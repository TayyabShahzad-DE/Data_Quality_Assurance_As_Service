import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "../styles/dashboard.css";

import DashboardHome from "../sections/DashboardHome";
import Upload    from "../sections/Upload";
import Profiling from "../sections/Profiling";
import Issues    from "../sections/Issues";
import Cleaning  from "../sections/Cleaning";
import Score     from "../sections/Score";
import Reports   from "../sections/Reports";
import Api       from "../sections/Api";

export default function Dashboard() {
  const [section, setSection] = useState("dashboard");
  const [datasetStats, setDatasetStats] = useState(null);
  const [stats, setStats] = useState({
    totalRows: 0, missingValues: 0, duplicates: 0,
    qualityScore: 0, issuesFound: 0, issuesFixed: 0,
  });
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = "success") => {
    const n = { id: Date.now(), message, type };
    setNotifications((p) => [...p, n]);
    setTimeout(() => setNotifications((p) => p.filter((x) => x.id !== n.id)), 4000);
  };

  const handleUploadSuccess = (uploadData) => {
    setDatasetStats(uploadData);
    const totalCells   = (uploadData.rows * uploadData.columns) || 1;
    const completeness = +((1 - uploadData.missing / totalCells) * 100).toFixed(1);
    const uniqueness   = uploadData.rows > 0
      ? +((1 - uploadData.duplicates / uploadData.rows) * 100).toFixed(1) : 100;
    const qualityScore = uploadData.scoreData?.overallScore
      ?? +((completeness * 0.5 + uniqueness * 0.5)).toFixed(1);
    setStats({
      totalRows:     uploadData.rows,
      missingValues: uploadData.missing,
      duplicates:    uploadData.duplicates,
      qualityScore,
      issuesFound:   uploadData.issues?.length ?? (uploadData.missing + uploadData.duplicates),
      issuesFixed:   0,
    });
    setSection("profiling");
  };

  const getTitle = () => {
    const map = {
      dashboard: "📊 Dashboard Overview", upload: "📂 Upload Dataset",
      profiling: "📊 Data Profiling",     issues: "⚠️ Data Issues",
      cleaning:  "🧹 Data Cleaning",      score:  "📈 Quality Score",
      reports:   "📄 Reports",            api:    "🔌 API Access",
    };
    return map[section] ?? "Dashboard";
  };

  const getScoreColor = (s) =>
    s >= 90 ? "#10b981" : s >= 70 ? "#f59e0b" : "#ef4444";

  // ── DOWNLOAD helper ─────────────────────────────────────────────────────
  const triggerDownload = (content, fileName, mime) => {
    try {
      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 100);
    } catch (e) {
      const encoded = encodeURIComponent(content);
      const a       = document.createElement("a");
      a.href        = `data:${mime};charset=utf-8,${encoded}`;
      a.download    = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // ── CSV helper ──────────────────────────────────────────────────────────
  const toCSV = (rows) =>
    rows.map((row) =>
      row.map((cell) => {
        const s = String(cell ?? "");
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(",")
    ).join("\n");

  // ── EXPORT — targetSection allow karta hai ke koi bhi section export kare ─
  const handleExport = (format, targetSection) => {
    const activeSection = targetSection || section;

    if (!datasetStats) {
      addNotification("⚠️ Pehle file upload karo, phir export karo.", "error");
      return;
    }

    const ts       = Date.now();
    const safeName = (datasetStats.fileName ?? "data").replace(/\.[^.]+$/, "");

    if (format === "json") {
      let payload = {};

      if (activeSection === "issues") {
        payload = {
          report:      "Issues Report",
          fileName:    datasetStats.fileName,
          uploadDate:  datasetStats.uploadDate,
          totalIssues: datasetStats.issues?.length ?? 0,
          summary: {
            high:   datasetStats.issues?.filter((i) => i.severity === "high").length   ?? 0,
            medium: datasetStats.issues?.filter((i) => i.severity === "medium").length ?? 0,
            low:    datasetStats.issues?.filter((i) => i.severity === "low").length    ?? 0,
          },
          issues: datasetStats.issues ?? [],
        };
      } else if (activeSection === "cleaning") {
        payload = {
          report:        "Cleaning Rules Report",
          fileName:      datasetStats.fileName,
          uploadDate:    datasetStats.uploadDate,
          totalRules:    datasetStats.cleaningRules?.length ?? 0,
          cleaningRules: datasetStats.cleaningRules ?? [],
        };
      } else if (activeSection === "score") {
        payload = {
          report:         "Quality Score Report",
          fileName:       datasetStats.fileName,
          uploadDate:     datasetStats.uploadDate,
          overallScore:   datasetStats.scoreData?.overallScore ?? 0,
          dimensions:     datasetStats.scoreData?.dimensions   ?? [],
          issueBreakdown: datasetStats.scoreData?.issueBreakdown ?? {},
        };
      } else if (activeSection === "reports") {
        payload = {
          report:        "Full Dataset Report",
          fileName:      datasetStats.fileName,
          uploadDate:    datasetStats.uploadDate,
          totalRows:     datasetStats.rows,
          totalColumns:  datasetStats.columns,
          missingValues: datasetStats.missing,
          duplicates:    datasetStats.duplicates,
          qualityScore:  stats.qualityScore,
          issuesFound:   stats.issuesFound,
          issuesFixed:   stats.issuesFixed,
          issues:        datasetStats.issues ?? [],
          cleaningRules: datasetStats.cleaningRules ?? [],
          scoreData:     datasetStats.scoreData ?? {},
          columnProfiles:datasetStats.columnProfiles ?? [],
        };
      } else {
        payload = {
          report:         "Profiling Report",
          fileName:       datasetStats.fileName,
          uploadDate:     datasetStats.uploadDate,
          totalRows:      datasetStats.rows,
          totalColumns:   datasetStats.columns,
          missingValues:  datasetStats.missing,
          duplicates:     datasetStats.duplicates,
          qualityScore:   stats.qualityScore,
          columnProfiles: datasetStats.columnProfiles ?? [],
        };
      }

      triggerDownload(
        JSON.stringify(payload, null, 2),
        `${safeName}-${activeSection}-${ts}.json`,
        "application/json"
      );
      addNotification(`✅ JSON downloaded — ${activeSection} report`);

    } else if (format === "csv") {
      let csvRows = [];

      if (activeSection === "issues" && (datasetStats.issues?.length ?? 0) > 0) {
        csvRows = [
          ["ID", "Type", "Severity", "Column", "Rows Affected", "Auto-Fix", "Description", "Recommendation"],
          ...datasetStats.issues.map((i) => [
            i.id, i.type, i.severity, i.column,
            i.rowsAffected,
            i.autoFixAvailable ? "Yes" : "No",
            i.description,
            i.recommendation,
          ]),
        ];
      } else if (activeSection === "cleaning" && (datasetStats.cleaningRules?.length ?? 0) > 0) {
        csvRows = [
          ["ID", "Name", "Category", "Severity", "Impact", "Enabled", "Recommended", "Description"],
          ...datasetStats.cleaningRules.map((r) => [
            r.id, r.name, r.category, r.severity, r.impact,
            r.enabled     ? "Yes" : "No",
            r.recommended ? "Yes" : "No",
            r.description,
          ]),
        ];
      } else if (activeSection === "score" && (datasetStats.scoreData?.dimensions?.length ?? 0) > 0) {
        csvRows = [
          ["Overall Score", datasetStats.scoreData.overallScore],
          [],
          ["Dimension", "Score", "Grade", "Trend", "Description"],
          ...datasetStats.scoreData.dimensions.map((d) => [
            d.name, d.score, d.grade, d.trend, d.description,
          ]),
        ];
      } else if (activeSection === "reports") {
        csvRows = [
          ["Metric", "Value"],
          ["File Name",      datasetStats.fileName],
          ["Upload Date",    datasetStats.uploadDate],
          ["Total Rows",     datasetStats.rows],
          ["Total Columns",  datasetStats.columns],
          ["Missing Values", datasetStats.missing],
          ["Duplicates",     datasetStats.duplicates],
          ["Quality Score",  stats.qualityScore],
          ["Issues Found",   stats.issuesFound],
          ["Issues Fixed",   stats.issuesFixed],
        ];
      } else if ((datasetStats.columnProfiles?.length ?? 0) > 0) {
        csvRows = [
          ["Column", "Type", "Null Count", "Unique Values", "Mean or Mode"],
          ...datasetStats.columnProfiles.map((c) => [
            c.name, c.type, c.nulls, c.unique, c.mean ?? c.mode ?? "N/A",
          ]),
        ];
      } else {
        csvRows = [
          ["Metric", "Value"],
          ["File Name",      datasetStats.fileName],
          ["Upload Date",    datasetStats.uploadDate],
          ["Total Rows",     datasetStats.rows],
          ["Total Columns",  datasetStats.columns],
          ["Missing Values", datasetStats.missing],
          ["Duplicates",     datasetStats.duplicates],
          ["Quality Score",  stats.qualityScore],
          ["Total Issues",   datasetStats.issues?.length ?? 0],
        ];
      }

      triggerDownload(
        toCSV(csvRows),
        `${safeName}-${activeSection}-${ts}.csv`,
        "text/csv"
      );
      addNotification(`✅ CSV downloaded — ${activeSection} report`);
    }
  };

  const handleAutoFix = () => {
    setStats((p) => ({
      ...p,
      duplicates:   0,
      issuesFixed:  p.issuesFixed + p.duplicates,
      qualityScore: Math.min(100, p.qualityScore + 5),
    }));
    addNotification("✅ All duplicates removed successfully!");
  };

  // ── Reusable Export Button Component ────────────────────────────────────
  const ExportButtons = ({ sectionName, label }) => (
    <div className="section-export-bar">
      <span className="section-export-label">{label || `${sectionName} report download karo:`}</span>
      <div className="section-export-btns">
        <button
          className="btn-section-export json"
          onClick={() => handleExport("json", sectionName)}
          title={`Download ${sectionName} as JSON`}
        >
          📄 JSON
        </button>
        <button
          className="btn-section-export csv"
          onClick={() => handleExport("csv", sectionName)}
          title={`Download ${sectionName} as CSV`}
        >
          📊 CSV
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <Header />
      <Sidebar setSection={setSection} section={section} />

      <div className="main-content">

        {/* Top bar */}
        <div className="top-bar">
          <h2 className="page-title">{getTitle()}</h2>
          <div className="top-actions">
            <div className="export-dropdown">
              <div className="dropdown-menu">
                <button onClick={() => handleExport("json")}>📄 JSON Format</button>
                <button onClick={() => handleExport("csv")}>📊 CSV Format</button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notification-container">
            {notifications.map((n) => (
              <div key={n.id} className={`notification ${n.type}`}>{n.message}</div>
            ))}
          </div>
        )}

        {/* ── DASHBOARD HOME ──────────────────────────────────────────────── */}
        {section === "dashboard" && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>TOTAL ROWS</h3>
                  <p className="stat-value">{stats.totalRows.toLocaleString()}</p>
                  <span className="stat-badge positive">
                    {stats.totalRows > 0 ? "✅ Loaded" : "No file yet"}
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">⚠️</div>
                <div className="stat-info">
                  <h3>MISSING VALUES</h3>
                  <p className="stat-value">{stats.missingValues}</p>
                  <span className="stat-badge negative">
                    {stats.totalRows > 0
                      ? `${((stats.missingValues / ((stats.totalRows * (datasetStats?.columns || 1)) || 1)) * 100).toFixed(1)}% of cells`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-info">
                  <h3>DUPLICATES</h3>
                  <p className="stat-value">{stats.duplicates}</p>
                  <span className="stat-badge positive">
                    {stats.totalRows > 0
                      ? `${((stats.duplicates / stats.totalRows) * 100).toFixed(1)}% of rows`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✨</div>
                <div className="stat-info">
                  <h3>QUALITY SCORE</h3>
                  <p className="stat-value" style={{ color: getScoreColor(stats.qualityScore) }}>
                    {stats.qualityScore}%
                  </p>
                  <div className="score-bar">
                    <div className="score-fill" style={{
                      width: `${stats.qualityScore}%`,
                      backgroundColor: getScoreColor(stats.qualityScore),
                    }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions-panel">
              <h3>⚡ Quick Actions</h3>
              <div className="actions-grid">
                <div className="action-card">
                  <div className="action-icon">🧹</div>
                  <div className="action-content">
                    <h4>Auto-Clean Duplicates</h4>
                    <p>{stats.duplicates} duplicate rows detected</p>
                    <button className="action-btn" onClick={handleAutoFix} disabled={stats.duplicates === 0}>
                      {stats.duplicates === 0 ? "✅ Already Clean" : "Clean Now"}
                    </button>
                  </div>
                </div>
                <div className="action-card">
                  <div className="action-icon">⚠️</div>
                  <div className="action-content">
                    <h4>View Data Issues</h4>
                    <p>{stats.issuesFound} issues found in dataset</p>
                    <button className="action-btn secondary" onClick={() => setSection("issues")}>
                      View Details
                    </button>
                  </div>
                </div>
                <div className="action-card">
                  <div className="action-icon">📊</div>
                  <div className="action-content">
                    <h4>Run Profiling</h4>
                    <p>Analyze data patterns and statistics</p>
                    <button className="action-btn secondary" onClick={() => setSection("profiling")}>
                      Start Profiling
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="summary-panel">
              <div className="summary-left">
                <h3>📈 Data Quality Summary</h3>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-label">Issues Found:</span>
                    <span className="summary-value">{stats.issuesFound}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Issues Fixed:</span>
                    <span className="summary-value success">{stats.issuesFixed}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Remaining:</span>
                    <span className="summary-value warning">{stats.issuesFound - stats.issuesFixed}</span>
                  </div>
                </div>
              </div>
              <div className="summary-right">
                <h3>💡 Recommendations</h3>
                <ul className="recommendations-list">
                  <li>✅ Clean duplicate entries to improve accuracy</li>
                  <li>⚠️ Handle missing values in critical columns</li>
                  <li>📊 Run profiling to identify outliers</li>
                </ul>
              </div>
            </div>

            <div className="activity-panel">
              <h3>📋 Recent Activity</h3>
              <div className="activity-timeline">
                {datasetStats ? (
                  <>
                    <div className="activity-entry">
                      <div className="activity-dot" />
                      <div className="activity-details">
                        <strong>Dataset Uploaded</strong>
                        <p>{datasetStats.fileName} — {datasetStats.rows.toLocaleString()} rows, {datasetStats.columns} columns</p>
                        <span className="activity-time">Just now</span>
                      </div>
                    </div>
                    <div className="activity-entry">
                      <div className="activity-dot" />
                      <div className="activity-details">
                        <strong>Quality Check Completed</strong>
                        <p>Found {stats.issuesFound} issues — Quality Score: {stats.qualityScore}%</p>
                        <span className="activity-time">Just now</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="activity-entry">
                    <div className="activity-dot" />
                    <div className="activity-details">
                      <strong>No file uploaded yet</strong>
                      <p>Upload a dataset to see activity here</p>
                      <span className="activity-time">—</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DashboardHome />
          </>
        )}

        {/* ── PROFILING ──────────────────────────────────────────────────── */}
        {section === "profiling" && (
          <>
            <ExportButtons
              sectionName="profiling"
              label="📊 Profiling Report Download:"
            />
            <Profiling datasetStats={datasetStats} onGoToUpload={() => setSection("upload")} />
          </>
        )}

        {/* ── ISSUES ─────────────────────────────────────────────────────── */}
        {section === "issues" && (
          <>
            <ExportButtons
              sectionName="issues"
              label="⚠️ Issues Report DownloadS:"
            />
            <Issues datasetStats={datasetStats} onGoToUpload={() => setSection("upload")} />
          </>
        )}

        {/* ── CLEANING ───────────────────────────────────────────────────── */}
        {section === "cleaning" && (
          <>
            <ExportButtons
              sectionName="cleaning"
              label="🧹 Cleaning Rules Download:"
            />
            <Cleaning datasetStats={datasetStats} onGoToUpload={() => setSection("upload")} />
          </>
        )}

        {/* ── SCORE ──────────────────────────────────────────────────────── */}
        {section === "score" && (
          <>
            <ExportButtons
              sectionName="score"
              label="📈 Quality Score Report Download:"
            />
            <Score datasetStats={datasetStats} onGoToUpload={() => setSection("upload")} />
          </>
        )}

        {/* ── REPORTS ────────────────────────────────────────────────────── */}
        {section === "reports" && (
          <>
            <ExportButtons
              sectionName="reports"
              label="📄  Full Report Download:"
            />
            <Reports datasetStats={datasetStats} onGoToUpload={() => setSection("upload")} />
          </>
        )}

        {/* ── UPLOAD ─────────────────────────────────────────────────────── */}
        {section === "upload" && (
          <Upload onUploadSuccess={(data) => handleUploadSuccess(data)} />
        )}

        {/* ── API ────────────────────────────────────────────────────────── */}
        {section === "api" && <Api />}

      </div>
    </div>
  );
}