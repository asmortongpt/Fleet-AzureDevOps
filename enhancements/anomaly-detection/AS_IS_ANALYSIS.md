# AS-IS Analysis: Anomaly Detection Module
**Fleet Management System**
*Prepared by: Senior Technical Analyst*
*Date: [Insert Date]*
*Version: 1.0*

---

## 1. Executive Summary (120+ lines)

### 1.1 Current State Overview
The Anomaly Detection Module (ADM) is a critical component of the Fleet Management System (FMS), designed to identify irregular patterns in vehicle telemetry data that may indicate mechanical failures, driver behavior issues, or operational inefficiencies. The system processes **~1.2 million telemetry records daily** from **12,500+ vehicles** across **3 geographic regions**, generating **~8,000 anomaly alerts per month**.

#### 1.1.1 System Context
The ADM operates within a broader ecosystem:
- **Data Ingestion Layer**: Kafka streams (v2.8) receiving telematics from IoT devices (OBD-II, GPS, accelerometers)
- **Processing Layer**: Apache Spark (v3.1.2) clusters for real-time analytics
- **Storage Layer**: PostgreSQL (v13.4) for structured data, Elasticsearch (v7.15) for log analytics
- **Presentation Layer**: React-based dashboard (v17.0.2) with D3.js visualizations

**Key Metrics:**
| Metric                     | Value               | Target  | Variance |
|----------------------------|---------------------|---------|----------|
| Daily processed records    | 1,200,000           | 1,500,000| -20%     |
| Anomaly detection rate     | 0.67%               | 0.8%    | -16.25%  |
| False positive rate        | 18.4%               | <10%    | +84%     |
| Mean detection latency     | 4.2s                | <3s     | +40%     |
| System uptime              | 99.7%               | 99.95%  | -0.25%   |

#### 1.1.2 Evolution Timeline
The ADM has undergone three major iterations:
1. **v1.0 (2018)**: Rule-based engine with static thresholds (e.g., RPM > 6000)
   - *Limitation*: High false positives (32%) due to lack of contextual awareness
2. **v2.0 (2019)**: Introduced ML models (Isolation Forest, Random Forest)
   - *Improvement*: Reduced false positives to 18%
   - *Limitation*: Poor scalability (processing time increased by 300% at 500K records/day)
3. **v3.0 (2021)**: Hybrid approach (rules + ML) with Spark optimization
   - *Current state*: Balanced performance but technical debt accumulation

### 1.2 Stakeholder Analysis
#### 1.2.1 Stakeholder Map
```mermaid
graph TD
    A[Fleet Operations] -->|Uses alerts| B[ADM]
    C[Data Science] -->|Maintains models| B
    D[IT Infrastructure] -->|Hosts system| B
    E[Finance] -->|Budget approval| B
    F[Compliance] -->|Audits logs| B
    G[Drivers] -->|Receives feedback| B
    H[Maintenance Teams] -->|Acts on alerts| B
```

#### 1.2.2 Detailed Stakeholder Profiles
| **Stakeholder**       | **Role**                                                                 | **Key Concerns**                                                                 | **Influence** | **Impact** |
|-----------------------|--------------------------------------------------------------------------|---------------------------------------------------------------------------------|---------------|------------|
| **Fleet Managers**    | Primary users; monitor vehicle health and driver performance            | - Alert fatigue (200+ alerts/day)<br>- Lack of actionable insights              | High          | High       |
| **Data Scientists**   | Develop and maintain ML models                                           | - Model drift (accuracy dropped from 88% to 72% in 6 months)<br>- Training data gaps | Medium        | High       |
| **IT Operations**     | Manage infrastructure and uptime                                        | - High cloud costs ($42K/month)<br>- Frequent Spark job failures                | High          | Medium     |
| **Maintenance Teams** | Perform repairs based on alerts                                         | - False positives waste 120+ labor hours/month<br>- Lack of severity prioritization | Medium        | High       |
| **Drivers**           | Receive behavioral feedback                                              | - Inaccurate scoring (e.g., harsh braking misclassified)<br>- Privacy concerns  | Low           | Medium     |
| **Executive Leadership** | Strategic decision-making                                            | - ROI not meeting projections<br>- Competitive gap in predictive maintenance    | High          | Low        |

### 1.3 Business Impact Analysis
#### 1.3.1 Cost-Benefit Breakdown
| **Category**               | **Current State**                          | **Potential Improvement**               | **Annual Impact**       |
|----------------------------|--------------------------------------------|-----------------------------------------|-------------------------|
| **Maintenance Costs**      | $3.2M/year (reactive repairs)              | 30% reduction via predictive maintenance | +$960K savings          |
| **Fuel Efficiency**        | 6.8 MPG (fleet average)                    | 5% improvement via driver coaching      | +$1.1M savings          |
| **Vehicle Downtime**       | 12.4 hours/vehicle/year                    | 40% reduction via early detection       | +$2.3M productivity gain|
| **Insurance Premiums**     | $8.7M/year (claims history)                | 15% reduction via safer driving         | +$1.3M savings          |
| **Operational Efficiency** | 18% of alerts require manual review        | Automate 80% of reviews                 | +$450K labor savings    |

#### 1.3.2 Competitive Benchmarking
| **Metric**               | **Our System** | **Competitor A** | **Competitor B** | **Industry Leader** |
|--------------------------|----------------|------------------|------------------|---------------------|
| Detection Accuracy       | 72%            | 81%              | 78%              | 89%                 |
| False Positive Rate      | 18.4%          | 12%              | 15%              | 7%                  |
| Processing Latency       | 4.2s           | 2.8s             | 3.5s             | 1.9s                |
| Cost per Vehicle/Month   | $12.40         | $9.80            | $11.20           | $8.50               |
| Customer Retention Rate  | 82%            | 88%              | 85%              | 92%                 |

### 1.4 Critical Pain Points with Root Cause Analysis
#### 1.4.1 Top 5 Pain Points
1. **High False Positive Rate (18.4%)**
   - **Root Causes**:
     - Static thresholds in rule-based engine (e.g., "RPM > 6000" ignores vehicle type)
     - Lack of contextual features in ML models (e.g., road grade, weather conditions)
     - Training data imbalance (92% normal vs 8% anomalous samples)
   - **Example**: A delivery truck idling for 30+ minutes (normal) triggers a "prolonged idling" alert because the rule doesn't account for urban delivery routes.

2. **Model Drift (Accuracy Dropped from 88% to 72% in 6 Months)**
   - **Root Causes**:
     - No continuous retraining pipeline (last retraining: 9 months ago)
     - Feature distribution shift (e.g., new vehicle models added to fleet)
     - Concept drift (e.g., post-pandemic driving patterns differ)
   - **Evidence**:
     ```python
     # Feature importance drift (Random Forest)
     {
         "2022-01": {"engine_load": 0.32, "rpm": 0.28, "speed": 0.22},
         "2023-06": {"engine_load": 0.18, "rpm": 0.15, "speed": 0.42}  # Shift in driving behavior
     }
     ```

3. **Scalability Bottlenecks**
   - **Root Causes**:
     - Spark jobs not optimized for skewed data (e.g., 80% of anomalies from 20% of vehicles)
     - PostgreSQL query performance degrades at >500K records/day:
       ```sql
       -- Slow query (2.4s execution time)
       SELECT * FROM anomalies
       WHERE vehicle_id = 'VH-1001'
       AND timestamp BETWEEN '2023-01-01' AND '2023-06-30'
       ORDER BY timestamp DESC;
       ```
     - No auto-scaling for Spark clusters (fixed 10-node configuration)

4. **Alert Fatigue Among Fleet Managers**
   - **Root Causes**:
     - No alert prioritization (all alerts marked as "High" severity)
     - Duplicate alerts (e.g., same issue reported every 5 minutes)
     - Lack of actionable insights (e.g., "High RPM detected" without recommended action)
   - **Impact**: 62% of alerts are ignored or marked as "won't fix."

5. **Technical Debt Accumulation**
   - **Root Causes**:
     - Legacy codebase (42% of code written pre-2020)
     - No automated testing (unit test coverage: 38%)
     - Hardcoded configurations (e.g., alert thresholds in Python files)
   - **Example**:
     ```python
     # Hardcoded threshold in anomaly_detector.py (line 42)
     IDLING_THRESHOLD = 300  # seconds - should be vehicle-type specific
     ```

#### 1.4.2 Root Cause Diagram (5 Whys)
**Problem**: High false positive rate for "harsh braking" alerts
1. **Why?** Rule triggers at fixed deceleration threshold (-0.8g)
2. **Why?** No contextual awareness of road conditions
3. **Why?** Weather API integration was deprecated in 2021
4. **Why?** No prioritization for re-adding external data sources
5. **Why?** Data science team understaffed (2 FTEs for 12K vehicles)

### 1.5 Strategic Recommendations
#### 1.5.1 Prioritized Roadmap
| **Phase** | **Initiative**                          | **Effort** | **Impact** | **Timeline** | **Owner**          |
|-----------|-----------------------------------------|------------|------------|--------------|--------------------|
| 1         | Implement alert prioritization engine   | 4 weeks    | High       | Q3 2023      | Data Science       |
| 2         | Build continuous retraining pipeline    | 8 weeks    | High       | Q4 2023      | Data Science       |
| 3         | Optimize Spark jobs for data skew       | 6 weeks    | Medium     | Q4 2023      | IT Operations      |
| 4         | Replace static rules with dynamic ML    | 12 weeks   | High       | Q1 2024      | Data Science       |
| 5         | Redesign PostgreSQL schema              | 10 weeks   | Medium     | Q1 2024      | Database Team      |
| 6         | Implement auto-scaling for Spark        | 5 weeks    | Medium     | Q2 2024      | Cloud Engineering  |

#### 1.5.2 Quick Wins (0-3 Months)
1. **Alert Deduplication**
   - *Action*: Modify alerting logic to suppress duplicates within 1-hour windows
   - *Impact*: 30% reduction in alert volume
   - *Effort*: 2 weeks

2. **Severity Tiering**
   - *Action*: Classify alerts into Critical/High/Medium/Low based on historical impact
   - *Impact*: 40% reduction in ignored alerts
   - *Effort*: 3 weeks

3. **PostgreSQL Indexing**
   - *Action*: Add composite indexes for frequent queries (e.g., `(vehicle_id, timestamp)`)
   - *Impact*: 60% faster query performance
   - *Effort*: 1 week

#### 1.5.3 Strategic Initiatives (6-18 Months)
1. **Context-Aware ML Models**
   - *Action*: Incorporate external data (weather, traffic, road grade) into models
   - *Impact*: 50% reduction in false positives
   - *Effort*: 12 weeks

2. **Real-Time Anomaly Scoring**
   - *Action*: Replace batch processing with streaming (Spark Structured Streaming)
   - *Impact*: Reduce detection latency to <1s
   - *Effort*: 16 weeks

3. **Automated Root Cause Analysis**
   - *Action*: Integrate with maintenance records to correlate anomalies with repairs
   - *Impact*: 25% faster issue resolution
   - *Effort*: 20 weeks

#### 1.5.4 Risk Mitigation Strategies
| **Risk**                          | **Mitigation Strategy**                                                                 | **Owner**          |
|-----------------------------------|----------------------------------------------------------------------------------------|--------------------|
| Model performance degradation     | Implement A/B testing for new models before full deployment                            | Data Science       |
| Spark job failures                | Add circuit breakers and fallback to batch processing                                  | IT Operations      |
| Data privacy compliance issues    | Conduct GDPR/SOC2 audit and implement data anonymization                               | Compliance         |
| Budget overruns                   | Implement FinOps practices for cloud cost monitoring                                   | Finance            |
| User resistance to changes        | Conduct training sessions and pilot with 10% of fleet managers                         | Fleet Operations   |

#### 1.5.5 ROI Projections
| **Initiative**               | **Cost**       | **Annual Benefit** | **ROI (3-Year)** | **Payback Period** |
|------------------------------|----------------|--------------------|------------------|--------------------|
| Alert prioritization engine  | $120K          | $450K              | 375%             | 4 months           |
| Continuous retraining        | $250K          | $960K              | 384%             | 8 months           |
| Spark optimization           | $180K          | $320K              | 178%             | 11 months          |
| Context-aware ML models      | $450K          | $1.8M              | 400%             | 10 months          |
| **Total**                    | **$1M**        | **$3.53M**         | **353%**         | **8 months**       |

---

## 2. Current Architecture (200+ lines)

### 2.1 System Components
#### 2.1.1 Component Inventory
| **Component**               | **Technology**       | **Version** | **Purpose**                                                                 | **SLA**  |
|-----------------------------|----------------------|-------------|-----------------------------------------------------------------------------|----------|
| **Data Ingestion**          | Apache Kafka         | 2.8         | Receives telemetry from vehicles via MQTT                                   | 99.9%    |
| **Stream Processor**        | Apache Spark         | 3.1.2       | Real-time anomaly detection (rules + ML)                                    | 99.7%    |
| **Batch Processor**         | Apache Spark         | 3.1.2       | Daily aggregation and model retraining                                      | 99.5%    |
| **Rule Engine**             | Python (Pandas)      | 3.8         | Static threshold-based detection                                            | 99.9%    |
| **ML Engine**               | Scikit-learn         | 0.24.2      | Isolation Forest, Random Forest models                                      | 99.7%    |
| **Feature Store**           | PostgreSQL           | 13.4        | Stores pre-computed features for ML models                                  | 99.95%   |
| **Anomaly Database**        | PostgreSQL           | 13.4        | Stores detected anomalies with metadata                                     | 99.95%   |
| **Alerting Service**        | Node.js              | 14.17.0     | Generates and routes alerts to users                                        | 99.8%    |
| **Dashboard**               | React                | 17.0.2      | Visualizes anomalies and fleet health                                       | 99.5%    |
| **Monitoring**              | Prometheus/Grafana   | 2.30/8.3    | System health monitoring                                                    | 99.9%    |
| **Logging**                 | ELK Stack            | 7.15        | Centralized logging and log analytics                                       | 99.9%    |

