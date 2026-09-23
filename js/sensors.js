import { smoothRandom } from './utils.js';

const SENSOR_CONFIGS = [
  { id: 'temperature', name: 'Temperature', unit: '°C', icon: '🌡️', min: 18.0, max: 48.0, defaultValue: 28.6, maxDelta: 0.35, warnThreshold: 35.0, critThreshold: 40.0, precision: 1 },
  { id: 'humidity',    name: 'Humidity',    unit: '%',  icon: '💧', min: 25.0, max: 88.0, defaultValue: 55.0, maxDelta: 0.6,  warnThreshold: 70.0, critThreshold: 80.0, precision: 1 },
  { id: 'pressure',    name: 'Barometer',   unit: 'hPa',icon: '🔵', min: 995.0, max: 1030.0, defaultValue: 1013.2, maxDelta: 0.25, warnThreshold: 1024.0, critThreshold: 1028.0, precision: 1 },
  { id: 'light',       name: 'Ambient Light', unit: 'lux', icon: '☀️', min: 50, max: 1200, defaultValue: 480, maxDelta: 10, warnThreshold: 850, critThreshold: 1000, precision: 0 },
  { id: 'gas',         name: 'Air Quality', unit: 'AQI', icon: '🍃', min: 10, max: 350, defaultValue: 42, maxDelta: 3, warnThreshold: 120, critThreshold: 180, precision: 0 },
  { id: 'proximity',   name: 'Proximity',   unit: 'cm',  icon: '📡', min: 2.0, max: 100.0, defaultValue: 50.0, maxDelta: 2.0, warnThreshold: 15.0, critThreshold: 6.0, precision: 1 }
];

export class SensorManager {
  constructor(engine) {
    this.engine = engine;
    this.sensors = SENSOR_CONFIGS.map(cfg => ({
      ...cfg,
      value: cfg.defaultValue,
      prevValue: cfg.defaultValue,
      status: 'NORMAL', // 'NORMAL' | 'WARNING' | 'CRITICAL'
      history: [cfg.defaultValue]
    }));
  }
  
  tick() {
    this.sensors.forEach(sensor => {
      sensor.prevValue = sensor.value;
      sensor.value = smoothRandom(sensor.value, sensor.min, sensor.max, sensor.maxDelta);
      
      // Occasional slight drift (1% chance)
      if (Math.random() < 0.015) {
        sensor.value += (Math.random() - 0.4) * sensor.maxDelta * 4;
        sensor.value = Math.max(sensor.min, Math.min(sensor.max, sensor.value));
      }
      
      const prevStatus = sensor.status;
      sensor.status = this._getStatus(sensor);
      
      // Rolling 60 data points buffer for Canvas charts
      sensor.history.push(sensor.value);
      if (sensor.history.length > 60) {
        sensor.history.shift();
      }
      
      // Detect significant change (>1.5% of total span)
      const span = sensor.max - sensor.min;
      const significantChange = Math.abs(sensor.value - sensor.prevValue) >= (span * 0.015);
      
      this.engine.emit('sensor-update', {
        sensor,
        significantChange,
        statusChanged: prevStatus !== sensor.status
      });
      
      // Threshold Alert notification if status changed to WARNING or CRITICAL
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
      // Proximity is inverse (closer distance triggers warning/critical)
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
  
  setThreshold(id, warn, crit) {
    const sensor = this.getSensor(id);
    if (sensor) {
      if (warn !== undefined) sensor.warnThreshold = warn;
      if (crit !== undefined) sensor.critThreshold = crit;
      sensor.status = this._getStatus(sensor);
    }
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
