"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  ShoppingCart,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Zap,
  Banknote,
  Plus,
  Pencil,
  Utensils,
  Car,
  Gamepad2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { TransactionModal } from "./portfolio-modals"
import type { Transaction } from "@/lib/portfolio-data"

interface List02Props {
  className?: string
}

// Map categories to icons
const categoryIcons: Record<string, LucideIcon> = {
  shopping: ShoppingCart,
  investment: TrendingUp,
  income: Banknote,
  utilities: Zap,
  debt: CreditCard,
  food: Utensils,
  transport: Car,
  entertainment: Gamepad2,
  default: Wallet,
}

export default function List02({ className }: List02Props) {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = usePortfolio()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined)

  const handleAddTransaction = () => {
    setEditingTransaction(undefined)
    setIsModalOpen(true)
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsModalOpen(true)
  }

  const handleSaveTransaction = (transactionData: Omit<Transaction, "id">) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData)
    } else {
      addTransaction(transactionData)
    }
  }

  const handleDeleteTransaction = () => {
    if (editingTransaction) {
      deleteTransaction(editingTransaction.id)
    }
  }

  return (
    <>
      <div
        className={cn(
          "w-full max-w-xl mx-auto",
          "bg-white dark:bg-zinc-900/70",
          "border border-zinc-100 dark:border-zinc-800",
          "rounded-xl shadow-sm backdrop-blur-xl",
          className
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Activity
              <span className="text-xs font-normal text-zinc-600 dark:text-zinc-400 ml-1">
                ({transactions.length} transactions)
              </span>
            </h2>
            <button
              onClick={handleAddTransaction}
              className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-1">
            {transactions.map((transaction) => {
              const Icon = categoryIcons[transaction.category] || categoryIcons.default
              return (
                <div
                  key={transaction.id}
                  className={cn(
                    "group flex items-center gap-3",
                    "p-2 rounded-lg",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                    "transition-all duration-200",
                    "cursor-pointer"
                  )}
                  onClick={() => handleEditTransaction(transaction)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditTransaction(transaction)}
                  tabIndex={0}
                  role="button"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-zinc-100 dark:bg-zinc-800",
                      "border border-zinc-200 dark:border-zinc-700"
                    )}
                  >
                    <Icon className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  </div>

                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {transaction.title}
                      </h3>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        {transaction.timestamp}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pl-3">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          transaction.type === "incoming"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {transaction.type === "incoming" ? "+" : "-"}
                        {transaction.amount}
                      </span>
                      {transaction.type === "incoming" ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      )}
                      <Pencil className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleAddTransaction}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "py-2 px-3 rounded-lg",
              "text-xs font-medium",
              "bg-gradient-to-r from-zinc-900 to-zinc-800",
              "dark:from-zinc-50 dark:to-zinc-200",
              "text-zinc-50 dark:text-zinc-900",
              "hover:from-zinc-800 hover:to-zinc-700",
              "dark:hover:from-zinc-200 dark:hover:to-zinc-300",
              "shadow-sm hover:shadow",
              "transform transition-all duration-200",
              "hover:-translate-y-0.5",
              "active:translate-y-0",
              "focus:outline-none focus:ring-2",
              "focus:ring-zinc-500 dark:focus:ring-zinc-400",
              "focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={editingTransaction ? handleDeleteTransaction : undefined}
        initialData={editingTransaction}
      />
    </>
  )
}