#### 2.1.2 Integration Points
**Sequence Diagram: Real-Time Anomaly Detection**
```mermaid
sequenceDiagram
    participant Vehicle as IoT Device
    participant Kafka as Kafka Broker
    participant Spark as Spark Streaming
    participant RuleEngine as Rule Engine
    participant ML as ML Engine
    participant Postgres as PostgreSQL
    participant Alert as Alerting Service
    participant Dashboard as Dashboard

    Vehicle->>Kafka: Send telemetry (MQTT)
    Kafka->>Spark: Stream telemetry
    Spark->>RuleEngine: Apply static rules
    alt Rule match
        RuleEngine->>Postgres: Store anomaly
        Postgres->>Alert: Trigger alert
    else No rule match
        Spark->>ML: Score with ML model
        alt Anomaly detected
            ML->>Postgres: Store anomaly
            Postgres->>Alert: Trigger alert
        end
    end
    Alert->>Dashboard: Display alert
```

#### 2.1.3 Data Flow Analysis
**Telemetry Processing Pipeline:**
1. **Ingestion**:
   - **Source**: OBD-II devices (CAN bus data), GPS, accelerometers
   - **Format**: JSON over MQTT
   - **Example Payload**:
     ```json
     {
         "vehicle_id": "VH-1001",
         "timestamp": "2023-06-15T14:30:45Z",
         "engine_rpm": 2800,
         "speed": 65,
         "throttle_position": 78,
         "coolant_temp": 95,
         "fuel_level": 42,
         "gps": {"lat": 37.7749, "lon": -122.4194},
         "accelerometer": {"x": 0.1, "y": -0.3, "z": 9.8}
     }
     ```
   - **Throughput**: 1,200 messages/second (peak)

2. **Processing**:
   - **Rule Engine**:
     - **Rules**: 42 static rules (e.g., "RPM > 6000 for >5s")
     - **Latency**: 120ms per message
     - **Example Rule**:
       ```python
       def check_high_rpm(telemetry):
           if telemetry["engine_rpm"] > 6000 and telemetry["speed"] > 0:
               return {
                   "anomaly_type": "high_rpm",
                   "severity": "high",
                   "description": f"RPM {telemetry['engine_rpm']} exceeds threshold"
               }
           return None
       ```
   - **ML Engine**:
     - **Models**: Isolation Forest (for global anomalies), Random Forest (for vehicle-specific anomalies)
     - **Features**: 48 engineered features (e.g., rolling averages, z-scores)
     - **Latency**: 350ms per message
     - **Example Feature Engineering**:
       ```python
       def calculate_rolling_stats(telemetry_stream, window_size=5):
           df = pd.DataFrame(telemetry_stream)
           df["rpm_rolling_avg"] = df["engine_rpm"].rolling(window_size).mean()
           df["rpm_zscore"] = (df["engine_rpm"] - df["engine_rpm"].mean()) / df["engine_rpm"].std()
           return df
       ```

3. **Storage**:
   - **Anomaly Database Schema**:
     ```sql
     CREATE TABLE anomalies (
         id SERIAL PRIMARY KEY,
         vehicle_id VARCHAR(20) NOT NULL,
         timestamp TIMESTAMPTZ NOT NULL,
         anomaly_type VARCHAR(50) NOT NULL,
         severity VARCHAR(20) NOT NULL,
         confidence_score FLOAT,
         features JSONB,
         rule_triggered BOOLEAN DEFAULT FALSE,
         resolved BOOLEAN DEFAULT FALSE,
         resolved_at TIMESTAMPTZ,
         notes TEXT,
         FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
     );
     ```
   - **Feature Store Schema**:
     ```sql
     CREATE TABLE vehicle_features (
         vehicle_id VARCHAR(20) NOT NULL,
         date DATE NOT NULL,
         avg_rpm FLOAT,
         max_rpm FLOAT,
         std_speed FLOAT,
         idle_time FLOAT,
         harsh_braking_count INT,
         PRIMARY KEY (vehicle_id, date)
     );
     ```

4. **Alerting**:
   - **Channels**: Email, SMS, Dashboard, Slack
   - **Example Alert Payload**:
     ```json
     {
         "alert_id": "AL-20230615-143045-001",
         "vehicle_id": "VH-1001",
         "timestamp": "2023-06-15T14:30:45Z",
         "anomaly_type": "high_rpm",
         "severity": "high",
         "description": "RPM 6200 detected for 6 seconds at 65 mph",
         "recommended_action": "Schedule engine inspection",
         "confidence": 0.92,
         "features": {
             "rpm": 6200,
             "speed": 65,
             "throttle_position": 85
         }
     }
     ```

#### 2.1.4 Technology Stack
| **Layer**          | **Technology**               | **Version** | **Justification**                                                                 | **Alternatives Considered**       |
|--------------------|------------------------------|-------------|---------------------------------------------------------------------------------|-----------------------------------|
| **Ingestion**      | Apache Kafka                 | 2.8         | High throughput, low latency, durable message storage                          | AWS Kinesis, RabbitMQ             |
| **Processing**     | Apache Spark                 | 3.1.2       | Scalable batch/stream processing, MLlib integration                            | Flink, Beam                       |
| **Rule Engine**    | Python (Pandas)              | 3.8         | Flexibility for custom rules, easy to maintain                                 | Drools, Easy Rules                |
| **ML Engine**      | Scikit-learn                 | 0.24.2      | Lightweight, good for tabular data, easy to deploy                             | TensorFlow, PyTorch               |
| **Database**       | PostgreSQL                   | 13.4        | ACID compliance, JSON support, strong community                                | MySQL, MongoDB                    |
| **Dashboard**      | React + D3.js                | 17.0.2      | Rich visualization capabilities, component-based architecture                  | Angular, Vue.js                   |
| **Monitoring**     | Prometheus + Grafana         | 2.30/8.3    | Open-source, powerful querying, alerting                                       | Datadog, New Relic                |
| **Logging**        | ELK Stack                    | 7.15        | Scalable log aggregation, full-text search                                     | Splunk, Graylog                   |
| **Infrastructure** | AWS (EC2, RDS, S3)           | -           | Managed services, global availability                                          | GCP, Azure                        |

#### 2.1.5 Infrastructure Configuration
**AWS Architecture Diagram**:
```mermaid
graph TD
    A[Vehicle IoT Devices] -->|MQTT| B[Kafka Brokers: 3x m5.xlarge]
    B --> C[Spark Cluster: 10x r5.2xlarge]
    C --> D[PostgreSQL RDS: db.m5.2xlarge (Multi-AZ)]
    C --> E[Elasticsearch: 3x m5.xlarge]
    D --> F[Dashboard: React App on S3 + CloudFront]
    E --> G[Kibana: Log Visualization]
    H[Prometheus] --> C
    I[Grafana] --> H
    J[Alerting Service: Node.js on ECS] --> D
    J --> F
```

**Key Configurations**:
- **Kafka**:
  - 3 brokers (m5.xlarge)
  - 6 partitions per topic
  - Replication factor: 2
  - Retention: 7 days
- **Spark**:
  - 10 worker nodes (r5.2xlarge)
  - Driver memory: 16GB
  - Executor memory: 32GB
  - Dynamic allocation: Disabled (fixed cluster)
- **PostgreSQL**:
  - Multi-AZ deployment
  - 2TB storage (gp2)
  - Read replicas: 2
  - Max connections: 500
- **Elasticsearch**:
  - 3 data nodes (m5.xlarge)
  - 1 master node (t3.medium)
  - Index retention: 30 days

---

### 2.2 Technical Debt Analysis
#### 2.2.1 Code Quality Issues
**SonarQube Analysis Results**:
| **Metric**               | **Current Value** | **Target** | **Issues** |
|--------------------------|-------------------|------------|------------|
| Code Smells              | 1,248             | <500       | 749        |
| Bugs                     | 42                | 0          | 42         |
| Vulnerabilities          | 12                | 0          | 12         |
| Security Hotspots        | 28                | <10        | 28         |
| Technical Debt           | 182 days          | <50 days   | -          |
| Coverage                 | 38%               | >80%       | -          |
| Duplicated Lines         | 12.4%             | <3%        | -          |

**Top 5 Code Smells**:
1. **Hardcoded Thresholds** (245 instances)
   - *Example*:
     ```python
     # anomaly_detector.py line 42
     IDLING_THRESHOLD = 300  # Should be vehicle-type specific
     ```
   - *Impact*: False positives for vehicles with legitimate idling (e.g., refrigerated trucks).

2. **God Classes** (8 instances)
   - *Example*: `AnomalyDetector` class with 1,245 lines of code
   - *Impact*: Low maintainability (cyclomatic complexity: 42).

3. **Lack of Type Hints** (87% of functions)
   - *Example*:
     ```python
     def detect_anomalies(data):  # Missing type hints
         ...
     ```
   - *Impact*: Increased risk of runtime errors.

4. **No Unit Tests for ML Models** (0% coverage)
   - *Example*: No tests for `IsolationForestModel` class
   - *Impact*: Undetected model drift.

5. **SQL Injection Vulnerabilities** (3 instances)
   - *Example*:
     ```python
     # Vulnerable to SQL injection
     cursor.execute(f"SELECT * FROM anomalies WHERE vehicle_id = '{vehicle_id}'")
     ```
   - *Impact*: Critical security risk (CVSS: 9.8).

#### 2.2.2 Performance Bottlenecks
**Spark Job Profiling**:
| **Job**                  | **Avg Duration** | **Bottleneck**                          | **Root Cause**                          |
|--------------------------|------------------|-----------------------------------------|-----------------------------------------|
| Feature Engineering      | 12.4s            | Data skew (80% of data from 20% vehicles)| Uneven distribution of vehicle activity |
| Rule Engine              | 8.2s             | Python UDFs in Spark                    | Serialization overhead                  |
| ML Scoring               | 15.6s            | Model loading (1.2s per task)           | No model caching                        |
| Anomaly Aggregation      | 5.8s             | PostgreSQL query                        | Missing indexes                         |

**PostgreSQL Query Performance**:
| **Query**                                                                 | **Avg Time** | **Bottleneck**               | **Optimization**                     |
|---------------------------------------------------------------------------|--------------|------------------------------|--------------------------------------|
| `SELECT * FROM anomalies WHERE vehicle_id = 'VH-1001'`                    | 2.4s         | Full table scan              | Add index on `vehicle_id`            |
| `SELECT COUNT(*) FROM anomalies WHERE timestamp > NOW() - INTERVAL '7d'` | 1.8s         | Sequential scan              | Add index on `timestamp`             |
| `INSERT INTO anomalies VALUES (...)`                                     | 0.5s         | WAL (Write-Ahead Logging)    | Batch inserts                        |
| `SELECT * FROM anomalies WHERE resolved = FALSE`                         | 3.2s         | No index on `resolved`       | Add index on `resolved`              |

**Example Slow Query**:
```sql
-- Execution plan shows sequential scan (cost=0.00..1245.67 rows=1000 width=120)
EXPLAIN ANALYZE
SELECT * FROM anomalies
WHERE vehicle_id = 'VH-1001'
AND timestamp BETWEEN '2023-01-01' AND '2023-06-30'
ORDER BY timestamp DESC;
```

#### 2.2.3 Security Vulnerabilities
**OWASP Top 10 Risks**:
| **Risk**               | **Instances** | **CVSS** | **Example**                                                                 | **Remediation**                          |
|------------------------|---------------|----------|-----------------------------------------------------------------------------|------------------------------------------|
| Injection              | 3             | 9.8      | SQL injection in `anomaly_service.py`                                       | Use parameterized queries                |
| Broken Authentication  | 1             | 8.1      | Hardcoded API keys in `config.py`                                           | Use AWS Secrets Manager                  |
| Sensitive Data Exposure| 2             | 7.5      | Telemetry data stored in plaintext in S3                                    | Enable S3 server-side encryption         |
| XML External Entities  | 1             | 8.2      | Unsafe XML parsing in `alert_parser.py`                                     | Disable DTD processing                   |
| Security Misconfiguration | 4         | 6.5      | Default PostgreSQL credentials                                             | Rotate credentials, enforce password policy |

**Example Vulnerability**:
```python
# config.py - Hardcoded credentials (CVSS: 8.1)
DB_CONFIG = {
    "host": "postgres.example.com",
    "user": "admin",
    "password": "SuperSecret123",  # Never hardcode credentials!
    "database": "fms"
}
```

#### 2.2.4 Scalability Limitations
**Load Test Results**:
| **Metric**               | **Current Capacity** | **Bottleneck**               | **Projected Need (12 months)** |
|--------------------------|----------------------|------------------------------|--------------------------------|
| Kafka throughput         | 1,200 msg/s          | Broker CPU (85% utilization) | 2,500 msg/s                    |
| Spark processing         | 1.2M records/day     | Executor memory (OOM errors) | 3M records/day                 |
| PostgreSQL connections   | 500                  | Connection pooling           | 1,200                          |
| Dashboard users          | 200 concurrent       | React app memory             | 500 concurrent                 |

**Spark Job Failures Under Load**:
| **Failure Type**         | **Count (Last 30 Days)** | **Root Cause**                          |
|--------------------------|--------------------------|-----------------------------------------|
| Executor OOM             | 42                       | Insufficient memory for skewed data     |
| Driver OOM               | 18                       | Large broadcast variables               |
| Task Timeouts            | 25                       | Long-running UDFs                       |
| Connection Errors        | 12                       | PostgreSQL max connections reached      |

**Example OOM Error**:
```
java.lang.OutOfMemoryError: Java heap space
    at org.apache.spark.util.collection.unsafe.sort.UnsafeExternalSorter.spill(UnsafeExternalSorter.java:201)
    at org.apache.spark.memory.TaskMemoryManager.acquireExecutionMemory(TaskMemoryManager.java:200)
    at org.apache.spark.memory.TaskMemoryManager.allocatePage(TaskMemoryManager.java:150)
```

---

## 3. Functional Analysis (250+ lines)

### 3.1 Core Features
#### 3.1.1 Real-Time Anomaly Detection
**Feature Description**:
Processes telemetry data in real-time to detect anomalies using a hybrid rule-based and ML approach. Supports 12 anomaly types (e.g., high RPM, harsh braking, prolonged idling).

**User Workflow**:
1. **Data Ingestion**:
   - Vehicle sends telemetry via MQTT to Kafka topic `vehicle-telemetry`.
   - Example payload:
     ```json
     {
         "vehicle_id": "VH-2045",
         "timestamp": "2023-06-15T14:30:45.123Z",
         "engine_rpm": 5800,
         "speed": 55,
         "throttle_position": 80,
         "coolant_temp": 102,
         "gps": {"lat": 37.7749, "lon": -122.4194}
     }
     ```
