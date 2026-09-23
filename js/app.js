// SENSECORE Application Entry Point
import { EventEmitter, formatHex, formatTime, animateValue, flashHighlight, reducedMotion } from './utils.js';
import { SimulationEngine } from './simulation.js';
import { SensorManager } from './sensors.js';
import { CPUPipeline } from './cpu.js';
import { ALU } from './alu.js';
import { RegisterFile } from './registers.js';
import { Memory } from './memory.js';
import { DataFlowAnimator } from './dataflow.js';
import { BusVisualizer } from './bus.js';
import { RealtimeChart } from './charts.js';
import { Logger } from './logger.js';

class SenseCoreApp {
  constructor() {
    // 1. Initialize Subsystems
    this.engine = new SimulationEngine();
    this.sensors = new SensorManager(this.engine);
    this.cpu = new CPUPipeline(this.engine);
    this.alu = new ALU(this.engine);
    this.registers = new RegisterFile(this.engine);
    this.memory = new Memory(this.engine);
    this.dataflow = new DataFlowAnimator(this.engine);
    this.bus = new BusVisualizer(this.engine);
    this.logger = new Logger(250);

    // Register active simulation tick modules
    this.engine.registerModule(this.sensors);
    this.engine.registerModule(this.cpu);
    this.engine.registerModule(this.registers);
    this.engine.registerModule(this.memory);
    this.engine.registerModule(this.dataflow);
    this.engine.registerModule(this.bus);

    // UI State & References
    this.currentPage = 'dashboard';
    this.alerts = [];
    this.currentLogFilter = 'all';
    this.selectedAluOp = 'ADD';

    // Charts
    this.tempChart = null;
    this.humChart = null;

    // DOM Caching
    this.cacheDom();
    
    // Mount subsystems
    this.initViews();
    this.bindEvents();
    this.initCharts();
    
    // Initial boot telemetry
    this.logger.log('SENSECORE embedded architecture simulator booted', 'system');
    this.logger.log('Harvard 8-bit core initialized at 0x0000', 'cpu');
    this.logger.log('Memory subsystem: 64 bytes static RAM ready', 'memory');
    this.logger.log('Transducer interface: 6 sensors calibrated and online', 'io');
  }

