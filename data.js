/*
====================================================
 MACHINEGUARD - VIBRATION DATA
====================================================

Demo sensor readings.

Normal machines have relatively stable vibration.

Motor-04 contains a gradually increasing vibration
pattern to simulate a developing problem.
*/


const machineSensorData = {

    "Motor-01": {

        machine: "Motor-01",

        readings: [
            1.82, 1.91, 1.88, 1.95, 1.86,
            1.92, 1.89, 1.94, 1.87, 1.91,
            1.90, 1.93, 1.88, 1.92, 1.89,
            1.91, 1.87, 1.90, 1.92, 1.88
        ]

    },


    "Motor-02": {

        machine: "Motor-02",

        readings: [
            2.02, 2.08, 2.11, 2.04, 2.09,
            2.07, 2.12, 2.06, 2.10, 2.08,
            2.13, 2.05, 2.09, 2.07, 2.11,
            2.06, 2.10, 2.08, 2.12, 2.09
        ]

    },


    "Pump-03": {

        machine: "Pump-03",

        readings: [
            2.10, 2.18, 2.14, 2.23, 2.19,
            2.27, 2.21, 2.31, 2.25, 2.34,
            2.29, 2.38, 2.33, 2.42, 2.39,
            2.47, 2.44, 2.51, 2.48, 2.55
        ]

    },


    "Motor-04": {

        machine: "Motor-04",

        readings: [
            2.02, 2.04, 2.01, 2.05, 2.03,
            2.08, 2.06, 2.10, 2.12, 2.15,
            2.18, 2.22, 2.25, 2.31, 2.35,
            2.42, 2.51, 2.63, 2.78, 2.96,
            3.12, 3.28, 3.51, 3.74, 3.98,
            4.21, 4.43, 4.61, 4.78, 4.92
        ]

    }

};