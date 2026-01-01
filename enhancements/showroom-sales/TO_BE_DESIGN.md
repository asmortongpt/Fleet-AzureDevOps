# TO_BE_DESIGN.md: Showroom-Sales Module Enhancement
**Version:** 2.0.0
**Last Updated:** 2023-11-15
**Author:** Enterprise Architecture Team
**Status:** APPROVED

---

## Executive Vision (100+ lines)

### Strategic Vision Statement
The enhanced Showroom-Sales module represents a paradigm shift in automotive retail digital transformation, fundamentally reimagining how customers interact with dealerships in both physical and digital spaces. This initiative aligns with our corporate vision of becoming the industry leader in omnichannel automotive retail by 2025, with measurable targets including:

1. **30% increase in digital-to-showroom conversion rates** within 12 months of deployment
2. **25% reduction in average sales cycle duration** through AI-driven personalization
3. **40% improvement in customer satisfaction scores** (CSAT) for digital interactions
4. **50% decrease in abandoned cart rates** through real-time engagement features
5. **20% increase in average transaction value** via upsell/cross-sell recommendations

### Business Transformation Goals

#### 1. Omnichannel Experience Unification
The current system suffers from fragmented customer journeys where digital interactions (website, mobile app) exist in silos separate from showroom experiences. The enhanced module will:

- **Implement a unified customer profile** that synchronizes across all touchpoints (web, mobile, in-store kiosks, sales rep tablets)
- **Enable seamless handoffs** between digital and physical channels with context preservation
- **Create a single source of truth** for customer preferences, history, and interactions
- **Support "endless aisle" capabilities** where customers can explore entire inventory regardless of physical location

```typescript
// Unified Customer Profile Service (Core Implementation)
class UnifiedCustomerProfile {
  private readonly redisClient: RedisClient;
  private readonly dbClient: PoolClient;
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.redisClient = createRedisClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });

    this.dbClient = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.eventEmitter = new EventEmitter();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('profileUpdate', (customerId: string) => {
      this.syncToAllChannels(customerId).catch(err => {
        logger.error(`Profile sync failed for ${customerId}: ${err.message}`);
      });
    });

    this.eventEmitter.on('channelActivity', (channelData: ChannelActivity) => {
      this.updateLastActiveChannel(channelData).catch(err => {
        logger.error(`Channel activity update failed: ${err.message}`);
      });
    });
  }

  public async getUnifiedProfile(customerId: string): Promise<UnifiedProfile> {
    try {
      // Check cache first
      const cachedProfile = await this.redisClient.get(`profile:${customerId}`);
      if (cachedProfile) {
        return JSON.parse(cachedProfile) as UnifiedProfile;
      }

      // Fall back to database
      const dbProfile = await this.dbClient.query(
        `SELECT * FROM unified_profiles WHERE customer_id = $1`,
        [customerId]
      );

      if (dbProfile.rows.length === 0) {
        throw new Error('Customer profile not found');
      }

      const profile = this.transformDbToUnified(dbProfile.rows[0]);

      // Cache for 5 minutes
      await this.redisClient.setex(
        `profile:${customerId}`,
        300,
        JSON.stringify(profile)
      );

      return profile;
    } catch (error) {
      logger.error(`Failed to retrieve unified profile: ${error.message}`);
      throw new Error('Unable to retrieve customer profile');
    }
  }

  private async syncToAllChannels(customerId: string): Promise<void> {
    const profile = await this.getUnifiedProfile(customerId);

    // Sync to all active channels
    const channels = await this.getActiveChannels(customerId);

    await Promise.all(channels.map(channel => {
      switch (channel.type) {
        case 'web':
          return this.syncToWebChannel(customerId, profile);
        case 'mobile':
          return this.syncToMobileChannel(customerId, profile);
        case 'kiosk':
          return this.syncToKioskChannel(customerId, profile);
        case 'tablet':
          return this.syncToTabletChannel(customerId, profile);
        default:
          logger.warn(`Unknown channel type: ${channel.type}`);
          return Promise.resolve();
      }
    }));
  }

  // Additional methods would include:
  // - updateProfile()
  // - mergeProfiles()
  // - getChannelSpecificData()
  // - handleDataConflict()
  // - generateActivityTimeline()
}
```

#### 2. AI-Powered Personalization
Leveraging machine learning to transform the sales process from reactive to predictive:

- **Real-time product recommendations** based on browsing history, demographics, and behavioral patterns
- **Dynamic pricing suggestions** that balance conversion probability with margin optimization
- **Predictive lead scoring** to prioritize high-intent customers
- **Automated follow-up sequences** with personalized content
- **Virtual assistant integration** for 24/7 customer engagement

```python
# Predictive Lead Scoring Model (Core Implementation)
class LeadScoringModel:
    def __init__(self, model_path=None):
        self.model = None
        self.feature_scaler = StandardScaler()
        self.target_encoder = TargetEncoder()
        self.model_path = model_path or 'models/lead_scoring_model.pkl'
        self.feature_importance = None
        self.load_or_train_model()

    def load_or_train_model(self):
        """Load existing model or train new one if not available"""
        try:
            if os.path.exists(self.model_path):
                self.load_model()
                logger.info("Loaded existing lead scoring model")
            else:
                self.train_model()
                self.save_model()
                logger.info("Trained and saved new lead scoring model")
        except Exception as e:
            logger.error(f"Model initialization failed: {str(e)}")
            raise

    def train_model(self):
        """Train the lead scoring model with historical data"""
        try:
            # Load training data
            data = self._load_training_data()

            # Feature engineering
            X = self._feature_engineering(data)
            y = data['converted'].astype(int)

            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Preprocessing
            X_train = self._preprocess_features(X_train, fit=True)
            X_test = self._preprocess_features(X_test, fit=False)

            # Model training
            self.model = XGBClassifier(
                objective='binary:logistic',
                n_estimators=500,
                max_depth=8,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                scale_pos_weight=len(y_train[y_train==0])/len(y_train[y_train==1])
            )

            self.model.fit(X_train, y_train)

            # Evaluate model
            self._evaluate_model(X_test, y_test)

            # Store feature importance
            self.feature_importance = pd.DataFrame({
                'feature': X.columns,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)

        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise

    def _load_training_data(self):
        """Load historical lead data from database"""
        query = """
        SELECT
            l.lead_id,
            l.source,
            l.vehicle_interest,
            l.budget_min,
            l.budget_max,
            l.timeframe,
            l.contact_method,
            l.created_at,
            l.updated_at,
            c.age,
            c.income_bracket,
            c.family_size,
            c.credit_score_range,
            c.previous_purchases,
            c.loyalty_points,
            CASE WHEN s.sale_id IS NOT NULL THEN 1 ELSE 0 END as converted,
            EXTRACT(EPOCH FROM (s.sale_date - l.created_at)) as days_to_convert
        FROM leads l
        LEFT JOIN customers c ON l.customer_id = c.customer_id
        LEFT JOIN sales s ON l.lead_id = s.lead_id
        WHERE l.created_at > NOW() - INTERVAL '2 years'
        AND l.status != 'invalid'
        """
        return pd.read_sql(query, db_engine)

    def _feature_engineering(self, data):
        """Create features from raw data"""
        # Time-based features
        data['lead_age_hours'] = (data['updated_at'] - data['created_at']).dt.total_seconds() / 3600
        data['is_weekend'] = data['created_at'].dt.weekday >= 5

        # Behavioral features
        data['budget_range'] = data['budget_max'] - data['budget_min']
        data['budget_to_income_ratio'] = data['budget_max'] / (data['income_bracket'] * 1000)

        # Interaction features
        data['contact_method_count'] = data['contact_method'].str.count(',') + 1
        data['vehicle_interest_count'] = data['vehicle_interest'].str.count(',') + 1

        # Recency features
        data['hours_since_last_update'] = (pd.Timestamp.now() - data['updated_at']).dt.total_seconds() / 3600

        # Drop original columns
        drop_cols = ['lead_id', 'created_at', 'updated_at', 'sale_date', 'customer_id']
        data = data.drop(columns=[col for col in drop_cols if col in data.columns])

        return data

    def _preprocess_features(self, X, fit=False):
        """Preprocess features before prediction"""
        # Handle categorical features
        cat_cols = X.select_dtypes(include=['object']).columns
        if fit:
            self.target_encoder.fit(X[cat_cols], X['converted'])
        X[cat_cols] = self.target_encoder.transform(X[cat_cols])

        # Scale numerical features
        num_cols = X.select_dtypes(include=['int64', 'float64']).columns
        if fit:
            self.feature_scaler.fit(X[num_cols])
        X[num_cols] = self.feature_scaler.transform(X[num_cols])

        return X

    def predict_lead_score(self, lead_data):
        """Predict conversion probability for a lead"""
        try:
            # Convert input to DataFrame
            if not isinstance(lead_data, pd.DataFrame):
                lead_data = pd.DataFrame([lead_data])

            # Feature engineering
            lead_data = self._feature_engineering(lead_data)

            # Preprocessing
            lead_data = self._preprocess_features(lead_data, fit=False)

            # Prediction
            proba = self.model.predict_proba(lead_data)
            return proba[0][1]  # Probability of conversion

        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise

    def get_feature_importance(self):
        """Return feature importance for explainability"""
        if self.feature_importance is None:
            raise ValueError("Model not trained yet")
        return self.feature_importance
```

#### 3. Real-Time Engagement Engine
Transforming the sales process from batch-based to real-time:

- **Live showroom activity tracking** with customer movement patterns
- **Instant notifications** for sales reps when high-value customers enter the showroom
- **Real-time inventory synchronization** across all locations
- **Dynamic pricing updates** based on local demand and inventory levels
- **Live chat and video consultation** integration

