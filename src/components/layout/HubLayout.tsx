import React from "react";

export const HubLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="hub-layout" style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100vh" }}>
    <header style={{
      padding: "12px 16px",
      borderBottom: "1px solid #1e232a",
      background: "#0b0f14",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#fff" }}>{title}</h1>
    </header>
    <main style={{ overflow: "auto", background: "#010409" }}>
      {children}
    </main>
  </div>
);
