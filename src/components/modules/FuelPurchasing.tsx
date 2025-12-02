import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GasPump,
  MapPin,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Lightbulb,
  ChartLine,
  Bell,
  FileText,
  Target,
  ArrowRight,
  CheckCircle,
  Warning,
  CalendarBlank
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

interface FuelStation {
  id: string
  stationName: string
  brand: string
  address: string
  city: string
  state: string
  lat: number
  lng: number
  fuelTypes: string[]
  acceptsFleetCards: boolean
  fleetCardBrands: string[]
  has24HourAccess: boolean
  hasTruckAccess: boolean
  rating: number
  distance: number
  currentPrices: { [key: string]: number }
}

interface PriceForecast {
  date: string
  predictedPrice: number
  confidenceIntervalLow: number
  confidenceIntervalHigh: number
  confidenceScore: number
}

interface PurchaseRecommendation {
  recommendation: 'buy_now' | 'wait' | 'monitor'
  confidence: number
  reasoning: string
  expectedSavings: number
  optimalPurchaseDate: string
  currentPrice: number
  forecastedPrice: number
}

interface FuelContract {
  id: string
  supplierName: string
  contractType: string
  fuelTypes: string[]
  discountRate: number
  startDate: string
  endDate: string
  status: string
}

export function FuelPurchasing() {
  const [activeTab, setActiveTab] = useState("map")
  const [nearbyStations, setNearbyStations] = useState<FuelStation[]>([])
  const [forecasts, setForecasts] = useState<PriceForecast[]>([])
  const [purchaseRecommendation, setPurchaseRecommendation] = useState<PurchaseRecommendation | null>(null)
  const [contracts, setContracts] = useState<FuelContract[]>([])
  const [savings, setSavings] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Search parameters
  const [searchLat, setSearchLat] = useState("37.7749")
  const [searchLng, setSearchLng] = useState("-122.4194")
  const [searchRadius, setSearchRadius] = useState("25")
  const [selectedFuelType, setSelectedFuelType] = useState("regular")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    await Promise.all([
      fetchNearbyStations(),
      fetchForecasts(),
      fetchPurchaseRecommendation(),
      fetchContracts(),
      fetchSavings()
    ])
  }

  const fetchNearbyStations = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get(
        `/fuel-purchasing/prices/nearby?lat=${searchLat}&lng=${searchLng}&radius=${searchRadius}&fuelType=${selectedFuelType}`
      )
      setNearbyStations(data)
    } catch (error) {
      console.error("Error fetching nearby stations:", error)
      toast.error("Failed to load nearby stations")
    } finally {
      setLoading(false)
    }
  }

  const fetchForecasts = async () => {
    try {
      const data = await apiClient.get(
        `/fuel-purchasing/forecast?fuelType=${selectedFuelType}&days=14`
      )
      setForecasts(data)
    } catch (error) {
      console.error("Error fetching forecasts:", error)
    }
  }

  const fetchPurchaseRecommendation = async () => {
    try {
      const data = await apiClient.get(
        `/fuel-purchasing/forecast/timing?fuelType=${selectedFuelType}&currentPrice=3.45`
      )
      setPurchaseRecommendation(data)
    } catch (error) {
      console.error("Error fetching purchase recommendation:", error)
    }
  }

  const fetchContracts = async () => {
    try {
      const data = await apiClient.get("/fuel-purchasing/contracts?status=active")
      setContracts(data)
    } catch (error) {
      console.error("Error fetching contracts:", error)
    }
  }

  const fetchSavings = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const data = await apiClient.get(
        `/fuel-purchasing/savings?startDate=${startDate}&endDate=${endDate}`
      )
      setSavings(data)
    } catch (error) {
      console.error("Error fetching savings:", error)
    }
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy_now':
        return 'text-green-600'
      case 'wait':
        return 'text-yellow-600'
      default:
        return 'text-blue-600'
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'buy_now':
        return <CheckCircle className="h-5 w-5" weight="fill" />
      case 'wait':
        return <Warning className="h-5 w-5" weight="fill" />
      default:
        return <Target className="h-5 w-5" weight="fill" />
    }
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(3)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GasPump className="h-8 w-8 text-blue-600" weight="fill" />
          Fuel Purchasing Intelligence
        </h1>
        <p className="text-gray-600 mt-2">
          Real-time pricing, predictive analytics, and optimization for smart fuel purchasing
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Savings (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${savings?.totalSavings?.toFixed(0) || '0'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {savings?.totalGallons?.toFixed(0) || '0'} gallons purchased
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Price Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(savings?.averagePricePaid || 0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">per gallon</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Market Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(savings?.marketAveragePrice || 0)}
            </div>
            <div className="text-xs text-gray-600 mt-1">per gallon</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {contracts.length}
            </div>
            <div className="text-xs text-gray-600 mt-1">supplier agreements</div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Timing Recommendation */}
      {purchaseRecommendation && (
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" weight="fill" />
              Purchase Timing Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-gray-100 ${getRecommendationColor(purchaseRecommendation.recommendation)}`}>
                {getRecommendationIcon(purchaseRecommendation.recommendation)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="uppercase">
                    {purchaseRecommendation.recommendation.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {purchaseRecommendation.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm mb-3">{purchaseRecommendation.reasoning}</p>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Current Price</div>
                    <div className="font-semibold">{formatPrice(purchaseRecommendation.currentPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Forecasted Price</div>
                    <div className="font-semibold">{formatPrice(purchaseRecommendation.forecastedPrice)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Expected Savings</div>
                    <div className="font-semibold text-green-600">
                      ${purchaseRecommendation.expectedSavings.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Optimal Date</div>
                    <div className="font-semibold">{purchaseRecommendation.optimalPurchaseDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="map">Price Map</TabsTrigger>
          <TabsTrigger value="forecasts">Price Forecasts</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="savings">Savings Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Search Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Search Fuel Stations</CardTitle>
              <CardDescription>Find the best fuel prices near you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div>
                  <Label>Latitude</Label>
                  <Input
                    value={searchLat}
                    onChange={(e) => setSearchLat(e.target.value)}
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <Label>Longitude</Label>
                  <Input
                    value={searchLng}
                    onChange={(e) => setSearchLng(e.target.value)}
                    placeholder="-122.4194"
                  />
                </div>
                <div>
                  <Label>Radius (miles)</Label>
                  <Input
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(e.target.value)}
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label>Fuel Type</Label>
                  <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchNearbyStations} className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Station List */}
          <Card>
            <CardHeader>
              <CardTitle>Nearby Stations ({nearbyStations.length})</CardTitle>
              <CardDescription>Sorted by distance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading stations...</p>
                </div>
              ) : nearbyStations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nearbyStations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell>
                          <div className="font-medium">{station.stationName}</div>
                          <div className="text-sm text-gray-600">{station.brand}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {station.address}
                            <br />
                            {station.city}, {station.state}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {station.distance.toFixed(1)} mi
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(station.currentPrices?.[selectedFuelType] || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {station.acceptsFleetCards && (
                              <Badge variant="secondary" className="text-xs">Fleet Card</Badge>
                            )}
                            {station.has24HourAccess && (
                              <Badge variant="secondary" className="text-xs">24/7</Badge>
                            )}
                            {station.hasTruckAccess && (
                              <Badge variant="secondary" className="text-xs">Truck</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-medium">{station.rating.toFixed(1)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GasPump className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No stations found</p>
                  <p className="text-sm">Try adjusting your search parameters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLine className="h-5 w-5 text-blue-600" weight="fill" />
                14-Day Price Forecast
              </CardTitle>
              <CardDescription>AI-powered price predictions for {selectedFuelType} fuel</CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length > 0 ? (
                <div className="space-y-4">
                  {/* Price Trend Chart */}
                  <div className="h-48 flex items-end gap-1">
                    {forecasts.slice(0, 14).map((forecast, idx) => {
                      const maxPrice = Math.max(...forecasts.map(f => f.predictedPrice))
                      const minPrice = Math.min(...forecasts.map(f => f.predictedPrice))
                      const range = maxPrice - minPrice
                      const heightPercent = range > 0
                        ? ((forecast.predictedPrice - minPrice) / range) * 100
                        : 50

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                            style={{ height: `${heightPercent}%`, minHeight: '20%' }}
                            title={`${forecast.date}: ${formatPrice(forecast.predictedPrice)}`}
                          />
                          <div className="text-xs text-gray-500 mt-1 rotate-45 origin-top-left">
                            {new Date(forecast.date).getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Forecast Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Predicted Price</TableHead>
                        <TableHead>Range</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecasts.slice(0, 7).map((forecast, idx) => {
                        const prevPrice = idx > 0 ? forecasts[idx - 1].predictedPrice : forecast.predictedPrice
                        const priceDiff = forecast.predictedPrice - prevPrice
                        const isUp = priceDiff > 0

                        return (
                          <TableRow key={forecast.date}>
                            <TableCell className="font-medium">
                              {new Date(forecast.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-lg font-bold">
                              {formatPrice(forecast.predictedPrice)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatPrice(forecast.confidenceIntervalLow)} - {formatPrice(forecast.confidenceIntervalHigh)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {forecast.confidenceScore.toFixed(0)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {idx > 0 && (
                                <div className={`flex items-center gap-1 ${isUp ? 'text-red-600' : 'text-green-600'}`}>
                                  {isUp ? <TrendUp className="h-4 w-4" /> : <TrendDown className="h-4 w-4" />}
                                  <span className="text-sm font-medium">
                                    {Math.abs(priceDiff).toFixed(3)}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChartLine className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No forecast data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" weight="fill" />
                Fuel Contracts
              </CardTitle>
              <CardDescription>Active supplier agreements and discounts</CardDescription>
            </CardHeader>
            <CardContent>
              {contracts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Contract Type</TableHead>
                      <TableHead>Fuel Types</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.supplierName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contract.contractType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contract.fuelTypes.map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-bold">
                          {contract.discountRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(contract.startDate).toLocaleDateString()} -<br />
                          {new Date(contract.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={contract.status === 'active' ? 'default' : 'secondary'}
                          >
                            {contract.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No active contracts</p>
                  <p className="text-sm">Set up supplier contracts to unlock volume discounts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" weight="fill" />
                Price Alerts
              </CardTitle>
              <CardDescription>Get notified when fuel prices meet your criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-16 w-16 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No alerts configured</p>
                <p className="text-sm mb-4">Create alerts to monitor fuel prices</p>
                <Button>
                  <Bell className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollar className="h-5 w-5 text-green-600" weight="fill" />
                Savings Calculator
              </CardTitle>
              <CardDescription>Track your fuel cost optimization savings</CardDescription>
            </CardHeader>
            <CardContent>
              {savings && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">Last 30 Days Performance</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Gallons</span>
                          <span className="font-bold">{savings.totalGallons?.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Spent</span>
                          <span className="font-bold">${savings.totalSpent?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Avg Price Paid</span>
                          <span className="font-bold">{formatPrice(savings.averagePricePaid)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Market Average</span>
                          <span className="font-bold">{formatPrice(savings.marketAveragePrice)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Savings Breakdown</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Contract Discounts</span>
                          <span className="font-bold text-green-600">
                            ${savings.savingsBreakdown?.contractDiscounts?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Optimal Timing</span>
                          <span className="font-bold text-green-600">
                            ${savings.savingsBreakdown?.optimalTiming?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Optimal Location</span>
                          <span className="font-bold text-green-600">
                            ${savings.savingsBreakdown?.optimalLocation?.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Bulk Purchase</span>
                          <span className="font-bold text-green-600">
                            ${savings.savingsBreakdown?.bulkPurchase?.toFixed(2)}
                          </span>
                        </div>
                        <div className="pt-3 border-t flex justify-between items-center">
                          <span className="font-semibold">Total Savings</span>
                          <span className="text-xl font-bold text-green-600">
                            ${savings.totalSavings?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" weight="fill" />
                      <span className="font-semibold text-green-900">Optimization Impact</span>
                    </div>
                    <p className="text-sm text-green-800">
                      You've saved{' '}
                      <span className="font-bold">
                        {((savings.totalSavings / savings.totalSpent) * 100).toFixed(1)}%
                      </span>{' '}
                      compared to market average prices. Keep up the great work!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
