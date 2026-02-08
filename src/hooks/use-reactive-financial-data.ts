/**
 * useReactiveFinancialData - Real-time financial data with React Query
 * Auto-refreshes every 10 seconds for live financial management dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface BudgetItem {
  id: string
  category: string
  allocated: number
  spent: number
  remaining: number
  department: string
  fiscalYear: number
  createdAt: string
}

interface ExpenseRecord {
  id: string
  category: string
  amount: number
  vendor: string
  description: string
  date: string
  approved: boolean
  department: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  vendor: string
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'overdue'
  dueDate: string
  category: string
}

export function useReactiveFinancialData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch budget data
  const { data: budgetItems = [], isLoading: budgetLoading } = useQuery<BudgetItem[]>({
    queryKey: ['budget', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/financial/budget`)
      if (!response.ok) throw new Error('Failed to fetch budget data')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch expense records
  const { data: expenses = [], isLoading: expensesLoading } = useQuery<ExpenseRecord[]>({
    queryKey: ['expenses', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/financial/expenses`)
      if (!response.ok) throw new Error('Failed to fetch expenses')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/financial/invoices`)
      if (!response.ok) throw new Error('Failed to fetch invoices')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate financial metrics
  const totalAllocated = budgetItems.reduce((sum, item) => sum + item.allocated, 0)
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = budgetItems.reduce((sum, item) => sum + item.remaining, 0)

  const metrics = {
    totalBudget: totalAllocated,
    totalSpent,
    totalRemaining,
    budgetUtilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    monthlyExpenses: expenses
      .filter((e) => {
        const expenseDate = new Date(e.date)
        const now = new Date()
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + e.amount, 0),
    pendingApprovals: expenses.filter((e) => !e.approved).length,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((i) => i.status === 'paid').length,
    overdueInvoices: invoices.filter((i) => i.status === 'overdue').length,
    pendingInvoices: invoices.filter((i) => i.status === 'pending').length,
    outstandingAmount: invoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0),
  }

  // Budget by category
  const budgetByCategory = budgetItems.reduce((acc, item) => {
    const existing = acc.find((c) => c.category === item.category)
    if (existing) {
      existing.allocated += item.allocated
      existing.spent += item.spent
      existing.remaining += item.remaining
    } else {
      acc.push({
        category: item.category,
        allocated: item.allocated,
        spent: item.spent,
        remaining: item.remaining,
      })
    }
    return acc
  }, [] as Array<{ category: string; allocated: number; spent: number; remaining: number }>)

  // Budget by department
  const budgetByDepartment = budgetItems.reduce((acc, item) => {
    const existing = acc.find((d) => d.name === item.department)
    if (existing) {
      existing.value += item.allocated
    } else {
      acc.push({
        name: item.department,
        value: item.allocated,
      })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  // Expense trend data (last 6 months)
  const expenseTrendData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthName = date.toLocaleString('default', { month: 'short' })

    const monthExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date)
      return expenseDate.getMonth() === date.getMonth() &&
             expenseDate.getFullYear() === date.getFullYear()
    })

    return {
      name: monthName,
      fuel: monthExpenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
      maintenance: monthExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
      operations: monthExpenses.filter(e => e.category === 'operations').reduce((sum, e) => sum + e.amount, 0),
      other: monthExpenses.filter(e => !['fuel', 'maintenance', 'operations'].includes(e.category)).reduce((sum, e) => sum + e.amount, 0),
    }
  })

  // Expense by category
  const expenseByCategory = expenses.reduce((acc, expense) => {
    const existing = acc.find((c) => c.name === expense.category)
    if (existing) {
      existing.value += expense.amount
    } else {
      acc.push({
        name: expense.category,
        value: expense.amount,
      })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  // Top expenses (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentExpenses = expenses
    .filter((e) => new Date(e.date) >= thirtyDaysAgo)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  // Budget variance (over/under budget categories)
  const budgetVariance = budgetByCategory.map((cat) => ({
    category: cat.category,
    variance: cat.remaining,
    percentage: cat.allocated > 0 ? Math.round(((cat.allocated - cat.spent) / cat.allocated) * 100) : 0,
    status: cat.remaining > 0 ? 'under' : 'over',
  }))

  // Overdue invoices
  const overdueInvoices = invoices
    .filter((i) => i.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  // Pending approvals
  const pendingApprovalExpenses = expenses
    .filter((e) => !e.approved)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  return {
    budgetItems,
    expenses,
    invoices,
    metrics,
    budgetByCategory,
    budgetByDepartment,
    expenseTrendData,
    expenseByCategory,
    recentExpenses,
    budgetVariance,
    overdueInvoices,
    pendingApprovalExpenses,
    isLoading: budgetLoading || expensesLoading || invoicesLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
