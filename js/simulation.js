import { EventEmitter } from './utils.js';

export class SimulationEngine extends EventEmitter {
  constructor() {
    super();
    this.state = 'READY'; // 'READY' | 'RUNNING' | 'PAUSED'
    this._animFrameId = null;
    this._tickRate = 800; // ms between simulated system clock ticks
    this._lastTick = 0;
    this._modules = [];
    this._autoPaused = false;
    
    // Auto-pause when browser tab is inactive to preserve battery/CPU
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
  
  setTickRate(ms) {
    this._tickRate = Math.max(200, Math.min(3000, ms));
  }
}
