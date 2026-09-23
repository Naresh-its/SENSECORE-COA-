import { reducedMotion } from './utils.js';

const BUS_TYPES = [
  { 
    id: 'address', 
    label: 'ADDRESS BUS (16-BIT)', 
    color: '#00d4ff', 
    direction: 'Unidirectional (CPU → Memory / I/O)',
    description: 'Carries physical memory addresses from the CPU to RAM and peripheral controllers. Determines WHICH location is targeted. A 16-bit bus addresses 64KB (2^16 addresses).' 
  },
  { 
    id: 'data', 
    label: 'DATA BUS (8-BIT)', 
    color: '#00cc88', 
    direction: 'Bidirectional (CPU ↔ Memory ↔ I/O)',
    description: 'Carries actual data words and instruction bytes between CPU registers, ALU, RAM, and I/O registers. Data flows both inward (read) and outward (write).' 
  },
  { 
    id: 'control', 
    label: 'CONTROL BUS (CONTROL SIGNALS)', 
    color: '#ffaa00', 
    direction: 'Bidirectional / Multi-master',
    description: 'Carries critical timing and control pulses: MEM_READ, MEM_WRITE, IO_RD, IO_WR, CLOCK, RESET, and INTERRUPT_REQ. Coordinates subsystem synchronization.' 
  }
];

export class BusVisualizer {
  constructor(engine) {
    this.engine = engine;
    this.container = null;
    this._running = false;
    this._animFrameId = null;
    this._dataElements = [];
    this.selectedBus = null;
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
      busEl.style.setProperty('--bus-color', bus.color);
      busEl.style.position = 'relative';
      busEl.style.overflow = 'hidden';
      
      const label = document.createElement('span');
      label.className = 'bus-line__label';
      label.style.color = bus.color;
      label.textContent = bus.label;
      busEl.appendChild(label);
      
      // Create 3 data indicators per bus with glowing gradient
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
        this.selectBus(bus.id);
      });
      
      this.container.appendChild(busEl);
    });
  }
  
  selectBus(busId) {
    this.selectedBus = BUS_TYPES.find(b => b.id === busId);
    if (this.container) {
      this.container.querySelectorAll('.bus-line').forEach(el => {
        el.classList.toggle('selected', el.dataset.busId === busId);
      });
    }
    this.engine.emit('bus-click', this.selectedBus);
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
    if (this.container) {
      this.container.querySelectorAll('.bus-line').forEach(el => el.classList.remove('selected'));
    }
    this.selectedBus = null;
  }
  
  getBusInfo(busId) {
    return BUS_TYPES.find(b => b.id === busId);
  }
  
  getBusTypes() { 
    return BUS_TYPES; 
  }
}
