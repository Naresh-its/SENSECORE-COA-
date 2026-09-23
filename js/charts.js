import { reducedMotion } from './utils.js';

export class RealtimeChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = []; // array of {value, timestamp}
    this.maxPoints = options.maxPoints || 60;
    this.minValue = options.minValue ?? 0;
    this.maxValue = options.maxValue ?? 100;
    this.autoScale = options.autoScale ?? false;
    this.lineColor = options.lineColor || '#00d4ff';
    this.fillColor = options.fillColor || 'rgba(0, 212, 255, 0.08)';
    this.gridColor = options.gridColor || 'rgba(255, 255, 255, 0.05)';
    this.labelColor = options.labelColor || '#555570';
    this.lineWidth = options.lineWidth || 2;
    this.label = options.label || '';
    this.unit = options.unit || '';
    this._animId = null;
    this._running = false;
    
    this.resize = this.resize.bind(this);
    
    // Handle DPR for sharp rendering
    this._setupCanvas();
    window.addEventListener('resize', this.resize);
  }
  
  _setupCanvas() {
    // Get actual layout size of the canvas container if possible, else the canvas itself
    const parent = this.canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Use actual dimensions unless they are 0
    const w = rect.width || 300;
    const h = rect.height || 150;
    
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scaling
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
    if (!this._running) this.render(); // render immediately if not in loop
  }
  
  render() {
    const ctx = this.ctx;
    const { width, height } = this;
    const padding = { top: 20, right: 10, bottom: 25, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, width, height);
    
    // Auto-scale if enabled
    let minVal = this.minValue;
    let maxVal = this.maxValue;
    if (this.autoScale && this.data.length > 0) {
      const values = this.data.map(d => d.value);
      const dataMin = Math.min(...values);
      const dataMax = Math.max(...values);
      if (dataMax === dataMin) {
        minVal = dataMin - 5;
        maxVal = dataMax + 5;
      } else {
        const margin = (dataMax - dataMin) * 0.1;
        minVal = dataMin - margin;
        maxVal = dataMax + margin;
      }
    }
    const range = maxVal - minVal || 1;
    
    // Draw grid lines (4 horizontal)
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      
      // Y-axis labels
      const val = maxVal - (range / 4) * i;
      ctx.fillStyle = this.labelColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1), padding.left - 6, y + 4);
    }
    ctx.setLineDash([]);
    
    if (this.data.length < 2) return;
    
    // Draw filled area + line
    ctx.beginPath();
    const stepX = chartWidth / (this.maxPoints - 1);
    
    for (let i = 0; i < this.data.length; i++) {
      const x = padding.left + i * stepX;
      const normalized = (this.data[i].value - minVal) / range;
      const y = padding.top + chartHeight * (1 - normalized);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    
    // Stroke the line
    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = this.lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    // Fill below the line
    const lastX = padding.left + (this.data.length - 1) * stepX;
    ctx.lineTo(lastX, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    
    // Draw current value dot
    if (this.data.length > 0) {
      const last = this.data[this.data.length - 1];
      const x = padding.left + (this.data.length - 1) * stepX;
      const normalized = (last.value - minVal) / range;
      const y = padding.top + chartHeight * (1 - normalized);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.lineColor;
      ctx.fill();
      // Glow effect
      if (!reducedMotion) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.fillColor;
        ctx.fill();
      }
    }
    
    // Label
    if (this.label) {
      ctx.fillStyle = this.labelColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(this.label + (this.unit ? ` (${this.unit})` : ''), padding.left, padding.top - 6);
    }
  }
  
  start() {
    this._running = true;
  }
  
  stop() {
    this._running = false;
  }
  
  reset() {
    this.data = [];
    this.render();
  }
  
  resize() {
    this._setupCanvas();
    this.render();
  }
  
  destroy() {
    window.removeEventListener('resize', this.resize);
  }
}