  cacheDom() {
    this.dom = {
      // Topbar
      btnSimToggle: document.getElementById('btn-sim-toggle'),
      btnSimToggleText: document.getElementById('btn-sim-toggle-text'),
      btnSimToggleIcon: document.getElementById('btn-sim-toggle-icon'),
      btnSimReset: document.getElementById('btn-sim-reset'),
      liveIndicator: document.getElementById('live-indicator'),
      topbarStatusText: document.getElementById('topbar-status-text'),
      topbarCpu: document.getElementById('topbar-cpu'),
      topbarMemory: document.getElementById('topbar-memory'),
      topbarIo: document.getElementById('topbar-io'),
      topbarNet: document.getElementById('topbar-net'),

      // Navigation
      navItems: document.querySelectorAll('.nav-item'),
      pageViews: document.querySelectorAll('.page-view'),

      // Dashboard
      sensorCardsGrid: document.getElementById('sensor-cards-grid'),
      dashboardAlertsList: document.getElementById('dashboard-alerts-list'),
      alertsCountBadge: document.getElementById('alerts-count-badge'),

      // Dataflow
      dataflowContainer: document.getElementById('dataflow-svg-container'),
      dataflowNodeDetail: document.getElementById('dataflow-node-detail'),
      flowDetailBadge: document.getElementById('flow-detail-badge'),
      flowDetailText: document.getElementById('flow-detail-text'),
      flowDetailPacketTag: document.getElementById('flow-detail-packet-tag'),
      btnSpawnPacket: document.getElementById('btn-spawn-packet'),

      // CPU
      btnRunInstruction: document.getElementById('btn-run-instruction'),
      cpuActiveStageDisplay: document.getElementById('cpu-active-stage-display'),
      cpuStageDescDisplay: document.getElementById('cpu-stage-desc-display'),
      cpuCycleCountDisplay: document.getElementById('cpu-cycle-count-display'),
      cpuInstructionOpcode: document.getElementById('cpu-instruction-opcode'),
      cpuInstructionCode: document.getElementById('cpu-instruction-code'),
      cpuInstructionExplanation: document.getElementById('cpu-instruction-explanation'),
      cpuInstructionTarget: document.getElementById('cpu-instruction-target'),
      pipelineStages: document.querySelectorAll('.pipeline-stage'),

      // ALU
      aluOpButtons: document.querySelectorAll('.alu-op-btn'),
      aluInputA: document.getElementById('alu-input-a'),
      aluInputAHex: document.getElementById('alu-input-a-hex'),
      aluInputB: document.getElementById('alu-input-b'),
      aluInputBHex: document.getElementById('alu-input-b-hex'),
      aluInputBContainer: document.getElementById('alu-input-b-container'),
      aluOperatorSymbol: document.getElementById('alu-operator-symbol'),
      aluCoreElement: document.getElementById('alu-core-element'),
      aluProcessingText: document.getElementById('alu-processing-text'),
      aluResultDisplay: document.getElementById('alu-result-display'),
      aluResultHex: document.getElementById('alu-result-hex'),
      aluResultBin: document.getElementById('alu-result-bin'),
      btnAluExecute: document.getElementById('btn-alu-execute'),
      flags: {
        z: document.getElementById('flag-z'),
        n: document.getElementById('flag-n'),
        c: document.getElementById('flag-c'),
        v: document.getElementById('flag-v'),
      },

      // Registers
      registersGrid: document.getElementById('registers-grid-container'),

      // Memory
      memoryCellsGrid: document.getElementById('memory-cells-grid'),
      memAccessType: document.getElementById('mem-access-type'),
      memAccessDetail: document.getElementById('mem-access-detail'),
      memoryUsageBadge: document.getElementById('memory-usage-badge'),
      memoryLastAccessPill: document.getElementById('memory-last-access-pill'),

      // Architecture
      archNodes: document.querySelectorAll('.arch-node'),
      busContainer: document.getElementById('bus-visualizer-container'),
      archInfoTitle: document.getElementById('arch-info-title'),
      archInfoDesc: document.getElementById('arch-info-desc'),
      archInfoSpecs: document.getElementById('arch-info-specs'),

      // Log
      execLogTerminal: document.getElementById('exec-log-terminal'),
      logCounter: document.getElementById('log-counter'),
      logFilterButtons: document.querySelectorAll('.log-filter-btn'),
      btnClearLog: document.getElementById('btn-clear-log')
    };
  }

  /* =========================================================================
     VIEW INITIALIZATION
     ========================================================================= */
  initViews() {
    this.renderSensorCards();
    this.renderRegistersGrid();
    this.renderMemoryGrid();

    // Mount visualizers
    this.dataflow.init(this.dom.dataflowContainer);
    this.bus.init(this.dom.busContainer);
  }

  initCharts() {
    const canvasTemp = document.getElementById('chart-temperature');
    const canvasHum = document.getElementById('chart-humidity');

    if (canvasTemp) {
      this.tempChart = new RealtimeChart(canvasTemp, {
        label: 'Temperature History',
        unit: '°C',
        minValue: 18,
        maxValue: 45,
        lineColor: '#00d4ff',
        fillColor: 'rgba(0, 212, 255, 0.08)',
        maxPoints: 60,
        autoScale: true
      });
      this.tempChart.addPoint(28.6);
    }

    if (canvasHum) {
      this.humChart = new RealtimeChart(canvasHum, {
        label: 'Relative Humidity',
        unit: '%',
        minValue: 20,
        maxValue: 90,
        lineColor: '#00cc88',
        fillColor: 'rgba(0, 204, 136, 0.08)',
        maxPoints: 60,
        autoScale: true
      });
      this.humChart.addPoint(55.0);
    }
  }

