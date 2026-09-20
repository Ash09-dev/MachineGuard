// ==========================================
// MACHINEGUARD - PREDICTIVE MAINTENANCE ENGINE
// ==========================================

console.log("MACHINEGUARD ENGINE LOADED");


// ==========================================
// 1. GLOBAL STATE
// ==========================================

let liveMonitoring = false;
let liveInterval = null;
let motor04LiveIndex = 0;

let latestLiveResults = {};

const LOCAL_MACHINE_KEY = "machines";


// ==========================================
// 2. BASIC CALCULATIONS
// ==========================================

function calculateMean(values) {

    if (!values || values.length === 0) {
        return 0;
    }

    return values.reduce((sum, value) => {
        return sum + Number(value);
    }, 0) / values.length;
}


function calculateRMS(values) {

    if (!values || values.length === 0) {
        return 0;
    }

    const squareSum = values.reduce((sum, value) => {
        const number = Number(value);
        return sum + (number * number);
    }, 0);

    return Math.sqrt(squareSum / values.length);
}


function calculateVariance(values) {

    if (!values || values.length === 0) {
        return 0;
    }

    const mean = calculateMean(values);

    return values.reduce((sum, value) => {

        return sum + Math.pow(
            Number(value) - mean,
            2
        );

    }, 0) / values.length;
}


function calculateStandardDeviation(values) {

    return Math.sqrt(
        calculateVariance(values)
    );
}


function calculateKurtosis(values) {

    if (!values || values.length === 0) {
        return 0;
    }

    const mean = calculateMean(values);

    const standardDeviation =
        calculateStandardDeviation(values);

    if (standardDeviation === 0) {
        return 0;
    }

    const fourthMoment =
        values.reduce((sum, value) => {

            return sum + Math.pow(
                Number(value) - mean,
                4
            );

        }, 0) / values.length;

    return fourthMoment /
        Math.pow(
            standardDeviation,
            4
        );
}


// ==========================================
// 3. LOCAL STORAGE MACHINES
// ==========================================

function getStoredMachines() {

    try {

        const machines =
            JSON.parse(
                localStorage.getItem(
                    LOCAL_MACHINE_KEY
                )
            );

        return Array.isArray(machines)
            ? machines
            : [];

    } catch (error) {

        console.error(
            "Could not read stored machines:",
            error
        );

        return [];
    }
}


// ==========================================
// 4. GET ALL MACHINE NAMES
// ==========================================

function getAllMachineNames() {

    const sensorMachines =
        typeof machineSensorData !== "undefined"
            ? Object.keys(machineSensorData)
            : [];

    const storedMachines =
        getStoredMachines();

    const storedNames =
        storedMachines
            .map(machine =>
                machine.name ||
                machine.id
            )
            .filter(Boolean);

    return Array.from(
        new Set([
            ...sensorMachines,
            ...storedNames
        ])
    );
}


// ==========================================
// 5. GENERATE READINGS FOR NEW MACHINES
// ==========================================

function generateDefaultReadings(
    baselineRMS = 2.1
) {

    const baseline =
        Number(baselineRMS) || 2.1;

    return [
        baseline * 0.98,
        baseline * 1.00,
        baseline * 0.99,
        baseline * 1.02,
        baseline * 1.01,
        baseline * 1.03,
        baseline * 1.00,
        baseline * 1.02,
        baseline * 1.01,
        baseline * 1.03
    ];
}


// ==========================================
// 6. GET MACHINE READINGS
// ==========================================

function getMachineReadings(machineName) {

    // ------------------------------------------
    // FIRST: STATIC SENSOR DATA
    // ------------------------------------------

    if (
        typeof machineSensorData !== "undefined" &&
        machineSensorData[machineName]
    ) {

        const readings =
            machineSensorData[machineName].readings;

        if (
            Array.isArray(readings) &&
            readings.length > 0
        ) {
            return readings;
        }
    }


    // ------------------------------------------
    // SECOND: LOCAL STORAGE MACHINE
    // ------------------------------------------

    const storedMachines =
        getStoredMachines();

    const storedMachine =
        storedMachines.find(machine =>
            (machine.name || machine.id) ===
            machineName
        );


    if (storedMachine) {

        // If machine already has readings
        if (
            Array.isArray(
                storedMachine.readings
            ) &&
            storedMachine.readings.length > 0
        ) {

            return storedMachine.readings;
        }


        // Otherwise generate readings
        // around its baseline RMS

        const generatedReadings =
            generateDefaultReadings(
                storedMachine.baselineRMS
            );

        return generatedReadings;
    }


    console.error(
        "Machine not found:",
        machineName
    );

    return null;
}


