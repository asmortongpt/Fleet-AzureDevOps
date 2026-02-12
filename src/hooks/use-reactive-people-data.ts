/**
 * useReactivePeopleData - Real-time personnel/staff data with React Query
 * Auto-refreshes every 10 seconds for live people management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { secureFetch } from '@/hooks/use-api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  hireDate: string
  employeeType: 'full_time' | 'part_time' | 'contractor'
  managerId?: string
  performanceRating: number
  certifications: string[]
  lastReviewDate?: string
  nextReviewDate?: string
  createdAt: string
}

interface Team {
  id: string
  name: string
  department: string
  managerId: string
  memberCount: number
  description?: string
  createdAt: string
}

interface PerformanceReview {
  id: string
  employeeId: string
  reviewerId: string
  rating: number
  date: string
  status: 'scheduled' | 'completed' | 'overdue'
  notes?: string
}

export function useReactivePeopleData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch employees
  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees', realTimeUpdate],
    queryFn: async () => {
      const response = await secureFetch(`${API_BASE}/employees`)
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['teams', realTimeUpdate],
    queryFn: async () => {
      const response = await secureFetch(`${API_BASE}/teams`)
      if (!response.ok) throw new Error('Failed to fetch teams')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch performance reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<PerformanceReview[]>({
    queryKey: ['performance-reviews', realTimeUpdate],
    queryFn: async () => {
      const response = await secureFetch(`${API_BASE}/performance-reviews`)
      if (!response.ok) throw new Error('Failed to fetch performance reviews')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate personnel metrics
  const metrics = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === 'active').length,
    onLeave: employees.filter((e) => e.status === 'on_leave').length,
    inactive: employees.filter((e) => e.status === 'inactive').length,
    fullTime: employees.filter((e) => e.employeeType === 'full_time').length,
    partTime: employees.filter((e) => e.employeeType === 'part_time').length,
    contractors: employees.filter((e) => e.employeeType === 'contractor').length,
    avgPerformanceRating: employees.length > 0
      ? Math.round(employees.reduce((sum, e) => sum + (e.performanceRating || 0), 0) / employees.length)
      : 0,
    totalTeams: teams.length,
    avgTeamSize: teams.length > 0
      ? Math.round(teams.reduce((sum, t) => sum + (t.memberCount || 0), 0) / teams.length)
      : 0,
    scheduledReviews: reviews.filter((r) => r.status === 'scheduled').length,
    overdueReviews: reviews.filter((r) => r.status === 'overdue').length,
    completedReviews: reviews.filter((r) => r.status === 'completed').length,
  }

  // Employee status distribution for pie chart
  const statusDistribution = employees.reduce((acc, employee) => {
    acc[employee.status] = (acc[employee.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Employee type distribution
  const typeDistribution = employees.reduce((acc, employee) => {
    acc[employee.employeeType] = (acc[employee.employeeType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Department distribution
  const departmentDistribution = employees.reduce((acc, employee) => {
    acc[employee.department] = (acc[employee.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Performance rating ranges
  const performanceRanges = {
    excellent: employees.filter((e) => e.performanceRating >= 90).length,
    good: employees.filter((e) => e.performanceRating >= 75 && e.performanceRating < 90).length,
    satisfactory: employees.filter((e) => e.performanceRating >= 60 && e.performanceRating < 75).length,
    needsImprovement: employees.filter((e) => e.performanceRating < 60).length,
  }

  // Performance trend data derived from review history (last 6 months)
  const performanceTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const label = date.toLocaleDateString('en-US', { month: 'short' })
    const month = date.getMonth()
    const year = date.getFullYear()

    const monthlyReviews = reviews.filter((review) => {
      const reviewDate = new Date(review.date)
      return reviewDate.getMonth() === month && reviewDate.getFullYear() === year
    })

    const avgRating = monthlyReviews.length > 0
      ? Math.round(monthlyReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / monthlyReviews.length)
      : 0

    return {
      name: label,
      avgRating,
      reviews: monthlyReviews.length,
    }
  })

  // Department performance data (top departments by avg rating)
  const departmentPerformanceData = Object.entries(
    employees.reduce((acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = { total: 0, count: 0 }
      }
      acc[emp.department].total += emp.performanceRating || 0
      acc[emp.department].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)
  )
    .map(([name, data]) => ({
      name,
      avgRating: Math.round(data.total / data.count),
      employees: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 8)

  // Team size distribution
  const teamSizeData = teams
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 10)
    .map((team) => ({
      name: team.name,
      members: team.memberCount,
    }))

  // Get employees with upcoming reviews (within 30 days)
  const upcomingReviews = employees.filter((e) => {
    if (!e.nextReviewDate) return false
    const reviewDate = new Date(e.nextReviewDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return reviewDate <= thirtyDaysFromNow && reviewDate >= new Date()
  }).sort((a, b) => new Date(a.nextReviewDate!).getTime() - new Date(b.nextReviewDate!).getTime())

  // Get top performers (top 10 by rating)
  const topPerformers = employees
    .filter((e) => e.status === 'active')
    .sort((a, b) => b.performanceRating - a.performanceRating)
    .slice(0, 10)

  // Get employees needing attention (low performance or overdue reviews)
  const needsAttention = employees
    .filter((e) => e.status === 'active' && (e.performanceRating < 70 ||
      (e.nextReviewDate && new Date(e.nextReviewDate) < new Date())))
    .sort((a, b) => a.performanceRating - b.performanceRating)
    .slice(0, 10)

  // Get new hires (joined in last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const newHires = employees.filter((e) => new Date(e.hireDate) >= ninetyDaysAgo)

  return {
    employees,
    teams,
    reviews,
    metrics,
    statusDistribution,
    typeDistribution,
    departmentDistribution,
    performanceRanges,
    performanceTrendData,
    departmentPerformanceData,
    teamSizeData,
    upcomingReviews,
    topPerformers,
    needsAttention,
    newHires,
    isLoading: employeesLoading || teamsLoading || reviewsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
