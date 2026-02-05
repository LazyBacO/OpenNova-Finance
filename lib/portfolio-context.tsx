"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"
import {
  ACCOUNTS as DEFAULT_ACCOUNTS,
  TRANSACTIONS as DEFAULT_TRANSACTIONS,
  FINANCIAL_GOALS as DEFAULT_GOALS,
  type AccountItem,
  type Transaction,
  type FinancialGoal,
} from "./portfolio-data"

interface PortfolioContextType {
  // Accounts
  accounts: AccountItem[]
  addAccount: (account: Omit<AccountItem, "id">) => void
  updateAccount: (id: string, account: Partial<AccountItem>) => void
  deleteAccount: (id: string) => void

  // Transactions
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  // Financial Goals
  goals: FinancialGoal[]
  addGoal: (goal: Omit<FinancialGoal, "id">) => void
  updateGoal: (id: string, goal: Partial<FinancialGoal>) => void
  deleteGoal: (id: string) => void

  // Computed values
  totalBalance: string
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<AccountItem[]>(DEFAULT_ACCOUNTS)
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS)
  const [goals, setGoals] = useState<FinancialGoal[]>(DEFAULT_GOALS)

  // Account operations
  const addAccount = useCallback((account: Omit<AccountItem, "id">) => {
    const newAccount: AccountItem = {
      ...account,
      id: Date.now().toString(),
    }
    setAccounts((prev) => [...prev, newAccount])
  }, [])

  const updateAccount = useCallback((id: string, updates: Partial<AccountItem>) => {
    setAccounts((prev) =>
      prev.map((account) => (account.id === id ? { ...account, ...updates } : account))
    )
  }, [])

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id))
  }, [])

  // Transaction operations
  const addTransaction = useCallback((transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? { ...transaction, ...updates } : transaction
      )
    )
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((transaction) => transaction.id !== id))
  }, [])

  // Goal operations
  const addGoal = useCallback((goal: Omit<FinancialGoal, "id">) => {
    const newGoal: FinancialGoal = {
      ...goal,
      id: Date.now().toString(),
    }
    setGoals((prev) => [...prev, newGoal])
  }, [])

  const updateGoal = useCallback((id: string, updates: Partial<FinancialGoal>) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    )
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id))
  }, [])

  // Computed total balance
  const totalBalance = useMemo(() => {
    const total = accounts.reduce((sum, account) => {
      const amount = parseFloat(account.balance.replace(/[$,]/g, ""))
      if (account.type === "debt") {
        return sum - amount
      }
      return sum + amount
    }, 0)
    return `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }, [accounts])

  const value = useMemo(
    () => ({
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      totalBalance,
    }),
    [
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      goals,
      addGoal,
      updateGoal,
      deleteGoal,
      totalBalance,
    ]
  )

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export function usePortfolio() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider")
  }
  return context
}