2. **Rule-Based Detection**:
   - Spark streaming job applies 42 static rules (e.g., "RPM > 6000 for >5s").
   - Example rule:
     ```python
     def check_high_rpm(telemetry):
         if telemetry["engine_rpm"] > 6000 and telemetry["speed"] > 0:
             return {
                 "anomaly_type": "high_rpm",
                 "severity": "high",
                 "description": f"RPM {telemetry['engine_rpm']} exceeds threshold"
             }
         return None
     ```
3. **ML-Based Detection**:
   - If no rule matches, data is scored using Isolation Forest (global anomalies) and Random Forest (vehicle-specific anomalies).
   - Features used:
     - `rpm_zscore`: Z-score of RPM over 5-minute window
     - `speed_rolling_avg`: Rolling average of speed
     - `throttle_variance`: Variance in throttle position
   - Example model inference:
     ```python
     def score_anomaly(features):
         model = joblib.load("isolation_forest_model.pkl")
         score = model.decision_function([features])[0]
         return score < -0.5  # Threshold for anomaly
     ```
4. **Alert Generation**:
   - Anomalies are stored in PostgreSQL and sent to the alerting service.
   - Example alert:
     ```json
     {
         "alert_id": "AL-20230615-143045-002",
         "vehicle_id": "VH-2045",
         "timestamp": "2023-06-15T14:30:45Z",
         "anomaly_type": "high_rpm",
         "severity": "high",
         "confidence": 0.91,
         "features": {"rpm": 5800, "speed": 55, "throttle": 80}
     }
     ```

**Business Rules**:
- **Severity Classification**:
  - `Critical`: Immediate action required (e.g., engine failure)
  - `High`: Action within 24 hours (e.g., high RPM)
  - `Medium`: Monitor (e.g., minor speeding)
  - `Low`: Informational (e.g., idling)
- **Alert Deduplication**:
  - Same anomaly type for the same vehicle within 1 hour is deduplicated.
- **Vehicle-Specific Thresholds**:
  - Thresholds vary by vehicle type (e.g., trucks vs sedans).

**Edge Cases**:
1. **GPS Spoofing**:
   - *Scenario*: Vehicle reports impossible speed (e.g., 200 mph for a truck).
   - *Handling*: Cross-validate with accelerometer data; flag as "GPS anomaly."
2. **Sensor Failure**:
   - *Scenario*: OBD-II device sends `null` for RPM.
   - *Handling*: Mark as "sensor failure" and notify maintenance.
3. **Network Latency**:
   - *Scenario*: Telemetry arrives 30+ seconds late.
   - *Handling*: Use event-time processing in Spark; apply watermarks.

**Performance Characteristics**:
| **Metric**               | **Value**       | **Target**  |
|--------------------------|-----------------|-------------|
| End-to-end latency       | 4.2s            | <3s         |
| Throughput               | 1,200 msg/s     | 2,500 msg/s |
| False positive rate      | 18.4%           | <10%        |
| Detection accuracy       | 72%             | >85%        |

---

#### 3.1.2 Batch Anomaly Aggregation
**Feature Description**:
Daily aggregation of anomalies to generate fleet-wide reports and retrain ML models.

**User Workflow**:
1. **Data Collection**:
   - Spark batch job reads anomalies from PostgreSQL for the last 24 hours.
   - Example query:
     ```sql
     SELECT vehicle_id, anomaly_type, severity, timestamp
     FROM anomalies
     WHERE timestamp >= NOW() - INTERVAL '24 hours';
     ```
2. **Aggregation**:
   - Compute metrics:
     - Anomalies per vehicle
     - Anomaly type distribution
     - Severity breakdown
   - Example aggregation:
     ```python
     df = spark.read.jdbc(postgres_url, "anomalies")
     agg_df = df.groupBy("vehicle_id", "anomaly_type").agg(
         count("*").alias("count"),
         first("severity").alias("severity")
     )
     ```
3. **Report Generation**:
   - Generate PDF/CSV reports for fleet managers.
   - Example report:
     | Vehicle ID | Anomaly Type   | Count | Severity | Last Occurrence       |
     |------------|----------------|-------|----------|-----------------------|
     | VH-2045    | high_rpm       | 5     | High     | 2023-06-15T14:30:45Z  |
     | VH-2046    | harsh_braking  | 3     | Medium   | 2023-06-15T10:15:22Z  |
4. **Model Retraining**:
   - Retrain Isolation Forest and Random Forest models weekly.
   - Example retraining script:
     ```python
     def retrain_models():
         data = load_training_data()
         iso_forest = IsolationForest().fit(data)
         rf = RandomForestClassifier().fit(data[features], data["label"])
         joblib.dump(iso_forest, "isolation_forest_model.pkl")
         joblib.dump(rf, "random_forest_model.pkl")
     ```

**Business Rules**:
- **Retraining Frequency**: Weekly for global models, daily for vehicle-specific models.
- **Data Retention**: Anomalies older than 90 days are archived to S3.
- **Report Distribution**: Reports sent to fleet managers at 6 AM daily.

**Edge Cases**:
1. **No Anomalies in 24 Hours**:
   - *Handling*: Generate "no anomalies" report.
2. **Database Unavailable**:
   - *Handling*: Fall back to cached data; alert IT.
3. **Model Training Failure**:
   - *Handling*: Use previous model version; notify data science team.

**Performance Characteristics**:
| **Metric**               | **Value**       | **Target**  |
|--------------------------|-----------------|-------------|
| Job duration             | 45 minutes      | <30 minutes |
| Data processed           | 1.2M records    | 3M records  |
| Model accuracy           | 72%             | >85%        |

---

#### 3.1.3 Alert Management
**Feature Description**:
Dashboard for viewing, acknowledging, and resolving anomalies.

**User Workflow**:
1. **Alert Dashboard**:
   - Fleet managers log in to the React dashboard.
   - Example UI:
     ```jsx
     // AlertList.jsx
     const AlertList = ({ alerts }) => (
         <Table>
             {alerts.map(alert => (
                 <TableRow key={alert.id}>
                     <TableCell>{alert.vehicle_id}</TableCell>
                     <TableCell>{alert.anomaly_type}</TableCell>
                     <TableCell>
                         <SeverityBadge severity={alert.severity} />
                     </TableCell>
                     <TableCell>{alert.timestamp}</TableCell>
                     <TableCell>
                         <Button onClick={() => acknowledgeAlert(alert.id)}>
                             Acknowledge
                         </Button>
                     </TableCell>
                 </TableRow>
             ))}
         </Table>
     );
     ```
2. **Alert Acknowledgment**:
   - User clicks "Acknowledge" to mark an alert as reviewed.
   - Example API call:
     ```javascript
     fetch(`/api/alerts/${alertId}/acknowledge`, {
         method: "POST",
         headers: { "Authorization": `Bearer ${token}` }
     });
     ```
3. **Alert Resolution**:
   - User adds notes and marks alert as "Resolved."
   - Example resolution:
     ```json
     {
         "resolved": true,
         "resolved_at": "2023-06-15T15:00:00Z",
         "notes": "Engine inspected - no issues found. Driver trained on RPM management."
     }
     ```
4. **Alert Filtering**:
   - Filter by:
     - Vehicle ID
     - Anomaly type
     - Severity
     - Time range

**Business Rules**:
- **Acknowledgment Timeout**: Alerts auto-escalate if not acknowledged within 2 hours (Critical), 6 hours (High).
- **Resolution SLA**:
  - Critical: 4 hours
  - High: 24 hours
  - Medium: 72 hours
- **Audit Trail**: All actions (acknowledge/resolve) are logged.

**Edge Cases**:
1. **Alert Storm**:
   - *Scenario*: 500+ alerts generated in 1 minute (e.g., GPS outage).
   - *Handling*: Group related alerts; prioritize by severity.
2. **User Inactivity**:
   - *Scenario*: User doesn't acknowledge alerts for 24 hours.
   - *Handling*: Escalate to manager; send SMS.
3. **False Positive**:
   - *Scenario*: Alert is marked as false positive.
   - *Handling*: Exclude similar alerts for 30 days; notify data science team.

**Performance Characteristics**:
| **Metric**               | **Value**       | **Target**  |
|--------------------------|-----------------|-------------|
| Dashboard load time      | 3.2s            | <2s         |
| Alerts displayed         | 200 (max)       | 500         |
| API response time        | 450ms           | <300ms      |

---

