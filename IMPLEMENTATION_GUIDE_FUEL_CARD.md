# Fuel Card Integration Implementation Guide

**Priority:** P1 - High Priority
**Status:** Implementation Ready
**Last Updated:** November 16, 2025

## Overview

### Business Value
- Real-time fuel card transaction visibility
- Automatic driver expense reconciliation
- Fraud detection and prevention
- Cost tracking and analytics
- Fuel efficiency monitoring
- Integration with accounting systems

### Technical Complexity
- **Low-Medium:** Straightforward API integrations, moderate data reconciliation
- Two primary API providers (WEX and FleetCor)
- Real-time sync capability or daily batch processing
- Fraud detection requires ML pipeline

### Key Dependencies
- Payment processing infrastructure (Stripe for fee collection)
- Bank account connections (Plaid integration)
- Accounting system integration (QuickBooks, SAP)
- Analytics engine for trend detection

### Timeline Estimate
- **Phase 1 (WEX Integration):** 2-3 weeks
- **Phase 2 (FleetCor Integration):** 2-3 weeks
- **Phase 3 (Reconciliation Engine):** 2-3 weeks
- **Phase 4 (Analytics & Reporting):** 1-2 weeks
- **Phase 5 (Testing & Fraud Detection):** 1-2 weeks
- **Total:** 8-13 weeks

---

## Architecture

### System Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                  FUEL CARD PROVIDERS                        │
│  ┌──────────────┐              ┌──────────────┐             │
│  │    WEX API   │              │ FleetCor API │             │
│  └──────┬───────┘              └──────┬───────┘             │
└─────────┼────────────────────────────┼───────────────────────┘
          │                            │
          └────────────┬───────────────┘
                       │
          ┌────────────▼──────────────┐
          │  API Adapter Service      │
          │  • Provider routing       │
          │  • Data normalization     │
          │  • Rate limiting          │
          └────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌─────────────┐          ┌──────────────────┐
    │ Transaction │          │  Reconciliation  │
    │  Processor  │          │     Engine       │
    └────┬────────┘          └────────┬─────────┘
         │                            │
         └────────────┬───────────────┘
                      │
          ┌───────────▼────────────┐
          │  PostgreSQL Database   │
          │  • Transactions        │
          │  • Reconciliation log  │
          │  • Driver mappings     │
          │  • Fraud scores        │
          └───────────┬────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    ┌────────┐   ┌─────────┐  ┌──────────┐
    │Dashboard│   │Analytics│  │Accounting│
    │Reports  │   │Engine   │  │Integration│
    └────────┘   └─────────┘  └──────────┘
```

### Integration Flow

**Real-Time Integration (WEX):**
```
Transaction at Pump → WEX Webhook → API Endpoint →
Validation → Database Insert → Reconciliation Check →
Real-time Dashboard Update
```

**Batch Integration (FleetCor):**
```
Daily File Export → API Pull (scheduled) →
CSV Parse → Data Normalization → Reconciliation →
Daily Summary Report
```

---

## API Provider Comparison

### WEX (Wright Express)

**Advantages:**
- Real-time webhook notifications
- Comprehensive fraud detection
- Integration with Fuelman®
- Excellent API documentation
- Fast transaction settlement (same day)
- Mobile app support
- Custom alerts and controls

**Disadvantages:**
- Higher card issuance costs
- Account setup fees
- Transaction fees per card
- Requires physical cards

**Integration Details:**
- REST API with OAuth 2.0
- Webhooks for real-time events
- ISO 8601 timestamp format
- Encrypted card data handling
- Rate limits: 1000 req/min per customer

**Pricing:**
- Card setup: $25-50 per card
- Monthly fee: $15-30 per card
- Transaction fee: 2-3% or $0.35 per transaction
- Fraud monitoring: Included

---

### FleetCor

**Advantages:**
- Largest network of fuel stations
- Global coverage
- Maintenance and toll integration
- Excellent reporting tools
- Strong customer support

**Disadvantages:**
- Less modern API
- Batch-only integrations (no webhooks)
- Longer data availability (24-48 hours)
- More complex authentication

**Integration Details:**
- SFTP file delivery option
- REST API (newer offerings)
- CSV/XML format options
- Account-based authentication
- File delivery: Daily 00:30 UTC

**Pricing:**
- Card setup: $35-75 per card
- Monthly fee: $20-40 per card
- Transaction fee: 2-4% + $0.50 minimum
- Reporting: Premium feature

---

## WEX API Integration Guide

### Authentication

```typescript
// src/lib/fuel-cards/wex.ts
import axios, { AxiosInstance } from 'axios';