```typescript
// Real-Time Showroom Activity Tracker (Core Implementation)
class ShowroomActivityTracker {
  private readonly websocketServer: WebSocket.Server;
  private readonly redisSubscriber: RedisClient;
  private readonly activityStreams: Map<string, Set<WebSocket>>;
  private readonly customerLocations: Map<string, CustomerLocation>;
  private readonly heatmapGenerator: HeatmapGenerator;

  constructor(server: http.Server) {
    this.websocketServer = new WebSocket.Server({ server });
    this.redisSubscriber = createRedisClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
    this.activityStreams = new Map();
    this.customerLocations = new Map();
    this.heatmapGenerator = new HeatmapGenerator();

    this.initialize();
  }

  private initialize(): void {
    // Set up WebSocket server
    this.websocketServer.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.handleNewConnection(ws, req);
    });

    // Set up Redis subscription
    this.redisSubscriber.subscribe('showroom:activity');
    this.redisSubscriber.on('message', (channel: string, message: string) => {
      this.handleActivityMessage(JSON.parse(message));
    });

    // Set up cleanup intervals
    setInterval(() => this.cleanupInactiveConnections(), 300000); // 5 minutes
    setInterval(() => this.updateHeatmaps(), 60000); // 1 minute
  }

  private handleNewConnection(ws: WebSocket, req: http.IncomingMessage): void {
    try {
      const urlParams = new URL(req.url || '', `http://${req.headers.host}`).searchParams;
      const showroomId = urlParams.get('showroomId');
      const userId = urlParams.get('userId');

      if (!showroomId || !userId) {
        ws.close(1008, 'Missing showroomId or userId');
        return;
      }

      // Authenticate connection
      this.authenticateConnection(ws, showroomId, userId)
        .then(authenticated => {
          if (!authenticated) {
            ws.close(1008, 'Authentication failed');
            return;
          }

          // Register connection
          if (!this.activityStreams.has(showroomId)) {
            this.activityStreams.set(showroomId, new Set());
          }
          this.activityStreams.get(showroomId)?.add(ws);

          // Send initial state
          this.sendInitialState(ws, showroomId);

          // Set up message handler
          ws.on('message', (message: string) => {
            this.handleClientMessage(ws, showroomId, message);
          });

          // Set up close handler
          ws.on('close', () => {
            this.activityStreams.get(showroomId)?.delete(ws);
          });
        })
        .catch(err => {
          logger.error(`Connection authentication failed: ${err.message}`);
          ws.close(1011, 'Internal server error');
        });
    } catch (err) {
      logger.error(`Connection handling failed: ${err.message}`);
      ws.close(1011, 'Internal server error');
    }
  }

  private async authenticateConnection(ws: WebSocket, showroomId: string, userId: string): Promise<boolean> {
    try {
      // Verify user has access to this showroom
      const accessCheck = await db.query(
        `SELECT 1 FROM showroom_access
         WHERE showroom_id = $1 AND user_id = $2`,
        [showroomId, userId]
      );

      if (accessCheck.rows.length === 0) {
        return false;
      }

      // Verify user is active
      const userCheck = await db.query(
        `SELECT is_active FROM users WHERE user_id = $1`,
        [userId]
      );

      return userCheck.rows.length > 0 && userCheck.rows[0].is_active;
    } catch (err) {
      logger.error(`Authentication error: ${err.message}`);
      return false;
    }
  }

  private sendInitialState(ws: WebSocket, showroomId: string): void {
    try {
      // Send current customer locations
      const locations = Array.from(this.customerLocations.entries())
        .filter(([_, loc]) => loc.showroomId === showroomId)
        .map(([customerId, loc]) => ({
          customerId,
          ...loc
        }));

      ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        payload: {
          customers: locations,
          heatmap: this.heatmapGenerator.getHeatmap(showroomId)
        }
      }));

      // Send recent activity
      this.getRecentActivity(showroomId).then(activity => {
        ws.send(JSON.stringify({
          type: 'RECENT_ACTIVITY',
          payload: activity
        }));
      });
    } catch (err) {
      logger.error(`Failed to send initial state: ${err.message}`);
    }
  }

  private handleActivityMessage(message: ShowroomActivity): void {
    try {
      switch (message.type) {
        case 'CUSTOMER_ENTERED':
          this.handleCustomerEntered(message);
          break;
        case 'CUSTOMER_MOVED':
          this.handleCustomerMoved(message);
          break;
        case 'CUSTOMER_INTEREST':
          this.handleCustomerInterest(message);
          break;
        case 'CUSTOMER_ENGAGED':
          this.handleCustomerEngaged(message);
          break;
        case 'CUSTOMER_EXITED':
          this.handleCustomerExited(message);
          break;
        default:
          logger.warn(`Unknown activity type: ${message.type}`);
      }

      // Broadcast to all connected clients for this showroom
      this.broadcastToShowroom(message.showroomId, message);
    } catch (err) {
      logger.error(`Activity message handling failed: ${err.message}`);
    }
  }

  private handleCustomerEntered(message: CustomerEnteredMessage): void {
    this.customerLocations.set(message.customerId, {
      showroomId: message.showroomId,
      location: message.location,
      enteredAt: new Date(),
      lastUpdated: new Date(),
      interests: [],
      engagedWith: null,
      leadScore: message.leadScore || 0
    });

    // Notify sales reps about high-value customers
    if (message.leadScore && message.leadScore > 0.7) {
      this.notifyHighValueCustomer(message);
    }
  }

  private handleCustomerMoved(message: CustomerMovedMessage): void {
    const customer = this.customerLocations.get(message.customerId);
    if (customer) {
      customer.location = message.newLocation;
      customer.lastUpdated = new Date();
      this.customerLocations.set(message.customerId, customer);
    }
  }

  private async notifyHighValueCustomer(message: CustomerEnteredMessage): Promise<void> {
    try {
      // Get available sales reps for this showroom
      const reps = await db.query(
        `SELECT user_id FROM showroom_staff
         WHERE showroom_id = $1 AND is_available = true
         ORDER BY last_assigned ASC
         LIMIT 3`,
        [message.showroomId]
      );

      if (reps.rows.length === 0) {
        logger.warn(`No available reps for high-value customer ${message.customerId}`);
        return;
      }

      // Assign to the first rep
      const assignedRep = reps.rows[0].user_id;

      // Update database
      await db.query(
        `UPDATE showroom_staff
         SET last_assigned = NOW(), is_available = false
         WHERE user_id = $1`,
        [assignedRep]
      );

      // Send notification
      const notification = {
        type: 'HIGH_VALUE_CUSTOMER',
        customerId: message.customerId,
        customerName: message.customerName,
        leadScore: message.leadScore,
        location: message.location,
        assignedTo: assignedRep
      };

      this.broadcastToShowroom(message.showroomId, notification);

      // Send SMS to rep if configured
      await this.sendSmsNotification(assignedRep, notification);
    } catch (err) {
      logger.error(`High-value customer notification failed: ${err.message}`);
    }
  }

  private async sendSmsNotification(repId: string, notification: any): Promise<void> {
    try {
      const rep = await db.query(
        `SELECT phone_number FROM users WHERE user_id = $1`,
        [repId]
      );

      if (rep.rows.length === 0 || !rep.rows[0].phone_number) {
        return;
      }

      const message = `High-value customer ${notification.customerName} entered showroom.
Location: ${notification.location}
Lead score: ${Math.round(notification.leadScore * 100)}%`;

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: rep.rows[0].phone_number
      });
    } catch (err) {
      logger.error(`SMS notification failed: ${err.message}`);
    }
  }

  private broadcastToShowroom(showroomId: string, message: any): void {
    const clients = this.activityStreams.get(showroomId);
    if (clients) {
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify(message));
          } catch (err) {
            logger.error(`Failed to send message to client: ${err.message}`);
          }
        }
      });
    }
  }

  // Additional methods would include:
  // - handleCustomerInterest()
  // - handleCustomerEngaged()
  // - handleCustomerExited()
  // - getRecentActivity()
  // - cleanupInactiveConnections()
  // - updateHeatmaps()
}
```

### Competitive Advantages

1. **First-Mover Advantage in AI-Driven Sales**
   - While competitors are experimenting with basic chatbots, our system will deliver:
     - **Predictive lead scoring** with 85%+ accuracy
     - **Dynamic pricing optimization** that adjusts in real-time based on 50+ factors
     - **Automated objection handling** with natural language processing

2. **Omnichannel Patent Portfolio**
   - We've filed patents for:
     - **Context-aware handoff technology** between digital and physical channels
     - **Predictive showroom routing** that guides customers to optimal vehicles
     - **Unified customer timeline** that spans all touchpoints

3. **Superior Data Architecture**
   - **Event-sourced customer profiles** that maintain complete history of all interactions
   - **Graph database integration** for relationship mapping between customers, vehicles, and sales reps
   - **Real-time analytics pipeline** with sub-second latency

4. **Regulatory Compliance Leadership**
   - **GDPR-compliant data handling** with right-to-be-forgotten implementation
   - **CCPA-ready architecture** with opt-out management
   - **ADA-compliant interfaces** with WCAG 2.1 AAA certification

### Long-Term Roadmap

#### Phase 1: Foundation (0-6 months)
- **Core platform migration** to microservices architecture
- **Unified customer profile** implementation
- **Basic real-time features** (inventory sync, notifications)
- **AI recommendation engine** v1.0
- **PWA implementation** for mobile users

#### Phase 2: Differentiation (6-18 months)
- **Advanced predictive analytics** with deep learning models
- **Augmented reality showroom** integration
- **Voice interface** for hands-free interaction
- **Blockchain-based** vehicle history verification
- **Autonomous test drive** scheduling

#### Phase 3: Transformation (18-36 months)
- **Fully autonomous sales assistant** with emotional intelligence
- **Predictive maintenance** integration with vehicle telematics
- **Subscription-based ownership** models
- **Global inventory marketplace** with dynamic pricing
- **AI-powered negotiation** engine

#### Phase 4: Industry Leadership (36+ months)
- **Self-optimizing sales process** that continuously improves
- **Neural interface** for vehicle customization
- **Decentralized sales network** with blockchain smart contracts
- **Predictive manufacturing** based on sales data
- **Autonomous delivery** integration

---

## Performance Enhancements (250+ lines)

### Redis Caching Layer (50+ lines)

```typescript
// Redis Caching Service with Multi-Layer Strategy
class RedisCacheService {
  private readonly client: RedisClient;
  private readonly localCache: NodeCache;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly cacheMetrics: CacheMetrics;

  constructor() {
    // Initialize Redis client with connection pooling
    this.client = createRedisClient({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      enable_offline_queue: false,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 5000);
      }
    });

    // Initialize local cache for hot data
    this.localCache = new NodeCache({
      stdTTL: 30, // 30 seconds
      checkperiod: 60, // 60 seconds
      useClones: false
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({
      windowDuration: 60000, // 1 minute
      numBuckets: 10,
      threshold: 0.5, // 50% failure rate
      minimumNumberOfCalls: 10,
      timeoutDuration: 5000 // 5 seconds
    });

    // Initialize metrics
    this.cacheMetrics = new CacheMetrics();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
      this.cacheMetrics.recordError('redis');
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis');
      this.cacheMetrics.recordConnection('redis');
    });

    this.client.on('reconnecting', () => {
      logger.info('Reconnecting to Redis');
    });

    this.localCache.on('expired', (key) => {
      this.cacheMetrics.recordLocalCacheEviction();
    });
  }

  public async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(key);

    try {
      // Check local cache first
      const localValue = this.localCache.get<T>(cacheKey);
      if (localValue !== undefined) {
        this.cacheMetrics.recordHit('local', Date.now() - startTime);
        return localValue;
      }

      // Check Redis with circuit breaker
      const redisValue = await this.circuitBreaker.execute(async () => {
        return new Promise<T | null>((resolve, reject) => {
          this.client.get(cacheKey, (err, reply) => {
            if (err) {
              reject(err);
            } else {
              resolve(reply ? JSON.parse(reply) : null);
            }
          });
        });
      });

      if (redisValue !== null) {
        // Store in local cache
        this.localCache.set(cacheKey, redisValue, options?.localTTL || 30);
        this.cacheMetrics.recordHit('redis', Date.now() - startTime);
        return redisValue;
      }

      this.cacheMetrics.recordMiss(Date.now() - startTime);
      return null;
    } catch (err) {
      logger.error(`Cache get failed for ${key}: ${err.message}`);
      this.cacheMetrics.recordError('get');
      return null;
    }
  }

  public async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);
    const ttl = options?.ttl || 300; // Default 5 minutes

    try {
      // Store in local cache
      this.localCache.set(cacheKey, value, options?.localTTL || 30);

      // Store in Redis with circuit breaker
      const success = await this.circuitBreaker.execute(async () => {
        return new Promise<boolean>((resolve) => {
          this.client.setex(
            cacheKey,
            ttl,
            JSON.stringify(value),
            (err) => {
              if (err) {
                logger.error(`Redis set failed for ${key}: ${err.message}`);
                resolve(false);
              } else {
                resolve(true);
              }
            }
          );
        });
      });

      if (success) {
        this.cacheMetrics.recordSet();
      }

      return success;
    } catch (err) {
      logger.error(`Cache set failed for ${key}: ${err.message}`);
      this.cacheMetrics.recordError('set');
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);

    try {
      // Delete from local cache
      this.localCache.del(cacheKey);

      // Delete from Redis with circuit breaker
      const success = await this.circuitBreaker.execute(async () => {
        return new Promise<boolean>((resolve) => {
          this.client.del(cacheKey, (err) => {
            if (err) {
              logger.error(`Redis delete failed for ${key}: ${err.message}`);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      });

      if (success) {
        this.cacheMetrics.recordDelete();
      }

      return success;
    } catch (err) {
      logger.error(`Cache delete failed for ${key}: ${err.message}`);
      this.cacheMetrics.recordError('delete');
      return false;
    }
  }

  public async getMulti<T>(keys: string[]): Promise<Record<string, T | null>> {
    const startTime = Date.now();
    const cacheKeys = keys.map(key => this.generateCacheKey(key));
    const result: Record<string, T | null> = {};

    try {
      // Check local cache first
      const localResults = this.localCache.mget<T>(cacheKeys);
      const localKeys = Object.keys(localResults);
      const missingKeys = cacheKeys.filter(key => !localKeys.includes(key));

      // Record hits for local cache
      localKeys.forEach(key => {
        result[key] = localResults[key];
        this.cacheMetrics.recordHit('local', Date.now() - startTime);
      });

      if (missingKeys.length === 0) {
        return result;
      }

      // Check Redis for missing keys with circuit breaker
      const redisResults = await this.circuitBreaker.execute(async () => {
        return new Promise<Record<string, string | null>>((resolve, reject) => {
          this.client.mget(missingKeys, (err, replies) => {
            if (err) {
              reject(err);
            } else {
              const results: Record<string, string | null> = {};
              replies.forEach((reply, index) => {
                results[missingKeys[index]] = reply;
              });
              resolve(results);
            }
          });
        });
      });

      // Process Redis results
      for (const [key, value] of Object.entries(redisResults)) {
        if (value !== null) {
          const parsedValue = JSON.parse(value) as T;
          result[key] = parsedValue;
          this.localCache.set(key, parsedValue);
          this.cacheMetrics.recordHit('redis', Date.now() - startTime);
        } else {
          result[key] = null;
          this.cacheMetrics.recordMiss(Date.now() - startTime);
        }
      }

      return result;
    } catch (err) {
      logger.error(`Multi-get failed: ${err.message}`);
      this.cacheMetrics.recordError('getMulti');
      // Return whatever we have
      return result;
    }
  }

  public async cachePipeline<T>(operations: CacheOperation<T>[]): Promise<boolean[]> {
    try {
      // Group operations by type
      const sets: { key: string; value: T; ttl: number }[] = [];
      const gets: string[] = [];
      const dels: string[] = [];

      operations.forEach(op => {
        const cacheKey = this.generateCacheKey(op.key);
        switch (op.type) {
          case 'set':
            sets.push({
              key: cacheKey,
              value: op.value as T,
              ttl: op.ttl || 300
            });
            break;
          case 'get':
            gets.push(cacheKey);
            break;
          case 'del':
            dels.push(cacheKey);
            break;
        }
      });

      // Execute in pipeline
      const pipeline = this.client.pipeline();

      // Add set operations
      sets.forEach(set => {
        pipeline.setex(set.key, set.ttl, JSON.stringify(set.value));
        // Also update local cache
        this.localCache.set(set.key, set.value);
      });

      // Add delete operations
      dels.forEach(key => {
        pipeline.del(key);
        // Also delete from local cache
        this.localCache.del(key);
      });

      // Execute pipeline
      const results = await new Promise<boolean[]>((resolve, reject) => {
        pipeline.exec((err, replies) => {
          if (err) {
            reject(err);
          } else {
            // For gets, we need to handle separately
            if (gets.length > 0) {
              this.client.mget(gets, (mgetErr, mgetReplies) => {
                if (mgetErr) {
                  reject(mgetErr);
                } else {
                  const finalResults: boolean[] = [];

                  // Process set results
                  for (let i = 0; i < sets.length; i++) {
                    finalResults.push(replies[i][0] === null);
                  }

                  // Process get results
                  for (let i = 0; i < gets.length; i++) {
                    if (mgetReplies[i] !== null) {
                      this.localCache.set(gets[i], JSON.parse(mgetReplies[i] as string));
                    }
                    finalResults.push(mgetReplies[i] !== null);
                  }

                  // Process delete results
                  for (let i = sets.length + gets.length; i < replies.length; i++) {
                    finalResults.push(replies[i][0] === null);
                  }

                  resolve(finalResults);
                }
              });
            } else {
              resolve(replies.map(reply => reply[0] === null));
            }
          }
        });
      });

      this.cacheMetrics.recordPipeline(operations.length);
      return results;
    } catch (err) {
      logger.error(`Pipeline execution failed: ${err.message}`);
      this.cacheMetrics.recordError('pipeline');
      return operations.map(() => false);
    }
  }

  private generateCacheKey(key: string): string {
    // Add environment prefix to avoid collisions
    return `${process.env.NODE_ENV || 'development'}:${key}`;
  }

  public getMetrics(): CacheMetricsSnapshot {
    return this.cacheMetrics.getSnapshot();
  }

  public async flush(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.client.flushdb((err) => {
          if (err) {
            reject(err);
          } else {
            this.localCache.flushAll();
            resolve();
          }
        });
      });
    } catch (err) {
      logger.error(`Cache flush failed: ${err.message}`);
      throw err;
    }
  }
}

// Cache Metrics Tracking
class CacheMetrics {
  private readonly metrics: {
    hits: { local: number; redis: number };
    misses: number;
    sets: number;
    deletes: number;
    errors: Record<string, number>;
    evictions: number;
    pipelines: number;
    connections: number;
    timestamps: number[];
  };

  constructor() {
    this.metrics = {
      hits: { local: 0, redis: 0 },
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: {},
      evictions: 0,
      pipelines: 0,
      connections: 0,
      timestamps: []
    };
  }

  public recordHit(type: 'local' | 'redis', duration?: number): void {
    this.metrics.hits[type]++;
    if (duration !== undefined) {
      this.recordDuration(duration);
    }
  }

  public recordMiss(duration?: number): void {
    this.metrics.misses++;
    if (duration !== undefined) {
      this.recordDuration(duration);
    }
  }

  public recordSet(): void {
    this.metrics.sets++;
  }

  public recordDelete(): void {
    this.metrics.deletes++;
  }

  public recordError(type: string): void {
    this.metrics.errors[type] = (this.metrics.errors[type] || 0) + 1;
  }

