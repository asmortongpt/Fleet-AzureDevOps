# AI Predictive Maintenance Implementation Guide

**Priority:** P2 - Strategic Initiative
**Status:** Implementation Ready
**Last Updated:** November 16, 2025

## Overview

### Business Value
- Reduce unscheduled downtime by 40-50%
- Extend vehicle lifespan through proactive maintenance
- Lower maintenance costs through early intervention
- Improve fleet productivity and availability
- Enhance customer satisfaction with reliable service
- Competitive differentiation for premium customers

### Technical Complexity
- **High:** Requires ML expertise, data science pipeline, advanced analytics
- Dependent on having comprehensive vehicle telemetry data
- Requires historical maintenance records for training
- Ongoing model refinement and retraining required

### Key Dependencies
- Comprehensive vehicle telemetry (GPS tracking, OBD-II data)
- Historical maintenance records and cost data
- Machine learning infrastructure (Azure ML or similar)
- Data science expertise
- Prediction API deployment

### Timeline Estimate
- **Phase 1 (Data Collection & Preparation):** 3-4 weeks
- **Phase 2 (Feature Engineering):** 2-3 weeks
- **Phase 3 (Model Development):** 3-4 weeks
- **Phase 4 (API Development & Integration):** 2-3 weeks
- **Phase 5 (Testing & Validation):** 2-3 weeks
- **Phase 6 (Deployment & Monitoring):** 1-2 weeks
- **Total:** 13-19 weeks

---

## Data Requirements

### Vehicle Telemetry Data

```typescript
interface VehicleTelemetryRecord {
  // Identification
  vehicleId: string;
  timestamp: ISO8601;

  // Engine & Fluid Metrics
  engineHours: number;
  mileage: number;
  engineOilPressure: number; // PSI
  engineCoolantTemp: number; // Celsius
  engineOilTemp: number; // Celsius
  batteryVoltage: number; // Volts
  fuelConsumption: number; // L/hour
  engineRPM: number;
  engineLoad: number; // Percentage

  // Transmission & Drive
  transmissionFluidTemp: number; // Celsius
  gearPosition: string;
  accelerationEvents: number;
  hardBrakingEvents: number;
  cornering: number; // G-force

  // Chassis & Suspension
  brakeFluidLevel: number; // Percentage
  brakePadWear: number; // Percentage
  tiresRemaining: number; // Percentage
  suspension: {
    height: number; // mm
    firmness: number; // PSI
  };

  // Environmental
  ambientTemp: number; // Celsius
  humidity: number; // Percentage
  weatherCondition: string;

  // Driving Behavior
  idleTime: number; // hours
  averageSpeed: number; // km/h
  maxSpeed: number; // km/h
  roughDriving: boolean;
}
```

### Historical Maintenance Data

```typescript
interface MaintenanceRecord {
  vehicleId: string;
  maintenanceDate: Date;
  maintenanceType: 'preventive' | 'corrective' | 'emergency';
  component: string;
  description: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  downtime: number; // minutes
  failureMode?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  repairNotes?: string;
  technician: string;
  mileage: number;
  engineHours: number;
}
```

### Data Quality Requirements

- **Minimum Records:** 500+ maintenance records per component type
- **Time Range:** Minimum 24 months of historical data
- **Completeness:** > 95% of required fields populated
- **Accuracy:** Validated against source systems
- **Frequency:** Real-time telemetry preferred, daily minimum

---

## Feature Engineering Approach

### Derived Features (Time-based)

```python
import pandas as pd
import numpy as np
from datetime import timedelta

class FeatureEngineer:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def engineer_features(self) -> pd.DataFrame:
        features = self.df.copy()

        # Degradation trends (7-day rolling)
        features['oil_pressure_trend_7d'] = (
            features['engineOilPressure']
            .rolling(window=7, min_periods=1)
            .apply(self.trend_slope)
        )

        # Rate of change
        features['temp_change_rate'] = (
            features['engineCoolantTemp'].diff().rolling(window=24).mean()
        )

        # Cyclical features
        features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
        features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
        features['day_sin'] = np.sin(2 * np.pi * features['day_of_year'] / 365)
        features['day_cos'] = np.cos(2 * np.pi * features['day_of_year'] / 365)

        # Interaction features
        features['load_speed_interaction'] = (
            features['engineLoad'] * features['averageSpeed']
        )
        features['temp_humidity_interaction'] = (
            features['engineTemp'] * features['humidity']
        )

        # Deviation from normal
        features['oil_pressure_zscore'] = (
            (features['engineOilPressure'] - features['engineOilPressure'].mean()) /
            features['engineOilPressure'].std()
        )

        return features

    @staticmethod
    def trend_slope(values):
        x = np.arange(len(values))
        if len(values) < 2:
            return 0
        return np.polyfit(x, values, 1)[0]
```