class WexApiClient {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.WEX_CLIENT_ID!;
    this.clientSecret = process.env.WEX_CLIENT_SECRET!;

    this.axiosInstance = axios.create({
      baseURL: 'https://api.wexinc.com/v4',
      timeout: 30000
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
          await this.refreshToken();
        }
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        return config;
      },
      error => Promise.reject(error)
    );
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post('https://api.wexinc.com/oauth/token', {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'transaction_data fleet_management'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000;
    } catch (error) {
      console.error('Failed to refresh WEX access token:', error);
      throw error;
    }
  }

  async getTransactions(
    startDate: Date,
    endDate: Date,
    options?: { cardId?: string; limit?: number; offset?: number }
  ): Promise<WexTransaction[]> {
    try {
      const response = await this.axiosInstance.get('/transactions', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          cardId: options?.cardId,
          limit: options?.limit || 100,
          offset: options?.offset || 0
        }
      });

      return response.data.transactions || [];
    } catch (error) {
      console.error('Failed to fetch WEX transactions:', error);
      throw error;
    }
  }

  async getCardholder(cardId: string): Promise<WexCardholder> {
    return this.axiosInstance.get(`/cardholders/${cardId}`).then(r => r.data);
  }

  async getCardDetails(cardId: string): Promise<WexCard> {
    return this.axiosInstance.get(`/cards/${cardId}`).then(r => r.data);
  }

  async setCardLimit(cardId: string, limit: number): Promise<void> {
    await this.axiosInstance.put(`/cards/${cardId}`, {
      purchaseLimit: limit,
      purchasePeriod: 'DAILY'
    });
  }

  async reportCardLoss(cardId: string): Promise<void> {
    await this.axiosInstance.put(`/cards/${cardId}`, {
      status: 'CANCELLED'
    });
  }
}

export const wexClient = new WexApiClient();

interface WexTransaction {
  transactionId: string;
  cardId: string;
  cardholderName: string;
  amount: number;
  currency: string;
  transactionDate: string;
  postDate: string;
  merchantName: string;
  merchantCategory: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  location: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

interface WexCardholder {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  driverId: string;
  status: string;
}

interface WexCard {
  id: string;
  cardNumber: string; // Last 4 digits only
  cardholderName: string;
  status: string;
  purchaseLimit: number;
  purchasePeriod: string;
  createdDate: string;
  expirationDate: string;
}
```

### Webhook Handling

```typescript
// src/routes/webhooks/wex.ts
import express from 'express';
import crypto from 'crypto';
import { processWexTransaction } from '../../services/fuel-cards/wexService';

export const wexWebhookRouter = express.Router();

const WEX_WEBHOOK_SECRET = process.env.WEX_WEBHOOK_SECRET!;

/**
 * Verify WEX webhook signature
 */
function verifyWexSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', WEX_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return hmac === signature;
}