// ==========================================
// 7. ANOMALY SCORE
// ==========================================

function calculateAnomalyScore(
    currentRMS,
    baselineRMS
) {

    if (
        !baselineRMS ||
        baselineRMS === 0
    ) {
        return 0;
    }

    const change =
        (
            currentRMS -
            baselineRMS
        ) / baselineRMS;

    let score =
        change / 1.5;

    score =
        Math.max(
            0,
            Math.min(
                score,
                1
            )
        );

    return score;
}


// ==========================================
// 8. HEALTH SCORE
// ==========================================

function calculateHealthScore(
    anomalyScore
) {

    const score =
        100 -
        (
            anomalyScore *
            100
        );

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );
}


// ==========================================
// 9. MACHINE STATUS
// ==========================================

function determineStatus(
    healthScore
) {

    if (healthScore >= 95) {

        return "Healthy";

    } else if (healthScore >= 50) {

        return "Warning";

    } else {

        return "Critical";
    }
}


// ==========================================
// 10. MAIN MACHINE ANALYSIS
// ==========================================

function analyzeMachine(
    machineName
) {

    const readings =
        getMachineReadings(
            machineName
        );


    if (
        !readings ||
        readings.length === 0
    ) {

        return {

            machine: machineName,
            healthScore: 0,
            status: "No Data",
            currentRMS: 0,
            baselineRMS: 0,
            rmsChange: 0,
            variance: 0,
            standardDeviation: 0,
            kurtosis: 0,
            anomalyScore: 0,
            readingsUsed: 0
        };
    }


    // ------------------------------------------
    // BASELINE
    // ------------------------------------------

    const baselineCount =
        Math.max(
            3,
            Math.floor(
                readings.length * 0.2
            )
        );

    const baselineReadings =
        readings.slice(
            0,
            baselineCount
        );


    // ------------------------------------------
    // CURRENT CONDITION
    // ------------------------------------------

    const recentCount =
        Math.min(
            5,
            readings.length
        );

    const recentReadings =
        readings.slice(
            -recentCount
        );


    // ------------------------------------------
    // METRICS
    // ------------------------------------------

    const baselineRMS =
        calculateRMS(
            baselineReadings
        );

    const currentRMS =
        calculateRMS(
            recentReadings
        );

    const variance =
        calculateVariance(
            readings
        );

    const standardDeviation =
        calculateStandardDeviation(
            readings
        );

    const kurtosis =
        calculateKurtosis(
            readings
        );


    // ------------------------------------------
    // ANOMALY
    // ------------------------------------------

    const anomalyScore =
        calculateAnomalyScore(
            currentRMS,
            baselineRMS
        );


    // ------------------------------------------
    // HEALTH
    // ------------------------------------------

    const healthScore =
        calculateHealthScore(
            anomalyScore
        );


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    const status =
        determineStatus(
            healthScore
        );


    // ------------------------------------------
    // RMS CHANGE
    // ------------------------------------------

    let rmsChange = 0;

    if (baselineRMS !== 0) {

        rmsChange =
            (
                (
                    currentRMS -
                    baselineRMS
                ) / baselineRMS
            ) * 100;
    }


    const result = {

        machine: machineName,

        currentRMS:
            Number(
                currentRMS.toFixed(2)
            ),

        baselineRMS:
            Number(
                baselineRMS.toFixed(2)
            ),

        rmsChange:
            Number(
                rmsChange.toFixed(1)
            ),

        variance:
            Number(
                variance.toFixed(3)
            ),

        standardDeviation:
            Number(
                standardDeviation.toFixed(3)
            ),

        kurtosis:
            Number(
                kurtosis.toFixed(2)
            ),

        anomalyScore:
            Number(
                anomalyScore.toFixed(2)
            ),

        healthScore,

        status,

        readingsUsed:
            readings.length
    };


    console.log(
        "ANALYSIS RESULT:",
        result
    );

    return result;
}


// ==========================================
// 11. OPEN MACHINE ANALYSIS MODAL
// ==========================================

