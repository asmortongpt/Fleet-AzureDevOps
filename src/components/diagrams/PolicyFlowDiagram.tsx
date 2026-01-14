import {
  Play,
  Pause,
  ArrowsClockwise,
  Info,
  CheckCircle,
  Clock
} from "@phosphor-icons/react"
import mermaid from "mermaid"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PolicyFlowNode {
  id: string
  label: string
  type: "action" | "decision" | "process" | "database" | "approval"
  color: string
}

const POLICY_FLOW_NODES: PolicyFlowNode[] = [
  { id: "user_action", label: "User Action Initiated", type: "action", color: "#3b82f6" },
  { id: "policy_check", label: "Policy Engine Check", type: "decision", color: "#8b5cf6" },
  { id: "monitor_mode", label: "Monitor Mode", type: "process", color: "#06b6d4" },
  { id: "human_loop", label: "Human-in-Loop", type: "approval", color: "#f59e0b" },
  { id: "autonomous", label: "Autonomous Mode", type: "process", color: "#10b981" },
  { id: "db_log", label: "Database Log", type: "database", color: "#6366f1" },
  { id: "approval_check", label: "Approval Required?", type: "decision", color: "#f59e0b" },
  { id: "mfa_check", label: "MFA Verification", type: "approval", color: "#ef4444" },
  { id: "dual_control", label: "Dual Control Check", type: "approval", color: "#ec4899" },
  { id: "execute", label: "Execute Action", type: "process", color: "#10b981" },
  { id: "notify", label: "Notify Stakeholders", type: "action", color: "#3b82f6" },
  { id: "audit", label: "Audit Trail", type: "database", color: "#6366f1" }
]

