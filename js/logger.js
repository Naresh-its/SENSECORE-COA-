import { formatTime, EventEmitter } from './utils.js';

export class Logger extends EventEmitter {
  constructor(maxEntries = 200) {
    super();
    this.entries = [];
    this.maxEntries = maxEntries;
  }
  
  // category: 'cpu' | 'memory' | 'io' | 'alu' | 'alert' | 'system'
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
