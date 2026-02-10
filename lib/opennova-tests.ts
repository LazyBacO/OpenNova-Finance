/**
 * Test Suite for OpenNova Stock Analysis System
 * Run: pnpm test (if vitest configured)
 * Manual: Copy tests to __tests__ folder
 */

// Test utilities
export const testScenarios = {
  /**
   * Scenario 1: Strong Buy Signal
   * RSI oversold + MACD bullish + Good fundamentals
   */
  strongBuy: {
    symbol: "NVDA",
    currentPrice: 135.0,
    technical: {
      rsi14: 28, // Oversold
      macd: { histogram: 0.5 }, // Bullish
      sma200: 120, // Price above
      adx: 35, // Strong trend
    },
    fundamental: {
      pe: 22,
      roe: 45,
      growthRate: 25,
      fcf: 5000000000,
    },
    expectedSignal: "strong-buy",
    expectedConfidence: 75, // Approx
  },

  /**
   * Scenario 2: Sell Signal
   * RSI overbought + MACD bearish + High valuation
   */
  sellSignal: {
    symbol: "TSLA",
    currentPrice: 290.0,
    technical: {
      rsi14: 72, // Overbought
      macd: { histogram: -0.3 }, // Bearish
      sma200: 280, // Price near
      adx: 25, // Weak trend
    },
    fundamental: {
      pe: 65,
      roe: 12,
      growthRate: 5,
      fcf: 0,
    },
    expectedSignal: "sell",
    expectedConfidence: 70,
  },

  /**
   * Scenario 3: Hold Signal
   * Neutral RSI + Flat MACD + Average metrics
   */
  holdSignal: {
    symbol: "MSFT",
    currentPrice: 450.0,
    technical: {
      rsi14: 50,
      macd: { histogram: 0.1 },
      sma200: 450,
      adx: 20,
    },
    fundamental: {
      pe: 32,
      roe: 28,
      growthRate: 10,
      fcf: 40000000000,
    },
    expectedSignal: "hold",
    expectedConfidence: 55,
  },

  /**
   * Scenario 4: Volatile Stock
   * High RSI variation + High ADX
   */
  volatileStock: {
    symbol: "GME",
    currentPrice: 25.0,
    high52week: 85.0,
    low52week: 12.0,
    technical: {
      rsi14: 65,
      atr: 2.5, // High volatility
      adx: 45, // Very strong
    },
    fundamental: {
      pe: 150,
      debt: 0.8,
    },
    expectedRiskScore: 75, // High risk
  },

  /**
   * Scenario 5: Dividend Stock
   * Stable, defensive characteristics
   */
  dividendStock: {
    symbol: "JNJ",
    currentPrice: 160.0,
    technical: {
      rsi14: 45,
      beta: 0.6, // Low beta, defensive
      atr: 0.5, // Low volatility
    },
    fundamental: {
      pe: 25,
      roe: 35,
      dividend: 2.8,
      debt: 0.5,
    },
    expectedRiskScore: 25, // Low risk
  },
}

/**
 * Test Data Factory
 */
export function createMockStockPrice(symbol: string, overrides = {}) {
  return {
    symbol,
    current: 150.0,
    high52week: 180.0,
    low52week: 120.0,
    avgVolume: 50000000,
    marketCap: 2000000000000,
    pe: 25,
    dividend: 1.5,
    beta: 1.1,
    ...overrides,
  }
}

export function createMockFundamental(overrides = {}) {
  return {
    pe: 25,
    pb: 3.5,
    ps: 2.5,
    debt: 0.8,
    roe: 20,
    roic: 15,
    fcf: 5000000000,
    growthRate: 8,
    ...overrides,
  }
}

export function createMockTechnical(overrides = {}) {
  return {
    sma20: 148.0,
    sma50: 145.0,
    sma200: 140.0,
    rsi14: 50,
    macd: {
      line: 0.5,
      signal: 0.4,
      histogram: 0.1,
    },
    bollinger: {
      upper: 165.0,
      middle: 150.0,
      lower: 135.0,
    },
    atr: 1.5,
    adx: 25,
    ...overrides,
  }
}

/**
 * Alert Test Scenarios
 */
export const alertTestScenarios = {
  rsiOversold: {
    symbol: "AMD",
    currentPrice: 135.0,
    rsi: 28,
    expectedTrigger: true,
    alertType: "rsi-signal",
  },

  priceTarget: {
    symbol: "AAPL",
    currentPrice: 192.0,
    targetPrice: 195.0,
    expectedTrigger: true,
    diff: Math.abs(192 - 195) / 195 * 100, // Should be < 5%
  },

  volumeSurge: {
    symbol: "NIO",
    volume: 150000000, // 3x average
    avgVolume: 50000000,
    surge: 200,
    expectedTrigger: true,
  },

  volatility: {
    symbol: "TSLA",
    previousClose: 250.0,
    currentPrice: 265.0,
    change: ((265 - 250) / 250) * 100, // 6%
    threshold: 5,
    expectedTrigger: true,
  },
}

/**
 * Performance Test Scenarios
 */