export function PolicyFlowDiagram() {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedNode, setSelectedNode] = useState<PolicyFlowNode | null>(null)
  const [flowMode, setFlowMode] = useState<"monitor" | "human-in-loop" | "autonomous">("monitor")

  // Initialize Mermaid
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
        fontSize: "14px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 80,
        useMaxWidth: true
      },
      securityLevel: "loose"
    })
  }, [])

  // Generate Mermaid diagram based on flow mode
  useEffect(() => {
    const generateDiagram = () => {
      const diagrams = {
        monitor: `
flowchart TB
    START([User Action Initiated]):::action --> POLICY{Policy Engine<br/>Check}:::decision
    POLICY --> MONITOR[Monitor Mode<br/>Log Only]:::monitor
    MONITOR --> DB[(Database Log)]:::database
    DB --> NOTIFY[Notify Stakeholders]:::action
    NOTIFY --> AUDIT[(Audit Trail)]:::database
    AUDIT --> END([Complete]):::action

    classDef action fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decision fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef monitor fill:#06b6d4,stroke:#0891b2,stroke-width:2px,color:#fff
    classDef database fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
`,
        "human-in-loop": `
flowchart TB
    START([User Action Initiated]):::action --> POLICY{Policy Engine<br/>Check}:::decision
    POLICY --> HUMAN[Human-in-Loop Mode]:::humanloop
    HUMAN --> APPROVAL{Approval<br/>Required?}:::decision
    APPROVAL -->|Yes| MFA{MFA<br/>Verification?}:::approval
    APPROVAL -->|No| EXECUTE
    MFA -->|Yes| MFACHECK[Multi-Factor Auth]:::approval
    MFA -->|No| DUAL
    MFACHECK --> DUAL{Dual Control<br/>Required?}:::approval
    DUAL -->|Yes| DUAL2[Second Approver]:::approval
    DUAL -->|No| EXECUTE[Execute Action]:::execute
    DUAL2 --> EXECUTE
    EXECUTE --> DB[(Database Update)]:::database
    DB --> NOTIFY[Notify Stakeholders]:::action
    NOTIFY --> AUDIT[(Audit Trail)]:::database
    AUDIT --> END([Complete]):::action

    classDef action fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decision fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef humanloop fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef approval fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    classDef execute fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef database fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
`,
        autonomous: `
flowchart TB
    START([User Action Initiated]):::action --> POLICY{Policy Engine<br/>Check}:::decision
    POLICY --> CONFIDENCE{Confidence<br/>Score ≥ 85%?}:::decision
    CONFIDENCE -->|Yes| AUTO[Autonomous Mode<br/>Auto-Execute]:::autonomous
    CONFIDENCE -->|No| FALLBACK[Fallback to<br/>Human-in-Loop]:::humanloop
    AUTO --> EXECUTE[Execute Action]:::execute
    FALLBACK --> APPROVAL[Request Approval]:::approval
    APPROVAL --> EXECUTE
    EXECUTE --> VALIDATE{Action<br/>Successful?}:::decision
    VALIDATE -->|Yes| DB[(Database Update)]:::database
    VALIDATE -->|No| ERROR[Log Error]:::error
    ERROR --> ROLLBACK[Rollback Changes]:::error
    ROLLBACK --> NOTIFY
    DB --> NOTIFY[Notify Stakeholders]:::action
    NOTIFY --> AUDIT[(Audit Trail)]:::database
    AUDIT --> LEARN[ML Model Learning]:::autonomous
    LEARN --> END([Complete]):::action

    classDef action fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decision fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef autonomous fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef humanloop fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef approval fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    classDef execute fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    classDef database fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    classDef error fill:#dc2626,stroke:#b91c1c,stroke-width:2px,color:#fff
`
      }

      return diagrams[flowMode]
    }

    if (mermaidRef.current) {
      const diagram = generateDiagram()
      mermaidRef.current.innerHTML = `<div class="mermaid">${diagram}</div>`

      mermaid.run({
        nodes: mermaidRef.current.querySelectorAll(".mermaid")
      }).catch(error => {
        console.error("Mermaid rendering error:", error)
      })
    }
  }, [flowMode])

  const handlePlayAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 5000)
  }

  const getFlowModeInfo = () => {
    const info = {
      monitor: {
        title: "Monitor Mode",
        description: "Logs policy violations without taking action. Ideal for testing and observing patterns.",
        icon: <Info className="w-4 h-4" />,
        color: "bg-cyan-100 text-cyan-700"
      },
      "human-in-loop": {
        title: "Human-in-Loop Mode",
        description: "Requires human approval before executing actions. Provides safety controls with MFA and dual control options.",
        icon: <Clock className="w-4 h-4" />,
        color: "bg-amber-100 text-amber-700"
      },
      autonomous: {
        title: "Autonomous Mode",
        description: "Automatically executes actions when confidence score is high enough. Includes ML learning feedback loop.",
        icon: <CheckCircle className="w-4 h-4" />,
        color: "bg-emerald-100 text-emerald-700"
      }
    }
    return info[flowMode]
  }

  const modeInfo = getFlowModeInfo()

  return (
    <div className="space-y-2">
      {/* Mode Selector */}
      <div className="flex gap-3">
        <Button
          variant={flowMode === "monitor" ? "default" : "outline"}
          onClick={() => setFlowMode("monitor")}
          className="flex-1"
        >
          <Info className="w-4 h-4 mr-2" />
          Monitor Mode
        </Button>
        <Button
          variant={flowMode === "human-in-loop" ? "default" : "outline"}
          onClick={() => setFlowMode("human-in-loop")}
          className="flex-1"
        >
          <Clock className="w-4 h-4 mr-2" />
          Human-in-Loop
        </Button>
        <Button
          variant={flowMode === "autonomous" ? "default" : "outline"}
          onClick={() => setFlowMode("autonomous")}
          className="flex-1"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Autonomous
        </Button>
      </div>

      {/* Mode Information Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={modeInfo.color} variant="secondary">
                {modeInfo.icon}
                <span className="ml-2">{modeInfo.title}</span>
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayAnimation}
                disabled={isAnimating}
              >
                {isAnimating ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Animating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Simulate Flow
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <ArrowsClockwise className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{modeInfo.description}</p>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Lifecycle Flow</CardTitle>
          <CardDescription>
            Complete policy execution path from user action to audit trail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mermaidRef}
            className={`w-full overflow-x-auto ${isAnimating ? "animate-pulse" : ""}`}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Flow Elements Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">User Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-sm">Decision Points</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-cyan-500" />
              <span className="text-sm">Monitor Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">Approval Steps</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm">Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-500" />
              <span className="text-sm">Database Operations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Statistics */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {flowMode === "monitor" ? "120ms" : flowMode === "human-in-loop" ? "2.5min" : "450ms"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-green-600">
              {flowMode === "monitor" ? "100%" : flowMode === "human-in-loop" ? "97.8%" : "99.2%"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Steps in Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {flowMode === "monitor" ? "6" : flowMode === "human-in-loop" ? "12" : "14"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Intervention Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-amber-600">
              {flowMode === "monitor" ? "0%" : flowMode === "human-in-loop" ? "100%" : "2.3%"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
