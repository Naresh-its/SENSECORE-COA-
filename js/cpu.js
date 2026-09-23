import { formatHex } from './utils.js';

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

export class CPUPipeline {
  constructor(engine) {
    this.engine = engine;
    this.currentStage = 'IDLE'; // 'IDLE' | 'FETCH' | 'DECODE' | 'EXECUTE' | 'STORE'
    this.currentInstruction = INSTRUCTIONS[0];
    this.instructionIndex = 0;
    this.cycleCount = 0;
    this.isProcessing = false;
    this._stageIndex = -1;
    this._autoMode = false;
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
  
  getStageDescription(stage) {
    return STAGE_DESCRIPTIONS[stage] || '';
  }
  
  getStages() {
    return STAGES;
  }
}