function openMachine(
    machineName
) {

    // Use latest live result first
    const result =
        latestLiveResults[machineName] ||
        analyzeMachine(
            machineName
        );


    if (!result) {
        return;
    }


    // ------------------------------------------
    // MACHINE NAME
    // ------------------------------------------

    const machineElement =
        document.getElementById(
            "modalMachine"
        );

    if (machineElement) {

        machineElement.textContent =
            result.machine;
    }


    // ------------------------------------------
    // HEALTH SCORE
    // ------------------------------------------

    const scoreElement =
        document.getElementById(
            "modalScore"
        );

    if (scoreElement) {

        scoreElement.textContent =
            result.healthScore +
            "%";
    }


    // ------------------------------------------
    // HEALTH CIRCLE
    // ------------------------------------------

    const healthCircle =
        document.getElementById(
            "healthCircle"
        );

    if (healthCircle) {

        const score =
            Math.max(
                0,
                Math.min(
                    100,
                    result.healthScore
                )
            );


        let color;


        if (
            result.status ===
            "Healthy"
        ) {

            color =
                "#22c55e";

        } else if (
            result.status ===
            "Warning"
        ) {

            color =
                "#f59e0b";

        } else {

            color =
                "#ef4444";
        }


        const degree =
            score * 3.6;


        healthCircle.style.background =
            `conic-gradient(
                ${color} 0deg,
                ${color} ${degree}deg,
                #e5e7eb ${degree}deg,
                #e5e7eb 360deg
            )`;
    }


    // ------------------------------------------
    // CURRENT RMS
    // ------------------------------------------

    const currentRMS =
        document.getElementById(
            "currentRMSValue"
        );

    if (currentRMS) {

        currentRMS.textContent =
            result.currentRMS;
    }


    // ------------------------------------------
    // BASELINE RMS
    // ------------------------------------------

    const baselineRMS =
        document.getElementById(
            "baselineRMSValue"
        );

    if (baselineRMS) {

        baselineRMS.textContent =
            result.baselineRMS;
    }


    // ------------------------------------------
    // RMS CHANGE
    // ------------------------------------------

    const rmsChange =
        document.getElementById(
            "rmsChangeValue"
        );

    if (rmsChange) {

        rmsChange.textContent =
            (
                result.rmsChange >= 0
                    ? "+"
                    : ""
            ) +
            result.rmsChange +
            "%";
    }


    // ------------------------------------------
    // ANOMALY SCORE
    // ------------------------------------------

    const anomalyScore =
        document.getElementById(
            "anomalyScoreValue"
        );

    if (anomalyScore) {

        anomalyScore.textContent =
            result.anomalyScore;
    }


    // ------------------------------------------
    // OPEN MODAL
    // ------------------------------------------

    const modal =
        document.getElementById(
            "analysisModal"
        );

    if (modal) {

        modal.classList.add(
            "show"
        );
    }


    // ------------------------------------------
    // UPDATE MODAL CONTENT
    // ------------------------------------------

    updateDiagnosis(
        result
    );

    updateVibrationGraph(
        machineName
    );

    updateTrendBadge(
        result
    );


    // ------------------------------------------
    // ICONS
    // ------------------------------------------

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }


    console.log(
        "Modal opened for:",
        machineName
    );
}


// ==========================================
// 12. CLOSE MODAL
// ==========================================

function closeModal() {

    const modal =
        document.getElementById(
            "analysisModal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );
    }
}


// ==========================================
// 13. SCROLL TO MACHINES
// ==========================================

function scrollToMachines() {

    const machines =
        document.getElementById(
            "machines"
        );

    if (machines) {

        machines.scrollIntoView({
            behavior: "smooth"
        });
    }
}


// ==========================================
// 14. DYNAMIC MACHINE DIAGNOSIS
// ==========================================

