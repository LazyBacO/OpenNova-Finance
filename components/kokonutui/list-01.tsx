"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  SendHorizontal,
  QrCode,
  Plus,
  ArrowRight,
  CreditCard,
  Pencil,
} from "lucide-react"
import { usePortfolio } from "@/lib/portfolio-context"
import { AccountModal } from "./portfolio-modals"
import type { AccountItem } from "@/lib/portfolio-data"

interface List01Props {
  className?: string
}

export default function List01({ className }: List01Props) {
  const { accounts, totalBalance, addAccount, updateAccount, deleteAccount } = usePortfolio()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountItem | undefined>(undefined)

  const accountTotals = accounts.reduce(
    (totals, account) => {
      const amount = parseFloat(account.balance.replace(/[$,]/g, "")) || 0
      totals[account.type] += amount
      return totals
    },
    {
      savings: 0,
      checking: 0,
      investment: 0,
      debt: 0,
    }
  )

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleAddAccount = () => {
    setEditingAccount(undefined)
    setIsModalOpen(true)
  }

  const handleEditAccount = (account: AccountItem) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleSaveAccount = (accountData: Omit<AccountItem, "id">) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, accountData)
    } else {
      addAccount(accountData)
    }
  }

  const handleDeleteAccount = () => {
    if (editingAccount) {
      deleteAccount(editingAccount.id)
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
        {/* Total Balance Section */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Total Balance</p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalBalance}</h1>
        </div>

        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Savings</p>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(accountTotals.savings)}
              </p>
            </div>
            <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 px-3 py-2">
              <p className="text-[11px] text-blue-700 dark:text-blue-300">Checking</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {formatCurrency(accountTotals.checking)}
              </p>
            </div>
            <div className="rounded-lg border border-purple-100 dark:border-purple-900/40 bg-purple-50 dark:bg-purple-900/10 px-3 py-2">
              <p className="text-[11px] text-purple-700 dark:text-purple-300">Investments</p>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                {formatCurrency(accountTotals.investment)}
              </p>
            </div>
            <div className="rounded-lg border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 px-3 py-2">
              <p className="text-[11px] text-rose-700 dark:text-rose-300">Debt</p>
              <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">
                {formatCurrency(accountTotals.debt)}
              </p>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Your Accounts</h2>
          </div>

          <div className="space-y-1">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={cn(
                  "group flex items-center justify-between",
                  "p-2 rounded-lg",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                  "transition-all duration-200",
                  "cursor-pointer"
                )}
                onClick={() => handleEditAccount(account)}
                onKeyDown={(e) => e.key === "Enter" && handleEditAccount(account)}
                tabIndex={0}
                role="button"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn("p-1.5 rounded-lg", {
                      "bg-emerald-100 dark:bg-emerald-900/30": account.type === "savings",
                      "bg-blue-100 dark:bg-blue-900/30": account.type === "checking",
                      "bg-purple-100 dark:bg-purple-900/30": account.type === "investment",
                      "bg-red-100 dark:bg-red-900/30": account.type === "debt",
                    })}
                  >
                    {account.type === "savings" && (
                      <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {account.type === "checking" && (
                      <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    {account.type === "investment" && (
                      <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                    {account.type === "debt" && (
                      <CreditCard className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {account.title}
                    </h3>
                    {account.description && (
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        {account.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {account.balance}
                  </span>
                  <Pencil className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Updated footer with four buttons */}
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleAddAccount}
              className={cn(
                "flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg",
                "text-xs font-medium",
                "bg-zinc-900 dark:bg-zinc-50",
                "text-zinc-50 dark:text-zinc-900",
                "hover:bg-zinc-800 dark:hover:bg-zinc-200",
                "shadow-sm hover:shadow",
                "transition-all duration-200"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg",
                "text-xs font-medium",
                "bg-zinc-900 dark:bg-zinc-50",
                "text-zinc-50 dark:text-zinc-900",
                "hover:bg-zinc-800 dark:hover:bg-zinc-200",
                "shadow-sm hover:shadow",
                "transition-all duration-200"
              )}
            >
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg",
                "text-xs font-medium",
                "bg-zinc-900 dark:bg-zinc-50",
                "text-zinc-50 dark:text-zinc-900",
                "hover:bg-zinc-800 dark:hover:bg-zinc-200",
                "shadow-sm hover:shadow",
                "transition-all duration-200"
              )}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Top-up</span>
            </button>
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-2",
                "py-2 px-3 rounded-lg",
                "text-xs font-medium",
                "bg-zinc-900 dark:bg-zinc-50",
                "text-zinc-50 dark:text-zinc-900",
                "hover:bg-zinc-800 dark:hover:bg-zinc-200",
                "shadow-sm hover:shadow",
                "transition-all duration-200"
              )}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>More</span>
            </button>
          </div>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAccount}
        onDelete={editingAccount ? handleDeleteAccount : undefined}
        initialData={editingAccount}
      />
    </>
  )
}