wexWebhookRouter.post('/transaction', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-wex-signature'] as string;
    const timestamp = req.headers['x-wex-timestamp'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    if (!verifyWexSignature(payload, signature, timestamp)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Verify timestamp (within 5 minutes)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (Math.abs(currentTime - requestTime) > 300000) {
      return res.status(401).json({ error: 'Request too old' });
    }

    // Process transaction
    const event = req.body;
    console.log('WEX webhook received:', event.eventType);

    switch (event.eventType) {
      case 'transaction.created':
        await processWexTransaction(event.data);
        break;
      case 'transaction.reversed':
        await handleTransactionReversal(event.data);
        break;
      case 'card.lost':
        await handleCardLost(event.data);
        break;
      case 'card.disabled':
        await handleCardDisabled(event.data);
        break;
      default:
        console.warn('Unknown WEX event type:', event.eventType);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('WEX webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

---

## FleetCor API Integration Guide

### SFTP File Integration

```typescript
// src/services/fuel-cards/fleetcorService.ts
import Client from 'ssh2-sftp-client';
import fs from 'fs';
import csv from 'csv-parse';
import { parseFleetcorCSV } from './csvParser';

class FleetcorIntegration {
  private sftp: Client;
  private config = {
    host: process.env.FLEETCOR_SFTP_HOST,
    port: 22,
    username: process.env.FLEETCOR_SFTP_USER,
    password: process.env.FLEETCOR_SFTP_PASSWORD
  };

  async downloadDailyFile(): Promise<string> {
    this.sftp = new Client();

    try {
      await this.sftp.connect(this.config);

      // List files in inbox
      const files = await this.sftp.list('/inbox');

      // Find today's transaction file
      const today = new Date().toISOString().split('T')[0];
      const transactionFile = files.find(f =>
        f.name.includes('transactions') &&
        f.name.includes(today.replace(/-/g, ''))
      );

      if (!transactionFile) {
        throw new Error('No transaction file found for today');
      }

      // Download file
      const localPath = `/tmp/fleetcor_${today}.csv`;
      await this.sftp.get(`/inbox/${transactionFile.name}`, localPath);

      // Move to processed folder
      await this.sftp.rename(
        `/inbox/${transactionFile.name}`,
        `/processed/${transactionFile.name}`
      );

      return localPath;
    } finally {
      await this.sftp.end();
    }
  }

  async parseTransactionFile(filePath: string): Promise<FleetcorTransaction[]> {
    return new Promise((resolve, reject) => {
      const transactions: FleetcorTransaction[] = [];
      const stream = fs.createReadStream(filePath);

      stream
        .pipe(csv({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (row) => {
          const transaction = parseFleetcorCSV(row);
          if (transaction) {
            transactions.push(transaction);
          }
        })
        .on('end', () => resolve(transactions))
        .on('error', reject);
    });
  }

  async syncTransactions(): Promise<number> {
    try {
      const filePath = await this.downloadDailyFile();
      const transactions = await this.parseTransactionFile(filePath);

      let savedCount = 0;
      for (const transaction of transactions) {
        const saved = await saveFuelCardTransaction({
          ...transaction,
          provider: 'fleetcor'
        });
        if (saved) savedCount++;
      }

      console.log(`Synced ${savedCount} FleetCor transactions`);
      return savedCount;
    } catch (error) {
      console.error('FleetCor sync error:', error);
      throw error;
    }
  }
}

interface FleetcorTransaction {
  transactionId: string;
  cardNumber: string;
  cardholderName: string;
  employeeId: string;
  transactionDate: Date;
  postDate: Date;
  merchantName: string;
  amount: number;
  currency: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  category: string;
  odometer?: number;
  notes?: string;
}

export const fleetcorIntegration = new FleetcorIntegration();
```

### Scheduled Sync

```typescript
// src/jobs/syncFuelCards.ts
import cron from 'node-cron';
import { wexClient } from '../lib/fuel-cards/wex';
import { fleetcorIntegration } from '../services/fuel-cards/fleetcorService';

// WEX: Real-time via webhook (no scheduled job needed)

// FleetCor: Daily sync at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  try {
    console.log('Starting FleetCor daily sync...');
    const count = await fleetcorIntegration.syncTransactions();
    console.log(`FleetCor sync completed: ${count} transactions`);
  } catch (error) {
    console.error('FleetCor sync failed:', error);
    // Send alert
    await notifyAdmins({
      subject: 'FleetCor Sync Failed',
      message: `Failed to sync FleetCor transactions: ${error}`
    });
  }
});

// WEX: Periodic validation (hourly)
cron.schedule('0 * * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const transactions = await wexClient.getTransactions(
      yesterday,
      new Date(),
      { limit: 1000 }
    );

    // Validate against database
    await reconcileTransactions(transactions);
  } catch (error) {
    console.error('WEX validation failed:', error);
  }
});
```

---

## Database Schema

### Fuel Card Tables

```sql
CREATE TABLE fuel_card_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL, -- 'wex', 'fleetcor'
  api_key VARCHAR(500) ENCRYPTED,
  api_secret VARCHAR(500) ENCRYPTED,
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(500) ENCRYPTED,
  config JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE TABLE fuel_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL,
  card_number VARCHAR(20) NOT NULL ENCRYPTED,
  cardholder_name VARCHAR(255),
  driver_id UUID,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  issued_date DATE,
  expiration_date DATE,
  daily_limit NUMERIC(12, 2),
  monthly_limit NUMERIC(12, 2),
  provider VARCHAR(50) NOT NULL,
  provider_card_id VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fleet_id) REFERENCES fleets(id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  UNIQUE(card_number),
  INDEX idx_fleet_cards (fleet_id),
  INDEX idx_driver_cards (driver_id),
  INDEX idx_status (status)
);

CREATE TABLE fuel_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_card_id UUID NOT NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  post_date TIMESTAMP WITH TIME ZONE,
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(100),
  product_code VARCHAR(50),
  quantity NUMERIC(12, 2),
  unit_price NUMERIC(12, 2),
  location GEOGRAPHY,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  odometer_reading INTEGER,
  notes TEXT,
  provider VARCHAR(50),
  provider_transaction_id VARCHAR(100),
  raw_data JSONB,
  reconciliation_status VARCHAR(50) DEFAULT 'pending',
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fuel_card_id) REFERENCES fuel_cards(id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_reconciliation_status (reconciliation_status),
  INDEX idx_merchant (merchant_name)
);

CREATE TABLE fuel_card_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_card_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_transactions INTEGER,
  total_amount NUMERIC(15, 2),
  unreconciled_count INTEGER,
  unreconciled_amount NUMERIC(15, 2),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reconciled', 'flagged'
  flagged_reason TEXT,
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fuel_card_id) REFERENCES fuel_cards(id),
  INDEX idx_card_dates (fuel_card_id, start_date, end_date),
  INDEX idx_status (status)
);

CREATE TABLE fuel_card_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  dispute_type VARCHAR(100) NOT NULL, -- 'unauthorized', 'incorrect_amount', 'merchant_error'
  description TEXT,
  driver_id UUID,
  amount NUMERIC(12, 2),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'rejected'
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (transaction_id) REFERENCES fuel_card_transactions(id),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  INDEX idx_status (status)
);

CREATE TABLE fuel_efficiency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  fuel_card_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_fuel_amount NUMERIC(12, 2),
  total_fuel_cost NUMERIC(15, 2),
  average_price_per_gallon NUMERIC(8, 2),
  fuel_efficiency_score NUMERIC(5, 2),
  status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (fuel_card_id) REFERENCES fuel_cards(id),
  INDEX idx_vehicle_period (vehicle_id, period_start)
);

CREATE TABLE fuel_card_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_card_id UUID NOT NULL,
  alert_type VARCHAR(100) NOT NULL, -- 'limit_exceeded', 'fraud_detected', 'unusual_pattern'
  severity VARCHAR(50), -- 'info', 'warning', 'critical'
  description TEXT,
  transaction_id UUID,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (fuel_card_id) REFERENCES fuel_cards(id),
  FOREIGN KEY (transaction_id) REFERENCES fuel_card_transactions(id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id),
  INDEX idx_alert_type (alert_type),
  INDEX idx_severity (severity),
  INDEX idx_detected_at (detected_at)
);
```

### Indexes for Performance

```sql
-- Frequently queried combinations
CREATE INDEX idx_fuel_card_transactions_card_date
  ON fuel_card_transactions(fuel_card_id, transaction_date DESC)
  INCLUDE (amount, merchant_name);

-- Time-series queries
CREATE INDEX idx_transactions_by_period
  ON fuel_card_transactions(transaction_date)
  WHERE reconciliation_status = 'pending';

-- Geospatial queries
CREATE INDEX idx_fuel_transactions_location
  ON fuel_card_transactions USING GIST(location);

-- Reconciliation queries
CREATE INDEX idx_reconciliation_status
  ON fuel_card_reconciliation(status, end_date DESC);
```

---

## Data Mapping

### WEX Transaction → Database

```typescript
function mapWexTransaction(wexTx: WexTransaction): FuelCardTransaction {
  return {
    id: uuidv4(),
    fuel_card_id: findCardByNumber(wexTx.cardId),
    transaction_id: wexTx.transactionId,
    amount: wexTx.amount,
    currency: wexTx.currency,
    transaction_date: new Date(wexTx.transactionDate),
    post_date: new Date(wexTx.postDate),
    merchant_name: wexTx.merchantName,
    merchant_category: wexTx.merchantCategory,
    product_code: wexTx.productCode,
    quantity: wexTx.quantity,
    unit_price: wexTx.unitPrice,
    location: {
      latitude: wexTx.location.latitude,
      longitude: wexTx.location.longitude
    },
    city: wexTx.location.city,
    state: wexTx.location.state,
    country: wexTx.location.country,
    provider: 'wex',
    provider_transaction_id: wexTx.transactionId,
    raw_data: wexTx,
    reconciliation_status: 'pending',
    created_at: new Date()
  };
}
```

### FleetCor CSV → Database

```typescript
function mapFleetcorTransaction(row: any): FuelCardTransaction {
  return {
    id: uuidv4(),
    fuel_card_id: findCardByNumber(row.card_number),
    transaction_id: row.transaction_id,
    amount: parseFloat(row.amount),
    currency: 'USD',
    transaction_date: parseDate(row.transaction_date),
    post_date: parseDate(row.post_date),
    merchant_name: row.merchant_name,
    merchant_category: row.category,
    product_code: row.product_code,
    quantity: parseFloat(row.quantity),
    unit_price: parseFloat(row.unit_price),
    odometer_reading: row.odometer ? parseInt(row.odometer) : null,
    provider: 'fleetcor',
    provider_transaction_id: row.fleetcor_id,
    raw_data: row,
    reconciliation_status: 'pending',
    created_at: new Date()
  };
}
```

---

## Reconciliation Workflow

### Automatic Reconciliation Process

```typescript
// src/services/fuel-cards/reconciliationService.ts
class FuelCardReconciliationService {
  /**
   * Daily reconciliation for completed periods
   */
  async reconcileDailyTransactions(cardId: string, date: Date): Promise<void> {
    const startOfDay = startOfDay(date);
    const endOfDay = endOfDay(date);

    // Get transactions for the day
    const transactions = await db.fuel_card_transactions.findMany({
      where: {
        fuel_card_id: cardId,
        transaction_date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Check limits
    const card = await db.fuel_cards.findUnique({ where: { id: cardId } });
    if (card!.daily_limit && totalAmount > card!.daily_limit) {
      await this.flagForReview({
        card_id: cardId,
        reason: 'DAILY_LIMIT_EXCEEDED',
        amount: totalAmount,
        limit: card!.daily_limit
      });
    }

    // Mark as reconciled
    await db.fuel_card_transactions.updateMany({
      where: {
        fuel_card_id: cardId,
        transaction_date: { gte: startOfDay, lte: endOfDay }
      },
      data: {
        reconciliation_status: 'reconciled',
        reconciled_at: new Date()
      }
    });
  }

  /**
   * Monthly billing reconciliation
   */
  async reconcileMonthlyBilling(cardId: string, month: Date): Promise<void> {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);

    const transactions = await db.fuel_card_transactions.findMany({
      where: {
        fuel_card_id: cardId,
        transaction_date: { gte: startDate, lte: endDate }
      }
    });

    const reconciliation = await db.fuel_card_reconciliation.create({
      data: {
        fuel_card_id: cardId,
        start_date: startDate,
        end_date: endDate,
        total_transactions: transactions.length,
        total_amount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        unreconciled_count: 0,
        unreconciled_amount: 0,
        status: 'reconciled'
      }
    });

    return reconciliation;
  }

  /**
   * Detect unusual patterns
   */
  async detectAnomalies(cardId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Get recent transactions
    const recentTx = await db.fuel_card_transactions.findMany({
      where: {
        fuel_card_id: cardId,
        transaction_date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Check for duplicates
    const duplicates = this.findDuplicateTransactions(recentTx);
    if (duplicates.length > 0) {
      anomalies.push({
        type: 'DUPLICATE_TRANSACTION',
        severity: 'warning',
        transactions: duplicates
      });
    }

    // Check for unusual amounts
    const avgAmount = recentTx.reduce((sum, tx) => sum + tx.amount, 0) / recentTx.length;
    const highAmount = recentTx.filter(tx => tx.amount > avgAmount * 2.5);
    if (highAmount.length > 3) {
      anomalies.push({
        type: 'UNUSUAL_AMOUNTS',
        severity: 'warning',
        count: highAmount.length,
        average: avgAmount
      });
    }

    // Check for geographic anomalies
    const geoAnomalies = this.detectGeographicAnomalies(recentTx);
    if (geoAnomalies.length > 0) {
      anomalies.push({
        type: 'GEOGRAPHIC_ANOMALY',
        severity: 'info',
        locations: geoAnomalies
      });
    }

    return anomalies;
  }

  private findDuplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Map<string, Transaction>();
    const duplicates: Transaction[] = [];

    for (const tx of transactions) {
      const key = `${tx.amount}-${tx.merchant_name}-${tx.transaction_date}`;
      if (seen.has(key)) {
        duplicates.push(tx);
      } else {
        seen.set(key, tx);
      }
    }

    return duplicates;
  }

  private detectGeographicAnomalies(transactions: Transaction[]): Location[] {
    const locations = transactions.map(tx => ({
      city: tx.city,
      state: tx.state,
      country: tx.country,
      date: tx.transaction_date
    }));

    // Check for impossible distances
    const anomalies: Location[] = [];
    for (let i = 0; i < locations.length - 1; i++) {
      const distance = this.calculateDistance(
        locations[i],
        locations[i + 1]
      );
      const timeDiff = (locations[i + 1].date.getTime() - locations[i].date.getTime()) / 1000 / 3600; // hours

      // If > 600 miles in < 1 hour, it's impossible
      if (distance > 600 && timeDiff < 1) {
        anomalies.push(locations[i + 1]);
      }
    }

    return anomalies;
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    // Haversine formula (simplified)
    return 69 * Math.sqrt(
      Math.pow((loc2.latitude - loc1.latitude), 2) +
      Math.pow((loc2.longitude - loc1.longitude), 2)
    );
  }

  private async flagForReview(params: {
    card_id: string;
    reason: string;
    amount?: number;
    limit?: number;
  }): Promise<void> {
    await db.fuel_card_alerts.create({
      data: {
        fuel_card_id: params.card_id,
        alert_type: 'LIMIT_EXCEEDED',
        severity: 'warning',
        description: `${params.reason}: Amount $${params.amount} exceeds limit $${params.limit}`,
        detected_at: new Date()
      }
    });
  }
}

export const reconciliationService = new FuelCardReconciliationService();
```

---

## Error Handling & Retry Logic

```typescript
class FuelCardSyncService {
  private maxRetries = 3;
  private retryDelayMs = 5000;

  async syncWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    cardId: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.log(`${operationName} attempt ${attempt + 1}/${this.maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if retryable
        if (!this.isRetryable(error)) {
          throw error;
        }

        // Log failed attempt
        await db.sync_log.create({
          data: {
            fuel_card_id: cardId,
            operation: operationName,
            attempt: attempt + 1,
            error: lastError.message,
            status: 'failed'
          }
        });

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          console.log(`Retrying after ${delay}ms`);
          await sleep(delay);
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  private isRetryable(error: any): boolean {
    // Retry on network errors, timeouts, 5xx errors
    if (error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.response?.status >= 500) {
      return true;
    }

    // Don't retry on auth errors, 4xx (except 429)
    if (error.response?.status === 401 ||
        error.response?.status === 403 ||
        (error.response?.status >= 400 && error.response?.status !== 429)) {
      return false;
    }

    return true;
  }

  async handleSyncError(error: Error, cardId: string): Promise<void> {
    // Log error
    await db.fuel_card_alerts.create({
      data: {
        fuel_card_id: cardId,
        alert_type: 'SYNC_ERROR',
        severity: 'critical',
        description: `Fuel card sync error: ${error.message}`,
        detected_at: new Date()
      }
    });

    // Notify administrators
    await notifyAdmins({
      subject: 'Fuel Card Sync Error',
      message: `Failed to sync fuel card ${cardId}: ${error.message}`
    });
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('FuelCardReconciliation', () => {
  it('should detect duplicate transactions', () => {
    const transactions = [
      {
        id: '1',
        amount: 75.50,
        merchant_name: 'Shell Station #123',
        transaction_date: new Date('2025-11-16T10:00:00')
      },
      {
        id: '2',
        amount: 75.50,
        merchant_name: 'Shell Station #123',
        transaction_date: new Date('2025-11-16T10:05:00')
      }
    ];

    const duplicates = reconciliationService.findDuplicateTransactions(transactions);
    expect(duplicates).toHaveLength(1);
  });

  it('should flag limit exceeded', async () => {
    const card = { daily_limit: 500 };
    const transactions = [
      { amount: 300 },
      { amount: 250 }
    ];

    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    expect(total > card.daily_limit).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('WEX Integration', () => {
  it('should process real webhook events', async () => {
    const webhookPayload = {
      eventType: 'transaction.created',
      data: {
        transactionId: 'TXN-123',
        cardId: 'CARD-456',
        amount: 50.00,
        merchantName: 'Shell Station',
        transactionDate: '2025-11-16T10:00:00Z'
      }
    };

    await wexWebhookRouter.post('/transaction', {
      body: webhookPayload,
      headers: {
        'x-wex-signature': generateSignature(webhookPayload)
      }
    });

    const saved = await db.fuel_card_transactions.findUnique({
      where: { transaction_id: 'TXN-123' }
    });

    expect(saved).toBeDefined();
  });
});
```

---

## Security Considerations

### API Key Management
- Store in environment variables or secrets vault
- Rotate quarterly
- Use separate keys per environment
- Monitor for unauthorized usage

### Data Encryption
- Encrypt card numbers in database (AES-256)
- Encrypt API secrets at rest
- Use TLS for all API communications
- Implement PCI-DSS compliance

### Payment Processing Security
- Never store full card numbers
- Tokenize card data (Stripe/PaymentGateway)
- Implement fraud detection
- Monitor for suspicious patterns

### Access Control
- Role-based access (Admin, Manager, Driver)
- Limit card visibility to authorized users
- Audit all card-related actions
- Implement MFA for sensitive operations

---

## Cost Analysis

### Development Cost
- WEX Integration: 80 hours × $100 = $8,000
- FleetCor Integration: 80 hours × $100 = $8,000
- Reconciliation Engine: 100 hours × $100 = $10,000
- Testing & QA: 60 hours × $80 = $4,800
- Documentation: 30 hours × $80 = $2,400

**Total Development:** $33,200

### Infrastructure Cost (Monthly)
- Database storage: $100
- API hosting: $200
- Monitoring: $50
- **Total Monthly:** $350 (~$4,200/year)

### Provider Costs (Per Vehicle)
**Small Fleet (100 vehicles):**
- WEX: 100 × $25 (setup) + 100 × $20 (monthly) = $3,500/year
- FleetCor: 100 × $50 (setup) + 100 × $25 (monthly) = $4,000/year

**Year 1 Total:** $33,200 + $4,200 + $3,500 = $40,900
**Year 2+ Annual:** $4,200 + $3,500 = $7,700

### ROI Calculation
**Benefits:**
- Fuel cost reduction (5-10%): $50,000/year
- Expense tracking automation: $15,000/year
- Fraud prevention: $10,000/year
- **Total Annual Benefit:** $75,000

**Year 1 ROI:** ($75,000 - $40,900) / $40,900 = **83% ROI**
**Payback Period:** 6-7 months

---

## Success Metrics

- **Integration Coverage:** 100% of fuel card transactions captured
- **Reconciliation Accuracy:** > 99.5%
- **Sync Latency:** < 5 minutes (WEX), < 24 hours (FleetCor)
- **Fraud Detection Rate:** > 90% of anomalies flagged
- **System Uptime:** > 99.9%
- **Customer Adoption:** > 70% of fleets within 6 months

---

**Document Version:** 1.0
**Last Updated:** November 16, 2025
**Owner:** Technical Implementation Specialist
**Status:** Ready for Engineering Review
