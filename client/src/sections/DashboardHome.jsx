export default function DashboardHome() {
    return (
      <div>
        <h2>Dashboard Overview</h2>
  
        <div style={{display:"flex", gap:"20px"}}>
          <div className="card">Total Rows: 1000</div>
          <div className="card">Missing: 50</div>
          <div className="card">Duplicates: 20</div>
          <div className="card">Score: 85%</div>
        </div>
      </div>
    );
  }