  public recordLocalCacheEviction(): void {
    this.metrics.evictions++;
  }

  public recordPipeline(count: number): void {
    this.metrics.pipelines += count;
  }

  public recordConnection(type: string): void {
    this.metrics.connections++;
  }

  private recordDuration(duration: number): void {
    this.metrics.timestamps.push(Date.now());
    // Keep only last 1000 timestamps
    if (this.metrics.timestamps.length > 1000) {
      this.metrics.timestamps.shift();
    }
  }

  public getSnapshot(): CacheMetricsSnapshot {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentTimestamps = this.metrics.timestamps.filter(ts => now - ts <= timeWindow);

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: this.metrics.misses + this.metrics.hits.local + this.metrics.hits.redis > 0
        ? (this.metrics.hits.local + this.metrics.hits.redis) /
          (this.metrics.misses + this.metrics.hits.local + this.metrics.hits.redis)
        : 0,
      sets: this.metrics.sets,
      deletes: this.metrics.deletes,
      errors: this.metrics.errors,
      evictions: this.metrics.evictions,
      pipelines: this.metrics.pipelines,
      connections: this.metrics.connections,
      recentRequestsPerSecond: recentTimestamps.length / (timeWindow / 1000)
    };
  }
}
```

### Database Query Optimization (50+ lines)

```typescript
// Database Query Optimizer with Query Plan Analysis
class DatabaseQueryOptimizer {
  private readonly pool: Pool;
  private readonly queryCache: LRUCache<string, QueryPlan>;
  private readonly slowQueryLogger: SlowQueryLogger;
  private readonly connectionMetrics: ConnectionMetrics;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 50, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.queryCache = new LRUCache<string, QueryPlan>({
      max: 1000,
      maxAge: 1000 * 60 * 30 // 30 minutes
    });

    this.slowQueryLogger = new SlowQueryLogger();
    this.connectionMetrics = new ConnectionMetrics();

    this.setupPoolListeners();
  }

  private setupPoolListeners(): void {
    this.pool.on('connect', () => {
      this.connectionMetrics.recordConnection();
    });

    this.pool.on('acquire', () => {
      this.connectionMetrics.recordAcquire();
    });

    this.pool.on('remove', () => {
      this.connectionMetrics.recordRelease();
    });

    this.pool.on('error', (err) => {
      logger.error(`Database pool error: ${err.message}`);
      this.connectionMetrics.recordError();
    });
  }

  public async query<T>(text: string, params?: any[], options?: QueryOptions): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(text, params);
    const queryId = uuidv4();

    try {
      // Check cache for query plan
      const cachedPlan = this.queryCache.get(cacheKey);
      if (cachedPlan) {
        logger.debug(`Using cached query plan for ${queryId}`);
        return this.executeWithPlan(text, params, cachedPlan, queryId);
      }

      // Get query plan
      const plan = await this.getQueryPlan(text, params);
      this.queryCache.set(cacheKey, plan);

      // Analyze plan for potential issues
      this.analyzeQueryPlan(plan, text, params);

      // Execute query
      const result = await this.executeWithPlan(text, params, plan, queryId);

      // Log slow queries
      const duration = Date.now() - startTime;
      if (duration > (options?.slowQueryThreshold || 1000)) {
        this.slowQueryLogger.log({
          queryId,
          text,
          params,
          duration,
          plan,
          timestamp: new Date()
        });
      }

      return result;
    } catch (err) {
      logger.error(`Query ${queryId} failed: ${err.message}`);
      throw this.enhanceError(err, text, params);
    }
  }

  private async getQueryPlan(text: string, params?: any[]): Promise<QueryPlan> {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, FORMAT JSON) ${text}`;
      const result = await this.pool.query(explainQuery, params);
      return JSON.parse(result.rows[0].QUERY_PLAN) as QueryPlan;
    } catch (err) {
      logger.error(`Failed to get query plan: ${err.message}`);
      throw err;
    }
  }

  private analyzeQueryPlan(plan: QueryPlan, text: string, params?: any[]): void {
    try {
      // Check for sequential scans
      const sequentialScans = this.findPlanNodes(plan, node => node['Node Type'] === 'Seq Scan');
      if (sequentialScans.length > 0) {
        logger.warn(`Query may benefit from index optimization (${sequentialScans.length} sequential scans)`);
        sequentialScans.forEach(scan => {
          logger.debug(`Sequential scan on ${scan['Relation Name']}`);
        });
      }

      // Check for high cost operations
      const highCostNodes = this.findPlanNodes(plan, node => {
        return node['Total Cost'] && node['Total Cost'] > 1000;
      });

      if (highCostNodes.length > 0) {
        logger.warn(`Query contains high-cost operations (${highCostNodes.length} nodes > 1000 cost)`);
        highCostNodes.forEach(node => {
          logger.debug(`High cost node: ${node['Node Type']} with cost ${node['Total Cost']}`);
        });
      }

      // Check for missing indexes
      const missingIndexes = this.findPlanNodes(plan, node => {
        return node['Index Cond'] === undefined &&
               node['Node Type'] === 'Index Scan' &&
               node['Relation Name'] !== undefined;
      });

      if (missingIndexes.length > 0) {
        logger.warn(`Query may benefit from additional indexes (${missingIndexes.length} missing)`);
        missingIndexes.forEach(node => {
          logger.debug(`Missing index on ${node['Relation Name']}`);
        });
      }

      // Check for large result sets
      if (plan['Plan']['Actual Rows'] && plan['Plan']['Actual Rows'] > 10000) {
        logger.warn(`Query returns large result set (${plan['Plan']['Actual Rows']} rows)`);
      }
    } catch (err) {
      logger.error(`Query plan analysis failed: ${err.message}`);
    }
  }

  private findPlanNodes(plan: any, predicate: (node: any) => boolean): any[] {
    const nodes: any[] = [];

    const traverse = (node: any) => {
      if (predicate(node)) {
        nodes.push(node);
      }

      if (node['Plans']) {
        node['Plans'].forEach(traverse);
      }

      if (node['Plan']) {
        traverse(node['Plan']);
      }
    };

    traverse(plan);
    return nodes;
  }

  private async executeWithPlan<T>(text: string, params: any[] | undefined, plan: QueryPlan, queryId: string): Promise<QueryResult<T>> {
    try {
      // Apply query hints based on plan analysis
      const hintedQuery = this.applyQueryHints(text, plan);

      // Execute with connection from pool
      const client = await this.pool.connect();
      try {
        // Set statement timeout based on query cost
        const timeout = this.calculateTimeout(plan);
        await client.query(`SET LOCAL statement_timeout = ${timeout}`);

        // Execute query
        const startTime = Date.now();
        const result = await client.query(hintedQuery, params);
        const duration = Date.now() - startTime;

        // Log successful execution
        logger.debug(`Query ${queryId} executed in ${duration}ms`);

        return result;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error(`Query execution failed for ${queryId}: ${err.message}`);
      throw err;
    }
  }

  private applyQueryHints(text: string, plan: QueryPlan): string {
    // This is a simplified version - in production you might use pg_hint_plan
    // or other PostgreSQL hint mechanisms

    // Check if we should force index usage
    const seqScans = this.findPlanNodes(plan, node => node['Node Type'] === 'Seq Scan');
    if (seqScans.length > 0) {
      // For each sequential scan, we might want to force an index
      // This is database-specific and would require pg_hint_plan
      logger.debug('Consider adding /*+ IndexScan(table_name index_name) */ hints');
    }

    return text;
  }

  private calculateTimeout(plan: QueryPlan): number {
    // Base timeout
    let timeout = 5000; // 5 seconds

    // Adjust based on query cost
    if (plan['Plan']['Total Cost']) {
      const cost = plan['Plan']['Total Cost'];
      if (cost > 10000) {
        timeout = 30000; // 30 seconds for expensive queries
      } else if (cost > 1000) {
        timeout = 15000; // 15 seconds for moderately expensive queries
      }
    }

    return timeout;
  }

  private enhanceError(err: Error, text: string, params?: any[]): Error {
    const enhancedError = new Error(`Database query failed: ${err.message}`);
    (enhancedError as any).originalError = err;
    (enhancedError as any).query = {
      text,
      params,
      timestamp: new Date()
    };

    return enhancedError;
  }

  public async batchQuery<T>(queries: QueryBatchItem[]): Promise<QueryResult<T>[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const results: QueryResult<T>[] = [];
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Batch query failed: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  public async getConnectionStats(): Promise<ConnectionStats> {
    return this.connectionMetrics.getStats();
  }

  private generateCacheKey(text: string, params?: any[]): string {
    // Create a consistent cache key
    const paramString = params ? params.map(p => {
      if (p === null || p === undefined) return 'null';
      if (typeof p === 'object') return JSON.stringify(p);
      return p.toString();
    }).join(',') : '';

    return `${text}:${paramString}`;
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Slow Query Logger with Analysis
class SlowQueryLogger {
  private readonly logFile: string;
  private readonly analysisInterval: NodeJS.Timeout;

  constructor() {
    this.logFile = path.join(__dirname, '..', 'logs', 'slow-queries.log');
    this.ensureLogFileExists();

    // Set up periodic analysis
    this.analysisInterval = setInterval(() => {
      this.analyzeSlowQueries().catch(err => {
        logger.error(`Slow query analysis failed: ${err.message}`);
      });
    }, 3600000); // Every hour
  }

  private ensureLogFileExists(): void {
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }

  public log(query: SlowQuery): void {
    const logEntry = {
      ...query,
      timestamp: query.timestamp.toISOString(),
      metadata: {
        environment: process.env.NODE_ENV,
        host: os.hostname()
      }
    };

    fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n', (err) => {
      if (err) {
        logger.error(`Failed to log slow query: ${err.message}`);
      }
    });
  }

  private async analyzeSlowQueries(): Promise<void> {
    try {
      const data = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      const queries: SlowQuery[] = lines.map(line => JSON.parse(line));

      if (queries.length === 0) return;

      // Group by query pattern
      const queryPatterns = this.groupByPattern(queries);

      // Find most common slow queries
      const sortedPatterns = Object.entries(queryPatterns)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      // Log analysis results
      logger.info('Top 5 slow query patterns:');
      sortedPatterns.forEach(([pattern, stats]) => {
        logger.info(`- ${pattern}: ${stats.count} occurrences, avg ${stats.avgDuration}ms`);
      });

      // Find queries with highest impact
      const highestImpact = queries
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3);

      logger.info('Highest impact slow queries:');
      highestImpact.forEach(query => {
        logger.info(`- ${query.queryId}: ${query.duration}ms, ${query.text.substring(0, 50)}...`);
      });

    } catch (err) {
      logger.error(`Slow query analysis failed: ${err.message}`);
    }
  }

  private groupByPattern(queries: SlowQuery[]): Record<string, { count: number; avgDuration: number }> {
    const patterns: Record<string, { count: number; totalDuration: number }> = {};

    queries.forEach(query => {
      // Normalize query text
      const normalized = query.text
        .replace(/\s+/g, ' ')
        .replace(/\$\d+/g, '?')
        .replace(/IN \(\?\)/g, 'IN (...)');

      if (!patterns[normalized]) {
        patterns[normalized] = { count: 0, totalDuration: 0 };
      }

      patterns[normalized].count++;
      patterns[normalized].totalDuration += query.duration;
    });

    // Convert to average duration
    const result: Record<string, { count: number; avgDuration: number }> = {};
    for (const [pattern, stats] of Object.entries(patterns)) {
      result[pattern] = {
        count: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count)
      };
    }

    return result;
  }

  public async getSlowQueries(limit: number = 100): Promise<SlowQuery[]> {
    try {
      const data = await fs.promises.readFile(this.logFile, 'utf8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      return lines
        .map(line => JSON.parse(line))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, limit);
    } catch (err) {
      logger.error(`Failed to read slow queries: ${err.message}`);
      return [];
    }
  }
}
```

### API Response Compression (30+ lines)

