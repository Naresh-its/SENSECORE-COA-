// Automated verification script for SENSECORE Subsystems
import { SimulationEngine } from './js/simulation.js';
import { SensorManager } from './js/sensors.js';
import { CPUPipeline } from './js/cpu.js';
import { ALU } from './js/alu.js';
import { RegisterFile } from './js/registers.js';
import { Memory } from './js/memory.js';
import { BusVisualizer } from './js/bus.js';
import { Logger } from './js/logger.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== SENSECORE SUBSYSTEM AUTOMATED TEST SUITE ===\n');

// 1. Test Simulation Engine Lifecycle
console.log('1. Testing Simulation Engine Lifecycle:');
const engine = new SimulationEngine();
assert(engine.getState() === 'READY', 'Initial state is READY');

engine.start();
assert(engine.getState() === 'RUNNING', 'State transitions to RUNNING on start()');

engine.pause();
assert(engine.getState() === 'PAUSED', 'State transitions to PAUSED on pause()');

engine.resume();
assert(engine.getState() === 'RUNNING', 'State transitions to RUNNING on resume()');

engine.reset();
assert(engine.getState() === 'READY', 'State transitions to READY on reset()');

// 2. Test Sensor Manager & Thresholds
console.log('\n2. Testing Sensor Manager & Realistic Generation:');
const sensors = new SensorManager(engine);
engine.registerModule(sensors);
const tempSensor = sensors.getSensor('temperature');
assert(tempSensor !== undefined, 'Temperature sensor registered');
assert(tempSensor.value === 28.6, `Default temperature is 28.6°C (got ${tempSensor.value})`);
assert(tempSensor.status === 'NORMAL', 'Initial status is NORMAL');

// Run 5 ticks
for (let i = 0; i < 5; i++) {
  sensors.tick();
}
assert(tempSensor.history.length === 6, `History rolling buffer updated (len: ${tempSensor.history.length})`);
assert(tempSensor.value >= tempSensor.min && tempSensor.value <= tempSensor.max, `Value within bounds [${tempSensor.min}, ${tempSensor.max}] (got ${tempSensor.value})`);

// 3. Test Register File
console.log('\n3. Testing Register File:');
const registers = new RegisterFile(engine);
assert(registers.get('PC') === 0x10, 'Initial PC is 0x10');
assert(registers.get('SP') === 0xFF, 'Initial SP is 0xFF');

let registerUpdateEvent = null;
engine.on('register-update', (data) => { registerUpdateEvent = data; });
registers.set('R1', 42);
assert(registers.get('R1') === 42, 'R1 updated to 42');
assert(registerUpdateEvent !== null && registerUpdateEvent.register === 'R1' && registerUpdateEvent.newValue === 42, 'register-update event emitted with correct payload');

// 4. Test Memory Subsystem
console.log('\n4. Testing Memory Subsystem (64 Bytes):');
const memory = new Memory(engine, 64);
assert(memory.size === 64, 'Memory initialized with 64 bytes');
assert(memory.getUsage() > 0, `Initial memory usage tracked (${memory.getUsage()}%)`);

let memEvent = null;
engine.on('memory-access', (data) => { memEvent = data; });
memory.write(0x0028, 99);
assert(memory.read(0x0028) === 99, 'Memory write/read verified at 0x0028');
assert(memEvent !== null && memEvent.type === 'READ' && memEvent.value === 99, 'memory-access event emitted');

// 5. Test ALU Operations & Flags
console.log('\n5. Testing ALU Operations & Flag Evaluation:');
const alu = new ALU(engine);

// ADD
const addRes = alu.execute('ADD', 28, 14);
assert(addRes.result === 42, `28 + 14 = 42 (got ${addRes.result})`);
assert(!addRes.flags.zero && !addRes.flags.negative && !addRes.flags.carry, 'ADD flags valid');

// SUB
const subRes = alu.execute('SUBTRACT', 42, 42);
assert(subRes.result === 0, `42 - 42 = 0 (got ${subRes.result})`);
assert(subRes.flags.zero === true, 'Zero flag (Z) set on 0 result');

// NOT
const notRes = alu.execute('NOT', 0x00);
assert(notRes.result === 0xFF, `NOT ~0x00 = 0xFF (got 0x${notRes.result.toString(16)})`);
assert(notRes.flags.negative === true, 'Negative flag (N) set on MSB=1');

// COMPARE
const cmpRes = alu.execute('COMPARE', 50, 50);
assert(cmpRes.flags.zero === true, 'COMPARE 50 == 50 sets Zero flag');

// 6. Test CPU Pipeline
console.log('\n6. Testing CPU 4-Stage Pipeline:');
const cpu = new CPUPipeline(engine);
assert(cpu.currentStage === 'IDLE', 'CPU starts in IDLE');

let stagesEncountered = [];
engine.on('cpu-stage', (data) => {
  stagesEncountered.push(data.stage);
});

// Run single instruction
await cpu.runInstruction(20);
assert(stagesEncountered.includes('FETCH'), 'FETCH stage executed');
assert(stagesEncountered.includes('DECODE'), 'DECODE stage executed');
assert(stagesEncountered.includes('EXECUTE'), 'EXECUTE stage executed');
assert(stagesEncountered.includes('STORE'), 'STORE stage executed');
assert(cpu.cycleCount === 1, `Cycle count incremented to 1 (got ${cpu.cycleCount})`);

// 7. Test Logger
console.log('\n7. Testing Execution Logger:');
const logger = new Logger(50);
logger.log('Sensor interrupt generated', 'io');
logger.log('Pipeline fetch cycle 0x0010', 'cpu');
assert(logger.getEntries().length === 2, '2 entries logged');
assert(logger.getEntries()[0].category === 'io', 'Category preserved');

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) process.exit(1);