function updateDiagnosis(
    result
) {

    const riskBadge =
        document.getElementById(
            "riskBadge"
        );

    const statusTitle =
        document.getElementById(
            "statusTitle"
        );

    const statusDescription =
        document.getElementById(
            "statusDescription"
        );

    const aiAnalysisTitle =
        document.getElementById(
            "aiAnalysisTitle"
        );

    const possibleIssue =
        document.getElementById(
            "possibleIssue"
        );

    const recommendedAction =
        document.getElementById(
            "recommendedAction"
        );


    // ==========================================
    // HEALTHY
    // ==========================================

    if (
        result.status ===
        "Healthy"
    ) {

        if (riskBadge)
            riskBadge.textContent =
                "HEALTHY";

        if (statusTitle)
            statusTitle.textContent =
                "Machine operating normally";

        if (statusDescription)
            statusDescription.textContent =
                "Vibration remains close to the established baseline.";

        if (aiAnalysisTitle)
            aiAnalysisTitle.textContent =
                "Normal vibration pattern";

        if (possibleIssue)
            possibleIssue.textContent =
                "No significant anomaly detected";

        if (recommendedAction)
            recommendedAction.textContent =
                "Continue routine monitoring and scheduled maintenance.";
    }


    // ==========================================
    // WARNING
    // ==========================================

    else if (
        result.status ===
        "Warning"
    ) {

        if (riskBadge)
            riskBadge.textContent =
                "WARNING";

        if (statusTitle)
            statusTitle.textContent =
                "Increasing machine vibration detected";

        if (statusDescription)
            statusDescription.textContent =
                "Vibration is rising above the established baseline.";

        if (aiAnalysisTitle)
            aiAnalysisTitle.textContent =
                "Early abnormal pattern detected";

        if (possibleIssue)
            possibleIssue.textContent =
                "Developing mechanical imbalance";

        if (recommendedAction)
            recommendedAction.textContent =
                "Continue monitoring and schedule an inspection during the next maintenance window.";
    }


    // ==========================================
    // CRITICAL
    // ==========================================

    else {

        if (riskBadge)
            riskBadge.textContent =
                "HIGH RISK";

        if (statusTitle)
            statusTitle.textContent =
                "Abnormal machine behavior detected";

        if (statusDescription)
            statusDescription.textContent =
                "Machine vibration is significantly higher than the established baseline.";

        if (aiAnalysisTitle)
            aiAnalysisTitle.textContent =
                "Abnormal vibration pattern detected";

        if (possibleIssue)
            possibleIssue.textContent =
                "Possible bearing or alignment degradation";

        if (recommendedAction)
            recommendedAction.textContent =
                "Inspect bearing condition and machine alignment during the next maintenance window.";
    }
}


// ==========================================
// 15. VIBRATION GRAPH
// ==========================================

function updateVibrationGraph(
    machineName
) {

    const readings =
        getMachineReadings(
            machineName
        );

    if (
        !readings ||
        readings.length === 0
    ) {
        return;
    }


    const vibrationLine =
        document.getElementById(
            "vibrationLine"
        );

    const baselineLine =
        document.getElementById(
            "baselineLine"
        );

    const vibrationPoint =
        document.getElementById(
            "vibrationPoint"
        );


    if (!vibrationLine) {

        console.warn(
            "vibrationLine element not found."
        );

        return;
    }


    const graphWidth = 700;
    const graphTop = 25;
    const graphBottom = 190;

    const minValue = 1;
    const maxValue = 5;


    function valueToY(
        value
    ) {

        const safeValue =
            Math.max(
                minValue,
                Math.min(
                    value,
                    maxValue
                )
            );

        const percentage =
            (
                safeValue -
                minValue
            ) /
            (
                maxValue -
                minValue
            );

        return (
            graphBottom -
            (
                percentage *
                (
                    graphBottom -
                    graphTop
                )
            )
        );
    }


    // ------------------------------------------
    // GRAPH POINTS
    // ------------------------------------------

    const points =
        readings.map(
            (
                value,
                index
            ) => {

                const x =
                    readings.length === 1
                        ? 0
                        : (
                            index /
                            (
                                readings.length -
                                1
                            )
                        ) *
                        graphWidth;

                const y =
                    valueToY(
                        value
                    );

                return (
                    x.toFixed(1) +
                    "," +
                    y.toFixed(1)
                );
            }
        );


    vibrationLine.setAttribute(
        "points",
        points.join(" ")
    );


    // ------------------------------------------
    // BASELINE
    // ------------------------------------------

    const baselineCount =
        Math.max(
            3,
            Math.floor(
                readings.length *
                0.2
            )
        );

    const baselineReadings =
        readings.slice(
            0,
            baselineCount
        );

    const baselineRMS =
        calculateRMS(
            baselineReadings
        );


    if (baselineLine) {

        const baselineY =
            valueToY(
                baselineRMS
            );

        baselineLine.setAttribute(
            "y1",
            baselineY
        );

        baselineLine.setAttribute(
            "y2",
            baselineY
        );
    }


    // ------------------------------------------
    // CURRENT POINT
    // ------------------------------------------

    if (vibrationPoint) {

        const lastValue =
            readings[
                readings.length - 1
            ];

        vibrationPoint.setAttribute(
            "cx",
            graphWidth
        );

        vibrationPoint.setAttribute(
            "cy",
            valueToY(
                lastValue
            )
        );
    }
}