```typescript
// Advanced API Response Compression Middleware
class ResponseCompressionMiddleware {
  private readonly compression: Compression;
  private readonly brotliOptions: BrotliOptions;
  private readonly gzipOptions: ZlibOptions;
  private readonly metrics: CompressionMetrics;
  private readonly contentTypePatterns: RegExp[];

  constructor() {
    // Initialize metrics
    this.metrics = new CompressionMetrics();

    // Configure Brotli
    this.brotliOptions = {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 6, // Balance between speed and compression
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT
    };

    // Configure Gzip
    this.gzipOptions = {
      level: zlib.constants.Z_BEST_COMPRESSION,
      memLevel: 9,
      strategy: zlib.constants.Z_DEFAULT_STRATEGY,
      windowBits: 15
    };

    // Initialize compression middleware
    this.compression = compression({
      filter: this.shouldCompress.bind(this),
      threshold: 1024, // 1KB
      brotli: this.brotliOptions,
      gzip: this.gzipOptions,
      deflate: false // We'll only use Brotli and Gzip
    });

    // Content types that should be compressed
    this.contentTypePatterns = [
      /^application\/json$/i,
      /^application\/javascript$/i,
      /^text\//i,
      /^application\/xml$/i,
      /^application\/vnd\.api\+json$/i,
      /^image\/svg\+xml$/i
    ];
  }

  public middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Wrap the response to track compression
      const originalWrite = res.write;
      const originalEnd = res.end;
      const originalSetHeader = res.setHeader;

      let compressionUsed: 'brotli' | 'gzip' | null = null;
      let originalSize = 0;
      let compressedSize = 0;
      const startTime = Date.now();

      // Track response size
      res.write = function(chunk: any, ...args: any[]): boolean {
        if (chunk) {
          originalSize += chunk.length;
        }
        return originalWrite.apply(res, [chunk, ...args]);
      };

      // Track when response ends
      res.end = function(chunk: any, ...args: any[]): void {
        if (chunk) {
          originalSize += chunk.length;
        }

        // Get compression type from headers
        const contentEncoding = res.getHeader('Content-Encoding');
        if (contentEncoding === 'br') {
          compressionUsed = 'brotli';
        } else if (contentEncoding === 'gzip') {
          compressionUsed = 'gzip';
        }

        // Calculate compression ratio
        if (compressionUsed && originalSize > 0) {
          compressedSize = res.getHeader('Content-Length') as number || 0;
          const ratio = compressedSize / originalSize;

          this.metrics.recordCompression({
            type: compressionUsed,
            originalSize,
            compressedSize,
            ratio,
            duration: Date.now() - startTime,
            contentType: res.getHeader('Content-Type') as string,
            statusCode: res.statusCode
          });
        }

        originalEnd.apply(res, [chunk, ...args]);
      }.bind(this);

      // Track header changes
      res.setHeader = function(name: string, value: any): void {
        if (name.toLowerCase() === 'content-encoding') {
          if (value === 'br') {
            compressionUsed = 'brotli';
          } else if (value === 'gzip') {
            compressionUsed = 'gzip';
          }
        }
        originalSetHeader.apply(res, [name, value]);
      };

      // Apply compression middleware
      this.compression(req, res, next);
    };
  }

  private shouldCompress(req: Request, res: Response): boolean {
    // Don't compress if already compressed
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress if client doesn't accept compression
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('br') && !acceptEncoding.includes('gzip')) {
      return false;
    }

    // Check content type
    const contentType = res.getHeader('Content-Type') as string;
    if (!contentType) {
      return false;
    }

    // Check if content type matches our patterns
    const shouldCompress = this.contentTypePatterns.some(pattern =>
      pattern.test(contentType)
    );

    if (!shouldCompress) {
      return false;
    }

    // Check if response is already small
    const contentLength = res.getHeader('Content-Length');
    if (contentLength && Number(contentLength) < 1024) {
      return false;
    }

    return true;
  }

  public getMetrics(): CompressionMetricsSnapshot {
    return this.metrics.getSnapshot();
  }
}

// Compression Metrics Tracking
class CompressionMetrics {
  private readonly metrics: {
    brotli: CompressionStats;
    gzip: CompressionStats;
    uncompressed: number;
    timestamps: number[];
  };

  constructor() {
    this.metrics = {
      brotli: {
        count: 0,
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalDuration: 0
      },
      gzip: {
        count: 0,
        totalOriginalSize: 0,
        totalCompressedSize: 0,
        totalDuration: 0
      },
      uncompressed: 0,
      timestamps: []
    };
  }

  public recordCompression(compression: CompressionRecord): void {
    if (compression.type === 'brotli') {
      this.metrics.brotli.count++;
      this.metrics.brotli.totalOriginalSize += compression.originalSize;
      this.metrics.brotli.totalCompressedSize += compression.compressedSize;
      this.metrics.brotli.totalDuration += compression.duration;
    } else if (compression.type === 'gzip') {
      this.metrics.gzip.count++;
      this.metrics.gzip.totalOriginalSize += compression.originalSize;
      this.metrics.gzip.totalCompressedSize += compression.compressedSize;
      this.metrics.gzip.totalDuration += compression.duration;
    } else {
      this.metrics.uncompressed++;
    }

    this.metrics.timestamps.push(Date.now());
    // Keep only last 1000 timestamps
    if (this.metrics.timestamps.length > 1000) {
      this.metrics.timestamps.shift();
    }
  }

  public getSnapshot(): CompressionMetricsSnapshot {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentTimestamps = this.metrics.timestamps.filter(ts => now - ts <= timeWindow);

    return {
      brotli: this.calculateStats(this.metrics.brotli),
      gzip: this.calculateStats(this.metrics.gzip),
      uncompressed: this.metrics.uncompressed,
      recentRequestsPerSecond: recentTimestamps.length / (timeWindow / 1000)
    };
  }

  private calculateStats(stats: CompressionStats): CompressionStatsSnapshot {
    if (stats.count === 0) {
      return {
        count: 0,
        avgOriginalSize: 0,
        avgCompressedSize: 0,
        avgRatio: 0,
        avgDuration: 0
      };
    }

    return {
      count: stats.count,
      avgOriginalSize: Math.round(stats.totalOriginalSize / stats.count),
      avgCompressedSize: Math.round(stats.totalCompressedSize / stats.count),
      avgRatio: stats.totalCompressedSize / stats.totalOriginalSize,
      avgDuration: Math.round(stats.totalDuration / stats.count)
    };
  }
}
```

### Lazy Loading Implementation (40+ lines)

```typescript
// Advanced Lazy Loading Service with Intersection Observer
class LazyLoadingService {
  private readonly observer: IntersectionObserver;
  private readonly observedElements: Map<Element, LazyLoadConfig>;
  private readonly preloadQueue: PriorityQueue<LazyLoadItem>;
  private readonly metrics: LazyLoadMetrics;
  private readonly preloadCache: Map<string, Promise<any>>;
  private readonly preloadStrategies: Record<string, PreloadStrategy>;

  constructor() {
    // Initialize metrics
    this.metrics = new LazyLoadMetrics();

    // Initialize preload queue with priority
    this.preloadQueue = new PriorityQueue<LazyLoadItem>({
      comparator: (a, b) => b.priority - a.priority
    });

    // Initialize cache for preloaded resources
    this.preloadCache = new Map();

    // Configure preload strategies
    this.preloadStrategies = {
      image: this.preloadImage.bind(this),
      component: this.preloadComponent.bind(this),
      data: this.preloadData.bind(this),
      iframe: this.preloadIframe.bind(this)
    };

    // Configure Intersection Observer
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: null,
        rootMargin: '200px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    );

    // Set up periodic processing of preload queue
    setInterval(() => this.processPreloadQueue(), 100);
  }

  public observe(element: Element, config: LazyLoadConfig): void {
    if (this.observedElements.has(element)) {
      return;
    }

    // Store element with its config
    this.observedElements.set(element, config);

    // Start observing
    this.observer.observe(element);

    // Record observation
    this.metrics.recordObservation(config.type);
  }

  public unobserve(element: Element): void {
    if (!this.observedElements.has(element)) {
      return;
    }

    // Stop observing
    this.observer.unobserve(element);

    // Remove from observed elements
    this.observedElements.delete(element);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      const element = entry.target;
      const config = this.observedElements.get(element);

      if (!config) {
        this.unobserve(element);
        return;
      }

      // Calculate visibility percentage
      const visibility = this.calculateVisibility(entry);

      // Update metrics
      this.metrics.recordVisibility(config.type, visibility);

      // Check if we should load
      if (this.shouldLoad(entry, config)) {
        // Load the resource
        this.loadResource(element, config);

        // Unobserve after loading
        this.unobserve(element);
      } else if (visibility > 0.1 && config.preload) {
        // Add to preload queue if not already there
        this.addToPreloadQueue(element, config, visibility);
      }
    });
  }

  private calculateVisibility(entry: IntersectionObserverEntry): number {
    const { intersectionRatio, intersectionRect, boundingClientRect } = entry;

    // If fully visible, use intersectionRatio
    if (intersectionRatio === 1) {
      return 1;
    }

    // Calculate area-based visibility
    const visibleArea = intersectionRect.width * intersectionRect.height;
    const totalArea = boundingClientRect.width * boundingClientRect.height;

    return visibleArea / totalArea;
  }

  private shouldLoad(entry: IntersectionObserverEntry, config: LazyLoadConfig): boolean {
    // Always load if fully visible
    if (entry.isIntersecting && entry.intersectionRatio === 1) {
      return true;
    }

    // Check if we've crossed the threshold
    if (entry.isIntersecting && entry.intersectionRatio >= (config.threshold || 0.5)) {
      return true;
    }

    // Check if we're close enough and moving toward the viewport
    if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
      // Check if we're moving toward the viewport
      const previousEntry = this.getPreviousEntry(entry.target);
      if (previousEntry) {
        const currentRatio = entry.intersectionRatio;
        const previousRatio = previousEntry.intersectionRatio;

        // If we're getting closer to full visibility, load
        if (currentRatio > previousRatio) {
          return true;
        }
      }
    }

    return false;
  }

  private getPreviousEntry(target: Element): IntersectionObserverEntry | null {
    // This would be implemented with a map tracking previous entries
    // For simplicity, we'll return null here
    return null;
  }

  private async loadResource(element: Element, config: LazyLoadConfig): Promise<void> {
    const startTime = Date.now();
    this.metrics.recordLoadStart(config.type);

    try {
      switch (config.type) {
        case 'image':
          await this.loadImage(element as HTMLImageElement, config);
          break;
        case 'component':
          await this.loadComponent(element, config);
          break;
        case 'data':
          await this.loadData(element, config);
          break;
        case 'iframe':
          await this.loadIframe(element as HTMLIFrameElement, config);
          break;
        default:
          logger.warn(`Unknown lazy load type: ${config.type}`);
      }

      this.metrics.recordLoadSuccess(config.type, Date.now() - startTime);
    } catch (err) {
      logger.error(`Failed to load ${config.type}: ${err.message}`);
      this.metrics.recordLoadError(config.type, Date.now() - startTime);

      // Apply fallback if available
      if (config.fallback) {
        this.applyFallback(element, config);
      }
    }
  }

  private async loadImage(element: HTMLImageElement, config: LazyLoadConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (element.complete) {
        resolve();
        return;
      }

      // Set up event listeners
      const onLoad = () => {
        element.removeEventListener('load', onLoad);
        element.removeEventListener('error', onError);
        resolve();
      };

      const onError = (err: ErrorEvent) => {
        element.removeEventListener('load', onLoad);
        element.removeEventListener('error', onError);
        reject(new Error(`Image load failed: ${err.message}`));
      };

      element.addEventListener('load', onLoad);
      element.addEventListener('error', onError);

      // Set src if not already set
      if (!element.src && config.src) {
        element.src = config.src;
      }

      // Set srcset if available
      if (config.srcset && !element.srcset) {
        element.srcset = config.srcset;
      }

      // Set sizes if available
      if (config.sizes && !element.sizes) {
        element.sizes = config.sizes;
      }
    });
  }

  private async loadComponent(element: Element, config: LazyLoadConfig): Promise<void> {
    if (!config.componentName) {
      throw new Error('Component name is required for component lazy loading');
    }

    // Check cache first
    const cacheKey = `component:${config.componentName}`;
    if (this.preloadCache.has(cacheKey)) {
      const component = await this.preloadCache.get(cacheKey);
      this.renderComponent(element, component);
      return;
    }

    // Load component
    const component = await this.loadComponentModule(config.componentName);
    this.renderComponent(element, component);

    // Cache for future use
    this.preloadCache.set(cacheKey, Promise.resolve(component));
  }

  private async loadComponentModule(componentName: string): Promise<any> {
    try {
      // In a real implementation, this would use dynamic imports
      // For example: return import(`./components/${componentName}.js`);
      return Promise.resolve({});
    } catch (err) {
      logger.error(`Failed to load component ${componentName}: ${err.message}`);
      throw err;
    }
  }

  private renderComponent(element: Element, component: any): void {
    // In a real implementation, this would render the component
    // into the element
    element.innerHTML = `<div>Component ${component.name} loaded</div>`;
  }

  private async loadData(element: Element, config: LazyLoadConfig): Promise<void> {
    if (!config.dataUrl) {
      throw new Error('Data URL is required for data lazy loading');
    }

    // Check cache first
    const cacheKey = `data:${config.dataUrl}`;
    if (this.preloadCache.has(cacheKey)) {
      const data = await this.preloadCache.get(cacheKey);
      this.renderData(element, data);
      return;
    }

    // Load data
    const data = await this.fetchData(config.dataUrl);
    this.renderData(element, data);

    // Cache for future use
    this.preloadCache.set(cacheKey, Promise.resolve(data));
  }

  private async fetchData(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      logger.error(`Failed to fetch data from ${url}: ${err.message}`);
      throw err;
    }
  }

  private renderData(element: Element, data: any): void {
    // In a real implementation, this would render the data
    // into the element
    element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  private async loadIframe(element: HTMLIFrameElement, config: LazyLoadConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (element.contentDocument?.readyState === 'complete') {
        resolve();
        return;
      }

      // Set up event listeners
      const onLoad = () => {
        element.removeEventListener('load', onLoad);
        element.removeEventListener('error', onError);
        resolve();
      };

      const onError = (err: ErrorEvent) => {
        element.removeEventListener('load', onLoad);
        element.removeEventListener('error', onError);
        reject(new Error(`Iframe load failed: ${err.message}`));
      };

      element.addEventListener('load', onLoad);
      element.addEventListener('error', onError);

      // Set src if not already set
      if (!element.src && config.src) {
        element.src = config.src;
      }
    });
  }

  private addToPreloadQueue(element: Element, config: LazyLoadConfig, visibility: number): void {
    // Calculate priority based on visibility and type
    const priority = this.calculatePreloadPriority(config, visibility);

    // Check if already in queue
    const existingItem = Array.from(this.preloadQueue.heap).find(
      item => item.element === element
    );

    if (existingItem) {
      // Update priority if higher
      if (priority > existingItem.priority) {
        existingItem.priority = priority;
        this.preloadQueue.heapify();
      }
      return;
    }

    // Add to queue
    this.preloadQueue.queue({
      element,
      config,
      priority,
      addedAt: Date.now()
    });

    this.metrics.recordPreloadQueued(config.type);
  }

  private calculatePreloadPriority(config: LazyLoadConfig, visibility: number): number {
    // Base priority based on type
    let priority = 0;
    switch (config.type) {
      case 'image':
        priority = 3;
        break;
      case 'component':
        priority = 4;
        break;
      case 'data':
        priority = 2;
        break;
      case 'iframe':
        priority = 1;
        break;
    }

    // Adjust based on visibility
    priority *= (1 + visibility);

    // Adjust based on preload setting
    if (config.preload === 'high') {
      priority *= 2;
    } else if (config.preload === 'low') {
      priority *= 0.5;
    }

    return priority;
  }

  private async processPreloadQueue(): Promise<void> {
    if (this.preloadQueue.length === 0) {
      return;
    }

    // Process up to 3 items at a time
    const batchSize = 3;
    const itemsToProcess: LazyLoadItem[] = [];

    for (let i = 0; i < batchSize && this.preloadQueue.length > 0; i++) {
      const item = this.preloadQueue.dequeue();
      if (item) {
        itemsToProcess.push(item);
      }
    }

    // Process each item
    await Promise.all(itemsToProcess.map(async item => {
      try {
        // Check if element is still in DOM
        if (!document.contains(item.element)) {
          this.metrics.recordPreloadAbandoned(item.config.type);
          return;
        }

        // Check if already loaded
        if (this.isLoaded(item.element, item.config)) {
          this.metrics.recordPreloadUnnecessary(item.config.type);
          return;
        }

        // Preload based on type
        const strategy = this.preloadStrategies[item.config.type];
        if (strategy) {
          await strategy(item.element, item.config);
          this.metrics.recordPreloadSuccess(item.config.type);
        }
      } catch (err) {
        logger.error(`Preload failed for ${item.config.type}: ${err.message}`);
        this.metrics.recordPreloadError(item.config.type);
      }
    }));
  }

  private isLoaded(element: Element, config: LazyLoadConfig): boolean {
    switch (config.type) {
      case 'image':
        return (element as HTMLImageElement).complete;
      case 'component':
        return element.innerHTML.includes(`Component ${config.componentName} loaded`);
      case 'data':
        return element.innerHTML.includes('pre>');
      case 'iframe':
        return (element as HTMLIFrameElement).contentDocument?.readyState === 'complete';
      default:
        return false;
    }
  }

  private async preloadImage(element: HTMLImageElement, config: LazyLoadConfig): Promise<void> {
    if (!config.src) {
      return;
    }

    // Create a new Image object to preload
    const img = new Image();
    img.src = config.src;

    // Set srcset if available
    if (config.srcset) {
      img.srcset = config.srcset;
    }

    // Set sizes if available
    if (config.sizes) {
      img.sizes = config.sizes;
    }

    // Wait for load or error
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image preload failed'));
    });
  }

  private async preloadComponent(element: Element, config: LazyLoadConfig): Promise<void> {
    if (!config.componentName) {
      return;
    }

    // Check cache first
    const cacheKey = `component:${config.componentName}`;
    if (this.preloadCache.has(cacheKey)) {
      return;
    }

    // Preload component
    const component = await this.loadComponentModule(config.componentName);

    // Cache for future use
    this.preloadCache.set(cacheKey, Promise.resolve(component));
  }

  private async preloadData(element: Element, config: LazyLoadConfig): Promise<void> {
    if (!config.dataUrl) {
      return;
    }

    // Check cache first
    const cacheKey = `data:${config.dataUrl}`;
    if (this.preloadCache.has(cacheKey)) {
      return;
    }

    // Preload data
    const data = await this.fetchData(config.dataUrl);

    // Cache for future use
    this.preloadCache.set(cacheKey, Promise.resolve(data));
  }

  private async preloadIframe(element: HTMLIFrameElement, config: LazyLoadConfig): Promise<void> {
    if (!config.src) {
      return;
    }

    // Create a new iframe to preload
    const iframe = document.createElement('iframe');
    iframe.src = config.src;

    // Add to DOM temporarily
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Wait for load or error
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => {
        document.body.removeChild(iframe);
        resolve();
      };
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Iframe preload failed'));
      };
    });
  }

  private applyFallback(element: Element, config: LazyLoadConfig): void {
    if (!config.fallback) {
      return;
    }

    switch (config.type) {
      case 'image':
        (element as HTMLImageElement).src = config.fallback;
        break;
      case 'component':
        element.innerHTML = config.fallback;
        break;
      case 'data':
        element.innerHTML = config.fallback;
        break;
      case 'iframe':
        (element as HTMLIFrameElement).src = config.fallback;
        break;
    }
  }

  public getMetrics(): LazyLoadMetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  public disconnect(): void {
    this.observer.disconnect();
    clearInterval(this.processPreloadQueue as any);
  }
}

// Priority Queue Implementation
class PriorityQueue<T> {
  public heap: T[];
  private comparator: (a: T, b: T) => number;

  constructor({ comparator }: { comparator: (a: T, b: T) => number }) {
    this.heap = [];
    this.comparator = comparator;
  }

  public queue(value: T): void {
    this.heap.push(value);
    this.heapifyUp();
  }

  public dequeue(): T | undefined {
    if (this.length === 0) {
      return undefined;
    }

    const root = this.heap[0];
    const last = this.heap.pop();

    if (this.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.heapifyDown();
    }

    return root;
  }

  public peek(): T | undefined {
    return this.heap[0];
  }

  public get length(): number {
    return this.heap.length;
  }

  private heapifyUp(): void {
    let index = this.length - 1;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (this.comparator(this.heap[index], this.heap[parentIndex]) >= 0) {
        break;
      }

      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private heapifyDown(): void {
    let index = 0;

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestChildIndex = index;

      if (
        leftChildIndex < this.length &&
        this.comparator(this.heap[leftChildIndex], this.heap[smallestChildIndex]) < 0
      ) {
        smallestChildIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this.length &&
        this.comparator(this.heap[rightChildIndex], this.heap[smallestChildIndex]) < 0
      ) {
        smallestChildIndex = rightChildIndex;
      }

      if (smallestChildIndex === index) {
        break;
      }

      [this.heap[index], this.heap[smallestChildIndex]] = [this.heap[smallestChildIndex], this.heap[index]];
      index = smallestChildIndex;
    }
  }
}
```

