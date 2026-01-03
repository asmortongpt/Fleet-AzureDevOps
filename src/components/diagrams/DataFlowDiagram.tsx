import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  ArrowsClockwise,
  CloudArrowDown,
  Database,
  Cpu,
  CheckCircle,
  Warning,
  Lightning,
  ChartLine
} from "@phosphor-icons/react"
import mermaid from "mermaid"

interface DataFlowMetric {
  label: string
  value: string | number
  trend?: "up" | "down" | "stable"
  color: string
}

interface FlowStep {
  id: string
  label: string
  status: "idle" | "processing" | "complete" | "error"
  duration: number
}

export function DataFlowDiagram() {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [flowSpeed, setFlowSpeed] = useState(1000) // ms per step
  const animationInterval = useRef<NodeJS.Timeout | null>(null)

  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([
    { id: "frontend", label: "Frontend Request", status: "idle", duration: 45 },
    { id: "api", label: "API Gateway", status: "idle", duration: 15 },
    { id: "auth", label: "Authentication", status: "idle", duration: 85 },
    { id: "policy", label: "Policy Engine", status: "idle", duration: 120 },
    { id: "database", label: "Database Query", status: "idle", duration: 95 },
    { id: "decision", label: "AI Decision", status: "idle", duration: 250 },
    { id: "execution", label: "Execute Action", status: "idle", duration: 180 },
    { id: "response", label: "Response Sent", status: "idle", duration: 30 }
  ])

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
        fontSize: "13px",
        fontFamily: "Inter, system-ui, sans-serif"
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        padding: 15,
        nodeSpacing: 60,
        rankSpacing: 80,
        useMaxWidth: true
      },
      securityLevel: "loose"
    })
  }, [])

  useEffect(() => {
    const diagram = `
flowchart LR
    subgraph Frontend["🖥️ Frontend Layer"]
        UI[User Interface]
        STATE[State Management]
        CACHE[Local Cache]
    end

    subgraph API["🌐 API Gateway"]
        ROUTE[Route Handler]
        VALIDATE[Request Validation]
        RATELIMIT[Rate Limiter]
    end

    subgraph Auth["🔐 Authentication"]
        JWT[JWT Verification]
        RBAC[RBAC Check]
        TENANT[Tenant Isolation]
    end

    subgraph PolicyEngine["🤖 Policy Engine"]
        LOAD[Load Policies]
        EVALUATE[Evaluate Rules]
        CONFIDENCE[Confidence Score]
        MODE{Execution Mode?}
    end

    subgraph Database["💾 Database Layer"]
        QUERY[SQL Query]
        RLS[Row-Level Security]
        INDEXES[Index Scan]
        RESULT[Result Set]
    end

    subgraph AI["🧠 AI Decision Layer"]
        PREDICT[ML Prediction]
        CONTEXT[Context Analysis]
        RECOMMENDATION[Generate Recommendation]
    end

    subgraph Execution["⚡ Execution Layer"]
        MONITOR[Monitor & Log]
        HUMAN[Human Approval]
        AUTO[Auto Execute]
        AUDIT[Audit Trail]
    end

    UI --> ROUTE
    STATE --> ROUTE
    CACHE -.-> ROUTE

    ROUTE --> VALIDATE
    VALIDATE --> RATELIMIT
    RATELIMIT --> JWT

    JWT --> RBAC
    RBAC --> TENANT
    TENANT --> LOAD

    LOAD --> EVALUATE
    EVALUATE --> CONFIDENCE
    CONFIDENCE --> MODE

    MODE -->|Monitor| MONITOR
    MODE -->|Human-in-Loop| HUMAN
    MODE -->|Autonomous| AUTO

    EVALUATE --> QUERY
    QUERY --> RLS
    RLS --> INDEXES
    INDEXES --> RESULT

    RESULT --> PREDICT
    PREDICT --> CONTEXT
    CONTEXT --> RECOMMENDATION

    RECOMMENDATION --> MODE

    MONITOR --> AUDIT
    HUMAN --> AUDIT
    AUTO --> AUDIT

    AUDIT -.->|Response| UI
    AUDIT --> QUERY

    classDef frontend fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef api fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    classDef auth fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    classDef policy fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef database fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff
    classDef ai fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    classDef execution fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff

    class UI,STATE,CACHE frontend
    class ROUTE,VALIDATE,RATELIMIT api
    class JWT,RBAC,TENANT auth
    class LOAD,EVALUATE,CONFIDENCE,MODE policy
    class QUERY,RLS,INDEXES,RESULT database
    class PREDICT,CONTEXT,RECOMMENDATION ai
    class MONITOR,HUMAN,AUTO,AUDIT execution
`

    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = `<div class="mermaid">${diagram}</div>`

      mermaid.run({
        nodes: mermaidRef.current.querySelectorAll(".mermaid")
      }).catch(error => {
        console.error("Mermaid rendering error:", error)
      })
    }
  }, [])

  const handlePlayAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false)
      if (animationInterval.current) {
        clearInterval(animationInterval.current)
      }
      setCurrentStep(0)
      setFlowSteps(steps =>
        steps.map(step => ({ ...step, status: "idle" as const }))
      )
      return
    }

    setIsAnimating(true)
    setCurrentStep(0)

    let step = 0
    animationInterval.current = setInterval(() => {
      if (step >= flowSteps.length) {
        setIsAnimating(false)
        if (animationInterval.current) {
          clearInterval(animationInterval.current)
        }
        setTimeout(() => {
          setCurrentStep(0)
          setFlowSteps(steps =>
            steps.map(s => ({ ...s, status: "idle" as const }))
          )
        }, 2000)
        return
      }

      setFlowSteps(steps =>
        steps.map((s, i) => {
          if (i < step) return { ...s, status: "complete" as const }
          if (i === step) return { ...s, status: "processing" as const }
          return { ...s, status: "idle" as const }
        })
      )

      setCurrentStep(step)
      step++
    }, flowSpeed)
  }

  useEffect(() => {
    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current)
      }
    }
  }, [])

  const metrics: DataFlowMetric[] = [
    { label: "Avg Latency", value: "245ms", trend: "down", color: "text-green-600" },
    { label: "Throughput", value: "1,234/min", trend: "up", color: "text-blue-600" },
    { label: "Success Rate", value: "99.7%", trend: "stable", color: "text-emerald-600" },
    { label: "Policy Checks", value: "45,678", trend: "up", color: "text-purple-600" }
  ]

  const integrationPoints = [
    {
      name: "Azure AD OAuth",
      status: "active",
      latency: "45ms",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      name: "PostgreSQL Database",
      status: "active",
      latency: "12ms",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      name: "Redis Cache",
      status: "active",
      latency: "3ms",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      name: "Claude AI API",
      status: "active",
      latency: "850ms",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      name: "Audit Logger",
      status: "active",
      latency: "8ms",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    }
  ]

  const getStepIcon = (status: FlowStep["status"]) => {
    switch (status) {
      case "processing":
        return <Lightning className="w-4 h-4 text-blue-500 animate-pulse" />
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <Warning className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    }
  }

  const totalDuration = flowSteps.reduce((sum, step) => sum + step.duration, 0)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Button onClick={handlePlayAnimation}>
            {isAnimating ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Animation
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
            onClick={() => window.location.reload()}
          >
            <ArrowsClockwise className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Animation Speed:</span>
          <select
            value={flowSpeed}
            onChange={e => setFlowSpeed(Number(e.target.value))}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value={500}>Fast (0.5s)</option>
            <option value={1000}>Normal (1s)</option>
            <option value={2000}>Slow (2s)</option>
          </select>
        </div>
      </div>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(metric => (
          <Card key={metric.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              {metric.trend && (
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === "up" && <ChartLine className="w-3 h-3 text-green-500" />}
                  {metric.trend === "down" && <ChartLine className="w-3 h-3 text-red-500 rotate-180" />}
                  <span className="text-xs text-muted-foreground">
                    {metric.trend === "up" ? "Increasing" : metric.trend === "down" ? "Decreasing" : "Stable"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Data Flow Architecture</CardTitle>
          <CardDescription>
            Real-time visualization of data flow from frontend to database through policy engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mermaidRef}
            className={`w-full overflow-x-auto ${isAnimating ? "animate-pulse" : ""}`}
          />
        </CardContent>
      </Card>

      {/* Flow Steps Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Execution Timeline</CardTitle>
          <CardDescription>
            Step-by-step breakdown of request processing ({totalDuration}ms total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="w-8 text-center">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      step.status === "processing" ? "text-blue-600" :
                      step.status === "complete" ? "text-green-600" :
                      "text-gray-600"
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.duration}ms</span>
                  </div>
                  <Progress
                    value={
                      step.status === "complete" ? 100 :
                      step.status === "processing" ? 50 :
                      0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Integration Points Status</CardTitle>
          <CardDescription>
            Real-time health monitoring of external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {integrationPoints.map(point => (
              <div
                key={point.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {point.icon}
                  <span className="text-sm font-medium">{point.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    {point.latency}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 text-xs"
                  >
                    {point.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layer Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Architecture Layers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">Frontend Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500" />
              <span className="text-sm">API Gateway</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm">Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">Policy Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-500" />
              <span className="text-sm">Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-pink-500" />
              <span className="text-sm">AI Decision</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm">Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Data Store</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
