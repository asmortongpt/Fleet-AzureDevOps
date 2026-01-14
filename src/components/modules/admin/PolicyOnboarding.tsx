import {
  Brain,
  CheckCircle,
  AlertTriangle,
  Shield,
  Wrench,
  Truck,
  Users,
  Building,
  FileText,
  Sparkles,
  Target,
  ArrowRight,
  Play,
  Lightbulb,
  Clock,
  DollarSign,
  Zap
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePolicies } from "@/contexts/PolicyContext"
import {
  createAIPolicyGenerator,
  type OrganizationProfile,
  type PolicyRecommendation,
  type GapAnalysis,
  type BottleneckAnalysis
} from "@/lib/policy-engine/ai-policy-generator"
import { cn } from "@/lib/utils"

type OnboardingStep = 'profile' | 'analysis' | 'recommendations' | 'implementation'

const VEHICLE_TYPES = [
  'Sedan',
  'SUV',
  'Truck',
  'Van',
  'Electric',
  'Hybrid',
  'Heavy Equipment',
  'Motorcycle',
  'Bus'
]

const OPERATION_TYPES = [
  'Delivery',
  'Passenger Transport',
  'Construction',
  'Logistics',
  'Emergency Services',
  'Government',
  'Healthcare',
  'Field Services'
]

const INDUSTRY_VERTICALS = [
  'Logistics & Transportation',
  'Healthcare',
  'Government',
  'Construction',
  'Utilities',
  'Emergency Services',
  'Education',
  'Retail',
  'Manufacturing'
]

const COMPLIANCE_REQUIREMENTS = [
  'OSHA',
  'DOT',
  'EPA',
  'FMCSA',
  'NHTSA',
  'ISO 9001',
  'ISO 14001',
  'Local Regulations'
]

const CURRENT_CHALLENGES = [
  'High maintenance costs',
  'Driver safety incidents',
  'Fuel inefficiency',
  'Routing inefficiency',
  'Compliance violations',
  'Maintenance delays',
  'Vehicle downtime',
  'Emissions concerns',
  'Driver retention',
  'Budget overruns'
]

const GEOGRAPHIC_SCOPES = [
  'Local (city/county)',
  'Regional (state)',
  'National',
  'International'
]

