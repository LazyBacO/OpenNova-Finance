# 🚀 Quick Start - OpenNova Stock Analysis System

## Installation & Démarrage

### 1. Dépendances Déjà Installées ✅
Aucune nouvelle dépendance - utilise les libs existantes:
- `ai` & `@ai-sdk/react` - Chat client
- `zod` - Validation  
- `lucide-react` - Icônes

### 2. Structure des Fichiers Créés

```
lib/
├── stock-analysis-engine.ts          # 🧠 Engine avec indicateurs
├── stock-analysis-registry.ts        # 📊 Registre des positions
├── stock-alerts.ts                   # 🔔 Système d'alertes
└── stock-analysis-client.ts          # 🌐 Client helpers

app/api/
└── stock-analysis/route.ts           # 📡 API endpoint

components/kokonutui/
├── stock-analysis-panel.tsx          # 🖼️ Interface d'analyse
└── stock-alerts-widget.tsx           # ⚠️ Widget d'alertes

OPENNOVA_SYSTEM.md                    # 📖 Documentation complète
OPENNOVA_QUICKSTART.md                # 🚀 Ce fichier
```

---

## Utilisation Rapide

### Via UI Dashboard

#### 1. Accéder au Panel d'Analyse
```
http://localhost:3000/dashboard
→ Chercher "Analyse Boursière" ou "Stock Analysis"
→ Ajouter le composant si absent
```

#### 2. Analyser une Action
```
Clic "Analyser une Action"
├── Symbole: AAPL
├── Prix Actuel: 185.50
├── 52W High: 199.62
├── 52W Low: 164.04
├── P/E: 28.5
├── ROE: 85
└── Action: Achat ✓

→ Clic "Analyser"
→ Voir résultat: Signal BUY, Target $195, Risk 42/100
```

#### 3. Consulter Registre
```
Tabs → "Registre Complet"
Voir:
- Historique d'analyses
- Statut (active/closed)
- Gains/pertes réalisés
```

### Via Chat IA (Codex)

#### Demander une Analyse
```
Vous: "Analyse NVDA pour moi"

Codex:
📊 NVDA Analysis
━━━━━━━━━━━━━━━━━━━━
📈 Signal: Strong Buy 🚀
Confidence: 84%
Price Target: $145
Current Price: $135
Stop Loss: $124

Raison: RSI survendu (28) + MACD haussier
Risk Score: 38/100 (Modéré)
Potential Return: +7.4%
```

#### Créer une Alerte
```
Vous: "Alertez-moi si TSLA descend sous $250"

Codex:
✅ Alerte créée avec succès!
- Symbole: TSLA
- Type: Price Target
- Condition: Prix < $250
- Sévérité: Warning

Vous recevrez une notification quand déclenché.
```

#### Consulter Performance
```
Vous: "Comment vont mes trades?"

Codex:
📈 Registre des Analyses Boursières
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Capital Investi: $50,000
Gain/Perte Réalisé: $2,500 (5%)
Rendement Moyen: 6.2%
Taux de Gain: 65.5%
Positions Actives: 5
Positions Fermées: 8

Meilleure Trade: UPRO +8.3%
Pire Trade: GLD -3.2%
```

---

## Test des APIs

### Test #1: Analyser AAPL

```bash
curl -X POST http://localhost:3000/api/stock-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "currentPrice": 185.50,
    "high52week": 199.62,
    "low52week": 164.04,
    "avgVolume": 50000000,
    "pe": 28.5,
    "pb": 45.8,
    "debt": 1.5,
    "roe": 85.3,
    "roic": 72,
    "fcf": 110000000000,
    "growthRate": 12.5,
    "action": "buy",
    "shares": 100,
    "notes": "Breakout pattern detected"
  }'
```

**Réponse Attendue:**
```json
{
  "success": true,
  "data": {
    "report": {
      "symbol": "AAPL",
      "analyzedAt": "2026-02-09T...",
      "prices": {...},
      "technical": {...},
      "fundamental": {...},
      "recommendation": {
        "signal": "buy",
        "confidence": 78,
        "priceTarget": 195.50,
        "stopLoss": 170.67
      }
    },
    "summary": "📊 AAPL...",
    "entryId": "analysis-xxx"
  }
}
```

### Test #2: Récupérer Portfolio Stats

```bash
curl http://localhost:3000/api/stock-analysis?action=portfolio
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalInvested": 50000,
      "totalRealizedGainLoss": 2500,
      "winRate": 65.5,
      "activePositions": 5
    }
  }
}
```

### Test #3: Récupérer Analyses d'un Symbole

```bash
curl http://localhost:3000/api/stock-analysis?action=analyses&symbol=AAPL
```

---

## Variables Clés à Personnaliser

### `lib/stock-analysis-engine.ts`

```typescript
// Ajuster les poids du scoring
const aiScore = technicalScore * 0.4 + fundamentalScore * 0.6
//                             ↑↑↑                    ↑↑↑
//                        Technique 40%         Fondamental 60%
// → Changer à 0.5 / 0.5 pour équilibre égal

// Ajuster les seuils de signaux
if (aiScore >= 75) signal = "strong-buy"
//           ^^^ Threshold - augmenter pour plus conservateur
```

### `lib/stock-analysis-registry.ts`

```typescript
const STORAGE_KEY = "stock_analysis_registry_v1"
// → Ou "stock_analysis_registry_v2" pour reset complet
```

### `app/api/stock-analysis/route.ts`

```typescript
// Pour mock data plus réaliste, ajuster les prix:
let price = currentPrice * 0.8  // Commence 20% plus bas
// → Changer 0.8 à 0.95 pour moins de volatilité
```

