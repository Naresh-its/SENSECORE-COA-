// SENSECORE - Standalone Embedded Architecture Simulator Controller
(function() {
  'use strict';

  /* =========================================================================
     1. UTILITIES & EVENT EMITTER
     ========================================================================= */
  const reducedMotion = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function lerp(a, b, t) { 
    return a + (b - a) * t; 
  }

  function clamp(val, min, max) { 
    return Math.min(Math.max(val, min), max); 
  }

  function formatHex(num, digits = 4) {
    return '0x' + (Number(num) || 0).toString(16).toUpperCase().padStart(digits, '0');
  }

  function formatTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
  }

  function animateValue(element, start, end, duration = 280, formatFn = v => v.toFixed(1)) {
    if (!element) return;
    if (reducedMotion || duration <= 0 || typeof window === 'undefined') {
      element.textContent = formatFn(end);
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = lerp(start, end, easeProgress);
      
      element.textContent = formatFn(current);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = formatFn(end);
      }
    };
    window.requestAnimationFrame(step);
  }

  function flashHighlight(element) {
    if (!element || reducedMotion) return;
    element.classList.remove('highlight-flash');
    void element.offsetWidth;
    element.classList.add('highlight-flash');
    setTimeout(() => {
      if (element) element.classList.remove('highlight-flash');
    }, 700);
  }

  function smoothRandom(prevValue, min, max, maxDelta) {
    const rawDelta = (Math.random() - 0.5) * 2 * maxDelta;
    const newVal = prevValue + rawDelta;
    return clamp(newVal, min, max);
  }

  class EventEmitter {
    constructor() { 
      this._listeners = new Map(); 
    }
    
    on(event, fn) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event).push(fn);
    }
    
    off(event, fn) {
      if (!this._listeners.has(event)) return;
      const callbacks = this._listeners.get(event);
      const index = callbacks.indexOf(fn);
      if (index !== -1) callbacks.splice(index, 1);
    }
    
    emit(event, data) {
      if (!this._listeners.has(event)) return;
      const callbacks = this._listeners.get(event).slice();
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      }
    }
    
    removeAll() {
      this._listeners.clear();
    }
  }

  /* =========================================================================
     2. SIMULATION ENGINE
     ========================================================================= */
  class SimulationEngine extends EventEmitter {
    constructor() {
      super();
      this.state = 'READY'; // 'READY' | 'RUNNING' | 'PAUSED'
      this._animFrameId = null;
      this._tickRate = 800;
      this._lastTick = 0;
      this._modules = [];
      this._autoPaused = false;
      
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden && this.state === 'RUNNING') {
            this._autoPaused = true;
            this.pause();
          } else if (!document.hidden && this.state === 'PAUSED' && this._autoPaused) {
            this._autoPaused = false;
            this.resume();
          }
        });
      }
    }
    
    registerModule(module) { 
      if (module && !this._modules.includes(module)) {
        this._modules.push(module); 
      }
    }
    
    start() {
      if (this.state === 'RUNNING') return;
      const oldState = this.state;
      this.state = 'RUNNING';
      
      this._modules.forEach(m => {
        if (typeof m.start === 'function') m.start();
      });
      
      this.emit('state-change', { oldState, newState: 'RUNNING' });
      this._startLoop();
    }
    
    pause() {
      if (this.state !== 'RUNNING') return;
      this.state = 'PAUSED';
      
      this._modules.forEach(m => {
        if (typeof m.stop === 'function') m.stop();
      });
      
      this._stopLoop();
      this.emit('state-change', { oldState: 'RUNNING', newState: 'PAUSED' });
    }
    
    resume() { 
      this.start(); 
    }
    
    reset() {
      this._stopLoop();
      const oldState = this.state;
      this.state = 'READY';
      
      this._modules.forEach(m => {
        if (typeof m.reset === 'function') m.reset();
      });
      
      this.emit('state-change', { oldState, newState: 'READY' });
      this.emit('reset');
    }
    
    _startLoop() {
      this._lastTick = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const tick = (now) => {
        if (this.state !== 'RUNNING') return;
        const curTime = now || (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (curTime - this._lastTick >= this._tickRate) {
          this._lastTick = curTime;
          this._modules.forEach(m => {
            if (typeof m.tick === 'function') {
              try {
                m.tick();
              } catch (err) {
                console.error('Error during module tick:', err);
              }
            }
          });
          this.emit('tick');
        }
        if (typeof requestAnimationFrame === 'function') {
          this._animFrameId = requestAnimationFrame(tick);
        } else {
          this._animFrameId = setTimeout(() => tick(), 50);
        }
      };
      if (typeof requestAnimationFrame === 'function') {
        this._animFrameId = requestAnimationFrame(tick);
      } else {
        this._animFrameId = setTimeout(() => tick(), 50);
      }
    }
    
    _stopLoop() {
      if (this._animFrameId) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this._animFrameId);
        } else {
          clearTimeout(this._animFrameId);
        }
        this._animFrameId = null;
      }
    }
    
    getState() { 
      return this.state; 
    }
  }

  /* =========================================================================
     3. LOGGER
     ========================================================================= */
  class Logger extends EventEmitter {
    constructor(maxEntries = 250) {
      super();
      this.entries = [];
      this.maxEntries = maxEntries;
    }
    
    log(message, category = 'system') {
      const entry = {
        timestamp: formatTime(),
        message,
        category,
        id: Date.now() + Math.random()
      };
      this.entries.push(entry);
      if (this.entries.length > this.maxEntries) {
        this.entries.shift();
      }
      this.emit('entry', entry);
      return entry;
    }
    
    clear() {
      this.entries = [];
      this.emit('clear');
    }
    
    getEntries() { 
      return this.entries; 
    }
  }

  /* =========================================================================
     4. REALTIME CHART
     ========================================================================= */
  class RealtimeChart {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.data = [];
      this.maxPoints = options.maxPoints || 60;
      this.minValue = options.minValue ?? 0;
      this.maxValue = options.maxValue ?? 100;
      this.autoScale = options.autoScale ?? false;
      this.lineColor = options.lineColor || '#00d4ff';
      this.fillColor = options.fillColor || 'rgba(0, 212, 255, 0.08)';
      this.gridColor = options.gridColor || 'rgba(255, 255, 255, 0.05)';
      this.labelColor = options.labelColor || '#8888a0';
      this.lineWidth = options.lineWidth || 2;
      this.label = options.label || '';
      this.unit = options.unit || '';
      this._running = false;
      
      this.resize = this.resize.bind(this);
      this._setupCanvas();
      window.addEventListener('resize', this.resize);
    }
    
    _setupCanvas() {
      const parent = this.canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const w = Math.max(rect.width || 280, 200);
      const h = Math.max(rect.height || 160, 140);
      
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.width = w;
      this.height = h;
      
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
    }
    
    addPoint(value) {
      this.data.push({ value, timestamp: Date.now() });
      if (this.data.length > this.maxPoints) {
        this.data.shift();
      }
      this.render();
    }
    
    render() {
      const ctx = this.ctx;
      const { width, height } = this;
      const padding = { top: 22, right: 12, bottom: 24, left: 42 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;
      
      ctx.clearRect(0, 0, width, height);
      
      let minVal = this.minValue;
      let maxVal = this.maxValue;
      if (this.autoScale && this.data.length > 0) {
        const values = this.data.map(d => d.value);
        const dataMin = Math.min(...values);
        const dataMax = Math.max(...values);
        if (dataMax === dataMin) {
          minVal = dataMin - 4;
          maxVal = dataMax + 4;
        } else {
          const margin = (dataMax - dataMin) * 0.15;
          minVal = dataMin - margin;
          maxVal = dataMax + margin;
        }
      }
      const range = maxVal - minVal || 1;
      
      // Grid lines
      ctx.strokeStyle = this.gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        
        const val = maxVal - (range / 4) * i;
        ctx.fillStyle = this.labelColor;
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), padding.left - 6, y + 3);
      }
      ctx.setLineDash([]);
      
      if (this.label) {
        ctx.fillStyle = this.labelColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(this.label + (this.unit ? ` (${this.unit})` : ''), padding.left, padding.top - 7);
      }

      if (this.data.length < 2) return;
      
      const stepX = chartWidth / (this.maxPoints - 1);
      
      // Draw path
      ctx.beginPath();
      for (let i = 0; i < this.data.length; i++) {
        const x = padding.left + i * stepX;
        const normalized = (this.data[i].value - minVal) / range;
        const y = padding.top + chartHeight * (1 - normalized);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = this.lineColor;
      ctx.lineWidth = this.lineWidth;
      ctx.lineJoin = 'round';
      ctx.stroke();
      
      // Fill
      const lastX = padding.left + (this.data.length - 1) * stepX;
      ctx.lineTo(lastX, padding.top + chartHeight);
      ctx.lineTo(padding.left, padding.top + chartHeight);
      ctx.closePath();
      ctx.fillStyle = this.fillColor;
      ctx.fill();
      
      // Latest Dot
      const last = this.data[this.data.length - 1];
      const x = padding.left + (this.data.length - 1) * stepX;
      const normalized = (last.value - minVal) / range;
      const y = padding.top + chartHeight * (1 - normalized);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.lineColor;
      ctx.fill();
    }
    
    start() { this._running = true; }
    stop() { this._running = false; }
    reset() { this.data = []; this.render(); }
    resize() { this._setupCanvas(); this.render(); }
  }

  /* =========================================================================
     5. SENSOR MANAGER
     ========================================================================= */
  const SENSOR_CONFIGS = [
    { id: 'temperature', name: 'Temperature', unit: '°C', icon: '🌡️', min: 18.0, max: 48.0, defaultValue: 28.6, maxDelta: 0.35, warnThreshold: 35.0, critThreshold: 40.0, precision: 1 },
    { id: 'humidity',    name: 'Humidity',    unit: '%',  icon: '💧', min: 25.0, max: 88.0, defaultValue: 55.0, maxDelta: 0.6,  warnThreshold: 70.0, critThreshold: 80.0, precision: 1 },
    { id: 'pressure',    name: 'Barometer',   unit: 'hPa',icon: '🔵', min: 995.0, max: 1030.0, defaultValue: 1013.2, maxDelta: 0.25, warnThreshold: 1024.0, critThreshold: 1028.0, precision: 1 },
    { id: 'light',       name: 'Ambient Light', unit: 'lux', icon: '☀️', min: 50, max: 1200, defaultValue: 480, maxDelta: 10, warnThreshold: 850, critThreshold: 1000, precision: 0 },
    { id: 'gas',         name: 'Air Quality', unit: 'AQI', icon: '🍃', min: 10, max: 350, defaultValue: 42, maxDelta: 3, warnThreshold: 120, critThreshold: 180, precision: 0 },
    { id: 'proximity',   name: 'Proximity',   unit: 'cm',  icon: '📡', min: 2.0, max: 100.0, defaultValue: 50.0, maxDelta: 2.0, warnThreshold: 15.0, critThreshold: 6.0, precision: 1 }
  ];

  class SensorManager {
    constructor(engine) {
      this.engine = engine;
      this.sensors = SENSOR_CONFIGS.map(cfg => ({
        ...cfg,
        value: cfg.defaultValue,
        prevValue: cfg.defaultValue,
        status: 'NORMAL',
        history: [cfg.defaultValue]
      }));
    }
    
    tick() {
      this.sensors.forEach(sensor => {
        sensor.prevValue = sensor.value;
        sensor.value = smoothRandom(sensor.value, sensor.min, sensor.max, sensor.maxDelta);
        
        if (Math.random() < 0.015) {
          sensor.value += (Math.random() - 0.4) * sensor.maxDelta * 4;
          sensor.value = Math.max(sensor.min, Math.min(sensor.max, sensor.value));
        }
        
        const prevStatus = sensor.status;
        sensor.status = this._getStatus(sensor);
        
        sensor.history.push(sensor.value);
        if (sensor.history.length > 60) sensor.history.shift();
        
        const span = sensor.max - sensor.min;
        const significantChange = Math.abs(sensor.value - sensor.prevValue) >= (span * 0.015);
        
        this.engine.emit('sensor-update', {
          sensor,
          significantChange,
          statusChanged: prevStatus !== sensor.status
        });
        
        if (prevStatus !== sensor.status && sensor.status !== 'NORMAL') {
          this.engine.emit('alert', {
            sensor,
            level: sensor.status,
            message: `${sensor.name} reading ${sensor.value.toFixed(sensor.precision)}${sensor.unit} reached ${sensor.status} threshold`
          });
        }
      });
    }
    
    _getStatus(sensor) {
      if (sensor.id === 'proximity') {
        if (sensor.value <= sensor.critThreshold) return 'CRITICAL';
        if (sensor.value <= sensor.warnThreshold) return 'WARNING';
        return 'NORMAL';
      }
      if (sensor.value >= sensor.critThreshold) return 'CRITICAL';
      if (sensor.value >= sensor.warnThreshold) return 'WARNING';
      return 'NORMAL';
    }
    
    getSensor(id) {
      return this.sensors.find(s => s.id === id);
    }
    
    getAll() {
      return this.sensors;
    }
    
    reset() {
      this.sensors.forEach(sensor => {
        sensor.value = sensor.defaultValue;
        sensor.prevValue = sensor.defaultValue;
        sensor.status = 'NORMAL';
        sensor.history = [sensor.defaultValue];
      });
      this.engine.emit('sensors-reset');
    }
  }

  /* =========================================================================
     6. CPU PIPELINE
     ========================================================================= */
  const STAGES = ['FETCH', 'DECODE', 'EXECUTE', 'STORE'];

  const STAGE_DESCRIPTIONS = {
    FETCH: 'Instruction retrieved from memory at [PC] into Instruction Register',
    DECODE: 'Control Unit interprets opcode and evaluates operand addressing modes',
    EXECUTE: 'ALU performs arithmetic/logic or Address Generation Unit computes effective address',
    STORE: 'Result written back to destination register or system RAM'
  };

  const INSTRUCTIONS = [
    { opcode: 'LOAD', code: 'LOAD R1, [0x0028]', desc: 'Load sensor reading from RAM 0x0028 into R1', targetReg: 'R1', targetMem: 0x0028, memOp: 'READ' },
    { opcode: 'ADD',  code: 'ADD R1, R2, R3',   desc: 'Compute R1 = R2 + R3 (Temperature compensation)', targetReg: 'R1', aluOp: 'ADD' },
    { opcode: 'STORE',code: 'STORE R1, [0x0032]', desc: 'Store calibrated result from R1 to RAM 0x0032', targetReg: 'R1', targetMem: 0x0032, memOp: 'WRITE' },
    { opcode: 'CMP',  code: 'CMP R1, #0x28',    desc: 'Compare R1 with warning threshold 40°C (0x28)', targetReg: null, aluOp: 'CMP' },
    { opcode: 'SUB',  code: 'SUB R4, R1, R2',   desc: 'Subtract ambient offset R2 from R1 into R4', targetReg: 'R4', aluOp: 'SUB' },
    { opcode: 'AND',  code: 'AND R5, R3, #0x0F',desc: 'Mask upper nibble of sensor telemetry flags', targetReg: 'R5', aluOp: 'AND' },
    { opcode: 'MOV',  code: 'MOV R7, R1',       desc: 'Copy verified telemetry value into R7 buffer', targetReg: 'R7' },
    { opcode: 'OR',   code: 'OR R6, R4, #0x80', desc: 'Set valid telemetry broadcast status flag in R6', targetReg: 'R6', aluOp: 'OR' }
  ];

  class CPUPipeline {
    constructor(engine) {
      this.engine = engine;
      this.currentStage = 'IDLE';
      this.currentInstruction = INSTRUCTIONS[0];
      this.instructionIndex = 0;
      this.cycleCount = 0;
      this.isProcessing = false;
      this._stageIndex = -1;
    }
    
    tick() {
      if (this.isProcessing) return;
      
      if (this.currentStage === 'IDLE' || this.currentStage === 'STORE') {
        this._startNewInstruction();
        this.currentStage = 'FETCH';
        this._stageIndex = 0;
      } else {
        this._stageIndex = (this._stageIndex + 1) % STAGES.length;
        this.currentStage = STAGES[this._stageIndex];
        if (this.currentStage === 'STORE') {
          this.cycleCount++;
        }
      }
      this._emitStage();
    }
    
    async runInstruction(stepDelay = 750) {
      if (this.isProcessing) return;
      this.isProcessing = true;
      
      this._startNewInstruction();
      
      for (let i = 0; i < STAGES.length; i++) {
        this.currentStage = STAGES[i];
        this._stageIndex = i;
        this._emitStage();
        await new Promise(resolve => setTimeout(resolve, stepDelay));
      }
      
      this.cycleCount++;
      this.engine.emit('cpu-cycle-complete', {
        instruction: this.currentInstruction,
        cycleCount: this.cycleCount
      });
      
      this.currentStage = 'IDLE';
      this._stageIndex = -1;
      this.isProcessing = false;
      this.engine.emit('cpu-idle');
    }
    
    _startNewInstruction() {
      this.currentInstruction = INSTRUCTIONS[this.instructionIndex % INSTRUCTIONS.length];
      this.instructionIndex++;
    }
    
    _emitStage() {
      this.engine.emit('cpu-stage', {
        stage: this.currentStage,
        description: STAGE_DESCRIPTIONS[this.currentStage] || 'Pipeline processing',
        instruction: this.currentInstruction,
        stageIndex: this._stageIndex,
        totalStages: STAGES.length,
        cycleCount: this.cycleCount
      });
    }
    
    reset() {
      this.currentStage = 'IDLE';
      this.currentInstruction = INSTRUCTIONS[0];
      this.instructionIndex = 0;
      this.cycleCount = 0;
      this.isProcessing = false;
      this._stageIndex = -1;
      this.engine.emit('cpu-idle');
    }
  }

  /* =========================================================================
     7. ALU ENGINE
     ========================================================================= */
  class ALU {
    constructor(engine) {
      this.engine = engine;
      this.lastResult = null;
      this.lastFlags = { zero: false, negative: false, carry: false, overflow: false };
    }
    
    getSymbol(op) {
      switch (op.toUpperCase()) {
        case 'ADD': return '+';
        case 'SUB':
        case 'SUBTRACT': return '−';
        case 'AND': return '&';
        case 'OR': return '|';
        case 'XOR': return '⊕';
        case 'NOT': return '~';
        case 'CMP':
        case 'COMPARE': return '≟';
        default: return '?';
      }
    }
    
    execute(op, inputA, inputB = 0) {
      let result = 0;
      let flags = { zero: false, negative: false, carry: false, overflow: false };
      
      inputA = (parseInt(inputA, 10) || 0) & 0xFF;
      inputB = (parseInt(inputB, 10) || 0) & 0xFF;
      const normOp = op.toUpperCase();
      
      switch (normOp) {
        case 'ADD': {
          const sum = inputA + inputB;
          flags.carry = sum > 0xFF;
          result = sum & 0xFF;
          flags.overflow = (!((inputA ^ inputB) & 0x80) && Boolean((inputA ^ result) & 0x80));
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'SUB':
        case 'SUBTRACT': {
          const diff = inputA - inputB;
          flags.carry = inputA < inputB;
          result = diff & 0xFF;
          flags.overflow = (Boolean((inputA ^ inputB) & 0x80) && Boolean((inputA ^ result) & 0x80));
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'AND': {
          result = (inputA & inputB) & 0xFF;
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'OR': {
          result = (inputA | inputB) & 0xFF;
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'XOR': {
          result = (inputA ^ inputB) & 0xFF;
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'NOT': {
          result = (~inputA) & 0xFF;
          flags.zero = (result === 0);
          flags.negative = Boolean((result & 0x80));
          break;
        }
        case 'CMP':
        case 'COMPARE': {
          const cmpVal = (inputA - inputB) & 0xFF;
          flags.carry = inputA < inputB;
          flags.zero = (inputA === inputB);
          flags.negative = Boolean((cmpVal & 0x80));
          result = inputA;
          break;
        }
        default:
          result = 0;
          flags.zero = true;
      }
      
      this.lastResult = result;
      this.lastFlags = flags;
      
      this.engine.emit('alu-operation', {
        op: normOp,
        symbol: this.getSymbol(normOp),
        inputA,
        inputB,
        result,
        resultHex: '0x' + result.toString(16).toUpperCase().padStart(2, '0'),
        resultBin: result.toString(2).padStart(8, '0'),
        flags
      });
      
      return { result, flags };
    }
    
    reset() {
      this.lastResult = null;
      this.lastFlags = { zero: false, negative: false, carry: false, overflow: false };
      this.engine.emit('alu-reset');
    }
  }

  /* =========================================================================
     8. REGISTER FILE
     ========================================================================= */
  const REGISTER_NAMES = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'PC', 'SP', 'FLAGS'];

  class RegisterFile {
    constructor(engine) {
      this.engine = engine;
      this.registers = new Map();
      this._initRegisters();
      this._tickCounter = 0;
    }
    
    _initRegisters() {
      REGISTER_NAMES.forEach(name => {
        this.registers.set(name, 0);
      });
      this.registers.set('PC', 0x10);
      this.registers.set('SP', 0xFF);
      this.registers.set('R1', 28);
      this.registers.set('R2', 25);
      this.registers.set('R3', 10);
    }
    
    get(name) {
      return this.registers.get(name) ?? 0;
    }
    
    set(name, value) {
      if (!this.registers.has(name)) return;
      const oldValue = this.registers.get(name);
      value = value & 0xFF;
      if (oldValue === value) return;
      
      this.registers.set(name, value);
      
      this.engine.emit('register-update', {
        register: name,
        oldValue,
        newValue: value,
        oldValueHex: formatHex(oldValue, 2),
        newValueHex: formatHex(value, 2)
      });
    }
    
    tick() {
      this._tickCounter++;
      if (this._tickCounter % 2 === 0) {
        const pc = this.get('PC');
        this.set('PC', (pc + 2) & 0xFF);
        
        const targetRegisters = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
        const reg = targetRegisters[Math.floor(Math.random() * targetRegisters.length)];
        const delta = Math.floor((Math.random() - 0.5) * 6);
        const curVal = this.get(reg);
        const newVal = Math.max(0, Math.min(255, curVal + delta));
        this.set(reg, newVal);
      }
    }
    
    reset() {
      this._initRegisters();
      this._tickCounter = 0;
      this.engine.emit('registers-reset');
    }
    
    getAll() {
      const result = {};
      this.registers.forEach((value, name) => {
        result[name] = { value, hex: formatHex(value, 2) };
      });
      return result;
    }
  }

  /* =========================================================================
     9. MEMORY SUBSYSTEM
     ========================================================================= */
  class Memory {
    constructor(engine, size = 64) {
      this.engine = engine;
      this.size = size;
      this.cells = new Uint8Array(size);
      this._tickCounter = 0;
      this.usagePercent = 24;
      this.lastAccess = null;
      this._initSeed();
    }
    
    _initSeed() {
      this.cells.fill(0);
      this.cells[0x00] = 0xEA;
      this.cells[0x01] = 0x10;
      this.cells[0x02] = 0x00;
      this.cells[0x10] = 0xA9;
      this.cells[0x11] = 0x28;
      this.cells[0x20] = 28;
      this.cells[0x21] = 55;
      this.cells[0x22] = 101;
      this.cells[0x23] = 45;
      this.cells[0x28] = 29;
      this.cells[0x32] = 0;
      this._updateUsage();
    }
    
    read(address) {
      address = address & (this.size - 1);
      const value = this.cells[address];
      
      this.lastAccess = {
        address,
        addressHex: formatHex(address, 4),
        type: 'READ',
        value,
        valueHex: formatHex(value, 2)
      };
      
      this.engine.emit('memory-access', this.lastAccess);
      return value;
    }
    
    write(address, value) {
      address = address & (this.size - 1);
      value = value & 0xFF;
      this.cells[address] = value;
      this._updateUsage();
      
      this.lastAccess = {
        address,
        addressHex: formatHex(address, 4),
        type: 'WRITE',
        value,
        valueHex: formatHex(value, 2)
      };
      
      this.engine.emit('memory-access', this.lastAccess);
    }
    
    tick() {
      this._tickCounter++;
      if (this._tickCounter % 3 === 0) {
        const targetAddresses = [0x20, 0x21, 0x22, 0x28, 0x30, 0x32];
        const addr = targetAddresses[Math.floor(Math.random() * targetAddresses.length)];
        const val = Math.floor(20 + Math.random() * 60);
        this.write(addr, val);
      } else if (this._tickCounter % 3 === 1) {
        const addr = Math.floor(Math.random() * this.size);
        this.read(addr);
      }
    }
    
    _updateUsage() {
      let used = 0;
      for (let i = 0; i < this.size; i++) {
        if (this.cells[i] !== 0) used++;
      }
      this.usagePercent = Math.max(12, Math.round((used / this.size) * 100));
    }
    
    reset() {
      this._initSeed();
      this._tickCounter = 0;
      this.lastAccess = null;
      this.engine.emit('memory-reset');
    }
    
    dump() {
      return Array.from(this.cells).map((value, i) => ({
        address: i,
        addressHex: formatHex(i, 4),
        value,
        valueHex: formatHex(value, 2)
      }));
    }
    
    getUsage() { 
      return this.usagePercent; 
    }
  }

  /* =========================================================================
     10. DATA FLOW ANIMATOR
     ========================================================================= */
  const FLOW_NODES = [
    { id: 'sensor', label: 'SENSOR', desc: 'Acquires raw environmental signals and converts them to digital readings.' },
    { id: 'io', label: 'I/O INTERFACE', desc: 'ADC & peripheral controllers buffer and serialize peripheral data for CPU ingestion.' },
    { id: 'cpu', label: 'CPU', desc: 'Central Processing Unit fetches instructions to execute transducer calibration algorithms.' },
    { id: 'registers', label: 'REGISTERS', desc: 'Internal high-speed scratchpad registers (R0-R7, PC) hold active sensor operands.' },
    { id: 'alu', label: 'ALU', desc: 'Arithmetic Logic Unit applies compensation math and threshold evaluation.' },
    { id: 'memory', label: 'MEMORY', desc: 'Static RAM stores history telemetry buffers and circular queues.' },
    { id: 'comm', label: 'COMMUNICATION', desc: 'Serial bus controllers packetize processed data for host transmission.' },
    { id: 'dashboard', label: 'DASHBOARD', desc: 'Host interface receives telemetry packets and renders real-time instrumentation.' }
  ];

  const FLOW_PATHS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]];

  class DataFlowAnimator {
    constructor(engine) {
      this.engine = engine;
      this.container = null;
      this.svgElement = null;
      this.packets = [];
      this._running = false;
      this._spawnCounter = 0;
      this._animFrameId = null;
      this.nodePositions = [];
      this.pathElements = [];
      
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
    }
    
    init(container) {
      this.container = container;
      this._createSVG();
    }
    
    resize() {
      if (this.container && this.container.clientWidth > 0) {
        this._createSVG();
      }
    }
    
    _createSVG() {
      if (!this.container) return;
      
      const width = Math.max(this.container.clientWidth || 800, 700);
      const height = 360;
      const paddingX = 90;
      const paddingY = 80;
      const usableWidth = width - paddingX * 2;
      
      this.nodePositions = FLOW_NODES.map((node, i) => {
        let x, y;
        if (i < 4) {
          x = paddingX + (i / 3) * usableWidth;
          y = paddingY;
        } else {
          const col = 3 - (i - 4);
          x = paddingX + (col / 3) * usableWidth;
          y = height - paddingY;
        }
        return { ...node, x, y, index: i };
      });
      
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', height);
      svg.classList.add('data-flow-svg');
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = `
        <filter id="glow-packet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      `;
      svg.appendChild(defs);
      
      const pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.pathElements = [];
      
      FLOW_PATHS.forEach(([fromIdx, toIdx]) => {
        const from = this.nodePositions[fromIdx];
        const to = this.nodePositions[toIdx];
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this._createCurvePath(from, to);
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        pathGroup.appendChild(path);
        
        this.pathElements.push({ path, from: fromIdx, to: toIdx });
      });
      svg.appendChild(pathGroup);
      
      this._packetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(this._packetGroup);
      
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.nodePositions.forEach((node) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.style.cursor = 'pointer';
        
        const rectW = 120;
        const rectH = 44;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', node.x - rectW / 2);
        rect.setAttribute('y', node.y - rectH / 2);
        rect.setAttribute('width', rectW);
        rect.setAttribute('height', rectH);
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', '#12121a');
        rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
        rect.setAttribute('stroke-width', '1.5');
        rect.classList.add('flow-node');
        g.appendChild(rect);
        
        const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sub.setAttribute('x', node.x);
        sub.setAttribute('y', node.y - 6);
        sub.setAttribute('text-anchor', 'middle');
        sub.setAttribute('fill', '#00d4ff');
        sub.setAttribute('font-size', '9');
        sub.setAttribute('font-family', 'JetBrains Mono, monospace');
        sub.setAttribute('font-weight', '700');
        sub.textContent = `STAGE 0${node.index + 1}`;
        g.appendChild(sub);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', node.x);
        text.setAttribute('y', node.y + 11);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#e8e8f0');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.setAttribute('font-weight', '600');
        text.textContent = node.label;
        g.appendChild(text);
        
        g.addEventListener('click', () => {
          this.engine.emit('node-click', node);
        });
        
        nodeGroup.appendChild(g);
      });
      svg.appendChild(nodeGroup);
      
      this.svgElement = svg;
      this.container.innerHTML = '';
      this.container.appendChild(svg);
    }
    
    _createCurvePath(from, to) {
      if (from.y === to.y) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      const bulge = 45;
      return `M ${from.x} ${from.y} C ${from.x + bulge} ${from.y}, ${to.x + bulge} ${to.y}, ${to.x} ${to.y}`;
    }
    
    spawnPacket(label = '28.6°C') {
      if (reducedMotion || !this._packetGroup) return;
      
      const packet = {
        label,
        currentPathIndex: 0,
        progress: 0,
        speed: 0.012,
        element: null
      };
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.pointerEvents = 'none';
      
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('r', '8');
      halo.setAttribute('fill', 'rgba(0, 212, 255, 0.25)');
      halo.setAttribute('filter', 'url(#glow-packet)');
      g.appendChild(halo);
      
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#00d4ff');
      g.appendChild(circle);
      
      if (label) {
        const pillGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        pillGroup.setAttribute('transform', 'translate(0, -18)');
        
        const pillBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pillBg.setAttribute('x', '-28');
        pillBg.setAttribute('y', '-9');
        pillBg.setAttribute('width', '56');
        pillBg.setAttribute('height', '18');
        pillBg.setAttribute('rx', '4');
        pillBg.setAttribute('fill', 'rgba(10, 10, 15, 0.85)');
        pillBg.setAttribute('stroke', '#00d4ff');
        pillBg.setAttribute('stroke-width', '1');
        pillGroup.appendChild(pillBg);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '3');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#00d4ff');
        text.setAttribute('font-size', '9');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
        text.setAttribute('font-weight', '700');
        text.textContent = label;
        pillGroup.appendChild(text);
        g.appendChild(pillGroup);
      }
      
      packet.element = g;
      this._packetGroup.appendChild(g);
      this.packets.push(packet);
    }
    
    _updatePackets() {
      if (!this.pathElements.length) return;
      
      for (let i = this.packets.length - 1; i >= 0; i--) {
        const packet = this.packets[i];
        packet.progress += packet.speed;
        
        if (packet.progress >= 1) {
          packet.progress = 0;
          packet.currentPathIndex++;
          
          if (packet.currentPathIndex >= this.pathElements.length) {
            if (packet.element && packet.element.parentNode) {
              packet.element.parentNode.removeChild(packet.element);
            }
            this.packets.splice(i, 1);
            continue;
          }
        }
        
        const pathData = this.pathElements[packet.currentPathIndex];
        if (pathData && pathData.path) {
          const totalLength = pathData.path.getTotalLength();
          const point = pathData.path.getPointAtLength(totalLength * packet.progress);
          packet.element.setAttribute('transform', `translate(${point.x}, ${point.y})`);
        }
      }
    }
    
    tick() {
      this._spawnCounter++;
      if (this._spawnCounter % 2 === 0) {
        const sampleValues = ['28.6°C', '55.2%', '1013hPa', '480lux', '42AQI', '50.1cm'];
        const label = sampleValues[Math.floor(Math.random() * sampleValues.length)];
        this.spawnPacket(label);
      }
    }
    
    start() {
      if (this._running || reducedMotion) return;
      this._running = true;
      const animate = () => {
        if (!this._running) return;
        this._updatePackets();
        this._animFrameId = requestAnimationFrame(animate);
      };
      this._animFrameId = requestAnimationFrame(animate);
    }
    
    stop() {
      this._running = false;
      if (this._animFrameId) {
        cancelAnimationFrame(this._animFrameId);
        this._animFrameId = null;
      }
    }
    
    reset() {
      this.stop();
      this.packets.forEach(p => {
        if (p.element && p.element.parentNode) {
          p.element.parentNode.removeChild(p.element);
        }
      });
      this.packets = [];
      this._spawnCounter = 0;
    }
  }

  /* =========================================================================
     11. BUS VISUALIZER
     ========================================================================= */
  const BUS_TYPES = [
    { 
      id: 'address', 
      label: 'ADDRESS BUS (16-BIT)', 
      color: '#00d4ff', 
      direction: 'Unidirectional (CPU → Memory / I/O)',
      description: 'Carries physical memory addresses from CPU to RAM and peripheral controllers. Determines WHICH location is targeted. 16-bit space addresses 64KB.' 
    },
    { 
      id: 'data', 
      label: 'DATA BUS (8-BIT)', 
      color: '#00cc88', 
      direction: 'Bidirectional (CPU ↔ Memory ↔ I/O)',
      description: 'Carries actual data words and instruction bytes between CPU registers, ALU, RAM, and I/O registers. Data flows both ways.' 
    },
    { 
      id: 'control', 
      label: 'CONTROL BUS (SIGNALS)', 
      color: '#ffaa00', 
      direction: 'Bidirectional / Multi-master',
      description: 'Carries critical timing and control pulses: MEM_READ, MEM_WRITE, IO_RD, IO_WR, CLOCK, RESET, and INTERRUPT_REQ.' 
    }
  ];

  class BusVisualizer {
    constructor(engine) {
      this.engine = engine;
      this.container = null;
      this._running = false;
      this._animFrameId = null;
      this._dataElements = [];
    }
    
    init(container) {
      this.container = container;
      this._render();
    }
    
    _render() {
      if (!this.container) return;
      this.container.innerHTML = '';
      this._dataElements = [];
      
      BUS_TYPES.forEach(bus => {
        const busEl = document.createElement('div');
        busEl.className = 'bus-line';
        busEl.dataset.busId = bus.id;
        busEl.style.position = 'relative';
        busEl.style.overflow = 'hidden';
        
        const label = document.createElement('span');
        label.className = 'bus-line__label';
        label.style.color = bus.color;
        label.textContent = bus.label;
        busEl.appendChild(label);
        
        for (let i = 0; i < 3; i++) {
          const data = document.createElement('div');
          data.className = 'bus-line__data';
          data.style.background = `linear-gradient(90deg, transparent, ${bus.color}, transparent)`;
          data.style.opacity = '0.6';
          data.style.boxShadow = `0 0 10px ${bus.color}`;
          data.style.left = `${-25 + i * 40}%`;
          busEl.appendChild(data);
          this._dataElements.push({ element: data, speed: 0.25 + Math.random() * 0.15, busId: bus.id });
        }
        
        busEl.addEventListener('click', () => {
          this.engine.emit('bus-click', bus);
        });
        
        this.container.appendChild(busEl);
      });
    }
    
    start() {
      if (this._running || reducedMotion) return;
      this._running = true;
      const animate = () => {
        if (!this._running) return;
        this._dataElements.forEach(item => {
          const el = item.element;
          let left = parseFloat(el.style.left) || 0;
          left += item.speed;
          if (left > 105) left = -25;
          el.style.left = `${left}%`;
        });
        this._animFrameId = requestAnimationFrame(animate);
      };
      this._animFrameId = requestAnimationFrame(animate);
    }
    
    stop() {
      this._running = false;
      if (this._animFrameId) {
        cancelAnimationFrame(this._animFrameId);
        this._animFrameId = null;
      }
    }
    
    reset() {
      this.stop();
      this._dataElements.forEach((item, i) => {
        item.element.style.left = `${-25 + (i % 3) * 40}%`;
      });
    }
  }

  /* =========================================================================
     12. SENSECORE MAIN CONTROLLER APP
     ========================================================================= */
  class SenseCoreApp {
    constructor() {
      this.engine = new SimulationEngine();
      this.sensors = new SensorManager(this.engine);
      this.cpu = new CPUPipeline(this.engine);
      this.alu = new ALU(this.engine);
      this.registers = new RegisterFile(this.engine);
      this.memory = new Memory(this.engine);
      this.dataflow = new DataFlowAnimator(this.engine);
      this.bus = new BusVisualizer(this.engine);
      this.logger = new Logger(250);

      this.engine.registerModule(this.sensors);
      this.engine.registerModule(this.cpu);
      this.engine.registerModule(this.registers);
      this.engine.registerModule(this.memory);
      this.engine.registerModule(this.dataflow);
      this.engine.registerModule(this.bus);

      this.currentPage = 'dashboard';
      this.alerts = [];
      this.currentLogFilter = 'all';
      this.selectedAluOp = 'ADD';

      this.tempChart = null;
      this.humChart = null;

      this.cacheDom();
      this.initViews();
      this.bindEvents();
      this.initCharts();
      
      this.logger.log('SENSECORE embedded architecture simulator booted', 'system');
      this.logger.log('Harvard 8-bit core initialized at 0x0000', 'cpu');
      this.logger.log('Memory subsystem: 64 bytes static RAM ready', 'memory');
      this.logger.log('Transducer interface: 6 sensors calibrated and online', 'io');
    }

    cacheDom() {
      this.dom = {
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

        navItems: document.querySelectorAll('.nav-item'),
        pageViews: document.querySelectorAll('.page-view'),

        sensorCardsGrid: document.getElementById('sensor-cards-grid'),
        dashboardAlertsList: document.getElementById('dashboard-alerts-list'),
        alertsCountBadge: document.getElementById('alerts-count-badge'),

        dataflowContainer: document.getElementById('dataflow-svg-container'),
        dataflowNodeDetail: document.getElementById('dataflow-node-detail'),
        flowDetailBadge: document.getElementById('flow-detail-badge'),
        flowDetailText: document.getElementById('flow-detail-text'),
        flowDetailPacketTag: document.getElementById('flow-detail-packet-tag'),
        btnSpawnPacket: document.getElementById('btn-spawn-packet'),

        btnRunInstruction: document.getElementById('btn-run-instruction'),
        cpuActiveStageDisplay: document.getElementById('cpu-active-stage-display'),
        cpuStageDescDisplay: document.getElementById('cpu-stage-desc-display'),
        cpuCycleCountDisplay: document.getElementById('cpu-cycle-count-display'),
        cpuInstructionOpcode: document.getElementById('cpu-instruction-opcode'),
        cpuInstructionCode: document.getElementById('cpu-instruction-code'),
        cpuInstructionExplanation: document.getElementById('cpu-instruction-explanation'),
        cpuInstructionTarget: document.getElementById('cpu-instruction-target'),
        pipelineStages: document.querySelectorAll('.pipeline-stage'),

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

        registersGrid: document.getElementById('registers-grid-container'),
        memoryCellsGrid: document.getElementById('memory-cells-grid'),
        memAccessType: document.getElementById('mem-access-type'),
        memAccessDetail: document.getElementById('mem-access-detail'),
        memoryUsageBadge: document.getElementById('memory-usage-badge'),
        memoryLastAccessPill: document.getElementById('memory-last-access-pill'),

        archNodes: document.querySelectorAll('.arch-node'),
        busContainer: document.getElementById('bus-visualizer-container'),
        archInfoTitle: document.getElementById('arch-info-title'),
        archInfoDesc: document.getElementById('arch-info-desc'),
        archInfoSpecs: document.getElementById('arch-info-specs'),

        execLogTerminal: document.getElementById('exec-log-terminal'),
        logCounter: document.getElementById('log-counter'),
        logFilterButtons: document.querySelectorAll('.log-filter-btn'),
        btnClearLog: document.getElementById('btn-clear-log')
      };
    }

    initViews() {
      this.renderSensorCards();
      this.renderRegistersGrid();
      this.renderMemoryGrid();

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

    bindEvents() {
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

      this.dom.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigateToPage(item.dataset.page);
        });
      });

      this.engine.on('state-change', ({ newState }) => this.handleStateChange(newState));
      this.engine.on('reset', () => this.handleReset());
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

      this.dom.aluOpButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.aluOpButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedAluOp = btn.dataset.op;
          this.dom.aluOperatorSymbol.textContent = this.alu.getSymbol(this.selectedAluOp);
          
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

      this.dom.archNodes.forEach(node => {
        node.addEventListener('click', () => {
          this.handleArchitectureClick(node.dataset.comp, node);
        });
      });

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

      this.dom.cpuActiveStageDisplay.textContent = 'IDLE';
      this.dom.cpuStageDescDisplay.textContent = 'System reset. Waiting for CPU clock or trigger.';
      this.dom.cpuCycleCountDisplay.textContent = '0';
      this.dom.pipelineStages.forEach(st => st.classList.remove('active', 'stage-active'));

      this.dom.memAccessType.textContent = 'IDLE';
      this.dom.memAccessDetail.textContent = 'Memory array reset to initial boot vector';
      this.dom.memoryLastAccessPill.className = 'memory-action-pill';
      this.dom.memoryUsageBadge.textContent = `${this.memory.getUsage()}% USED`;
      this.dom.topbarMemory.textContent = `${this.memory.getUsage()}%`;

      this.renderSensorCards();
      this.renderRegistersGrid();
      this.renderMemoryGrid();

      this.logger.log('Hardware reset: RAM and registers cleared to boot defaults', 'system');
    }

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
          void view.offsetWidth;
          view.classList.add('page-enter');
        }
      });

      if (pageId === 'dataflow') {
        setTimeout(() => this.dataflow.resize(), 50);
      } else if (pageId === 'dashboard') {
        setTimeout(() => {
          if (this.tempChart) this.tempChart.resize();
          if (this.humChart) this.humChart.resize();
        }, 50);
      }
    }

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

    handleCpuStage({ stage, description, instruction, stageIndex, cycleCount }) {
      this.dom.cpuActiveStageDisplay.textContent = stage;
      this.dom.cpuStageDescDisplay.textContent = description;
      this.dom.cpuCycleCountDisplay.textContent = cycleCount.toString();

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

      this.dom.memAccessType.textContent = type;
      this.dom.memAccessDetail.textContent = `${addressHex} → ${type} → ${value} (${valueHex})`;
      this.dom.memoryLastAccessPill.className = `memory-action-pill ${type === 'READ' ? 'read-flash' : 'write-flash'}`;

      const usage = this.memory.getUsage();
      this.dom.memoryUsageBadge.textContent = `${usage}% USED`;
      this.dom.topbarMemory.textContent = `${usage}%`;

      this.logger.log(`RAM ${type} cycle at ${addressHex}: payload = ${valueHex} (${value})`, 'memory');
    }

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

    handleLogEntry(entry) {
      const el = document.createElement('div');
      el.className = `log-entry log-entry--${entry.category} ${reducedMotion ? '' : 'log-entry-new'}`;
      el.dataset.category = entry.category;

      el.innerHTML = `
        <span class="log-entry__time">${entry.timestamp}</span>
        <span class="log-entry__badge log-entry__badge--${entry.category}">${entry.category}</span>
        <span class="log-entry__msg">${entry.message}</span>
      `;

      if (this.currentLogFilter !== 'all' && this.currentLogFilter !== entry.category) {
        el.style.display = 'none';
      }

      this.dom.execLogTerminal.appendChild(el);
      this.dom.logCounter.textContent = `${this.logger.getEntries().length} ENTRIES`;

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

  // Auto-init on page load
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      window.senseCoreApp = new SenseCoreApp();
    });
  }
})();
