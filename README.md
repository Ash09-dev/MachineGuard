# MachineGuard
Predictive maintenance and machine health monitoring system
# 🛡️ MachineGuard

### Predictive Maintenance & Machine Health Monitoring System

> **Detect early. Act before failure. Keep machines running.**

MachineGuard is a smart machine-health monitoring platform designed to help factories detect abnormal machine behavior before it leads to unexpected breakdowns.

The system analyzes machine vibration data using statistical indicators such as RMS, variance, standard deviation, and anomaly scores. It converts this analysis into a simple machine health score and classifies machines as **Healthy, Warning, or Critical**.

---

## 🚨 Problem Statement

Unexpected machine failures can cause:

- Production downtime
- Expensive emergency repairs
- Reduced productivity
- Safety risks
- Difficulty identifying early signs of failure

Small and medium-sized manufacturing units may not have access to expensive predictive-maintenance systems.

---

## 💡 Our Solution

MachineGuard provides an accessible predictive-maintenance dashboard that:

- Monitors machine vibration data
- Detects abnormal vibration trends
- Calculates machine health scores
- Classifies machines as Healthy, Warning, or Critical
- Generates maintenance alerts
- Provides maintenance recommendations
- Supports multiple machines
- Simulates real-time monitoring
- Provides vibration analysis and machine statistics

---

## ✨ Key Features

### 📊 Machine Health Dashboard
View the health status of multiple machines from one dashboard.

### 📈 Vibration Analysis
Analyze vibration readings using statistical metrics including:

- RMS
- Variance
- Standard Deviation
- Kurtosis
- Anomaly Score

### 🚦 Health Classification

| Status | Meaning |
|---|---|
| 🟢 Healthy | Machine operating close to baseline |
| 🟠 Warning | Abnormal trend detected |
| 🔴 Critical | Significant abnormal vibration detected |

### 🚨 Smart Alerts
MachineGuard automatically identifies machines requiring attention and generates alerts.

### 🔧 Maintenance Recommendations
The system provides recommended actions based on machine condition.

### ⚡ Live Monitoring
The MVP demonstrates a simulated streaming vibration-data pipeline for real-time monitoring.

### 🏭 Machine Management
Users can add and manage machines with information such as:

- Machine name
- Machine ID
- Machine type
- Location
- Baseline vibration level

---

## 🧠 How It Works

```text
Machine Vibration Data
        ↓
Data Collection
        ↓
Statistical Analysis
        ↓
RMS & Anomaly Detection
        ↓
Machine Health Score
        ↓
Health Classification
        ↓
Alerts & Recommendations
        ↓
Maintenance Action
