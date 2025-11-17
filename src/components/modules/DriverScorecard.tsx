import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Trophy,
  TrendUp,
  TrendDown,
  Minus,
  Medal,
  Lightning,
  ShieldCheck,
  GasPump,
  CheckCircle,
  Target
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface LeaderboardEntry {
  rank: number
  driverId: string
  driverName: string
  overallScore: number
  safetyScore: number
  efficiencyScore: number
  complianceScore: number
  trend: 'improving' | 'stable' | 'declining'
  achievementCount: number
}

interface Achievement {
  id: string
  achievementName: string
  achievementDescription: string
  icon: string
  points: number
  earnedAt: string
}

interface ScoreHistory {
  period_start: string
  period_end: string
  overall_score: number
  safety_score: number
  efficiency_score: number
  compliance_score: number
  trend: string
  rank_position: number
}

export function DriverScorecard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedDriver, setSelectedDriver] = useState<LeaderboardEntry | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("leaderboard")

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get("/api/driver-scorecard/leaderboard")
      setLeaderboard(response)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      toast.error("Failed to load leaderboard")
    } finally {
      setLoading(false)
    }
  }

  const fetchDriverDetails = async (driver: LeaderboardEntry) => {
    try {
      setSelectedDriver(driver)
      setActiveTab("driver-detail")

      // Fetch achievements
      const achievementsResponse = await apiClient.get(
        `/api/driver-scorecard/driver/${driver.driverId}/achievements`
      )
      setAchievements(achievementsResponse)

      // Fetch score history
      const historyResponse = await apiClient.get(
        `/api/driver-scorecard/driver/${driver.driverId}/history`
      )
      setScoreHistory(historyResponse)
    } catch (error) {
      console.error("Error fetching driver details:", error)
      toast.error("Failed to load driver details")
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendUp className="h-4 w-4 text-green-500" weight="bold" />
    if (trend === 'declining') return <TrendDown className="h-4 w-4 text-red-500" weight="bold" />
    return <Minus className="h-4 w-4 text-gray-500" weight="bold" />
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-blue-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100"
    if (score >= 75) return "bg-blue-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getAchievementIcon = (icon: string) => {
    const iconMap: Record<string, any> = {
      'trophy': Trophy,
      'shield-check': ShieldCheck,
      'gas-pump': GasPump,
      'check-circle': CheckCircle,
      'lightning': Lightning,
      'medal': Medal
    }
    const IconComponent = iconMap[icon] || Trophy
    return <IconComponent className="h-6 w-6" weight="fill" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver scorecard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-600" weight="fill" />
          Driver Scorecard & Gamification
        </h1>
        <p className="text-gray-600 mt-2">
          Performance rankings, achievements, and driver engagement
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="driver-detail" disabled={!selectedDriver}>
            Driver Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* 2nd Place */}
              <Card className="border-2 border-gray-300">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-gray-400" weight="fill" />
                  </div>
                  <CardTitle className="text-lg">{leaderboard[1]?.driverName}</CardTitle>
                  <CardDescription>2nd Place</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(leaderboard[1]?.overallScore)}`}>
                    {leaderboard[1]?.overallScore.toFixed(1)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fetchDriverDetails(leaderboard[1])}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>

              {/* 1st Place */}
              <Card className="border-2 border-yellow-400 transform scale-105 shadow-lg">
                <CardHeader className="text-center pb-3 bg-gradient-to-b from-yellow-50 to-transparent">
                  <div className="flex justify-center mb-2">
                    <Trophy className="h-16 w-16 text-yellow-500" weight="fill" />
                  </div>
                  <CardTitle className="text-xl">{leaderboard[0]?.driverName}</CardTitle>
                  <CardDescription className="font-semibold">1st Place - Champion!</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(leaderboard[0]?.overallScore)}`}>
                    {leaderboard[0]?.overallScore.toFixed(1)}
                  </div>
                  <Badge className="mt-2" variant="default">Top Performer</Badge>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => fetchDriverDetails(leaderboard[0])}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>

              {/* 3rd Place */}
              <Card className="border-2 border-orange-300">
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-12 w-12 text-orange-600" weight="fill" />
                  </div>
                  <CardTitle className="text-lg">{leaderboard[2]?.driverName}</CardTitle>
                  <CardDescription>3rd Place</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(leaderboard[2]?.overallScore)}`}>
                    {leaderboard[2]?.overallScore.toFixed(1)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fetchDriverDetails(leaderboard[2])}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Full Rankings</CardTitle>
              <CardDescription>All driver performance scores</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Safety</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Achievements</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((driver) => (
                    <TableRow key={driver.driverId}>
                      <TableCell className="font-bold">#{driver.rank}</TableCell>
                      <TableCell className="font-medium">{driver.driverName}</TableCell>
                      <TableCell>
                        <Badge className={getScoreBgColor(driver.overallScore)}>
                          <span className={getScoreColor(driver.overallScore)}>
                            {driver.overallScore.toFixed(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>{driver.safetyScore.toFixed(1)}</TableCell>
                      <TableCell>{driver.efficiencyScore.toFixed(1)}</TableCell>
                      <TableCell>{driver.complianceScore.toFixed(1)}</TableCell>
                      <TableCell>{getTrendIcon(driver.trend)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{driver.achievementCount} badges</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchDriverDetails(driver)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver-detail" className="space-y-6">
          {selectedDriver && (
            <>
              {/* Driver Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedDriver.driverName}</CardTitle>
                      <CardDescription>Rank #{selectedDriver.rank} - Overall Score: {selectedDriver.overallScore.toFixed(1)}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(selectedDriver.trend)}
                      <span className="text-sm text-gray-600">
                        {selectedDriver.trend === 'improving' && 'Improving'}
                        {selectedDriver.trend === 'declining' && 'Declining'}
                        {selectedDriver.trend === 'stable' && 'Stable'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-600" weight="fill" />
                        <span className="text-sm font-medium">Safety</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedDriver.safetyScore.toFixed(1)}</div>
                      <Progress value={selectedDriver.safetyScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GasPump className="h-5 w-5 text-green-600" weight="fill" />
                        <span className="text-sm font-medium">Efficiency</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedDriver.efficiencyScore.toFixed(1)}</div>
                      <Progress value={selectedDriver.efficiencyScore} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-purple-600" weight="fill" />
                        <span className="text-sm font-medium">Compliance</span>
                      </div>
                      <div className="text-2xl font-bold">{selectedDriver.complianceScore.toFixed(1)}</div>
                      <Progress value={selectedDriver.complianceScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5" weight="fill" />
                    Achievements Earned
                  </CardTitle>
                  <CardDescription>Recognition badges and awards</CardDescription>
                </CardHeader>
                <CardContent>
                  {achievements.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {achievements.map((achievement) => (
                        <Card key={achievement.id} className="border-2">
                          <CardContent className="pt-6 text-center">
                            <div className="flex justify-center mb-3 text-yellow-600">
                              {getAchievementIcon(achievement.icon)}
                            </div>
                            <div className="font-semibold text-sm mb-1">
                              {achievement.achievementName}
                            </div>
                            <div className="text-xs text-gray-600 mb-2">
                              {achievement.achievementDescription}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {achievement.points} points
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No achievements earned yet</p>
                      <p className="text-sm">Keep improving to unlock badges!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Score History */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Score trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoreHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Overall</TableHead>
                          <TableHead>Safety</TableHead>
                          <TableHead>Efficiency</TableHead>
                          <TableHead>Compliance</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Trend</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scoreHistory.map((period, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {new Date(period.period_end).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={getScoreBgColor(parseFloat(period.overall_score))}>
                                <span className={getScoreColor(parseFloat(period.overall_score))}>
                                  {parseFloat(period.overall_score).toFixed(1)}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell>{parseFloat(period.safety_score).toFixed(1)}</TableCell>
                            <TableCell>{parseFloat(period.efficiency_score).toFixed(1)}</TableCell>
                            <TableCell>{parseFloat(period.compliance_score).toFixed(1)}</TableCell>
                            <TableCell>#{period.rank_position}</TableCell>
                            <TableCell>{getTrendIcon(period.trend)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No historical data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
