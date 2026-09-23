// Check prefers-reduced-motion safely across environments
export const reducedMotion = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

// Linear interpolation
export function lerp(a, b, t) { 
  return a + (b - a) * t; 
}

// Clamp value to range
export function clamp(val, min, max) { 
  return Math.min(Math.max(val, min), max); 
}

// Smooth step (ease in-out)
export function smoothStep(t) { 
  return t * t * (3 - 2 * t); 
}

// Format number as hex string: formatHex(64, 4) => "0x0040"
export function formatHex(num, digits = 4) {
  return '0x' + (Number(num) || 0).toString(16).toUpperCase().padStart(digits, '0');
}

// Format current time as "[HH:MM:SS]"
export function formatTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `[${h}:${m}:${s}]`;
}

// Animate a numeric value transition on a DOM element
// Uses requestAnimationFrame with ease-out cubic
// Respects reducedMotion (instant swap)
export function animateValue(element, start, end, duration = 280, formatFn = v => v.toFixed(1)) {
  if (!element) return;
  if (reducedMotion || duration <= 0 || typeof window === 'undefined') {
    element.textContent = formatFn(end);
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease-out cubic: f(t) = 1 - (1-t)^3
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

// Add highlight-flash class to element, auto-remove after animation
export function flashHighlight(element) {
  if (!element || reducedMotion) return;
  element.classList.remove('highlight-flash');
  // Trigger reflow to restart animation
  void element.offsetWidth;
  element.classList.add('highlight-flash');
  
  setTimeout(() => {
    if (element) element.classList.remove('highlight-flash');
  }, 700);
}

// Generate smooth random walk value
export function smoothRandom(prevValue, min, max, maxDelta) {
  const rawDelta = (Math.random() - 0.5) * 2 * maxDelta;
  const newVal = prevValue + rawDelta;
  return clamp(newVal, min, max);
}

// Simple event emitter class
export class EventEmitter {
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
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
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
