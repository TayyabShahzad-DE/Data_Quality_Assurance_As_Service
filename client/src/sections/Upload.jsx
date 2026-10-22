import { useState, useRef } from "react";
import "../styles/upload.css";
import { parseCSV, profileDataset } from "../utils/fileProfiler";

export default function Upload({ onUploadSuccess }) {

  const [uploadedFile, setUploadedFile]     = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading]       = useState(false);
  const [uploadSuccess, setUploadSuccess]   = useState(false);
  const [filePreview, setFilePreview]       = useState(null);
  const [dragActive, setDragActive]         = useState(false);
  const [errorMsg, setErrorMsg]             = useState(null);
  const fileInputRef                        = useRef(null);

  const supportedFormats = [
    { name: "CSV",   icon: "📊", ext: ".csv" },
    { name: "Excel", icon: "📗", ext: ".xlsx, .xls" },
    { name: "JSON",  icon: "📄", ext: ".json" },
    { name: "XML",   icon: "📋", ext: ".xml" },
  ];

  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json",
    "text/xml",
    "application/xml",
  ];

  const processFile = async (file) => {
    setErrorMsg(null);

    const typeOk =
      validTypes.includes(file.type) ||
      file.name.match(/\.(csv|xlsx|xls|json|xml)$/i);

    if (!typeOk) {
      setErrorMsg("Invalid file type. Please upload CSV, Excel, JSON, or XML.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File too large. Maximum allowed size is 50 MB.");
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    let progressInterval;
    try {
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 15;
        });
      }, 100);

      let stats = null;

      // 1. Try uploading to backend API if it is running
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          stats = data.stats;
        }
      } catch (backendErr) {
        console.warn("Backend server not reachable, analyzing dataset directly in browser...", backendErr);
      }

      // 2. Fallback: Parse & profile directly in browser if backend is offline
      if (!stats) {
        if (file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") {
          const text = await file.text();
          const { headers, rows } = parseCSV(text);
          if (!headers || headers.length === 0 || !rows || rows.length === 0) {
            throw new Error("Could not parse records from CSV. Please check that the file is not empty.");
          }
          stats = profileDataset(rows, headers, file.name);
        } else if (file.name.toLowerCase().endsWith(".json") || file.type === "application/json") {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
          if (!rows || rows.length === 0) throw new Error("JSON file has no records.");
          const headers = Object.keys(rows[0]);
          stats = profileDataset(rows, headers, file.name);
        } else {
          throw new Error("Backend server is offline. Please upload a CSV or JSON file for in-browser processing.");
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      const preview = {
        name:         file.name,
        size:         (file.size / 1024).toFixed(2) + " KB",
        type:         file.type || file.name.split(".").pop().toUpperCase(),
        lastModified: new Date(file.lastModified).toLocaleDateString(),
        stats:        stats,
      };
      setFilePreview(preview);

      if (stats && onUploadSuccess) {
        onUploadSuccess({
          fileName:       file.name,
          fileSize:       preview.size,
          fileType:       preview.type,
          uploadDate:     new Date().toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric",
                          }),
          rows:           stats.rows           ?? 0,
          columns:        stats.columns        ?? 0,
          missing:        stats.missing        ?? 0,
          duplicates:     stats.duplicates     ?? 0,
          columnProfiles: stats.columnProfiles ?? [],
          rawRows:        stats.rawRows        ?? [],
          issues:         stats.issues         ?? [],
          cleaningRules:  stats.cleaningRules  ?? [],
          scoreData:      stats.scoreData      ?? null,
        });
      }

    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Upload failed. Please try again.");
      setUploadedFile(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

    const handleDrag = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
      else if (e.type === "dragleave") setDragActive(false);
    };
    const handleDrop = (e) => {
      e.preventDefault(); e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
    };
    const handleFileSelect = (e) => {
      if (e.target.files?.[0]) processFile(e.target.files[0]);
    };
    const handleReset = () => {
      setUploadedFile(null); setUploadProgress(0);
      setIsUploading(false); setUploadSuccess(false);
      setFilePreview(null);  setErrorMsg(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
      <div className="upload-container">

        <div className="upload-header">
          <h2>📂 Upload Your Dataset</h2>
          <p>Upload your data file to start quality analysis</p>
        </div>

        <div className="supported-formats">
          <h3>Supported Formats:</h3>
          <div className="formats-grid">
            {supportedFormats.map((format, index) => (
              <div key={index} className="format-badge">
                <span className="format-icon">{format.icon}</span>
                <div className="format-info">
                  <strong>{format.name}</strong>
                  <span>{format.ext}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="error-banner" role="alert">
            ❌ {errorMsg}
            <button className="error-dismiss" onClick={() => setErrorMsg(null)}>✕</button>
          </div>
        )}

        <div
          className={`upload-zone ${dragActive ? "drag-active" : ""} ${uploadSuccess ? "upload-complete" : ""}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag}
          onDragOver={handleDrag}  onDrop={handleDrop}
          onClick={() => !uploadSuccess && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef} type="file"
            onChange={handleFileSelect}
            accept=".csv,.xlsx,.xls,.json,.xml"
            style={{ display: "none" }}
          />

          {!uploadedFile && (
            <div className="upload-placeholder">
              <div className="upload-icon">📁</div>
              <h3>Drag &amp; Drop your file here</h3>
              <p>or click to browse</p>
              <div className="file-limits"><span>Maximum file size: 50 MB</span></div>
            </div>
          )}

          {uploadedFile && !uploadSuccess && (
            <div className="upload-progress-container">
              <div className="uploading-file-info">
                <span className="file-icon">📄</span>
                <div className="file-details">
                  <strong>{uploadedFile.name}</strong>
                  <span>{(uploadedFile.size / 1024).toFixed(2)} KB</span>
                </div>
              </div>
              <div className="progress-wrapper">
                <div className="progress-bar-upload">
                  <div className="progress-fill-upload" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="progress-text">{Math.round(uploadProgress)}%</span>
              </div>
              {isUploading && <p className="uploading-text">⏳ Uploading…</p>}
            </div>
          )}

          {uploadSuccess && filePreview && (
            <div className="upload-success-container">
              <div className="success-icon">✅</div>
              <h3>Upload Successful!</h3>
              <div className="file-preview-card">
                <div className="preview-row">
                  <span className="preview-label">File Name:</span>
                  <span className="preview-value">{filePreview.name}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">File Size:</span>
                  <span className="preview-value">{filePreview.size}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">File Type:</span>
                  <span className="preview-value">{filePreview.type}</span>
                </div>
                <div className="preview-row">
                  <span className="preview-label">Last Modified:</span>
                  <span className="preview-value">{filePreview.lastModified}</span>
                </div>
              </div>
              <button className="btn-new-upload" onClick={handleReset}>
                📤 Upload New File
              </button>
            </div>
          )}
        </div>

        <div className="upload-instructions">
          <h3>📋 Upload Guidelines:</h3>
          <ul>
            <li>✅ Ensure your data file is properly formatted</li>
            <li>✅ CSV files should have headers in the first row</li>
            <li>✅ Excel files should contain data in the first sheet</li>
            <li>✅ Remove any sensitive information before uploading</li>
            <li>✅ Maximum file size allowed is 50 MB</li>
          </ul>
        </div>

        {uploadSuccess && filePreview?.stats && (
          <div className="upload-stats">
            <h3>📊 Quick Statistics:</h3>
            <div className="stats-cards">
              <div className="stat-item">
                <span className="stat-icon">📈</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.rows ?? 0}</strong>
                  <p>Total Rows</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.columns ?? 0}</strong>
                  <p>Columns</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⚠️</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.missing ?? 0}</strong>
                  <p>Missing Values</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🔄</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.duplicates ?? 0}</strong>
                  <p>Duplicates</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⚠️</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.issues?.length ?? 0}</strong>
                  <p>Issues Found</p>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🧹</span>
                <div className="stat-content">
                  <strong>{filePreview.stats.cleaningRules?.length ?? 0}</strong>
                  <p>Cleaning Rules</p>
                </div>
              </div>
            </div>

            {/* ✅ FIX: rawRows status show karo debugging ke liye */}
            {filePreview.stats.rawRows?.length > 0 ? (
              <p style={{ textAlign: "center", color: "#10b981", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                ✅ {filePreview.stats.rawRows.length.toLocaleString()} rows ready for cleaning
              </p>
            ) : (
              <p style={{ textAlign: "center", color: "#ef4444", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                ⚠️ Raw data not available — cleaning download may not work
              </p>
            )}
          </div>
        )}

        {uploadSuccess && (
          <div className="next-steps">
            <h3>🎯 What's Next?</h3>
            <div className="steps-grid">
              <div className="step-card">
                <span className="step-number">1</span>
                <h4>Data Profiling</h4>
                <p>Analyze your data structure and patterns</p>
              </div>
              <div className="step-card">
                <span className="step-number">2</span>
                <h4>Issue Detection</h4>
                <p>Identify quality issues in your dataset</p>
              </div>
              <div className="step-card">
                <span className="step-number">3</span>
                <h4>Data Cleaning</h4>
                <p>Apply automated cleaning rules</p>
              </div>
              <div className="step-card">
                <span className="step-number">4</span>
                <h4>Quality Score</h4>
                <p>View your data quality score</p>
              </div>
            </div>
            <p style={{ textAlign: "center", color: "#10b981", marginTop: "1rem", fontWeight: 600 }}>
              ✅ Opening Profiling Analysis…
            </p>
          </div>
        )}

      </div>
    );
  }