export function PolicyOnboarding() {
  const { createPolicy } = usePolicies()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [aiGenerator] = useState(() => createAIPolicyGenerator())

  // Organization Profile State
  const [profile, setProfile] = useState<Partial<OrganizationProfile>>({
    fleetSize: 0,
    vehicleTypes: [],
    operationTypes: [],
    geographicScope: '',
    industryVertical: '',
    complianceRequirements: [],
    currentChallenges: [],
    safetyPriorities: [],
    staffing: {
      drivers: 0,
      mechanics: 0,
      dispatchers: 0,
      supervisors: 0
    }
  })

  // Analysis Results State
  const [analysisText, setAnalysisText] = useState('')
  const [recommendations, setRecommendations] = useState<PolicyRecommendation[]>([])
  const [gaps, setGaps] = useState<GapAnalysis[]>([])
  const [bottlenecks, setBottlenecks] = useState<BottleneckAnalysis[]>([])
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<number>>(new Set())

  const updateProfile = (updates: Partial<OrganizationProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const isProfileComplete = () => {
    return (
      profile.fleetSize! > 0 &&
      profile.vehicleTypes!.length > 0 &&
      profile.operationTypes!.length > 0 &&
      profile.industryVertical &&
      profile.geographicScope &&
      profile.staffing!.drivers > 0
    )
  }

  const runAnalysis = async () => {
    if (!isProfileComplete()) {
      toast.error('Please complete all required fields')
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progressive analysis
      setAnalysisProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 1: Onboarding
      setAnalysisProgress(25)
      const onboardingResult = await aiGenerator.conductOnboarding(profile as OrganizationProfile)
      setAnalysisText(onboardingResult.analysis)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 2: Generate recommendations
      setAnalysisProgress(50)
      const policyRecs = await aiGenerator.generatePolicyRecommendations()
      setRecommendations(policyRecs)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 3: Identify gaps
      setAnalysisProgress(75)
      const gapAnalysis = await aiGenerator.identifyGaps()
      setGaps(gapAnalysis)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Step 4: Analyze bottlenecks
      setAnalysisProgress(90)
      const bottleneckAnalysis = await aiGenerator.analyzeBottlenecks()
      setBottlenecks(bottleneckAnalysis)
      await new Promise(resolve => setTimeout(resolve, 300))

      setAnalysisProgress(100)
      setCurrentStep('analysis')
      toast.success('AI Analysis Complete!')
    } catch (error) {
      toast.error('Analysis failed. Please try again.')
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const implementSelectedPolicies = async () => {
    if (selectedRecommendations.size === 0) {
      toast.error('Please select at least one policy to implement')
      return
    }

    const selectedRecs = recommendations.filter((_, idx) => selectedRecommendations.has(idx))

    try {
      for (const rec of selectedRecs) {
        await createPolicy(rec.policy as any)
      }

      toast.success(`Successfully implemented ${selectedRecommendations.size} policies!`)
      setCurrentStep('implementation')
    } catch (error) {
      toast.error('Failed to implement policies')
      console.error('Implementation error:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-800 bg-blue-50 border-blue-200'
      default: return 'text-slate-700 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI-Powered Policy Onboarding
              </h1>
              <p className="text-slate-700">
                Intelligent policy generation based on your fleet operations
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['profile', 'analysis', 'recommendations', 'implementation'].map((step, idx, arr) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                      currentStep === step
                        ? "bg-blue-500 border-blue-500 text-white"
                        : arr.indexOf(currentStep) > idx
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    )}
                  >
                    {arr.indexOf(currentStep) > idx ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium mt-2 capitalize">
                    {step.replace('-', ' ')}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 -mt-7 transition-all",
                      arr.indexOf(currentStep) > idx ? "bg-green-500" : "bg-gray-300"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        {currentStep === 'profile' && (
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>
                Tell us about your fleet to receive personalized policy recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Fleet Basics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-800" />
                  Fleet Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fleetSize">Fleet Size *</Label>
                    <Input
                      id="fleetSize"
                      type="number"
                      min="1"
                      placeholder="Number of vehicles"
                      value={profile.fleetSize || ''}
                      onChange={(e) => updateProfile({ fleetSize: parseInt(e.target.value) || 0 })}
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industryVertical">Industry *</Label>
                    <select
                      id="industryVertical"
                      className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                      value={profile.industryVertical || ''}
                      onChange={(e) => updateProfile({ industryVertical: e.target.value })}
                    >
                      <option value="">Select industry...</option>
                      {INDUSTRY_VERTICALS.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="geographicScope">Geographic Scope *</Label>
                    <select
                      id="geographicScope"
                      className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                      value={profile.geographicScope || ''}
                      onChange={(e) => updateProfile({ geographicScope: e.target.value })}
                    >
                      <option value="">Select scope...</option>
                      {GEOGRAPHIC_SCOPES.map(scope => (
                        <option key={scope} value={scope}>{scope}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Vehicle Types */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-800" />
                  Vehicle Types *
                </h3>
                <div className="flex flex-wrap gap-2">
                  {VEHICLE_TYPES.map(type => (
                    <Badge
                      key={type}
                      variant={profile.vehicleTypes?.includes(type) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => updateProfile({
                        vehicleTypes: toggleArrayItem(profile.vehicleTypes || [], type)
                      })}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Operation Types */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-800" />
                  Operation Types *
                </h3>
                <div className="flex flex-wrap gap-2">
                  {OPERATION_TYPES.map(type => (
                    <Badge
                      key={type}
                      variant={profile.operationTypes?.includes(type) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => updateProfile({
                        operationTypes: toggleArrayItem(profile.operationTypes || [], type)
                      })}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Compliance Requirements */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-800" />
                  Compliance Requirements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {COMPLIANCE_REQUIREMENTS.map(req => (
                    <Badge
                      key={req}
                      variant={profile.complianceRequirements?.includes(req) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => updateProfile({
                        complianceRequirements: toggleArrayItem(profile.complianceRequirements || [], req)
                      })}
                    >
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Current Challenges */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-800" />
                  Current Challenges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CURRENT_CHALLENGES.map(challenge => (
                    <Badge
                      key={challenge}
                      variant={profile.currentChallenges?.includes(challenge) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => updateProfile({
                        currentChallenges: toggleArrayItem(profile.currentChallenges || [], challenge)
                      })}
                    >
                      {challenge}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Staffing */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-800" />
                  Staffing Information *
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drivers">Drivers</Label>
                    <Input
                      id="drivers"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={profile.staffing?.drivers || ''}
                      onChange={(e) => updateProfile({
                        staffing: { ...profile.staffing!, drivers: parseInt(e.target.value) || 0 }
                      })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mechanics">Mechanics</Label>
                    <Input
                      id="mechanics"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={profile.staffing?.mechanics || ''}
                      onChange={(e) => updateProfile({
                        staffing: { ...profile.staffing!, mechanics: parseInt(e.target.value) || 0 }
                      })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dispatchers">Dispatchers</Label>
                    <Input
                      id="dispatchers"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={profile.staffing?.dispatchers || ''}
                      onChange={(e) => updateProfile({
                        staffing: { ...profile.staffing!, dispatchers: parseInt(e.target.value) || 0 }
                      })}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisors">Supervisors</Label>
                    <Input
                      id="supervisors"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={profile.staffing?.supervisors || ''}
                      onChange={(e) => updateProfile({
                        staffing: { ...profile.staffing!, supervisors: parseInt(e.target.value) || 0 }
                      })}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={runAnalysis}
                  disabled={!isProfileComplete() || isAnalyzing}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Run AI Analysis
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Analysis Progress</span>
                    <span className="font-medium text-blue-800">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            {/* AI Analysis Overview */}
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Comprehensive analysis of your fleet operations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border">
                  {analysisText}
                </pre>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700 mb-1">Recommendations</p>
                      <p className="text-3xl font-bold text-blue-800">{recommendations.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-800" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700 mb-1">Gaps Identified</p>
                      <p className="text-3xl font-bold text-orange-600">{gaps.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700 mb-1">Bottlenecks</p>
                      <p className="text-3xl font-bold text-red-600">{bottlenecks.length}</p>
                    </div>
                    <Wrench className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-700 mb-1">Est. Savings</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${recommendations.reduce((sum, r) => sum + (r.estimatedImpact.costSavings || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for detailed analysis */}
            <Tabs defaultValue="gaps" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gaps" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Gap Analysis
                </TabsTrigger>
                <TabsTrigger value="bottlenecks" className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Bottleneck Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gaps" className="space-y-4 mt-6">
                {gaps.map((gap, idx) => (
                  <Card key={idx} className={cn("border-2", getSeverityColor(gap.severity))}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{gap.category}</CardTitle>
                          <CardDescription className="mt-1">
                            <span className="font-medium">Gap:</span> {gap.gap}
                          </CardDescription>
                        </div>
                        <Badge className={getPriorityColor(gap.severity)}>
                          {gap.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Current State</p>
                          <p className="text-sm text-slate-700">{gap.currentState}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Desired State</p>
                          <p className="text-sm text-slate-700">{gap.desiredState}</p>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {gap.recommendations.map((rec, recIdx) => (
                            <li key={recIdx} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="bottlenecks" className="space-y-4 mt-6">
                {bottlenecks.map((bottleneck, idx) => (
                  <Card key={idx} className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-red-600" />
                            {bottleneck.process}
                          </CardTitle>
                          <CardDescription className="mt-1 text-red-700">
                            <span className="font-medium">Bottleneck:</span> {bottleneck.bottleneck}
                          </CardDescription>
                        </div>
                        <Badge className="bg-red-500">
                          {bottleneck.estimatedImprovement}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Impact</p>
                        <p className="text-sm text-slate-700">{bottleneck.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Root Cause</p>
                        <p className="text-sm text-slate-700">{bottleneck.rootCause}</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Solutions:</p>
                        <ul className="space-y-1">
                          {bottleneck.solutions.map((solution, solIdx) => (
                            <li key={solIdx} className="flex items-start gap-2 text-sm text-slate-700">
                              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep('recommendations')}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                View Policy Recommendations
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'recommendations' && (
          <div className="space-y-6">
            <Card className="border-2 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI-Generated Policy Recommendations
                    </CardTitle>
                    <CardDescription>
                      Select policies to implement in your fleet management system
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {selectedRecommendations.size} of {recommendations.length} selected
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Policy Cards */}
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((rec, idx) => (
                <Card
                  key={idx}
                  className={cn(
                    "border-2 transition-all cursor-pointer hover:shadow-lg",
                    selectedRecommendations.has(idx)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  )}
                  onClick={() => {
                    const newSelected = new Set(selectedRecommendations)
                    if (newSelected.has(idx)) {
                      newSelected.delete(idx)
                    } else {
                      newSelected.add(idx)
                    }
                    setSelectedRecommendations(newSelected)
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
                        selectedRecommendations.has(idx)
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-gray-300"
                      )}>
                        {selectedRecommendations.has(idx) && (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl">{rec.policy.name}</CardTitle>
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">
                          {rec.policy.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rationale */}
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        Rationale
                      </p>
                      <p className="text-sm text-slate-700">{rec.rationale}</p>
                    </div>

                    {/* Estimated Impact */}
                    <div className="grid grid-cols-3 gap-4">
                      {rec.estimatedImpact.costSavings !== undefined && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <p className="text-xs font-medium text-green-700">Cost Savings</p>
                          </div>
                          <p className="text-lg font-bold text-green-700">
                            ${rec.estimatedImpact.costSavings.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {rec.estimatedImpact.safetyImprovement !== undefined && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-blue-800" />
                            <p className="text-xs font-medium text-blue-700">Safety Improvement</p>
                          </div>
                          <p className="text-lg font-bold text-blue-700">
                            +{rec.estimatedImpact.safetyImprovement}%
                          </p>
                        </div>
                      )}
                      {rec.estimatedImpact.efficiencyGain !== undefined && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-purple-600" />
                            <p className="text-xs font-medium text-purple-700">Efficiency Gain</p>
                          </div>
                          <p className="text-lg font-bold text-purple-700">
                            +{rec.estimatedImpact.efficiencyGain}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Implementation Steps */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        Implementation Steps
                      </p>
                      <ol className="space-y-1">
                        {rec.implementationSteps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-medium text-gray-500 flex-shrink-0">
                              {stepIdx + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Best Practice Source */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-slate-700">
                        <span className="font-medium">Source:</span> {rec.bestPracticeSource}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('analysis')}
                size="lg"
              >
                Back to Analysis
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRecommendations(new Set(recommendations.map((_, idx) => idx)))}
                  size="lg"
                >
                  Select All
                </Button>
                <Button
                  onClick={implementSelectedPolicies}
                  disabled={selectedRecommendations.size === 0}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Implement {selectedRecommendations.size} {selectedRecommendations.size === 1 ? 'Policy' : 'Policies'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'implementation' && (
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Implementation Complete!
              </CardTitle>
              <CardDescription>
                Your AI-generated policies have been successfully deployed
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedRecommendations.size} {selectedRecommendations.size === 1 ? 'Policy' : 'Policies'} Activated
                </h3>
                <p className="text-slate-700">
                  Your fleet management system is now protected by AI-powered intelligent policies
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-slate-700 mb-1">Total Est. Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${recommendations
                      .filter((_, idx) => selectedRecommendations.has(idx))
                      .reduce((sum, r) => sum + (r.estimatedImpact.costSavings || 0), 0)
                      .toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-700 mb-1">Avg Safety Improvement</p>
                  <p className="text-2xl font-bold text-blue-800">
                    +{Math.round(
                      recommendations
                        .filter((_, idx) => selectedRecommendations.has(idx))
                        .reduce((sum, r) => sum + (r.estimatedImpact.safetyImprovement || 0), 0) /
                      selectedRecommendations.size
                    )}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-slate-700 mb-1">Avg Efficiency Gain</p>
                  <p className="text-2xl font-bold text-purple-600">
                    +{Math.round(
                      recommendations
                        .filter((_, idx) => selectedRecommendations.has(idx))
                        .reduce((sum, r) => sum + (r.estimatedImpact.efficiencyGain || 0), 0) /
                      selectedRecommendations.size
                    )}%
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Next Steps:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Monitor Policy Performance</p>
                      <p className="text-xs text-slate-700">View real-time execution metrics</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Configure Notifications</p>
                      <p className="text-xs text-slate-700">Set up alerts and approvals</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Train Your Team</p>
                      <p className="text-xs text-slate-700">Share policy documentation</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3">
                    <div className="text-left">
                      <p className="font-medium">Review & Refine</p>
                      <p className="text-xs text-slate-700">Adjust based on results</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('profile')
                    setSelectedRecommendations(new Set())
                    setRecommendations([])
                    setGaps([])
                    setBottlenecks([])
                  }}
                  size="lg"
                >
                  Start New Analysis
                </Button>
                <Button
                  onClick={() => window.location.href = '#/policy-management'}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  Go to Policy Engine
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