  /* =========================================================================
     EVENT BINDINGS
     ========================================================================= */
  bindEvents() {
    // 1. Simulation Controls
    this.dom.btnSimToggle.addEventListener('click', () => {
      const state = this.engine.getState();
      if (state === 'RUNNING') {
        this.engine.pause();
      } else {
        this.engine.start();
      }
    });

    this.dom.btnSimReset.addEventListener('click', () => {
      this.engine.reset();
    });

    // 2. Navigation Routing (Requirement 14)
    this.dom.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigateToPage(page);
      });
    });

    // 3. Engine State Changes (Requirements 7, 8, 9, 11)
    this.engine.on('state-change', ({ oldState, newState }) => {
      this.handleStateChange(newState);
    });

    this.engine.on('reset', () => {
      this.handleReset();
    });

    // 4. Subsystem Events
    this.engine.on('sensor-update', (data) => this.handleSensorUpdate(data));
    this.engine.on('alert', (alert) => this.handleAlert(alert));
    this.engine.on('cpu-stage', (data) => this.handleCpuStage(data));
    this.engine.on('cpu-cycle-complete', (data) => this.handleCpuCycleComplete(data));
    this.engine.on('register-update', (data) => this.handleRegisterUpdate(data));
    this.engine.on('memory-access', (data) => this.handleMemoryAccess(data));
    this.engine.on('alu-operation', (data) => this.handleAluOperation(data));
    this.engine.on('bus-click', (bus) => this.handleBusClick(bus));
    this.engine.on('node-click', (node) => this.handleNodeClick(node));
    this.logger.on('entry', (entry) => this.handleLogEntry(entry));
    this.logger.on('clear', () => this.handleLogClear());

    // 5. Interactive Triggers
    this.dom.btnRunInstruction.addEventListener('click', () => {
      this.cpu.runInstruction(700);
      this.logger.log('Manual single-instruction cycle initiated', 'cpu');
    });

    this.dom.btnSpawnPacket.addEventListener('click', () => {
      const tempSensor = this.sensors.getSensor('temperature');
      const valStr = tempSensor ? `${tempSensor.value.toFixed(1)}${tempSensor.unit}` : '28.6°C';
      this.dataflow.spawnPacket(valStr);
      this.logger.log(`Manual transducer packet injected: ${valStr}`, 'io');
    });

    // ALU Operator Buttons
    this.dom.aluOpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.aluOpButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedAluOp = btn.dataset.op;
        this.dom.aluOperatorSymbol.textContent = this.alu.getSymbol(this.selectedAluOp);
        
        // Hide input B for unary NOT
        if (this.selectedAluOp === 'NOT') {
          this.dom.aluInputBContainer.style.display = 'none';
        } else {
          this.dom.aluInputBContainer.style.display = 'flex';
        }
        
        this.executeAluCalculation();
      });
    });

    const updateHexInputs = () => {
      const valA = parseInt(this.dom.aluInputA.value, 10) || 0;
      const valB = parseInt(this.dom.aluInputB.value, 10) || 0;
      this.dom.aluInputAHex.textContent = formatHex(valA, 2);
      this.dom.aluInputBHex.textContent = formatHex(valB, 2);
    };

    this.dom.aluInputA.addEventListener('input', () => {
      updateHexInputs();
      this.executeAluCalculation();
    });

    this.dom.aluInputB.addEventListener('input', () => {
      updateHexInputs();
      this.executeAluCalculation();
    });

    this.dom.btnAluExecute.addEventListener('click', () => {
      this.executeAluCalculation(true);
    });

    // Architecture Block clicks (Requirement 15)
    this.dom.archNodes.forEach(node => {
      node.addEventListener('click', () => {
        const comp = node.dataset.comp;
        this.handleArchitectureClick(comp, node);
      });
    });

    // Log category filters
    this.dom.logFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.logFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLogFilter = btn.dataset.cat;
        this.filterLogEntries();
      });
    });

    this.dom.btnClearLog.addEventListener('click', () => {
      this.logger.clear();
    });
  }

  /* =========================================================================
     SIMULATION STATE MACHINE (Requirements 7, 8, 9, 11)
     ========================================================================= */
  handleStateChange(state) {
    if (state === 'RUNNING') {
      this.dom.btnSimToggle.className = 'btn btn-primary btn-lg';
      this.dom.btnSimToggleIcon.textContent = '⏸';
      this.dom.btnSimToggleText.textContent = 'PAUSE SIMULATION';
      this.dom.liveIndicator.style.display = 'inline-block';

      this.dom.topbarStatusText.textContent = 'RUNNING';
      this.dom.topbarCpu.textContent = 'ACTIVE';
      this.dom.topbarCpu.style.color = 'var(--accent-cyan)';
      this.dom.topbarIo.textContent = 'ACTIVE';
      this.dom.topbarIo.style.color = 'var(--success)';

      if (this.tempChart) this.tempChart.start();
      if (this.humChart) this.humChart.start();

      this.logger.log('System clock active: pipeline processing initiated', 'system');
    } else if (state === 'PAUSED') {
      this.dom.btnSimToggle.className = 'btn btn-primary';
      this.dom.btnSimToggleIcon.textContent = '▶';
      this.dom.btnSimToggleText.textContent = 'RESUME SIMULATION';
      this.dom.liveIndicator.style.display = 'none';

      this.dom.topbarStatusText.textContent = 'PAUSED';
      this.dom.topbarCpu.textContent = 'PAUSED';
      this.dom.topbarCpu.style.color = 'var(--warning)';
      this.dom.topbarIo.textContent = 'PAUSED';
      this.dom.topbarIo.style.color = 'var(--warning)';

      if (this.tempChart) this.tempChart.stop();
      if (this.humChart) this.humChart.stop();

      this.logger.log('Simulation paused: clock halted at current state', 'system');
    } else if (state === 'READY') {
      this.dom.btnSimToggle.className = 'btn btn-primary';
      this.dom.btnSimToggleIcon.textContent = '▶';
      this.dom.btnSimToggleText.textContent = 'START SIMULATION';
      this.dom.liveIndicator.style.display = 'none';

      this.dom.topbarStatusText.textContent = 'ONLINE';
      this.dom.topbarCpu.textContent = 'IDLE';
      this.dom.topbarCpu.style.color = 'var(--silver-dim)';
      this.dom.topbarIo.textContent = 'STANDBY';
      this.dom.topbarIo.style.color = 'var(--silver-dim)';

      if (this.tempChart) this.tempChart.stop();
      if (this.humChart) this.humChart.stop();
    }
  }

  handleReset() {
    this.logger.clear();
    this.alerts = [];
    this.dom.dashboardAlertsList.innerHTML = `
      <div style="color: var(--text-muted); font-size: var(--font-size-xs); padding: 12px; text-align: center;">
        All sensor readings within normal operating parameters.
      </div>
    `;
    this.dom.alertsCountBadge.textContent = '0 ALERTS';

    if (this.tempChart) this.tempChart.reset();
    if (this.humChart) this.humChart.reset();

    // Reset CPU Pipeline display
    this.dom.cpuActiveStageDisplay.textContent = 'IDLE';
    this.dom.cpuStageDescDisplay.textContent = 'System reset. Waiting for CPU clock or trigger.';
    this.dom.cpuCycleCountDisplay.textContent = '0';
    this.dom.pipelineStages.forEach(st => st.classList.remove('active', 'stage-active'));

    // Reset Memory pill
    this.dom.memAccessType.textContent = 'IDLE';
    this.dom.memAccessDetail.textContent = 'Memory array reset to initial boot vector';
    this.dom.memoryLastAccessPill.className = 'memory-action-pill';
    this.dom.memoryUsageBadge.textContent = `${this.memory.getUsage()}% USED`;
    this.dom.topbarMemory.textContent = `${this.memory.getUsage()}%`;

    // Re-render components
    this.renderSensorCards();
    this.renderRegistersGrid();
    this.renderMemoryGrid();

    this.logger.log('Hardware reset: RAM and registers cleared to boot defaults', 'system');
  }

  /* =========================================================================
     NAVIGATION ROUTING (Requirement 14)
     ========================================================================= */
  navigateToPage(pageId) {
    if (this.currentPage === pageId) return;
    this.currentPage = pageId;

    this.dom.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    this.dom.pageViews.forEach(view => {
      const isActive = view.id === `page-${pageId}`;
      view.classList.toggle('active', isActive);
      if (isActive && !reducedMotion) {
        view.classList.remove('page-enter');
        void view.offsetWidth; // trigger reflow
        view.classList.add('page-enter');
      }
    });

    // Subsystem re-alignments when view becomes visible
    if (pageId === 'dataflow') {
      setTimeout(() => this.dataflow.resize(), 50);
    } else if (pageId === 'dashboard') {
      setTimeout(() => {
        if (this.tempChart) this.tempChart.resize();
        if (this.humChart) this.humChart.resize();
      }, 50);
    }
  }

  /* =========================================================================
     SENSOR LOGIC & RENDERING (Requirements 1, 10, 18)
     ========================================================================= */
  renderSensorCards() {
    this.dom.sensorCardsGrid.innerHTML = '';
    const allSensors = this.sensors.getAll();

    allSensors.forEach(sensor => {
      const card = document.createElement('div');
      card.className = `sensor-card card--${sensor.status.toLowerCase()}`;
      card.id = `sensor-card-${sensor.id}`;

      card.innerHTML = `
        <div class="sensor-card__header">
          <div class="sensor-card__title-wrap">
            <span class="sensor-card__icon">${sensor.icon}</span>
            <span class="sensor-card__name">${sensor.name}</span>
          </div>
          <span class="pulse-dot pulse-dot--${sensor.status === 'NORMAL' ? 'active' : sensor.status.toLowerCase()}" id="pulse-${sensor.id}"></span>
        </div>

        <div class="sensor-card__value-wrap" id="valwrap-${sensor.id}">
          <span class="sensor-card__value" id="val-${sensor.id}">${sensor.value.toFixed(sensor.precision)}</span>
          <span class="sensor-card__unit">${sensor.unit}</span>
        </div>

        <div class="sensor-card__footer">
          <span class="badge badge-${sensor.status === 'NORMAL' ? 'success' : sensor.status === 'WARNING' ? 'warning' : 'danger'}" id="status-badge-${sensor.id}">
            ${sensor.status}
          </span>
          <span class="sensor-card__thresholds">
            WARN &gt; ${sensor.warnThreshold}${sensor.unit}
          </span>
        </div>
      `;

      this.dom.sensorCardsGrid.appendChild(card);
    });
  }

  handleSensorUpdate({ sensor, significantChange, statusChanged }) {
    const valEl = document.getElementById(`val-${sensor.id}`);
    const valWrap = document.getElementById(`valwrap-${sensor.id}`);
    const cardEl = document.getElementById(`sensor-card-${sensor.id}`);
    const badgeEl = document.getElementById(`status-badge-${sensor.id}`);
    const pulseEl = document.getElementById(`pulse-${sensor.id}`);

    if (valEl) {
      animateValue(valEl, sensor.prevValue, sensor.value, 280, v => v.toFixed(sensor.precision));
    }

    if (significantChange && valWrap) {
      flashHighlight(valWrap);
    }

    if (statusChanged && cardEl && badgeEl && pulseEl) {
      cardEl.className = `sensor-card card--${sensor.status.toLowerCase()}`;
      badgeEl.className = `badge badge-${sensor.status === 'NORMAL' ? 'success' : sensor.status === 'WARNING' ? 'warning' : 'danger'}`;
      badgeEl.textContent = sensor.status;
      pulseEl.className = `pulse-dot pulse-dot--${sensor.status === 'NORMAL' ? 'active' : sensor.status.toLowerCase()}`;
    }

    // Append to charts if simulation is running
    if (this.engine.getState() === 'RUNNING') {
      if (sensor.id === 'temperature' && this.tempChart) {
        this.tempChart.addPoint(sensor.value);
      } else if (sensor.id === 'humidity' && this.humChart) {
        this.humChart.addPoint(sensor.value);
      }
    }
  }

  handleAlert(alert) {
    this.alerts.unshift(alert);
    if (this.alerts.length > 20) this.alerts.pop();

    this.dom.alertsCountBadge.textContent = `${this.alerts.length} ALERTS`;
    this.dom.alertsCountBadge.className = 'badge badge-warning';

    const item = document.createElement('div');
    item.className = `alert-item alert-item--${alert.level.toLowerCase()}`;
    item.innerHTML = `
      <span class="alert-item__time">${formatTime()}</span>
      <span class="alert-item__msg">${alert.message}</span>
    `;

    if (this.dom.dashboardAlertsList.children.length === 1 &&
        this.dom.dashboardAlertsList.firstElementChild.textContent.includes('normal')) {
      this.dom.dashboardAlertsList.innerHTML = '';
    }

    this.dom.dashboardAlertsList.insertBefore(item, this.dom.dashboardAlertsList.firstChild);
    this.logger.log(`ALERT [${alert.level}]: ${alert.message}`, 'alert');
  }

  /* =========================================================================
     CPU PIPELINE (Requirements 3, 17)
     ========================================================================= */
  handleCpuStage({ stage, description, instruction, stageIndex, cycleCount }) {
    this.dom.cpuActiveStageDisplay.textContent = stage;
    this.dom.cpuStageDescDisplay.textContent = description;
    this.dom.cpuCycleCountDisplay.textContent = cycleCount.toString();

    // Update active highlight on stages track
    this.dom.pipelineStages.forEach(st => {
      const match = st.dataset.stage === stage;
      st.classList.toggle('active', match);
      st.classList.toggle('stage-active', match);
    });

    if (instruction) {
      this.dom.cpuInstructionOpcode.textContent = instruction.opcode;
      this.dom.cpuInstructionCode.textContent = instruction.code;
      this.dom.cpuInstructionExplanation.textContent = instruction.desc;
    }

    // Execute realistic side-effects during CPU pipeline stages
    if (stage === 'EXECUTE' && instruction && instruction.memOp === 'READ') {
      this.memory.read(instruction.targetMem);
    } else if (stage === 'STORE' && instruction) {
      if (instruction.memOp === 'WRITE') {
        const val = this.registers.get('R1') || 38;
        this.memory.write(instruction.targetMem, val);
      } else if (instruction.targetReg) {
        const simVal = Math.floor(20 + Math.random() * 50);
        this.registers.set(instruction.targetReg, simVal);
      }
    }

    this.logger.log(`CPU [${stage}]: ${instruction ? instruction.code : 'Idle cycle'}`, 'cpu');
  }

  handleCpuCycleComplete({ instruction, cycleCount }) {
    this.logger.log(`Instruction completed [Cycle #${cycleCount}]: ${instruction.code}`, 'cpu');
  }

  /* =========================================================================
     REGISTER FILE (Requirement 4)
     ========================================================================= */
  renderRegistersGrid() {
    this.dom.registersGrid.innerHTML = '';
    const allRegs = this.registers.getAll();

    Object.entries(allRegs).forEach(([name, data]) => {
      const card = document.createElement('div');
      card.className = 'register-card';
      card.id = `reg-card-${name}`;

      const pct = Math.round((data.value / 255) * 100);

      card.innerHTML = `
        <div class="register-card__top">
          <span class="register-card__name">${name}</span>
          <span class="register-card__update-badge" id="reg-badge-${name}">UPDATED</span>
        </div>
        <div class="register-card__values">
          <span class="register-card__val-dec" id="reg-dec-${name}">${data.value}</span>
          <span class="register-card__val-hex" id="reg-hex-${name}">${data.hex}</span>
        </div>
        <div class="register-card__bar-wrap">
          <div class="register-card__bar" id="reg-bar-${name}" style="width: ${pct}%;"></div>
        </div>
      `;

      this.dom.registersGrid.appendChild(card);
    });
  }

  handleRegisterUpdate({ register, oldValue, newValue, newValueHex }) {
    const decEl = document.getElementById(`reg-dec-${register}`);
    const hexEl = document.getElementById(`reg-hex-${register}`);
    const barEl = document.getElementById(`reg-bar-${register}`);
    const badgeEl = document.getElementById(`reg-badge-${register}`);
    const cardEl = document.getElementById(`reg-card-${register}`);

    if (decEl) {
      animateValue(decEl, oldValue, newValue, 250, v => Math.round(v).toString());
    }

    if (hexEl) hexEl.textContent = newValueHex;
    if (barEl) barEl.style.width = `${Math.round((newValue / 255) * 100)}%`;

    if (cardEl && !reducedMotion) {
      cardEl.classList.add('updated');
      setTimeout(() => cardEl.classList.remove('updated'), 600);
    }

    if (badgeEl) {
      badgeEl.textContent = `${register} UPDATED`;
      badgeEl.classList.add('show');
      setTimeout(() => badgeEl.classList.remove('show'), 1200);
    }

    this.logger.log(`Register ${register} updated: ${oldValue} → ${newValue} (${newValueHex})`, 'cpu');
  }

  /* =========================================================================
     MEMORY SUBSYSTEM (Requirement 5)
     ========================================================================= */
  renderMemoryGrid() {
    this.dom.memoryCellsGrid.innerHTML = '';
    const dump = this.memory.dump();

    dump.forEach(cell => {
      const cellEl = document.createElement('div');
      cellEl.className = 'memory-cell';
      cellEl.id = `mem-cell-${cell.address}`;
      cellEl.dataset.address = cell.address;

      cellEl.innerHTML = `
        <span class="memory-cell__addr">${cell.addressHex}</span>
        <span class="memory-cell__val" id="mem-val-${cell.address}">${cell.valueHex}</span>
      `;

      cellEl.addEventListener('click', () => {
        // Toggle simulated read on click
        this.memory.read(cell.address);
      });

      this.dom.memoryCellsGrid.appendChild(cellEl);
    });

    const usage = this.memory.getUsage();
    this.dom.memoryUsageBadge.textContent = `${usage}% USED`;
    this.dom.topbarMemory.textContent = `${usage}%`;
  }

  handleMemoryAccess({ address, addressHex, type, value, valueHex }) {
    const cellEl = document.getElementById(`mem-cell-${address}`);
    const valEl = document.getElementById(`mem-val-${address}`);

    if (valEl) valEl.textContent = valueHex;

    if (cellEl && !reducedMotion) {
      const activeClass = type === 'READ' ? 'accessed-read' : 'accessed-write';
      cellEl.classList.add(activeClass);
      setTimeout(() => cellEl.classList.remove(activeClass), 500);
    }

    // Telemetry strip notification
    this.dom.memAccessType.textContent = type;
    this.dom.memAccessDetail.textContent = `${addressHex} → ${type} → ${value} (${valueHex})`;
    this.dom.memoryLastAccessPill.className = `memory-action-pill ${type === 'READ' ? 'read-flash' : 'write-flash'}`;

    const usage = this.memory.getUsage();
    this.dom.memoryUsageBadge.textContent = `${usage}% USED`;
    this.dom.topbarMemory.textContent = `${usage}%`;

    this.logger.log(`RAM ${type} cycle at ${addressHex}: payload = ${valueHex} (${value})`, 'memory');
  }

  /* =========================================================================
     ALU WORKBENCH (Requirement 6)
     ========================================================================= */
  executeAluCalculation(withAnimation = true) {
    const valA = parseInt(this.dom.aluInputA.value, 10) || 0;
    const valB = parseInt(this.dom.aluInputB.value, 10) || 0;
    const op = this.selectedAluOp;

    if (withAnimation && !reducedMotion) {
      this.dom.aluCoreElement.classList.add('processing');
      this.dom.aluProcessingText.textContent = `COMPUTING ${op}...`;

      setTimeout(() => {
        this.dom.aluCoreElement.classList.remove('processing');
        this.dom.aluProcessingText.textContent = 'EXECUTION COMPLETED';
        this.alu.execute(op, valA, valB);
      }, 220);
    } else {
      this.alu.execute(op, valA, valB);
    }
  }

  handleAluOperation({ op, symbol, inputA, inputB, result, resultHex, resultBin, flags }) {
    this.dom.aluResultDisplay.textContent = result.toString();
    this.dom.aluResultHex.textContent = resultHex;
    this.dom.aluResultBin.textContent = resultBin;

    // Condition Flags
    this.dom.flags.z.textContent = `Z: ${flags.zero ? '1' : '0'}`;
    this.dom.flags.z.classList.toggle('active', flags.zero);

    this.dom.flags.n.textContent = `N: ${flags.negative ? '1' : '0'}`;
    this.dom.flags.n.classList.toggle('active', flags.negative);

    this.dom.flags.c.textContent = `C: ${flags.carry ? '1' : '0'}`;
    this.dom.flags.c.classList.toggle('active', flags.carry);

    this.dom.flags.v.textContent = `V: ${flags.overflow ? '1' : '0'}`;
    this.dom.flags.v.classList.toggle('active', flags.overflow);

    const logStr = op === 'NOT'
      ? `ALU NOT ~(${inputA}) = ${result} (${resultHex})`
      : `ALU ${op}: ${inputA} ${symbol} ${inputB} = ${result} (${resultHex})`;

    this.logger.log(logStr, 'alu');
  }

  /* =========================================================================
     ARCHITECTURE & BUSES (Requirements 15, 16)
     ========================================================================= */
  handleArchitectureClick(comp, element) {
    this.dom.archNodes.forEach(n => n.classList.remove('selected'));
    if (element) element.classList.add('selected');

    const COMP_INFO = {
      cpu: {
        title: 'Central Processing Unit (CPU)',
        desc: 'Coordinates overall instruction sequencing, execution, and timing. Integrates the Control Unit, Arithmetic Logic Unit, and internal scratchpad registers.',
        specs: ['Clock: Synchronous single-phase', 'Execution: 4-stage pipeline', 'Control: Micro-coded control sequencer']
      },
      registers: {
        title: 'Internal Register File (R0-R7, PC, SP)',
        desc: 'Registers are ultra-fast static flip-flop storage locations inside the CPU core. They eliminate memory latency when holding immediate operands, addresses, and return pointers.',
        specs: ['Access Time: Single clock cycle (<1 ns equivalent)', 'Array Size: 8 general + 3 special', 'Width: 8-bit native operands']
      },
      alu: {
        title: 'Arithmetic Logic Unit (ALU)',
        desc: 'High-speed combinatorial logic performing binary additions, subtractions, bitwise boolean operations, and comparisons. Updates CPU status flags (Z, N, C, V).',
        specs: ['Operations: ADD, SUB, AND, OR, XOR, NOT, CMP', 'Arithmetic: 8-bit Two\'s Complement', 'Flags: Zero, Negative, Carry, Overflow']
      },
      memory: {
        title: 'System Memory (Static RAM)',
        desc: 'Primary unified byte-addressable random access memory holding machine instructions, runtime call stack, sensor calibration matrices, and telemetry circular queues.',
        specs: ['Capacity: 64 Bytes simulated address space', 'Address Bus: 16-bit address line', 'Cycles: 1 clock memory read/write latency']
      },
      io: {
        title: 'I/O Peripheral Controller',
        desc: 'Interfaces physical analog/digital sensor transducers (temperature, light, proximity) via on-chip Analog-to-Digital converters (ADC) and serial UART/SPI links.',
        specs: ['Sampling: Continuous 800ms cycle', 'Conversion: 10-bit successive approximation', 'Interrupt: Edge-triggered alert IRQs']
      }
    };

    const info = COMP_INFO[comp] || COMP_INFO.cpu;
    this.dom.archInfoTitle.textContent = info.title;
    this.dom.archInfoDesc.textContent = info.desc;
    this.dom.archInfoSpecs.innerHTML = info.specs.map(s => `<div>${s}</div>`).join('');

    this.logger.log(`Inspected architectural subsystem: ${info.title}`, 'system');
  }

  handleBusClick(bus) {
    if (!bus) return;
    this.dom.archNodes.forEach(n => n.classList.remove('selected'));

    this.dom.archInfoTitle.textContent = `${bus.label} (System Bus)`;
    this.dom.archInfoDesc.textContent = bus.description;
    this.dom.archInfoSpecs.innerHTML = `
      <div>DIRECTION: ${bus.direction}</div>
      <div>ROLE: High-speed interconnect line</div>
      <div>STATUS: Continuous synchronous telemetry clock</div>
    `;

    this.logger.log(`Bus inspector opened: ${bus.label}`, 'system');
  }

  handleNodeClick(node) {
    this.dom.flowDetailBadge.textContent = node.label;
    this.dom.flowDetailText.textContent = node.desc;
    this.dom.flowDetailPacketTag.textContent = `STAGE ${node.index + 1} OF 8`;
    this.logger.log(`Inspected data flow stage: ${node.label}`, 'io');
  }

  /* =========================================================================
     EXECUTION LOG TERMINAL (Requirement 12)
     ========================================================================= */
  handleLogEntry(entry) {
    const el = document.createElement('div');
    el.className = `log-entry log-entry--${entry.category} ${reducedMotion ? '' : 'log-entry-new'}`;
    el.dataset.category = entry.category;

    el.innerHTML = `
      <span class="log-entry__time">${entry.timestamp}</span>
      <span class="log-entry__badge log-entry__badge--${entry.category}">${entry.category}</span>
      <span class="log-entry__msg">${entry.message}</span>
    `;

    // Filter check
    if (this.currentLogFilter !== 'all' && this.currentLogFilter !== entry.category) {
      el.style.display = 'none';
    }

    this.dom.execLogTerminal.appendChild(el);
    this.dom.logCounter.textContent = `${this.logger.getEntries().length} ENTRIES`;

    // Auto-scroll if user hasn't scrolled up
    const isAtBottom = this.dom.execLogTerminal.scrollHeight - this.dom.execLogTerminal.clientHeight <= this.dom.execLogTerminal.scrollTop + 40;
    if (isAtBottom) {
      this.dom.execLogTerminal.scrollTop = this.dom.execLogTerminal.scrollHeight;
    }
  }

  handleLogClear() {
    this.dom.execLogTerminal.innerHTML = '';
    this.dom.logCounter.textContent = '0 ENTRIES';
  }

  filterLogEntries() {
    const children = this.dom.execLogTerminal.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (this.currentLogFilter === 'all' || child.dataset.category === this.currentLogFilter) {
        child.style.display = 'flex';
      } else {
        child.style.display = 'none';
      }
    }
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.senseCoreApp = new SenseCoreApp();
});
