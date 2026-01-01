# **TO_BE_DESIGN.md**
**Fuel Management System - Next-Generation Architecture**

---

## **Table of Contents**
1. [Executive Vision](#executive-vision)
2. [Performance Enhancements](#performance-enhancements)
3. [Real-Time Features](#real-time-features)
4. [AI/ML Capabilities](#aiml-capabilities)
5. [Progressive Web App (PWA) Features](#progressive-web-app-pwa-features)
6. [WCAG 2.1 AAA Accessibility](#wcag-21-aaa-accessibility)
7. [Advanced Search and Filtering](#advanced-search-and-filtering)
8. [Third-Party Integrations](#third-party-integrations)
9. [Gamification System](#gamification-system)
10. [Analytics Dashboards](#analytics-dashboards)
11. [Security Hardening](#security-hardening)
12. [Comprehensive Testing](#comprehensive-testing)
13. [Kubernetes Deployment](#kubernetes-deployment)
14. [Database Migration Strategy](#database-migration-strategy)
15. [Key Performance Indicators (KPIs)](#key-performance-indicators-kpis)
16. [Risk Mitigation](#risk-mitigation)

---

## **Executive Vision**
*(100+ lines minimum)*

### **1. Strategic Vision**
The **next-generation Fuel Management System (FMS)** will revolutionize fleet operations by integrating **real-time analytics, AI-driven predictions, and seamless third-party integrations** to optimize fuel efficiency, reduce costs, and enhance operational transparency. This system will serve as the **cornerstone of digital transformation** for logistics, aviation, and maritime industries, ensuring **scalability, security, and compliance** with global fuel regulations.

### **2. Business Transformation Goals**
- **Cost Reduction:** Achieve **15-20% fuel savings** through AI-driven route optimization and anomaly detection.
- **Operational Efficiency:** Reduce manual fuel tracking by **90%** via automated IoT sensor integration.
- **Regulatory Compliance:** Ensure **100% adherence** to EPA, IMO, and EU fuel emission standards.
- **Customer Experience:** Provide **real-time fuel tracking dashboards** for fleet managers and drivers.
- **Sustainability:** Reduce carbon footprint by **25%** through predictive maintenance and fuel-efficient routing.

### **3. User Experience Improvements**
- **Mobile-First Design:** Progressive Web App (PWA) with **offline capabilities** for remote operations.
- **Voice-Activated Commands:** Integration with **Amazon Alexa and Google Assistant** for hands-free fuel logging.
- **Augmented Reality (AR) Overlays:** Real-time fuel level visualization via **AR glasses** for maintenance crews.
- **Personalized Dashboards:** Role-based UIs for **drivers, fleet managers, and executives** with customizable widgets.
- **Multi-Language Support:** **12+ languages** with dynamic localization.

### **4. Competitive Advantages**
| **Feature**               | **Competitor A** | **Competitor B** | **Our FMS** |
|---------------------------|------------------|------------------|-------------|
| Real-Time Fuel Monitoring | ❌ No            | ✅ Yes           | ✅ **AI-Powered** |
| Predictive Maintenance    | ❌ No            | ❌ No            | ✅ **ML-Driven** |
| PWA Offline Mode          | ❌ No            | ❌ No            | ✅ **Full Offline Support** |
| Third-Party Integrations  | Limited (2)      | Basic (3)        | ✅ **10+ Integrations** |
| WCAG 2.1 AAA Compliance   | ❌ No            | ❌ No            | ✅ **Fully Compliant** |

### **5. Long-Term Roadmap**
| **Phase** | **Timeline** | **Key Deliverables** |
|-----------|-------------|----------------------|
| **Phase 1 (Q1 2024)** | 3 months | Core FMS, PWA, Basic AI Analytics |
| **Phase 2 (Q3 2024)** | 6 months | Advanced ML, AR Integration, Blockchain for Fuel Tracking |
| **Phase 3 (Q1 2025)** | 9 months | Autonomous Fuel Optimization, Carbon Credit Trading |
| **Phase 4 (Q3 2025)** | 12 months | Global Expansion, Multi-Cloud Deployment |

---

## **Performance Enhancements**
*(250+ lines minimum)*

### **1. Redis Caching Layer**
```typescript
// src/cache/redisCache.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

class RedisCache {
  private client: RedisClientType;
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    this.client.connect().catch((err) => {
      logger.error('Redis Connection Error:', err);
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await this.client.set(key, stringValue, {
        EX: ttl || this.DEFAULT_TTL,
      });
      logger.info(`Cached key: ${key}`);
    } catch (err) {
      logger.error(`Failed to cache key ${key}:`, err);
      throw new Error('Redis set operation failed');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      logger.error(`Failed to retrieve key ${key}:`, err);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logger.info(`Deleted key: ${key}`);
    } catch (err) {
      logger.error(`Failed to delete key ${key}:`, err);
      throw new Error('Redis delete operation failed');
    }
  }

  async clearCache(pattern: string = '*'): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (err) {
      logger.error('Failed to clear cache:', err);
      throw new Error('Redis clear operation failed');
    }
  }
}

export const redisCache = new RedisCache();
```

### **2. Database Query Optimization**
```typescript
// src/database/queryOptimizer.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class QueryOptimizer {
  async getFuelConsumptionReport(vehicleId: string, startDate: Date, endDate: Date) {
    try {
      // Optimized query with indexing on vehicleId and timestamp
      const report = await prisma.fuelTransaction.findMany({
        where: {
          vehicleId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          amount: true,
          timestamp: true,
          odometerReading: true,
          location: true,
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Calculate fuel efficiency (km/l)
      const efficiencyData = report.map((entry, index) => {
        if (index === 0) return null;
        const distance = entry.odometerReading - report[index - 1].odometerReading;
        const fuelUsed = report[index - 1].amount;
        return {
          timestamp: entry.timestamp,
          efficiency: distance / fuelUsed,
        };
      }).filter(Boolean);

      return {
        transactions: report,
        efficiency: efficiencyData,
      };
    } catch (err) {
      logger.error('Failed to fetch fuel consumption report:', err);
      throw new Error('Database query failed');
    }
  }

  async batchInsertFuelTransactions(transactions: Array<{
    vehicleId: string;
    amount: number;
    timestamp: Date;
    odometerReading: number;
    location: string;
  }>) {
    try {
      // Use Prisma's $transaction for batch inserts
      await prisma.$transaction(
        transactions.map((tx) =>
          prisma.fuelTransaction.create({
            data: tx,
          })
        )
      );
      logger.info(`Inserted ${transactions.length} fuel transactions in batch`);
    } catch (err) {
      logger.error('Batch insert failed:', err);
      throw new Error('Database batch insert failed');
    }
  }
}

export const queryOptimizer = new QueryOptimizer();
```

### **3. API Response Compression**
```typescript
// src/middleware/compressionMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { logger } from '../utils/logger';

export const compressionMiddleware = compression({
  level: 6, // Optimal balance between speed and compression
  threshold: 0, // Compress all responses
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

export const customCompression = (req: Request, res: Response, next: NextFunction) => {
  try {
    const originalSend = res.send;
    res.send = function (body: any) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      return originalSend.call(this, body);
    };
    next();
  } catch (err) {
    logger.error('Compression middleware error:', err);
    next(err);
  }
};
```

### **4. Lazy Loading Implementation**
```typescript
// src/utils/lazyLoader.ts
import { logger } from './logger';

type LazyLoadable<T> = () => Promise<T>;

class LazyLoader {
  private cache: Map<string, any> = new Map();
  private loadingPromises: Map<string, Promise<any>> = new Map();

  async load<T>(key: string, loader: LazyLoadable<T>): Promise<T> {
    if (this.cache.has(key)) {
      logger.info(`Returning cached value for key: ${key}`);
      return this.cache.get(key);
    }

    if (this.loadingPromises.has(key)) {
      logger.info(`Waiting for existing load of key: ${key}`);
      return this.loadingPromises.get(key);
    }

    const loadPromise = loader()
      .then((value) => {
        this.cache.set(key, value);
        this.loadingPromises.delete(key);
        return value;
      })
      .catch((err) => {
        this.loadingPromises.delete(key);
        logger.error(`Failed to load key ${key}:`, err);
        throw err;
      });

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  clear(key: string): void {
    this.cache.delete(key);
    this.loadingPromises.delete(key);
    logger.info(`Cleared lazy-loaded key: ${key}`);
  }
}

export const lazyLoader = new LazyLoader();
```

### **5. Request Debouncing**
```typescript
// src/utils/debouncer.ts
import { logger } from './logger';

class Debouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  debounce(key: string, callback: () => void, delay: number = 300): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.timers.set(
      key,
      setTimeout(() => {
        try {
          callback();
          this.timers.delete(key);
        } catch (err) {
          logger.error(`Debounced function failed for key ${key}:`, err);
        }
      }, delay)
    );
  }

  cancel(key: string): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
      logger.info(`Cancelled debounced key: ${key}`);
    }
  }
}

export const debouncer = new Debouncer();
```

### **6. Connection Pooling**
```typescript
// src/database/connectionPool.ts
import { Pool } from 'pg';
import { logger } from '../utils/logger';

class ConnectionPool {
  private pool: Pool;
  private readonly MAX_CONNECTIONS = 20;
  private readonly IDLE_TIMEOUT = 30000; // 30 seconds

  constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      max: this.MAX_CONNECTIONS,
      idleTimeoutMillis: this.IDLE_TIMEOUT,
    });

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL connection pool error:', err);
    });
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const start = Date.now();
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      logger.info(`Executed query: ${text} (${duration}ms)`);
      return result;
    } catch (err) {
      logger.error(`Query failed: ${text}`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getClient() {
    return this.pool.connect();
  }

  async end() {
    await this.pool.end();
    logger.info('PostgreSQL connection pool closed');
  }
}

export const connectionPool = new ConnectionPool();
```

---

## **Real-Time Features**
*(300+ lines minimum)*

### **1. WebSocket Server Setup**
```typescript
// src/websocket/server.ts
import { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../utils/logger';
import { authenticateWebSocket } from './auth';
import { handleFuelUpdate } from './handlers/fuelUpdate';
import { handleVehicleStatus } from './handlers/vehicleStatus';

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    logger.info('WebSocket server initialized');
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    try {
      const user = await authenticateWebSocket(req);
      if (!user) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      const vehicleId = req.url?.split('=')[1];
      if (!vehicleId) {
        ws.close(1003, 'Vehicle ID required');
        return;
      }

      if (!this.clients.has(vehicleId)) {
        this.clients.set(vehicleId, new Set());
      }
      this.clients.get(vehicleId)?.add(ws);

      ws.on('message', (message) => {
        this.handleMessage(ws, message, vehicleId);
      });

      ws.on('close', () => {
        this.clients.get(vehicleId)?.delete(ws);
        logger.info(`Client disconnected from vehicle ${vehicleId}`);
      });

      logger.info(`Client connected to vehicle ${vehicleId}`);
    } catch (err) {
      logger.error('WebSocket connection error:', err);
      ws.close(1011, 'Internal server error');
    }
  }

  private handleMessage(ws: WebSocket, message: any, vehicleId: string) {
    try {
      const data = JSON.parse(message.toString());
      switch (data.type) {
        case 'FUEL_UPDATE':
          handleFuelUpdate(vehicleId, data.payload);
          break;
        case 'VEHICLE_STATUS':
          handleVehicleStatus(vehicleId, data.payload);
          break;
        default:
          logger.warn(`Unknown message type: ${data.type}`);
      }
    } catch (err) {
      logger.error('Failed to parse WebSocket message:', err);
    }
  }

  broadcast(vehicleId: string, message: any) {
    const clients = this.clients.get(vehicleId);
    if (!clients) return;

    const payload = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

export const webSocketManager = (server: any) => new WebSocketManager(server);
```

### **2. Real-Time Event Handlers**
```typescript
// src/websocket/handlers/fuelUpdate.ts
import { webSocketManager } from '../server';
import { logger } from '../../utils/logger';
import { prisma } from '../../database/prisma';

export const handleFuelUpdate = async (vehicleId: string, payload: any) => {
  try {
    const { amount, odometer, location } = payload;

    // Validate payload
    if (!amount || !odometer || !location) {
      throw new Error('Invalid fuel update payload');
    }

    // Store in database
    await prisma.fuelTransaction.create({
      data: {
        vehicleId,
        amount,
        odometerReading: odometer,
        location,
        timestamp: new Date(),
      },
    });

    // Broadcast to all connected clients
    webSocketManager.broadcast(vehicleId, {
      type: 'FUEL_UPDATE_CONFIRMED',
      payload: { amount, odometer, location },
    });

    logger.info(`Fuel update processed for vehicle ${vehicleId}`);
  } catch (err) {
    logger.error('Failed to handle fuel update:', err);
    webSocketManager.broadcast(vehicleId, {
      type: 'ERROR',
      payload: { message: 'Fuel update failed' },
    });
  }
};
```

### **3. Client-Side WebSocket Integration**
```typescript
// src/frontend/websocket/client.ts
import { logger } from '../utils/logger';

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000;

  constructor(private vehicleId: string, private onMessage: (data: any) => void) {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/ws?vehicleId=${this.vehicleId}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      logger.info(`WebSocket connected to vehicle ${this.vehicleId}`);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (err) {
        logger.error('Failed to parse WebSocket message:', err);
      }
    };

    this.socket.onclose = () => {
      logger.warn(`WebSocket disconnected from vehicle ${this.vehicleId}`);
      this.reconnect();
    };

    this.socket.onerror = (err) => {
      logger.error('WebSocket error:', err);
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect();
    }, this.RECONNECT_DELAY * this.reconnectAttempts);
  }

  send(message: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      logger.warn('WebSocket not connected, message not sent');
    }
  }

  close() {
    this.socket?.close();
  }
}

export const createWebSocketClient = (vehicleId: string, onMessage: (data: any) => void) =>
  new WebSocketClient(vehicleId, onMessage);
```

### **4. Room/Channel Management**
```typescript
// src/websocket/rooms.ts
import { webSocketManager } from './server';
import { logger } from '../utils/logger';

class RoomManager {
  private rooms: Map<string, Set<string>> = new Map(); // roomId -> Set<vehicleIds>

  joinRoom(roomId: string, vehicleId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)?.add(vehicleId);
    logger.info(`Vehicle ${vehicleId} joined room ${roomId}`);
  }

  leaveRoom(roomId: string, vehicleId: string) {
    this.rooms.get(roomId)?.delete(vehicleId);
    logger.info(`Vehicle ${vehicleId} left room ${roomId}`);
  }

  broadcastToRoom(roomId: string, message: any) {
    const vehicleIds = this.rooms.get(roomId);
    if (!vehicleIds) return;

    vehicleIds.forEach((vehicleId) => {
      webSocketManager.broadcast(vehicleId, message);
    });
  }
}

export const roomManager = new RoomManager();
```

### **5. Reconnection Logic**
```typescript
// src/websocket/reconnect.ts
import { logger } from '../utils/logger';

class ReconnectionManager {
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly BASE_DELAY = 1000;
  private readonly MAX_DELAY = 30000;

  scheduleReconnect(vehicleId: string, callback: () => void) {
    if (this.reconnectTimers.has(vehicleId)) {
      clearTimeout(this.reconnectTimers.get(vehicleId));
    }

    const delay = Math.min(
      this.BASE_DELAY * Math.pow(2, this.reconnectTimers.size),
      this.MAX_DELAY
    );

    this.reconnectTimers.set(
      vehicleId,
      setTimeout(() => {
        callback();
        this.reconnectTimers.delete(vehicleId);
      }, delay)
    );

    logger.info(`Scheduled reconnect for vehicle ${vehicleId} in ${delay}ms`);
  }

  cancelReconnect(vehicleId: string) {
    if (this.reconnectTimers.has(vehicleId)) {
      clearTimeout(this.reconnectTimers.get(vehicleId));
      this.reconnectTimers.delete(vehicleId);
      logger.info(`Cancelled reconnect for vehicle ${vehicleId}`);
    }
  }
}

export const reconnectionManager = new ReconnectionManager();
```

---

## **AI/ML Capabilities**
*(250+ lines minimum)*

### **1. Predictive Model Training**
```python
# src/ml/train_fuel_efficiency.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FuelEfficiencyModel:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.model_path = "models/fuel_efficiency_model.pkl"
        self.scaler_path = "models/scaler.pkl"

    def load_data(self, file_path):
        """Load and preprocess fuel transaction data"""
        try:
            df = pd.read_csv(file_path)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month

            # Calculate fuel efficiency (km/l)
            df['distance'] = df.groupby('vehicle_id')['odometer_reading'].diff()
            df['fuel_efficiency'] = df['distance'] / df['amount']

            # Drop rows with missing values
            df = df.dropna(subset=['fuel_efficiency'])

            return df
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise

    def train(self, data):
        """Train the predictive model"""
        try:
            # Feature engineering
            features = ['amount', 'odometer_reading', 'hour', 'day_of_week', 'month']
            X = data[features]
            y = data['fuel_efficiency']

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)

            # Train model
            self.model.fit(X_train_scaled, y_train)

            # Evaluate
            predictions = self.model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, predictions)
            logger.info(f"Model trained with MAE: {mae:.2f}")

            return mae
        except Exception as e:
            logger.error(f"Training failed: {e}")
            raise

    def save_model(self):
        """Save model and scaler to disk"""
        try:
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            logger.info("Model and scaler saved successfully")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            raise

    def load_model(self):
        """Load model and scaler from disk"""
        try:
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
            logger.info("Model and scaler loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def predict(self, input_data):
        """Make predictions on new data"""
        try:
            input_scaled = self.scaler.transform([input_data])
            prediction = self.model.predict(input_scaled)
            return prediction[0]
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise

if __name__ == "__main__":
    model = FuelEfficiencyModel()

    # Load and preprocess data
    data = model.load_data("data/fuel_transactions.csv")

    # Train model
    mae = model.train(data)

    # Save model
    model.save_model()

    logger.info("Training completed successfully")
```

### **2. Real-Time Inference API**
```python
# src/ml/inference_api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import logging
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class FuelPredictionRequest(BaseModel):
    amount: float
    odometer_reading: float
    hour: int
    day_of_week: int
    month: int

class FuelPredictionResponse(BaseModel):
    predicted_efficiency: float
    confidence: float

# Load model and scaler
try:
    model = joblib.load("models/fuel_efficiency_model.pkl")
    scaler = joblib.load("models/scaler.pkl")
    logger.info("Model and scaler loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

@app.post("/predict", response_model=FuelPredictionResponse)
async def predict_fuel_efficiency(request: FuelPredictionRequest):
    try:
        # Prepare input data
        input_data = [
            request.amount,
            request.odometer_reading,
            request.hour,
            request.day_of_week,
            request.month
        ]

        # Scale input
        input_scaled = scaler.transform([input_data])

        # Make prediction
        prediction = model.predict(input_scaled)[0]

        # Calculate confidence (simplified)
        confidence = 0.95 if prediction > 0 else 0.85

        return {
            "predicted_efficiency": float(prediction),
            "confidence": confidence
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### **3. Feature Engineering Pipeline**
```python
# src/ml/feature_engineering.py
import pandas as pd
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FeatureEngineer:
    @staticmethod
    def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for fuel efficiency prediction"""
        try:
            # Convert timestamp
            df['timestamp'] = pd.to_datetime(df['timestamp'])

            # Extract temporal features
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['month'] = df['timestamp'].dt.month

            # Calculate distance traveled
            df['distance'] = df.groupby('vehicle_id')['odometer_reading'].diff()

            # Calculate fuel efficiency (km/l)
            df['fuel_efficiency'] = df['distance'] / df['amount']

            # Handle missing values
            df['fuel_efficiency'] = df['fuel_efficiency'].fillna(0)

            # Add rolling averages
            df['rolling_avg_efficiency'] = df.groupby('vehicle_id')['fuel_efficiency'].transform(
                lambda x: x.rolling(5, min_periods=1).mean()
            )

            # Add fuel consumption rate (l/km)
            df['consumption_rate'] = df['amount'] / df['distance'].replace(0, 1)

            return df
        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise

    @staticmethod
    def prepare_inference_data(row: dict) -> list:
        """Prepare single row for model inference"""
        try:
            return [
                row['amount'],
                row['odometer_reading'],
                row['hour'],
                row['day_of_week'],
                row['month']
            ]
        except Exception as e:
            logger.error(f"Failed to prepare inference data: {e}")
            raise

if __name__ == "__main__":
    # Example usage
    data = pd.DataFrame({
        'vehicle_id': [1, 1, 2, 2],
        'timestamp': ['2023-01-01 08:00', '2023-01-01 12:00', '2023-01-01 09:00', '2023-01-01 13:00'],
        'amount': [50, 45, 60, 55],
        'odometer_reading': [1000, 1050, 2000, 2060]
    })

    engineered_data = FeatureEngineer.engineer_features(data)
    print(engineered_data[['hour', 'day_of_week', 'fuel_efficiency']])
```

### **4. Model Monitoring and Retraining**
```python
# src/ml/model_monitor.py
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error
import joblib
import logging
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitor:
    def __init__(self):
        self.model = joblib.load("models/fuel_efficiency_model.pkl")
        self.scaler = joblib.load("models/scaler.pkl")
        self.performance_threshold = 0.5  # MAE threshold for retraining
        self.last_retrain_date = datetime.now()

    def evaluate_model(self, new_data: pd.DataFrame) -> float:
        """Evaluate model performance on new data"""
        try:
            # Prepare features
            features = ['amount', 'odometer_reading', 'hour', 'day_of_week', 'month']
            X = new_data[features]
            y = new_data['fuel_efficiency']

            # Scale features
            X_scaled = self.scaler.transform(X)

            # Make predictions
            predictions = self.model.predict(X_scaled)

            # Calculate MAE
            mae = mean_absolute_error(y, predictions)
            logger.info(f"Model evaluation MAE: {mae:.2f}")

            return mae
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            raise

    def check_retraining_needed(self, mae: float) -> bool:
        """Check if model needs retraining"""
        if mae > self.performance_threshold:
            logger.warning(f"Model performance degraded (MAE: {mae:.2f})")
            return True
        return False

    def retrain_model(self, new_data: pd.DataFrame):
        """Retrain the model with new data"""
        try:
            from train_fuel_efficiency import FuelEfficiencyModel

            # Combine old and new data
            old_data = pd.read_csv("data/fuel_transactions.csv")
            combined_data = pd.concat([old_data, new_data], ignore_index=True)

            # Retrain
            model = FuelEfficiencyModel()
            model.load_data("data/combined_transactions.csv")  # Save combined data
            model.train(combined_data)
            model.save_model()

            self.last_retrain_date = datetime.now()
            logger.info("Model retrained successfully")

            # Send notification
            self.send_retrain_notification()
        except Exception as e:
            logger.error(f"Retraining failed: {e}")
            raise

    def send_retrain_notification(self):
        """Send email notification about model retraining"""
        try:
            msg = MIMEText(f"Fuel efficiency model was retrained on {datetime.now()}")
            msg['Subject'] = 'Model Retraining Notification'
            msg['From'] = 'monitoring@fuelmanagement.com'
            msg['To'] = 'data-team@fuelmanagement.com'

            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login('user', 'password')
                server.send_message(msg)

            logger.info("Retraining notification sent")
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")

    def monitor(self):
        """Run monitoring checks"""
        try:
            # Load recent data (last 7 days)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=7)
            new_data = pd.read_csv("data/recent_transactions.csv")
            new_data = new_data[
                (new_data['timestamp'] >= start_date) &
                (new_data['timestamp'] <= end_date)
            ]

            if len(new_data) < 10:
                logger.info("Not enough new data for evaluation")
                return

            # Evaluate model
            mae = self.evaluate_model(new_data)

            # Check if retraining is needed
            if self.check_retraining_needed(mae):
                self.retrain_model(new_data)
        except Exception as e:
            logger.error(f"Monitoring failed: {e}")

if __name__ == "__main__":
    monitor = ModelMonitor()
    monitor.monitor()
```

---

## **Progressive Web App (PWA) Features**
*(200+ lines minimum)*

### **1. Service Worker Registration**
```typescript
// src/frontend/service-worker/register.ts
import { logger } from '../utils/logger';

class ServiceWorkerManager {
  private readonly SERVICE_WORKER_PATH = '/sw.js';
  private registration: ServiceWorkerRegistration | null = null;

  async register() {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service Worker not supported in this browser');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register(
        this.SERVICE_WORKER_PATH,
        { scope: '/' }
      );

      logger.info('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              logger.info('New Service Worker available, prompting for update');
              this.showUpdatePrompt();
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        this.checkForUpdates();
      }, 60 * 60 * 1000); // Every hour
    } catch (err) {
      logger.error('Service Worker registration failed:', err);
    }
  }

  private async checkForUpdates() {
    try {
      if (this.registration) {
        await this.registration.update();
      }
    } catch (err) {
      logger.error('Failed to check for Service Worker updates:', err);
    }
  }

  private showUpdatePrompt() {
    const updatePrompt = document.createElement('div');
    updatePrompt.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 15px; border-radius: 5px; z-index: 1000;">
        <p>A new version of the app is available.</p>
        <button id="reload-btn" style="margin-top: 10px; padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload
        </button>
      </div>
    `;

    document.body.appendChild(updatePrompt);

    const reloadBtn = document.getElementById('reload-btn');
    reloadBtn?.addEventListener('click', () => {
      window.location.reload();
    });
  }

  async unregister() {
    if (this.registration) {
      await this.registration.unregister();
      logger.info('Service Worker unregistered');
    }
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
```

### **2. Caching Strategies**
```typescript
// src/frontend/service-worker/sw.ts
const CACHE_NAME = 'fuel-management-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/js/app.js',
  '/assets/images/logo.png',
  '/offline.html',
];

// Install event - cache core assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => {
        console.error('Failed to cache assets:', err);
      })
  );
});

// Fetch event - serve cached assets or fetch from network
self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Fetch from network
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Network error', { status: 503 });
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});
```

### **3. Offline Functionality**
```typescript
// src/frontend/offline/offlineManager.ts
import { logger } from '../utils/logger';
import { FuelTransaction } from '../types';

class OfflineManager {
  private readonly OFFLINE_STORAGE_KEY = 'offline_fuel_transactions';
  private readonly MAX_OFFLINE_TRANSACTIONS = 50;

  constructor() {
    window.addEventListener('online', () => this.syncOfflineTransactions());
  }

  async storeOfflineTransaction(transaction: FuelTransaction) {
    try {
      const offlineTransactions = this.getOfflineTransactions();
      offlineTransactions.push(transaction);

      // Limit the number of stored transactions
      if (offlineTransactions.length > this.MAX_OFFLINE_TRANSACTIONS) {
        offlineTransactions.shift();
      }

      localStorage.setItem(
        this.OFFLINE_STORAGE_KEY,
        JSON.stringify(offlineTransactions)
      );

      logger.info('Stored fuel transaction offline');
    } catch (err) {
      logger.error('Failed to store offline transaction:', err);
    }
  }

  getOfflineTransactions(): FuelTransaction[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      logger.error('Failed to retrieve offline transactions:', err);
      return [];
    }
  }

  async syncOfflineTransactions() {
    if (!navigator.onLine) {
      logger.info('Device is offline, skipping sync');
      return;
    }

    try {
      const offlineTransactions = this.getOfflineTransactions();
      if (offlineTransactions.length === 0) return;

      const response = await fetch('/api/fuel-transactions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offlineTransactions),
      });

      if (response.ok) {
        localStorage.removeItem(this.OFFLINE_STORAGE_KEY);
        logger.info(`Synced ${offlineTransactions.length} offline transactions`);
      } else {
        logger.error('Failed to sync offline transactions');
      }
    } catch (err) {
      logger.error('Sync failed:', err);
    }
  }

  clearOfflineTransactions() {
    localStorage.removeItem(this.OFFLINE_STORAGE_KEY);
    logger.info('Cleared offline transactions');
  }
}

export const offlineManager = new OfflineManager();
```

### **4. Background Sync**
```typescript
// src/frontend/background-sync/syncManager.ts
import { logger } from '../utils/logger';

class BackgroundSyncManager {
  private readonly SYNC_TAG = 'fuel-transaction-sync';

  async registerSync() {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      logger.warn('Background Sync not supported in this browser');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(this.SYNC_TAG);
      logger.info('Background sync registered');
    } catch (err) {
      logger.error('Failed to register background sync:', err);
    }
  }

  async handleSyncEvent() {
    const registration = await navigator.serviceWorker.ready;
    registration.addEventListener('sync', (event) => {
      if (event.tag === this.SYNC_TAG) {
        event.waitUntil(this.syncOfflineTransactions());
      }
    });
  }

  private async syncOfflineTransactions(): Promise<void> {
    try {
      const offlineTransactions = this.getOfflineTransactions();
      if (offlineTransactions.length === 0) return;

      const response = await fetch('/api/fuel-transactions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offlineTransactions),
      });

      if (response.ok) {
        this.clearOfflineTransactions();
        logger.info(`Synced ${offlineTransactions.length} transactions via background sync`);
      } else {
        throw new Error('Sync failed');
      }
    } catch (err) {
      logger.error('Background sync failed:', err);
      throw err; // Let the browser retry later
    }
  }

  private getOfflineTransactions(): any[] {
    const data = localStorage.getItem('offline_fuel_transactions');
    return data ? JSON.parse(data) : [];
  }

  private clearOfflineTransactions() {
    localStorage.removeItem('offline_fuel_transactions');
  }
}

export const backgroundSyncManager = new BackgroundSyncManager();
```

---

## **WCAG 2.1 AAA Accessibility**
*(200+ lines minimum)*

### **1. ARIA Implementation**
```typescript
// src/frontend/accessibility/aria.ts
import { logger } from '../utils/logger';

class ARIAManager {
  setAriaAttributes(element: HTMLElement, attributes: Record<string, string>) {
    try {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      logger.info('ARIA attributes set successfully');
    } catch (err) {
      logger.error('Failed to set ARIA attributes:', err);
    }
  }

  createAccessibleButton(
    text: string,
    onClick: () => void,
    ariaLabel?: string,
    ariaPressed?: boolean
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);

    this.setAriaAttributes(button, {
      'aria-label': ariaLabel || text,
      'aria-pressed': ariaPressed ? 'true' : 'false',
      'role': 'button',
    });

    return button;
  }

  createAccessibleModal(
    title: string,
    content: string,
    onClose: () => void
  ): HTMLElement {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    const modalTitle = document.createElement('h2');
    modalTitle.id = 'modal-title';
    modalTitle.textContent = title;

    const modalContent = document.createElement('div');
    modalContent.textContent = content;

    const closeButton = this.createAccessibleButton(
      'Close',
      onClose,
      'Close modal'
    );

    modal.appendChild(modalTitle);
    modal.appendChild(modalContent);
    modal.appendChild(closeButton);

    return modal;
  }

  createAccessibleFormField(
    label: string,
    inputType: string,
    inputId: string,
    required: boolean = false
  ): HTMLElement {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const formLabel = document.createElement('label');
    formLabel.htmlFor = inputId;
    formLabel.textContent = label;

    const input = document.createElement('input');
    input.type = inputType;
    input.id = inputId;
    input.required = required;

    this.setAriaAttributes(input, {
      'aria-labelledby': `${inputId}-label`,
      'aria-required': required ? 'true' : 'false',
    });

    formGroup.appendChild(formLabel);
    formGroup.appendChild(input);

    return formGroup;
  }
}

export const ariaManager = new ARIAManager();
```

### **2. Keyboard Navigation**
```typescript
// src/frontend/accessibility/keyboardNavigation.ts
import { logger } from '../utils/logger';

class KeyboardNavigation {
  private focusableElements: NodeListOf<HTMLElement>;
  private currentFocusIndex = 0;

  constructor() {
    this.focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    this.setupKeyboardNavigation();
  }

  private setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        this.handleArrowNavigation(e);
      }
    });
  }

  private handleTabNavigation(e: KeyboardEvent) {
    if (e.shiftKey) {
      // Shift+Tab - move focus backward
      this.currentFocusIndex =
        (this.currentFocusIndex - 1 + this.focusableElements.length) %
        this.focusableElements.length;
    } else {
      // Tab - move focus forward
      this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length;
    }

    this.focusableElements[this.currentFocusIndex].focus();
    e.preventDefault();
  }

  private handleArrowNavigation(e: KeyboardEvent) {
    const currentElement = document.activeElement as HTMLElement;
    const isVertical = e.key === 'ArrowDown' || e.key === 'ArrowUp';

    if (isVertical) {
      const nextIndex = e.key === 'ArrowDown'
        ? this.currentFocusIndex + 1
        : this.currentFocusIndex - 1;

      if (nextIndex >= 0 && nextIndex < this.focusableElements.length) {
        this.currentFocusIndex = nextIndex;
        this.focusableElements[this.currentFocusIndex].focus();
        e.preventDefault();
      }
    }
  }

  focusFirstElement() {
    if (this.focusableElements.length > 0) {
      this.currentFocusIndex = 0;
      this.focusableElements[0].focus();
    }
  }

  trapFocus(container: HTMLElement) {
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = Array.from(
          container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
  }
}

export const keyboardNavigation = new KeyboardNavigation();
```

### **3. Screen Reader Optimization**
```typescript
// src/frontend/accessibility/screenReader.ts
import { logger } from '../utils/logger';

class ScreenReader {
  private liveRegion: HTMLElement;

  constructor() {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.margin = '-1px';
    this.liveRegion.style.padding = '0';
    this.liveRegion.style.overflow = 'hidden';
    this.liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    this.liveRegion.style.border = '0';

    document.body.appendChild(this.liveRegion);
  }

  announce(message: string) {
    try {
      this.liveRegion.textContent = message;
      logger.info(`Screen reader announcement: ${message}`);
    } catch (err) {
      logger.error('Failed to announce message:', err);
    }
  }

  createAccessibleTable(data: any[], headers: string[]): HTMLElement {
    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', 'Data table');

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.setAttribute('role', 'row');

    headers.forEach((header) => {
      const th = document.createElement('th');
      th.setAttribute('role', 'columnheader');
      th.setAttribute('scope', 'col');
      th.textContent = header;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body
    const tbody = document.createElement('tbody');
    data.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.setAttribute('role', 'row');

      headers.forEach((header, colIndex) => {
        const td = document.createElement('td');
        td.setAttribute('role', 'gridcell');
        td.textContent = row[header];
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
  }

  createAccessibleList(items: string[]): HTMLElement {
    const list = document.createElement('ul');
    list.setAttribute('role', 'list');

    items.forEach((item) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'listitem');
      li.textContent = item;
      list.appendChild(li);
    });

    return list;
  }
}

export const screenReader = new ScreenReader();
```

### **4. Focus Management**
```typescript
// src/frontend/accessibility/focusManager.ts
import { logger } from '../utils/logger';

class FocusManager {
  private previousFocus: HTMLElement | null = null;

  saveCurrentFocus() {
    this.previousFocus = document.activeElement as HTMLElement;
    logger.info('Saved current focus');
  }

  restoreFocus() {
    if (this.previousFocus) {
      this.previousFocus.focus();
      logger.info('Restored focus');
    }
  }

  focusFirstInteractiveElement(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
      logger.info('Focused first interactive element');
    }
  }

  moveFocusToNextElement() {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    }
  }

  moveFocusToPreviousElement() {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    }
  }

  trapFocusInModal(modal: HTMLElement) {
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = Array.from(
          modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
  }
}

export const focusManager = new FocusManager();
```

---

## **Advanced Search and Filtering**
*(180+ lines minimum)*

### **1. ElasticSearch Client Setup**
```typescript
// src/search/elasticsearchClient.ts
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

class ElasticSearchClient {
  private client: Client;
  private readonly INDEX_NAME = 'fuel_transactions';

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
      },
    });
  }

  async initialize() {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.INDEX_NAME,
      });

      if (!indexExists.body) {
        await this.client.indices.create({
          index: this.INDEX_NAME,
          body: {
            mappings: {
              properties: {
                vehicleId: { type: 'keyword' },
                amount: { type: 'float' },
                timestamp: { type: 'date' },
                odometerReading: { type: 'float' },
                location: { type: 'geo_point' },
                driverId: { type: 'keyword' },
                fuelType: { type: 'keyword' },
              },
            },
          },
        });
        logger.info(`Created ElasticSearch index: ${this.INDEX_NAME}`);
      }
    } catch (err) {
      logger.error('Failed to initialize ElasticSearch:', err);
      throw err;
    }
  }

  async indexDocument(document: any) {
    try {
      const response = await this.client.index({
        index: this.INDEX_NAME,
        body: document,
      });
      logger.info(`Indexed document: ${response.body._id}`);
      return response.body;
    } catch (err) {
      logger.error('Failed to index document:', err);
      throw err;
    }
  }

  async bulkIndex(documents: any[]) {
    try {
      const body = documents.flatMap((doc) => [
        { index: { _index: this.INDEX_NAME } },
        doc,
      ]);

      const response = await this.client.bulk({ body });
      if (response.body.errors) {
        logger.error('Bulk indexing errors:', response.body.items);
      }
      logger.info(`Bulk indexed ${documents.length} documents`);
      return response.body;
    } catch (err) {
      logger.error('Failed to bulk index documents:', err);
      throw err;
    }
  }

  async search(query: any) {
    try {
      const response = await this.client.search({
        index: this.INDEX_NAME,
        body: query,
      });
      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));
    } catch (err) {
      logger.error('Search failed:', err);
      throw err;
    }
  }
}

export const elasticSearchClient = new ElasticSearchClient();
```

### **2. Index Configuration**
```typescript
// src/search/indexConfig.ts
import { elasticSearchClient } from './elasticsearchClient';
import { logger } from '../utils/logger';

class IndexConfigurator {
  async configureIndex() {
    try {
      // Define index settings
      const settings = {
        analysis: {
          analyzer: {
            autocomplete: {
              tokenizer: 'autocomplete',
              filter: ['lowercase'],
            },
            autocomplete_search: {
              tokenizer: 'lowercase',
            },
          },
          tokenizer: {
            autocomplete: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 10,
              token_chars: ['letter', 'digit'],
            },
          },
        },
      };

      // Define index mappings
      const mappings = {
        properties: {
          vehicleId: {
            type: 'keyword',
            fields: {
              autocomplete: {
                type: 'text',
                analyzer: 'autocomplete',
                search_analyzer: 'autocomplete_search',
              },
            },
          },
          amount: { type: 'float' },
          timestamp: { type: 'date' },
          odometerReading: { type: 'float' },
          location: {
            type: 'geo_point',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          driverId: {
            type: 'keyword',
            fields: {
              autocomplete: {
                type: 'text',
                analyzer: 'autocomplete',
                search_analyzer: 'autocomplete_search',
              },
            },
          },
          fuelType: { type: 'keyword' },
        },
      };

      // Update index settings and mappings
      await elasticSearchClient.client.indices.close({
        index: 'fuel_transactions',
      });

      await elasticSearchClient.client.indices.putSettings({
        index: 'fuel_transactions',
        body: settings,
      });

      await elasticSearchClient.client.indices.putMapping({
        index: 'fuel_transactions',
        body: mappings,
      });

      await elasticSearchClient.client.indices.open({
        index: 'fuel_transactions',
      });

      logger.info('ElasticSearch index configured successfully');
    } catch (err) {
      logger.error('Failed to configure index:', err);
      throw err;
    }
  }

  async createAlias() {
    try {
      const aliasExists = await elasticSearchClient.client.indices.existsAlias({
        name: 'fuel_transactions_alias',
      });

      if (!aliasExists.body) {
        await elasticSearchClient.client.indices.putAlias({
          index: 'fuel_transactions',
          name: 'fuel_transactions_alias',
        });
        logger.info('Created ElasticSearch alias');
      }
    } catch (err) {
      logger.error('Failed to create alias:', err);
      throw err;
    }
  }
}

export const indexConfigurator = new IndexConfigurator();
```

### **3. Advanced Query Builder**
```typescript
// src/search/queryBuilder.ts
import { logger } from '../utils/logger';

class QueryBuilder {
  private query: any = {
    bool: {
      must: [],
      filter: [],
      should: [],
      must_not: [],
    },
  };

  addMustCondition(field: string, value: any, operator: string = 'term') {
    this.query.bool.must.push({ [operator]: { [field]: value } });
    return this;
  }

  addFilterCondition(field: string, value: any, operator: string = 'term') {
    this.query.bool.filter.push({ [operator]: { [field]: value } });
    return this;
  }

  addShouldCondition(field: string, value: any, operator: string = 'term') {
    this.query.bool.should.push({ [operator]: { [field]: value } });
    return this;
  }

  addMustNotCondition(field: string, value: any, operator: string = 'term') {
    this.query.bool.must_not.push({ [operator]: { [field]: value } });
    return this;
  }

  addRangeFilter(field: string, gte?: any, lte?: any) {
    const range: any = {};
    if (gte !== undefined) range.gte = gte;
    if (lte !== undefined) range.lte = lte;
    this.query.bool.filter.push({ range: { [field]: range } });
    return this;
  }

  addGeoDistanceFilter(field: string, lat: number, lon: number, distance: string) {
    this.query.bool.filter.push({
      geo_distance: {
        distance,
        [field]: { lat, lon },
      },
    });
    return this;
  }

  addAggregation(name: string, field: string, size: number = 10) {
    if (!this.query.aggs) {
      this.query.aggs = {};
    }
    this.query.aggs[name] = {
      terms: {
        field,
        size,
      },
    };
    return this;
  }

  setSize(size: number) {
    this.query.size = size;
    return this;
  }

  setFrom(from: number) {
    this.query.from = from;
    return this;
  }

  addSort(field: string, order: 'asc' | 'desc' = 'asc') {
    if (!this.query.sort) {
      this.query.sort = [];
    }
    this.query.sort.push({ [field]: { order } });
    return this;
  }

  build() {
    return this.query;
  }

  reset() {
    this.query = {
      bool: {
        must: [],
        filter: [],
        should: [],
        must_not: [],
      },
    };
    return this;
  }
}

export const queryBuilder = new QueryBuilder();
```

### **4. Faceted Search Implementation**
```typescript
// src/search/facetedSearch.ts
import { elasticSearchClient } from './elasticsearchClient';
import { queryBuilder } from './queryBuilder';
import { logger } from '../utils/logger';

class FacetedSearch {
  async searchWithFacets(
    query: string,
    filters: Record<string, any>,
    page: number = 1,
    pageSize: number = 10
  ) {
    try {
      // Build main query
      const mainQuery = queryBuilder.reset();

      // Add full-text search if query is provided
      if (query) {
        mainQuery.addMustCondition('vehicleId.autocomplete', query, 'match');
      }

      // Add filters
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            mainQuery.addFilterCondition(field, v);
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle range filters
          if (value.gte !== undefined || value.lte !== undefined) {
            mainQuery.addRangeFilter(field, value.gte, value.lte);
          }
        } else {
          mainQuery.addFilterCondition(field, value);
        }
      });

      // Add pagination
      mainQuery.setFrom((page - 1) * pageSize);
      mainQuery.setSize(pageSize);

      // Add sorting
      mainQuery.addSort('timestamp', 'desc');

      // Add aggregations for facets
      mainQuery.addAggregation('vehicle_facet', 'vehicleId');
      mainQuery.addAggregation('fuel_type_facet', 'fuelType');
      mainQuery.addAggregation('driver_facet', 'driverId');
      mainQuery.addAggregation('amount_range', 'amount', 5);

      // Execute search
      const results = await elasticSearchClient.search(mainQuery.build());

      // Process facets
      const facets: Record<string, any> = {};
      if (results.aggregations) {
        Object.entries(results.aggregations).forEach(([name, agg]) => {
          facets[name] = agg.buckets.map((bucket: any) => ({
            key: bucket.key,
            count: bucket.doc_count,
          }));
        });
      }

      return {
        results: results.hits,
        facets,
        total: results.total.value,
        page,
        pageSize,
      };
    } catch (err) {
      logger.error('Faceted search failed:', err);
      throw err;
    }
  }

  async getFacetOptions(field: string, query?: string) {
    try {
      const facetQuery = queryBuilder.reset();
      if (query) {
        facetQuery.addMustCondition(`${field}.autocomplete`, query, 'match');
      }
      facetQuery.addAggregation('facet', field);

      const results = await elasticSearchClient.search(facetQuery.build());
      return results.aggregations?.facet.buckets.map((bucket: any) => ({
        key: bucket.key,
        count: bucket.doc_count,
      })) || [];
    } catch (err) {
      logger.error('Failed to get facet options:', err);
      throw err;
    }
  }
}

export const facetedSearch = new FacetedSearch();
```

---

## **Third-Party Integrations**
*(250+ lines minimum)*

### **1. Salesforce Integration**
```typescript
// src/integrations/salesforce.ts
import axios from 'axios';
import { logger } from '../utils/logger';

class SalesforceIntegration {
  private client: axios.AxiosInstance;
  private readonly BASE_URL = 'https://yourinstance.salesforce.com/services/data/v56.0';

  constructor() {
    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async authenticate() {
    try {
      const response = await axios.post(
        'https://login.salesforce.com/services/oauth2/token',
        new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.SALESFORCE_CLIENT_ID!,
          client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
          username: process.env.SALESFORCE_USERNAME!,
          password: process.env.SALESFORCE_PASSWORD!,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.client.defaults.headers.common['Authorization'] =
        `Bearer ${response.data.access_token}`;
      logger.info('Salesforce authentication successful');
      return response.data;
    } catch (err) {
      logger.error('Salesforce authentication failed:', err);
      throw err;
    }
  }

  async createAccount(accountData: {
    Name: string;
    Industry: string;
    BillingCity: string;
    BillingCountry: string;
  }) {
    try {
      const response = await this.client.post('/sobjects/Account', accountData);
      logger.info(`Created Salesforce account: ${response.data.id}`);
      return response.data;
    } catch (err) {
      logger.error('Failed to create Salesforce account:', err);
      throw err;
    }
  }

  async createFuelTransaction(transaction: {
    Vehicle__c: string;
    Amount__c: number;
    Odometer_Reading__c: number;
    Transaction_Date__c: string;
    Location__Latitude__s: number;
    Location__Longitude__s: number;
  }) {
    try {
      const response = await this.client.post('/sobjects/Fuel_Transaction__c', transaction);
      logger.info(`Created Salesforce fuel transaction: ${response.data.id}`);
      return response.data;
    } catch (err) {
      logger.error('Failed to create Salesforce fuel transaction:', err);
      throw err;
    }
  }

  async getVehicleDetails(vehicleId: string) {
    try {
      const response = await this.client.get(`/sobjects/Vehicle__c/${vehicleId}`);
      return response.data;
    } catch (err) {
      logger.error('Failed to get Salesforce vehicle details:', err);
      throw err;
    }
  }

  async updateVehicleStatus(vehicleId: string, status: string) {
    try {
      await this.client.patch(`/sobjects/Vehicle__c/${vehicleId}`, {
        Status__c: status,
      });
      logger.info(`Updated vehicle ${vehicleId} status to ${status}`);
    } catch (err) {
      logger.error('Failed to update vehicle status:', err);
      throw err;
    }
  }
}

export const salesforceIntegration = new SalesforceIntegration();
```

### **2. Stripe Payment Processing**
```typescript
// src/integrations/stripe.ts
import Stripe from 'stripe';
import { logger } from '../utils/logger';

class StripeIntegration {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-08-16',
    });
  }

  async createCustomer(name: string, email: string) {
    try {
      const customer = await this.stripe.customers.create({
        name,
        email,
      });
      logger.info(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (err) {
      logger.error('Failed to create Stripe customer:', err);
      throw err;
    }
  }

  async createPaymentIntent(
    customerId: string,
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      logger.info(`Created payment intent: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (err) {
      logger.error('Failed to create payment intent:', err);
      throw err;
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId
      );
      logger.info(`Confirmed payment: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (err) {
      logger.error('Failed to confirm payment:', err);
      throw err;
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    trialDays?: number
  ) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      logger.info(`Created subscription: ${subscription.id}`);
      return subscription;
    } catch (err) {
      logger.error('Failed to create subscription:', err);
      throw err;
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.info(`Payment succeeded: ${paymentIntent.id}`);
          break;
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          logger.info(`Invoice payment succeeded: ${invoice.id}`);
          break;
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          logger.info(`Subscription deleted: ${subscription.id}`);
          break;
        default:
          logger.info(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      logger.error('Webhook error:', err);
      throw err;
    }
  }
}

export const stripeIntegration = new StripeIntegration();
```

### **3. SendGrid Email Service**
```typescript
// src/integrations/sendgrid.ts
import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

class SendGridIntegration {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    from: string = 'noreply@fuelmanagement.com'
  ) {
    try {
      const msg = {
        to,
        from,
        subject,
        html,
      };

      await sgMail.send(msg);
      logger.info(`Email sent to ${Array.isArray(to) ? to.join(', ') : to}`);
    } catch (err) {
      logger.error('Failed to send email:', err);
      throw err;
    }
  }

  async sendFuelReportEmail(
    to: string,
    reportData: {
      vehicleId: string;
      period: string;
      totalFuel: number;
      totalDistance: number;
      efficiency: number;
    }
  ) {
    try {
      const html = `
        <h1>Fuel Consumption Report</h1>
        <p><strong>Vehicle ID:</strong> ${reportData.vehicleId}</p>
        <p><strong>Period:</strong> ${reportData.period}</p>
        <p><strong>Total Fuel Consumed:</strong> ${reportData.totalFuel} liters</p>
        <p><strong>Total Distance:</strong> ${reportData.totalDistance} km</p>
        <p><strong>Fuel Efficiency:</strong> ${reportData.efficiency.toFixed(2)} km/l</p>
      `;

      await this.sendEmail(to, 'Fuel Consumption Report', html);
    } catch (err) {
      logger.error('Failed to send fuel report email:', err);
      throw err;
    }
  }

  async sendAlertEmail(
    to: string,
    alertType: string,
    vehicleId: string,
    details: string
  ) {
    try {
      const html = `
        <h1>Alert: ${alertType}</h1>
        <p><strong>Vehicle ID:</strong> ${vehicleId}</p>
        <p><strong>Details:</strong> ${details}</p>
        <p>Please take appropriate action.</p>
      `;

      await this.sendEmail(to, `Alert: ${alertType}`, html);
    } catch (err) {
      logger.error('Failed to send alert email:', err);
      throw err;
    }
  }

  async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
    }>
  ) {
    try {
      const messages = emails.map((email) => ({
        to: email.to,
        from: 'noreply@fuelmanagement.com',
        subject: email.subject,
        html: email.html,
      }));

      await sgMail.send(messages);
      logger.info(`Sent ${emails.length} bulk emails`);
    } catch (err) {
      logger.error('Failed to send bulk emails:', err);
      throw err;
    }
  }
}

export const sendGridIntegration = new SendGridIntegration();
```

### **4. Twilio SMS Notifications**
```typescript
// src/integrations/twilio.ts
import twilio from 'twilio';
import { logger } from '../utils/logger';

class TwilioIntegration {
  private client: twilio.Twilio;

  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }

  async sendSMS(to: string, body: string) {
    try {
      const message = await this.client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to,
      });
      logger.info(`SMS sent to ${to}: ${message.sid}`);
      return message;
    } catch (err) {
      logger.error('Failed to send SMS:', err);
      throw err;
    }
  }

  async sendFuelAlertSMS(
    phoneNumber: string,
    vehicleId: string,
    fuelLevel: number,
    threshold: number
  ) {
    try {
      const message = `ALERT: Vehicle ${vehicleId} fuel level is ${fuelLevel}% (below threshold of ${threshold}%). Please refuel.`;
      await this.sendSMS(phoneNumber, message);
    } catch (err) {
      logger.error('Failed to send fuel alert SMS:', err);
      throw err;
    }
  }

  async sendMaintenanceReminderSMS(
    phoneNumber: string,
    vehicleId: string,
    nextMaintenanceDate: string
  ) {
    try {
      const message = `REMINDER: Vehicle ${vehicleId} requires maintenance on ${nextMaintenanceDate}. Please schedule.`;
      await this.sendSMS(phoneNumber, message);
    } catch (err) {
      logger.error('Failed to send maintenance reminder SMS:', err);
      throw err;
    }
  }

  async sendBulkSMS(phoneNumbers: string[], body: string) {
    try {
      const messages = await Promise.all(
        phoneNumbers.map((number) => this.sendSMS(number, body))
      );
      logger.info(`Sent ${messages.length} bulk SMS messages`);
      return messages;
    } catch (err) {
      logger.error('Failed to send bulk SMS:', err);
      throw err;
    }
  }
}

export const twilioIntegration = new TwilioIntegration();
```

### **5. Google Analytics 4**
```typescript
// src/integrations/googleAnalytics.ts
import { logger } from '../utils/logger';

declare global {
  interface Window {
    gtag: any;
  }
}

class GoogleAnalytics {
  private readonly TRACKING_ID = process.env.GA4_TRACKING_ID!;

  initialize() {
    try {
      // Load GA4 script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.TRACKING_ID}`;
      document.head.appendChild(script);

      // Initialize GA4
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.TRACKING_ID, {
        send_page_view: true,
      });

      logger.info('Google Analytics initialized');
    } catch (err) {
      logger.error('Failed to initialize Google Analytics:', err);
    }
  }

  trackPageView(pagePath: string, pageTitle: string) {
    try {
      window.gtag('config', this.TRACKING_ID, {
        page_path: pagePath,
        page_title: pageTitle,
      });
      logger.info(`Tracked page view: ${pagePath}`);
    } catch (err) {
      logger.error('Failed to track page view:', err);
    }
  }

  trackEvent(
    eventName: string,
    eventParams: Record<string, any> = {},
    eventCategory?: string
  ) {
    try {
      const params: Record<string, any> = { ...eventParams };
      if (eventCategory) {
        params.event_category = eventCategory;
      }

      window.gtag('event', eventName, params);
      logger.info(`Tracked event: ${eventName}`);
    } catch (err) {
      logger.error('Failed to track event:', err);
    }
  }

  trackFuelTransaction(transaction: {
    vehicleId: string;
    amount: number;
    odometerReading: number;
    fuelType: string;
  }) {
    try {
      this.trackEvent('fuel_transaction', {
        vehicle_id: transaction.vehicleId,
        amount: transaction.amount,
        odometer: transaction.odometerReading,
        fuel_type: transaction.fuelType,
        value: transaction.amount,
      }, 'fuel');
    } catch (err) {
      logger.error('Failed to track fuel transaction:', err);
    }
  }

  trackLogin(userId: string, method: string) {
    try {
      this.trackEvent('login', {
        method,
        user_id: userId,
      }, 'authentication');
    } catch (err) {
      logger.error('Failed to track login:', err);
    }
  }

  trackError(error: Error) {
    try {
      this.trackEvent('exception', {
        description: error.message,
        fatal: false,
      }, 'errors');
    } catch (err) {
      logger.error('Failed to track error:', err);
    }
  }
}

export const googleAnalytics = new GoogleAnalytics();
```

---

## **Gamification System**
*(150+ lines minimum)*

### **1. Points Calculation Engine**
```typescript
// src/gamification/pointsEngine.ts
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

class PointsEngine {
  private readonly POINTS_CONFIG = {
    fuel_transaction: 10,
    efficient_refuel: 20,
    maintenance_scheduled: 15,
    daily_login: 5,
    report_generated: 5,
    feedback_submitted: 10,
  };

  async calculatePoints(userId: string, action: string, metadata?: any) {
    try {
      // Validate action
      if (!this.POINTS_CONFIG[action as keyof typeof this.POINTS_CONFIG]) {
        throw new Error(`Invalid action: ${action}`);
      }

      // Check for existing points for this action (prevent duplicates)
      const existingPoints = await prisma.userPoints.findFirst({
        where: {
          userId,
          action,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (existingPoints) {
        logger.info(`Points already awarded for action ${action} by user ${userId}`);
        return existingPoints;
      }

      // Calculate points
      let points = this.POINTS_CONFIG[action as keyof typeof this.POINTS_CONFIG];

      // Apply multipliers based on metadata
      if (action === 'fuel_transaction' && metadata?.efficiency > 15) {
        points += 5; // Bonus for efficient refueling
      }

      if (action === 'maintenance_scheduled' && metadata?.isPreventive) {
        points += 10; // Bonus for preventive maintenance
      }

      // Create points record
      const userPoints = await prisma.userPoints.create({
        data: {
          userId,
          action,
          points,
          metadata: metadata || {},
        },
      });

      // Update user's total points
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: points,
          },
        },
      });

      logger.info(`Awarded ${points} points to user ${userId} for action ${action}`);
      return userPoints;
    } catch (err) {
      logger.error('Failed to calculate points:', err);
      throw err;
    }
  }

  async getUserPoints(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalPoints: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user.totalPoints;
    } catch (err) {
      logger.error('Failed to get user points:', err);
      throw err;
    }
  }

  async getPointsHistory(userId: string, limit: number = 10) {
    try {
      const pointsHistory = await prisma.userPoints.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return pointsHistory;
    } catch (err) {
      logger.error('Failed to get points history:', err);
      throw err;
    }
  }

  async redeemPoints(userId: string, points: number, rewardId: string) {
    try {
      // Check if user has enough points
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || user.totalPoints < points) {
        throw new Error('Insufficient points');
      }

      // Create redemption record
      const redemption = await prisma.pointsRedemption.create({
        data: {
          userId,
          points,
          rewardId,
          status: 'PENDING',
        },
      });

      // Deduct points
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            decrement: points,
          },
        },
      });

      logger.info(`User ${userId} redeemed ${points} points for reward ${rewardId}`);
      return redemption;
    } catch (err) {
      logger.error('Failed to redeem points:', err);
      throw err;
    }
  }
}

export const pointsEngine = new PointsEngine();
```

### **2. Badge/Achievement System**
```typescript
// src/gamification/badgeSystem.ts
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

class BadgeSystem {
  private readonly BADGES = {
    fuel_saver: {
      name: 'Fuel Saver',
      description: 'Achieve 15 km/l fuel efficiency for 30 consecutive days',
      points: 100,
      condition: (userId: string) => this.checkFuelSaver(userId),
    },
    maintenance_master: {
      name: 'Maintenance Master',
      description: 'Schedule 10 preventive maintenance sessions',
      points: 80,
      condition: (userId: string) => this.checkMaintenanceMaster(userId),
    },
    early_bird: {
      name: 'Early Bird',
      description: 'Log fuel transactions before 8 AM for 7 consecutive days',
      points: 50,
      condition: (userId: string) => this.checkEarlyBird(userId),
    },
    feedback_champion: {
      name: 'Feedback Champion',
      description: 'Submit 5 feedback reports with positive ratings',
      points: 60,
      condition: (userId: string) => this.checkFeedbackChampion(userId),
    },
  };

  async checkAndAwardBadges(userId: string) {
    try {
      const awardedBadges = await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      });

      const awardedBadgeIds = awardedBadges.map((b) => b.badgeId);
      const newBadges = [];

      for (const [badgeId, badge] of Object.entries(this.BADGES)) {
        if (!awardedBadgeIds.includes(badgeId)) {
          const isEligible = await badge.condition(userId);
          if (isEligible) {
            const userBadge = await prisma.userBadge.create({
              data: {
                userId,
                badgeId,
                awardedAt: new Date(),
              },
            });

            // Award points for the badge
            await prisma.userPoints.create({
              data: {
                userId,
                action: `badge_${badgeId}`,
                points: badge.points,
                metadata: { badgeId },
              },
            });

            // Update user's total points
            await prisma.user.update({
              where: { id: userId },
              data: {
                totalPoints: {
                  increment: badge.points,
                },
              },
            });

            newBadges.push(userBadge);
            logger.info(`Awarded badge ${badgeId} to user ${userId}`);
          }
        }
      }

      return newBadges;
    } catch (err) {
      logger.error('Failed to check and award badges:', err);
      throw err;
    }
  }

  private async checkFuelSaver(userId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transactions = await prisma.fuelTransaction.findMany({
        where: {
          userId,
          timestamp: {
            gte: thirtyDaysAgo,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (transactions.length < 30) return false;

      let consecutiveDays = 0;
      let previousDate = new Date(0);

      for (const tx of transactions) {
        const currentDate = new Date(tx.timestamp);
        currentDate.setHours(0, 0, 0, 0);

        if (previousDate.getTime() === 0) {
          previousDate = currentDate;
          continue;
        }

        if (currentDate.getTime() === previousDate.getTime() + 86400000) {
          // Same day as previous (shouldn't happen)
          continue;
        }

        if (currentDate.getTime() === previousDate.getTime() + 86400000 * 2) {
          // One day gap
          consecutiveDays = 1;
        } else if (currentDate.getTime() === previousDate.getTime() + 86400000) {
          // Consecutive day
          consecutiveDays++;
        } else {
          // Non-consecutive
          consecutiveDays = 1;
        }

        previousDate = currentDate;

        // Calculate efficiency (km/l)
        const prevTx = await prisma.fuelTransaction.findFirst({
          where: {
            userId,
            timestamp: {
              lt: tx.timestamp,
            },
          },
          orderBy: { timestamp: 'desc' },
        });

        if (prevTx) {
          const distance = tx.odometerReading - prevTx.odometerReading;
          const efficiency = distance / tx.amount;
          if (efficiency < 15) {
            return false;
          }
        }
      }

      return consecutiveDays >= 30;
    } catch (err) {
      logger.error('Failed to check Fuel Saver badge:', err);
      return false;
    }
  }

  private async checkMaintenanceMaster(userId: string) {
    try {
      const maintenanceSessions = await prisma.maintenanceSession.count({
        where: {
          userId,
          type: 'PREVENTIVE',
        },
      });

      return maintenanceSessions >= 10;
    } catch (err) {
      logger.error('Failed to check Maintenance Master badge:', err);
      return false;
    }
  }

  private async checkEarlyBird(userId: string) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const transactions = await prisma.fuelTransaction.findMany({
        where: {
          userId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (transactions.length < 7) return false;

      let consecutiveDays = 0;
      let previousDate = new Date(0);

      for (const tx of transactions) {
        const currentDate = new Date(tx.timestamp);
        currentDate.setHours(0, 0, 0, 0);

        if (previousDate.getTime() === 0) {
          previousDate = currentDate;
          continue;
        }

        if (currentDate.getTime() === previousDate.getTime() + 86400000) {
          consecutiveDays++;
        } else {
          consecutiveDays = 1;
        }

        previousDate = currentDate;

        // Check if transaction was before 8 AM
        const txDate = new Date(tx.timestamp);
        if (txDate.getHours() >= 8) {
          return false;
        }
      }

      return consecutiveDays >= 7;
    } catch (err) {
      logger.error('Failed to check Early Bird badge:', err);
      return false;
    }
  }

  private async checkFeedbackChampion(userId: string) {
    try {
      const feedbacks = await prisma.feedback.count({
        where: {
          userId,
          rating: {
            gte: 4, // 4 or 5 stars
          },
        },
      });

      return feedbacks >= 5;
    } catch (err) {
      logger.error('Failed to check Feedback Champion badge:', err);
      return false;
    }
  }

  async getUserBadges(userId: string) {
    try {
      const badges = await prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      return badges.map((b) => ({
        id: b.badgeId,
        name: b.badge.name,
        description: b.badge.description,
        awardedAt: b.awardedAt,
      }));
    } catch (err) {
      logger.error('Failed to get user badges:', err);
      throw err;
    }
  }
}

export const badgeSystem = new BadgeSystem();
```

### **3. Leaderboard Implementation**
```typescript
// src/gamification/leaderboard.ts
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

class Leaderboard {
  async getLeaderboard(
    timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 10
  ) {
    try {
      const whereClause: any = {};

      // Apply time period filter
      if (timePeriod !== 'all_time') {
        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
          case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'weekly':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'monthly':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }

        whereClause.createdAt = {
          gte: startDate,
        };
      }

      const leaderboard = await prisma.userPoints.groupBy({
        by: ['userId'],
        where: whereClause,
        _sum: {
          points: true,
        },
        orderBy: {
          _sum: {
            points: 'desc',
          },
        },
        take: limit,
      });

      // Get user details
      const userIds = leaderboard.map((entry) => entry.userId);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      // Combine results
      const result = leaderboard.map((entry) => {
        const user = users.find((u) => u.id === entry.userId);
        return {
          userId: entry.userId,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          points: entry._sum.points || 0,
        };
      });

      return result;
    } catch (err) {
      logger.error('Failed to get leaderboard:', err);
      throw err;
    }
  }

  async getUserRank(userId: string, timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') {
    try {
      const leaderboard = await this.getLeaderboard(timePeriod);
      const userIndex = leaderboard.findIndex((entry) => entry.userId === userId);

      if (userIndex === -1) {
        return {
          rank: null,
          points: 0,
          totalUsers: leaderboard.length,
        };
      }

      return {
        rank: userIndex + 1,
        points: leaderboard[userIndex].points,
        totalUsers: leaderboard.length,
      };
    } catch (err) {
      logger.error('Failed to get user rank:', err);
      throw err;
    }
  }

  async getLeaderboardWithBadges(timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') {
    try {
      const leaderboard = await this.getLeaderboard(timePeriod);

      // Get badges for each user
      const usersWithBadges = await Promise.all(
        leaderboard.map(async (entry) => {
          const badges = await prisma.userBadge.count({
            where: { userId: entry.userId },
          });

          return {
            ...entry,
            badges,
          };
        })
      );

      return usersWithBadges;
    } catch (err) {
      logger.error('Failed to get leaderboard with badges:', err);
      throw err;
    }
  }
}

export const leaderboard = new Leaderboard();
```

### **4. Reward Notification System**
```typescript
// src/gamification/rewardNotifications.ts
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';
import { sendGridIntegration } from '../integrations/sendgrid';
import { twilioIntegration } from '../integrations/twilio';

class RewardNotificationSystem {
  async notifyNewPoints(userId: string, points: number, action: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Send email
      if (user.email) {
        const subject = `You earned ${points} points!`;
        const html = `
          <h1>Congratulations, ${user.name}!</h1>
          <p>You earned ${points} points for ${action}.</p>
          <p>Keep up the great work!</p>
        `;

        await sendGridIntegration.sendEmail(user.email, subject, html);
      }

      // Send SMS
      if (user.phoneNumber) {
        const message = `Congrats! You earned ${points} points for ${action}. Keep it up!`;
        await twilioIntegration.sendSMS(user.phoneNumber, message);
      }

      logger.info(`Notified user ${userId} about ${points} new points`);
    } catch (err) {
      logger.error('Failed to notify about new points:', err);
      throw err;
    }
  }

  async notifyNewBadge(userId: string, badgeId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const badge = await prisma.badge.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error('Badge not found');
      }

      // Send email
      if (user.email) {
        const subject = `New Badge: ${badge.name}`;
        const html = `
          <h1>Congratulations, ${user.name}!</h1>
          <p>You've earned the <strong>${badge.name}</strong> badge!</p>
          <p>${badge.description}</p>
          <p>Keep up the great work!</p>
        `;

        await sendGridIntegration.sendEmail(user.email, subject, html);
      }

      // Send SMS
      if (user.phoneNumber) {
        const message = `Congrats! You earned the ${badge.name} badge! ${badge.description}`;
        await twilioIntegration.sendSMS(user.phoneNumber, message);
      }

      logger.info(`Notified user ${userId} about new badge ${badgeId}`);
    } catch (err) {
      logger.error('Failed to notify about new badge:', err);
      throw err;
    }
  }

  async notifyRewardRedemption(userId: string, points: number, rewardId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const reward = await prisma.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        throw new Error('Reward not found');
      }

      // Send email
      if (user.email) {
        const subject = `Reward Redemption: ${reward.name}`;
        const html = `
          <h1>Reward Redemption Successful!</h1>
          <p>You've redeemed ${points} points for:</p>
          <h2>${reward.name}</h2>
          <p>${reward.description}</p>
          <p>Your reward will be processed shortly.</p>
        `;

        await sendGridIntegration.sendEmail(user.email, subject, html);
      }

      // Send SMS
      if (user.phoneNumber) {
        const message = `Reward redemption successful! ${points} points for ${reward.name}. Your reward will be processed shortly.`;
        await twilioIntegration.sendSMS(user.phoneNumber, message);
      }

      logger.info(`Notified user ${userId} about reward redemption ${rewardId}`);
    } catch (err) {
      logger.error('Failed to notify about reward redemption:', err);
      throw err;
    }
  }

  async notifyLeaderboardPosition(
    userId: string,
    rank: number,
    timePeriod: 'daily' | 'weekly' | 'monthly' | 'all_time'
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phoneNumber: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const periodText = timePeriod.replace('_', ' ');

      // Send email
      if (user.email) {
        const subject = `You're #${rank} on the ${periodText} leaderboard!`;
        const html = `
          <h1>Leaderboard Update</h1>
          <p>Congratulations, ${user.name}!</p>
          <p>You're currently ranked <strong>#${rank}</strong> on the ${periodText} leaderboard.</p>
          <p>Keep up the great work to maintain or improve your position!</p>
        `;

        await sendGridIntegration.sendEmail(user.email, subject, html);
      }

      // Send SMS
      if (user.phoneNumber) {
        const message = `Leaderboard update: You're #${rank} on the ${periodText} leaderboard! Keep it up!`;
        await twilioIntegration.sendSMS(user.phoneNumber, message);
      }

      logger.info(`Notified user ${userId} about leaderboard position #${rank}`);
    } catch (err) {
      logger.error('Failed to notify about leaderboard position:', err);
      throw err;
    }
  }
}

export const rewardNotificationSystem = new RewardNotificationSystem();
```

---

## **Analytics Dashboards**
*(200+ lines minimum)*

### **1. Dashboard Data Aggregation**
```typescript
// src/analytics/dashboardData.ts
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

class DashboardData {
  async getFuelConsumptionData(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'daily' | 'weekly' | 'monthly' = 'daily'
  ) {
    try {
      // Base query
      const whereClause = {
        vehicleId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Group by time period
      let groupByClause: any;
      switch (groupBy) {
        case 'daily':
          groupByClause = {
            year: { date: 'timestamp' },
            month: { date: 'timestamp' },
            day: { date: 'timestamp' },
          };
          break;
        case 'weekly':
          groupByClause = {
            year: { date: 'timestamp' },
            week: { date: 'timestamp' },
          };
          break;
        case 'monthly':
          groupByClause = {
            year: { date: 'timestamp' },
            month: { date: 'timestamp' },
          };
          break;
      }

      const data = await prisma.fuelTransaction.groupBy({
        by: Object.keys(groupByClause),
        where: whereClause,
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          ...groupByClause,
        },
      });

      // Calculate average fuel consumption
      const result = data.map((entry) => {
        const date = new Date(
          entry.year,
          groupBy === 'monthly' ? entry.month - 1 : 0,
          groupBy === 'daily' ? entry.day : 1
        );

        return {
          date: date.toISOString(),
          totalFuel: entry._sum.amount || 0,
          transactionCount: entry._count._all,
          averageFuel: entry._sum.amount
            ? entry._sum.amount / entry._count._all
            : 0,
        };
      });

      return result;
    } catch (err) {
      logger.error('Failed to get fuel consumption data:', err);
      throw err;
    }
  }

  async getFuelEfficiencyData(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const transactions = await prisma.fuelTransaction.findMany({
        where: {
          vehicleId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      if (transactions.length < 2) {
        return [];
      }

      const efficiencyData = [];
      for (let i = 1; i < transactions.length; i++) {
        const prevTx = transactions[i - 1];
        const currentTx = transactions[i];

        const distance = currentTx.odometerReading - prevTx.odometerReading;
        const fuelUsed = prevTx.amount;
        const efficiency = distance / fuelUsed;

        efficiencyData.push({
          date: currentTx.timestamp.toISOString(),
          efficiency,
          distance,
          fuelUsed,
        });
      }

      return efficiencyData;
    } catch (err) {
      logger.error('Failed to get fuel efficiency data:', err);
      throw err;
    }
  }

  async getVehicleComparisonData(
    vehicleIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    try {
      const comparisonData = await Promise.all(
        vehicleIds.map(async (vehicleId) => {
          const transactions = await prisma.fuelTransaction.findMany({
            where: {
              vehicleId,
              timestamp: {
                gte: startDate,
                lte: endDate,
              },
            },
          });

          const totalFuel = transactions.reduce(
            (sum, tx) => sum + tx.amount,
            0
          );

          const totalDistance = transactions.length > 0
            ? transactions[transactions.length - 1].odometerReading -
              transactions[0].odometerReading
            : 0;

          const averageEfficiency = totalDistance / totalFuel || 0;

          return {
            vehicleId,
            totalFuel,
            totalDistance,
            averageEfficiency,
            transactionCount: transactions.length,
          };
        })
      );

      return comparisonData;
    } catch (err) {
      logger.error('Failed to get vehicle comparison data:', err);
      throw err;
    }
  }

  async getCostAnalysisData(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    fuelPrice: number
  ) {
    try {
      const transactions = await prisma.fuelTransaction.findMany({
        where: {
          vehicleId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalFuel = transactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );

      const totalCost = totalFuel * fuelPrice;

      const distance = transactions.length > 0
        ? transactions[transactions.length - 1].odometerReading -
          transactions[0].odometerReading
        : 0;

      const costPerKm = distance > 0 ? totalCost / distance : 0;

      return {
        totalFuel,
        totalCost,
        distance,
        costPerKm,
        fuelPrice,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };
    } catch (err) {
      logger.error('Failed to get cost analysis data:', err);
      throw err;
    }
  }

  async getMaintenanceAlerts(vehicleId: string, thresholdKm: number = 5000) {
    try {
      const lastMaintenance = await prisma.maintenanceSession.findFirst({
        where: { vehicleId },
        orderBy: { odometerReading: 'desc' },
      });

      const currentOdometer = await prisma.fuelTransaction.findFirst({
        where: { vehicleId },
        orderBy: { odometerReading: 'desc' },
        select: { odometerReading: true },
      });

      if (!currentOdometer) {
        return {
          needsMaintenance: false,
          distanceSinceLast: 0,
          threshold: thresholdKm,
        };
      }

      const distanceSinceLast = lastMaintenance
        ? currentOdometer.odometerReading - lastMaintenance.odometerReading
        : currentOdometer.odometerReading;

      return {
        needsMaintenance: distanceSinceLast >= thresholdKm,
        distanceSinceLast,
        threshold: thresholdKm,
      };
    } catch (err) {
      logger.error('Failed to get maintenance alerts:', err);
      throw err;
    }
  }
}

export const dashboardData = new DashboardData();
```

### **2. Chart Configuration**
```typescript
// src/analytics/chartConfig.ts
import { ChartConfiguration } from 'chart.js';
import { logger } from '../utils/logger';

class ChartConfigurator {
  createFuelConsumptionChart(data: any[]): ChartConfiguration {
    try {
      return {
        type: 'bar',
        data: {
          labels: data.map((entry) => new Date(entry.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Total Fuel (L)',
              data: data.map((entry) => entry.totalFuel),
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Average Fuel per Transaction (L)',
              data: data.map((entry) => entry.averageFuel),
              type: 'line',
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Fuel (Liters)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Date',
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw;
                  if (context.datasetIndex === 0) {
                    return `${label}: ${value} L`;
                  } else {
                    return `${label}: ${value.toFixed(2)} L`;
                  }
                },
              },
            },
            legend: {
              position: 'top',
            },
          },
        },
      };
    } catch (err) {
      logger.error('Failed to create fuel consumption chart:', err);
      throw err;
    }
  }

  createFuelEfficiencyChart(data: any[]): ChartConfiguration {
    try {
      return {
        type: 'line',
        data: {
          labels: data.map((entry) => new Date(entry.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Fuel Efficiency (km/L)',
              data: data.map((entry) => entry.efficiency),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              tension: 0.1,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Efficiency (km/L)',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Date',
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw;
                  return `${label}: ${value.toFixed(2)} km/L`;
                },
                afterLabel: (context) => {
                  const entry = data[context.dataIndex];
                  return [
                    `Distance: ${entry.distance} km`,
                    `Fuel Used: ${entry.fuelUsed} L`,
                  ];
                },
              },
            },
            legend: {
              position: 'top',
            },
          },
        },
      };
    } catch (err) {
      logger.error('Failed to create fuel efficiency chart:', err);
      throw err;
    }
  }

  createVehicleComparisonChart(data: any[]): ChartConfiguration {
    try {
      return {
        type: 'bar',
        data: {
          labels: data.map((entry) => entry.vehicleId),
          datasets: [
            {
              label: 'Total Fuel (L)',
              data: data.map((entry) => entry.totalFuel),
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Average Efficiency (km/L)',
              data: data.map((entry) => entry.averageEfficiency),
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Value',
              },
            },
            x: {
              title: {
                display: true,
                text: 'Vehicle ID',
              },
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw;
                  if (context.datasetIndex === 0) {
                    return `${label}: ${value} L`;
                  } else {
                    return `${label}: ${value.toFixed(2)} km/L`;
                  }
                },
                afterLabel: (context) => {
                  const entry = data[context.dataIndex];
                  return [
                    `Total Distance: ${entry.totalDistance} km`,
                    `Transactions: ${entry.transactionCount}`,
                  ];
                },
              },
            },
            legend: {
              position: 'top',
            },
          },
        },
      };
    } catch (err) {
      logger.error('Failed to create vehicle comparison chart:', err);
      throw err;
    }
  }

  createCostAnalysisChart(data: any): ChartConfiguration {
    try {
      return {
        type: 'doughnut',
        data: {
          labels: ['Fuel Cost', 'Distance Cost'],
          datasets: [
            {
              data: [data.totalCost, data.costPerKm * data.distance],
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw;
                  return `${label}: $${value.toFixed(2)}`;
                },
              },
            },
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: `Cost Analysis (${new Date(data.period.startDate).toLocaleDateString()} - ${new Date(data.period.endDate).toLocaleDateString()})`,
            },
          },
        },
      };
    } catch (err) {
      logger.error('Failed to create cost analysis chart:', err);
      throw err;
    }
  }

  createMaintenanceAlertChart(data: any): ChartConfiguration {
    try {
      const remaining = data.threshold - data.distanceSinceLast;
      const percentage = (data.distanceSinceLast / data.threshold) * 100;

      return {
        type: 'doughnut',
        data: {
          labels: ['Distance Since Last Maintenance', 'Remaining Distance'],
          datasets: [
            {
              data: [data.distanceSinceLast, remaining > 0 ? remaining : 0],
              backgroundColor: [
                percentage >= 100 ? 'rgba(255, 99, 132, 0.7)' : 'rgba(54, 162, 235, 0.7)',
                'rgba(75, 192, 192, 0.7)',
              ],
              borderColor: [
                percentage >= 100 ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.raw;
                  return `${label}: ${value} km`;
                },
              },
            },
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: `Maintenance Alert (${data.needsMaintenance ? 'Needs Maintenance' : 'OK'})`,
            },
          },
        },
      };
    } catch (err) {
      logger.error('Failed to create maintenance alert chart:', err);
      throw err;
    }
  }
}

export const chartConfigurator = new ChartConfigurator();
```

### **3. Real-Time Data Updates**
```typescript
// src/analytics/realTimeUpdates.ts
import { webSocketManager } from '../websocket/server';
import { logger } from '../utils/logger';
import { dashboardData } from './dashboardData';

class RealTimeDashboardUpdates {
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private updateInterval: NodeJS.Timeout | null = null;

  startRealTimeUpdates(vehicleId: string, callback: (data: any) => void) {
    try {
      // Initial data load
      this.loadInitialData(vehicleId, callback);

      // Set up WebSocket listener
      webSocketManager.on('fuelUpdate', (data) => {
        if (data.vehicleId === vehicleId) {
          this.loadInitialData(vehicleId, callback);
        }
      });

      // Set up periodic updates
      this.updateInterval = setInterval(() => {
        this.loadInitialData(vehicleId, callback);
      }, this.UPDATE_INTERVAL);

      logger.info(`Started real-time updates for vehicle ${vehicleId}`);
    } catch (err) {
      logger.error('Failed to start real-time updates:', err);
      throw err;
    }
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Stopped real-time updates');
    }
  }

  private async loadInitialData(vehicleId: string, callback: (data: any) => void) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      // Get fuel consumption data
      const consumptionData = await dashboardData.getFuelConsumptionData(
        vehicleId,
        thirtyDaysAgo,
        new Date(),
        'daily'
      );

      // Get fuel efficiency data
      const efficiencyData = await dashboardData.getFuelEfficiencyData(
        vehicleId,
        thirtyDaysAgo,
        new Date()
      );

      // Get maintenance alerts
      const maintenanceAlerts = await dashboardData.getMaintenanceAlerts(vehicleId);

      callback({
        consumptionData,
        efficiencyData,
        maintenanceAlerts,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Failed to load initial dashboard data:', err);
    }
  }
}

export const realTimeDashboardUpdates = new RealTimeDashboardUpdates();
```

### **4. Export to PDF/Excel**
```typescript
// src/analytics/export.ts
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { logger } from '../utils/logger';
import { dashboardData } from './dashboardData';

class DashboardExporter {
  async exportToPDF(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    title: string = 'Fuel Management Report'
  ) {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(20);
      doc.text(title, 15, 20);

      // Add date range
      doc.setFontSize(12);
      doc.text(
        `Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        15,
        30
      );

      // Add vehicle ID
      doc.text(`Vehicle ID: ${vehicleId}`, 15, 40);

      // Get data
      const consumptionData = await dashboardData.getFuelConsumptionData(
        vehicleId,
        startDate,
        endDate,
        'daily'
      );

      const efficiencyData = await dashboardData.getFuelEfficiencyData(
        vehicleId,
        startDate,
        endDate
      );

      const costData = await dashboardData.getCostAnalysisData(
        vehicleId,
        startDate,
        endDate,
        1.5 // Example fuel price
      );

      // Add fuel consumption table
      doc.setFontSize(14);
      doc.text('Fuel Consumption', 15, 60);

      const consumptionHeaders = ['Date', 'Total Fuel (L)', 'Avg per Tx (L)', 'Tx Count'];
      const consumptionRows = consumptionData.map((entry) => [
        new Date(entry.date).toLocaleDateString(),
        entry.totalFuel.toFixed(2),
        entry.averageFuel.toFixed(2),
        entry.transactionCount,
      ]);

      this.addTableToPDF(doc, consumptionHeaders, consumptionRows, 70);

      // Add fuel efficiency chart (placeholder)
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Fuel Efficiency', 15, 20);

      // In a real implementation, you would generate an image of the chart
      doc.text('Fuel efficiency trend over time', 15, 30);

      // Add cost analysis
      doc.setFontSize(14);
      doc.text('Cost Analysis', 15, 50);

      const costInfo = [
        ['Total Fuel', `${costData.totalFuel.toFixed(2)} L`],
        ['Total Cost', `$${costData.totalCost.toFixed(2)}`],
        ['Total Distance', `${costData.distance.toFixed(2)} km`],
        ['Cost per km', `$${costData.costPerKm.toFixed(4)}`],
        ['Fuel Price', `$${costData.fuelPrice.toFixed(2)}/L`],
      ];

      this.addTableToPDF(doc, ['Metric', 'Value'], costInfo, 60);

      // Save PDF
      const fileName = `fuel_report_${vehicleId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      logger.info(`Exported PDF report for vehicle ${vehicleId}`);
      return fileName;
    } catch (err) {
      logger.error('Failed to export to PDF:', err);
      throw err;
    }
  }

  private addTableToPDF(
    doc: jsPDF,
    headers: string[],
    rows: any[][],
    startY: number
  ) {
    const columnWidths = [40, 30, 30, 30];
    const rowHeight = 10;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = startY;

    // Add headers
    doc.setFontStyle('bold');
    headers.forEach((header, i) => {
      doc.text(header, 15 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY);
    });
    doc.setFontStyle('normal');
    currentY += rowHeight;

    // Add rows
    rows.forEach((row) => {
      if (currentY + rowHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      row.forEach((cell, i) => {
        doc.text(
          cell.toString(),
          15 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
          currentY
        );
      });

      currentY += rowHeight;
    });
  }

  async exportToExcel(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    fileName: string = 'fuel_report.xlsx'
  ) {
    try {
      // Get data
      const consumptionData = await dashboardData.getFuelConsumptionData(
        vehicleId,
        startDate,
        endDate,
        'daily'
      );

      const efficiencyData = await dashboardData.getFuelEfficiencyData(
        vehicleId,
        startDate,
        endDate
      );

      const costData = await dashboardData.getCostAnalysisData(
        vehicleId,
        startDate,
        endDate,
        1.5 // Example fuel price
      );

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add fuel consumption sheet
      const consumptionWS = XLSX.utils.json_to_sheet(
        consumptionData.map((entry) => ({
          Date: new Date(entry.date).toLocaleDateString(),
          'Total Fuel (L)': entry.totalFuel,
          'Avg per Tx (L)': entry.averageFuel,
          'Tx Count': entry.transactionCount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, consumptionWS, 'Fuel Consumption');

      // Add fuel efficiency sheet
      const efficiencyWS = XLSX.utils.json_to_sheet(
        efficiencyData.map((entry) => ({
          Date: new Date(entry.date).toLocaleDateString(),
          'Efficiency (km/L)': entry.efficiency,
          'Distance (km)': entry.distance,
          'Fuel Used (L)': entry.fuelUsed,
        }))
      );
      XLSX.utils.book_append_sheet(wb, efficiencyWS, 'Fuel Efficiency');

      // Add cost analysis sheet
      const costWS = XLSX.utils.json_to_sheet([
        {
          'Total Fuel (L)': costData.totalFuel,
          'Total Cost ($)': costData.totalCost,
          'Total Distance (km)': costData.distance,
          'Cost per km ($)': costData.costPerKm,
          'Fuel Price ($/L)': costData.fuelPrice,
          'Period Start': new Date(costData.period.startDate).toLocaleDateString(),
          'Period End': new Date(costData.period.endDate).toLocaleDateString(),
        },
      ]);
      XLSX.utils.book_append_sheet(wb, costWS, 'Cost Analysis');

      // Write file
      XLSX.writeFile(wb, fileName);

      logger.info(`Exported Excel report for vehicle ${vehicleId}`);
      return fileName;
    } catch (err) {
      logger.error('Failed to export to Excel:', err);
      throw err;
    }
  }
}

export const dashboardExporter = new DashboardExporter();
```

---

## **Security Hardening**
*(250+ lines minimum)*

### **1. JWT Authentication Middleware**
```typescript
// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../database/prisma';

interface JwtPayload {
  userId: string;
  role: string;
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Bearer token missing' });
    }

    // Verify token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!,
      { algorithms: ['HS256'] }
    ) as JwtPayload;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if token is blacklisted
    const blacklistedToken = await prisma.blacklistedToken.findUnique({
      where: { token },
    });

    if (blacklistedToken) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (err) {
    logger.error('JWT authentication failed:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch (err) {
      logger.error('Authorization failed:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const generateToken = (userId: string, role: string) => {
  try {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  } catch (err) {
    logger.error('Failed to generate token:', err);
    throw err;
  }
};

export const refreshToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
      { algorithms: ['HS256'] }
    ) as JwtPayload;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if refresh token is valid
    const validRefreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!validRefreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = generateToken(user.id, user.role);

    // Generate new refresh token (optional)
    const newRefreshToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Update refresh token in database
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { token: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (err) {
    logger.error('Failed to refresh token:', err);
    throw err;
  }
};

export const revokeToken = async (token: string) => {
  try {
    // Add token to blacklist
    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    logger.info(`Token revoked: ${token}`);
  } catch (err) {
    logger.error('Failed to revoke token:', err);
    throw err;
  }
};
```

### **2. Rate Limiting**
```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip; // Use IP address as key
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for certain paths
    return req.path === '/health' || req.path === '/auth/login';
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip;
  },
  handler: (req: Request, res: Response) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts, please try again later.',
    });
  },
});

const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 WebSocket messages per windowMs
  message: 'Too many WebSocket messages, please slow down.',
  keyGenerator: (req: Request) => {
    return req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for certain WebSocket events
    return req.body?.type === 'HEARTBEAT';
  },
});

export { apiLimiter, authLimiter, wsLimiter };
```

### **3. Input Validation and Sanitization**
```typescript
// src/middleware/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { logger } from '../utils/logger';
import sanitizeHtml from 'sanitize-html';

export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
          })),
        });
      }

      next();
    } catch (err) {
      logger.error('Validation middleware error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitize body
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeHtml(req.body[key], {
            allowedTags: [],
            allowedAttributes: {},
          });
        }
      }
    }

    // Sanitize query params
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeHtml(req.query[key] as string, {
            allowedTags: [],
            allowedAttributes: {},
          });
        }
      }
    }

    // Sanitize route params
    if (req.params) {
      for (const key in req.params) {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitizeHtml(req.params[key], {
            allowedTags: [],
            allowedAttributes: {},
          });
        }
      }
    }

    next();
  } catch (err) {
    logger.error('Sanitization middleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Example validation rules
export const fuelTransactionValidation = [
  body('vehicleId').isString().trim().notEmpty().withMessage('Vehicle ID is required'),
  body('amount').isFloat({ min: 0.1 }).withMessage('Amount must be a positive number'),
  body('odometerReading')
    .isFloat({ min: 0 })
    .withMessage('Odometer reading must be a non-negative number'),
  body('location').isString().trim().notEmpty().withMessage('Location is required'),
  body('timestamp')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Timestamp must be a valid date'),
];

export const userValidation = [
  body('name').isString().trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('role').isIn(['DRIVER', 'MANAGER', 'ADMIN']).withMessage('Invalid role'),
];

export const idParamValidation = [
  param('id').isString().trim().notEmpty().withMessage('ID is required'),
];
```

### **4. CSRF Protection**
```typescript
// src/middleware/csrfMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import csrf from 'csurf';
import { logger } from '../utils/logger';

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Skip CSRF for certain routes
    if (req.path === '/health' || req.path === '/auth/login') {
      return next();
    }

    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return next();
    }

    // Apply CSRF protection
    csrfProtection(req, res, next);
  } catch (err) {
    logger.error('CSRF middleware error:', err);
    return res.status(403).json({ error: 'CSRF token invalid or missing' });
  }
};

export const getCsrfToken = (req: Request, res: Response) => {
  try {
    res.json({ csrfToken: req.csrfToken() });
  } catch (err) {
    logger.error('