### Domain-Specific Features

```python
class DomainFeatureEngineer:
    """Domain-specific features based on mechanical knowledge"""

    @staticmethod
    def calculate_oil_degradation(
        oil_pressure: float,
        oil_temp: float,
        engine_hours: float,
        mileage: float
    ) -> float:
        """Calculate oil degradation score (0-100)"""
        # Oil pressure degradation
        pressure_score = max(0, (50 - oil_pressure) / 50) * 40
        # Temperature effects
        temp_score = (oil_temp - 80) / 40 * 30 if oil_temp > 80 else 0
        # Usage hours
        usage_score = min(engine_hours / 5000, 1) * 30
        return min(pressure_score + temp_score + usage_score, 100)

    @staticmethod
    def calculate_brake_wear_rate(
        brake_events: int,
        hard_braking_count: int,
        vehicle_weight: float
    ) -> float:
        """Estimate brake wear rate (mm per 1000 km)"""
        normal_wear = brake_events * 0.01
        aggressive_wear = hard_braking_count * 0.1
        weight_factor = vehicle_weight / 3000
        return (normal_wear + aggressive_wear) * weight_factor

    @staticmethod
    def calculate_tire_stress_index(
        speed: float,
        load_percent: float,
        temp: float,
        roughness: int
    ) -> float:
        """Calculate cumulative tire stress"""
        speed_factor = (speed / 100) ** 2
        load_factor = load_percent / 100
        temp_factor = max(0, (temp - 60) / 40)  # Optimal 60°C
        roughness_factor = roughness * 0.01
        return speed_factor + load_factor + temp_factor + roughness_factor

    @staticmethod
    def calculate_engine_health_index(
        oil_pressure: float,
        oil_temp: float,
        coolant_temp: float,
        battery_voltage: float,
        fuel_consumption: float,
        baseline_consumption: float
    ) -> float:
        """Composite engine health score (0-100)"""
        health = 100

        # Oil pressure penalty
        if oil_pressure < 40:
            health -= (40 - oil_pressure) * 2
        elif oil_pressure > 60:
            health -= (oil_pressure - 60) * 1

        # Temperature penalties
        if oil_temp > 120:
            health -= (oil_temp - 120) * 0.5
        if coolant_temp > 105:
            health -= (coolant_temp - 105) * 0.5

        # Battery voltage
        if battery_voltage < 12:
            health -= (12 - battery_voltage) * 5

        # Fuel consumption increase
        consumption_ratio = fuel_consumption / baseline_consumption
        if consumption_ratio > 1.1:
            health -= (consumption_ratio - 1.1) * 50

        return max(health, 0)
```

---

## Model Training Pipeline

### Data Preparation

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.imbalance import SMOTE

class DataPipeline:
    def __init__(self, data_source):
        self.data_source = data_source
        self.scaler = RobustScaler()
        self.feature_engineer = FeatureEngineer()

    def prepare_training_data(self, look_back_months=24):
        """Prepare data for model training"""

        # Load historical data
        df = self.data_source.get_maintenance_data(months=look_back_months)

        # Feature engineering
        features = self.feature_engineer.engineer_features(df)

        # Create target variable
        # Days until next failure
        features['days_until_maintenance'] = (
            features['next_maintenance_date'] - features['date']
        ).dt.days

        # Binary target: maintenance needed in next 30 days
        features['maintenance_needed_30d'] = (
            features['days_until_maintenance'] <= 30
        ).astype(int)

        # Handle missing values
        features = features.fillna(features.mean())

        # Remove outliers (3 sigma)
        numeric_cols = features.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            mean = features[col].mean()
            std = features[col].std()
            features = features[
                (features[col] <= mean + 3 * std) &
                (features[col] >= mean - 3 * std)
            ]

        # Split features and target
        feature_cols = [col for col in features.columns
                       if col not in ['maintenance_needed_30d', 'target']]
        X = features[feature_cols]
        y = features['maintenance_needed_30d']

        # Handle class imbalance
        smote = SMOTE(random_state=42)
        X_balanced, y_balanced = smote.fit_resample(X, y)

        # Scale features
        X_scaled = self.scaler.fit_transform(X_balanced)

        return X_scaled, y_balanced, feature_cols
