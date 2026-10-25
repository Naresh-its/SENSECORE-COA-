// ==========================================================================
// SENSECORE - COA LAB SYLLABUS AUTOMATED VERIFICATION SUITE
// Tests all 5 units for mathematical and architectural accuracy
// ==========================================================================

import { Unit1 } from './js/unit1.js';
import { Unit2 } from './js/unit2.js';
import { Unit3 } from './js/unit3.js';
import { Unit4 } from './js/unit4.js';
import { Unit5 } from './js/unit5.js';

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

console.log('=== SENSECORE COA SYLLABUS COMPREHENSIVE TEST SUITE ===\n');

// --------------------------------------------------------------------------
// UNIT 1 TESTS
// --------------------------------------------------------------------------
console.log('1. UNIT 1 — Number Systems, Codes, Arithmetic & Logic Gates:');

// Number conversions
const conv = Unit1.convertNumber('42', 10);
assert(conv.binary === '00101010', 'Decimal 42 converts to binary 00101010');
assert(conv.hex === '2A', 'Decimal 42 converts to hex 2A');
assert(conv.octal === '52', 'Decimal 42 converts to octal 52');

// Gray Code
const gray = Unit1.binaryToGray('1011');
assert(gray === '1110', 'Binary 1011 converts to Gray 1110');
assert(Unit1.grayToBinary('1110') === '1011', 'Gray 1110 converts back to Binary 1011');

// BCD & Excess-3
const bcd = Unit1.decimalToBCD(25);
assert(bcd.rawBCD === '0010 0101', 'Decimal 25 converts to BCD 0010 0101');
const xs3 = Unit1.decimalToExcess3(25);
assert(xs3.rawExcess3 === '0101 1000', 'Decimal 25 converts to Excess-3 0101 1000');

// ASCII
const ascii = Unit1.charToASCII('A');
assert(ascii.decimal === 65 && ascii.hex === '0x41', 'ASCII "A" is decimal 65 / hex 0x41');

// Parity
const parity = Unit1.generateParity('1101001', 'even');
assert(parity.parityBit === 0, 'Even parity for 1101001 (4 ones) has parity bit 0');
const parityCheck = Unit1.checkParity('11010010', 'even');
assert(parityCheck.isClean === true, 'Even parity check passes for 11010010');
const parityCheckErr = Unit1.checkParity('11010011', 'even');
assert(parityCheckErr.isClean === false, 'Even parity check catches corrupted bit in 11010011');

// 2's Complement & Signed Arithmetic
const tc = Unit1.toTwosComplement(-42);
assert(tc.binary === '11010110' && tc.hex === '0xD6', '-42 in 8-bit 2\'s complement is 11010110 (0xD6)');
const addRes = Unit1.binaryArithmetic(25, 17, 'ADD');
assert(addRes.result === 42, 'Binary addition: 25 + 17 = 42');

// BCD Addition
const bcdAdd = Unit1.bcdAddition(7, 8);
assert(bcdAdd.needsCorrection === true && bcdAdd.carryOut === 1 && bcdAdd.correctedNibble === '0101', 'BCD Addition 7 + 8 corrects with +6 to produce 15 (0101 with carry 1)');

// Logic Gates
assert(Unit1.evaluateGate('NAND', 1, 1).output === 0, 'NAND(1, 1) = 0');
assert(Unit1.evaluateGate('XOR', 1, 0).output === 1, 'XOR(1, 0) = 1');
assert(Unit1.evaluateGate('XNOR', 0, 0).output === 1, 'XNOR(0, 0) = 1');

// --------------------------------------------------------------------------
// UNIT 2 TESTS
// --------------------------------------------------------------------------
console.log('\n2. UNIT 2 — Architectures, Buses, Addressing & 8086:');

// Bus Transaction
const busRead = Unit2.simulateBusTransaction('READ', 0x0040, 0xAB);
assert(busRead.addressBus.value === '0x0040', 'Bus read asserts MAR 0x0040 on Address Bus');
assert(busRead.controlBus.readLine === true, 'Control bus asserts MEMR signal');

// Addressing Modes
const immMode = Unit2.addressingModes.find(m => m.id === 'imm').calculate(42);
assert(immMode.value === 42, 'Immediate addressing returns literal operand 42');
const indexedMode = Unit2.addressingModes.find(m => m.id === 'indexed').calculate(8, null, { R2: 0x0020 });
assert(indexedMode.ea === '0x0028', 'Indexed mode calculates EA = [R2] + 8 = 0x0028');

// 8086 Physical Address
const addr8086 = Unit2.calculate8086Address('1234', '0056');
assert(addr8086.physicalAddress === '0x12396', '8086 physical address for CS:1234h, IP:0056h is 12396h');

