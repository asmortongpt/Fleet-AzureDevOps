import {
  Database,
  Table as TableIcon,
  GitBranch,
  MagnifyingGlass,
  ArrowsClockwise,
  Key,
  Link as LinkIcon
} from "@phosphor-icons/react"
import mermaid from "mermaid"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TableInfo {
  name: string
  description: string
  fields: { name: string; type: string; isPK?: boolean; isFK?: boolean }[]
  relationships: string[]
}

const POLICY_TABLES: Record<string, TableInfo> = {
  policies: {
    name: "policies",
    description: "Core policy definitions with AI execution modes",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "name", type: "VARCHAR(255)" },
      { name: "type", type: "ENUM" },
      { name: "mode", type: "ENUM" },
      { name: "status", type: "ENUM" },
      { name: "confidence_score", type: "DECIMAL" },
      { name: "requires_dual_control", type: "BOOLEAN" },
      { name: "requires_mfa", type: "BOOLEAN" },
      { name: "conditions", type: "JSONB" },
      { name: "actions", type: "JSONB" },
      { name: "created_at", type: "TIMESTAMP" },
      { name: "updated_at", type: "TIMESTAMP" }
    ],
    relationships: ["policy_executions", "policy_violations", "policy_approvals", "vehicles", "drivers"]
  },
  policy_executions: {
    name: "policy_executions",
    description: "Log of all policy execution attempts",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "policy_id", type: "UUID", isFK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "executed_at", type: "TIMESTAMP" },
      { name: "execution_mode", type: "ENUM" },
      { name: "success", type: "BOOLEAN" },
      { name: "confidence_score", type: "DECIMAL" },
      { name: "context_data", type: "JSONB" },
      { name: "executed_by", type: "UUID", isFK: true }
    ],
    relationships: ["policies", "users", "audit_trail"]
  },
  policy_violations: {
    name: "policy_violations",
    description: "Tracked policy violations with severity",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "policy_id", type: "UUID", isFK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "vehicle_id", type: "UUID", isFK: true },
      { name: "driver_id", type: "UUID", isFK: true },
      { name: "severity", type: "ENUM" },
      { name: "description", type: "TEXT" },
      { name: "resolved", type: "BOOLEAN" },
      { name: "detected_at", type: "TIMESTAMP" },
      { name: "resolved_at", type: "TIMESTAMP" }
    ],
    relationships: ["policies", "vehicles", "drivers", "incidents"]
  },
  policy_approvals: {
    name: "policy_approvals",
    description: "Human-in-loop approval tracking",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "policy_id", type: "UUID", isFK: true },
      { name: "execution_id", type: "UUID", isFK: true },
      { name: "approver_id", type: "UUID", isFK: true },
      { name: "secondary_approver_id", type: "UUID", isFK: true },
      { name: "approval_status", type: "ENUM" },
      { name: "mfa_verified", type: "BOOLEAN" },
      { name: "approved_at", type: "TIMESTAMP" },
      { name: "comments", type: "TEXT" }
    ],
    relationships: ["policies", "policy_executions", "users"]
  },
  vehicles: {
    name: "vehicles",
    description: "Fleet vehicles subject to policies",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "vin", type: "VARCHAR(17)" },
      { name: "make", type: "VARCHAR(100)" },
      { name: "model", type: "VARCHAR(100)" },
      { name: "year", type: "INTEGER" },
      { name: "status", type: "ENUM" }
    ],
    relationships: ["policy_violations", "maintenance_records", "work_orders", "telematics_data"]
  },
  drivers: {
    name: "drivers",
    description: "Drivers subject to behavior and safety policies",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "name", type: "VARCHAR(255)" },
      { name: "license_number", type: "VARCHAR(50)" },
      { name: "license_expiry", type: "DATE" },
      { name: "status", type: "ENUM" }
    ],
    relationships: ["policy_violations", "incidents", "trips", "training_records"]
  },
  maintenance_records: {
    name: "maintenance_records",
    description: "Vehicle maintenance subject to compliance policies",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "vehicle_id", type: "UUID", isFK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "service_type", type: "VARCHAR(100)" },
      { name: "completed_at", type: "TIMESTAMP" },
      { name: "next_due", type: "DATE" }
    ],
    relationships: ["vehicles", "work_orders"]
  },
  incidents: {
    name: "incidents",
    description: "Safety incidents triggering policy enforcement",
    fields: [
      { name: "id", type: "UUID", isPK: true },
      { name: "tenant_id", type: "UUID", isFK: true },
      { name: "vehicle_id", type: "UUID", isFK: true },
      { name: "driver_id", type: "UUID", isFK: true },
      { name: "incident_type", type: "ENUM" },
      { name: "severity", type: "ENUM" },
      { name: "occurred_at", type: "TIMESTAMP" }
    ],
    relationships: ["vehicles", "drivers", "policy_violations"]
  }
}

