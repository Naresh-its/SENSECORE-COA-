import { formatHex } from './utils.js';

const REGISTER_NAMES = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'PC', 'SP', 'FLAGS'];

export class RegisterFile {
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
    value = value & 0xFF; // 8-bit registers
    if (oldValue === value) return; // avoid spurious identical animations
    
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
      // Step Program Counter (PC += 2)
      const pc = this.get('PC');
      this.set('PC', (pc + 2) & 0xFF);
      
      // Update general register with simulated operand
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
  
  getNames() { 
    return REGISTER_NAMES; 
  }
}