// --------------------------------------------------------------------------
// UNIT 3 TESTS
// --------------------------------------------------------------------------
console.log('\n3. UNIT 3 — Arithmetic: De Morgan, CLA, CSA, Booth, Division & IEEE 754:');

// De Morgan's Theorem
const dm = Unit3.verifyDeMorgan(1, 0);
assert(dm.t1.verified && dm.t2.verified, 'De Morgan theorems hold for inputs (1, 0)');

// CLA (Carry Lookahead Adder)
const cla = Unit3.carryLookaheadAdder(5, 7, 0); // 5 + 7 = 12
assert(cla.sumVal === 12 && cla.cout === 0, '4-bit CLA computes 5 + 7 = 12');

// CSA (Carry-Save Adder)
const csa = Unit3.carrySaveAdder(3, 4, 5); // 3 + 4 + 5 = 12
assert(csa.finalTotal === 12, 'CSA reduces 3 summands (3, 4, 5) to 12');

// Multipliers
const mulUnsigned = Unit3.unsignedMultiplier(6, 7);
assert(mulUnsigned.product === 42, 'Unsigned multiplier: 6 × 7 = 42');
const booth = Unit3.boothMultiplier(-3, 5);
assert(booth.signedProduct === -15, 'Booth algorithm signed multiplier: -3 × 5 = -15');

// Division
const restDiv = Unit3.restoringDivision(13, 3);
assert(restDiv.quotient === 4 && restDiv.remainder === 1, 'Restoring division: 13 ÷ 3 = Q:4, R:1');
const nonRestDiv = Unit3.nonRestoringDivision(14, 4);
assert(nonRestDiv.quotient === 3 && nonRestDiv.remainder === 2, 'Non-restoring division: 14 ÷ 4 = Q:3, R:2');

// IEEE 754 Floating Point
const floatConv = Unit3.decimalToIEEE754(-12.625);
assert(floatConv.signBit === '1', '-12.625 sign bit is 1 (negative)');
assert(floatConv.unbiasedExponent === 3, '-12.625 unbiased exponent is 3 (2^3 = 8)');

// --------------------------------------------------------------------------
// UNIT 4 TESTS
// --------------------------------------------------------------------------
console.log('\n4. UNIT 4 — Basic Processing Unit, Control Unit & Pipelining:');

// T-states
const steps = Unit4.getInstructionExecutionSteps();
assert(steps.length === 6 && steps[0].step === 'T1', 'Instruction execution has 6 micro-operation T-states');

// Branch Evaluation
const branch = Unit4.evaluateBranch('CONDITIONAL', true, 0x1000, 4);
assert(branch.branchTaken === true && branch.pipelinePenalty === 2, 'Taken branch imposes 2-cycle pipeline penalty');

// Pipeline Performance
const pipePerf = Unit4.calculatePipelinePerformance(100, 5, 2);
assert(parseFloat(pipePerf.speedup) > 4.5, '100 instructions on 5-stage pipeline yields speedup > 4.5');

// ARM Case Study
const arm = Unit4.getARMCaseStudy();
assert(arm.pipeline.stages === 3, 'ARM7 case study specifies 3-stage pipeline');
assert(arm.registers.total === 37, 'ARM architecture specifies 37 physical registers');

// --------------------------------------------------------------------------
// UNIT 5 TESTS
// --------------------------------------------------------------------------
console.log('\n5. UNIT 5 — Parallelism, Flynn, Thumb & I/O:');

// Amdahl's Law
const amdahl = Unit5.calculateAmdahlsLaw(0.75, 4);
assert(parseFloat(amdahl.speedup) === 2.29, 'Amdahl speedup for 75% parallel on 4 cores is ~2.29');

// Flynn's Classification
assert(Unit5.flynnsClassifications.MIMD.instructionStreams === 'Multiple', 'MIMD has Multiple Instruction Streams');
assert(Unit5.flynnsClassifications.SIMD.dataStreams === 'Multiple (Array)', 'SIMD has Multiple Data Streams');

// Multi-Core Workload
const multiCore = Unit5.simulateMultiCoreWorkload(12, 4);
assert(multiCore.cores.length === 4, '4 cores allocated in multi-core simulation');

// Load/Store
const ldr = Unit5.simulateLoadStore('LDR', '0x0020', 8);
assert(ldr.effectiveAddress === '0x0028', 'LDR R1, [R2, #8] calculates EA = 0x0028');

// Thumb instruction set
const thumb = Unit5.getThumbInstructionDetails();
assert(thumb.comparison[0].thumb === '16 bits', 'Thumb instruction length is 16 bits');

// I/O Techniques
const ioOps = Unit5.getIOOperations();
assert(ioOps.techniques.length === 3, '3 I/O techniques modeled: Polling, Interrupt, DMA');

console.log('\n========================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');

if (failed > 0) process.exit(1);