### 3.2 User Experience Analysis
#### 3.2.1 Usability Evaluation
**Heuristic Evaluation (Nielsen's 10 Usability Heuristics)**:
| **Heuristic**               | **Score (1-5)** | **Issues**                                                                 | **Examples**                                                                 |
|-----------------------------|-----------------|----------------------------------------------------------------------------|------------------------------------------------------------------------------|
| Visibility of System Status | 2               | No loading indicators; unclear when alerts are updated.                   | Dashboard shows "Last updated: 10 minutes ago" but no spinner during refresh. |
| Match Between System and Real World | 3       | Technical jargon (e.g., "Isolation Forest score").                         | Alert description: "Anomaly detected with score -0.72."                     |
| User Control and Freedom    | 2               | No "undo" for acknowledged alerts; no bulk actions.                       | Acknowledging an alert is irreversible.                                     |
| Consistency and Standards   | 3               | Inconsistent button styles (e.g., "Acknowledge" vs "Mark Resolved").      | Some buttons are primary, others are secondary.                             |
| Error Prevention            | 2               | No confirmation for critical actions (e.g., resolving alerts).            | No "Are you sure?" when resolving an alert.                                 |
| Recognition Rather Than Recall | 4           | Mostly good, but some hidden features (e.g., advanced filtering).         | Filtering by "Anomaly Type" requires clicking a dropdown.                   |
| Flexibility and Efficiency  | 2               | No keyboard shortcuts; no customizable views.                             | Must click through 3 screens to view alert details.                         |
| Aesthetic and Minimalist Design | 3          | Overcrowded dashboard; too many colors for severity levels.               | 4 severity colors (red, orange, yellow, blue) are hard to distinguish.      |
| Help Users Recognize Errors | 1               | Error messages are technical (e.g., "500 Internal Server Error").         | No user-friendly error messages.                                            |
| Help and Documentation      | 1               | No help section or tooltips.                                               | No explanation of what "confidence score" means.                            |

**Top 3 Usability Issues**:
1. **Alert Fatigue**:
   - *Problem*: 200+ alerts/day overwhelm users.
   - *Impact*: 62% of alerts are ignored.
   - *Solution*: Implement alert prioritization and deduplication.

2. **Lack of Actionable Insights**:
   - *Problem*: Alerts like "High RPM detected" lack context or recommendations.
   - *Impact*: Users spend 5+ minutes per alert researching root causes.
   - *Solution*: Add recommended actions (e.g., "Schedule engine inspection").

3. **Poor Mobile Experience**:
   - *Problem*: Dashboard is not responsive; tables are unreadable on mobile.
   - *Impact*: Fleet managers can't access alerts on the go.
   - *Solution*: Redesign with mobile-first approach.

#### 3.2.2 Accessibility Audit (WCAG 2.1)
**Audit Results**:
| **WCAG Criterion**         | **Level** | **Compliance** | **Issues**                                                                 |
|----------------------------|-----------|----------------|----------------------------------------------------------------------------|
| 1.1.1 Non-text Content     | A         | Fail           | Images lack alt text (e.g., severity icons).                               |
| 1.3.1 Info and Relationships | A      | Fail           | Tables lack proper headers (`<th>`).                                       |
| 1.4.3 Contrast (Minimum)   | AA        | Fail           | Low contrast for secondary buttons (e.g., gray on white).                  |
| 1.4.4 Resize Text          | AA        | Fail           | Text doesn't reflow when zoomed to 200%.                                   |
| 2.1.1 Keyboard             | A         | Fail           | Dropdown menus can't be navigated with keyboard.                           |
| 2.4.1 Bypass Blocks        | A         | Fail           | No "skip to content" link.                                                 |
| 2.4.6 Headings and Labels  | AA        | Fail           | Missing heading hierarchy (e.g., multiple `<h1>` tags).                    |
| 3.3.2 Labels or Instructions | A      | Fail           | Form fields lack labels (e.g., search box).                                |
| 4.1.1 Parsing              | A         | Fail           | Duplicate IDs in HTML.                                                     |

**Example Fixes**:
1. **Add Alt Text**:
   ```html
   <!-- Before -->
   <img src="high-severity-icon.png" />

   <!-- After -->
   <img src="high-severity-icon.png" alt="High severity alert" />
   ```
2. **Improve Contrast**:
   ```css
   /* Before */
   .secondary-button {
       color: #666;
       background: #fff;
   }

   /* After */
   .secondary-button {
       color: #333;
       background: #f0f0f0;
   }
   ```
3. **Keyboard Navigation**:
   ```jsx
   // Add onKeyDown handler for dropdowns
   <Dropdown onKeyDown={(e) => {
       if (e.key === "Enter") openDropdown();
   }}>
   ```

#### 3.2.3 Mobile Responsiveness Assessment
**Device Testing Results**:
| **Device**       | **Resolution** | **Issues**                                                                 |
|------------------|----------------|----------------------------------------------------------------------------|
| iPhone 12        | 390x844        | - Tables overflow horizontally<br>- Buttons too small to tap              |
| iPad Air         | 820x1180       | - Dashboard layout doesn't adapt<br>- Fonts too small                     |
| Samsung Galaxy S21 | 360x800      | - Alert cards are cut off<br>- No landscape support                       |
| Desktop (13")    | 1280x800       | - Works well but wastes space                                             |

**Example Mobile Fix**:
```css
/* Responsive table */
@media (max-width: 600px) {
    .alert-table {
        display: block;
    }
    .alert-table tr {
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
    }
    .alert-table td {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem;
    }
    .alert-table td::before {
        content: attr(data-label);
        font-weight: bold;
        margin-right: 1rem;
    }
}
```

#### 3.2.4 User Feedback Analysis
**Feedback Sources**:
1. **Survey (n=85 fleet managers)**:
   - *Question*: "What is the biggest challenge with the current alert system?"
   - *Responses*:
     - "Too many false alarms" (42%)
     - "Not actionable" (28%)
     - "Hard to find relevant alerts" (18%)
     - "Slow performance" (12%)

2. **Support Tickets (Last 6 Months)**:
   | **Issue**                          | **Count** | **Resolution Time** |
   |------------------------------------|-----------|---------------------|
   | Alert not showing in dashboard     | 45        | 2.1 hours           |
   | False positive for idling          | 32        | 1.8 hours           |
   | Can't acknowledge alerts           | 28        | 3.4 hours           |
   | Dashboard slow on mobile           | 22        | 4.5 hours           |
   | Alerts not updating in real-time   | 18        | 2.7 hours           |

3. **User Interviews (n=10)**:
   - *Quote*: "I spend more time filtering alerts than actually fixing issues."
   - *Quote*: "The 'high RPM' alert fires for every truck, even though some are designed to run at higher RPMs."
   - *Quote*: "I wish the system could tell me which alerts are most important."

**Key Themes**:
1. **Alert Overload**: Users are overwhelmed by volume.
2. **Lack of Context**: Alerts lack vehicle-specific or environmental context.
3. **Poor Mobile Experience**: Critical for fleet managers on the go.
4. **Performance Issues**: Dashboard and API are slow.

---

## 4. Data Architecture (150+ lines)

### 4.1 Current Data Model
#### 4.1.1 Entity-Relationship Diagram
```mermaid
erDiagram
    VEHICLE ||--o{ ANOMALY : generates
    VEHICLE ||--o{ TELEMETRY : produces
    VEHICLE ||--o{ VEHICLE_FEATURES : has
    ANOMALY ||--o{ ALERT : triggers
    USER ||--o{ ALERT : acknowledges

    VEHICLE {
        string id PK
        string vin
        string make
        string model
        string year
        string vehicle_type
        string current_driver_id FK
        timestamp last_maintenance
        string status
    }

    TELEMETRY {
        string id PK
        string vehicle_id FK
        timestamp timestamp
        float engine_rpm
        float speed
        float throttle_position
        float coolant_temp
        float fuel_level
        json gps
        json accelerometer
    }

    ANOMALY {
        string id PK
        string vehicle_id FK
        timestamp timestamp
        string anomaly_type
        string severity
        float confidence_score
        json features
        boolean rule_triggered
        boolean resolved
        timestamp resolved_at
        string notes
    }

    VEHICLE_FEATURES {
        string vehicle_id FK
        date date
        float avg_rpm
        float max_rpm
        float std_speed
        float idle_time
        int harsh_braking_count
    }

    ALERT {
        string id PK
        string anomaly_id FK
        string user_id FK
        timestamp acknowledged_at
        string status
    }

    USER {
        string id PK
        string name
        string email
        string role
    }
```

#### 4.1.2 Table Schemas
**1. `vehicles` Table**:
```sql
CREATE TABLE vehicles (
    id VARCHAR(20) PRIMARY KEY,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('truck', 'sedan', 'van', 'suv')),
    current_driver_id VARCHAR(50),
    last_maintenance TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (current_driver_id) REFERENCES users(id)
);
```

**2. `telemetry` Table**:
```sql
CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    engine_rpm FLOAT,
    speed FLOAT,
    throttle_position FLOAT,
    coolant_temp FLOAT,
    fuel_level FLOAT,
    gps JSONB NOT NULL,
    accelerometer JSONB NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    CONSTRAINT valid_timestamp CHECK (timestamp <= NOW())
);

CREATE INDEX idx_telemetry_vehicle_id ON telemetry(vehicle_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);
```

**3. `anomalies` Table**:
```sql
CREATE TABLE anomalies (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
    features JSONB,
    rule_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_anomalies_vehicle_id ON anomalies(vehicle_id);
CREATE INDEX idx_anomalies_timestamp ON anomalies(timestamp);
CREATE INDEX idx_anomalies_resolved ON anomalies(resolved) WHERE resolved = FALSE;
```

**4. `vehicle_features` Table**:
```sql
CREATE TABLE vehicle_features (
    vehicle_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    avg_rpm FLOAT,
    max_rpm FLOAT,
    std_speed FLOAT,
    idle_time FLOAT,
    harsh_braking_count INT,
    PRIMARY KEY (vehicle_id, date),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX idx_vehicle_features_date ON vehicle_features(date);
```

#### 4.1.3 Data Integrity Rules
1. **Referential Integrity**:
   - `anomalies.vehicle_id` must exist in `vehicles.id`.
   - `telemetry.vehicle_id` must exist in `vehicles.id`.
   - `vehicle_features.vehicle_id` must exist in `vehicles.id`.

2. **Domain Constraints**:
   - `vehicles.vehicle_type` must be one of: `truck`, `sedan`, `van`, `suv`.
   - `anomalies.severity` must be one of: `critical`, `high`, `medium`, `low`.
   - `anomalies.confidence_score` must be between 0 and 1.

3. **Temporal Constraints**:
   - `telemetry.timestamp` cannot be in the future.
   - `anomalies.resolved_at` must be >= `anomalies.timestamp`.

4. **Uniqueness Constraints**:
   - `vehicles.vin` must be unique.
   - `(vehicle_features.vehicle_id, vehicle_features.date)` must be unique.

#### 4.1.4 Migration History
| **Version** | **Date**       | **Changes**                                                                 | **Migration Script**                                                                 |
|-------------|----------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| 1.0         | 2018-01-15     | Initial schema for rule-based engine                                        | `CREATE TABLE anomalies (...);`                                                     |
| 1.1         | 2018-06-20     | Added `confidence_score` and `features` to `anomalies`                      | `ALTER TABLE anomalies ADD COLUMN confidence_score FLOAT;`                          |
| 2.0         | 2019-11-10     | Added `vehicle_features` table for ML models                                | `CREATE TABLE vehicle_features (...);`                                              |
| 2.1         | 2020-03-15     | Added `rule_triggered` to `anomalies`                                       | `ALTER TABLE anomalies ADD COLUMN rule_triggered BOOLEAN DEFAULT FALSE;`            |
| 3.0         | 2021-07-22     | Added `gps` and `accelerometer` to `telemetry`; JSONB data type             | `ALTER TABLE telemetry ADD COLUMN gps JSONB, ADD COLUMN accelerometer JSONB;`       |
| 3.1         | 2022-01-10     | Added `resolved` and `resolved_at` to `anomalies`                           | `ALTER TABLE anomalies ADD COLUMN resolved BOOLEAN DEFAULT FALSE, ADD COLUMN resolved_at TIMESTAMPTZ;` |

---

### 4.2 Data Management
#### 4.2.1 CRUD Operations Analysis
**1. Create Operations**:
| **Entity**      | **Operation**               | **Frequency** | **Latency** | **Bottleneck**               |
|-----------------|-----------------------------|---------------|-------------|------------------------------|
| Telemetry       | Insert into `telemetry`     | 1,200/s       | 15ms        | Kafka to PostgreSQL pipeline |
| Anomaly         | Insert into `anomalies`     | 5/s           | 45ms        | PostgreSQL WAL               |
| Vehicle         | Insert into `vehicles`      | 10/day        | 120ms       | Manual process               |
| Vehicle Features| Insert into `vehicle_features` | 12,500/day  | 80ms        | Batch job                    |

**Example Insert (Telemetry)**:
```python
# Spark job writing to PostgreSQL
df.write \
    .format("jdbc") \
    .option("url", postgres_url) \
    .option("dbtable", "telemetry") \
    .option("user", postgres_user) \
    .option("password", postgres_password) \
    .mode("append") \
    .save()
```

**2. Read Operations**:
| **Entity**      | **Operation**               | **Frequency** | **Latency** | **Bottleneck**               |
|-----------------|-----------------------------|---------------|-------------|------------------------------|
| Anomaly         | `SELECT * FROM anomalies WHERE vehicle_id = ?` | 200/s | 2.4s | Missing index |
| Telemetry       | `SELECT * FROM telemetry WHERE vehicle_id = ? AND timestamp > ?` | 150/s | 1.8s | No composite index |
| Vehicle Features| `SELECT * FROM vehicle_features WHERE vehicle_id = ? AND date = ?` | 50/s | 50ms | Proper indexing |
| Alerts          | `SELECT * FROM anomalies WHERE resolved = FALSE` | 10/s | 3.2s | No index on `resolved` |

**Example Slow Query**:
```sql
-- Missing index on (vehicle_id, timestamp)
EXPLAIN ANALYZE
SELECT * FROM telemetry
WHERE vehicle_id = 'VH-1001'
AND timestamp BETWEEN '2023-06-01' AND '2023-06-15';
```

**3. Update Operations**:
| **Entity**      | **Operation**               | **Frequency** | **Latency** | **Bottleneck**               |
|-----------------|-----------------------------|---------------|-------------|------------------------------|
| Anomaly         | Update `resolved` and `resolved_at` | 50/s | 200ms | Row locking |
| Vehicle         | Update `last_maintenance`   | 5/day         | 100ms       | Manual process               |

**Example Update (Anomaly)**:
```python
# Flask API endpoint
@app.route("/alerts/<alert_id>/resolve", methods=["POST"])
def resolve_alert(alert_id):
    query = """
        UPDATE anomalies
        SET resolved = TRUE, resolved_at = NOW(), notes = %s
        WHERE id = %s
    """
    cursor.execute(query, (request.json["notes"], alert_id))
    return {"status": "success"}
```

**4. Delete Operations**:
| **Entity**      | **Operation**               | **Frequency** | **Latency** | **Bottleneck**               |
|-----------------|-----------------------------|---------------|-------------|------------------------------|
| Telemetry       | Delete old data (>90 days)  | 1/day         | 30s         | VACUUM process               |
| Anomaly         | Archive old data (>1 year)  | 1/month       | 5min        | S3 export                    |

**Example Delete (Telemetry)**:
```sql
-- Partitioned by month for easier deletion
CREATE TABLE telemetry_y2023m06 PARTITION OF telemetry
    FOR VALUES FROM ('2023-06-01') TO ('2023-07-01');

-- Drop partition
DROP TABLE telemetry_y2023m05;
```

#### 4.2.2 Query Performance Profiling
**Top 5 Slowest Queries**:
| **Query**                                                                 | **Avg Time** | **Calls/Day** | **Total Time/Day** | **Optimization**                     |
|---------------------------------------------------------------------------|--------------|---------------|--------------------|--------------------------------------|
| `SELECT * FROM anomalies WHERE vehicle_id = ?`                            | 2.4s         | 17,280        | 11.5 hours         | Add index on `vehicle_id`            |
| `SELECT * FROM anomalies WHERE resolved = FALSE`                          | 3.2s         | 864           | 46 minutes         | Add index on `resolved`              |
| `SELECT * FROM telemetry WHERE vehicle_id = ? AND timestamp > ?`         | 1.8s         | 12,960        | 6.5 hours          | Add composite index on `(vehicle_id, timestamp)` |
| `INSERT INTO anomalies VALUES (...)`                                     | 45ms         | 432,000       | 5.4 hours          | Batch inserts                        |
| `SELECT COUNT(*) FROM anomalies WHERE timestamp > NOW() - INTERVAL '7d'` | 1.2s         | 1,440         | 29 minutes         | Add index on `timestamp`             |

**Example Optimization**:
```sql
-- Before: 2.4s execution time
EXPLAIN ANALYZE
SELECT * FROM anomalies
WHERE vehicle_id = 'VH-1001';

-- After: Add index (50ms execution time)
CREATE INDEX idx_anomalies_vehicle_id ON anomalies(vehicle_id);

-- After: 80ms execution time
EXPLAIN ANALYZE
SELECT * FROM anomalies
WHERE vehicle_id = 'VH-1001';
```

#### 4.2.3 Data Validation Procedures
**1. Telemetry Validation**:
- **Rules**:
  - `engine_rpm` must be between 0 and 10,000.
  - `speed` must be between 0 and 120 (for trucks) or 150 (for sedans).
  - `gps.lat` must be between -90 and 90.
  - `gps.lon` must be between -180 and 180.
- **Implementation**:
  ```python
  def validate_telemetry(telemetry):
      if not (0 <= telemetry["engine_rpm"] <= 10000):
          raise ValueError("Invalid RPM")
      if telemetry["vehicle_type"] == "truck" and telemetry["speed"] > 120:
          raise ValueError("Truck speed too high")
      if not (-90 <= telemetry["gps"]["lat"] <= 90):
          raise ValueError("Invalid latitude")
      return True
  ```

**2. Anomaly Validation**:
- **Rules**:
  - `confidence_score` must be between 0 and 1.
  - `severity` must be one of: `critical`, `high`, `medium`, `low`.
  - `timestamp` must be <= current time.
- **Implementation**:
  ```python
  def validate_anomaly(anomaly):
      if not (0 <= anomaly["confidence_score"] <= 1):
          raise ValueError("Invalid confidence score")
      if anomaly["severity"] not in ["critical", "high", "medium", "low"]:
          raise ValueError("Invalid severity")
      if anomaly["timestamp"] > datetime.now():
          raise ValueError("Timestamp in future")
      return True
  ```

**3. Data Quality Checks**:
- **Daily Checks**:
  - `telemetry` table should have ~1.2M records/day.
  - `anomalies` table should have ~8,000 records/day.
  - No `NULL` values in critical fields (`vehicle_id`, `timestamp`).
- **Implementation**:
  ```sql
  -- Daily data quality check
  SELECT
      COUNT(*) AS telemetry_count,
      COUNT(DISTINCT vehicle_id) AS vehicles_reporting,
      SUM(CASE WHEN engine_rpm IS NULL THEN 1 ELSE 0 END) AS null_rpm
  FROM telemetry
  WHERE timestamp >= NOW() - INTERVAL '24 hours';
  ```

#### 4.2.4 Backup and Recovery Procedures
**1. Backup Strategy**:
| **Data**          | **Frequency** | **Method**                          | **Retention** | **Storage**       |
|-------------------|---------------|-------------------------------------|---------------|-------------------|
| PostgreSQL        | Daily         | `pg_dump` + WAL archiving           | 30 days       | S3                |
| Elasticsearch     | Daily         | Snapshot API                        | 30 days       | S3                |
| Kafka             | Continuous    | MirrorMaker to DR region            | 7 days        | Kafka (DR)        |
| Spark Checkpoints | Continuous    | Checkpoint directory                | 7 days        | HDFS              |

**Example PostgreSQL Backup**:
```bash
# Full backup
pg_dump -U postgres -F c -b -v -f fms_backup_$(date +%Y%m%d).dump fms

# Incremental backup (WAL)
wal-e backup-push /var/lib/postgresql/13/main
```

**2. Recovery Procedures**:
| **Scenario**               | **Recovery Steps**                                                                 | **RTO** | **RPO** |
|----------------------------|------------------------------------------------------------------------------------|---------|---------|
| PostgreSQL corruption      | Restore from latest backup + replay WAL logs                                       | 2 hours | 5 min   |
| Kafka broker failure       | Failover to DR region; reprocess lost messages from source                         | 15 min  | 0       |
| Spark job failure          | Restart job from last checkpoint                                                   | 30 min  | 5 min   |
| S3 bucket loss             | Restore from cross-region replication                                              | 1 hour  | 0       |

**Example Recovery (PostgreSQL)**:
```bash
# Step 1: Restore from backup
pg_restore -U postgres -d fms -v fms_backup_20230615.dump

# Step 2: Replay WAL logs
wal-e backup-fetch /var/lib/postgresql/13/main LATEST
```

**3. Disaster Recovery Plan**:
- **Primary Region**: us-east-1 (AWS)
- **DR Region**: us-west-2 (AWS)
- **Failover Triggers**:
  - Primary region unavailable for >15 minutes.
  - Data corruption detected.
- **Failover Steps**:
  1. Promote DR region Kafka brokers to primary.
  2. Redirect traffic to DR region load balancer.
  3. Restore PostgreSQL from cross-region snapshot.
  4. Reprocess lost telemetry from IoT devices.

---

## 5. Integration Analysis (120+ lines)

### 5.1 API Endpoints
#### 5.1.1 REST API Documentation
**Base URL**: `https://fms.example.com/api/v1`

**Authentication**: JWT (Bearer token)
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 24 hours

**Rate Limiting**:
- 100 requests/minute per user
- 1,000 requests/minute per IP

**Endpoints**:

1. **GET /alerts**
   - **Description**: List anomalies/alerts with filtering.
   - **Parameters**:
     | Parameter   | Type    | Description                          | Example               |
     |-------------|---------|--------------------------------------|-----------------------|
     | vehicle_id  | string  | Filter by vehicle ID                 | `VH-1001`             |
     | severity    | string  | Filter by severity                   | `high`                |
     | resolved    | boolean | Filter by resolution status          | `false`               |
     | start_time  | string  | Start timestamp (ISO 8601)           | `2023-06-01T00:00:00Z`|
     | end_time    | string  | End timestamp (ISO 8601)             | `2023-06-15T23:59:59Z`|
     | limit       | integer | Max number of results                | `100`                 |
     | offset      | integer | Pagination offset                    | `0`                   |
   - **Response**:
     ```json
     {
         "data": [
             {
                 "id": "AL-20230615-143045-001",
                 "vehicle_id": "VH-1001",
                 "timestamp": "2023-06-15T14:30:45Z",
                 "anomaly_type": "high_rpm",
                 "severity": "high",
                 "confidence": 0.92,
                 "resolved": false,
                 "features": {"rpm": 6200, "speed": 65}
             }
         ],
         "pagination": {
             "total": 42,
             "limit": 100,
             "offset": 0
         }
     }
     ```
   - **Example Request**:
     ```bash
     curl -X GET "https://fms.example.com/api/v1/alerts?vehicle_id=VH-1001&severity=high&resolved=false" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     ```

2. **POST /alerts/{id}/acknowledge**
   - **Description**: Acknowledge an alert.
   - **Parameters**:
     | Parameter | Type   | Description          | Required |
     |-----------|--------|----------------------|----------|
     | id        | string | Alert ID             | Yes      |
   - **Request Body**:
     ```json
     {
         "notes": "Inspection scheduled for tomorrow"
     }
     ```
   - **Response**:
     ```json
     {
         "status": "success",
         "acknowledged_at": "2023-06-15T15:00:00Z"
     }
     ```
   - **Example Request**:
     ```bash
     curl -X POST "https://fms.example.com/api/v1/alerts/AL-20230615-143045-001/acknowledge" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
          -H "Content-Type: application/json" \
          -d '{"notes": "Inspection scheduled for tomorrow"}'
     ```

3. **POST /alerts/{id}/resolve**
   - **Description**: Mark an alert as resolved.
   - **Parameters**: Same as `/acknowledge`.
   - **Request Body**:
     ```json
     {
         "notes": "Engine inspected - no issues found. Driver trained."
     }
     ```
   - **Response**: Same as `/acknowledge`.

4. **GET /vehicles/{id}/telemetry**
   - **Description**: Get telemetry for a vehicle.
   - **Parameters**:
     | Parameter   | Type    | Description                          | Example               |
     |-------------|---------|--------------------------------------|-----------------------|
     | id          | string  | Vehicle ID                           | `VH-1001`             |
     | start_time  | string  | Start timestamp (ISO 8601)           | `2023-06-15T14:00:00Z`|
     | end_time    | string  | End timestamp (ISO 8601)             | `2023-06-15T15:00:00Z`|
     | limit       | integer | Max number of results                | `1000`                |
   - **Response**:
     ```json
     {
         "data": [
             {
                 "timestamp": "2023-06-15T14:30:45Z",
                 "engine_rpm": 2800,
                 "speed": 65,
                 "throttle_position": 78,
                 "gps": {"lat": 37.7749, "lon": -122.4194}
             }
         ]
     }
     ```

5. **GET /vehicles/{id}/anomalies**
   - **Description**: Get anomalies for a vehicle.
   - **Parameters**: Same as `/alerts` but with `vehicle_id` in path.
   - **Response**: Same as `/alerts`.

#### 5.1.2 Request/Response Schemas
**1. Alert Schema**:
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Alert",
    "type": "object",
    "properties": {
        "id": {"type": "string", "pattern": "^AL-\\d{8}-\\d{6}-\\d{3}$"},
        "vehicle_id": {"type": "string", "pattern": "^VH-\\d{4}$"},
        "timestamp": {"type": "string", "format": "date-time"},
        "anomaly_type": {"type": "string", "enum": ["high_rpm", "harsh_braking", "prolonged_idling", "over_speeding", "engine_overheat", "low_fuel", "gps_anomaly", "sensor_failure"]},
        "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "resolved": {"type": "boolean"},
        "resolved_at": {"type": "string", "format": "date-time"},
        "features": {
            "type": "object",
            "properties": {
                "rpm": {"type": "number"},
                "speed": {"type": "number"},
                "throttle_position": {"type": "number"}
            }
        }
    },
    "required": ["id", "vehicle_id", "timestamp", "anomaly_type", "severity"]
}
```

**2. Error Schema**:
```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Error",
    "type": "object",
    "properties": {
        "error": {
            "type": "object",
            "properties": {
                "code": {"type": "string"},
                "message": {"type": "string"},
                "details": {"type": "object"}
            },
            "required": ["code", "message"]
        }
    },
    "required": ["error"]
}
```

**Example Error Response**:
```json
{
    "error": {
        "code": "invalid_request",
        "message": "Vehicle ID must match pattern VH-\\d{4}",
        "details": {
            "vehicle_id": "VH-100"  // Invalid ID
        }
    }
}
```

#### 5.1.3 Authentication/Authorization
**1. Authentication Flow**:
1. User logs in via `/auth/login` with email/password.
2. Server validates credentials and returns JWT.
3. Client includes JWT in `Authorization` header for subsequent requests.

**Example Login Request**:
```bash
curl -X POST "https://fms.example.com/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email": "fleet.manager@example.com", "password": "SecurePass123!"}'
```

**Example Login Response**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
}
```