### Request Debouncing (30+ lines)

```typescript
// Advanced Request Debouncer with Adaptive Throttling
class RequestDebouncer {
  private readonly debounceTimers: Map<string, NodeJS.Timeout>;
  private readonly throttleTimers: Map<string, NodeJS.Timeout>;
  private readonly adaptiveDelays: Map<string, AdaptiveDelay>;
  private readonly metrics: DebounceMetrics;
  private readonly defaultDebounceTime: number;
  private readonly defaultThrottleTime: number;
  private readonly maxQueueSize: number;

  constructor(options: DebouncerOptions = {}) {
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.adaptiveDelays = new Map();
    this.metrics = new DebounceMetrics();
    this.defaultDebounceTime = options.defaultDebounceTime || 300;
    this.defaultThrottleTime = options.defaultThrottleTime || 1000;
    this.maxQueueSize = options.maxQueueSize || 100;
  }

  public debounce<T extends any[]>(
    key: string,
    fn: (...args: T) => void,
    options?: DebounceOptions
  ): (...args: T) => void {
    return (...args: T) => {
      // Clear any existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Get debounce time
      const debounceTime = this.getAdaptiveDelay(key, options?.time || this.defaultDebounceTime);

      // Set new timer
      const timer = setTimeout(() => {
        try {
          fn(...args);
          this.metrics.recordDebounceSuccess(key);
          this.adjustAdaptiveDelay(key, true);
        } catch (err) {
          logger.error(`Debounced function failed for ${key}: ${err.message}`);
          this.metrics.recordDebounceError(key);
          this.adjustAdaptiveDelay(key, false);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, debounceTime);

      this.debounceTimers.set(key, timer);
      this.metrics.recordDebounceCall(key);
    };
  }

  public throttle<T extends any[]>(
    key: string,
    fn: (...args: T) => void,
    options?: ThrottleOptions
  ): (...args: T) => void {
    return (...args: T) => {
      // Check if we're currently throttled
      if (this.throttleTimers.has(key)) {
        this.metrics.recordThrottleRejected(key);
        return;
      }

      // Get throttle time
      const throttleTime = this.getAdaptiveDelay(key, options?.time || this.defaultThrottleTime);

      // Execute immediately
      try {
        fn(...args);
        this.metrics.recordThrottleSuccess(key);
        this.adjustAdaptiveDelay(key, true);
      } catch (err) {
        logger.error(`Throttled function failed for ${key}: ${err.message}`);
        this.metrics.recordThrottleError(key);
        this.adjustAdaptiveDelay(key, false);
      }

      // Set timer to clear throttle
      const timer = setTimeout(() => {
        this.throttleTimers.delete(key);
      }, throttleTime);

      this.throttleTimers.set(key, timer);
      this.metrics.recordThrottleCall(key);
    };
  }

  public async debounceAsync<T extends any[], R>(
    key: string,
    fn: (...args: T) => Promise<R>,
    options?: DebounceOptions
  ): Promise<R | undefined> {
    return new Promise((resolve, reject) => {
      // Clear any existing timer
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Get debounce time
      const debounceTime = this.getAdaptiveDelay(key, options?.time || this.defaultDebounceTime);

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const result = await fn(...(options?.args as T));
          this.metrics.recordDebounceSuccess(key);
          this.adjustAdaptiveDelay(key, true);
          resolve(result);
        } catch (err) {
          logger.error(`Debounced async function failed for ${key}: ${err.message}`);
          this.metrics.recordDebounceError(key);
          this.adjustAdaptiveDelay(key, false);
          reject(err);
        } finally {
          this.debounceTimers.delete(key);
        }
      }, debounceTime);

      this.debounceTimers.set(key, timer);
      this.metrics.recordDebounceCall(key);
    });
  }

  public queue<T extends any[], R>(
    key: string,
    fn: (...args: T) => Promise<R>,
    options?: QueueOptions
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      // Check if we have a queue for this key
      if (!this.adaptiveDelays.has(key)) {
        this.adaptiveDelays.set(key, {
          currentDelay: options?.initialDelay || 100,
          successCount: 0,
          errorCount: 0,
          lastCallTime: 0,
          queue: []
        });
      }

      const adaptiveDelay = this.adaptiveDelays.get(key)!;

      // Check queue size
      if (adaptiveDelay.queue.length >= this.maxQueueSize) {
        this.metrics.recordQueueRejected(key);
        reject(new Error(`Queue for ${key} is full`));
        return;
      }

      // Add to queue
      adaptiveDelay.queue.push({
        fn,
        args: options?.args as T,
        resolve,
        reject,
        enqueuedAt: Date.now()
      });

      this.metrics.recordQueueCall(key);

      // Process queue if not already processing
      if (adaptiveDelay.queue.length === 1) {
        this.processQueue(key);
      }
    });
  }

  private async processQueue(key: string): Promise<void> {
    const adaptiveDelay = this.adaptiveDelays.get(key);
    if (!adaptiveDelay || adaptiveDelay.queue.length === 0) {
      return;
    }

    const queueItem = adaptiveDelay.queue[0];

    try {
      // Calculate delay since last call
      const now = Date.now();
      const timeSinceLastCall = now - adaptiveDelay.lastCallTime;
      const delay = Math.max(0, adaptiveDelay.currentDelay - timeSinceLastCall);

      // Wait for the delay
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Execute the function
      const result = await queueItem.fn(...queueItem.args);
      queueItem.resolve(result);

      this.metrics.recordQueueSuccess(key);
      this.adjustAdaptiveDelay(key, true);
    } catch (err) {
      queueItem.reject(err);
      this.metrics.recordQueueError(key);
      this.adjustAdaptiveDelay(key, false);
    } finally {
      // Remove from queue
      adaptiveDelay.queue.shift();
      adaptiveDelay.lastCallTime = Date.now();

      // Process next item
      if (adaptiveDelay.queue.length > 0) {
        this.processQueue(key);
      }
    }
  }

  private getAdaptiveDelay(key: string, defaultTime: number): number {
    if (!this.adaptiveDelays.has(key)) {
      return defaultTime;
    }

    const adaptiveDelay = this.adaptiveDelays.get(key)!;
    return Math.min(
      Math.max(adaptiveDelay.currentDelay, 50), // Minimum 50ms
      defaultTime * 2 // Maximum 2x default
    );
  }

  private adjustAdaptiveDelay(key: string, success: boolean): void {
    if (!this.adaptiveDelays.has(key)) {
      this.adaptiveDelays.set(key, {
        currentDelay: this.defaultDebounceTime,
        successCount: 0,
        errorCount: 0,
        lastCallTime: 0,
        queue: []
      });
    }

    const adaptiveDelay = this.adaptiveDelays.get(key)!;

    if (success) {
      adaptiveDelay.successCount++;
      adaptiveDelay.errorCount = Math.max(0, adaptiveDelay.errorCount - 1);

      // Decrease delay on success
      if (adaptiveDelay.successCount >= 3) {
        adaptiveDelay.currentDelay = Math.max(
          50, // Minimum 50ms
          adaptiveDelay.currentDelay * 0.8
        );
        adaptiveDelay.successCount = 0;
      }
    } else {
      adaptiveDelay.errorCount++;
      adaptiveDelay.successCount = Math.max(0, adaptiveDelay.successCount - 1);

      // Increase delay on error
      if (adaptiveDelay.errorCount >= 2) {
        adaptiveDelay.currentDelay = Math.min(
          this.defaultDebounceTime * 2, // Maximum 2x default
          adaptiveDelay.currentDelay * 1.5
        );
        adaptiveDelay.errorCount = 0;
      }
    }
  }

  public getMetrics(): DebounceMetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  public clear(key: string): void {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
      this.debounceTimers.delete(key);
    }

    if (this.throttleTimers.has(key)) {
      clearTimeout(this.throttleTimers.get(key));
      this.throttleTimers.delete(key);
    }

    if (this.adaptiveDelays.has(key)) {
      const adaptiveDelay = this.adaptiveDelays.get(key)!;
      adaptiveDelay.queue.forEach(item => item.reject(new Error('Debouncer cleared')));
      this.adaptiveDelays.delete(key);
    }
  }

  public clearAll(): void {
    // Clear debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear throttle timers
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();

    // Clear queues
    this.adaptiveDelays.forEach(adaptiveDelay => {
      adaptiveDelay.queue.forEach(item => item.reject(new Error('Debouncer cleared')));
    });
    this.adaptiveDelays.clear();
  }
}

// Debounce Metrics Tracking
class DebounceMetrics {
  private readonly metrics: Record<string, {
    debounce: {
      calls: number;
      successes: number;
      errors: number;
      rejections: number;
    };
    throttle: {
      calls: number;
      successes: number;
      errors: number;
      rejections: number;
    };
    queue: {
      calls: number;
      successes: number;
      errors: number;
      rejections: number;
    };
    timestamps: number[];
  }>;

  constructor() {
    this.metrics = {};
  }

  public recordDebounceCall(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].debounce.calls++;
    this.recordTimestamp(key);
  }

  public recordDebounceSuccess(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].debounce.successes++;
  }

  public recordDebounceError(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].debounce.errors++;
  }

  public recordThrottleCall(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].throttle.calls++;
    this.recordTimestamp(key);
  }

  public recordThrottleSuccess(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].throttle.successes++;
  }

  public recordThrottleError(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].throttle.errors++;
  }

  public recordThrottleRejected(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].throttle.rejections++;
  }

  public recordQueueCall(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].queue.calls++;
    this.recordTimestamp(key);
  }

  public recordQueueSuccess(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].queue.successes++;
  }

  public recordQueueError(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].queue.errors++;
  }

  public recordQueueRejected(key: string): void {
    this.ensureKeyExists(key);
    this.metrics[key].queue.rejections++;
  }

  private ensureKeyExists(key: string): void {
    if (!this.metrics[key]) {
      this.metrics[key] = {
        debounce: { calls: 0, successes: 0, errors: 0, rejections: 0 },
        throttle: { calls: 0, successes: 0, errors: 0, rejections: 0 },
        queue: { calls: 0, successes: 0, errors: 0, rejections: 0 },
        timestamps: []
      };
    }
  }

  private recordTimestamp(key: string): void {
    this.metrics[key].timestamps.push(Date.now());
    // Keep only last 1000 timestamps
    if (this.metrics[key].timestamps.length > 1000) {
      this.metrics[key].timestamps.shift();
    }
  }

  public getSnapshot(): DebounceMetricsSnapshot {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const result: DebounceMetricsSnapshot = {};

    for (const [key, metrics] of Object.entries(this.metrics)) {
      const recentTimestamps = metrics.timestamps.filter(ts => now - ts <= timeWindow);

      result[key] = {
        debounce: {
          calls: metrics.debounce.calls,
          successRate: metrics.debounce.calls > 0
            ? metrics.debounce.successes / metrics.debounce.calls
            : 0,
          errorRate: metrics.debounce.calls > 0
            ? metrics.debounce.errors / metrics.debounce.calls
            : 0
        },
        throttle: {
          calls: metrics.throttle.calls,
          successRate: metrics.throttle.calls > 0
            ? metrics.throttle.successes / metrics.throttle.calls
            : 0,
          errorRate: metrics.throttle.calls > 0
            ? metrics.throttle.errors / metrics.throttle.calls
            : 0,
          rejectionRate: metrics.throttle.calls > 0
            ? metrics.throttle.rejections / metrics.throttle.calls
            : 0
        },
        queue: {
          calls: metrics.queue.calls,
          successRate: metrics.queue.calls > 0
            ? metrics.queue.successes / metrics.queue.calls
            : 0,
          errorRate: metrics.queue.calls > 0
            ? metrics.queue.errors / metrics.queue.calls
            : 0,
          rejectionRate: metrics.queue.calls > 0
            ? metrics.queue.rejections / metrics.queue.calls
            : 0
        },
        recentCallsPerSecond: recentTimestamps.length / (timeWindow / 1000)
      };
    }

    return result;
  }
}
```

