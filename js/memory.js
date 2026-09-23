import { formatHex } from './utils.js';

export class Memory {
  constructor(engine, size = 64) {
    this.engine = engine;
    this.size = size;
    this.cells = new Uint8Array(size);
    this._tickCounter = 0;
    this.usagePercent = 24; // realistic initial footprint
    this.lastAccess = null;
    
    // Seed initial sensible memory values
    this._initSeed();
  }
  
  _initSeed() {
    this.cells.fill(0);
    // Boot vector & sensor pointers
    this.cells[0x00] = 0xEA; // JMP opcode
    this.cells[0x01] = 0x10;
    this.cells[0x02] = 0x00;
    this.cells[0x10] = 0xA9; // LDA opcode
    this.cells[0x11] = 0x28; // 40 (temp threshold)
    this.cells[0x20] = 28;   // Temperature buffer
    this.cells[0x21] = 55;   // Humidity buffer
    this.cells[0x22] = 101;  // Pressure buffer
    this.cells[0x23] = 45;   // Light buffer
    this.cells[0x28] = 29;   // Live reading slot
    this.cells[0x32] = 0;    // Processed output slot
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
      // Periodic simulated telemetry write
      const targetAddresses = [0x20, 0x21, 0x22, 0x28, 0x30, 0x32];
      const addr = targetAddresses[Math.floor(Math.random() * targetAddresses.length)];
      const val = Math.floor(20 + Math.random() * 60);
      this.write(addr, val);
    } else if (this._tickCounter % 3 === 1) {
      // Periodic simulated DMA / CPU read
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
