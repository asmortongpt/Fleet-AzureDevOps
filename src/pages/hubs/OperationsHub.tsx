import React from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { GPSTracking } from "../../components/modules/GPSTracking";
import DispatchConsole from "../../components/DispatchConsole";
import { Notifications } from "../../components/modules/Notifications";

const OperationsHub: React.FC = () => {
  return (
    <HubLayout title="Operations">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", height: "100%", gap: 0 }}>
        <div style={{ minHeight: 0, position: "relative" }}>
          <GPSTracking />
        </div>
        <div style={{ borderLeft: "1px solid #1e232a", minHeight: 0, overflow: "auto", background: "#0b0f14" }}>
          <div style={{ padding: "12px" }}>
            <DispatchConsole />
          </div>
          <div style={{ padding: "12px", paddingTop: 0 }}>
            <Notifications />
          </div>
        </div>
      </div>
    </HubLayout>
  );
};


export default OperationsHub;