### Connection Pooling (30+ lines)

```typescript
// Advanced Database Connection Pool with Adaptive Scaling
class AdaptiveConnectionPool {
  private readonly pools: Map<string, Pool>;
  private readonly poolMetrics: PoolMetrics;
  private readonly adaptiveScaler: AdaptiveScaler;
  private readonly connectionStrategies: Record<string, ConnectionStrategy>;
  private readonly defaultPoolConfig: PoolConfig;

  constructor() {
    this.pools = new Map();
    this.poolMetrics = new PoolMetrics();
    this.adaptiveScaler = new AdaptiveScaler();

    // Default pool configuration
    this.defaultPoolConfig = {
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      maxUses: 1000,
      reapIntervalMillis: 1000,
      log: (msg: string, level: string) => {
        switch (level) {
          case 'error':
            logger.error(msg);
            break;
          case 'warn':
            logger.warn(msg);
            break;
          case 'info':
            logger.info(msg);
            break;
          case 'debug':
            logger.debug(msg);
            break;
        }
      }
    };

    // Connection strategies
    this.connectionStrategies = {
      postgres: this.createPostgresPool.bind(this),
      mysql: this.createMysqlPool.bind(this),
      mongodb: this.createMongodbPool.bind(this),
      redis: this.createRedisPool.bind(this)
    };
  }

  public async getConnection(dbKey: string): Promise<PooledConnection> {
    const startTime = Date.now();
    this.poolMetrics.recordConnectionRequest(dbKey);

    try {
      // Get or create pool
      const pool = await this.getPool(dbKey);

      // Get connection from pool
      const connection = await pool.connect();

      // Wrap connection with metrics
      const wrappedConnection = this.wrapConnection(connection, dbKey);

      this.poolMetrics.recordConnectionAcquire(dbKey, Date.now() - startTime);
      return wrappedConnection;
    } catch (err) {
      this.poolMetrics.recordConnectionError(dbKey, Date.now() - startTime);
      logger.error(`Failed to get connection for ${dbKey}: ${err.message}`);
      throw err;
    }
  }

  private async getPool(dbKey: string): Promise<Pool> {
    // Check if pool exists
    if (this.pools.has(dbKey)) {
      return this.pools.get(dbKey)!;
    }

    // Get database configuration
    const dbConfig = await this.getDatabaseConfig(dbKey);
    if (!dbConfig) {
      throw new Error(`Database configuration not found for ${dbKey}`);
    }

    // Create new pool
    const pool = await this.createPool(dbKey, dbConfig);
    this.pools.set(dbKey, pool);

    // Set up event listeners
    this.setupPoolListeners(pool, dbKey);

    return pool;
  }

  private async getDatabaseConfig(dbKey: string): Promise<DatabaseConfig | null> {
    try {
      // In a real implementation, this would fetch from config service
      // For this example, we'll return a mock config
      const configs: Record<string, DatabaseConfig> = {
        'primary': {
          type: 'postgres',
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production'
        },
        'analytics': {
          type: 'mongodb',
          connectionString: process.env.MONGODB_URL,
          database: 'analytics'
        },
        'cache': {
          type: 'redis',
          connectionString: process.env.REDIS_URL
        }
      };

      return configs[dbKey] || null;
    } catch (err) {
      logger.error(`Failed to get database config for ${dbKey}: ${err.message}`);
      return null;
    }
  }

  private async createPool(dbKey: string, config: DatabaseConfig): Promise<Pool> {
    // Get strategy based on database type
    const strategy = this.connectionStrategies[config.type];
    if (!strategy) {
      throw new Error(`Unsupported database type: ${config.type}`);
    }

    // Create pool with adaptive configuration
    const adaptiveConfig = this.adaptiveScaler.getPoolConfig(dbKey, this.defaultPoolConfig);
    return strategy(config, adaptiveConfig);
  }

  private createPostgresPool(config: DatabaseConfig, poolConfig: PoolConfig): Pool {
    return new Pool({
      ...poolConfig,
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false
    });
  }

  private createMysqlPool(config: DatabaseConfig, poolConfig: PoolConfig): Pool {
    const mysql = require('mysql2/promise');
    return mysql.createPool({
      ...poolConfig,
      uri: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined
    });
  }

  private createMongodbPool(config: DatabaseConfig, poolConfig: PoolConfig): Pool {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(config.connectionString, {
      maxPoolSize: poolConfig.max,
      minPoolSize: poolConfig.min,
      maxIdleTimeMS: poolConfig.idleTimeoutMillis,
      connectTimeoutMS: poolConfig.connectionTimeoutMillis
    });

    return {
      connect: async () => {
        await client.connect();
        return client.db(config.database);
      },
      end: async () => {
        await client.close();
      }
    } as Pool;
  }

  private createRedisPool(config: DatabaseConfig, poolConfig: PoolConfig): Pool {
    const redis = require('redis');
    const { promisify } = require('util');

    return {
      connect: async () => {
        const client = redis.createClient({
          url: config.connectionString,
          socket: {
            tls: config.ssl,
            rejectUnauthorized: false
          }
        });

        client.on('error', (err: Error) => {
          logger.error(`Redis connection error: ${err.message}`);
        });

        await client.connect();
        return {
          query: promisify(client.sendCommand).bind(client),
          release: () => client.quit(),
          end: () => client.quit()
        };
      },
      end: async () => {
        // Redis client is ended when connection is released
      }
    } as Pool;
  }

  private setupPoolListeners(pool: Pool, dbKey: string): void {
    pool.on('connect', () => {
      this.poolMetrics.recordConnectionCreated(dbKey);
    });

    pool.on('acquire', () => {
      this.poolMetrics.recordConnectionAcquired(dbKey);
    });

    pool.on('release', () => {
      this.poolMetrics.recordConnectionReleased(dbKey);
    });

    pool.on('remove', () => {
      this.poolMetrics.recordConnectionRemoved(dbKey);
    });

    pool.on('error', (err: Error) => {
      logger.error(`Pool error for ${dbKey}: ${err.message}`);
      this.poolMetrics.recordPoolError(dbKey);
    });
  }

  private wrapConnection(connection: any, dbKey: string): PooledConnection {
    const startTime = Date.now();
    let queryCount = 0;
    let released = false;

    return {
      query: async (text: string, params?: any[]) => {
        if (released) {
          throw new Error('Connection already released');
        }

        queryCount++;
        const queryStart = Date.now();

        try {
          const result = await connection.query(text, params);
          this.poolMetrics.recordQuerySuccess(dbKey, Date.now() - queryStart, text);
          return result;
        } catch (err) {
          this.poolMetrics.recordQueryError(dbKey, Date.now() - queryStart, text);
          throw err;
        }
      },
      release: () => {
        if (released) {
          return;
        }

        released = true;
        const duration = Date.now() - startTime;
        this.poolMetrics.recordConnectionUsage(dbKey, duration, queryCount);
        connection.release();
      },
      end: () => {
        if (released) {
          return;
        }

        released = true;
        connection.end();
      }
    };
  }

  public async executeQuery<T>(
    dbKey: string,
    query: string,
    params?: any[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const connection = await this.getConnection(dbKey);
    try {
      return await connection.query(query, params);
    } finally {
      connection.release();
    }
  }

  public async executeTransaction<T>(
    dbKey: string,
    queries: QueryBatchItem[]
  ): Promise<QueryResult<T>[]> {
    const connection = await this.getConnection(dbKey);
    try {
      await connection.query('BEGIN');

      const results: QueryResult<T>[] = [];
      for (const query of queries) {
        const result = await connection.query(query.text, query.params);
        results.push(result);
      }

      await connection.query('COMMIT');
      return results;
    } catch (err) {
      await connection.query('ROLLBACK');
      throw err;
    } finally {
      connection.release();
    }
  }

  public getPoolStats(dbKey: string): PoolStats | null {
    if (!this.pools.has(dbKey)) {
      return null;
    }

    const pool = this.pools.get(dbKey)!;
    return this.poolMetrics.getPoolStats(dbKey, pool);
  }

  public getMetrics(): PoolMetricsSnapshot {
    return this.poolMetrics.getSnapshot();
  }

  public async endAll(): Promise<void> {
    const promises = Array.from(this.pools.values()).map(pool => pool.end());
    await Promise.all(promises);
    this.pools.clear();
  }
}

// Adaptive Scaler for Connection Pools
class AdaptiveScaler {
  private readonly poolConfigs: Map<string, AdaptivePoolConfig>;
  private readonly metricsWindow: number;
  private readonly scaleUpThreshold: number;
  private readonly scaleDownThreshold: number;

  constructor() {
    this.poolConfigs = new Map();
    this.metricsWindow = 5 * 60 * 1000; // 5 minutes
    this.scaleUpThreshold = 0.8; // 80% utilization
    this.scaleDownThreshold = 0.4; // 40% utilization
  }

  public getPoolConfig(dbKey: string, defaultConfig: PoolConfig): PoolConfig {
    // Get or create adaptive config
    if (!this.poolConfigs.has(dbKey)) {
      this.poolConfigs.set(dbKey, {
        currentMax: defaultConfig.max,
        currentMin: defaultConfig.min,
        lastScaleTime: 0,
        metrics: []
      });
    }

    const adaptiveConfig = this.poolConfigs.get(dbKey)!;

    // Check if we should scale
    const now = Date.now();
    if (now - adaptiveConfig.lastScaleTime > 60000) { // 1 minute cooldown
      this.checkForScaling(dbKey, adaptiveConfig);
      adaptiveConfig.lastScaleTime = now;
    }

    return {
      ...defaultConfig,
      max: adaptiveConfig.currentMax,
      min: adaptiveConfig.currentMin
    };
  }

  private checkForScaling(dbKey: string, adaptiveConfig: AdaptivePoolConfig): void {
    // Get recent metrics
    const recentMetrics = adaptiveConfig.metrics.filter(
      m => Date.now() - m.timestamp <= this.metricsWindow
    );

    if (recentMetrics.length === 0) {
      return;
    }

    // Calculate average utilization
    const totalUtilization = recentMetrics.reduce(
      (sum, m) => sum + m.utilization, 0
    );
    const avgUtilization = totalUtilization / recentMetrics.length;

    // Check for scale up
    if (avgUtilization > this.scaleUpThreshold && adaptiveConfig.currentMax < 100) {
      const newMax = Math.min(
        adaptiveConfig.currentMax * 2,
        100 // Maximum 100 connections
      );
      logger.info(`Scaling up pool ${dbKey} from ${adaptiveConfig.currentMax} to ${newMax}`);
      adaptiveConfig.currentMax = newMax;

      // Also increase min to reduce churn
      adaptiveConfig.currentMin = Math.min(
        adaptiveConfig.currentMin * 2,
        Math.floor(newMax / 2)
      );
    }

    // Check for scale down
    else if (avgUtilization < this.scaleDownThreshold && adaptiveConfig.currentMax > 10) {
      const newMax = Math.max(
        Math.floor(adaptiveConfig.currentMax * 0.7),
        10 // Minimum 10 connections
      );
      logger.info(`Scaling down pool ${dbKey} from ${adaptiveConfig.currentMax} to ${newMax}`);
      adaptiveConfig.currentMax = newMax;

      // Also decrease min
      adaptiveConfig.currentMin = Math.max(
        Math.floor(adaptiveConfig.currentMin * 0.7),
        2 // Minimum 2 connections
      );
    }
  }

  public recordPoolMetrics(dbKey: string, metrics: PoolMetricsRecord): void {
    if (!this.poolConfigs.has(dbKey)) {
      return;
    }

    const adaptiveConfig = this.poolConfigs.get(dbKey)!;

    // Add new metrics
    adaptiveConfig.metrics.push(metrics);

    // Keep only recent metrics
    adaptiveConfig.metrics = adaptiveConfig.metrics.filter(
      m => Date.now() - m.timestamp <= this.metricsWindow
    );
  }
}

// Pool Metrics Tracking
class PoolMetrics {
  private readonly metrics: Map<string, {
    connectionRequests: number;
    connectionAcquires: number;
    connectionReleases: number;
    connectionErrors: number;
    connectionCreates: number;
    connectionRemoves: number;
    poolErrors: number;
    querySuccesses: number;
    queryErrors: number;
    queryDurations: number[];
    connectionDurations: number[];
    queryCounts: number[];
    timestamps: number[];
  }>;

  constructor() {
    this.metrics = new Map();
  }

  public recordConnectionRequest(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionRequests++;
    this.recordTimestamp(dbKey);
  }

  public recordConnectionAcquire(dbKey: string, duration: number): void {
    this.ensureMetricsExist(dbKey);
    const metrics = this.metrics.get(dbKey)!;
    metrics.connectionAcquires++;
    metrics.connectionDurations.push(duration);
  }

  public recordConnectionRelease(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionReleases++;
  }

  public recordConnectionError(dbKey: string, duration: number): void {
    this.ensureMetricsExist(dbKey);
    const metrics = this.metrics.get(dbKey)!;
    metrics.connectionErrors++;
    metrics.connectionDurations.push(duration);
  }

  public recordConnectionCreated(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionCreates++;
  }

  public recordConnectionAcquired(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionAcquires++;
  }

  public recordConnectionReleased(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionReleases++;
  }

  public recordConnectionRemoved(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.connectionRemoves++;
  }

  public recordPoolError(dbKey: string): void {
    this.ensureMetricsExist(dbKey);
    this.metrics.get(dbKey)!.poolErrors++;
  }

  public recordQuerySuccess(dbKey: string, duration: number, query: string): void {
    this.ensureMetricsExist(dbKey);
    const metrics = this.metrics.get(dbKey)!;
    metrics.querySuccesses++;
    metrics.queryDurations.push(duration);

    // Record query pattern (simplified)
    const pattern = this.extractQueryPattern(query);
    if (pattern) {
      // In a real implementation, we would track patterns separately
    }
  }

  public recordQueryError(dbKey: string, duration: number, query: string): void {
    this.ensureMetricsExist(dbKey);
    const metrics = this.metrics.get(dbKey)!;
    metrics.queryErrors++;
    metrics.queryDurations.push(duration);
  }

  public recordConnectionUsage(dbKey: string, duration: number, queryCount: number): void {
    this.ensureMetricsExist(dbKey);
    const metrics = this.metrics.get(dbKey)!;
    metrics.connectionDurations.push(duration);
    metrics.queryCounts.push(queryCount);
  }

  private ensureMetricsExist(dbKey: string): void {
    if (!this.metrics.has(dbKey)) {
      this.metrics.set(dbKey, {
        connectionRequests: 0,
        connectionAcquires: 0,
        connectionReleases: 0,
        connectionErrors: 0,
        connectionCreates: 0,
        connectionRemoves: 0,
        poolErrors: 0,
        querySuccesses: 0,
        queryErrors: 0,
        queryDurations: [],
        connectionDurations: [],
        queryCounts: [],
        timestamps: []
      });
    }
  }

  private recordTimestamp(dbKey: string): void {
    this.metrics.get(dbKey)!.timestamps.push(Date.now());
  }

  private extractQueryPattern(query: string): string | null {
    // Simplified pattern extraction
    const patterns = [
      { regex: /^SELECT.*FROM\s+(\w+)/i, name: 'select_from_$1' },
      { regex: /^INSERT INTO\s+(\w+)/i, name: 'insert_into_$1' },
      { regex: /^UPDATE\s+(\w+)/i, name: 'update_$1' },
      { regex: /^DELETE FROM\s+(\w+)/i, name: 'delete_from_$1' }
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern.regex);
      if (match) {
        return pattern.name.replace('$1', match[1]);
      }
    }

    return null;
  }

  public getPoolStats(dbKey: string, pool: Pool): PoolStats {
    const metrics = this.metrics.get(dbKey) || {
      connectionRequests: 0,
      connectionAcquires: 0,
      connectionReleases: 0,
      connectionErrors: 0,
      connectionCreates: 0,
      connectionRemoves: 0,
      poolErrors: 0,
      querySuccesses: 0,
      queryErrors: 0,
      queryDurations: [],
      connectionDurations: [],
      queryCounts: [],
      timestamps: []
    };

    // Get pool status
    const poolStatus = (pool as any)._clients ? {
      totalConnections: (pool as any)._clients.length,
      idleConnections: (pool as any)._idle.length,
      waitingClients: (pool as any)._waiting.length
    } : {
      totalConnections: 0,
      idleConnections: 0,
      waitingClients: 0
    };

    // Calculate averages
    const avgQueryDuration = metrics.queryDurations.length > 0
      ? metrics.queryDurations.reduce((a, b) => a + b, 0) / metrics.queryDurations.length
      : 0;

    const avgConnectionDuration = metrics.connectionDurations.length > 0
      ? metrics.connectionDurations.reduce((a, b) => a + b, 0) / metrics.connectionDurations.length
      : 0;

    const avgQueryCount = metrics.queryCounts.length > 0
      ? metrics.queryCounts.reduce((a, b) => a + b, 0) / metrics.queryCounts.length
      : 0;

    // Calculate recent metrics
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const recentTimestamps = metrics.timestamps.filter(ts => now - ts <= timeWindow);

    return {
      ...poolStatus,
      connectionRequests: metrics.connectionRequests,
      connectionAcquires: metrics.connectionAcquires,
      connectionReleases: metrics.connectionReleases,
      connectionErrors: metrics.connectionErrors,
      connectionCreates: metrics.connectionCreates,
      connectionRemoves: metrics.connectionRemoves,
      poolErrors: metrics.poolErrors,
      querySuccesses: metrics.querySuccesses,
      queryErrors: metrics.queryErrors,
      avgQueryDuration,
      avgConnectionDuration,
      avgQueryCount,
      querySuccessRate: metrics.querySuccesses + metrics.queryErrors > 0
        ? metrics.querySuccesses / (metrics.querySuccesses + metrics.queryErrors)
        : 0,
      connectionSuccessRate: metrics.connectionRequests > 0
        ? metrics.connectionAcquires / metrics.connectionRequests
        : 0,
      recentRequestsPerSecond: recentTimestamps.length / (timeWindow / 1000),
      utilization: poolStatus.totalConnections > 0
        ? (poolStatus.totalConnections - poolStatus.idleConnections) / poolStatus.totalConnections
        : 0
    };
  }

  public getSnapshot(): PoolMetricsSnapshot {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const snapshot: PoolMetricsSnapshot = {};

    for (const [dbKey, metrics] of this.metrics) {
      const recentTimestamps = metrics.timestamps.filter(ts => now - ts <= timeWindow);

      snapshot[dbKey] = {
        connectionRequests: metrics.connectionRequests,
        connectionAcquires: metrics.connectionAcquires,
        connectionReleases: metrics.connectionReleases,
        connectionErrors: metrics.connectionErrors,
        connectionCreates: metrics.connectionCreates,
        connectionRemoves: metrics.connectionRemoves,
        poolErrors: metrics.poolErrors,
        querySuccesses: metrics.querySuccesses,
        queryErrors: metrics.queryErrors,
        avgQueryDuration: metrics.queryDurations.length > 0
          ? metrics.queryDurations.reduce((a, b) => a + b, 0) / metrics.queryDurations.length
          : 0,
        avgConnectionDuration: metrics.connectionDurations.length > 0
          ? metrics.connectionDurations.reduce((a, b) => a + b, 0) / metrics.connectionDurations.length
          : 0,
        querySuccessRate: metrics.querySuccesses + metrics.queryErrors > 0
          ? metrics.querySuccesses / (metrics.querySuccesses + metrics.queryErrors)
          : 0,
        connectionSuccessRate: metrics.connectionRequests > 0
          ? metrics.connectionAcquires / metrics.connectionRequests
          : 0,
        recentRequestsPerSecond: recentTimestamps.length / (timeWindow / 1000)
      };
    }

    return snapshot;
  }
}
```