// ==========================================
// 16. TREND BADGE
// ==========================================

function updateTrendBadge(
    result
) {

    const trendBadge =
        document.getElementById(
            "trendChangeValue"
        );

    if (!trendBadge) {
        return;
    }


    const change =
        Number(
            result.rmsChange
        );


    if (change > 0) {

        trendBadge.textContent =
            "↑ " +
            change.toFixed(1) +
            "%";

    } else if (change < 0) {

        trendBadge.textContent =
            "↓ " +
            Math.abs(change).toFixed(1) +
            "%";

    } else {

        trendBadge.textContent =
            "→ 0%";
    }
}


// ==========================================
// 17. UPDATE MACHINE CARD
// ==========================================

function updateMachineCard(
    machineName
) {

    const result =
        latestLiveResults[machineName] ||
        analyzeMachine(
            machineName
        );


    if (!result) {
        return;
    }


    const healthElement =
        document.getElementById(
            `health-${machineName}`
        );

    const progressElement =
        document.getElementById(
            `progress-${machineName}`
        );

    const statusElement =
        document.getElementById(
            `status-${machineName}`
        );

    const messageElement =
        document.getElementById(
            `message-${machineName}`
        );


    // ------------------------------------------
    // HEALTH
    // ------------------------------------------

    if (healthElement) {

        healthElement.textContent =
            result.healthScore +
            "%";
    }


    // ------------------------------------------
    // PROGRESS BAR
    // ------------------------------------------

    if (progressElement) {

        progressElement.style.width =
            result.healthScore +
            "%";


        progressElement.classList.remove(
            "green-bar",
            "orange-bar",
            "red-bar",
            "warning-bar",
            "critical-bar"
        );


        if (
            result.status ===
            "Healthy"
        ) {

            progressElement.classList.add(
                "green-bar"
            );

        } else if (
            result.status ===
            "Warning"
        ) {

            progressElement.classList.add(
                "orange-bar"
            );

        } else {

            progressElement.classList.add(
                "red-bar"
            );
        }
    }


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    if (statusElement) {

        statusElement.textContent =
            result.status;

        statusElement.classList.remove(
            "healthy",
            "warning",
            "critical"
        );


        if (
            result.status ===
            "Healthy"
        ) {

            statusElement.classList.add(
                "healthy"
            );

        } else if (
            result.status ===
            "Warning"
        ) {

            statusElement.classList.add(
                "warning"
            );

        } else {

            statusElement.classList.add(
                "critical"
            );
        }
    }


    // ------------------------------------------
    // MESSAGE
    // ------------------------------------------

    if (messageElement) {

        let icon =
            "activity";

        let text =
            "Normal vibration";


        if (
            result.status ===
            "Warning"
        ) {

            icon =
                "trending-up";

            text =
                "Increasing vibration";

        } else if (
            result.status ===
            "Critical"
        ) {

            icon =
                "triangle-alert";

            text =
                "Abnormal vibration";
        }


        messageElement.innerHTML =
            `<i data-lucide="${icon}"></i> ${text}`;
    }


    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }
}


// ==========================================
// 18. DASHBOARD SUMMARY
// ==========================================

function updateDashboardSummary() {

    const machines =
        getAllMachineNames();


    let healthy = 0;
    let warning = 0;
    let critical = 0;


    machines.forEach(
        machineName => {

            const result =
                latestLiveResults[machineName] ||
                analyzeMachine(
                    machineName
                );


            if (
                result.status ===
                "Healthy"
            ) {

                healthy++;

            } else if (
                result.status ===
                "Warning"
            ) {

                warning++;

            } else if (
                result.status ===
                "Critical"
            ) {

                critical++;
            }
        }
    );


    const totalElement =
        document.getElementById(
            "totalMachines"
        );

    const healthyElement =
        document.getElementById(
            "healthyMachines"
        );

    const warningElement =
        document.getElementById(
            "warningMachines"
        );

    const criticalElement =
        document.getElementById(
            "criticalMachines"
        );


    if (totalElement)
        totalElement.textContent =
            machines.length;

    if (healthyElement)
        healthyElement.textContent =
            healthy;

    if (warningElement)
        warningElement.textContent =
            warning;

    if (criticalElement)
        criticalElement.textContent =
            critical;


    console.log(
        "Dashboard summary updated:",
        {
            total: machines.length,
            healthy,
            warning,
            critical
        }
    );
}


