import { useMemo } from "react"

import { Vehicle } from "@/lib/types"

export function useChartData(vehicles: Vehicle[]) {
  const monthlyFleetData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((name) => {
      const activeCount = Math.floor(Math.random() * 15 + 35)
      return {
        name,
        active: activeCount,
        idle: Math.floor(Math.random() * 10 + 5),
        service: Math.floor(Math.random() * 5 + 2),
        utilization: Math.floor((activeCount / 50) * 100)
      }
    })
  }, [])

  const costAnalysis = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map(name => ({
      name,
      fuel: Math.floor(Math.random() * 15000 + 25000),
      maintenance: Math.floor(Math.random() * 10000 + 15000),
      insurance: Math.floor(Math.random() * 5000 + 8000)
    }))
  }, [])

  const utilizationByType = useMemo(() => {
    const types = ["Sedan", "SUV", "Truck", "Van", "Emergency"]
    return types.map(name => ({
      name,
      utilization: Math.floor(Math.random() * 30 + 65),
      count: vehicles.filter(v => v.type.toLowerCase() === name.toLowerCase()).length
    }))
  }, [vehicles])

  return { monthlyFleetData, costAnalysis, utilizationByType }
}
