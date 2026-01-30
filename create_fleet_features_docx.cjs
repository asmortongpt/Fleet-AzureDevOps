const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, 
        VerticalAlign, LevelFormat, PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

const CTA_DAYTIME = "2B3A67";
const CTA_BLUE_SKIES = "00D4FF";
const CTA_NOON = "FF5722";
const CTA_GOLDEN_HOUR = "FDB813";
const GREEN = "C6EFCE";
const YELLOW = "FFEB9C";
const RED = "FFC7CE";
const GRAY = "F2F2F2";

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const featuresData = [
  ["Authentication & User Management", "1.1", "User Authentication", "COMPLETE", "8", "401 errors when API not running"],
  ["Authentication & User Management", "1.2", "User Profile Management", "COMPLETE", "7", ""],
  ["Authentication & User Management", "1.3", "Role-Based Access Control (RBAC)", "COMPLETE", "5", ""],
  ["Vehicle Management", "2.1", "Vehicle Inventory", "COMPLETE", "16", "3D models partial"],
  ["Vehicle Management", "2.2", "Vehicle Assignment", "COMPLETE", "9", ""],
  ["Vehicle Management", "2.3", "Vehicle Location Tracking", "COMPLETE", "9", ""],
  ["Vehicle Management", "2.4", "Vehicle Inspections", "COMPLETE", "10", ""],
  ["Vehicle Management", "2.5", "Vehicle History & Lifecycle", "COMPLETE", "10", ""],
  ["Driver Management", "3.1", "Driver Profiles", "COMPLETE", "10", ""],
  ["Driver Management", "3.2", "Driver Safety Scoring", "COMPLETE", "10", ""],
  ["Driver Management", "3.3", "Driver Trip Logging", "COMPLETE", "10", ""],
  ["Driver Management", "3.4", "Driver Certification Management", "COMPLETE", "10", ""],
  ["Maintenance & Work Orders", "4.1", "Preventive Maintenance Scheduling", "COMPLETE", "10", ""],
  ["Maintenance & Work Orders", "4.2", "Work Order Management", "COMPLETE", "12", ""],
  ["Maintenance & Work Orders", "4.3", "Parts Inventory Management", "PARTIAL", "10", "Barcode scanning partial"],
  ["Maintenance & Work Orders", "4.4", "Predictive Maintenance (AI-Powered)", "COMPLETE", "9", ""],
  ["Fuel Management", "5.1", "Fuel Transaction Tracking", "COMPLETE", "9", ""],
  ["Fuel Management", "5.2", "Fuel Analytics & Optimization", "COMPLETE", "10", ""],
  ["Fuel Management", "5.3", "Fuel Card Management", "PARTIAL", "8", "Only WEX integrated"],
  ["Telematics & GPS Tracking", "6.1", "Real-Time Vehicle Tracking", "COMPLETE", "10", ""],
  ["Telematics & GPS Tracking", "6.2", "Geofence Management & Alerts", "COMPLETE", "9", ""],
  ["Telematics & GPS Tracking", "6.3", "OBD2 Diagnostics", "COMPLETE", "10", ""],
  ["Telematics & GPS Tracking", "6.4", "Driver Behavior Monitoring", "COMPLETE", "12", ""],
  ["Telematics & GPS Tracking", "6.5", "Idle Time Monitoring", "COMPLETE", "9", ""],
  ["Dispatch & Routing", "7.1", "Manual Dispatch", "COMPLETE", "10", ""],
  ["Dispatch & Routing", "7.2", "AI-Powered Dispatch Optimization", "COMPLETE", "10", ""],
  ["Dispatch & Routing", "7.3", "Route Optimization", "COMPLETE", "11", ""],
  ["Dispatch & Routing", "7.4", "Scheduling & Calendar", "COMPLETE", "10", ""],
  ["Safety & Compliance", "8.1", "Incident & Accident Reporting", "COMPLETE", "10", ""],
  ["Safety & Compliance", "8.2", "Safety Alerts & Notifications", "COMPLETE", "10", ""],
  ["Safety & Compliance", "8.3", "Compliance Management", "COMPLETE", "11", ""],
  ["Safety & Compliance", "8.4", "Drug & Alcohol Testing Program", "PARTIAL", "10", "Clearinghouse incomplete"],
  ["Safety & Compliance", "8.5", "Hours of Service (HOS) Tracking", "INCOMPLETE", "10", "CRITICAL: Full HOS/ELD not implemented"],
  ["Damage Reporting & 3D Visualization", "9.1", "Damage Reporting", "COMPLETE", "10", ""],
  ["Damage Reporting & 3D Visualization", "9.2", "3D Vehicle Damage Visualization", "PARTIAL", "8", "TripoSR incomplete"],
  ["Damage Reporting & 3D Visualization", "9.3", "AI Damage Assessment", "PARTIAL", "8", "AI accuracy needs improvement"],
  ["Cost Analytics & Financial Management", "10.1", "Total Cost of Ownership (TCO)", "COMPLETE", "10", ""],
  ["Cost Analytics & Financial Management", "10.2", "Budget Management", "COMPLETE", "9", ""],
  ["Cost Analytics & Financial Management", "10.3", "Invoice & Billing Management", "COMPLETE", "10", ""],
  ["Cost Analytics & Financial Management", "10.4", "Reimbursement Processing", "COMPLETE", "10", ""],
  ["Document Management", "11.1", "Document Storage & Organization", "COMPLETE", "10", ""],
  ["Document Management", "11.2", "Full-Text Search & OCR", "COMPLETE", "8", ""],
  ["Document Management", "11.3", "Document AI & Automation", "COMPLETE", "8", ""],
  ["Communication & Notifications", "12.1", "In-App Messaging", "COMPLETE", "10", ""],
  ["Communication & Notifications", "12.2", "Notifications System", "COMPLETE", "10", ""],
  ["Communication & Notifications", "12.3", "Broadcast Messaging", "COMPLETE", "8", ""],
  ["Reporting & Analytics", "13.1", "Standard Reports", "COMPLETE", "7", ""],
  ["Reporting & Analytics", "13.2", "Custom Report Builder", "COMPLETE", "10", ""],
  ["Reporting & Analytics", "13.3", "Analytics Dashboards", "COMPLETE", "10", ""],
  ["Reporting & Analytics", "13.4", "Predictive Analytics & Forecasting", "COMPLETE", "10", ""],
  ["Mobile Application", "14.1", "Mobile App - Driver Features", "PARTIAL", "12", "Feature parity needed"],
  ["Mobile Application", "14.2", "Mobile App - Manager Features", "PARTIAL", "10", "Manager features incomplete"],
  ["Admin & Configuration", "15.1", "System Configuration", "COMPLETE", "12", ""],
  ["Admin & Configuration", "15.2", "User Management", "COMPLETE", "10", ""],
  ["Admin & Configuration", "15.3", "Module Administration", "COMPLETE", "8", ""],
  ["Integrations", "16.1", "Telematics Provider Integrations", "PARTIAL", "10", "Only Samsara/Smartcar"],
  ["Integrations", "16.2", "Cloud Platform Integrations", "COMPLETE", "10", ""],
  ["Integrations", "16.3", "Accounting System Integration", "INCOMPLETE", "10", "CRITICAL: No accounting integrations"],
  ["AI & Automation", "17.1", "AI Agents (104+ Agents)", "COMPLETE", "11", ""],
  ["AI & Automation", "17.2", "LangChain AI Orchestration", "COMPLETE", "10", ""],
  ["AI & Automation", "17.3", "AI-Powered Insights", "COMPLETE", "10", ""],
  ["Electric Vehicle Management", "18.1", "EV Charging Management", "COMPLETE", "10", ""],
  ["Electric Vehicle Management", "18.2", "EV Fleet Analytics", "PARTIAL", "9", "Advanced analytics needed"],
  ["Asset Management", "19.1", "Non-Vehicle Asset Tracking", "COMPLETE", "11", ""],
  ["Security & Compliance", "20.1", "Security Features", "COMPLETE", "12", ""],
  ["Security & Compliance", "20.2", "Compliance Features", "COMPLETE", "10", ""]
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: CTA_DAYTIME, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal",
        run: { size: 32, bold: true, color: CTA_DAYTIME, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal",
        run: { size: 28, bold: true, color: CTA_DAYTIME, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      // Title Page
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Fleet Management System")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 },
        children: [new TextRun({ text: "Complete Feature List", size: 36, bold: true, color: CTA_NOON })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: "Capital Technology Alliance", size: 28, color: CTA_BLUE_SKIES, bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Intelligent Technology. Integrated Partnership.", size: 22, italics: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360 },
        children: [new TextRun({ text: "January 30, 2026", size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 480 },
        children: [new TextRun({ text: "62 Features | 20 Modules | 76% Complete", size: 22, bold: true, color: CTA_GOLDEN_HOUR })] }),
      
      // Page Break
      new Paragraph({ children: [new PageBreak()] }),
      
      // Table of Contents
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
      new Paragraph({ children: [new PageBreak()] }),
      
      // Executive Summary
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
      new Paragraph({ children: [new TextRun({ text: "Feature Status Breakdown", bold: true, size: 24 })] }),
      new Paragraph({ spacing: { before: 120 }, children: [
        new TextRun("✅ Complete: 47 features (76%)")
      ]}),
      new Paragraph({ children: [new TextRun("🟡 Partial: 11 features (18%)")] }),
      new Paragraph({ children: [new TextRun("🔴 Incomplete: 2 features (3%)")] }),
      new Paragraph({ spacing: { after: 240 }, children: [new TextRun("🔧 Needs Fix: 2 features (3%)")] }),
      
      new Paragraph({ children: [new TextRun({ text: "System Scale", bold: true, size: 24 })] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Frontend Pages: 46+")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("React Components: 659")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("API Endpoints: 166")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Backend Services: 187")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Database Tables: 230+")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("AI Agents: 104+")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun("Code Lines: ~83,000")] }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // Complete Feature List
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Complete Feature List")] }),
      
      // Create table
      new Table({
        columnWidths: [2800, 600, 3200, 900, 800, 1060],
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2800, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Module", bold: true, color: "FFFFFF", size: 20 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 600, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "ID", bold: true, color: "FFFFFF", size: 20 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 3200, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Feature Name", bold: true, color: "FFFFFF", size: 20 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 900, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF", size: 20 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 800, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Sub-Features", bold: true, color: "FFFFFF", size: 20 })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1060, type: WidthType.DXA },
                shading: { fill: CTA_DAYTIME, type: ShadingType.CLEAR },
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Known Issues", bold: true, color: "FFFFFF", size: 20 })] })]
              })
            ]
          }),
          ...featuresData.map(row => {
            let fillColor = GREEN;
            if (row[3] === "PARTIAL") fillColor = YELLOW;
            else if (row[3] === "INCOMPLETE") fillColor = RED;
            
            return new TableRow({
              children: [
                new TableCell({ borders: cellBorders, width: { size: 2800, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: row[0], size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 600, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row[1], size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 3200, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: row[2], size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 900, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row[3], size: 18, bold: true })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 800, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: row[4], size: 18 })] })] }),
                new TableCell({ borders: cellBorders, width: { size: 1060, type: WidthType.DXA },
                  shading: { fill: fillColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: row[5], size: 18 })] })] })
              ]
            });
          })
        ]
      }),
      
      new Paragraph({ children: [new PageBreak()] }),
      
      // Critical Issues
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Critical Issues")] }),
      new Paragraph({ spacing: { before: 120, after: 240 },
        children: [new TextRun({ text: "The following issues require immediate attention before production deployment:", size: 22 })] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Incomplete Features (Must Implement)")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "8.5 Hours of Service (HOS) Tracking", bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 120, left: 1080 },
        children: [new TextRun("ELD integration required for commercial fleet compliance. Timeline: 3-4 weeks")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "16.3 Accounting System Integration", bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 240, left: 1080 },
        children: [new TextRun("QuickBooks/SAP integration needed. Timeline: 2-3 weeks")] }),
      
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("High Priority Fixes")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Backend API Connectivity", bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 120, left: 1080 },
        children: [new TextRun("401/404 errors when API not running. Timeline: 3-4 days")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Console.log Cleanup", bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 120, left: 1080 },
        children: [new TextRun("Security risk from data exposure. Timeline: 1 day")] }),
      new Paragraph({ numbering: { reference: "bullet-list", level: 0 },
        children: [new TextRun({ text: "Error Boundaries", bold: true })] }),
      new Paragraph({ spacing: { before: 0, after: 240, left: 1080 },
        children: [new TextRun("Some pages missing error boundaries. Timeline: 2 days")] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/andrewmorton/Documents/GitHub/Fleet-CTA/Fleet_Complete_Feature_List.docx", buffer);
  console.log("Word document created successfully!");
});
