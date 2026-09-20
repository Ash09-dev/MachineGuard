// Central Machine Data Store
const MachineStore = {
  STORAGE_KEY: 'mg_machines_data',

  // Initial 4 default machines
  DEFAULT_MACHINES: [
    {
      id: 'MTR-001',
      name: 'Motor-01',
      type: 'Motor Unit',
      location: 'Production Line A',
      baselineRMS: 2.10,
      currentRMS: 2.15,
      status: 'Healthy',
      healthScore: 92,
      isCustom: false
    },
    {
      id: 'MTR-002',
      name: 'Motor-02',
      type: 'Motor Unit',
      location: 'Production Line B',
      baselineRMS: 1.85,
      currentRMS: 2.40,
      status: 'Healthy',
      healthScore: 87,
      isCustom: false
    },
    {
      id: 'PMP-003',
      name: 'Pump-03',
      type: 'Hydraulic Pump',
      location: 'Cooling Bay 1',
      baselineRMS: 3.10,
      currentRMS: 4.80,
      status: 'Warning',
      healthScore: 64,
      isCustom: false
    },
    {
      id: 'MTR-004',
      name: 'Motor-04',
      type: 'Motor Unit',
      location: 'Production Line C',
      baselineRMS: 2.04,
      currentRMS: 4.60,
      status: 'Critical',
      healthScore: 16,
      isCustom: false
    }
  ],

  // Load machines from localStorage or initialize defaults[cite: 1]
  getMachines() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.DEFAULT_MACHINES));
      return [...this.DEFAULT_MACHINES];
    }
    return JSON.parse(data);
  },

  // Save full machine list to localStorage[cite: 1]
  saveMachines(machines) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(machines));
  },

  // Add a new custom machine[cite: 1]
  addMachine(machineData) {
    const machines = this.getMachines();
    
    // Auto-calculate health score & status based on RMS deviation
    const baseline = parseFloat(machineData.baselineRMS);
    const current = parseFloat(machineData.currentRMS);
    const ratio = current / baseline;

    let status = 'Healthy';
    let healthScore = 95;

    if (ratio > 1.8) {
      status = 'Critical';
      healthScore = Math.max(10, Math.round(100 - (ratio * 25)));
    } else if (ratio > 1.3) {
      status = 'Warning';
      healthScore = Math.max(50, Math.round(100 - (ratio * 20)));
    }

    const newMachine = {
      id: machineData.id,
      name: machineData.name,
      type: machineData.type,
      location: machineData.location,
      baselineRMS: baseline,
      currentRMS: current,
      status: machineData.status || status,
      healthScore: healthScore,
      isCustom: true // Allows deletion[cite: 1]
    };

    machines.push(newMachine);
    this.saveMachines(machines);
    return newMachine;
  },

  // Remove machine (only newly added custom ones)[cite: 1]
  removeMachine(id) {
    let machines = this.getMachines();
    machines = machines.filter(m => m.id !== id || !m.isCustom);
    this.saveMachines(machines);
  }
};