---

## Real-Time Features (300+ lines)

### WebSocket Server Setup (60+ lines)

```typescript
// Advanced WebSocket Server with Cluster Support
class WebSocketServer {
  private readonly server: http.Server | https.Server;
  private readonly wss: WebSocket.Server;
  private readonly redisSubscriber: RedisClient;
  private readonly redisPublisher: RedisClient;
  private readonly connectionManager: ConnectionManager;
  private readonly messageRouter: MessageRouter;
  private readonly rateLimiter: RateLimiter;
  private readonly authentication: AuthenticationService;
  private readonly metrics: WebSocketMetrics;
  private readonly clusterMode: boolean;

  constructor(server: http.Server | https.Server, options: WebSocketServerOptions = {}) {
    this.server = server;
    this.clusterMode = options.clusterMode || false;

    // Initialize metrics
    this.metrics = new WebSocketMetrics();

    // Initialize authentication
    this.authentication = new AuthenticationService();

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      points: 100, // 100 requests
      duration: 60, // per 60 seconds
      blockDuration: 300 // block for 5 minutes if exceeded
    });

    // Initialize connection manager
    this.connectionManager = new ConnectionManager(this.metrics);

    // Initialize message router
    this.messageRouter = new MessageRouter(this.connectionManager, this.metrics);

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      clientTracking: false, // We'll handle this ourselves
      maxPayload: options.maxPayload || 1024 * 1024, // 1MB
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024
        },
        threshold: 1024 // Only compress messages > 1KB
      }
    });

    // Set up Redis for cluster mode
    if (this.clusterMode) {
      this.redisSubscriber = createRedisClient({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      });

      this.redisPublisher = createRedisClient({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      });

      this.setupRedisListeners();
    }

    // Set up WebSocket server listeners
    this.setupWebSocketListeners();

    // Set up periodic tasks
    this.setupPeriodicTasks();
  }

  private setupRedisListeners(): void {
    // Subscribe to WebSocket channels
    this.redisSubscriber.subscribe('ws:broadcast');
    this.redisSubscriber.subscribe('ws:rooms');

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      try {
        const parsed = JSON.parse(message);

        switch (channel) {
          case 'ws:broadcast':
            this.handleBroadcastMessage(parsed);
            break;
          case 'ws:rooms':
            this.handleRoomMessage(parsed);
            break;
        }
      } catch (err) {
        logger.error(`Failed to process Redis message: ${err.message}`);
      }
    });
  }

  private setupWebSocketListeners(): void {
    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.handleNewConnection(ws, req);
    });

    this.wss.on('error', (error: Error) => {
      logger.error(`WebSocket server error: ${error.message}`);
      this.metrics.recordServerError();
    });

    this.wss.on('headers', (headers: string[], req: http.IncomingMessage) => {
      this.metrics.recordConnectionAttempt();
    });
  }

  private setupPeriodicTasks(): void {
    // Clean up stale connections
    setInterval(() => {
      this.connectionManager.cleanupStaleConnections();
    }, 300000); // 5 minutes

    // Log metrics
    setInterval(() => {
      const metrics = this.metrics.getSnapshot();
      logger.info(`WebSocket Metrics: ${JSON.stringify(metrics)}`);
    }, 60000); // 1 minute
  }

  private async handleNewConnection(ws: WebSocket, req: http.IncomingMessage): Promise<void> {
    const connectionId = uuidv4();
    const ip = this.getClientIp(req);
    const startTime = Date.now();

    try {
      // Rate limiting
      const rateLimitResult = await this.rateLimiter.consume(ip);
      if (rateLimitResult.remainingPoints <= 0) {
        ws.close(1008, 'Rate limit exceeded');
        this.metrics.recordConnectionRejected('rate_limit');
        return;
      }

      // Parse connection URL
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const room = url.searchParams.get('room');

      if (!token) {
        ws.close(1008, 'Authentication token required');
        this.metrics.recordConnectionRejected('no_token');
        return;
      }

      // Authenticate connection
      const authResult = await this.authentication.authenticate(token);
      if (!authResult.authenticated) {
        ws.close(1008, 'Authentication failed');
        this.metrics.recordConnectionRejected('auth_failed');
        return;
      }

      // Create connection context
      const context: ConnectionContext = {
        connectionId,
        userId: authResult.userId,
        userRoles: authResult.roles,
        ip,
        userAgent: req.headers['user-agent'] || '',
        rooms: new Set(room ? [room] : []),
        metadata: authResult.metadata || {},
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      // Register connection
      this.connectionManager.registerConnection(ws, context);

      // Set up WebSocket event listeners
      this.setupConnectionListeners(ws, context);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'WELCOME',
        payload: {
          connectionId,
          userId: authResult.userId,
          serverTime: new Date().toISOString(),
          rooms: Array.from(context.rooms)
        }
      }));

      this.metrics.recordConnectionSuccess(Date.now() - startTime);
      logger.info(`New WebSocket connection: ${connectionId} (User: ${authResult.userId})`);

    } catch (err) {
      logger.error(`Connection handling failed: ${err.message}`);
      ws.close(1011, 'Internal server error');
      this.metrics.recordConnectionError(Date.now() - startTime);
    }
  }

  private setupConnectionListeners(ws: WebSocket, context: ConnectionContext): void {
    // Message handler
    ws.on('message', (message: WebSocket.Data) => {
      this.handleMessage(ws, context, message).catch(err => {
        logger.error(`Message handling failed: ${err.message}`);
        this.metrics.recordMessageError();
      });
    });

    // Close handler
    ws.on('close', (code: number, reason: string) => {
      this.handleClose(ws, context, code, reason);
    });

    // Error handler
    ws.on('error', (error: Error) => {
      logger.error(`WebSocket error for ${context.connectionId}: ${error.message}`);
      this.metrics.recordConnectionError();
    });

    // Ping handler
    ws.on('pong', () => {
      context.lastActivity = new Date();
      this.metrics.recordPong();
    });
  }

  private async handleMessage(ws: WebSocket, context: ConnectionContext, message: WebSocket.Data): Promise<void> {
    context.lastActivity = new Date();
    this.metrics.recordMessageReceived();

    try {
      // Parse message
      let parsedMessage: WebSocketMessage;
      if (typeof message === 'string') {
        parsedMessage = JSON.parse(message);
      } else if (message instanceof Buffer) {
        parsedMessage = JSON.parse(message.toString());
      } else {
        throw new Error('Unsupported message format');
      }

      // Validate message
      if (!this.isValidMessage(parsedMessage)) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          payload: {
            code: 'INVALID_MESSAGE',
            message: 'Invalid message format'
          }
        }));
        this.metrics.recordInvalidMessage();
        return;
      }

      // Route message
      await this.messageRouter.routeMessage(ws, context, parsedMessage);

    } catch (err) {
      logger.error(`Message processing failed: ${err.message}`);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process message'
        }
      }));
      this.metrics.recordMessageError();
    }
  }

  private isValidMessage(message: any): message is WebSocketMessage {
    return message &&
           typeof message.type === 'string' &&
           message.type.length > 0 &&
           (message.payload === undefined || typeof message.payload === 'object');
  }

  private handleClose(ws: WebSocket, context: ConnectionContext, code: number, reason: string): void {
    try {
      // Unregister connection
      this.connectionManager.unregisterConnection(ws, context);

      // Log close reason
      logger.info(`WebSocket closed: ${context.connectionId} (Code: ${code}, Reason: ${reason})`);
      this.metrics.recordConnectionClosed(code);

    } catch (err) {
      logger.error(`Close handling failed: ${err.message}`);
    }
  }

  private handleBroadcastMessage(message: BroadcastMessage): void {
    try {
      // Broadcast to all connections
      this.connectionManager.broadcast(message);

      this.metrics.recordBroadcastMessage(message.type);
    } catch (err) {
      logger.error(`Broadcast failed: ${err.message}`);
    }
  }

  private handleRoomMessage(message: RoomMessage): void {
    try {
      // Send to specific room
      this.connectionManager.sendToRoom(message.room, message.message);

      this.metrics.recordRoomMessage(message.room, message.message.type);
    } catch (err) {
      logger.error(`Room message failed: ${err.message}`);
    }
  }

  private getClientIp(req: http.IncomingMessage): string {
    // Try to get real IP from headers
    const xForwardedFor = req.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }

    // Fall back to connection remote address
    const connection = (req as any).connection;
    if (connection) {
      return connection.remoteAddress;
    }

    return 'unknown';
  }

  public broadcast(message: WebSocketMessage): void {
    if (this.clusterMode) {
      // Publish to Redis for other nodes
      this.redisPublisher.publish('ws:broadcast', JSON.stringify(message));
    } else {
      // Direct broadcast
      this.connectionManager.broadcast(message);
    }
  }

  public sendToRoom(room: string, message: WebSocketMessage): void {
    if (this.clusterMode) {
      // Publish to Redis for other nodes
      this.redisPublisher.publish('ws:rooms', JSON.stringify({
        room,
        message
      }));
    } else {
      // Direct room message
      this.connectionManager.sendToRoom(room, message);
    }
  }

  public getConnectionCount(): number {
    return this.connectionManager.getConnectionCount();
  }

  public getRoomCount(room: string): number {
    return this.connectionManager.getRoomCount(room);
  }

  public getMetrics(): WebSocketMetricsSnapshot {
    return this.metrics.getSnapshot();
  }

  public async close(): Promise<void> {
    // Close all connections
    this.connectionManager.closeAllConnections();

    // Close WebSocket server
    this.wss.close();

    // Close Redis connections if in cluster mode
    if (this.clusterMode) {
      this.redisSubscriber.quit();
      this.redisPublisher.quit();
    }
  }
}

// Connection Manager for WebSocket Server
class ConnectionManager {
  private readonly connections: Map<string, WebSocketConnection>;
  private readonly rooms: Map<string, Set<string>>;
  private readonly metrics: WebSocketMetrics;

  constructor(metrics: WebSocketMetrics) {
    this.connections = new Map();
    this.rooms = new Map();
    this.metrics = metrics;
  }

  public registerConnection(ws: WebSocket, context: ConnectionContext): void {
    // Create connection wrapper
    const connection: WebSocketConnection = {
      ws,
      context,
      isAlive: true
    };

    // Add to connections map
    this.connections.set(context.connectionId, connection);

    // Add to rooms
    context.rooms.forEach(room => {
      this.addToRoom(room, context.connectionId);
    });

    this.metrics.recordConnectionRegistered();
  }

  public unregisterConnection(ws: WebSocket, context: ConnectionContext): void {
    // Remove from connections map
    this.connections.delete(context.connectionId);

    // Remove from all rooms
    context.rooms.forEach(room => {
      this.removeFromRoom(room, context.connectionId);
    });

    this.metrics.recordConnectionUnregistered();
  }

  public addToRoom(room: string, connectionId: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }

    this.rooms.get(room)?.add(connectionId);
    this.metrics.recordRoomJoin(room);
  }

  public removeFromRoom(room: string, connectionId: string): void {
    if (this.rooms.has(room)) {
      this.rooms.get(room)?.delete(connectionId);
      this.metrics.recordRoomLeave(room);

      // Clean up empty rooms
      if (this.rooms.get(room)?.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  public broadcast(message: WebSocketMessage): void {
    const serialized = JSON.stringify(message);

    this.connections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(serialized);
          this.metrics.recordMessageSent();
        } catch (err) {
          logger.error(`Failed to send broadcast message: ${err.message}`);
          this.metrics.recordMessageError();
        }
      }
    });
  }

  public sendToRoom(room: string, message: WebSocketMessage): void {
    if (!this.rooms.has(room)) {
      return;
    }

    const serialized = JSON.stringify(message);
    const connectionIds = this.rooms.get(room);

    connectionIds?.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(serialized);
          this.metrics.recordMessageSent();
        } catch (err) {
          logger.error(`Failed to send room message: ${err.message}`);
          this.metrics.recordMessageError();
        }
      }
    });
  }

  public sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      this.metrics.recordMessageSent();
      return true;
    } catch (err) {
      logger.error(`Failed to send message to connection ${connectionId}: ${err.message}`);
      this.metrics.recordMessageError();
      return false;
    }
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getRoomCount(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }

  public cleanupStaleConnections(): void {
    const now = Date.now();
    let cleanedUp = 0;

    this.connections.forEach((connection, connectionId) => {
      // Check if connection is alive
      if (!connection.isAlive) {
        connection.ws.terminate();
        this.unregisterConnection(connection.ws, connection.context);
        cleanedUp++;
        return;
      }

      // Check last activity
      const lastActivity = connection.context.lastActivity.getTime();
      if (now - lastActivity > 300000) { // 5 minutes
        connection.ws.close(1001, 'Idle timeout');
        this.unregisterConnection(connection.ws, connection.context);
        cleanedUp++;
        return;
      }

      // Send ping to check if connection is alive
      connection.isAlive = false;
      connection.ws.ping();
    });

    if (cleanedUp > 0) {
      logger.info(`Cleaned up ${cleanedUp} stale connections`);
    }
  }

  public closeAllConnections(): void {
    this.connections.forEach(connection => {
      connection.ws.close(1001, 'Server shutting down');
    });
    this.connections.clear();
    this.rooms.clear();
  }
}
```