```

### Model Development

```python
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score, precision_recall_curve, confusion_matrix,
    f1_score, precision_score, recall_score
)

class PredictiveMaintenanceModel:
    def __init__(self):
        self.model = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            class_weight='balanced',
            eval_metric='logloss'
        )
        self.feature_importance = {}

    def train(self, X, y, test_size=0.2):
        """Train the predictive maintenance model"""

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        # Train model
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False,
            early_stopping_rounds=10
        )

        # Get feature importance
        self.feature_importance = dict(
            zip(feature_names, self.model.feature_importances_)
        )

        # Evaluate
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        metrics = self.evaluate(y_test, y_pred_proba)

        return metrics

    def evaluate(self, y_true, y_pred_proba):
        """Evaluate model performance"""

        y_pred = (y_pred_proba >= 0.5).astype(int)

        # Calculate metrics
        roc_auc = roc_auc_score(y_true, y_pred_proba)
        f1 = f1_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)

        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

        return {
            'roc_auc': roc_auc,
            'f1': f1,
            'precision': precision,
            'recall': recall,
            'specificity': specificity,
            'true_positives': int(tp),
            'false_positives': int(fp),
            'true_negatives': int(tn),
            'false_negatives': int(fn)
        }

    def get_feature_importance(self, top_n=20):
        """Get top N important features"""
        sorted_features = sorted(
            self.feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        return dict(sorted_features[:top_n])
```

### Ensemble Approach

```python
from sklearn.ensemble import VotingClassifier

class EnsembleModel:
    """Ensemble of multiple models for robust predictions"""

    def __init__(self):
        self.models = {
            'xgboost': XGBClassifier(n_estimators=200, max_depth=8),
            'gradient_boost': GradientBoostingClassifier(n_estimators=200),
            'random_forest': RandomForestClassifier(n_estimators=200)
        }

        self.ensemble = VotingClassifier(
            estimators=list(self.models.items()),
            voting='soft',
            weights=[0.5, 0.3, 0.2]  # Weight based on historical performance
        )

    def train(self, X, y):
        """Train ensemble model"""
        self.ensemble.fit(X, y)

    def predict(self, X):
        """Get ensemble predictions"""
        return self.ensemble.predict_proba(X)
```

---

## Model Evaluation Metrics

### Performance Benchmarks

| Metric | Target | Rationale |
|--------|--------|-----------|
| **ROC-AUC** | > 0.85 | Discriminative ability |
| **Precision** | > 0.80 | Minimize false alarms |
| **Recall** | > 0.75 | Catch real failures |
| **F1 Score** | > 0.77 | Balance precision/recall |
| **Specificity** | > 0.85 | True negative rate |

### Business Metrics

```python
class BusinessMetrics:
    @staticmethod
    def calculate_maintenance_cost_impact(
        prevented_breakdowns: int,
        avg_emergency_cost: float,
        predicted_maintenance_cost: float
    ) -> dict:
        """Calculate financial impact of predictions"""

        saved_costs = prevented_breakdowns * avg_emergency_cost
        actual_maintenance = prevented_breakdowns * predicted_maintenance_cost

        return {
            'prevented_breakdowns': prevented_breakdowns,
            'emergency_costs_avoided': saved_costs,
            'proactive_maintenance_cost': actual_maintenance,
            'net_savings': saved_costs - actual_maintenance,
            'roi': (saved_costs - actual_maintenance) / actual_maintenance if actual_maintenance > 0 else 0
        }

    @staticmethod
    def calculate_availability_impact(
        prevented_downtime_hours: float,
        revenue_per_hour: float
    ) -> float:
        """Calculate revenue impact from improved availability"""
        return prevented_downtime_hours * revenue_per_hour
```

---

## API Specification

### Prediction Endpoint

```typescript
// POST /api/v1/predictions/maintenance

interface MaintenanceRiskRequest {
  vehicleIds?: string[];
  startDate?: ISO8601;
  endDate?: ISO8601;
  predictDays?: number; // Default: 30
  includeExplanation?: boolean;
}

interface MaintenanceRiskResponse {
  predictions: Array<{
    vehicleId: string;
    timestamp: ISO8601;
    riskScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    daysUntilFailure: number;
    failureProbability: number; // 0-1
    maintenanceType: string; // e.g., "oil_change", "brake_service"
    components: Array<{
      component: string;
      healthScore: number; // 0-100
      estimatedLifeRemaining: number; // days
      priority: number; // 1-5
    }>;
    recommendedAction: string;
    estimatedCost: number;
    explanation?: {
      topFactors: Array<{
        factor: string;
        contribution: number;
      }>;
      recentTrends: Array<{
        metric: string;
        trend: 'improving' | 'stable' | 'degrading';
        rate: number;
      }>;
    };
  }>;
}
```

### Batch Prediction

```typescript
// POST /api/v1/predictions/maintenance/batch

interface BatchPredictionRequest {
  vehicleIds: string[];
  predictionHorizon: number; // 30, 60, 90 days
  includeAnalysis: boolean;
  outputFormat: 'json' | 'csv';
}

interface BatchPredictionResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed';
  estimatedCompletionTime?: ISO8601;
  downloadUrl?: string;
}
```

### Real-time Health Check

```typescript
// GET /api/v1/vehicles/:vehicleId/health