export const performanceTests = {
  /**
   * Portfolio with 5 trades
   */
  portfolioPerformance: {
    trades: [
      {
        symbol: "UPRO",
        action: "buy",
        entryPrice: 100,
        exitPrice: 108,
        shares: 100,
        expectedGain: 800, // (108-100)*100
      },
      {
        symbol: "GLD",
        action: "buy",
        entryPrice: 200,
        exitPrice: 193,
        shares: 100,
        expectedGain: -700, // (193-200)*100
      },
      {
        symbol: "SPY",
        action: "buy",
        entryPrice: 450,
        exitPrice: 465,
        shares: 100,
        expectedGain: 1500,
      },
      {
        symbol: "QQQ",
        action: "buy",
        entryPrice: 380,
        exitPrice: 375,
        shares: 100,
        expectedGain: -500,
      },
      {
        symbol: "IVV",
        action: "buy",
        entryPrice: 430,
        exitPrice: 445,
        shares: 100,
        expectedGain: 1500,
      },
    ],
    expectedStats: {
      totalInvested: 156000, // Sum of entry prices * shares
      totalGainLoss: 2600, // Sum of gains
      winRate: 60, // 3 wins / 5 trades
      avgReturn: 1.67, // 2600 / 156000 * 100
      winCount: 3,
      lossCount: 2,
    },
  },
}

/**
 * Manual Test Instructions
 */
export const manualTests = `
# OpenNova Manual Test Checklist

## 1. Basic Analysis Test
[ ] Go to http://localhost:3000/dashboard
[ ] Find "Analyze Stock" button
[ ] Enter: AAPL, $185.50, PE=28.5, ROE=85
[ ] Click "Analyze"
[ ] Expected: Signal "Buy" with target ~$195

## 2. Portfolio Stats Test
[ ] Complete 3+ analyses
[ ] Click tab "Overview"
[ ] Verify: Total Invested, Realized Gain/Loss shown
[ ] Stats should update live

## 3. Close Position Test
[ ] Create analysis with action (Buy)
[ ] Go to "Active Positions"
[ ] Click "Close"
[ ] Enter exit price
[ ] Verify: Moved to "Closed Positions" with P&L

## 4. Alert Creation Test
[ ] In chat: "Alert me if TSLA < $250"
[ ] AI should create alert
[ ] Verify: Alert shows in widget
[ ] Click dismiss to test removal

## 5. Chat IA Test
[ ] Ask: "Analyze NVDA"
[ ] IA should call API + respond with signal
[ ] Ask: "What's my best trade?"
[ ] IA should look at registry + answer

## 6. Persistence Test
[ ] Create 2-3 analyses
[ ] Refresh page (F5)
[ ] Expected: All data still there
[ ] Check: localStorage has entries

## 7. Export Test
[ ] Open browser console
[ ] Run: localStorage.getItem('stock_analysis_registry_v1')
[ ] Should see JSON array of entries
[ ] Copy-paste to backup file

## 8. Mobile Responsive Test
[ ] Resize to 375px width
[ ] Verify: UI still usable
[ ] Tabs should stack
[ ] Alerts widget responsive
`

/**
 * API Test Requests (Copy-Paste to Postman)
 */
export const apiTests = {
  analyzeStockRequest: {
    method: "POST",
    url: "http://localhost:3000/api/stock-analysis",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol: "AAPL",
      currentPrice: 185.5,
      high52week: 199.62,
      low52week: 164.04,
      avgVolume: 50000000,
      pe: 28.5,
      roe: 85.3,
      growthRate: 12.5,
      action: "buy",
      shares: 100,
    }),
  },

  portfolioAnalysisRequest: {
    method: "GET",
    url: "http://localhost:3000/api/stock-analysis?action=portfolio",
  },

  symbolAnalysesRequest: {
    method: "GET",
    url: "http://localhost:3000/api/stock-analysis?action=analyses&symbol=AAPL",
  },
}

/**
 * Expected Response Examples
 */
export const expectedResponses = {
  analyzeSuccess: {
    success: true,
    data: {
      report: {
        symbol: "AAPL",
        prices: {
          current: 185.5,
          high52week: 199.62,
        },
        technical: {
          rsi14: "number",
          macd: "object with line/signal/histogram",
        },
        fundamental: {
          pe: 28.5,
          roe: 85.3,
        },
        recommendation: {
          signal: "buy|sell|hold|strong-buy|strong-sell",
          confidence: "0-100",
          priceTarget: "number",
          stopLoss: "number",
          riskScore: "0-100",
        },
      },
      summary: "string with formatted markdown",
      entryId: "string if position created",
    },
  },

  error400: {
    success: false,
    error: "Validation error",
    details: ["array of validation issues"],
  },

  error500: {
    success: false,
    error: "Analysis failed",
  },
}

/**
 * Browser Console Debug Commands
 */
export const debugCommands = `
// Check all stored analysis entries
JSON.parse(localStorage.getItem('stock_analysis_registry_v1'))

// Check all alerts
JSON.parse(localStorage.getItem('stock_alerts_v1'))

// Clear all data (CAREFUL!)
localStorage.clear()

// Check specific entry
const registry = JSON.parse(localStorage.getItem('stock_analysis_registry_v1'))
registry.entries[0]  // First entry

// Calculate portfolio stats manually
const entries = JSON.parse(localStorage.getItem('stock_analysis_registry_v1')).entries
const closed = entries.filter(e => e.status === 'closed')
const wins = closed.filter(e => e.realizedGainLoss > 0)
console.log('Win Rate:', (wins.length / closed.length * 100).toFixed(1) + '%')

// Test API directly
fetch('/api/stock-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: 'AAPL',
    currentPrice: 185.5,
    pe: 28.5
  })
}).then(r => r.json()).then(console.log)
`

const openNovaTestsBundle = {
  testScenarios,
  alertTestScenarios,
  performanceTests,
  manualTests,
  apiTests,
  expectedResponses,
  debugCommands,
}

export default openNovaTestsBundle