**2. Authorization Model (RBAC)**:
| **Role**         | **Permissions**                                                                 |
|------------------|---------------------------------------------------------------------------------|
| Fleet Manager    | Read alerts, acknowledge/resolve alerts, view telemetry                        |
| Data Scientist   | Read/write access to ML models, view raw telemetry                             |
| IT Admin         | Full access to all endpoints, manage users                                     |
| Driver           | View own alerts, update profile                                                |
| Maintenance Tech | View alerts for assigned vehicles, update resolution notes                     |

**Example Role-Based Access Control**:
```python
# Flask decorator for RBAC
from functools import wraps

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_role = get_user_role_from_jwt()
            if user_role not in roles:
                return {"error": "Unauthorized"}, 403
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Usage
@app.route("/alerts/<id>/resolve", methods=["POST"])
@role_required("Fleet Manager", "Maintenance Tech")
def resolve_alert(id):
    ...
```

#### 5.1.4 Rate Limiting and Quotas
**1. Rate Limiting**:
- **Algorithm**: Token bucket (100 tokens/minute, refill rate: 1 token/600ms).
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed.
  - `X-RateLimit-Remaining`: Remaining requests.
  - `X-RateLimit-Reset`: Time when limit resets (UTC timestamp).

**Example Rate Limit Response**:
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1686854400
Content-Type: application/json

{
    "error": {
        "code": "rate_limit_exceeded",
        "message": "Too many requests. Limit: 100/minute."
    }
}
```

**2. Quotas**:
| **Resource**     | **Quota**               | **Scope**       |
|------------------|-------------------------|-----------------|
| API requests     | 100/minute              | Per user        |
| Telemetry storage| 90 days                 | Per vehicle     |
| Alerts storage   | 1 year                  | Per vehicle     |
| ML model size    | 500MB                   | Per model       |

---

### 5.2 External Dependencies
#### 5.2.1 Third-Party Services
| **Service**          | **Purpose**                                                                 | **Integration Method**       | **SLA**  | **Cost**       |
|----------------------|-----------------------------------------------------------------------------|------------------------------|----------|----------------|
| AWS IoT Core         | Ingest telemetry from vehicles via MQTT                                    | Direct integration           | 99.9%    | $5 per million messages |
| Google Maps API      | Geocode GPS coordinates for alerts                                         | REST API                     | 99.9%    | $0.50 per 1,000 requests |
| Twilio               | Send SMS alerts to fleet managers                                          | REST API                     | 99.95%   | $0.0075 per SMS |
| SendGrid             | Send email alerts and reports                                              | SMTP/REST API                | 99.9%    | $14.95/month   |
| Weather API          | Provide weather data for contextual anomaly detection (deprecated in 2021) | REST API                     | 99.5%    | $99/month      |

**Example AWS IoT Core Integration**:
```python
# IoT Rule to forward telemetry to Kafka
{
    "sql": "SELECT * FROM 'vehicles/+/telemetry'",
    "actions": [
        {
            "kafka": {
                "topic": "vehicle-telemetry",
                "brokers": ["b-1.fms.abc123.c2.kafka.us-east-1.amazonaws.com:9092"],
                "clientProperties": {
                    "security.protocol": "SSL"
                }
            }
        }
    ]
}
```

#### 5.2.2 Integration Patterns
**1. Event-Driven Architecture**:
- **Pattern**: Pub/Sub via Kafka.
- **Use Case**: Real-time telemetry processing.
- **Example**:
  ```mermaid
  graph LR
      A[Vehicle] -->|MQTT| B[AWS IoT Core]
      B -->|Kafka| C[Spark Streaming]
      C --> D[PostgreSQL]
      C --> E[Elasticsearch]
  ```

**2. Request-Response**:
- **Pattern**: REST API.
- **Use Case**: Alert management dashboard.
- **Example**:
  ```mermaid
  sequenceDiagram
      participant Dashboard as React Dashboard
      participant API as Flask API
      participant DB as PostgreSQL

      Dashboard->>API: GET /alerts?vehicle_id=VH-1001
      API->>DB: SELECT * FROM anomalies WHERE vehicle_id = 'VH-1001'
      DB-->>API: [Alert1, Alert2]
      API-->>Dashboard: {data: [Alert1, Alert2]}
  ```

**3. Batch Processing**:
- **Pattern**: Spark batch jobs.
- **Use Case**: Daily anomaly aggregation.
- **Example**:
  ```python
  # Spark job to aggregate anomalies
  df = spark.read.jdbc(postgres_url, "anomalies")
  agg_df = df.groupBy("vehicle_id", "anomaly_type").agg(
      count("*").alias("count"),
      first("severity").alias("severity")
  )
  agg_df.write.jdbc(postgres_url, "daily_anomalies", mode="overwrite")
  ```

#### 5.2.3 Error Handling Strategies
**1. Retry Mechanisms**:
- **Exponential Backoff**: For transient errors (e.g., network timeouts).
- **Example**:
  ```python
  import time
  import random

  def retry_with_backoff(func, max_retries=3):
      for attempt in range(max_retries):
          try:
              return func()
          except Exception as e:
              if attempt == max_retries - 1:
                  raise
              sleep_time = (2 ** attempt) + random.uniform(0, 1)
              time.sleep(sleep_time)
  ```

**2. Circuit Breakers**:
- **Pattern**: Fail fast if a service is down.
- **Example** (using `pybreaker`):
  ```python
  from pybreaker import CircuitBreaker

  weather_breaker = CircuitBreaker(fail_max=3, reset_timeout=60)

  @weather_breaker
  def get_weather(lat, lon):
      response = requests.get(f"https://api.weather.com/v1/geocode/{lat}/{lon}/observations.json")
      response.raise_for_status()
      return response.json()
  ```

**3. Dead Letter Queues (DLQ)**:
- **Use Case**: Failed Kafka messages.
- **Example**:
  ```python
  # Spark Structured Streaming with DLQ
  df = spark.readStream.format("kafka").option("kafka.bootstrap.servers", "...").load()
  parsed_df = df.select(from_json(col("value").cast("string"), schema).alias("data"))

  # Write to main topic
  query = parsed_df.writeStream \
      .foreachBatch(lambda batch, _: batch.write.jdbc(postgres_url, "telemetry")) \
      .option("checkpointLocation", "/checkpoints/telemetry") \
      .start()

  # Write failures to DLQ
  parsed_df.filter("data IS NULL").writeStream \
      .format("kafka") \
      .option("topic", "telemetry-dlq") \
      .option("kafka.bootstrap.servers", "...") \
      .option("checkpointLocation", "/checkpoints/telemetry-dlq") \
      .start()
  ```

#### 5.2.4 Failover Mechanisms
**1. Kafka Failover**:
- **Setup**: Multi-AZ deployment with 3 brokers.
- **Failover**: Automatic leader election.
- **Recovery**: Reprocess messages from last committed offset.

**2. PostgreSQL Failover**:
- **Setup**: Multi-AZ RDS with 2 read replicas.
- **Failover**: Automatic promotion of standby.
- **Recovery**: Replay WAL logs.

**3. Spark Failover**:
- **Setup**: Checkpointing to HDFS.
- **Failover**: Restart job from last checkpoint.
- **Recovery**: Reprocess data from checkpoint.

**Example Spark Checkpointing**:
```python
# Enable checkpointing in Spark Structured Streaming
df.writeStream \
    .outputMode("append") \
    .format("jdbc") \
    .option("url", postgres_url) \
    .option("dbtable", "anomalies") \
    .option("checkpointLocation", "/checkpoints/anomalies") \
    .start()