// ==========================================
// 19. MAINTENANCE RECOMMENDATION ENGINE
// ==========================================

function getMaintenanceRecommendation(
    result
) {

    if (!result) {

        return {

            title:
                "No recommendation",

            message:
                "Insufficient machine data for analysis."
        };
    }


    if (
        result.status ===
        "Critical"
    ) {

        return {

            title:
                "Priority inspection recommended",

            message:
                "Inspect bearing condition, machine alignment and mounting. Schedule maintenance as soon as practical."
        };
    }


    if (
        result.status ===
        "Warning"
    ) {

        return {

            title:
                "Inspect during next maintenance window",

            message:
                "Monitor vibration trend and check alignment, lubrication and bearing condition."
        };
    }


    return {

        title:
            "Continue routine monitoring",

        message:
            "Vibration remains close to the established baseline. Continue normal monitoring."
    };
}


// ==========================================
// 20. UPDATE RECOMMENDATIONS
// ==========================================

function updateRecommendations(
    liveResult = null
) {

    const container =
        document.getElementById(
            "recommendationsList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const machines =
        getAllMachineNames();


    machines.forEach(
        machineName => {

            let result;


            if (
                liveResult &&
                liveResult.machine ===
                machineName
            ) {

                result =
                    liveResult;

            } else {

                result =
                    latestLiveResults[machineName] ||
                    analyzeMachine(
                        machineName
                    );
            }


            if (
                !result ||
                result.status ===
                "Healthy"
            ) {
                return;
            }


            const recommendation =
                getMaintenanceRecommendation(
                    result
                );


            const statusClass =
                result.status.toLowerCase();


            const icon =
                result.status ===
                "Critical"
                    ? "triangle-alert"
                    : "alert-triangle";


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                `recommendation-card ${statusClass}`;


            card.innerHTML = `

                <div class="recommendation-info">

                    <div class="recommendation-icon ${statusClass}">

                        <i data-lucide="${icon}"></i>

                    </div>


                    <div class="recommendation-content">

                        <div class="recommendation-machine">

                            ${machineName}
                            • ${result.status}

                        </div>


                        <h3>
                            ${recommendation.title}
                        </h3>


                        <p>
                            ${recommendation.message}
                        </p>

                    </div>

                </div>


                <div class="recommendation-action">

                    <strong>
                        Health: ${result.healthScore}%
                    </strong>

                    <br>

                    RMS:
                    ${Number(
                        result.currentRMS
                    ).toFixed(2)}

                </div>

            `;


            container.appendChild(
                card
            );
        }
    );


    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }
}


// ==========================================
// 21. DYNAMIC RECENT ALERTS
// ==========================================

function updateRecentAlerts(
    liveResult = null
) {

    const alertsList =
        document.getElementById(
            "alertsList"
        );


    if (!alertsList) {
        return;
    }


    alertsList.innerHTML = "";


    const machines =
        getAllMachineNames();


    machines.forEach(
        machineName => {

            let result;


            if (
                liveResult &&
                liveResult.machine ===
                machineName
            ) {

                result =
                    liveResult;

            } else {

                result =
                    latestLiveResults[machineName] ||
                    analyzeMachine(
                        machineName
                    );
            }


            if (
                !result ||
                result.status ===
                "Healthy"
            ) {
                return;
            }


            let icon =
                "activity";

            let alertClass =
                "warning-alert";

            let title =
                "";

            let message =
                "";


            // ------------------------------------------
            // CRITICAL
            // ------------------------------------------

            if (
                result.status ===
                "Critical"
            ) {

                icon =
                    "triangle-alert";

                alertClass =
                    "critical-alert";

                title =
                    `${machineName} — High vibration detected`;

                message =
                    "Abnormal vibration pattern detected. Inspection recommended.";
            }


            // ------------------------------------------
            // WARNING
            // ------------------------------------------

            else {

                icon =
                    "activity";

                alertClass =
                    "warning-alert";

                title =
                    `${machineName} — Abnormal trend`;

                message =
                    "Vibration level is increasing compared with baseline.";
            }


            const alertCard =
                document.createElement(
                    "div"
                );


            alertCard.className =
                `alert-card ${alertClass}`;


            alertCard.innerHTML = `

                <div class="alert-icon">

                    <i data-lucide="${icon}"></i>

                </div>


                <div class="alert-content">

                    <h3>
                        ${title}
                    </h3>

                    <p>
                        ${message}
                    </p>

                </div>


                <span class="alert-time">
                    Just now
                </span>

            `;


            alertsList.appendChild(
                alertCard
            );
        }
    );


    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }
}


