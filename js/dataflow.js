import { reducedMotion } from './utils.js';

const FLOW_NODES = [
  { id: 'sensor', label: 'SENSOR', desc: 'Acquires raw environmental signals (temperature, pressure, etc.) and converts them to analog/digital signals.' },
  { id: 'io', label: 'I/O INTERFACE', desc: 'Analog-to-Digital Converter (ADC) and GPIO controllers buffer and serialize peripheral data for CPU ingestion.' },
  { id: 'cpu', label: 'CPU', desc: 'Central Processing Unit fetches instructions from program memory to process ingested sensor values.' },
  { id: 'registers', label: 'REGISTERS', desc: 'Internal ultra-fast scratchpad registers (R0-R7, PC) hold active sensor operands and intermediate states.' },
  { id: 'alu', label: 'ALU', desc: 'Arithmetic Logic Unit applies calibration offsets, thresholds, scaling, and conversion algorithms.' },
  { id: 'memory', label: 'MEMORY', desc: 'Static RAM stores history buffers, calibration lookup tables, and telemetry queue.' },
  { id: 'comm', label: 'COMMUNICATION', desc: 'UART/SPI/I2C/CAN bus controllers packetize processed data for external transmission.' },
  { id: 'dashboard', label: 'DASHBOARD', desc: 'Host interface receives telemetry packets and renders real-time instrumentation and alerts.' }
];

const FLOW_PATHS = [
  [0, 1], // SENSOR → I/O
  [1, 2], // I/O → CPU
  [2, 3], // CPU → REGISTERS
  [3, 4], // REGISTERS → ALU
  [4, 5], // ALU → MEMORY
  [5, 6], // MEMORY → COMMUNICATION
  [6, 7], // COMMUNICATION → DASHBOARD
];

export class DataFlowAnimator {
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
    this.selectedNode = null;
    
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
    
    // Serpentine layout: Row 0 (0-3 left to right), Row 1 (4-7 right to left)
    this.nodePositions = FLOW_NODES.map((node, i) => {
      let x, y;
      if (i < 4) {
        // Row 0: Left to Right
        x = paddingX + (i / 3) * usableWidth;
        y = paddingY;
      } else {
        // Row 1: Right to Left
        const col = 3 - (i - 4);
        x = paddingX + (col / 3) * usableWidth;
        y = height - paddingY;
      }
      return {
        ...node,
        x,
        y,
        index: i
      };
    });
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', height);
    svg.classList.add('data-flow-svg');
    
    // Defs for filters & gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="glow-packet" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#00cc88" stop-opacity="0.4" />
      </linearGradient>
    `;
    svg.appendChild(defs);
    
    // Path group
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
      path.classList.add('flow-path');
      pathGroup.appendChild(path);
      
      this.pathElements.push({ path, from: fromIdx, to: toIdx });
    });
    svg.appendChild(pathGroup);
    
    // Packet container (particles)
    this._packetGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._packetGroup.setAttribute('id', 'packet-layer');
    svg.appendChild(this._packetGroup);
    
    // Node group
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
      rect.dataset.nodeId = node.id;
      g.appendChild(rect);
      
      // Node Step index (e.g. "01")
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
      
      // Node label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + 11);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#e8e8f0');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.setAttribute('font-weight', '600');
      text.setAttribute('letter-spacing', '0.04em');
      text.textContent = node.label;
      g.appendChild(text);
      
      g.addEventListener('click', () => {
        this.selectNode(node);
      });
      
      nodeGroup.appendChild(g);
    });
    svg.appendChild(nodeGroup);
    
    this.svgElement = svg;
    this.container.innerHTML = '';
    this.container.appendChild(svg);
    
    // Re-mount active packets if any
    this.packets.forEach(p => {
      if (p.element) this._packetGroup.appendChild(p.element);
    });
  }
  
  _createCurvePath(from, to) {
    if (from.y === to.y) {
      // Horizontal segment
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    // Turnaround curve between row 0 and row 1
    const midY = (from.y + to.y) / 2;
    const bulge = 45;
    return `M ${from.x} ${from.y} C ${from.x + bulge} ${from.y}, ${to.x + bulge} ${to.y}, ${to.x} ${to.y}`;
  }
  
  selectNode(node) {
    this.selectedNode = node;
    this.engine.emit('node-click', node);
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
    
    // Outer glow ring
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '8');
    halo.setAttribute('fill', 'rgba(0, 212, 255, 0.25)');
    halo.setAttribute('filter', 'url(#glow-packet)');
    g.appendChild(halo);
    
    // Core dot
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#00d4ff');
    g.appendChild(circle);
    
    // Label pill
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
  
  destroy() {
    window.removeEventListener('resize', this.resize);
    this.stop();
  }
}
