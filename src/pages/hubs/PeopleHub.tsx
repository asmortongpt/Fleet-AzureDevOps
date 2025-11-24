import React from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { DriverPerformance } from "../../components/modules/DriverPerformance";

const PeopleHub: React.FC = () => {
  return (
    <HubLayout title="People">
      <div style={{ display: "grid", gridTemplateColumns: "1fr", height: "100%" }}>
        <div style={{ overflow: "auto", padding: "16px" }}>
          <DriverPerformance />
        </div>
      </div>
    </HubLayout>
  );
};


export default PeopleHub;