// ==========================================
// 22. LIVE MONITORING
// ==========================================

function toggleLiveMonitoring() {

    const button =
        document.querySelector(
            ".live-monitor-btn"
        );

    const text =
        document.getElementById(
            "liveMonitorText"
        );


    if (!liveMonitoring) {

        liveMonitoring = true;


        if (button) {

            button.classList.add(
                "active"
            );
        }


        if (text) {

            text.textContent =
                "Live Monitoring Active";
        }


        console.log(
            "LIVE MONITORING STARTED"
        );


        startLiveMonitoring();

    } else {

        liveMonitoring = false;


        if (button) {

            button.classList.remove(
                "active"
            );
        }


        if (text) {

            text.textContent =
                "Start Live Monitoring";
        }


        clearInterval(
            liveInterval
        );


        console.log(
            "LIVE MONITORING STOPPED"
        );
    }
}


// ==========================================
// 23. START LIVE MONITORING
// ==========================================

function startLiveMonitoring() {

    simulateVibrationChange();


    liveInterval =
        setInterval(
            () => {

                if (!liveMonitoring) {
                    return;
                }

                simulateVibrationChange();

            },
            3000
        );
}


// ==========================================
// 24. UPDATE LIVE MACHINE CARD
// ==========================================

function updateMachineCardFromLiveData(
    result
) {

    const cards =
        document.querySelectorAll(
            ".machine-card"
        );


    cards.forEach(
        card => {

            const nameElement =
                card.querySelector(
                    ".machine-name h3"
                );


            if (!nameElement) {
                return;
            }


            if (
                nameElement.textContent.trim() !==
                result.machine
            ) {
                return;
            }


            const healthScore =
                card.querySelector(
                    ".health strong"
                );


            if (healthScore) {

                healthScore.textContent =
                    result.healthScore +
                    "%";
            }


            const progressBar =
                card.querySelector(
                    ".progress-bar"
                );


            if (progressBar) {

                progressBar.style.width =
                    result.healthScore +
                    "%";


                progressBar.classList.remove(
                    "green-bar",
                    "orange-bar",
                    "red-bar",
                    "warning-bar",
                    "critical-bar"
                );


                if (
                    result.status ===
                    "Healthy"
                ) {

                    progressBar.classList.add(
                        "green-bar"
                    );

                } else if (
                    result.status ===
                    "Warning"
                ) {

                    progressBar.classList.add(
                        "orange-bar"
                    );

                } else {

                    progressBar.classList.add(
                        "red-bar"
                    );
                }
            }


            const statusBadge =
                card.querySelector(
                    ".status"
                );


            if (statusBadge) {

                statusBadge.textContent =
                    result.status;


                statusBadge.classList.remove(
                    "healthy",
                    "warning",
                    "critical"
                );


                statusBadge.classList.add(
                    result.status.toLowerCase()
                );
            }


            const vibrationText =
                card.querySelector(
                    ".machine-footer span"
                );


            if (vibrationText) {

                if (
                    result.status ===
                    "Healthy"
                ) {

                    vibrationText.innerHTML =
                        '<i data-lucide="activity"></i> Normal vibration';

                } else if (
                    result.status ===
                    "Warning"
                ) {

                    vibrationText.innerHTML =
                        '<i data-lucide="trending-up"></i> Increasing vibration';

                } else {

                    vibrationText.innerHTML =
                        '<i data-lucide="triangle-alert"></i> Abnormal vibration';
                }
            }
        }
    );


    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }
}


// ==========================================
// 25. SIMULATE LIVE VIBRATION
// ==========================================

