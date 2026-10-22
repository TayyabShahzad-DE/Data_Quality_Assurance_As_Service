import { useState } from "react";
import "../styles/issues.css";

export default function Issues({ datasetStats, onGoToUpload }) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterType,    setFilterType]    = useState("all");
  const [selectedRows,  setSelectedRows]  = useState([]);
  const [fixedIds,      setFixedIds]      = useState([]);
  const [fixingIds,     setFixingIds]     = useState([]);
  const [toastMsg,      setToastMsg]      = useState(null);

  // ── No data guard ──────────────────────────────────────────────────────
  if (!datasetStats) {
    return (
      <div className="issues-container">
        <div className="issues-header">
          <h2>⚠️ Data Issues Detection</h2>
          <p>No dataset loaded yet.</p>
        </div>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📂</div>
          <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>Please upload a file first</h3>
          <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>
            Upload a dataset to detect real data issues.
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

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const issuesData = datasetStats.issues ?? [];

  const issueSummary = {
    total:             issuesData.length,
    high:              issuesData.filter((i) => i.severity === "high").length,
    medium:            issuesData.filter((i) => i.severity === "medium").length,
    low:               issuesData.filter((i) => i.severity === "low").length,
    autoFixable:       issuesData.filter((i) => i.autoFixAvailable).length,
    totalRowsAffected: issuesData.reduce((sum, i) => sum + (i.rowsAffected ?? 0), 0),
  };

  const filteredIssues = (filterType === "all"
    ? issuesData
    : issuesData.filter((i) => i.severity === filterType)
  ).filter((i) => !fixedIds.includes(i.id));

  const getSeverityColor = (s) =>
    ({ high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" }[s] ?? "#6b7280");
  const getSeverityIcon = (s) =>
    ({ high: "🔴", medium: "🟡", low: "🔵" }[s] ?? "⚪");

  const handleRowSelect = (id) =>
    setSelectedRows((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const handleSelectAll = () =>
    setSelectedRows(
      selectedRows.length === filteredIssues.length
        ? []
        : filteredIssues.map((i) => i.id)
    );

  // ── Auto-Fix: animate each selected fixable issue one by one ───────────
  const handleAutoFix = () => {
    const fixable = selectedRows.filter(
      (id) => issuesData.find((i) => i.id === id)?.autoFixAvailable
    );
    const notFixable = selectedRows.length - fixable.length;

    if (fixable.length === 0) {
      showToast("❌ Selected issues mein koi auto-fixable nahi hai", "error");
      return;
    }

    // Animate fixing one by one
    fixable.forEach((id, idx) => {
      setTimeout(() => {
        setFixingIds((p) => [...p, id]);
        setTimeout(() => {
          setFixingIds((p) => p.filter((x) => x !== id));
          setFixedIds((p) => [...p, id]);
          setSelectedRows((p) => p.filter((x) => x !== id));
          if (idx === fixable.length - 1) {
            const msg = notFixable > 0
              ? `✅ ${fixable.length} issues fixed! ${notFixable} manual review needed.`
              : `✅ ${fixable.length} issue${fixable.length > 1 ? "s" : ""} successfully fixed!`;
            showToast(msg, "success");
          }
        }, 700);
      }, idx * 500);
    });
  };

  // ── Fix single issue from modal ────────────────────────────────────────
  const handleFixSingle = (id) => {
    setFixingIds((p) => [...p, id]);
    setTimeout(() => {
      setFixingIds((p) => p.filter((x) => x !== id));
      setFixedIds((p) => [...p, id]);
      setSelectedIssue(null);
      showToast("✅ Issue successfully fixed!", "success");
    }, 800);
  };

  const categoryMap = issuesData.reduce((acc, i) => {
    if (!acc[i.type]) acc[i.type] = { count: 0, rows: 0 };
    acc[i.type].count++;
    acc[i.type].rows += i.rowsAffected ?? 0;
    return acc;
  }, {});

  const categoryIcons = {
    "Missing Values":    "⚠️",
    "Duplicates":        "🔄",
    "Invalid Format":    "❌",
    "Outliers":          "📊",
    "Inconsistent Data": "🔀",
    "Out of Range":      "⚡",
  };

  const modalIssue = issuesData.find((i) => i.id === selectedIssue);

  return (
    <div className="issues-container">

      {/* ── Toast notification ─────────────────────────────────────────── */}
      {toastMsg && (
        <div className={`issues-toast ${toastMsg.type}`}>
          {toastMsg.msg}
        </div>
      )}

      {/* ── Modal popup ────────────────────────────────────────────────── */}
      {selectedIssue && modalIssue && (
        <div className="modal-backdrop" onClick={() => setSelectedIssue(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div
              className="modal-header"
              style={{ borderBottom: `3px solid ${getSeverityColor(modalIssue.severity)}` }}
            >
              <div className="modal-header-left">
                <span
                  className="modal-severity-pill"
                  style={{
                    background: getSeverityColor(modalIssue.severity) + "18",
                    color:      getSeverityColor(modalIssue.severity),
                    border:     `1.5px solid ${getSeverityColor(modalIssue.severity)}`,
                  }}
                >
                  {getSeverityIcon(modalIssue.severity)}&nbsp;
                  {modalIssue.severity.toUpperCase()}
                </span>
                <h3 className="modal-title">{modalIssue.type}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedIssue(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="modal-body">

              {/* Meta row */}
              <div className="modal-meta-row">
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Column</span>
                  <span className="modal-meta-value code">{modalIssue.column}</span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Rows Affected</span>
                  <span
                    className="modal-meta-value"
                    style={{ color: getSeverityColor(modalIssue.severity), fontWeight: 800 }}
                  >
                    {modalIssue.rowsAffected ?? "—"}
                  </span>
                </div>
                <div className="modal-meta-item">
                  <span className="modal-meta-label">Auto-Fix</span>
                  <span className={`modal-meta-value ${modalIssue.autoFixAvailable ? "green" : "red"}`}>
                    {modalIssue.autoFixAvailable ? "✅ Available" : "❌ Manual"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="modal-section">
                <div className="modal-section-icon">📋</div>
                <div>
                  <h4 className="modal-section-title">Description</h4>
                  <p className="modal-section-text">{modalIssue.description}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="modal-section recommendation">
                <div className="modal-section-icon">💡</div>
                <div>
                  <h4 className="modal-section-title">Recommendation</h4>
                  <p className="modal-section-text">{modalIssue.recommendation}</p>
                </div>
              </div>

              {/* Impact bar */}
              <div className="modal-impact-bar">
                <span className="modal-impact-label">Impact Level</span>
                <div className="modal-impact-track">
                  <div
                    className="modal-impact-fill"
                    style={{
                      width: modalIssue.severity === "high"
                        ? "90%"
                        : modalIssue.severity === "medium" ? "55%" : "25%",
                      background: getSeverityColor(modalIssue.severity),
                    }}
                  />
                </div>
                <span
                  className="modal-impact-pct"
                  style={{ color: getSeverityColor(modalIssue.severity) }}
                >
                  {modalIssue.severity === "high"
                    ? "High" : modalIssue.severity === "medium" ? "Medium" : "Low"}
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="modal-footer">
              <button
                className="modal-btn-cancel"
                onClick={() => setSelectedIssue(null)}
              >
                Close
              </button>
              {modalIssue.autoFixAvailable && !fixedIds.includes(modalIssue.id) && (
                <button
                  className={`modal-btn-fix ${fixingIds.includes(modalIssue.id) ? "fixing" : ""}`}
                  onClick={() => handleFixSingle(modalIssue.id)}
                  disabled={fixingIds.includes(modalIssue.id)}
                >
                  {fixingIds.includes(modalIssue.id)
                    ? <><span className="spinner" /> Fixing…</>
                    : "🔧 Fix This Issue"}
                </button>
              )}
              {fixedIds.includes(modalIssue.id) && (
                <span className="modal-fixed-badge">✅ Already Fixed</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="issues-header">
        <h2>⚠️ Data Issues Detection</h2>
        <p>
          Real issues detected from <strong>{datasetStats.fileName}</strong>
          {issuesData.length > 0 && (
            <span style={{ marginLeft: "0.5rem", color: "#ef4444", fontWeight: 600 }}>
              — {issuesData.length - fixedIds.length} remaining
            </span>
          )}
          {fixedIds.length > 0 && (
            <span style={{ marginLeft: "0.5rem", color: "#10b981", fontWeight: 600 }}>
              · {fixedIds.length} fixed ✅
            </span>
          )}
        </p>
      </div>

      {/* Summary cards */}
      <div className="issues-summary-grid">
        {[
          { cls: "total",   icon: "⚠️", label: "Total Issues",    val: issuesData.length - fixedIds.length,  sub: "Issues remaining" },
          { cls: "high",    icon: "🔴", label: "High Severity",   val: issueSummary.high,                    sub: "Critical issues"  },
          { cls: "medium",  icon: "🟡", label: "Medium Severity", val: issueSummary.medium,                  sub: "Moderate issues"  },
          { cls: "low",     icon: "🔵", label: "Low Severity",    val: issueSummary.low,                     sub: "Minor issues"     },
          { cls: "autofix", icon: "🔧", label: "Auto-Fixable",    val: issueSummary.autoFixable - fixedIds.filter(id => issuesData.find(i=>i.id===id)?.autoFixAvailable).length, sub: "Can be auto-fixed" },
          { cls: "affected",icon: "📊", label: "Rows Affected",   val: issueSummary.totalRowsAffected,       sub: "Total affected"   },
        ].map(({ cls, icon, label, val, sub }) => (
          <div key={cls} className={`summary-card ${cls}`}>
            <div className="summary-icon">{icon}</div>
            <div className="summary-content">
              <h3>{label}</h3>
              <p className="summary-number">{val}</p>
              <span className="summary-label">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {issuesData.length === 0 && (
        <div className="no-issues" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem" }}>✅</div>
          <h3 style={{ color: "#10b981", marginTop: "1rem" }}>No Issues Found!</h3>
          <p style={{ color: "#6b7280" }}>Your dataset looks clean. Great job!</p>
        </div>
      )}

      {issuesData.length > 0 && (
        <>
          {/* Filters & actions */}
          <div className="issues-controls">
            <div className="filter-buttons">
              {["all", "high", "medium", "low"].map((f) => (
                <button
                  key={f}
                  className={`filter-btn ${filterType === f ? "active" : ""}`}
                  onClick={() => setFilterType(f)}
                >
                  {f === "all"
                    ? `All Issues (${issuesData.length - fixedIds.length})`
                    : `${getSeverityIcon(f)} ${f.charAt(0).toUpperCase() + f.slice(1)} (${issueSummary[f]})`}
                </button>
              ))}
            </div>
            <div className="action-buttons-group">
              <button className="btn-select-all" onClick={handleSelectAll}>
                {selectedRows.length === filteredIssues.length && filteredIssues.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                className={`btn-auto-fix ${selectedRows.length > 0 ? "ready" : ""}`}
                onClick={handleAutoFix}
                disabled={selectedRows.length === 0}
              >
                🔧 Auto-Fix Selected ({selectedRows.length})
              </button>
            </div>
          </div>

          {/* Issues table */}
          <div className="issues-table-container">
            <table className="issues-table">
              <thead>
                <tr>
                  <th width="50">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === filteredIssues.length &&
                        filteredIssues.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th width="80">Severity</th>
                  <th>Issue Type</th>
                  <th>Column</th>
                  <th width="120">Rows Affected</th>
                  <th width="100">Auto-Fix</th>
                  <th width="120">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className={`
                      ${selectedRows.includes(issue.id) ? "selected" : ""}
                      ${fixingIds.includes(issue.id) ? "row-fixing" : ""}
                    `}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(issue.id)}
                        onChange={() => handleRowSelect(issue.id)}
                      />
                    </td>
                    <td>
                      <span
                        className="severity-badge"
                        style={{
                          background: getSeverityColor(issue.severity) + "20",
                          color:      getSeverityColor(issue.severity),
                          border:     `2px solid ${getSeverityColor(issue.severity)}`,
                        }}
                      >
                        {getSeverityIcon(issue.severity)} {issue.severity}
                      </span>
                    </td>
                    <td>
                      <div className="issue-type">
                        <strong>{issue.type}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="column-badge">{issue.column}</span>
                    </td>
                    <td className="text-center">
                      {fixingIds.includes(issue.id) ? (
                        <span className="fixing-spinner">⟳</span>
                      ) : (
                        <span className="rows-count">{issue.rowsAffected}</span>
                      )}
                    </td>
                    <td className="text-center">
                      {issue.autoFixAvailable
                        ? <span className="badge-success">✅ Yes</span>
                        : <span className="badge-warning">❌ No</span>}
                    </td>
                    <td>
                      <button
                        className="btn-view-issue"
                        onClick={() => setSelectedIssue(issue.id)}
                      >
                        🔍 View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredIssues.length === 0 && (
              <div className="no-issues">
                <div className="no-issues-icon">✅</div>
                <h3>
                  {fixedIds.length > 0
                    ? "All issues fixed! Great job! 🎉"
                    : "No Issues Found"}
                </h3>
                <p>
                  {fixedIds.length > 0
                    ? `You fixed ${fixedIds.length} issue${fixedIds.length > 1 ? "s" : ""} successfully.`
                    : "No issues match the selected filter"}
                </p>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="issue-categories">
            <h3>📊 Issues by Category</h3>
            <div className="categories-grid">
              {Object.entries(categoryMap).map(([type, data]) => (
                <div key={type} className="category-card">
                  <div className="category-icon">{categoryIcons[type] ?? "📌"}</div>
                  <h4>{type}</h4>
                  <p className="category-count">
                    {data.count} issue{data.count > 1 ? "s" : ""}
                  </p>
                  <span className="category-rows">{data.rows} rows affected</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="recommendations-panel">
            <h3>💡 Quick Recommendations</h3>
            <div className="recommendations-list">
              {issueSummary.high > 0 && (
                <div className="recommendation-item priority-high">
                  <span className="priority-badge">High Priority</span>
                  <p>
                    Fix {issueSummary.high} high severity issue
                    {issueSummary.high > 1 ? "s" : ""} first to ensure data integrity
                  </p>
                </div>
              )}
              {issueSummary.autoFixable > 0 && (
                <div className="recommendation-item priority-medium">
                  <span className="priority-badge">Medium Priority</span>
                  <p>
                    Use auto-fix feature for {issueSummary.autoFixable} automatically
                    fixable issue{issueSummary.autoFixable > 1 ? "s" : ""}
                  </p>
                </div>
              )}
              {issueSummary.low > 0 && (
                <div className="recommendation-item priority-low">
                  <span className="priority-badge">Low Priority</span>
                  <p>
                    Review {issueSummary.low} low severity issue
                    {issueSummary.low > 1 ? "s" : ""} manually
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}