```

---

## 6. Security & Compliance (100+ lines)

### 6.1 Authentication Mechanisms
#### 6.1.1 JWT Authentication
- **Flow**:
  1. User submits email/password to `/auth/login`.
  2. Server validates credentials against `users` table.
  3. Server generates JWT with user ID and role.
  4. Client includes JWT in `Authorization` header.
- **JWT Payload**:
  ```json
  {
      "sub": "user-12345",
      "role": "Fleet Manager",
      "iat": 1686850800,
      "exp": 1686937200
  }
  ```
- **Secret Key**: Stored in AWS Secrets Manager (rotated every 30 days).
- **Algorithm**: HS256.

**Example JWT Generation (Python)**:
```python
import jwt
import datetime

def generate_jwt(user_id, role):
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
```

#### 6.1.2 API Key Authentication
- **Use Case**: Service-to-service communication (e.g., Spark jobs).
- **Flow**:
  1. API key generated via `/auth/api-keys`.
  2. Key stored in `api_keys` table with `service_name` and `expiry`.
  3. Key included in `X-API-Key` header.
- **Example API Key Table**:
  ```sql
  CREATE TABLE api_keys (
      id SERIAL PRIMARY KEY,
      service_name VARCHAR(50) NOT NULL,
      key VARCHAR(64) UNIQUE NOT NULL,
      expiry TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

**Example API Key Validation**:
```python
def validate_api_key(api_key):
    query = "SELECT * FROM api_keys WHERE key = %s AND expiry > NOW()"
    cursor.execute(query, (api_key,))
    return cursor.fetchone() is not None
```

### 6.2 Authorization Model (RBAC)
#### 6.2.1 Role Definitions
| **Role**         | **Description**                                                                 | **Permissions**                                                                 |
|------------------|---------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| Fleet Manager    | Manages fleet operations; views and acknowledges alerts                        | `alerts:read`, `alerts:acknowledge`, `alerts:resolve`, `telemetry:read`        |
| Data Scientist   | Develops and maintains ML models                                                | `models:read`, `models:write`, `telemetry:read`, `anomalies:read`              |
| IT Admin         | Manages infrastructure and users                                               | All permissions                                                                |
| Driver           | Views own alerts and telemetry                                                 | `alerts:read` (own vehicle), `telemetry:read` (own vehicle)                    |
| Maintenance Tech | Views and resolves alerts for assigned vehicles                                | `alerts:read` (assigned vehicles), `alerts:resolve` (assigned vehicles)        |

#### 6.2.2 Permission Enforcement
**1. Middleware (Flask)**:
```python
from functools import wraps

def permission_required(permission):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            user_permissions = get_user_permissions_from_jwt()
            if permission not in user_permissions:
                return {"error": "Forbidden"}, 403
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Usage
@app.route("/alerts/<id>/resolve", methods=["POST"])
@permission_required("alerts:resolve")
def resolve_alert(id):
    ...
```

**2. PostgreSQL Row-Level Security (RLS)**:
```sql
-- Enable RLS on anomalies table
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Policy for Fleet Managers: can only see alerts for their fleet
CREATE POLICY fleet_manager_policy ON anomalies
    USING (vehicle_id IN (
        SELECT id FROM vehicles
        WHERE fleet_id = current_setting('app.current_fleet_id')
    ));

-- Policy for Drivers: can only see own alerts
CREATE POLICY driver_policy ON anomalies
    USING (vehicle_id IN (
        SELECT current_vehicle_id FROM users
        WHERE id = current_setting('app.current_user_id')
    ));
```

### 6.3 Data Encryption
#### 6.3.1 Encryption at Rest
| **Data**          | **Encryption Method**       | **Key Management**          |
|-------------------|-----------------------------|-----------------------------|
| PostgreSQL        | AES-256 (AWS RDS)           | AWS KMS                     |
| Elasticsearch     | AES-256 (AWS ES)            | AWS KMS                     |
| S3                | AES-256 (SSE-S3)            | AWS S3                      |
| EBS Volumes       | AES-256 (AWS EBS)           | AWS KMS                     |

**Example AWS KMS Policy**:
```json
{
    "Version": "2012-10-17",
    "Id": "key-policy-fms",
    "Statement": [
        {
            "Sid": "Enable IAM User Permissions",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow RDS to use the key",
            "Effect": "Allow",
            "Principal": {"Service": "rds.amazonaws.com"},
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        }
    ]
}
```

#### 6.3.2 Encryption in Transit
| **Component**     | **Protocol**       | **Cipher Suites**                          |
|-------------------|--------------------|--------------------------------------------|
| API (HTTPS)       | TLS 1.2+           | ECDHE-ECDSA-AES128-GCM-SHA256              |
| Kafka             | SSL                | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384      |
| PostgreSQL        | SSL                | ECDHE-RSA-AES256-GCM-SHA384                |
| Elasticsearch     | HTTPS              | TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384      |

**Example PostgreSQL SSL Configuration**:
```ini
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
```

### 6.4 Audit Logging
#### 6.4.1 Logged Events
| **Event**               | **Details Logged**                                                                 | **Retention** |
|-------------------------|------------------------------------------------------------------------------------|---------------|
| User login              | User ID, IP address, timestamp, user agent                                         | 1 year        |
| API request             | Endpoint, HTTP method, user ID, timestamp, status code, response time              | 1 year        |
| Anomaly detection       | Anomaly ID, vehicle ID, anomaly type, timestamp, confidence score                   | 2 years       |
| Alert acknowledgment    | Alert ID, user ID, timestamp, notes                                                | 2 years       |
| Alert resolution        | Alert ID, user ID, timestamp, notes                                                | 2 years       |
| Model retraining        | Model name, version, timestamp, accuracy before/after                              | 2 years       |
| Configuration changes   | User ID, timestamp, old value, new value                                           | 2 years       |

**Example Audit Log Entry**:
```json
{
    "event": "api_request",
    "timestamp": "2023-06-15T14:30:45Z",
    "user_id": "user-12345",
    "ip_address": "192.168.1.100",
    "endpoint": "/api/v1/alerts/VH-1001/resolve",
    "method": "POST",
    "status_code": 200,
    "response_time_ms": 120,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}
```

#### 6.4.2 Logging Infrastructure
- **Tools**: ELK Stack (Elasticsearch, Logstash, Kibana).
- **Data Flow**:
  ```mermaid
  graph LR
      A[Application] -->|Logs| B[Filebeat]
      B --> C[Logstash]
      C --> D[Elasticsearch]
      D --> E[Kibana]
  ```
- **Logstash Pipeline**:
  ```conf
  input {
      beats {
          port => 5044
      }
  }

  filter {
      json {
          source => "message"
      }
      date {
          match => ["timestamp", "ISO8601"]
      }
  }

  output {
      elasticsearch {
          hosts => ["https://elasticsearch:9200"]
          index => "fms-audit-logs-%{+YYYY.MM.dd}"
      }
  }
  ```

### 6.5 Compliance Requirements
#### 6.5.1 SOC2
| **Principle**       | **Requirement**                                                                 | **Implementation**                                                                 |
|---------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| Security            | Protect against unauthorized access                                            | RBAC, MFA, encryption, audit logging                                               |
| Availability        | System uptime >= 99.9%                                                         | Multi-AZ deployments, auto-scaling, monitoring                                     |
| Processing Integrity| Data processing is complete, accurate, and timely                              | Data validation, checksums, idempotent operations                                  |
| Confidentiality     | Protect confidential data                                                      | Encryption, access controls, data masking                                           |
| Privacy             | Collect, use, retain, and disclose personal data in accordance with privacy notice | GDPR compliance, data retention policies, user consent management                  |

**Example SOC2 Control**:
- **Control**: "All production changes must be reviewed and approved."
- **Implementation**:
  - GitHub pull requests require 2 approvals.
  - Changes deployed via CI/CD pipeline with manual approval gate.

#### 6.5.2 GDPR
| **Requirement**               | **Implementation**                                                                 |
|-------------------------------|------------------------------------------------------------------------------------|
| Right to Access               | `/users/{id}/data` endpoint to export user data                                    |
| Right to Erasure              | `/users/{id}/erase` endpoint to delete user data                                   |
| Data Portability              | Export data in JSON/CSV format                                                     |
| Consent Management            | Users must opt-in to data collection; `/consent` endpoint to manage preferences   |
| Data Protection Impact Assessment (DPIA) | Conducted for anomaly detection (low risk)                              |

**Example GDPR Data Export**:
```python
@app.route("/users/<user_id>/data", methods=["GET"])
def export_user_data(user_id):
    # Get user data from all tables
    user_data = {
        "user": get_user(user_id),
        "alerts": get_user_alerts(user_id),
        "telemetry": get_user_telemetry(user_id)
    }
    return jsonify(user_data)
```

#### 6.5.3 CCPA
| **Requirement**               | **Implementation**                                                                 |
|-------------------------------|------------------------------------------------------------------------------------|
| Right to Know                 | `/users/{id}/data` endpoint                                                        |
| Right to Delete               | `/users/{id}/erase` endpoint                                                       |
| Right to Opt-Out              | `/users/{id}/opt-out` endpoint to disable data collection                          |
| Do Not Sell My Data           | `/users/{id}/do-not-sell` endpoint                                                 |

### 6.6 Vulnerability Assessment
#### 6.6.1 OWASP Top 10 Risks
| **Risk**               | **Instances** | **CVSS** | **Mitigation**                                                                 |
|------------------------|---------------|----------|--------------------------------------------------------------------------------|
| Injection              | 3             | 9.8      | Use parameterized queries; input validation                                   |
| Broken Authentication  | 1             | 8.1      | JWT with short expiry; MFA                                                    |
| Sensitive Data Exposure| 2             | 7.5      | Encryption at rest and in transit; data masking                                |
| XML External Entities  | 1             | 8.2      | Disable DTD processing                                                        |
| Broken Access Control  | 4             | 8.8      | RBAC; row-level security                                                      |
| Security Misconfiguration | 4         | 6.5      | Regular audits; least privilege                                                |
| Cross-Site Scripting   | 2             | 6.1      | CSP headers; input sanitization                                               |
| Insecure Deserialization | 1         | 7.5      | Use safe deserialization libraries                                            |
| Using Components with Known Vulnerabilities | 5 | 7.5 | Dependency scanning (Dependabot); regular updates                             |
| Insufficient Logging   | 3             | 5.3      | Comprehensive audit logging; SIEM integration                                  |

#### 6.6.2 Penetration Testing Results
**Last Test**: 2023-05-15 (conducted by third-party)
**Findings**:
| **Finding**                          | **Severity** | **CVSS** | **Status**       | **Remediation**                                                                 |
|--------------------------------------|--------------|----------|------------------|---------------------------------------------------------------------------------|
| SQL injection in `/alerts` endpoint  | Critical     | 9.8      | Fixed            | Use parameterized queries                                                      |
| Missing CSP headers                  | Medium       | 6.1      | Fixed            | Added `Content-Security-Policy: default-src 'self'`                            |
| Weak JWT secret                      | High         | 8.1      | Fixed            | Rotated secret; increased length to 64 characters                              |
| Directory listing enabled            | Medium       | 5.3      | Fixed            | Disabled in Apache config                                                      |
| Outdated jQuery (v1.12.4)            | High         | 7.5      | Fixed            | Upgraded to v3.6.0                                                             |
| No rate limiting on `/auth/login`    | Medium       | 5.3      | Open             | Implement rate limiting (planned for Q3 2023)                                  |

**Example Remediation (SQL Injection)**:
```python
# Before: Vulnerable to SQL injection
cursor.execute(f"SELECT * FROM anomalies WHERE vehicle_id = '{vehicle_id}'")

# After: Parameterized query
cursor.execute("SELECT * FROM anomalies WHERE vehicle_id = %s", (vehicle_id,))
```

---

## 7. Performance Metrics (90+ lines)

### 7.1 Response Time Analysis
#### 7.1.1 API Response Times
| **Endpoint**                     | **Avg (ms)** | **P95 (ms)** | **P99 (ms)** | **Error Rate** | **Target** |
|----------------------------------|--------------|--------------|--------------|----------------|------------|
| `GET /alerts`                    | 450          | 1,200        | 2,500        | 0.8%           | <300ms     |
| `POST /alerts/{id}/acknowledge`  | 220          | 500          | 1,200        | 0.2%           | <200ms     |
| `GET /vehicles/{id}/telemetry`   | 1,800        | 3,500        | 6,200        | 1.5%           | <1,000ms   |
| `GET /auth/login`                | 150          | 300          | 500          | 0.1%           | <200ms     |

**Example Latency Breakdown (GET /alerts)**:
| **Component**         | **Time (ms)** | **% of Total** |
|-----------------------|---------------|----------------|
| Database query        | 1,800         | 40%            |
| Network (DB to API)   | 200           | 4%             |
| API processing        | 1,500         | 33%            |
| Network (API to client)| 1,000        | 22%            |
| **Total**             | **4,500**     | **100%**       |

#### 7.1.2 Database Query Performance
| **Query**                                                                 | **Avg Time (ms)** | **Calls/Day** | **Total Time/Day** | **Optimization Status** |
|---------------------------------------------------------------------------|-------------------|---------------|--------------------|-------------------------|
| `SELECT * FROM anomalies WHERE vehicle_id = ?`                            | 2,400             | 17,280        | 11.5 hours         | Needs index             |
| `SELECT * FROM anomalies WHERE resolved = FALSE`                          | 3,200             | 864           | 46 minutes         | Needs index             |
| `SELECT * FROM telemetry WHERE vehicle_id = ? AND timestamp > ?`         | 1,800             | 12,960        | 6.5 hours          | Needs composite index   |
| `INSERT INTO anomalies VALUES (...)`                                     | 45                | 432,000       | 5.4 hours          | Batch inserts           |
| `SELECT COUNT(*) FROM anomalies WHERE timestamp > NOW() - INTERVAL '7d'` | 1,200             | 1,440         | 29 minutes         | Needs index             |

**Example Query Optimization**:
```sql
-- Before: 2,400ms
EXPLAIN ANALYZE
SELECT * FROM anomalies WHERE vehicle_id = 'VH-1001';

-- After: Add index (50ms)
CREATE INDEX idx_anomalies_vehicle_id ON anomalies(vehicle_id);

-- After: 80ms
EXPLAIN ANALYZE
SELECT * FROM anomalies WHERE vehicle_id = 'VH-1001';
```

### 7.2 Throughput Measurements
#### 7.2.1 Kafka Throughput
| **Metric**               | **Value**       | **Target**  | **Bottleneck**               |
|--------------------------|-----------------|-------------|------------------------------|
| Messages/sec (ingest)    | 1,200           | 2,500       | Broker CPU (85% utilization) |
| Messages/sec (consume)   | 1,150           | 2,500       | Spark executor memory        |
| End-to-end latency       | 350ms           | <200ms      | Network hops                 |

**Kafka Topic Metrics**:
| **Topic**            | **Partitions** | **Replication Factor** | **Messages/Day** | **Avg Size/Message** |
|----------------------|----------------|------------------------|------------------|----------------------|
| `vehicle-telemetry`  | 6              | 2                      | 103,680,000      | 1.2 KB               |
| `anomalies`          | 3              | 2                      | 432,000          | 0.8 KB               |

#### 7.2.2 Spark Throughput
| **Job**                  | **Records/Day** | **Avg Time/Record** | **Total Time/Day** | **Bottleneck**               |
|--------------------------|-----------------|---------------------|--------------------|------------------------------|
| Feature Engineering      | 1,200,000       | 10.3ms              | 3.4 hours          | Data skew                    |
| Rule Engine              | 1,200,000       | 6.8ms               | 2.3 hours          | Python UDFs                  |
| ML Scoring               | 1,200,000       | 13ms                | 4.3 hours          | Model loading                |
| Anomaly Aggregation      | 8,000           | 725ms               | 1.6 hours          | PostgreSQL writes            |

**Example Spark Job Optimization**:
```python
# Before: Slow due to Python UDFs
df.withColumn("anomaly", check_high_rpm_udf(col("telemetry")))

# After: Use Spark SQL functions
df.withColumn(
    "anomaly",
    when(
        (col("engine_rpm") > 6000) & (col("speed") > 0),
        struct(
            lit("high_rpm").alias("anomaly_type"),
            lit("high").alias("severity")
        )
    )
)
```

### 7.3 Resource Utilization
#### 7.3.1 CPU Utilization
| **Component**     | **Avg CPU** | **Peak CPU** | **Target** | **Bottleneck**               |
|-------------------|-------------|--------------|------------|------------------------------|
| Kafka Brokers     | 65%         | 85%          | <70%       | Broker CPU                   |
| Spark Drivers     | 40%         | 75%          | <60%       | Driver memory                |
| Spark Executors   | 55%         | 90%          | <70%       | Executor memory              |
| PostgreSQL        | 30%         | 60%          | <50%       | Query optimization           |
| Elasticsearch     | 25%         | 45%          | <40%       | Indexing                     |

**Example CPU Spike (Spark Executor)**:
```
# Log entry showing OOM leading to CPU spike
23/06/15 14:30:45 ERROR Executor: Managed memory leak detected; size = 268435456 bytes, TID = 42
23/06/15 14:30:46 WARN TaskMemoryManager: Failed to allocate a page (1048576 bytes), try again.
23/06/15 14:30:47 ERROR Executor: Exception in task 42.0 in stage 12.0 (TID 42)
java.lang.OutOfMemoryError: Java heap space
```

#### 7.3.2 Memory Utilization
| **Component**     | **Avg Memory** | **Peak Memory** | **Target** | **Bottleneck**               |
|-------------------|----------------|-----------------|------------|------------------------------|
| Kafka Brokers     | 4.2 GB         | 5.8 GB          | <6 GB      | Heap size                    |
| Spark Drivers     | 12 GB          | 15 GB           | <14 GB     | Driver memory                |
| Spark Executors   | 28 GB          | 31 GB           | <30 GB     | Executor memory              |
| PostgreSQL        | 10 GB          | 14 GB           | <12 GB     | Shared buffers               |
| Elasticsearch     | 6 GB           | 8 GB            | <7 GB      | Heap size                    |

**Example Memory Optimization (Spark)**:
```python
# Before: OOM errors due to large broadcast variables
broadcast_var = spark.sparkContext.broadcast(large_model)

# After: Use shared filesystem (e.g., HDFS) instead
spark.sparkContext.addFile("hdfs:///models/large_model.pkl")
```

#### 7.3.3 Network Utilization
| **Component**     | **Avg Throughput** | **Peak Throughput** | **Target** | **Bottleneck**               |
|-------------------|--------------------|---------------------|------------|------------------------------|
| Kafka (ingest)    | 1.2 Gbps           | 2.1 Gbps            | <2 Gbps    | Network bandwidth            |
| Kafka (consume)   | 1.1 Gbps           | 1.9 Gbps            | <2 Gbps    | Spark network                |
| PostgreSQL        | 200 Mbps           | 450 Mbps            | <300 Mbps  | Database connections         |
| Elasticsearch     | 150 Mbps           | 300 Mbps            | <200 Mbps  | Indexing                     |

**Example Network Optimization**:
```python
# Before: High network traffic due to full telemetry data
df = spark.read.jdbc(postgres_url, "telemetry")

# After: Select only necessary columns
df = spark.read.jdbc(postgres_url, "telemetry", properties={"query": "SELECT vehicle_id, timestamp, engine_rpm, speed FROM telemetry"})
```

### 7.4 Bottleneck Identification
#### 7.4.1 Top 5 Bottlenecks
1. **PostgreSQL Query Performance**
   - **Issue**: Missing indexes on `anomalies(vehicle_id)` and `anomalies(resolved)`.
   - **Impact**: 11.5 hours/day wasted on slow queries.
   - **Solution**: Add indexes (see Section 7.1.2).

2. **Spark Data Skew**
   - **Issue**: 80% of anomalies come from 20% of vehicles.
   - **Impact**: Executor OOM errors; 30% longer job times.
   - **Solution**: Salting technique for skewed keys.
     ```python
     # Add salt to vehicle_id
     df = df.withColumn("salted_vehicle_id", concat(col("vehicle_id"), lit("_"), (rand() * 10).cast("int")))
     ```

3. **Python UDFs in Spark**
   - **Issue**: Rule engine uses Python UDFs, which are slow.
   - **Impact**: 2.3 hours/day wasted on UDF processing.
   - **Solution**: Replace with Spark SQL functions (see Section 7.2.2).

4. **Model Loading in Spark**
   - **Issue**: ML models loaded per task (1.2s overhead per task).
   - **Impact**: 4.3 hours/day wasted on model loading.
   - **Solution**: Cache models in driver memory.
     ```python
     # Cache model in driver
     model = joblib.load("isolation_forest_model.pkl")
     model_bc = spark.sparkContext.broadcast(model)

     # Use broadcast variable in tasks
     def score_anomaly(features):
         model = model_bc.value
         return model.decision_function([features])[0]
     ```

5. **API Network Latency**
   - **Issue**: 22% of API response time is network latency.
   - **Impact**: Poor user experience.
   - **Solution**: Implement CDN for static assets; use edge computing for API.

#### 7.4.2 Root Cause Analysis (RCA) Example
**Incident**: High API latency on `GET /alerts` (2023-06-10)
1. **Symptoms**:
   - P95 latency increased from 1,200ms to 5,200ms.
   - Dashboard timeouts.
2. **Timeline**:
   - 14:00: PostgreSQL CPU spiked to 95%.
   - 14:05: First user complaint.
   - 14:15: Incident declared.
   - 14:30: Identified slow query (`SELECT * FROM anomalies WHERE vehicle_id = ?`).
   - 14:45: Added index on `anomalies(vehicle_id)`.
   - 15:00: Latency returned to normal.
3. **Root Cause**:
   - Missing index on `anomalies(vehicle_id)`.
   - Query planner used sequential scan (1.2M rows).
4. **Corrective Actions**:
   - Add index on `anomalies(vehicle_id)`.
   - Add monitoring for slow queries.
   - Implement query timeouts.

### 7.5 Capacity Planning
#### 7.5.1 Current vs Projected Capacity
| **Resource**       | **Current Capacity** | **Current Usage** | **Projected Usage (12 months)** | **Gap** | **Action**                     |
|--------------------|----------------------|-------------------|---------------------------------|---------|--------------------------------|
| Kafka throughput   | 2,500 msg/s          | 1,200 msg/s       | 2,500 msg/s                     | 0       | Monitor                        |
| Spark executors    | 10 nodes             | 8 nodes           | 15 nodes                        | 5       | Add 5 nodes                    |
| PostgreSQL storage | 2 TB                 | 1.2 TB            | 3 TB                            | 1 TB    | Increase storage               |
| API requests       | 1,000/minute         | 600/minute        | 1,500/minute                    | 500     | Scale API servers              |
| Dashboard users    | 200 concurrent       | 150 concurrent    | 300 concurrent                  | 100     | Implement load balancing       |

#### 7.5.2 Scaling Strategies
1. **Kafka**:
   - **Vertical**: Increase broker instance size (m5.xlarge → m5.2xlarge).
   - **Horizontal**: Add more brokers (3 → 5).

2. **Spark**:
   - **Vertical**: Increase executor memory (32GB → 64GB).
   - **Horizontal**: Add more executors (10 → 15).
   - **Dynamic Allocation**: Enable dynamic allocation to scale with load.

3. **PostgreSQL**:
   - **Vertical**: Increase instance size (db.m5.2xlarge → db.m5.4xlarge).
   - **Horizontal**: Add read replicas (2 → 4).
   - **Partitioning**: Partition `telemetry` table by month.

4. **API**:
   - **Horizontal**: Add more API servers (2 → 4).
   - **Caching**: Implement Redis cache for frequent queries.

**Example Spark Dynamic Allocation**:
```python
# Enable dynamic allocation
spark.dynamicAllocation.enabled=true
spark.dynamicAllocation.minExecutors=5
spark.dynamicAllocation.maxExecutors=20
spark.dynamicAllocation.executorAllocationRatio=0.8
```

---

## 8. Operational Challenges (70+ lines)

### 8.1 Maintenance Burden
#### 8.1.1 Technical Debt Impact
| **Debt Type**          | **Impact**                                                                 | **Effort to Fix** | **Priority** |
|------------------------|----------------------------------------------------------------------------|-------------------|--------------|
| Hardcoded thresholds   | High false positives; inflexible for new vehicle types                     | 4 weeks           | High         |
| No unit tests          | Undetected regressions; slow development                                   | 8 weeks           | High         |
| Missing indexes        | Slow queries; poor user experience                                         | 2 weeks           | High         |
| Legacy code            | Hard to maintain; knowledge silos                                          | 12 weeks          | Medium       |
| No CI/CD               | Manual deployments; frequent outages                                       | 6 weeks           | High         |
| Poor documentation     | Onboarding takes 3+ months; tribal knowledge                               | 4 weeks           | Medium       |

**Example Maintenance Task**:
- **Task**: Update rule thresholds for new vehicle models.
- **Current Process**:
  1. Data scientist identifies new thresholds.
  2. Engineer manually updates Python files.
  3. Deploy to production (downtime: 30 minutes).
- **Pain Points**:
  - No rollback mechanism.
  - No testing for new thresholds.
  - Manual process prone to errors.

#### 8.1.2 On-Call Burden
| **Metric**               | **Value**       | **Target**  |
|--------------------------|-----------------|-------------|
| Incidents/month          | 18              | <10         |
| Avg resolution time      | 2.4 hours       | <1 hour     |
| Escalations/month        | 8               | <3          |
| On-call hours/month      | 120             | <80         |

**Top 5 Incident Types**:
| **Incident Type**         | **Count (Last 6 Months)** | **Avg Resolution Time** | **Root Cause**               |
|---------------------------|---------------------------|-------------------------|------------------------------|
| Spark job failures        | 22                        | 3.2 hours               | OOM errors                   |
| PostgreSQL slow queries   | 18                        | 1.8 hours               | Missing indexes              |
| Kafka consumer lag        | 12                        | 2.5 hours               | Spark backpressure           |
| API timeouts              | 10                        | 1.2 hours               | High load                    |
| Dashboard errors          | 8                         | 0.8 hours               | React state management       |

**Example Incident Report**:
```
Incident #2023-06-05-01
Title: Spark job OOM error
Severity: High
Start: 2023-06-05 14:30 UTC
End: 2023-06-05 17:45 UTC
Impact: Anomaly detection delayed by 3 hours
Root Cause: Data skew in vehicle telemetry (80% from 20% of vehicles)
Resolution:
1. Killed stuck Spark job.
2. Added salt to vehicle_id to distribute load.
3. Restarted job with increased executor memory (32GB → 64GB).
Follow-up:
- Implement data skew detection in monitoring.
- Add alert for OOM errors.
```

### 8.2 Support Ticket Analysis
#### 8.2.1 Ticket Breakdown
| **Category**          | **Count (Last 6 Months)** | **Avg Resolution Time** | **Trend**  |
|-----------------------|---------------------------|-------------------------|------------|
| False positives       | 124                       | 1.5 hours               | Increasing |
| Alerts not showing    | 89                        | 2.1 hours               | Stable     |
| Dashboard slow        | 62                        | 1.8 hours               | Increasing |
| API errors            | 45                        | 1.2 hours               | Stable     |
| Model accuracy        | 38                        | 3.4 hours               | Increasing |
| Mobile issues         | 22                        | 2.5 hours               | Stable     |

**Example Support Ticket**:
```
Ticket #45678
Subject: False positive for "prolonged idling"
Description: The system keeps alerting for "prolonged idling" for our refrigerated trucks, which need to idle to maintain temperature.
Steps to Reproduce:
1. Vehicle idles for >5 minutes (e.g., during delivery).
2. Alert fires: "Prolonged idling detected (300s)."
Expected: No alert for refrigerated trucks.
Actual: Alert fires.
Workaround: Manually mark as false positive.
Priority: High
Resolution:
- Added vehicle_type filter to idling rule.
- Deployed fix in 2.1 hours.
```

#### 8.2.2 User Pain Points
1. **Alert Fatigue**:
   - *Issue*: 200+ alerts/day overwhelm users.
   - *Impact*: 62% of alerts are ignored.
   - *User Quote*: "I spend more time filtering alerts than actually fixing issues."

2. **Lack of Context**:
   - *Issue*: Alerts like "High RPM detected" lack context.
   - *Impact*: Users spend 5+ minutes per alert researching root causes.
   - *User Quote*: "The system tells me there's a problem but not what to do about it."

3. **Poor Mobile Experience**:
   - *Issue*: Dashboard is not responsive on mobile.
   - *Impact*: Fleet managers can't access alerts on the go.
   - *User Quote*: "I need to see alerts on my phone, but the dashboard is unreadable."

4. **Slow Performance**:
   - *Issue*: Dashboard takes 3+ seconds to load.
   - *Impact*: Users avoid using the system.
   - *User Quote*: "I refresh the page and it just spins forever."

### 8.3 Incident History
#### 8.3.1 Major Incidents (Last 12 Months)
| **Date**       | **Duration** | **Impact**                              | **Root Cause**               | **Resolution**                     |
|----------------|--------------|-----------------------------------------|------------------------------|------------------------------------|
| 2023-05-10     | 4.5 hours    | Anomaly detection delayed               | Spark job OOM                | Increased executor memory          |
| 2023-03-15     | 3.2 hours    | Dashboard unavailable                   | PostgreSQL max connections   | Increased max_connections          |
| 2023-01-20     | 2.8 hours    | False positives spike                   | Model drift                 | Retrained models                   |
| 2022-11-05     | 6.1 hours    | Kafka consumer lag                      | Spark backpressure           | Scaled Spark cluster               |
| 2022-09-12     | 1.5 hours    | API timeouts                            | High load                    | Scaled API servers                 |

**Example Postmortem (2023-05-10)**:
```
Postmortem: Spark Job OOM Error
Date: 2023-05-10
Duration: 4.5 hours
Impact: Anomaly detection delayed by 4.5 hours; 1,200 alerts missed.

Timeline:
- 14:30: Spark job fails with OOM error.
- 14:35: On-call engineer paged.
- 14:45: Engineer identifies data skew (80% of data from 20% of vehicles).
- 15:00: Attempt to restart job with same configuration (fails again).
- 15:30: Add salt to vehicle_id to distribute load.
- 16:00: Restart job with increased executor memory (32GB → 64GB).
- 17:45: Job completes successfully.

Root Cause:
- Data skew in vehicle telemetry (80% of anomalies from 20% of vehicles).
- No monitoring for data skew.
- Spark job not configured for dynamic scaling.

Corrective Actions:
1. Implement data skew detection in monitoring (ETA: 2023-06-15).
2. Add alert for OOM errors (ETA: 2023-06-01).
3. Document data skew mitigation strategies (ETA: 2023-05-20).
4. Review Spark configuration for dynamic allocation (ETA: 2023-06-30).
```

### 8.4 Change Management Issues
#### 8.4.1 Change Failure Rate
| **Change Type**       | **Count (Last 6 Months)** | **Failures** | **Failure Rate** | **Avg Downtime** |
|-----------------------|---------------------------|--------------|------------------|------------------|
| Model updates         | 8                         | 3            | 37.5%            | 1.2 hours        |
| Rule updates          | 12                        | 2            | 16.7%            | 0.8 hours        |
| Database changes      | 5                         | 1            | 20%              | 2.1 hours        |
| Infrastructure        | 10                        | 1            | 10%              | 1.5 hours        |
| **Total**             | **35**                    | **7**        | **20%**          | **1.3 hours**    |

**Example Failed Change**:
```
Change Request #2023-04-15-01
Description: Update high RPM threshold from 6000 to 6500 for trucks.
Change Type: Rule update
Planned Start: 2023-04-15 02:00 UTC
Planned End: 2023-04-15 02:30 UTC
Actual End: 2023-04-15 04:15 UTC (1.45 hours over)
Impact: Increased false negatives for high RPM alerts.
Root Cause:
- Threshold update not tested with truck telemetry data.
- No rollback plan.
Corrective Actions:
1. Add automated testing for rule changes (ETA: 2023-05-01).
2. Implement feature flags for rule thresholds (ETA: 2023-05-15).
3. Document rollback procedures (ETA: 2023-04-20).
```

#### 8.4.2 Change Management Process
**Current Process**:
1. **Request**: User submits change request via email.
2. **Review**: Team lead reviews request (avg: 2 days).
3. **Approval**: Change Advisory Board (CAB) approves (avg: 3 days).
4. **Implementation**: Engineer implements change (avg: 1 day).
5. **Testing**: Manual testing (avg: 0.5 days).
6. **Deployment**: Deploy to production (downtime: 30 minutes).

**Pain Points**:
- **Slow Approval**: CAB meets weekly; changes wait 3+ days for approval.
- **No Automated Testing**: Manual testing is error-prone.
- **No Rollback Plan**: Failed changes require manual rollback.
- **No Staging Environment**: Changes tested in production.

**Proposed Improvements**:
1. **Automated Testing**:
   - Add unit tests for rules and models.
   - Implement integration tests for API endpoints.
2. **Feature Flags**:
   - Use feature flags for rule thresholds.
   - Example:
     ```python
     # config.py
     RULE_THRESHOLDS = {
         "high_rpm": {
             "default": 6000,
             "truck": 6500,  # Feature flag
             "sedan": 5800   # Feature flag
         }
     }
     ```
3. **Blue-Green Deployments**:
   - Deploy changes to a subset of users first.
   - Example:
     ```python
     # Flask blue-green deployment
     @app.route("/alerts")
     def get_alerts():
         if request.headers.get("X-User-Group") == "beta":
             return get_alerts_v2()  # New version
         else:
             return get_alerts_v1()  # Old version
     ```
4. **Faster Approvals**:
   - Implement automated approvals for low-risk changes.
   - Example:
     ```python
     # GitHub Action for automated approvals
     name: Auto-approve low-risk changes
     on: pull_request
     jobs:
       auto-approve:
         runs-on: ubuntu-latest
         steps:
           - name: Auto-approve
             if: contains(github.event.pull_request.labels.*.name, 'low-risk')
             uses: hmarr/auto-approve-action@v2
     ```

### 8.5 Training Requirements
#### 8.5.1 Skill Gaps
| **Role**         | **Skill Gap**                          | **Training Needed**                     | **Priority** |
|------------------|----------------------------------------|-----------------------------------------|--------------|
| Fleet Managers   | Interpreting alerts                    | Alert prioritization and triage         | High         |
| Data Scientists  | Model drift detection                  | Continuous monitoring and retraining    | High         |
| IT Operations    | Spark tuning                           | Performance optimization                | High         |
| Developers       | Secure coding practices                | OWASP Top 10, input validation          | Medium       |
| Maintenance Techs| Using the dashboard                    | Dashboard navigation and alert resolution | Medium       |

#### 8.5.2 Training Plan
| **Training**                     | **Audience**          | **Format**          | **Duration** | **Frequency** | **Owner**      |
|----------------------------------|-----------------------|---------------------|--------------|---------------|----------------|
| Alert Triage                     | Fleet Managers        | Workshop            | 2 hours      | Quarterly     | Fleet Ops      |
| Model Drift Detection            | Data Scientists       | Online course       | 4 hours      | Biannual      | Data Science   |
| Spark Performance Tuning         | IT Operations         | Hands-on lab        | 3 hours      | Biannual      | IT Ops         |
| Secure Coding                    | Developers            | Workshop            | 2 hours      | Quarterly     | Security Team  |
| Dashboard Navigation             | Maintenance Techs     | Video tutorial      | 1 hour       | On-demand     | Support Team   |

**Example Training Material**:
```markdown
# Alert Triage Training
## Module 1: Understanding Alert Severity
- **Critical**: Immediate action required (e.g., engine failure).
  - Example: "Engine temperature > 120°C."
  - Action: Pull vehicle over immediately.
- **High**: Action within 24 hours (e.g., high RPM).
  - Example: "RPM > 6000 for >5s."
  - Action: Schedule engine inspection.
- **Medium**: Monitor (e.g., minor speeding).
  - Example: "Speed > 75 mph for 10s."
  - Action: Review with driver.
- **Low**: Informational (e.g., idling).
  - Example: "Idling > 5 minutes."
  - Action: Note for driver coaching.

## Module 2: False Positive Identification
- **Refrigerated Trucks**: Idling is normal for temperature control.
- **Urban Delivery**: Frequent stops are expected.
- **New Vehicles**: May have different baselines.
- **Checklist**:
  1. Is the vehicle type known for this behavior?
  2. Is the alert recurring for the same vehicle?
  3. Does the alert lack context (e.g., no weather data)?
```

---

## 9. Cost Analysis (60+ lines)

### 9.1 Infrastructure Costs
#### 9.1.1 AWS Cost Breakdown (Monthly)
| **Service**          | **Instance Type** | **Count** | **Cost/Instance** | **Total Cost** | **% of Total** |
|----------------------|-------------------|-----------|-------------------|----------------|----------------|
| EC2 (Kafka)          | m5.xlarge         | 3         | $180              | $540           | 6.5%           |
| EC2 (Spark)          | r5.2xlarge        | 10        | $520              | $5,200         | 62.4%          |
| RDS (PostgreSQL)     | db.m5.2xlarge     | 1         | $600              | $600           | 7.2%           |
| Elasticsearch        | m5.xlarge         | 3         | $200              | $600           | 7.2%           |
| S3                   | -                 | -         | -                 | $120           | 1.4%           |
| CloudFront           | -                 | -         | -                 | $80            | 1.0%           |
| ECS (Alerting)       | t3.medium         | 2         | $40               | $80            | 1.0%           |
| **Total**            |                   |           |                   | **$7,220**     | **100%**       |

**Cost Optimization Opportunities**:
1. **Spark Auto-Scaling**:
   - *Current*: Fixed 10-node cluster ($5,200/month).
   - *Optimized*: Use dynamic allocation to scale down to 5 nodes off-peak ($2,600/month).
   - *Savings*: $2,600/month (50%).

2. **PostgreSQL Reserved Instances**:
   - *Current*: On-demand ($600/month).
   - *Optimized*: 1-year reserved instance ($360/month).
   - *Savings*: $240/month (40%).

3. **Kafka Spot Instances**:
   - *Current*: On-demand ($540/month).
   - *Optimized*: Use spot instances for 2 brokers ($270/month).
   - *Savings*: $270/month (50%).

**Example Cost Optimization (Spark)**:
```python
# Enable dynamic allocation in Spark
spark.dynamicAllocation.enabled=true
spark.dynamicAllocation.minExecutors=5
spark.dynamicAllocation.maxExecutors=20
spark.dynamicAllocation.executorAllocationRatio=0.8
```

### 9.2 Operational Expenses
#### 9.2.1 Labor Costs
| **Role**            | **Count** | **Avg Salary** | **Total Cost/Month** | **% of Total** |
|---------------------|-----------|----------------|----------------------|----------------|
| Data Scientists     | 2         | $12,000        | $24,000              | 48%            |
| DevOps Engineers    | 3         | $11,000        | $33,000              | 66%            |
| Software Engineers  | 4         | $10,000        | $40,000              | 80%            |
| Support Engineers   | 2         | $8,000         | $16,000              | 32%            |
| **Total**           | **11**    |                | **$113,000**         | **226%**       |

**Note**: Labor costs are shared across multiple systems; only 40% allocated to ADM.

#### 9.2.2 Third-Party Services
| **Service**          | **Cost/Month** | **Usage**                     | **Cost/Unit**       |
|----------------------|----------------|-------------------------------|---------------------|
| AWS IoT Core         | $600           | 120M messages                 | $5 per million      |
| Google Maps API      | $150           | 300K requests                 | $0.50 per 1,000     |
| Twilio               | $225           | 30,000 SMS                    | $0.0075 per SMS     |
| SendGrid             | $15            | 50,000 emails                 | $14.95/month        |
| **Total**            | **$990**       |                               |                     |

### 9.3 License Fees
| **Software**         | **License Type** | **Cost/Year** | **Cost/Month** |
|----------------------|------------------|---------------|----------------|
| PostgreSQL           | Open-source      | $0            | $0             |
| Elasticsearch        | Open-source      | $0            | $0             |
| Apache Spark         | Open-source      | $0            | $0             |
| React                | Open-source      | $0            | $0             |
| Scikit-learn         | Open-source      | $0            | $0             |
| **Total**            |                  | **$0**        | **$0**         |

### 9.4 Support Costs
| **Support Type**     | **Cost/Month** | **Details**                                                                 |
|----------------------|----------------|-----------------------------------------------------------------------------|
| AWS Support          | $150           | Business support plan                                                      |
| Datadog              | $200           | Monitoring and alerting                                                    |
| PagerDuty            | $100           | On-call rotations                                                          |
| **Total**            | **$450**       |                                                                             |

### 9.5 Total Cost of Ownership (TCO)
| **Category**         | **Cost/Month** | **% of Total** |
|----------------------|----------------|----------------|
| Infrastructure       | $7,220         | 36.1%          |
| Labor                | $45,200        | 71.6%          |
| Third-Party Services | $990           | 4.9%           |
| Support              | $450           | 2.3%           |
| **Total**            | **$53,860**    | **100%**       |

**Annual TCO**: $646,320

**Cost per Vehicle/Month**:
- **Current**: $53,860 / 12,500 vehicles = **$4.31/vehicle/month**
- **Target**: <$3.00/vehicle/month

**Cost Optimization Roadmap**:
| **Initiative**               | **Savings/Month** | **Effort** | **Timeline** |
|------------------------------|-------------------|------------|--------------|
| Spark auto-scaling           | $2,600            | 4 weeks    | Q3 2023      |
| PostgreSQL reserved instance | $240              | 1 week     | Q3 2023      |
| Kafka spot instances         | $270              | 2 weeks    | Q3 2023      |
| Reduce false positives       | $1,200            | 8 weeks    | Q4 2023      |
| **