### Real-Time Event Handlers (80+ lines)

```typescript
// Real-Time Event Handlers for Showroom Sales
class ShowroomEventHandlers {
  private readonly connectionManager: ConnectionManager;
  private readonly redisPublisher: RedisClient;
  private readonly eventBus: EventEmitter;
  private readonly inventoryService: InventoryService;
  private readonly customerService: CustomerService;
  private readonly salesService: SalesService;
  private readonly notificationService: NotificationService;
  private readonly metrics: EventMetrics;

  constructor(
    connectionManager: ConnectionManager,
    redisPublisher: RedisClient,
    eventBus: EventEmitter
  ) {
    this.connectionManager = connectionManager;
    this.redisPublisher = redisPublisher;
    this.eventBus = eventBus;
    this.inventoryService = new InventoryService();
    this.customerService = new CustomerService();
    this.salesService = new SalesService();
    this.notificationService = new NotificationService();
    this.metrics = new EventMetrics();

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Customer events
    this.eventBus.on('customer:entered', this.handleCustomerEntered.bind(this));
    this.eventBus.on('customer:moved', this.handleCustomerMoved.bind(this));
    this.eventBus.on('customer:interested', this.handleCustomerInterested.bind(this));
    this.eventBus.on('customer:engaged', this.handleCustomerEngaged.bind(this));
    this.eventBus.on('customer:exited', this.handleCustomerExited.bind(this));

    // Inventory events
    this.eventBus.on('inventory:updated', this.handleInventoryUpdated.bind(this));
    this.eventBus.on('inventory:reserved', this.handleInventoryReserved.bind(this));
    this.eventBus.on('inventory:released', this.handleInventoryReleased.bind(this));

    // Sales events
    this.eventBus.on('sale:started', this.handleSaleStarted.bind(this));
    this.eventBus.on('sale:updated', this.handleSaleUpdated.bind(this));
    this.eventBus.on('sale:completed', this.handleSaleCompleted.bind(this));
    this.eventBus.on('sale:cancelled', this.handleSaleCancelled.bind(this));

    // Test drive events
    this.eventBus.on('testdrive:scheduled', this.handleTestDriveScheduled.bind(this));
    this.eventBus.on('testdrive:started', this.handleTestDriveStarted.bind(this));
    this.eventBus.on('testdrive:completed', this.handleTestDriveCompleted.bind(this));

    // Notification events
    this.eventBus.on('notification:sent', this.handleNotificationSent.bind(this));
  }

  private async handleCustomerEntered(event: CustomerEnteredEvent): Promise<void> {
    try {
      this.metrics.recordEvent('customer:entered');

      // Get customer details
      const customer = await this.customerService.getCustomer(event.customerId);

      // Get showroom details
      const showroom = await this.inventoryService.getShowroom(event.showroomId);

      // Create real-time message
      const message: WebSocketMessage = {
        type: 'CUSTOMER_ENTERED',
        payload: {
          customerId: event.customerId,
          customerName: customer.name,
          showroomId: event.showroomId,
          showroomName: showroom.name,
          location: event.location,
          timestamp: event.timestamp,
          leadScore: event.leadScore,
          interests: event.interests || []
        }
      };

      // Broadcast to showroom staff
      this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, message);

      // Notify high-value customers
      if (event.leadScore && event.leadScore > 0.7) {
        await this.notificationService.notifyHighValueCustomer(
          event.showroomId,
          event.customerId,
          event.leadScore
        );
      }

      // Update customer location tracking
      await this.customerService.updateCustomerLocation(
        event.customerId,
        event.showroomId,
        event.location
      );

    } catch (err) {
      logger.error(`Failed to handle customer entered event: ${err.message}`);
      this.metrics.recordEventError('customer:entered');
    }
  }

  private async handleCustomerMoved(event: CustomerMovedEvent): Promise<void> {
    try {
      this.metrics.recordEvent('customer:moved');

      // Get customer details
      const customer = await this.customerService.getCustomer(event.customerId);

      // Create real-time message
      const message: WebSocketMessage = {
        type: 'CUSTOMER_MOVED',
        payload: {
          customerId: event.customerId,
          customerName: customer.name,
          showroomId: event.showroomId,
          newLocation: event.newLocation,
          timestamp: event.timestamp
        }
      };

      // Broadcast to showroom staff
      this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, message);

      // Update customer location tracking
      await this.customerService.updateCustomerLocation(
        event.customerId,
        event.showroomId,
        event.newLocation
      );

      // Check if customer is near a vehicle of interest
      const nearbyVehicles = await this.inventoryService.getNearbyVehicles(
        event.showroomId,
        event.newLocation,
        5 // 5 meters radius
      );

      if (nearbyVehicles.length > 0) {
        // Get customer interests
        const interests = await this.customerService.getCustomerInterests(event.customerId);

        // Find matching vehicles
        const matchingVehicles = nearbyVehicles.filter(vehicle =>
          interests.includes(vehicle.model) ||
          interests.includes(vehicle.make) ||
          interests.includes(vehicle.type)
        );

        if (matchingVehicles.length > 0) {
          // Notify sales reps about potential match
          const notification: WebSocketMessage = {
            type: 'CUSTOMER_NEAR_INTEREST',
            payload: {
              customerId: event.customerId,
              customerName: customer.name,
              vehicles: matchingVehicles.map(v => ({
                vehicleId: v.vehicleId,
                make: v.make,
                model: v.model,
                year: v.year,
                location: v.location
              })),
              timestamp: new Date().toISOString()
            }
          };

          this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, notification);
        }
      }

    } catch (err) {
      logger.error(`Failed to handle customer moved event: ${err.message}`);
      this.metrics.recordEventError('customer:moved');
    }
  }

  private async handleCustomerInterested(event: CustomerInterestedEvent): Promise<void> {
    try {
      this.metrics.recordEvent('customer:interested');

      // Get customer details
      const customer = await this.customerService.getCustomer(event.customerId);

      // Get vehicle details
      const vehicle = await this.inventoryService.getVehicle(event.vehicleId);

      // Create real-time message
      const message: WebSocketMessage = {
        type: 'CUSTOMER_INTERESTED',
        payload: {
          customerId: event.customerId,
          customerName: customer.name,
          showroomId: event.showroomId,
          vehicleId: event.vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          timestamp: event.timestamp,
          interestLevel: event.interestLevel
        }
      };

      // Broadcast to showroom staff
      this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, message);

      // Update customer interests
      await this.customerService.addCustomerInterest(
        event.customerId,
        event.vehicleId,
        event.interestLevel
      );

      // Notify sales reps if high interest
      if (event.interestLevel >= 0.7) {
        const notification: WebSocketMessage = {
          type: 'HIGH_INTEREST_ALERT',
          payload: {
            customerId: event.customerId,
            customerName: customer.name,
            vehicleId: event.vehicleId,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            interestLevel: event.interestLevel,
            timestamp: new Date().toISOString()
          }
        };

        this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, notification);
      }

    } catch (err) {
      logger.error(`Failed to handle customer interested event: ${err.message}`);
      this.metrics.recordEventError('customer:interested');
    }
  }

  private async handleCustomerEngaged(event: CustomerEngagedEvent): Promise<void> {
    try {
      this.metrics.recordEvent('customer:engaged');

      // Get customer details
      const customer = await this.customerService.getCustomer(event.customerId);

      // Get sales rep details
      const salesRep = await this.salesService.getSalesRep(event.salesRepId);

      // Create real-time message
      const message: WebSocketMessage = {
        type: 'CUSTOMER_ENGAGED',
        payload: {
          customerId: event.customerId,
          customerName: customer.name,
          salesRepId: event.salesRepId,
          salesRepName: salesRep.name,
          showroomId: event.showroomId,
          timestamp: event.timestamp,
          engagementType: event.engagementType
        }
      };

      // Broadcast to showroom staff
      this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, message);

      // Update customer engagement tracking
      await this.customerService.recordEngagement(
        event.customerId,
        event.salesRepId,
        event.engagementType,
        event.timestamp
      );

      // If this is a test drive request, schedule it
      if (event.engagementType === 'test_drive_request') {
        const testDrive = await this.salesService.scheduleTestDrive(
          event.customerId,
          event.salesRepId,
          event.vehicleId,
          event.timestamp
        );

        // Notify about scheduled test drive
        const testDriveMessage: WebSocketMessage = {
          type: 'TEST_DRIVE_SCHEDULED',
          payload: {
            testDriveId: testDrive.testDriveId,
            customerId: event.customerId,
            customerName: customer.name,
            salesRepId: event.salesRepId,
            salesRepName: salesRep.name,
            vehicleId: event.vehicleId,
            showroomId: event.showroomId,
            scheduledTime: testDrive.scheduledTime,
            timestamp: new Date().toISOString()
          }
        };

        this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, testDriveMessage);
      }

    } catch (err) {
      logger.error(`Failed to handle customer engaged event: ${err.message}`);
      this.metrics.recordEventError('customer:engaged');
    }
  }

  private async handleCustomerExited(event: CustomerExitedEvent): Promise<void> {
    try {
      this.metrics.recordEvent('customer:exited');

      // Get customer details
      const customer = await this.customerService.getCustomer(event.customerId);

      // Create real-time message
      const message: WebSocketMessage = {
        type: 'CUSTOMER_EXITED',
        payload: {
          customerId: event.customerId,
          customerName: customer.name,
          showroomId: event.showroomId,
          timestamp: event.timestamp,
          duration: event.duration
        }
      };

      // Broadcast to showroom staff
      this.connectionManager.sendToRoom(`showroom:${event.showroomId}`, message);

      // Update customer status
      await this.customerService.updateCustomerStatus(
        event.customerId