interface VehicleHealthResponse {
  vehicleId: string;
  overallHealth: number; // 0-100
  timestamp: ISO8601;
  components: Array<{
    component: string;
    health: number;
    status: 'good' | 'caution' | 'critical';
    lastUpdated: ISO8601;
  }>;
  nextScheduledMaintenance?: {
    type: string;
    estimatedDate: ISO8601;
    estimatedMileage: number;
  };
  alerts: Array<{
    severity: 'warning' | 'critical';
    message: string;
    action: string;
  }>;
}
```

---

## Deployment Strategy (Azure ML)

### Model Deployment

```python
# Deploy model to Azure ML
from azureml.core import Workspace, Model
from azureml.core.webservice import AciWebservice, Webservice
from azureml.core.model import InferenceConfig

class AzureMLDeployment:
    def __init__(self, workspace: Workspace):
        self.ws = workspace

    def register_model(self, model_path, model_name='predictive-maintenance'):
        """Register trained model"""
        return Model.register(
            workspace=self.ws,
            model_path=model_path,
            model_name=model_name,
            tags={'type': 'maintenance_prediction'}
        )

    def deploy_model(self, model: Model, service_name='maintenance-predictor'):
        """Deploy model as web service"""

        # Create inference config
        inference_config = InferenceConfig(
            entry_script='score.py',
            environment=self.create_environment()
        )

        # Deploy to Azure Container Instances (dev/test)
        deployment_config = AciWebservice.deploy_configuration(
            cpu_cores=2,
            memory_gb=4
        )

        service = Model.deploy(
            workspace=self.ws,
            name=service_name,
            models=[model],
            inference_config=inference_config,
            deployment_config=deployment_config
        )

        service.wait_for_deployment(show_output=True)
        return service

    def create_environment(self):
        """Create Python environment with dependencies"""
        from azureml.core.environment import Environment
        from azureml.core.conda_dependencies import CondaDependencies

        env = Environment('maintenance-env')
        conda_dep = CondaDependencies()
        conda_dep.add_conda_package('scikit-learn')
        conda_dep.add_conda_package('xgboost')
        conda_dep.add_conda_package('pandas')
        conda_dep.add_pip_package('numpy')

        env.python.conda_dependencies = conda_dep
        return env
```

### Scoring Script

```python
# score.py - Azure ML scoring script
import json
import numpy as np
import joblib
from azureml.core.model import Model

def init():
    global model
    model_path = Model.get_model_path('predictive-maintenance')
    model = joblib.load(model_path)