function simulateVibrationChange() {

    if (
        typeof machineSensorData ===
        "undefined"
    ) {

        console.error(
            "machineSensorData not found."
        );

        return;
    }


    const motor =
        machineSensorData[
            "Motor-04"
        ];


    if (
        !motor ||
        !motor.readings
    ) {

        console.error(
            "Motor-04 data not found."
        );

        return;
    }


    // ------------------------------------------
    // NEXT READING
    // ------------------------------------------

    if (
        motor04LiveIndex <
        motor.readings.length - 1
    ) {

        motor04LiveIndex++;

    } else {

        motor04LiveIndex = 0;
    }


    const currentReading =
        motor.readings[
            motor04LiveIndex
        ];


    console.log(
        "LIVE SENSOR READING:",
        currentReading
    );


    // ------------------------------------------
    // ROLLING WINDOW
    // ------------------------------------------

    const startIndex =
        Math.max(
            0,
            motor04LiveIndex - 9
        );


    const liveReadings =
        motor.readings.slice(
            startIndex,
            motor04LiveIndex + 1
        );


    if (
        liveReadings.length < 5
    ) {

        console.log(
            "Collecting sensor readings...",
            liveReadings.length
        );

        return;
    }


    // ------------------------------------------
    // RMS
    // ------------------------------------------

    const currentRMS =
        calculateRMS(
            liveReadings
        );


    // ------------------------------------------
    // BASELINE
    // ------------------------------------------

    const baselineReadings =
        motor.readings.slice(
            0,
            5
        );


    const baselineRMS =
        calculateRMS(
            baselineReadings
        );


    // ------------------------------------------
    // ANOMALY
    // ------------------------------------------

    const anomalyScore =
        calculateAnomalyScore(
            currentRMS,
            baselineRMS
        );


    // ------------------------------------------
    // HEALTH
    // ------------------------------------------

    const healthScore =
        calculateHealthScore(
            anomalyScore
        );


    // ------------------------------------------
    // STATUS
    // ------------------------------------------

    const status =
        determineStatus(
            healthScore
        );


    // ------------------------------------------
    // RESULT
    // ------------------------------------------

    const result = {

        machine:
            "Motor-04",

        currentRMS:
            Number(
                currentRMS.toFixed(2)
            ),

        baselineRMS:
            Number(
                baselineRMS.toFixed(2)
            ),

        rmsChange:
            Number(
                (
                    (
                        (
                            currentRMS -
                            baselineRMS
                        ) /
                        baselineRMS
                    ) *
                    100
                ).toFixed(1)
            ),

        anomalyScore:
            Number(
                anomalyScore.toFixed(2)
            ),

        healthScore,

        status,

        readingsUsed:
            liveReadings.length
    };


    console.log(
        "LIVE ANALYSIS RESULT:",
        result
    );


    // ==========================================
    // SAVE LIVE RESULT
    // ==========================================

    latestLiveResults[
        "Motor-04"
    ] = result;


    // ==========================================
    // UPDATE UI
    // ==========================================

    updateMachineCardFromLiveData(
        result
    );

    updateDashboardSummary();

    updateRecentAlerts(
        result
    );

    updateRecommendations(
        result
    );


    // ==========================================
    // UPDATE OPEN MODAL
    // ==========================================

    const modal =
        document.getElementById(
            "analysisModal"
        );

    const modalMachine =
        document.getElementById(
            "modalMachine"
        );


    if (
        modal &&
        modal.classList.contains(
            "show"
        ) &&
        modalMachine &&
        modalMachine.textContent.trim() ===
        "Motor-04"
    ) {

        openMachine(
            "Motor-04"
        );
    }
}


// ==========================================
// 26. RENDER ALL DASHBOARD MACHINES
// ==========================================

function renderAllDashboardMachines() {

    const machines =
        getAllMachineNames();


    machines.forEach(
        machineName => {

            updateMachineCard(
                machineName
            );
        }
    );


    updateDashboardSummary();

    updateRecommendations();

    updateRecentAlerts();


    console.log(
        "All dashboard machines rendered:",
        machines
    );
}


// ==========================================
// 27. INITIALIZE MACHINEGUARD
// ==========================================

function initializeMachineGuard() {

    console.log(
        "Initializing MachineGuard..."
    );


    renderAllDashboardMachines();


    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }


    console.log(
        "MachineGuard initialization complete."
    );
}


// ==========================================
// 28. DOM READY
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMachineGuard
    );

} else {

    initializeMachineGuard();
}


console.log(
    "Predictive maintenance engine ready."
);