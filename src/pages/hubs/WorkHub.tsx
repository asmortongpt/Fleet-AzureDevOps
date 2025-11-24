import React from "react";
import { HubLayout } from "../../components/layout/HubLayout";

const WorkHub: React.FC = () => {
  return (
    <HubLayout title="Work">
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#0b0f14", border: "1px solid #1e232a", borderRadius: 8, padding: 16, textAlign: "center", color: "#8b949e" }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#fff" }}>Work Management</h3>
          <p style={{ margin: 0 }}>Routes, trips, and task management. Use the inspect system for detailed information.</p>
        </div>
      </div>
    </HubLayout>
  );
};


export default WorkHub;