def run(raw_data):
    try:
        data = json.loads(raw_data)
        X = np.array(data['features'])

        # Make predictions
        predictions = model.predict_proba(X)
        risk_scores = predictions[:, 1]

        return {
            'risk_scores': risk_scores.tolist(),
            'success': True
        }
    except Exception as e:
        return {
            'error': str(e),
            'success': False
        }
```

---

## Monitoring & Retraining Strategy

### Model Monitoring

```python
class ModelMonitoring:
    def __init__(self):
        self.performance_history = []

    def log_prediction(self, prediction_id, vehicle_id, risk_score, prediction_date):
        """Log prediction for monitoring"""
        self.performance_history.append({
            'prediction_id': prediction_id,
            'vehicle_id': vehicle_id,
            'risk_score': risk_score,
            'prediction_date': prediction_date,
            'actual_maintenance_date': None,
            'was_accurate': None
        })

    def update_with_actual_outcome(self, prediction_id, actual_maintenance_date):
        """Update with real maintenance outcome"""
        for record in self.performance_history:
            if record['prediction_id'] == prediction_id:
                record['actual_maintenance_date'] = actual_maintenance_date
                # Check if prediction was accurate (within 30 days)
                days_diff = (
                    (actual_maintenance_date - record['prediction_date']).days
                )
                record['was_accurate'] = 0 <= days_diff <= 30
                break

    def calculate_model_drift(self, recent_predictions, lookback_days=30):
        """Detect model drift"""
        recent = [
            p for p in self.performance_history
            if (datetime.now() - p['prediction_date']).days <= lookback_days
        ]

        if not recent:
            return {'drift_detected': False}

        accuracy = sum(p['was_accurate'] for p in recent if p['was_accurate'] is not None) / len(recent)

        return {
            'drift_detected': accuracy < 0.75,  # Accuracy below 75% threshold
            'current_accuracy': accuracy,
            'predictions_evaluated': len(recent)
        }

    def trigger_retraining(self):
        """Trigger model retraining if drift detected"""
        drift_metrics = self.calculate_model_drift()
        if drift_metrics['drift_detected']:
            return True
        return False
```

### Retraining Pipeline

```python
class RetrainingPipeline:
    def __init__(self):
        self.retraining_frequency = 7  # Retrain weekly
        self.last_retraining_date = None

    async def check_and_retrain(self):
        """Scheduled retraining check"""
        if self.should_retrain():
            await self.retrain_model()

    def should_retrain(self):
        """Determine if retraining is needed"""
        # Check schedule
        if self.last_retraining_date:
            days_since_training = (
                datetime.now() - self.last_retraining_date
            ).days
            if days_since_training < self.retraining_frequency:
                return False

        # Check model performance
        drift_metrics = monitor.calculate_model_drift()
        if drift_metrics['drift_detected']:
            return True

        return True  # Weekly retrain regardless

    async def retrain_model(self):
        """Execute retraining process"""

        # Get fresh data
        new_data = await self.fetch_recent_data(days=90)

        # Prepare features
        X, y, feature_cols = pipeline.prepare_training_data(new_data)

        # Train new model
        new_model = PredictiveMaintenanceModel()
        metrics = new_model.train(X, y)

        # Compare with current model
        current_metrics = self.get_current_model_metrics()

        if self.is_improvement(metrics, current_metrics):
            # Deploy new model
            await self.deploy_new_model(new_model)
            self.last_retraining_date = datetime.now()
            print(f"Model updated with new metrics: {metrics}")
        else:
            print("New model not better, keeping current version")

    def is_improvement(self, new_metrics, current_metrics):
        """Check if new model is better"""
        # Require improvement in key metrics
        roc_auc_improved = new_metrics['roc_auc'] >= current_metrics['roc_auc'] - 0.02
        f1_improved = new_metrics['f1'] >= current_metrics['f1'] - 0.05

        return roc_auc_improved and f1_improved
```

---

## Testing Strategy

### Unit Tests

```python
def test_feature_engineering():
    """Test feature engineering functions"""
    test_data = {
        'engineOilPressure': [50, 48, 45, 42],
        'engineCoolantTemp': [95, 98, 102, 105]
    }
    df = pd.DataFrame(test_data)

    engineer = FeatureEngineer(df)
    features = engineer.engineer_features()

    assert 'oil_pressure_trend_7d' in features.columns
    assert not features['oil_pressure_trend_7d'].isna().all()