export function DatabaseRelationshipDiagram() {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"full" | "core" | "execution">("core")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "base",
      themeVariables: {
        primaryColor: "#3b82f6",
        primaryTextColor: "#fff",
        primaryBorderColor: "#2563eb",
        lineColor: "#94a3b8",
        secondaryColor: "#8b5cf6",
        tertiaryColor: "#10b981",
        fontSize: "12px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      er: {
        layoutDirection: "TB",
        useMaxWidth: true
      },
      securityLevel: "loose"
    })
  }, [])

  useEffect(() => {
    const generateERDiagram = () => {
      const diagrams = {
        core: `
erDiagram
    POLICIES ||--o{ POLICY_EXECUTIONS : "has"
    POLICIES ||--o{ POLICY_VIOLATIONS : "detects"
    POLICIES ||--o{ POLICY_APPROVALS : "requires"
    POLICY_EXECUTIONS ||--o{ POLICY_APPROVALS : "triggers"
    VEHICLES ||--o{ POLICY_VIOLATIONS : "subject_to"
    DRIVERS ||--o{ POLICY_VIOLATIONS : "subject_to"

    POLICIES {
        uuid id PK
        uuid tenant_id FK
        varchar name
        enum type
        enum mode
        enum status
        decimal confidence_score
        boolean requires_dual_control
        boolean requires_mfa
        jsonb conditions
        jsonb actions
        timestamp created_at
    }

    POLICY_EXECUTIONS {
        uuid id PK
        uuid policy_id FK
        uuid tenant_id FK
        timestamp executed_at
        enum execution_mode
        boolean success
        decimal confidence_score
        jsonb context_data
        uuid executed_by FK
    }

    POLICY_VIOLATIONS {
        uuid id PK
        uuid policy_id FK
        uuid tenant_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        enum severity
        text description
        boolean resolved
        timestamp detected_at
    }

    POLICY_APPROVALS {
        uuid id PK
        uuid policy_id FK
        uuid execution_id FK
        uuid approver_id FK
        uuid secondary_approver_id FK
        enum approval_status
        boolean mfa_verified
        timestamp approved_at
    }

    VEHICLES {
        uuid id PK
        uuid tenant_id FK
        varchar vin
        varchar make
        varchar model
        integer year
    }

    DRIVERS {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar license_number
        date license_expiry
    }
`,
        full: `
erDiagram
    POLICIES ||--o{ POLICY_EXECUTIONS : "has"
    POLICIES ||--o{ POLICY_VIOLATIONS : "detects"
    POLICIES ||--o{ POLICY_APPROVALS : "requires"
    POLICY_EXECUTIONS ||--o{ POLICY_APPROVALS : "triggers"
    VEHICLES ||--o{ POLICY_VIOLATIONS : "subject_to"
    VEHICLES ||--o{ MAINTENANCE_RECORDS : "has"
    VEHICLES ||--o{ WORK_ORDERS : "has"
    DRIVERS ||--o{ POLICY_VIOLATIONS : "subject_to"
    DRIVERS ||--o{ INCIDENTS : "involved_in"
    POLICY_VIOLATIONS ||--o{ INCIDENTS : "triggers"
    MAINTENANCE_RECORDS ||--o{ WORK_ORDERS : "generates"

    POLICIES {
        uuid id PK
        uuid tenant_id FK
        varchar name
        enum type
        enum mode
        enum status
        decimal confidence_score
        boolean requires_dual_control
        boolean requires_mfa
        jsonb conditions
        jsonb actions
    }

    POLICY_EXECUTIONS {
        uuid id PK
        uuid policy_id FK
        uuid tenant_id FK
        timestamp executed_at
        enum execution_mode
        boolean success
        decimal confidence_score
    }

    POLICY_VIOLATIONS {
        uuid id PK
        uuid policy_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        enum severity
        boolean resolved
    }

    POLICY_APPROVALS {
        uuid id PK
        uuid policy_id FK
        uuid execution_id FK
        uuid approver_id FK
        enum approval_status
        boolean mfa_verified
    }

    VEHICLES {
        uuid id PK
        uuid tenant_id FK
        varchar vin
        varchar make
        varchar model
    }

    DRIVERS {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar license_number
    }

    MAINTENANCE_RECORDS {
        uuid id PK
        uuid vehicle_id FK
        varchar service_type
        timestamp completed_at
    }

    WORK_ORDERS {
        uuid id PK
        uuid vehicle_id FK
        enum status
        timestamp created_at
    }

    INCIDENTS {
        uuid id PK
        uuid vehicle_id FK
        uuid driver_id FK
        enum incident_type
        enum severity
    }
`,
        execution: `
erDiagram
    POLICIES ||--o{ POLICY_EXECUTIONS : "initiates"
    POLICY_EXECUTIONS ||--|| AUDIT_TRAIL : "logs_to"
    POLICY_EXECUTIONS ||--o{ POLICY_APPROVALS : "requires"
    POLICY_APPROVALS ||--|| USERS : "approved_by"
    POLICY_APPROVALS ||--o| USERS : "dual_control"
    USERS ||--o{ POLICY_EXECUTIONS : "executes"

    POLICIES {
        uuid id PK
        varchar name
        enum mode
        decimal confidence_score
        boolean requires_dual_control
        boolean requires_mfa
    }

    POLICY_EXECUTIONS {
        uuid id PK
        uuid policy_id FK
        timestamp executed_at
        enum execution_mode
        boolean success
        decimal confidence_score
        uuid executed_by FK
    }

    POLICY_APPROVALS {
        uuid id PK
        uuid execution_id FK
        uuid approver_id FK
        uuid secondary_approver_id FK
        enum approval_status
        boolean mfa_verified
        timestamp approved_at
        text comments
    }

    USERS {
        uuid id PK
        varchar email
        varchar name
        jsonb roles
    }

    AUDIT_TRAIL {
        uuid id PK
        uuid execution_id FK
        timestamp logged_at
        jsonb changes
        varchar action_type
    }
`
      }

      return diagrams[viewMode]
    }

    if (mermaidRef.current) {
      const diagram = generateERDiagram()
      mermaidRef.current.innerHTML = `<div class="mermaid">${diagram}</div>`

      mermaid.run({
        nodes: mermaidRef.current.querySelectorAll(".mermaid")
      }).catch(error => {
        console.error("Mermaid rendering error:", error)
      })
    }
  }, [viewMode])

  const filteredTables = Object.entries(POLICY_TABLES).filter(([name, info]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    info.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* View Mode Selector */}
      <div className="flex gap-3">
        <Button
          variant={viewMode === "core" ? "default" : "outline"}
          onClick={() => setViewMode("core")}
          className="flex-1"
        >
          <Database className="w-4 h-4 mr-2" />
          Core Tables
        </Button>
        <Button
          variant={viewMode === "execution" ? "default" : "outline"}
          onClick={() => setViewMode("execution")}
          className="flex-1"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          Execution Flow
        </Button>
        <Button
          variant={viewMode === "full" ? "default" : "outline"}
          onClick={() => setViewMode("full")}
          className="flex-1"
        >
          <TableIcon className="w-4 h-4 mr-2" />
          Full Schema
        </Button>
      </div>

      {/* ER Diagram */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database Relationship Diagram</CardTitle>
              <CardDescription>
                Interactive Entity-Relationship diagram showing policy table connections
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <ArrowsClockwise className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={mermaidRef} className="w-full overflow-x-auto" />
        </CardContent>
      </Card>

      {/* Table Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Table Schema Details</CardTitle>
          <div className="relative mt-2">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={Object.keys(POLICY_TABLES)[0]} className="w-full">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8">
              {filteredTables.map(([name]) => (
                <TabsTrigger key={name} value={name} className="text-xs">
                  {name.split("_").slice(0, 2).join("_")}
                </TabsTrigger>
              ))}
            </TabsList>
            {filteredTables.map(([name, info]) => (
              <TabsContent key={name} value={name} className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{info.name}</h3>
                    <Badge variant="outline">
                      <TableIcon className="w-3 h-3 mr-1" />
                      {info.fields.length} fields
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Field Name</th>
                        <th className="px-4 py-2 text-left font-medium">Data Type</th>
                        <th className="px-4 py-2 text-left font-medium">Constraints</th>
                      </tr>
                    </thead>
                    <tbody>
                      {info.fields.map(field => (
                        <tr key={field.name} className="border-t">
                          <td className="px-4 py-2 font-mono text-xs">{field.name}</td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {field.type}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              {field.isPK && (
                                <Badge variant="default" className="text-xs">
                                  <Key className="w-3 h-3 mr-1" />
                                  PK
                                </Badge>
                              )}
                              {field.isFK && (
                                <Badge variant="outline" className="text-xs">
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  FK
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Relationships</h4>
                  <div className="flex flex-wrap gap-2">
                    {info.relationships.map(rel => (
                      <Badge key={rel} variant="outline" className="text-xs">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        {rel}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Database Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(POLICY_TABLES).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">
              {Object.values(POLICY_TABLES).reduce((sum, t) => sum + t.relationships.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(POLICY_TABLES).reduce((sum, t) => sum + t.fields.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Foreign Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {Object.values(POLICY_TABLES).reduce(
                (sum, t) => sum + t.fields.filter(f => f.isFK).length,
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
