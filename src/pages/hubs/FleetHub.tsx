import React from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { FleetDashboard } from "../../components/modules/FleetDashboard";
import { VehicleTelemetry } from "../../components/modules/VehicleTelemetry";

const FleetHub: React.FC = () => {
  return (
    <HubLayout title="Fleet">
      <div style={{ display: "grid", gridTemplateColumns: "450px 1fr", height: "100%", gap: 0 }}>
        <div style={{ borderRight: "1px solid #1e232a", overflow: "auto", background: "#0b0f14" }}>
          <FleetDashboard />
        </div>
        <div style={{ overflow: "auto", padding: "16px" }}>
          <VehicleTelemetry />
        </div>
      </div>
    </HubLayout>
  );
};


export default FleetHub;