def test_domain_features():
    """Test domain-specific features"""
    oil_health = DomainFeatureEngineer.calculate_oil_degradation(
        oil_pressure=50,
        oil_temp=95,
        engine_hours=3000,
        mileage=50000
    )

    assert 0 <= oil_health <= 100

def test_model_prediction():
    """Test model predictions"""
    X_test = np.random.rand(10, 50)
    model = PredictiveMaintenanceModel()

    predictions = model.predict(X_test)

    assert predictions.shape == (10, 2)
    assert all(0 <= p <= 1 for p in predictions[:, 1])
```

### E2E Tests

```python
async def test_end_to_end_prediction():
    """Test full prediction pipeline"""
    # Load test data
    test_vehicles = ['VEH-001', 'VEH-002', 'VEH-003']

    # Make predictions
    response = await api.post('/api/v1/predictions/maintenance', {
        'vehicleIds': test_vehicles,
        'predictDays': 30
    })

    assert response['status'] == 200
    assert len(response['predictions']) == 3

    # Verify prediction structure
    for pred in response['predictions']:
        assert 'riskScore' in pred
        assert 'components' in pred
        assert pred['riskScore'] >= 0 and pred['riskScore'] <= 100
```

---

## Security & Privacy

### Model Interpretability (Explainability)

```python
class ModelExplainability:
    """Provide explanations for predictions"""

    def __init__(self, model):
        self.model = model

    def explain_prediction(self, vehicle_data, prediction):
        """Generate explanation for why maintenance is predicted"""

        # SHAP values for feature contribution
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(vehicle_data)

        # Get top contributing factors
        top_factors = sorted(
            zip(self.feature_names, abs(shap_values[0])),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        explanation = {
            'prediction_reason': self.generate_narrative(top_factors),
            'contributing_factors': [
                {'factor': name, 'contribution': contribution}
                for name, contribution in top_factors
            ],
            'confidence': prediction['failureProbability']
        }

        return explanation

    def generate_narrative(self, top_factors):
        """Create human-readable explanation"""
        factors_str = ', '.join([f[0] for f in top_factors])
        return f"Predicted maintenance needed based on: {factors_str}"
```

### Data Privacy

- Anonymize vehicle identifiers in model
- Don't expose driver information
- Encrypt transmission of predictions
- Audit access to prediction API
- GDPR compliance for data retention

---

## Cost Analysis

### Development Cost
- Data scientist (4 weeks): 160 hours × $150 = $24,000
- Data engineer (3 weeks): 120 hours × $120 = $14,400
- ML engineer (4 weeks): 160 hours × $120 = $19,200
- Backend developer (2 weeks): 80 hours × $100 = $8,000
- QA/Testing (2 weeks): 80 hours × $80 = $6,400

**Total Development:** $72,000

### Infrastructure Cost (Monthly)
- Azure ML compute: $500
- Model storage: $50
- API hosting: $200
- Monitoring: $100
- **Total Monthly:** $850 (~$10,200/year)

### Ongoing Costs
- Model retraining: $2,000/month
- Data scientist support: $5,000/month
- Infrastructure: $850/month
- **Total Monthly:** $7,850/year = **$94,200/year**

### Year 1 Total: $72,000 + $10,200 + $94,200 = $176,400

### ROI Calculation
**Annual Benefits:**
- Reduced breakdowns: $150,000
- Lower maintenance costs: $50,000
- Improved productivity: $80,000
- Total: **$280,000**

**Year 1 ROI:** ($280,000 - $176,400) / $176,400 = **58.8%**
**Payback Period:** 7-8 months
**Year 2+ ROI:** ($280,000 - $104,200) / $104,200 = **168%**

---

## Success Metrics

- **Prediction Accuracy:** > 85% ROC-AUC
- **Maintenance Detection Rate:** > 75% (recall)
- **False Alarm Rate:** < 20% (1 - precision)
- **Time Horizon Accuracy:** Predictions within ±15 days of actual maintenance
- **Cost Savings:** > $50,000/year per 100 vehicles
- **Adoption Rate:** > 60% of fleets using recommendations within 12 months

---

**Document Version:** 1.0
**Last Updated:** November 16, 2025
**Owner:** Technical Implementation Specialist
**Status:** Ready for Engineering Review
