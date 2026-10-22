  import { useState } from "react";
  import "../styles/reports.css";

  // ── HTML Report generator ──────────────────────────────────────────────────
  function generateHTMLReport(report, datasetStats, scoreData) {
    const now      = new Date().toLocaleString();
    const fileName = datasetStats.fileName ?? "dataset";
    const score    = scoreData?.overallScore ?? 0;

    const dimRows = (scoreData?.dimensions ?? []).map((d) => `
      <tr>
        <td>${d.name}</td>
        <td style="font-weight:700;color:${score>=90?"#10b981":score>=80?"#3b82f6":score>=70?"#f59e0b":"#ef4444"}">${d.score}%</td>
        <td style="font-weight:700">${d.grade}</td>
        <td style="color:#6b7280;font-size:13px">${d.description}</td>
      </tr>`).join("");

    const issueRows = (datasetStats.issues ?? []).slice(0, 10).map((i) => `
      <tr>
        <td><span style="background:${i.severity==="high"?"#ef4444":i.severity==="medium"?"#f59e0b":"#3b82f6"};
          color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700">
          ${i.severity?.toUpperCase()}</span></td>
        <td style="font-weight:600">${i.type ?? ""}</td>
        <td>${i.column ?? "—"}</td>
        <td style="color:#6b7280;font-size:13px">${i.description ?? ""}</td>
      </tr>`).join("");

    const colRows = (datasetStats.columnProfiles ?? []).map((c) => `
      <tr>
        <td style="font-weight:600">${c.name}</td>
        <td>${c.type}</td>
        <td>${c.unique}</td>
        <td style="color:${c.nulls>0?"#ef4444":"#10b981"};font-weight:700">${c.nulls}</td>
        <td>${c.mode ?? "—"}</td>
      </tr>`).join("");

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>${report.name} — ${fileName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1f2937;padding:32px}
      .wrap{max-width:960px;margin:0 auto;background:white;border-radius:16px;
        box-shadow:0 4px 32px rgba(0,0,0,.10);overflow:hidden}
      .hdr{background:linear-gradient(135deg,#667eea,#764ba2);color:white;
        padding:40px 48px;display:flex;justify-content:space-between;align-items:center}
      .hdr h1{font-size:26px;font-weight:800;margin-bottom:6px}
      .hdr p{font-size:13px;opacity:.85;margin-top:4px}
      .badge{background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);
        border-radius:12px;padding:14px 24px;text-align:center;min-width:120px}
      .badge .num{font-size:48px;font-weight:900;line-height:1}
      .badge .lbl{font-size:12px;opacity:.9;margin-top:4px}
      .body{padding:40px 48px}
      .sec{margin-bottom:36px}
      .sec-title{font-size:17px;font-weight:700;color:#1f2937;margin-bottom:14px;
        padding-bottom:10px;border-bottom:2px solid #e5e7eb}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:4px}
      .sbox{background:#f9fafb;padding:14px;border-radius:10px;border-left:4px solid #667eea}
      .sbox .l{font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:6px}
      .sbox .v{font-size:24px;font-weight:800;color:#1f2937}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#f3f4f6;padding:10px 14px;text-align:left;font-weight:700;
        color:#1f2937;font-size:12px;text-transform:uppercase;letter-spacing:.4px}
      td{padding:10px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
      tr:hover td{background:#fafafa}
      .insight{background:#f0f4ff;border-left:4px solid #667eea;border-radius:8px;
        padding:14px 18px;font-size:13px;color:#1f2937;line-height:1.7;margin-top:12px}
      .cmp-row{display:flex;align-items:center;gap:14px;margin-bottom:12px}
      .cmp-lbl{min-width:160px;font-size:13px;font-weight:600}
      .cmp-track{flex:1;background:#e5e7eb;border-radius:6px;height:24px;overflow:hidden}
      .cmp-fill{height:100%;border-radius:6px;display:flex;align-items:center;
        justify-content:flex-end;padding-right:10px}
      .cmp-fill span{font-size:12px;font-weight:700;color:white}
      .footer{background:#f9fafb;border-top:2px solid #e5e7eb;padding:18px 48px;
        font-size:12px;color:#9ca3af;display:flex;justify-content:space-between}
      @media print{body{padding:0}.wrap{box-shadow:none}}
    </style>
  </head>
  <body>
  <div class="wrap">
    <div class="hdr">
      <div>
        <h1>${report.icon} ${report.name}</h1>
        <p>File: <strong>${fileName}</strong></p>
        <p>Generated: ${now}</p>
        <p>Grade: <strong>${score>=90?"A":score>=80?"B+":score>=70?"B":"C"}</strong> &nbsp;|&nbsp;
          Status: <strong>${score>=90?"Excellent":score>=80?"Good":score>=70?"Fair":"Poor"}</strong></p>
      </div>
      <div class="badge">
        <div class="num" style="color:${score>=90?"#10b981":score>=80?"#3b82f6":score>=70?"#f59e0b":"#ef4444"}">${score}</div>
        <div class="lbl">Quality Score</div>
      </div>
    </div>

    <div class="body">

      <div class="sec">
        <div class="sec-title">📋 Dataset Summary</div>
        <div class="stats">
          <div class="sbox"><div class="l">Total Rows</div><div class="v">${(datasetStats.rows??0).toLocaleString()}</div></div>
          <div class="sbox"><div class="l">Total Columns</div><div class="v">${datasetStats.columns??0}</div></div>
          <div class="sbox"><div class="l">Issues Found</div><div class="v" style="color:#ef4444">${datasetStats.issues?.length??0}</div></div>
          <div class="sbox"><div class="l">Missing Cells</div><div class="v" style="color:#f59e0b">${datasetStats.missing??0}</div></div>
        </div>
      </div>

      ${dimRows ? `
      <div class="sec">
        <div class="sec-title">📐 Quality Dimensions</div>
        <table><thead><tr><th>Dimension</th><th>Score</th><th>Grade</th><th>Notes</th></tr></thead>
        <tbody>${dimRows}</tbody></table>
      </div>` : ""}

      ${colRows ? `
      <div class="sec">
        <div class="sec-title">📊 Column Profiles</div>
        <table><thead><tr><th>Column</th><th>Type</th><th>Unique</th><th>Missing</th><th>Most Common</th></tr></thead>
        <tbody>${colRows}</tbody></table>
      </div>` : ""}

      ${issueRows ? `
      <div class="sec">
        <div class="sec-title">⚠️ Issues Detected</div>
        <table><thead><tr><th>Severity</th><th>Type</th><th>Column</th><th>Description</th></tr></thead>
        <tbody>${issueRows}</tbody></table>
      </div>` : ""}

      <div class="sec">
        <div class="sec-title">📊 Benchmark Comparison</div>
        <div class="cmp-row">
          <div class="cmp-lbl">Your Score</div>
          <div class="cmp-track"><div class="cmp-fill" style="width:${score}%;background:linear-gradient(90deg,#667eea,#764ba2)"><span>${score}%</span></div></div>
        </div>
        <div class="cmp-row">
          <div class="cmp-lbl">Industry Average</div>
          <div class="cmp-track"><div class="cmp-fill" style="width:78.5%;background:linear-gradient(90deg,#3b82f6,#2563eb)"><span>78.5%</span></div></div>
        </div>
        <div class="cmp-row">
          <div class="cmp-lbl">Best in Class</div>
          <div class="cmp-track"><div class="cmp-fill" style="width:95.3%;background:linear-gradient(90deg,#10b981,#059669)"><span>95.3%</span></div></div>
        </div>
        <div class="insight">
          ${score>78.5
            ? `🎯 Your score is <strong>${(score-78.5).toFixed(1)}%</strong> above industry average.`
            : `⚠️ Your score is <strong>${(78.5-score).toFixed(1)}%</strong> below industry average.`}
          ${score>=90?" Excellent quality dataset!"
            :score>=80?" Good quality with minor improvements needed."
            :" Address high-priority issues to improve quality."}
        </div>
      </div>

    </div>
    <div class="footer">
      <span>${report.name} — ${fileName}</span>
      <span>Generated ${now}</span>
    </div>
  </div>
  </body></html>`;
  }

  // ── CSV generator ──────────────────────────────────────────────────────────
  function generateCSV(report, datasetStats) {
    const lines = [];
    lines.push(`"${report.name}"`);
    lines.push(`"File","${datasetStats.fileName}"`);
    lines.push(`"Generated","${new Date().toLocaleString()}"`);
    lines.push(`"Rows","${datasetStats.rows}"`);
    lines.push(`"Columns","${datasetStats.columns}"`);
    lines.push(`"Missing","${datasetStats.missing}"`);
    lines.push(`"Quality Score","${datasetStats.scoreData?.overallScore ?? 0}%"`);
    lines.push("");
    lines.push('"Column","Type","Unique","Missing","Most Common"');
    (datasetStats.columnProfiles ?? []).forEach((c) => {
      lines.push(`"${c.name}","${c.type}","${c.unique}","${c.nulls}","${c.mode ?? ""}"`);
    });
    lines.push("");
    lines.push('"Severity","Issue Type","Column","Description"');
    (datasetStats.issues ?? []).forEach((i) => {
      lines.push(`"${i.severity}","${i.type}","${i.column ?? ""}","${i.description ?? ""}"`);
    });
    return lines.join("\n");
  }

  // ── Trigger download ───────────────────────────────────────────────────────
  function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── Custom report sections ─────────────────────────────────────────────────
  const CUSTOM_SECTIONS = [
    { id: "summary",     label: "📋 Dataset Summary",       desc: "Rows, columns, missing cells overview" },
    { id: "dimensions",  label: "📐 Quality Dimensions",    desc: "Completeness, accuracy, consistency scores" },
    { id: "columns",     label: "📊 Column Profiles",       desc: "Per-column stats, types, unique values" },
    { id: "issues",      label: "⚠️ Issues List",           desc: "All detected issues with severity" },
    { id: "benchmark",   label: "📈 Benchmark Comparison",  desc: "Your score vs industry & best-in-class" },
    { id: "cleaning",    label: "🧹 Cleaning Rules",        desc: "Generated cleaning rules and impact" },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  export default function Reports({ datasetStats, onGoToUpload }) {
    const [selectedReport, setSelectedReport]         = useState(null);
    const [filterType, setFilterType]                 = useState("all");
    const [generatingReport, setGeneratingReport]     = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [currentFormat, setCurrentFormat]           = useState("");

    // Custom report state
    const [showCustom, setShowCustom]                 = useState(false);
    const [customSections, setCustomSections]         = useState(
      CUSTOM_SECTIONS.map((s) => ({ ...s, checked: true }))
    );
    const [customTitle, setCustomTitle]               = useState("My Custom Report");
    const [customFormat, setCustomFormat]             = useState("HTML");

    // ── No data guard ────────────────────────────────────────────────────────
    if (!datasetStats) {
      return (
        <div className="reports-container">
          <div className="reports-header"><h2>📄 Reports & Analytics</h2><p>No dataset loaded yet.</p></div>
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📂</div>
            <h3 style={{ color: "#6b7280", marginBottom: "1rem" }}>Please upload a file first</h3>
            <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>Upload a dataset to generate reports.</p>
            {onGoToUpload && <button className="btn-action primary" onClick={onGoToUpload}>📤 Go to Upload</button>}
          </div>
        </div>
      );
    }

    const score      = datasetStats.scoreData?.overallScore ?? 0;
    const issueCount = datasetStats.issues?.length ?? 0;
    const colCount   = datasetStats.columns;
    const rowCount   = datasetStats.rows;

    const availableReports = [
      {
        id: 1, name: "Data Quality Summary Report",
        description: `Quality overview for ${datasetStats.fileName}`,
        type: "quality", icon: "📊", format: ["PDF", "Excel", "HTML"],
        size: "~2 MB", popular: true,
        includes: [`Overall quality score: ${score}%`, `${issueCount} issues detected`, "Dimension breakdown", "Recommendations"],
      },
      {
        id: 2, name: "Data Profiling Report",
        description: `Detailed analysis of ${colCount} columns, ${rowCount.toLocaleString()} rows`,
        type: "profiling", icon: "📈", format: ["PDF", "HTML"],
        size: "~3 MB", popular: true,
        includes: ["Column statistics", "Data type distribution", `${datasetStats.missing} missing values`, "Outlier detection"],
      },
      {
        id: 3, name: "Issues & Anomalies Report",
        description: `${issueCount} issues detected — severity breakdown included`,
        type: "issues", icon: "⚠️", format: ["PDF", "Excel", "CSV"],
        size: "~1.5 MB", popular: true,
        includes: [
          `${datasetStats.scoreData?.issueBreakdown?.high ?? 0} high severity`,
          `${datasetStats.scoreData?.issueBreakdown?.medium ?? 0} medium severity`,
          `${datasetStats.scoreData?.issueBreakdown?.low ?? 0} low severity`,
          "Fix recommendations",
        ],
      },
      {
        id: 4, name: "Data Cleaning Report",
        description: `${datasetStats.cleaningRules?.length ?? 0} cleaning rules generated`,
        type: "cleaning", icon: "🧹", format: ["PDF", "Excel"],
        size: "~1 MB", popular: false,
        includes: ["Rules generated", "Estimated impact", "Before/after summary", "Recommendations"],
      },
      {
        id: 5, name: "Executive Summary",
        description: "High-level overview for management and stakeholders",
        type: "executive", icon: "📋", format: ["PDF", "HTML"],
        size: "~1.5 MB", popular: true,
        includes: [`Quality Score: ${score}%`, `${rowCount.toLocaleString()} records analyzed`, `${issueCount} issues found`, "Action items"],
      },
      {
        id: 6, name: "Custom Report",
        description: "Build your own report with selected metrics",
        type: "custom", icon: "⚙️", format: ["PDF", "Excel", "HTML"],
        size: "Variable", popular: false,
        includes: ["Custom sections", "Selected metrics", "Flexible format", "Personalized layout"],
      },
    ];

    const filteredReports = filterType === "all"
      ? availableReports
      : filterType === "popular"
      ? availableReports.filter((r) => r.popular)
      : availableReports.filter((r) => r.type === filterType);

    // ── Real report generation ───────────────────────────────────────────────
    const handleGenerateReport = (report, format) => {
      // Custom report → open builder instead
      if (report.type === "custom") { setShowCustom(true); return; }

      setGeneratingReport(true);
      setGenerationProgress(0);
      setCurrentFormat(format);

      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 22;
        if (p >= 100) {
          p = 100;
          clearInterval(iv);
          setTimeout(() => {
            setGeneratingReport(false);
            doDownload(report, format, datasetStats);
          }, 400);
        }
        setGenerationProgress(Math.min(p, 100));
      }, 280);
    };

    const doDownload = (report, format, stats) => {
      const base = report.name.toLowerCase().replace(/\s+/g, "_");
      const file = stats.fileName?.replace(/\.[^/.]+$/, "") ?? "data";

      if (format === "HTML" || format === "PDF") {
        // PDF: generate HTML and open in new tab for browser print-to-PDF
        const html = generateHTMLReport(report, stats, stats.scoreData);
        if (format === "PDF") {
          const win = window.open("", "_blank");
          win.document.write(html);
          win.document.close();
          win.onload = () => { win.focus(); win.print(); };
        } else {
          triggerDownload(html, `${base}_${file}.html`, "text/html;charset=utf-8;");
        }
      } else if (format === "CSV") {
        const csv = generateCSV(report, stats);
        triggerDownload(csv, `${base}_${file}.csv`, "text/csv;charset=utf-8;");
      } else if (format === "Excel") {
        // Excel as CSV (universally opens in Excel)
        const csv = generateCSV(report, stats);
        triggerDownload(csv, `${base}_${file}.csv`, "text/csv;charset=utf-8;");
      }
    };

    // ── Email Report ─────────────────────────────────────────────────────────
    const handleEmailReport = () => {
      const subject = encodeURIComponent(`Data Quality Report — ${datasetStats.fileName}`);
      const body    = encodeURIComponent(
        `Hi,\n\nPlease find the Data Quality Report summary below:\n\n` +
        `File: ${datasetStats.fileName}\n` +
        `Quality Score: ${score}%\n` +
        `Total Rows: ${rowCount.toLocaleString()}\n` +
        `Total Columns: ${colCount}\n` +
        `Issues Found: ${issueCount}\n` +
        `Missing Cells: ${datasetStats.missing ?? 0}\n\n` +
        `High Severity Issues: ${datasetStats.scoreData?.issueBreakdown?.high ?? 0}\n` +
        `Medium Severity Issues: ${datasetStats.scoreData?.issueBreakdown?.medium ?? 0}\n` +
        `Low Severity Issues: ${datasetStats.scoreData?.issueBreakdown?.low ?? 0}\n\n` +
        `Generated on: ${new Date().toLocaleString()}\n\n` +
        `Regards`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    // ── Schedule (UI only — shows info) ─────────────────────────────────────
    const handleSchedule = () => {
      alert(
        "⏰ Schedule Reports\n\n" +
        "Available schedules:\n" +
        "• Daily at 8:00 AM\n" +
        "• Weekly on Monday\n" +
        "• Monthly on 1st\n\n" +
        "Connect your email/Slack to activate scheduling.\n" +
        "(This feature requires backend integration)"
      );
    };

    // ── Custom report download ───────────────────────────────────────────────
    const handleCustomGenerate = () => {
      const checked = customSections.filter((s) => s.checked);
      if (checked.length === 0) { alert("❌ Please select at least one section"); return; }

      const customReport = {
        name: customTitle || "Custom Report",
        icon: "⚙️",
        type: "custom",
      };

      setShowCustom(false);
      handleGenerateReport({ ...customReport, type: "NOT_custom" }, customFormat);
    };

    const toggleSection = (id) =>
      setCustomSections((prev) =>
        prev.map((s) => s.id === id ? { ...s, checked: !s.checked } : s)
      );

    return (
      <div className="reports-container">

        <div className="reports-header">
          <h2>📄 Reports & Analytics</h2>
          <p>Generate reports for <strong>{datasetStats.fileName}</strong> — {rowCount.toLocaleString()} rows, {colCount} columns</p>
        </div>

        {/* Quick stats */}
        <div className="reports-stats-grid">
          {[
            { icon: "📊", title: "Total Reports",  value: availableReports.length, label: "Available templates" },
            { icon: "✨", title: "Quality Score",  value: `${score}%`,              label: "Overall score"       },
            { icon: "⚠️", title: "Issues Found",   value: issueCount,               label: "In dataset"          },
            { icon: "📈", title: "Rows Analyzed",  value: rowCount.toLocaleString(),label: "Total records"       },
          ].map((s, i) => (
            <div key={i} className="report-stat-card">
              <div className="report-stat-icon">{s.icon}</div>
              <div className="report-stat-content">
                <h3>{s.title}</h3>
                <p className="report-stat-number">{s.value}</p>
                <span className="report-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="reports-filters">
          {[["all","All Reports"],["popular","⭐ Popular"],["quality","📊 Quality"],
            ["profiling","📈 Profiling"],["issues","⚠️ Issues"]].map(([f, label]) => (
            <button key={f}
              className={`filter-btn-report ${filterType === f ? "active" : ""}`}
              onClick={() => setFilterType(f)}
            >{label}</button>
          ))}
        </div>

        {/* Reports grid */}
        <div className="available-reports-section">
          <h3>📋 Available Report Templates</h3>
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report.id}
                className={`report-card ${selectedReport === report.id ? "selected" : ""}`}
              >
                {report.popular && <span className="popular-badge">⭐ Popular</span>}
                <div className="report-card-header">
                  <span className="report-icon">{report.icon}</span>
                  <h4>{report.name}</h4>
                </div>
                <p className="report-description">{report.description}</p>
                <div className="report-includes">
                  <strong>Includes:</strong>
                  <ul>{report.includes.map((item, i) => <li key={i}>✓ {item}</li>)}</ul>
                </div>
                <div className="report-meta">
                  <div className="report-meta-item">
                    <span className="meta-label">Formats:</span>
                    <div className="format-badges">
                      {report.format.map((f, i) => <span key={i} className="format-badge">{f}</span>)}
                    </div>
                  </div>
                  <div className="report-meta-item">
                    <span className="meta-label">Size:</span>
                    <span className="meta-value">{report.size}</span>
                  </div>
                </div>

                <div className="report-actions">
                  {/* Custom report → directly open builder */}
                  {report.type === "custom" ? (
                    <button className="btn-generate"
                      onClick={() => { setShowCustom(true); setSelectedReport(null); }}
                    >⚙️ Open Custom Builder</button>
                  ) : (
                    <button className="btn-generate"
                      onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                    >{selectedReport === report.id ? "▲ Hide Options" : "Generate Report ▼"}</button>
                  )}
                </div>

                {/* Format picker — inline */}
                {selectedReport === report.id && report.type !== "custom" && (
                  <div className="format-selection">
                    <h5>📥 Select Download Format:</h5>
                    <div className="format-buttons">
                      {report.format.map((fmt, i) => {
                        const icons = { PDF: "📄", Excel: "📊", HTML: "🌐", CSV: "📋", PowerPoint: "📑" };
                        return (
                          <button key={i} className="btn-format"
                            onClick={() => { handleGenerateReport(report, fmt); setSelectedReport(null); }}
                          >
                            {icons[fmt] ?? "📄"} {fmt}
                          </button>
                        );
                      })}
                    </div>
                    <p className="format-hint">
                      💡 PDF opens print dialog &nbsp;|&nbsp; HTML & CSV download directly
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CUSTOM REPORT BUILDER ─────────────────────────────────────── */}
        {showCustom && (
          <div className="custom-report-overlay">
            <div className="custom-report-modal">
              <div className="custom-modal-header">
                <h3>⚙️ Custom Report Builder</h3>
                <button className="btn-close-custom" onClick={() => setShowCustom(false)}>✕</button>
              </div>

              {/* Title */}
              <div className="custom-field">
                <label>Report Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter report title..."
                  className="custom-title-input"
                />
              </div>

              {/* Section picker */}
              <div className="custom-field">
                <label>Select Sections to Include</label>
                <div className="custom-sections-grid">
                  {customSections.map((sec) => (
                    <div key={sec.id}
                      className={`custom-section-card ${sec.checked ? "checked" : ""}`}
                      onClick={() => toggleSection(sec.id)}
                    >
                      <div className="custom-section-check">
                        {sec.checked ? "✅" : "⬜"}
                      </div>
                      <div className="custom-section-info">
                        <span className="custom-section-label">{sec.label}</span>
                        <span className="custom-section-desc">{sec.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Format picker */}
              <div className="custom-field">
                <label>Output Format</label>
                <div className="custom-format-row">
                  {["HTML", "PDF", "CSV"].map((f) => (
                    <button key={f}
                      className={`btn-custom-fmt ${customFormat === f ? "active" : ""}`}
                      onClick={() => setCustomFormat(f)}
                    >
                      {f === "HTML" ? "🌐" : f === "PDF" ? "📄" : "📋"} {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-modal-footer">
                <span className="custom-selected-count">
                  {customSections.filter((s) => s.checked).length} sections selected
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-cancel-custom" onClick={() => setShowCustom(false)}>Cancel</button>
                  <button className="btn-generate-custom" onClick={handleCustomGenerate}>
                    ⚙️ Generate Custom Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="quick-actions-section">
          <h3>⚡ Quick Actions</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-card">
              <span className="quick-action-icon">📊</span>
              <h4>Generate Quality Summary</h4>
              <p>Quality score: {score}% — {issueCount} issues</p>
              <button className="btn-quick-action"
                onClick={() => handleGenerateReport(availableReports[0], "HTML")}
              >Generate Now</button>
            </div>
            <div className="quick-action-card">
              <span className="quick-action-icon">📧</span>
              <h4>Email Report</h4>
              <p>Send quality summary to stakeholders via email</p>
              <button className="btn-quick-action" onClick={handleEmailReport}>Send Email</button>
            </div>
            <div className="quick-action-card">
              <span className="quick-action-icon">⏰</span>
              <h4>Schedule Reports</h4>
              <p>Set up automatic report generation</p>
              <button className="btn-quick-action" onClick={handleSchedule}>Schedule</button>
            </div>
            <div className="quick-action-card">
              <span className="quick-action-icon">⚙️</span>
              <h4>Custom Report</h4>
              <p>Choose sections, title, and format yourself</p>
              <button className="btn-quick-action" onClick={() => setShowCustom(true)}>Customize</button>
            </div>
          </div>
        </div>

        {/* Generating modal */}
        {generatingReport && (
          <div className="generating-modal-overlay">
            <div className="generating-modal">
              <div className="generating-icon">📄</div>
              <h3>Generating {currentFormat} Report...</h3>
              <p>Compiling data from {datasetStats.fileName}</p>
              <div className="generation-progress-bar">
                <div className="generation-progress-fill"
                  style={{ width: `${generationProgress}%` }} />
              </div>
              <span className="generation-percentage">{Math.round(generationProgress)}%</span>
            </div>
          </div>
        )}

      </div>
    );
  }