---

## Debugging

### Vérifier les Données Enregistrées

```javascript
// Dans console browser:
localStorage.getItem('stock_analysis_registry_v1')
// → Voir tout le registre

localStorage.getItem('stock_alerts_v1')
// → Voir toutes les alertes

localStorage.getItem('stock_alert_preferences_v1')
// → Voir préférences d'alertes
```

### Logs de l'Analyse

```typescript
// Dans stock-analysis-engine.ts, ajouter:
console.log('Technical Score:', technicalScore)
console.log('Fundamental Score:', fundamentalScore)
console.log('AI Score:', aiScore)
console.log('Signal Final:', signal)
```

### Vérifier le Chat IA

```
Vous: "Debug: show my stock analysis context"

Codex affichera le contexte complet du registre envoyé
→ Vérifier que les données sont correctes
```

---

## Intégration dans Dashboard

### Ajouter le Panel au Dashboard

Dans [components/kokonutui/dashboard.tsx](../components/kokonutui/dashboard.tsx):

```tsx
import { StockAnalysisPanel } from "@/components/kokonutui/stock-analysis-panel"

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Existing content */}
      
      {/* Ajouter analyse boursière */}
      <StockAnalysisPanel />
    </div>
  )
}
```

### Ajouter le Widget d'Alertes

```tsx
import { StockAlertsWidget } from "@/components/kokonutui/stock-alerts-widget"

export default function Dashboard() {
  return (
    <aside className="... sidebar">
      {/* Existing widgets */}
      
      {/* Ajouter alertes */}
      <StockAlertsWidget maxAlerts={5} />
    </aside>
  )
}
```

---

## Cas de Test Recommandés

### 1. Test de Signal
```
AAPL: RSI=28 (survendu), MACD positif
→ Devrait donner STRONG-BUY

TSLA: RSI=75 (suracheté), MACD négatif
→ Devrait donner SELL
```

### 2. Test de Performance
```
5 trades:
- UPRO buy @ $100, sell @ $108 → +$800 ✓
- GLD buy @ $200, sell @ $193 → -$700 ✗
- SPY buy @ $450, vendre @ $465 → +$750 ✓
- QQQ buy @ $380, vendre @ $375 → -$500 ✗
- IVV buy @ $430, vendre @ $445 → +$600 ✓

Win Rate: 3/5 = 60% ✓
Total: +$950
Avg Return: +3.8% ✓
```

### 3. Test d'Alerte
```
Créer: Alert RSI < 30 pour AMD
AMD price drops → RSI devient 28
→ Devrait déclencher l'alerte ✓
```

---

## Troubleshooting

### ❌ "API 500 Error"
```
→ Vérifier que OPENAI_API_KEY est définie
→ Vérifier que /api/chat fonctionne d'abord
```

### ❌ "Données non enregistrées"
```
→ Vérifier localStorage n'est pas plein
→ const canUseStorage = () → true?
→ Essayer: localStorage.clear() + reload
```

### ❌ "IA ne voit pas les données"
```
→ Vérifier PortfolioProvider enveloppe l'app
→ Vérifier usePortfolio() retourne données
→ Ajouter console.log(portfolioData) dans chat/route.ts
```

### ❌ "Alertes ne s'affichent pas"
```
→ Vérifier loadAlerts() retourne données
→ Vérifier getRecentTriggeredAlerts(60) paramètre
→ Browser console: localStorage.getItem('stock_alerts_v1')
```

---

## Performance & Optimisation

### Indicateurs Techniques Lourd?
```typescript
// Actualiser seulement toutes les 5 minutes au lieu de chaque message
const ANALYSIS_CACHE_MS = 5 * 60 * 1000
```

### Trop d'alerts?
```typescript
// Réduire la fréquence de check
const ALERT_CHECK_INTERVAL_MS = 60 * 1000 // 1 min au lieu de 30s
```

### LocalStorage Trop Grand?
```typescript
// Archiver les analyses > 3 mois
registry.entries = registry.entries.filter(e => {
  const age = Date.now() - new Date(e.createdAt).getTime()
  return age < 90 * 24 * 60 * 60 * 1000 // 90 jours
})
```

---

## Prochain Niveau: Real-Time Data

Pour passer aux **vraies données de marché**:

```typescript
// lib/stock-data-sources.ts (à créer)
import fetch from 'node-fetch'

export async function getStockDataAlphaVantage(symbol: string) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  return fetch(url).then(r => r.json())
}

// Puis utiliser dans /api/stock-analysis
const realData = await getStockDataAlphaVantage(validated.symbol)
const analysis = analyzeStock(symbol, realData.prices, ...)
```

---

## Support & Questions

### 📖 Documentation Complète
→ Voir [OPENNOVA_SYSTEM.md](./OPENNOVA_SYSTEM.md)

### 🔧 Code Examples
→ Voir [lib/stock-analysis-client.ts](./lib/stock-analysis-client.ts)

### 💻 Tests & Debugging
```bash
pnpm test  # Lancer suite de tests (si configurée)
pnpm dev   # Démarrer avec hot reload
```

---

## 🎉 Vous êtes Prêt!

1. ✅ Engine d'analyse créé
2. ✅ API fonctionnelle
3. ✅ Registre persistant
4. ✅ Alertes autonomes
5. ✅ UI complète
6. ✅ Intégration IA Codex

**Démarrez & testez dès maintenant!** 🚀

---

**OpenNova v1.0** | Moteur d'Analyse Boursière Autonome
