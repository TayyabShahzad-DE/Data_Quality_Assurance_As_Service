import "../styles/sidebar.css";
import {
  MdDashboard,
  MdUploadFile,
  MdBarChart,
  MdWarningAmber,
  MdCleaningServices,
  MdTrendingUp,
  MdDescription,
} from "react-icons/md";

const sections = [
  {
    label: "MAIN",
    items: [
      { key: "dashboard", icon: <MdDashboard />,       label: "Dashboard" },
      { key: "upload",    icon: <MdUploadFile />,       label: "Upload"    },
      { key: "profiling", icon: <MdBarChart />,         label: "Profiling" },
      { key: "issues",    icon: <MdWarningAmber />,     label: "Issues"    },
      { key: "cleaning",  icon: <MdCleaningServices />, label: "Cleaning"  },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { key: "score",   icon: <MdTrendingUp />,  label: "Score"   },
      { key: "reports", icon: <MdDescription />, label: "Reports" },
    ],
  },
];

export default function Sidebar({ setSection, section }) {
  return (
    <div className="sidebar">

      {/* ── Brand — always visible at top ── */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <MdBarChart />
        </div>
        <span className="sidebar-brand-name">DQAAS</span>
        <span className="sidebar-brand-badge">Pro</span>
      </div>

      {/* ── Scrollable area — nav lives here ── */}
      <div className="sidebar-scroll-area">
        <nav className="sidebar-nav">
          {sections.map((sec, si) => (
            <div key={si}>
              <p className="sidebar-nav-label">{sec.label}</p>

              {sec.items.map((item) => (
                <div
                  key={item.key}
                  className={`sidebar-item${section === item.key ? " active" : ""}`}
                  onClick={() => setSection(item.key)}
                  title={item.label}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </div>
              ))}

              {si < sections.length - 1 && (
                <div className="sidebar-divider" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* ── Footer — always visible at bottom ── */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">AU</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Admin User</span>
            <span className="sidebar-user-role">Data Analyst</span>
          </div>
        </div>
      </div>

    </div>
  );
}