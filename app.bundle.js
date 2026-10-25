// SENSECORE — COA LAB STANDALONE BUNDLE
(function() {
  'use strict';

  // --- UNIT 1 ---
  // ==========================================================================
// UNIT 1: Introduction to Number Systems and Logic Gates
// Syllabus: Number Systems (Binary, Decimal, Octal, Hexadecimal);
// Codes (Gray, BCD, Excess-3, ASCII); Parity; Binary Arithmetic (Addition,
// Subtraction, Multiplication, Division using Sign Magnitude, 1's complement,
// 2's complement, BCD Arithmetic); Logic Gates (AND, OR, NOT, NAND, NOR, EX-OR, EX-NOR).
// ==========================================================================

const Unit1 = {
  // ------------------------------------------------------------------------
  // 1. Number System Conversions
  // ------------------------------------------------------------------------
  convertNumber(valueStr, fromBase) {
    fromBase = parseInt(fromBase, 10);
    const cleaned = (valueStr || '').toString().trim();
    if (!cleaned) {
      return { decimal: 0, binary: '00000000', octal: '0', hex: '00', bits: [0,0,0,0,0,0,0,0] };
    }

    let dec = 0;
    try {
      dec = parseInt(cleaned, fromBase);
      if (isNaN(dec)) throw new Error('Invalid input');
    } catch {
      return { error: 'Invalid number format for base ' + fromBase };
    }

    // Unsigned 16-bit clamp for safe bitwise representation
    const u16 = (dec >>> 0) & 0xFFFF;
    const binStr = u16.toString(2).padStart(8, '0');
    const octStr = u16.toString(8);
    const hexStr = u16.toString(16).toUpperCase();

    const bitArray = binStr.split('').map(b => parseInt(b, 10));

    return {
      decimal: dec,
      binary: binStr,
      octal: octStr,
      hex: hexStr,
      bits: bitArray,
      breakdown: bitArray.map((bit, idx) => ({
        power: bitArray.length - 1 - idx,
        weight: Math.pow(2, bitArray.length - 1 - idx),
        bit: bit,
        value: bit * Math.pow(2, bitArray.length - 1 - idx)
      }))
    };
  },

  // ------------------------------------------------------------------------
  // 2. Codes: Gray, BCD, Excess-3, ASCII
  // ------------------------------------------------------------------------
  binaryToGray(binStr) {
    const cleaned = (binStr || '').toString().replace(/[^01]/g, '') || '0';
    const n = parseInt(cleaned, 2);
    if (isNaN(n)) return '0';
    const gray = n ^ (n >>> 1);
    return gray.toString(2).padStart(cleaned.length, '0');
  },

  grayToBinary(grayStr) {
    const cleaned = (grayStr || '').toString().replace(/[^01]/g, '') || '0';
    let num = parseInt(cleaned, 2);
    if (isNaN(num)) return '0';
    let mask = num >>> 1;
    while (mask !== 0) {
      num ^= mask;
      mask >>>= 1;
    }
    return num.toString(2).padStart(cleaned.length, '0');
  },

  decimalToBCD(dec) {
    const str = Math.abs(parseInt(dec, 10) || 0).toString();
    const nibbles = [];
    for (let i = 0; i < str.length; i++) {
      const digit = parseInt(str[i], 10);
      nibbles.push({
        digit,
        bcd: digit.toString(2).padStart(4, '0')
      });
    }
    return {
      rawBCD: nibbles.map(n => n.bcd).join(' '),
      nibbles
    };
  },

  decimalToExcess3(dec) {
    const str = Math.abs(parseInt(dec, 10) || 0).toString();
    const nibbles = [];
    for (let i = 0; i < str.length; i++) {
      const digit = parseInt(str[i], 10);
      const xs3Digit = digit + 3;
      nibbles.push({
        digit,
        xs3Digit,
        xs3: xs3Digit.toString(2).padStart(4, '0')
      });
    }
    return {
      rawExcess3: nibbles.map(n => n.xs3).join(' '),
      nibbles
    };
  },

  charToASCII(char) {
    if (!char) return null;
    const code = char.charCodeAt(0);
    return {
      char: char[0],
      decimal: code,
      hex: '0x' + code.toString(16).toUpperCase().padStart(2, '0'),
      binary7: (code & 0x7F).toString(2).padStart(7, '0'),
      binary8: (code & 0xFF).toString(2).padStart(8, '0')
    };
  },

  // ------------------------------------------------------------------------
  // 3. Parity Generation & Checking
  // ------------------------------------------------------------------------
  generateParity(bitStr, type = 'even') {
    const bits = (bitStr || '').toString().replace(/[^01]/g, '').split('').map(Number);
    const onesCount = bits.filter(b => b === 1).length;
    let parityBit = 0;
    if (type === 'even') {
      parityBit = (onesCount % 2 === 0) ? 0 : 1;
    } else {
      parityBit = (onesCount % 2 === 1) ? 0 : 1;
    }
    return {
      dataBits: bits.join(''),
      parityType: type,
      onesCount,
      parityBit,
      transmittedBits: bits.join('') + parityBit
    };
  },

  checkParity(transmittedStr, type = 'even') {
    const bits = (transmittedStr || '').toString().replace(/[^01]/g, '').split('').map(Number);
    if (bits.length < 2) return { valid: false, error: 'At least 2 bits needed (data + parity)' };
    const dataBits = bits.slice(0, -1);
    const receivedParity = bits[bits.length - 1];
    const onesCount = dataBits.filter(b => b === 1).length;
    const expectedParity = (type === 'even') ? (onesCount % 2 === 0 ? 0 : 1) : (onesCount % 2 === 1 ? 0 : 1);
    const isClean = (receivedParity === expectedParity);
    return {
      dataBits: dataBits.join(''),
      receivedParity,
      expectedParity,
      isClean,
      onesCount,
      status: isClean ? 'NO ERROR DETECTED' : 'PARITY ERROR DETECTED (Bit corruption detected)'
    };
  },

  // ------------------------------------------------------------------------
  // 4. Binary Arithmetic & Representations (8-bit)
  // ------------------------------------------------------------------------
  toSignedMagnitude(val) {
    val = parseInt(val, 10) || 0;
    if (val < -127 || val > 127) return { error: 'Value out of 8-bit range [-127, 127]' };
    const signBit = val < 0 ? 1 : 0;
    const mag = Math.abs(val).toString(2).padStart(7, '0');
    return {
      value: val,
      signBit,
      magnitudeBits: mag,
      binary: `${signBit}${mag}`,
      formatted: `${signBit} | ${mag}`
    };
  },

  toOnesComplement(val) {
    val = parseInt(val, 10) || 0;
    if (val < -127 || val > 127) return { error: 'Value out of 8-bit range [-127, 127]' };
    if (val >= 0) {
      const bin = val.toString(2).padStart(8, '0');
      return { value: val, binary: bin, hex: '0x' + val.toString(16).toUpperCase() };
    } else {
      const posBin = Math.abs(val).toString(2).padStart(8, '0');
      const invBin = posBin.split('').map(b => b === '0' ? '1' : '0').join('');
      return {
        value: val,
        positiveBinary: posBin,
        binary: invBin,
        hex: '0x' + parseInt(invBin, 2).toString(16).toUpperCase()
      };
    }
  },

  toTwosComplement(val) {
    val = parseInt(val, 10) || 0;
    if (val < -128 || val > 127) return { error: 'Value out of 8-bit range [-128, 127]' };
    const u8 = (val & 0xFF);
    const bin = u8.toString(2).padStart(8, '0');
    return {
      value: val,
      binary: bin,
      hex: '0x' + u8.toString(16).toUpperCase().padStart(2, '0'),
      msb: bin[0],
      isNegative: val < 0
    };
  },

  binaryArithmetic(a, b, op, mode = 'unsigned') {
    a = parseInt(a, 10) || 0;
    b = parseInt(b, 10) || 0;
    let result = 0;
    let carryOut = false;
    let overflow = false;
    let steps = [];

    if (op === 'ADD') {
      result = a + b;
      carryOut = (result > 255 || result < 0);
      if (mode === 'twos') {
        const sA = (a >> 7) & 1;
        const sB = (b >> 7) & 1;
        const sR = ((result & 0xFF) >> 7) & 1;
        overflow = (sA === sB && sA !== sR);
      }
      steps.push(`Binary Addition: ${a} + ${b} = ${result}`);
    } else if (op === 'SUB') {
      result = a - b;
      carryOut = (b > a);
      if (mode === 'twos') {
        const sA = (a >> 7) & 1;
        const sB = (b >> 7) & 1;
        const sR = ((result & 0xFF) >> 7) & 1;
        overflow = (sA !== sB && sA !== sR);
      }
      steps.push(`Binary Subtraction: ${a} - ${b} = ${result}`);
    } else if (op === 'MUL') {
      result = a * b;
      carryOut = result > 255;
      steps.push(`Binary Multiplication: ${a} × ${b} = ${result}`);
    } else if (op === 'DIV') {
      if (b === 0) return { error: 'Division by zero' };
      const quotient = Math.floor(a / b);
      const remainder = a % b;
      result = quotient;
      steps.push(`Binary Division: ${a} ÷ ${b} = Quotient ${quotient}, Remainder ${remainder}`);
      return {
        a, b, op,
        quotient,
        remainder,
        quotientBin: (quotient & 0xFF).toString(2).padStart(8, '0'),
        remainderBin: (remainder & 0xFF).toString(2).padStart(8, '0'),
        steps
      };
    }

    const res8 = result & 0xFF;
    return {
      a, b, op, mode,
      result: mode === 'twos' ? ((res8 & 0x80) ? res8 - 256 : res8) : result,
      raw8: res8,
      binary: res8.toString(2).padStart(8, '0'),
      carryOut,
      overflow,
      zeroFlag: (res8 === 0),
      signFlag: Boolean(res8 & 0x80),
      steps
    };
  },

  bcdAddition(digitA, digitB) {
    digitA = parseInt(digitA, 10) || 0;
    digitB = parseInt(digitB, 10) || 0;
    if (digitA > 9 || digitB > 9 || digitA < 0 || digitB < 0) {
      return { error: 'BCD digits must be between 0 and 9' };
    }

    const binA = digitA.toString(2).padStart(4, '0');
    const binB = digitB.toString(2).padStart(4, '0');
    const initialSum = digitA + digitB;
    const initialBin = initialSum.toString(2).padStart(5, '0');

    const needsCorrection = initialSum > 9;
    let finalSum = initialSum;
    let correctionApplied = false;
    let carryOut = 0;

    if (needsCorrection) {
      correctionApplied = true;
      finalSum = initialSum + 6;
      carryOut = 1;
    }

    const correctedNibble = (finalSum & 0x0F).toString(2).padStart(4, '0');

    return {
      digitA,
      digitB,
      binA,
      binB,
      initialSum,
      initialBin,
      needsCorrection,
      correctionApplied,
      carryOut,
      correctedNibble,
      resultDecimal: initialSum,
      explanation: needsCorrection 
        ? `Sum (${initialSum}) exceeds 9 (1001). Added +6 (0110) to correct. Carry out = 1, BCD units = ${correctedNibble} (${finalSum & 0x0F}).`
        : `Sum (${initialSum}) ≤ 9 (1001). Valid BCD, no correction required.`
    };
  },

  // ------------------------------------------------------------------------
  // 5. Logic Gates Laboratory
  // ------------------------------------------------------------------------
  evaluateGate(gate, inputA, inputB = 0) {
    const a = inputA ? 1 : 0;
    const b = inputB ? 1 : 0;
    let output = 0;
    let formula = '';

    switch (gate.toUpperCase()) {
      case 'AND':
        output = (a && b) ? 1 : 0;
        formula = 'Y = A · B';
        break;
      case 'OR':
        output = (a || b) ? 1 : 0;
        formula = 'Y = A + B';
        break;
      case 'NOT':
        output = (!a) ? 1 : 0;
        formula = 'Y = Ā';
        break;
      case 'NAND':
        output = !(a && b) ? 1 : 0;
        formula = 'Y = (A · B)̄';
        break;
      case 'NOR':
        output = !(a || b) ? 1 : 0;
        formula = 'Y = (A + B)̄';
        break;
      case 'XOR':
      case 'EX-OR':
        output = (a ^ b) ? 1 : 0;
        formula = 'Y = A ⊕ B';
        break;
      case 'XNOR':
      case 'EX-NOR':
        output = !(a ^ b) ? 1 : 0;
        formula = 'Y = (A ⊕ B)̄';
        break;
      default:
        output = 0;
        formula = 'Y = ?';
    }

    return {
      gate: gate.toUpperCase(),
      inputA: a,
      inputB: b,
      output,
      formula
    };
  },

  getTruthTable(gate) {
    const g = gate.toUpperCase();
    if (g === 'NOT') {
      return [
        { a: 0, out: 1 },
        { a: 1, out: 0 }
      ];
    }
    const table = [];
    const combos = [[0,0], [0,1], [1,0], [1,1]];
    for (const [a, b] of combos) {
      table.push({
        a, b,
        out: this.evaluateGate(g, a, b).output
      });
    }
    return table;
  }
};


  // --- UNIT 2 ---
  // ==========================================================================
// UNIT 2: Architectures
// Syllabus: Basic structure of computers: Functional Units of a computer,
// Operational concepts, Bus structures, Memory addresses and operations,
// assembly language, Instructions, Instruction sequencing, Addressing modes.
// Case study: 8086.
// ==========================================================================

const Unit2 = {
  // ------------------------------------------------------------------------
  // 1. Functional Units Information
  // ------------------------------------------------------------------------
  functionalUnits: {
    input: {
      name: 'Input Unit',
      role: 'Transfers external instructions, operands, and data into the computer system memory.',
      components: ['Keyboard Controller', 'Serial Interface', 'Transducer ADC Input Registers'],
      busConnections: 'Connects to I/O Bus & System Data Bus via input buffer interface.'
    },
    memory: {
      name: 'Memory Unit',
      role: 'Stores both program instructions (Code Segment) and data values (Data Segment) in uniform byte-addressable cells.',
      components: ['MAR (Memory Address Register)', 'MDR/MBR (Memory Data Register)', 'Address Decoder Matrix', 'SRAM Cell Array'],
      busConnections: 'Receives target address from Address Bus; bidirectional data exchange over Data Bus; strobed by MEMR/MEMW on Control Bus.'
    },
    alu: {
      name: 'Arithmetic and Logic Unit (ALU)',
      role: 'Executes high-speed binary arithmetic (+, -, *, /) and bitwise Boolean logic (AND, OR, NOT, XOR, shifts).',
      components: ['Adder-Subtractor Core', 'Status/Flags Register (Z, N, C, V)', 'Temporary Accumulators (Y, Z)'],
      busConnections: 'Fed from Internal CPU Bus / Register File; outputs computation results to destination bus.'
    },
    control: {
      name: 'Control Unit (CU)',
      role: 'The nerve center of the processor. Decodes instructions and generates synchronized micro-operations/timing signals.',
      components: ['Instruction Register (IR)', 'Instruction Decoder', 'Step Counter / Timing Generator', 'Hardwired Control Matrix / Microcode ROM'],
      busConnections: 'Issues Read/Write, Clock, Interrupt Acknowledge, and Strobe pulses onto the Control Bus.'
    },
    output: {
      name: 'Output Unit',
      role: 'Converts processed internal digital binary results into human-readable or hardware control signals.',
      components: ['Display Drivers', 'DAC Output Buffers', 'Peripheral Control Ports'],
      busConnections: 'Receives data from System Data Bus under Control Bus synchronization.'
    }
  },

  // ------------------------------------------------------------------------
  // 2. Bus Structures & Operational Concept Simulator
  // ------------------------------------------------------------------------
  simulateBusTransaction(type, address, data = 0) {
    const addr = parseInt(address, 10) & 0xFFFF;
    const val = parseInt(data, 10) & 0xFF;
    const addrHex = '0x' + addr.toString(16).toUpperCase().padStart(4, '0');
    const dataHex = '0x' + val.toString(16).toUpperCase().padStart(2, '0');
    const dataBin = val.toString(2).padStart(8, '0');
    const addrBin = addr.toString(2).padStart(16, '0');

    if (type.toUpperCase() === 'READ') {
      return {
        type: 'READ',
        mar: addrHex,
        mdr: dataHex,
        addressBus: { value: addrHex, binary: addrBin, active: true },
        dataBus: { value: dataHex, binary: dataBin, active: true, direction: 'Memory -> CPU' },
        controlBus: { signal: 'MEMR (Memory Read Active)', active: true, readLine: true, writeLine: false },
        steps: [
          `T1: CPU places target address ${addrHex} into MAR (Memory Address Register).`,
          `T2: Address Bus is asserted with ${addrHex} and Control Bus asserts MEMR signal.`,
          `T3: Memory cell at ${addrHex} decodes address and places stored byte ${dataHex} onto Data Bus.`,
          `T4: CPU latches Data Bus contents into MDR (Memory Data Register).`
        ]
      };
    } else {
      return {
        type: 'WRITE',
        mar: addrHex,
        mdr: dataHex,
        addressBus: { value: addrHex, binary: addrBin, active: true },
        dataBus: { value: dataHex, binary: dataBin, active: true, direction: 'CPU -> Memory' },
        controlBus: { signal: 'MEMW (Memory Write Active)', active: true, readLine: false, writeLine: true },
        steps: [
          `T1: CPU places target address ${addrHex} into MAR and operand byte ${dataHex} into MDR.`,
          `T2: Address Bus is asserted with ${addrHex}; Data Bus is driven with ${dataHex}.`,
          `T3: Control Bus asserts MEMW (Memory Write strobe).`,
          `T4: Storage cells at ${addrHex} latch Data Bus contents, completing write cycle.`
        ]
      };
    }
  },

  // ------------------------------------------------------------------------
  // 3. Addressing Modes
  // ------------------------------------------------------------------------
  addressingModes: [
    {
      id: 'imm',
      name: 'Immediate Addressing',
      syntax: 'MOV R1, #42',
      formula: 'Operand = Value in instruction',
      example: 'R1 ← 42 (0x2A)',
      description: 'The operand value is part of the instruction itself. No memory reference is required to fetch data.',
      calculate: (param) => ({
        ea: 'N/A (Embedded in Opcode)',
        value: parseInt(param, 10) || 42,
        cycles: 1
      })
    },
    {
      id: 'dir',
      name: 'Direct / Absolute Addressing',
      syntax: 'MOV R1, [0x0024]',
      formula: 'EA = Address field A; Operand = [EA]',
      example: 'EA = 0x0024, R1 ← [0x0024]',
      description: 'The instruction contains the full memory address of the operand. Requires one memory read cycle.',
      calculate: (param, memory) => {
        const addr = parseInt(param, 16) || 0x0024;
        const val = memory ? memory[addr & 0x3F] : 85;
        return {
          ea: '0x' + addr.toString(16).toUpperCase().padStart(4, '0'),
          value: val,
          cycles: 2
        };
      }
    },
    {
      id: 'reg',
      name: 'Register Direct Addressing',
      syntax: 'MOV R1, R2',
      formula: 'EA = Register R2; Operand = Contents of R2',
      example: 'R1 ← [R2]',
      description: 'The operand resides in a general-purpose processor register. Very fast execution with zero bus traffic.',
      calculate: (param, _, regs) => {
        const rVal = regs ? regs['R2'] : 0x3F;
        return {
          ea: 'Register R2',
          value: rVal,
          cycles: 1
        };
      }
    },
    {
      id: 'reg_ind',
      name: 'Register Indirect Addressing',
      syntax: 'MOV R1, [R2]',
      formula: 'EA = [Register R2]; Operand = [[R2]]',
      example: 'If R2 = 0x0030, EA = 0x0030, R1 ← [0x0030]',
      description: 'Register contains the memory address of the operand. Essential for pointer manipulation and array iterations.',
      calculate: (param, memory, regs) => {
        const ptr = regs ? regs['R2'] : 0x0010;
        const val = memory ? memory[ptr & 0x3F] : 0x7E;
        return {
          ea: '0x' + ptr.toString(16).toUpperCase().padStart(4, '0'),
          value: val,
          cycles: 2
        };
      }
    },
    {
      id: 'indexed',
      name: 'Indexed / Displacement Addressing',
      syntax: 'MOV R1, 10[R2]',
      formula: 'EA = [Index Register] + Offset',
      example: 'If R2 = 0x0020, EA = 0x0020 + 10 = 0x002A',
      description: 'Effective address is computed by adding a constant displacement offset to an index/base register.',
      calculate: (offset, memory, regs) => {
        const off = parseInt(offset, 10) || 10;
        const base = regs ? regs['R2'] : 0x0020;
        const ea = (base + off) & 0xFFFF;
        const val = memory ? memory[ea & 0x3F] : 0xAA;
        return {
          ea: '0x' + ea.toString(16).toUpperCase().padStart(4, '0'),
          formula: `${base} + ${off} = ${ea}`,
          value: val,
          cycles: 3
        };
      }
    },
    {
      id: 'relative',
      name: 'Relative Addressing (PC-Relative)',
      syntax: 'JMP $+16',
      formula: 'EA = [PC] + Offset',
      example: 'If PC = 0x0100, Target = 0x0100 + 16 = 0x0110',
      description: 'Address is calculated relative to the Program Counter. Used for position-independent branch instructions.',
      calculate: (offset, _, regs) => {
        const off = parseInt(offset, 10) || 16;
        const pc = regs ? regs['PC'] : 0x0100;
        const ea = (pc + off) & 0xFFFF;
        return {
          ea: '0x' + ea.toString(16).toUpperCase().padStart(4, '0'),
          formula: `PC (${pc}) + ${off} = ${ea}`,
          value: 'Branch Target',
          cycles: 2
        };
      }
    },
    {
      id: 'autoincrement',
      name: 'Auto-Increment Addressing',
      syntax: 'MOV R1, (R2)+',
      formula: 'EA = [R2]; then R2 ← [R2] + d',
      example: 'R1 ← [R2], then R2 increments by word size',
      description: 'Accesses the operand at the address in register, then automatically increments the register pointer.',
      calculate: (step, memory, regs) => {
        const r2 = regs ? regs['R2'] : 0x0014;
        const next = r2 + 1;
        return {
          ea: '0x' + r2.toString(16).toUpperCase().padStart(4, '0'),
          value: 0x55,
          postAction: `R2 updated: 0x${r2.toString(16)} → 0x${next.toString(16)}`,
          cycles: 2
        };
      }
    }
  ],

  // ------------------------------------------------------------------------
  // 4. Instructions & Instruction Sequencing
  // ------------------------------------------------------------------------
  sampleProgram: [
    { pc: 0x0010, instruction: 'MOV R1, #15', opcode: '0x3E 0x0F', desc: 'Initialize R1 with immediate value 15' },
    { pc: 0x0012, instruction: 'MOV R2, [0x0028]', opcode: '0x78 0x28', desc: 'Load memory operand at 0x0028 into R2' },
    { pc: 0x0014, instruction: 'ADD R1, R2', opcode: '0x80', desc: 'Compute R1 = R1 + R2; Update flags' },
    { pc: 0x0015, instruction: 'STORE R1, [0x0030]', opcode: '0x77 0x30', desc: 'Write sum from R1 to RAM 0x0030' },
    { pc: 0x0017, instruction: 'CMP R1, #50', opcode: '0xBF 0x32', desc: 'Compare R1 with threshold 50' },
    { pc: 0x0019, instruction: 'JNZ 0x0010', opcode: '0x75 0xF5', desc: 'Loop back if Zero flag is clear' },
    { pc: 0x001B, instruction: 'HLT', opcode: '0x76', desc: 'Halt execution' }
  ],

  // ------------------------------------------------------------------------
  // 5. Case Study: Intel 8086 Microprocessor
  // ------------------------------------------------------------------------
  calculate8086Address(segment, offset) {
    const seg = parseInt(segment, 16) || 0;
    const off = parseInt(offset, 16) || 0;
    const segBase = (seg << 4) >>> 0; // Shift left by 4 bits (multiply by 16)
    const physical = (segBase + off) & 0xFFFFF; // 20-bit address space (1 MB)

    return {
      segment: '0x' + seg.toString(16).toUpperCase().padStart(4, '0'),
      offset: '0x' + off.toString(16).toUpperCase().padStart(4, '0'),
      segmentBase: '0x' + segBase.toString(16).toUpperCase().padStart(5, '0'),
      physicalAddress: '0x' + physical.toString(16).toUpperCase().padStart(5, '0'),
      formula: `(${seg.toString(16).toUpperCase()}h × 10h) + ${off.toString(16).toUpperCase()}h = ${physical.toString(16).toUpperCase()}h`,
      decimal: physical,
      kbyte: (physical / 1024).toFixed(2) + ' KB'
    };
  },

  get8086Architecture() {
    return {
      biu: {
        title: 'Bus Interface Unit (BIU)',
        registers: [
          { name: 'CS', desc: 'Code Segment Register (Points to 64KB code segment)' },
          { name: 'DS', desc: 'Data Segment Register (Points to 64KB data segment)' },
          { name: 'SS', desc: 'Stack Segment Register (Points to stack memory segment)' },
          { name: 'ES', desc: 'Extra Segment Register (Auxiliary string/data segment)' },
          { name: 'IP', desc: 'Instruction Pointer (Offset to next instruction byte in CS)' }
        ],
        queue: '6-Byte Instruction Prefetch Queue (Enables early pipelining / instruction overlap)',
        busControl: 'Bus Control Logic generates external system bus memory and I/O control signals.'
      },
      eu: {
        title: 'Execution Unit (EU)',
        registers: [
          { name: 'AX', desc: 'Accumulator (16-bit, split into AH & AL) for I/O & arithmetic' },
          { name: 'BX', desc: 'Base Register (Can hold memory base address for addressing modes)' },
          { name: 'CX', desc: 'Count Register (Used as loop and shift/rotate counter)' },
          { name: 'DX', desc: 'Data Register (Multiplication/division 32-bit results, I/O port pointer)' },
          { name: 'SP', desc: 'Stack Pointer (Points to current top of stack in SS)' },
          { name: 'BP', desc: 'Base Pointer (Used to access stack parameters & local variables)' },
          { name: 'SI', desc: 'Source Index (Used in string operations and indexed addressing)' },
          { name: 'DI', desc: 'Destination Index (Target pointer for string operations)' }
        ],
        alu: '16-bit ALU performs arithmetic and logical operations.',
        flags: '16-bit Flags Register: 6 Status Flags (CF, PF, AF, ZF, SF, OF) and 3 Control Flags (TF, IF, DF).'
      }
    };
  }
};


  // --- UNIT 3 ---
  // ==========================================================================
// UNIT 3: Design of ALU / Arithmetic
// Syllabus: De Morgan's Theorem, Adders, Multiplier - Unsigned, Signed,
// Fast Carry Addition of summands. Division-Restoring and Non-Restoring;
// IEEE 754 Floating point numbers and operations.
// ==========================================================================

const Unit3 = {
  // ------------------------------------------------------------------------
  // 1. De Morgan's Theorem
  // ------------------------------------------------------------------------
  verifyDeMorgan(a, b) {
    const bitA = a ? 1 : 0;
    const bitB = b ? 1 : 0;

    // Theorem 1: ~(A & B) == ~A | ~B
    const t1_lhs = !(bitA && bitB) ? 1 : 0;
    const t1_rhs = (!bitA || !bitB) ? 1 : 0;
    const t1_valid = (t1_lhs === t1_rhs);

    // Theorem 2: ~(A | B) == ~A & ~B
    const t2_lhs = !(bitA || bitB) ? 1 : 0;
    const t2_rhs = (!bitA && !bitB) ? 1 : 0;
    const t2_valid = (t2_lhs === t2_rhs);

    return {
      bitA, bitB,
      t1: { lhs: t1_lhs, rhs: t1_rhs, verified: t1_valid, formula: '¬(A ∧ B) ≡ ¬A ∨ ¬B' },
      t2: { lhs: t2_lhs, rhs: t2_rhs, verified: t2_valid, formula: '¬(A ∨ B) ≡ ¬A ∧ ¬B' }
    };
  },

  getDeMorganTruthTables() {
    const rows = [];
    const combos = [[0,0], [0,1], [1,0], [1,1]];
    for (const [a, b] of combos) {
      const res = this.verifyDeMorgan(a, b);
      rows.push({
        a, b,
        notA: a ? 0 : 1,
        notB: b ? 0 : 1,
        t1_lhs: res.t1.lhs,
        t1_rhs: res.t1.rhs,
        t2_lhs: res.t2.lhs,
        t2_rhs: res.t2.rhs
      });
    }
    return rows;
  },

  // ------------------------------------------------------------------------
  // 2. Adders (Half, Full, CLA, Carry-Save Adder)
  // ------------------------------------------------------------------------
  halfAdder(a, b) {
    const bitA = a ? 1 : 0;
    const bitB = b ? 1 : 0;
    return {
      sum: bitA ^ bitB,
      carry: bitA & bitB,
      formula: 'Sum = A ⊕ B, Carry = A · B'
    };
  },

  fullAdder(a, b, cin = 0) {
    const bitA = a ? 1 : 0;
    const bitB = b ? 1 : 0;
    const bitC = cin ? 1 : 0;
    const sum = bitA ^ bitB ^ bitC;
    const carry = (bitA & bitB) | (bitC & (bitA ^ bitB));
    return {
      sum,
      carry,
      formula: 'Sum = A ⊕ B ⊕ Cin, Cout = (A · B) + (Cin · (A ⊕ B))'
    };
  },

  // 4-bit Carry-Lookahead Adder (CLA)
  carryLookaheadAdder(a4, b4, c0 = 0) {
    const a = (parseInt(a4, 10) || 0) & 0x0F;
    const b = (parseInt(b4, 10) || 0) & 0x0F;
    const cin = c0 ? 1 : 0;

    const aBits = a.toString(2).padStart(4, '0').split('').map(Number).reverse();
    const bBits = b.toString(2).padStart(4, '0').split('').map(Number).reverse();

    const G = []; // Generate
    const P = []; // Propagate
    const C = [cin]; // Carries
    const S = []; // Sum bits

    for (let i = 0; i < 4; i++) {
      G[i] = aBits[i] & bBits[i];
      P[i] = aBits[i] ^ bBits[i];
    }

    // Direct CLA equations (parallel calculation in constant gate delay)
    C[1] = G[0] | (P[0] & C[0]);
    C[2] = G[1] | (P[1] & G[0]) | (P[1] & P[0] & C[0]);
    C[3] = G[2] | (P[2] & G[1]) | (P[2] & P[1] & G[0]) | (P[2] & P[1] & P[0] & C[0]);
    C[4] = G[3] | (P[3] & G[2]) | (P[3] & P[2] & G[1]) | (P[3] & P[2] & P[1] & G[0]) | (P[3] & P[2] & P[1] & P[0] & C[0]);

    for (let i = 0; i < 4; i++) {
      S[i] = P[i] ^ C[i];
    }

    const sumVal = (S[3] << 3) | (S[2] << 2) | (S[1] << 1) | S[0];
    const total = (C[4] << 4) | sumVal;

    return {
      a, b, cin,
      aBits: aBits.slice().reverse(),
      bBits: bBits.slice().reverse(),
      G: G.slice().reverse(),
      P: P.slice().reverse(),
      C: C.slice().reverse(),
      sumBits: S.slice().reverse(),
      sumVal,
      cout: C[4],
      total,
      gateDelays: 'CLA Carry Delay: 2 Gate Delays (vs 8 in Ripple Carry)'
    };
  },

  // Carry-Save Adder (CSA) for 3 summands (X, Y, Z)
  carrySaveAdder(x, y, z) {
    x = (parseInt(x, 10) || 0) & 0x0F;
    y = (parseInt(y, 10) || 0) & 0x0F;
    z = (parseInt(z, 10) || 0) & 0x0F;

    const xBits = x.toString(2).padStart(4, '0').split('').map(Number);
    const yBits = y.toString(2).padStart(4, '0').split('').map(Number);
    const zBits = z.toString(2).padStart(4, '0').split('').map(Number);

    const sumVector = [];
    const carryVector = [];

    for (let i = 0; i < 4; i++) {
      const a = xBits[i];
      const b = yBits[i];
      const c = zBits[i];
      // Full adder without carry propagation
      sumVector[i] = a ^ b ^ c;
      carryVector[i] = (a & b) | (b & c) | (a & c);
    }

    const sumNum = parseInt(sumVector.join(''), 2);
    // Carry vector shifted left by 1 position
    const carryNum = parseInt(carryVector.join('') + '0', 2);
    const finalTotal = sumNum + carryNum;

    return {
      x, y, z,
      xBits: xBits.join(''),
      yBits: yBits.join(''),
      zBits: zBits.join(''),
      sumVector: sumVector.join(''),
      carryVector: carryVector.join('') + '0',
      sumNum,
      carryNum,
      finalTotal,
      expectedTotal: x + y + z,
      explanation: 'CSA reduces 3 summands to 2 summands in 1 adder delay without propagating carries across bit positions.'
    };
  },

  // ------------------------------------------------------------------------
  // 3. Multipliers: Unsigned & Signed (Booth's Algorithm)
  // ------------------------------------------------------------------------
  unsignedMultiplier(multiplicand, multiplier) {
    const M = (parseInt(multiplicand, 10) || 0) & 0x0F; // 4-bit
    const Q = (parseInt(multiplier, 10) || 0) & 0x0F;   // 4-bit

    let A = 0;
    let qReg = Q;
    const steps = [];

    steps.push({
      step: 0,
      action: 'Initialization',
      A: A.toString(2).padStart(4, '0'),
      Q: qReg.toString(2).padStart(4, '0'),
      M: M.toString(2).padStart(4, '0')
    });

    for (let i = 0; i < 4; i++) {
      const lsb = qReg & 1;
      let action = '';
      if (lsb === 1) {
        A = (A + M);
        action = 'Add M to A, then Shift Right';
      } else {
        action = 'No addition, Shift Right';
      }

      // Shift Right (A, Q) as combined 9-bit register
      const combined = ((A << 4) | qReg) >>> 1;
      A = (combined >>> 4) & 0x0F;
      qReg = combined & 0x0F;

      steps.push({
        step: i + 1,
        action,
        lsb,
        A: A.toString(2).padStart(4, '0'),
        Q: qReg.toString(2).padStart(4, '0')
      });
    }

    const product = (A << 4) | qReg;
    return {
      multiplicand: M,
      multiplier: Q,
      product,
      productBin: product.toString(2).padStart(8, '0'),
      steps
    };
  },

  boothMultiplier(multiplicand, multiplier) {
    // 4-bit signed operands in range [-8, 7]
    let mVal = parseInt(multiplicand, 10) || 0;
    let qVal = parseInt(multiplier, 10) || 0;
    mVal = Math.max(-8, Math.min(7, mVal));
    qVal = Math.max(-8, Math.min(7, qVal));

    const M = mVal & 0x0F;
    const negM = (-mVal) & 0x0F;
    let A = 0;
    let Q = qVal & 0x0F;
    let qMinus1 = 0;
    const steps = [];

    steps.push({
      cycle: 0,
      action: 'Initial state',
      A: A.toString(2).padStart(4, '0'),
      Q: Q.toString(2).padStart(4, '0'),
      qMinus1,
      M: M.toString(2).padStart(4, '0')
    });

    for (let i = 0; i < 4; i++) {
      const q0 = Q & 1;
      let action = '';

      if (q0 === 1 && qMinus1 === 0) {
        // Subtract M (A = A - M)
        A = (A + negM) & 0x0F;
        action = 'Q0 Q-1 = 10 -> A = A - M, Arithmetic Shift Right';
      } else if (q0 === 0 && qMinus1 === 1) {
        // Add M (A = A + M)
        A = (A + M) & 0x0F;
        action = 'Q0 Q-1 = 01 -> A = A + M, Arithmetic Shift Right';
      } else {
        action = `Q0 Q-1 = ${q0}${qMinus1} -> Only Arithmetic Shift Right`;
      }

      // Arithmetic Right Shift (preserve MSB of A)
      const signBit = (A & 0x08);
      qMinus1 = Q & 1;
      Q = ((A & 1) << 3) | (Q >>> 1);
      A = signBit | (A >>> 1);

      steps.push({
        cycle: i + 1,
        action,
        A: A.toString(2).padStart(4, '0'),
        Q: Q.toString(2).padStart(4, '0'),
        qMinus1
      });
    }

    const raw8 = ((A << 4) | Q) & 0xFF;
    const signedProduct = (raw8 & 0x80) ? raw8 - 256 : raw8;

    return {
      multiplicand: mVal,
      multiplier: qVal,
      signedProduct,
      productBin: raw8.toString(2).padStart(8, '0'),
      expected: mVal * qVal,
      steps
    };
  },

  // ------------------------------------------------------------------------
  // 4. Division: Restoring and Non-Restoring
  // ------------------------------------------------------------------------
  restoringDivision(dividend, divisor) {
    const Q_init = (parseInt(dividend, 10) || 0) & 0x0F; // 4-bit dividend
    const M = (parseInt(divisor, 10) || 1) & 0x0F;       // 4-bit divisor
    if (M === 0) return { error: 'Division by zero' };

    let A = 0;
    let Q = Q_init;
    const steps = [];

    steps.push({
      step: 0,
      action: 'Initialize registers',
      A: A.toString(2).padStart(5, '0'),
      Q: Q.toString(2).padStart(4, '0')
    });

    for (let i = 0; i < 4; i++) {
      // 1. Shift Left A and Q
      const qMsb = (Q & 0x08) >> 3;
      A = ((A << 1) | qMsb) & 0x1F;
      Q = (Q << 1) & 0x0F;

      // 2. Subtract M from A
      const prevA = A;
      A = (A - M);

      let action = '';
      if (A < 0) {
        // Negative result -> Restore A and set Q0 = 0
        A = (A + M) & 0x1F;
        Q = Q & 0x0E; // Q0 = 0
        action = `Shift Left, Subtract M (${M}) -> Negative (A < 0), Restored A, Q0=0`;
      } else {
        // Positive result -> Keep A and set Q0 = 1
        A = A & 0x1F;
        Q = (Q | 1); // Q0 = 1
        action = `Shift Left, Subtract M (${M}) -> Non-negative (A >= 0), Q0=1`;
      }

      steps.push({
        step: i + 1,
        action,
        A: A.toString(2).padStart(5, '0'),
        Q: Q.toString(2).padStart(4, '0')
      });
    }

    return {
      dividend: Q_init,
      divisor: M,
      quotient: Q,
      remainder: A,
      quotientBin: Q.toString(2).padStart(4, '0'),
      remainderBin: A.toString(2).padStart(4, '0'),
      steps
    };
  },

  nonRestoringDivision(dividend, divisor) {
    const Q_init = (parseInt(dividend, 10) || 0) & 0x0F;
    const M = (parseInt(divisor, 10) || 1) & 0x0F;
    if (M === 0) return { error: 'Division by zero' };

    let A = 0;
    let Q = Q_init;
    const steps = [];

    steps.push({
      step: 0,
      action: 'Initialize registers',
      A: A.toString(2).padStart(5, '0'),
      Q: Q.toString(2).padStart(4, '0')
    });

    for (let i = 0; i < 4; i++) {
      const isNeg = (A < 0);
      const qMsb = (Q & 0x08) >> 3;
      A = ((A << 1) | qMsb);
      Q = (Q << 1) & 0x0F;

      let action = '';
      if (isNeg) {
        A = A + M;
        action = `A was negative -> Shift Left and ADD M (${M})`;
      } else {
        A = A - M;
        action = `A was non-negative -> Shift Left and SUBTRACT M (${M})`;
      }

      if (A < 0) {
        Q = Q & 0x0E; // Q0 = 0
        action += ' -> Result < 0, set Q0 = 0';
      } else {
        Q = Q | 1; // Q0 = 1
        action += ' -> Result >= 0, set Q0 = 1';
      }

      steps.push({
        step: i + 1,
        action,
        A: (A < 0 ? (A & 0x1F) : A).toString(2).padStart(5, '0'),
        Q: Q.toString(2).padStart(4, '0'),
        rawA: A
      });
    }

    // Final correction if remainder is negative
    let corrected = false;
    if (A < 0) {
      A = A + M;
      corrected = true;
      steps.push({
        step: 'Correction',
        action: `Final A is negative -> Add M (${M}) to restore true remainder`,
        A: (A & 0x1F).toString(2).padStart(5, '0'),
        Q: Q.toString(2).padStart(4, '0')
      });
    }

    return {
      dividend: Q_init,
      divisor: M,
      quotient: Q,
      remainder: A & 0x0F,
      quotientBin: Q.toString(2).padStart(4, '0'),
      remainderBin: (A & 0x0F).toString(2).padStart(4, '0'),
      corrected,
      steps
    };
  },

  // ------------------------------------------------------------------------
  // 5. IEEE 754 Floating-Point Numbers & Operations
  // ------------------------------------------------------------------------
  decimalToIEEE754(num) {
    const val = parseFloat(num);
    if (isNaN(val)) return { error: 'Invalid floating point number' };

    // Standard 32-bit single precision buffer
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, val, false); // big-endian
    const u32 = view.getUint32(0, false);

    const bin32 = u32.toString(2).padStart(32, '0');
    const signBit = bin32[0];
    const exponentBits = bin32.substring(1, 9);
    const mantissaBits = bin32.substring(9, 32);

    const expVal = parseInt(exponentBits, 2);
    const unbiasedExp = expVal - 127;
    const hex = '0x' + u32.toString(16).toUpperCase().padStart(8, '0');

    let normalizedNotation = '';
    if (expVal === 0) {
      normalizedNotation = '0 (Subnormal / Zero)';
    } else if (expVal === 255) {
      normalizedNotation = mantissaBits === '00000000000000000000000' ? '±Infinity' : 'NaN';
    } else {
      normalizedNotation = `${signBit === '1' ? '-' : '+'}1.${mantissaBits.substring(0, 8)}... × 2^(${unbiasedExp})`;
    }

    return {
      value: val,
      hex,
      binary32: bin32,
      signBit,
      signText: signBit === '1' ? '1 (Negative)' : '0 (Positive)',
      exponentBits,
      exponentValue: expVal,
      unbiasedExponent: unbiasedExp,
      mantissaBits,
      normalizedNotation,
      breakdown: [
        { field: 'Sign (S)', bits: signBit, length: '1 bit', role: signBit === '1' ? 'Negative (-)' : 'Positive (+)' },
        { field: 'Biased Exponent (E)', bits: exponentBits, length: '8 bits', role: `Stored: ${expVal}, Actual: ${expVal} - 127 = ${unbiasedExp}` },
        { field: 'Mantissa / Fraction (F)', bits: mantissaBits, length: '23 bits', role: 'Implicit leading 1 followed by fractional bits' }
      ]
    };
  },

  ieee754ArithmeticSteps(valA, valB, op = 'ADD') {
    const a = parseFloat(valA) || 0;
    const b = parseFloat(valB) || 0;
    const resA = this.decimalToIEEE754(a);
    const resB = this.decimalToIEEE754(b);
    const result = (op === 'ADD') ? a + b : a - b;
    const resR = this.decimalToIEEE754(result);

    const expDiff = Math.abs(resA.unbiasedExponent - resB.unbiasedExponent);

    return {
      operandA: resA,
      operandB: resB,
      operation: op,
      result: resR,
      stages: [
        {
          stage: '1. Radix Point Alignment',
          desc: `Compare exponents (E_A = ${resA.unbiasedExponent}, E_B = ${resB.unbiasedExponent}). Shift smaller operand mantissa by ${expDiff} positions.`
        },
        {
          stage: '2. Mantissa Arithmetic',
          desc: `${op === 'ADD' ? 'Add' : 'Subtract'} aligned mantissas considering signs.`
        },
        {
          stage: '3. Normalization',
          desc: 'Shift mantissa so leading non-zero bit is in position 1.F; adjust exponent accordingly.'
        },
        {
          stage: '4. Rounding & Exception Check',
          desc: 'Round to nearest even (IEEE 754 default). Check for Overflow (E >= 255) and Underflow (E <= 0).'
        }
      ]
    };
  }
};


  // --- UNIT 4 ---
  // ==========================================================================
// UNIT 4: Basic Processing Unit / Control Unit
// Syllabus: Basic processing unit, ALU operations, Instruction execution,
// Branch instruction, Multiple bus organization, Hardwired control,
// Generation of control signals, Micro-programmed control; Pipelining;
// Basic concepts of pipelining, Performance, Hazards-Data, Instruction and Control,
// Influence on instruction sets. Case study: ARM 5 and ARM 7 Architecture.
// ==========================================================================

const Unit4 = {
  // ------------------------------------------------------------------------
  // 1. Basic Processing Unit & T-State Instruction Execution
  // ------------------------------------------------------------------------
  getInstructionExecutionSteps(instruction = 'ADD R1, [R2]') {
    return [
      {
        step: 'T1',
        name: 'Fetch Phase 1: Address Transfer',
        activeSignals: ['PC_out', 'MAR_in', 'READ', 'Select4', 'ADD', 'Z_in'],
        hardwareAction: 'MAR receives current PC; Read memory line asserted; ALU increments PC by 4 into temporary register Z.',
        busAction: 'Address bus carries PC; Control bus drives MEMR.'
      },
      {
        step: 'T2',
        name: 'Fetch Phase 2: PC Update & Wait',
        activeSignals: ['Z_out', 'PC_in', 'Y_in', 'WMFC (Wait Memory Function Complete)'],
        hardwareAction: 'Z register writes incremented counter into PC; CPU awaits memory read cycle completion.',
        busAction: 'Memory read in progress over system data bus.'
      },
      {
        step: 'T3',
        name: 'Fetch Phase 3: Instruction Register Latch',
        activeSignals: ['MDR_out', 'IR_in'],
        hardwareAction: 'MDR delivers retrieved instruction word into Instruction Register (IR); Decoder identifies opcode.',
        busAction: 'Internal CPU bus carries instruction word.'
      },
      {
        step: 'T4',
        name: 'Execution Phase 1: Operand Retrieval',
        activeSignals: ['R2_out', 'MAR_in', 'READ'],
        hardwareAction: 'Address in R2 transferred to MAR to retrieve memory operand.',
        busAction: 'Address bus asserts [R2]; Control bus drives MEMR.'
      },
      {
        step: 'T5',
        name: 'Execution Phase 2: ALU Operation',
        activeSignals: ['R1_out', 'Y_in', 'WMFC'],
        hardwareAction: 'R1 value latched into ALU input latch Y; memory read completes into MDR.',
        busAction: 'Internal bus drives Y register.'
      },
      {
        step: 'T6',
        name: 'Execution Phase 3: Result & Writeback',
        activeSignals: ['MDR_out', 'ADD', 'ALU_out', 'R1_in', 'End'],
        hardwareAction: 'ALU adds Y and MDR; result stored into destination register R1; End signal resets step counter.',
        busAction: 'Internal bus carries final sum to R1.'
      }
    ];
  },

  // ------------------------------------------------------------------------
  // 2. Branch Instructions & Target Calculation
  // ------------------------------------------------------------------------
  evaluateBranch(type, conditionMet, currentPC, offset) {
    const pc = parseInt(currentPC, 10) || 0x1000;
    const off = parseInt(offset, 10) || 12;
    const targetPC = pc + 4 + (off * 4); // ARM branch offset calculation: PC + 8 + offset*4

    const taken = (type === 'UNCONDITIONAL') || Boolean(conditionMet);
    const nextPC = taken ? targetPC : pc + 4;
    const penalty = taken ? 2 : 0; // 2 stall cycles for flushed pipeline in 3-stage pipeline

    return {
      type,
      currentPC: '0x' + pc.toString(16).toUpperCase(),
      offset: off,
      targetPC: '0x' + targetPC.toString(16).toUpperCase(),
      branchTaken: taken,
      nextPC: '0x' + nextPC.toString(16).toUpperCase(),
      pipelinePenalty: penalty,
      explanation: taken 
        ? `Branch TAKEN to ${'0x' + targetPC.toString(16).toUpperCase()}. Instructions in Fetch and Decode stages discarded (Pipeline Flush: ${penalty} cycles).`
        : `Branch NOT TAKEN. Execution falls through sequentially to 0x${(pc + 4).toString(16).toUpperCase()} with 0 stall penalty.`
    };
  },

  // ------------------------------------------------------------------------
  // 3. Multiple Bus Organization Comparison
  // ------------------------------------------------------------------------
  compareBusOrganizations() {
    return {
      singleBus: {
        title: 'Single-Bus Architecture',
        buses: 1,
        pros: 'Minimal die area, low pin count, simple interconnection.',
        cons: 'Bus contention bottleneck: only 1 transfer per clock cycle. ALU requires temporary registers Y and Z.',
        cyclesForAdd: 3, // 1: R_src1 -> Y, 2: R_src2 + Y -> Z, 3: Z -> R_dest
        flow: 'Clock 1: [R2] → Y | Clock 2: [R3] + Y → Z | Clock 3: Z → R1'
      },
      threeBus: {
        title: 'Three-Bus Architecture (Bus A, Bus B, Bus C)',
        buses: 3,
        pros: 'High throughput: ALU can read both source operands simultaneously via Bus A & Bus B and write result directly via Bus C in a single clock cycle!',
        cons: 'Greater hardware complexity, more multiplexers and internal routing lines.',
        cyclesForAdd: 1, // Single clock cycle!
        flow: 'Clock 1: [R2] on Bus A, [R3] on Bus B → ALU executes ADD → Result on Bus C latched directly into R1'
      }
    };
  },

  // ------------------------------------------------------------------------
  // 4. Hardwired Control vs. Microprogrammed Control
  // ------------------------------------------------------------------------
  getControlUnitComparison() {
    return {
      hardwired: {
        name: 'Hardwired Control',
        implementation: 'Combinational logic gates (Decoders, Priority Encoders, AND-OR matrix) driven by Step Counter & IR.',
        speed: 'Ultra-fast (1 to 2 gate delays). Preferred in RISC processors.',
        flexibility: 'Rigid. Any change in instruction set requires physical circuit redesign and chip refabrication.',
        cost: 'Higher design complexity for large instruction sets (CISC).'
      },
      microprogrammed: {
        name: 'Microprogrammed Control (Wilkes 1951)',
        implementation: 'Control words stored in internal Control ROM (Microcode Memory). Sequencer increments Micro-PC.',
        speed: 'Slower due to Control Memory access time / read latency. Historically standard in CISC (x86, VAX).',
        flexibility: 'Extremely flexible. Modifying or adding instructions only requires rewriting microcode ROM bits.',
        cost: 'Lower design cost and structured engineering for complex architectures.'
      }
    };
  },

  sampleMicrocodeROM: [
    { uPC: '0x00', instruction: 'FETCH-1', microWord: '0010 0001 1000 0000', desc: 'PC_out, MAR_in, READ, Z_in' },
    { uPC: '0x01', instruction: 'FETCH-2', microWord: '0100 0010 0000 0001', desc: 'Z_out, PC_in, WMFC' },
    { uPC: '0x02', instruction: 'FETCH-3', microWord: '0000 1000 0000 0010', desc: 'MDR_out, IR_in, Branch_to_Opcode' },
    { uPC: '0x10', instruction: 'ADD-1',   microWord: '0001 0000 0100 0000', desc: 'R1_out, Y_in' },
    { uPC: '0x11', instruction: 'ADD-2',   microWord: '0010 0000 0010 0100', desc: 'R2_out, ADD, Z_in' },
    { uPC: '0x12', instruction: 'ADD-3',   microWord: '0100 0001 0000 0000', desc: 'Z_out, R1_in, End (Reset to 0x00)' }
  ],

  // ------------------------------------------------------------------------
  // 5. Pipelining & Performance
  // ------------------------------------------------------------------------
  calculatePipelinePerformance(numInstructions, numStages = 5, clockPeriodNs = 2) {
    const n = Math.max(1, parseInt(numInstructions, 10) || 10);
    const k = Math.max(1, parseInt(numStages, 10) || 5);
    const tau = parseFloat(clockPeriodNs) || 2; // nanoseconds

    // Non-pipelined total time: n * k * tau
    const nonPipelinedCycles = n * k;
    const nonPipelinedTime = nonPipelinedCycles * tau;

    // Ideal pipelined cycles: k + (n - 1)
    const pipelinedCycles = k + (n - 1);
    const pipelinedTime = pipelinedCycles * tau;

    // Speedup S = (n * k) / (k + n - 1)
    const speedup = (n * k) / (k + n - 1);
    const efficiency = (speedup / k) * 100;
    const throughput = (n / (pipelinedTime * 1e-9)) / 1e6; // MIPS

    return {
      n, k, tau,
      nonPipelinedCycles,
      nonPipelinedTime: nonPipelinedTime.toFixed(1) + ' ns',
      pipelinedCycles,
      pipelinedTime: pipelinedTime.toFixed(1) + ' ns',
      speedup: speedup.toFixed(2),
      maxTheoreticalSpeedup: k.toFixed(1),
      efficiency: efficiency.toFixed(1) + '%',
      throughputMIPS: throughput.toFixed(2) + ' MIPS'
    };
  },

  // Pipeline Hazards Simulation
  simulatePipelineHazards(hazardType) {
    if (hazardType === 'DATA_RAW') {
      return {
        title: 'Data Hazard: RAW (Read After Write)',
        code: [
          'I1: ADD R1, R2, R3   ; Writes R1 at Stage WB (Cycle 5)',
          'I2: SUB R4, R1, R5   ; Reads R1 at Stage ID (Cycle 3) -> CONFLICT!'
        ],
        unmitigated: 'Stage ID of I2 reads stale value of R1 before I1 writes back.',
        solution1: 'Stalling (Bubbles): Insert 2 stall cycles into pipeline until I1 completes WB stage.',
        solution2: 'Operand Forwarding (Bypassing): Route ALU result of I1 directly from EX/MEM pipeline register to EX input of I2 with 0 stall cycles!'
      };
    } else if (hazardType === 'STRUCTURAL') {
      return {
        title: 'Structural Hazard: Memory Port Conflict',
        code: [
          'I1: LOAD R1, [0x0040]  ; Uses Memory Bus at MEM stage (Cycle 4)',
          'I4: FETCH next inst    ; Needs Memory Bus at IF stage (Cycle 4)'
        ],
        unmitigated: 'Single-ported memory cannot service instruction fetch and data operand read simultaneously.',
        solution1: 'Stall pipeline by 1 cycle (delay IF stage).',
        solution2: 'Harvard Architecture (Separate Instruction and Data caches: I-Cache & D-Cache).'
      };
    } else {
      return {
        title: 'Control Hazard: Branch Penalty',
        code: [
          'I1: BEQ target         ; Branch decision evaluated at EX stage (Cycle 3)',
          'I2: ADD R2, R3         ; Fetched speculatively at Cycle 2',
          'I3: SUB R4, R5         ; Fetched speculatively at Cycle 3'
        ],
        unmitigated: 'If branch is taken, I2 and I3 must be flushed, wasting 2 clock cycles.',
        solution1: 'Branch Prediction (Dynamic 2-bit saturating counter).',
        solution2: 'Delayed Branching with branch delay slots (used in MIPS).'
      };
    }
  },

  // ------------------------------------------------------------------------
  // 6. Case Study: ARM Architecture (ARM5 / ARM7)
  // ------------------------------------------------------------------------
  getARMCaseStudy() {
    return {
      title: 'ARM Architecture Case Study (ARM5 / ARM7TDMI)',
      pipeline: {
        stages: 3,
        names: ['Fetch', 'Decode', 'Execute'],
        description: 'Classic 3-stage Von Neumann/Harvard pipeline delivering ~1 CPI for sequential code.'
      },
      registers: {
        total: 37,
        visible: 16,
        userMode: [
          'R0 - R12: General-purpose 32-bit registers',
          'R13 (SP): Stack Pointer',
          'R14 (LR): Link Register (stores subroutine return address on BL instruction)',
          'R15 (PC): Program Counter (points to instruction currently being fetched = PC + 8 in ARM state)',
          'CPSR: Current Program Status Register (Condition flags N, Z, C, V, and control bits)'
        ]
      },
      conditionalExecution: {
        concept: 'Every 32-bit ARM instruction includes a 4-bit condition field (bits 31–28).',
        codes: [
          { code: '0000', mnemonic: 'EQ', desc: 'Equal (Z = 1)' },
          { code: '0001', mnemonic: 'NE', desc: 'Not equal (Z = 0)' },
          { code: '0010', mnemonic: 'CS/HS', desc: 'Carry set / unsigned higher or same (C = 1)' },
          { code: '0011', mnemonic: 'CC/LO', desc: 'Carry clear / unsigned lower (C = 0)' },
          { code: '1011', mnemonic: 'LT', desc: 'Signed less than (N ≠ V)' },
          { code: '1110', mnemonic: 'AL', desc: 'Always execute (unconditional, default)' }
        ],
        significance: 'Eliminates short branch instructions in if/else statements, avoiding pipeline flushes and branch hazard penalties entirely!'
      }
    };
  }
};


  // --- UNIT 5 ---
  // ==========================================================================
// UNIT 5: Parallelism
// Syllabus: Need, types, applications and challenges, Architecture of
// Parallel Systems-Flynn's classification; ARM Processor; The thumb instruction set,
// Processor and CPU cores, Instruction Encoding format, Memory load and Store
// instruction, Basics of I/O operations.
// ==========================================================================

const Unit5 = {
  // ------------------------------------------------------------------------
  // 1. Parallelism Concepts & Amdahl's Law Calculator
  // ------------------------------------------------------------------------
  calculateAmdahlsLaw(parallelFraction, numCores) {
    const p = Math.max(0, Math.min(1, parseFloat(parallelFraction) || 0.8));
    const n = Math.max(1, parseInt(numCores, 10) || 4);

    // Amdahl's formula: S = 1 / ((1 - P) + (P / N))
    const speedup = 1 / ((1 - p) + (p / n));
    const maxTheoreticalSpeedup = 1 / (1 - p); // as N -> infinity

    return {
      parallelFraction: (p * 100).toFixed(1) + '%',
      serialFraction: ((1 - p) * 100).toFixed(1) + '%',
      numCores: n,
      speedup: speedup.toFixed(2),
      maxTheoreticalSpeedup: (1 - p === 0) ? 'Infinite' : maxTheoreticalSpeedup.toFixed(2),
      efficiency: ((speedup / n) * 100).toFixed(1) + '%',
      explanation: `With ${(p * 100).toFixed(0)}% parallel code on ${n} cores, maximum speedup achieved is ${speedup.toFixed(2)}×. The serial portion (${((1 - p) * 100).toFixed(0)}%) limits upper speedup to ${maxTheoreticalSpeedup.toFixed(2)}× even with infinite processors.`
    };
  },

  // ------------------------------------------------------------------------
  // 2. Flynn's Classification of Computer Architectures
  // ------------------------------------------------------------------------
  flynnsClassifications: {
    SISD: {
      acronym: 'SISD',
      name: 'Single Instruction Stream, Single Data Stream',
      architecture: 'Traditional Uniprocessor (Von Neumann)',
      description: 'A single control unit fetches one instruction stream that operates on a single data stream in memory. Instructions execute sequentially.',
      examples: 'Classic 8086, early Pentium, single-core microcontrollers (8051, PIC).',
      instructionStreams: 1,
      dataStreams: 1
    },
    SIMD: {
      acronym: 'SIMD',
      name: 'Single Instruction Stream, Multiple Data Streams',
      architecture: 'Vector Processors & GPU Array Units',
      description: 'A single control unit broadcasts the same instruction to multiple processing elements (ALUs), which execute it simultaneously on different data operands.',
      examples: 'Vector processors, GPU CUDA cores, Intel SSE/AVX vector extensions, ARM Neon.',
      instructionStreams: 1,
      dataStreams: 'Multiple (Array)'
    },
    MISD: {
      acronym: 'MISD',
      name: 'Multiple Instruction Streams, Single Data Stream',
      architecture: 'Systolic Arrays & Fault-Tolerant Systems',
      description: 'Multiple instructions operate concurrently on a single shared data stream. Rare in general-purpose computing; used in systolic arrays and redundant flight computers.',
      examples: 'Space Shuttle redundant flight control computers, pipeline systolic filters.',
      instructionStreams: 'Multiple',
      dataStreams: 1
    },
    MIMD: {
      acronym: 'MIMD',
      name: 'Multiple Instruction Streams, Multiple Data Streams',
      architecture: 'Multi-Core CPUs & Distributed Clusters',
      description: 'Multiple autonomous processors execute completely independent instruction streams on independent data streams. Supports symmetric multiprocessing (SMP) and multi-threading.',
      examples: 'Modern multi-core processors (Intel Core i7/i9, AMD Ryzen, Apple Silicon M-series, ARM big.LITTLE, supercomputers).',
      instructionStreams: 'Multiple',
      dataStreams: 'Multiple'
    }
  },

  // ------------------------------------------------------------------------
  // 3. Multi-Core CPU Simulator
  // ------------------------------------------------------------------------
  simulateMultiCoreWorkload(tasksCount = 8, numCores = 4) {
    const tasks = Math.max(1, parseInt(tasksCount, 10) || 8);
    const cores = Math.max(1, Math.min(8, parseInt(numCores, 10) || 4));

    const coreAllocations = Array.from({ length: cores }, (_, id) => ({
      coreId: `Core ${id}`,
      assignedTasks: [],
      cycles: 0,
      utilization: 0
    }));

    for (let t = 0; t < tasks; t++) {
      const coreIdx = t % cores;
      const taskComplexity = 10 + ((t * 7) % 15);
      coreAllocations[coreIdx].assignedTasks.push(`Task #${t + 1} (${taskComplexity} cycles)`);
      coreAllocations[coreIdx].cycles += taskComplexity;
    }

    const maxCycles = Math.max(...coreAllocations.map(c => c.cycles));
    coreAllocations.forEach(c => {
      c.utilization = ((c.cycles / (maxCycles || 1)) * 100).toFixed(0);
    });

    return {
      totalTasks: tasks,
      activeCores: cores,
      makespanCycles: maxCycles,
      cores: coreAllocations
    };
  },

  // ------------------------------------------------------------------------
  // 4. ARM Thumb Instruction Set
  // ------------------------------------------------------------------------
  getThumbInstructionDetails() {
    return {
      title: 'ARM Thumb Instruction Set (16-bit Compact ISA)',
      features: [
        '16-bit fixed instruction length (compared to standard 32-bit ARM instructions).',
        'Improves code density by 30% to 40%, significantly reducing memory footprint and ROM bus traffic in embedded systems.',
        'High code execution performance over narrow 8-bit and 16-bit external memory buses.',
        'Subset of 32-bit ARM operations: access primarily to low registers (R0 - R7).'
      ],
      stateSwitching: {
        instruction: 'BX Rm (Branch and Exchange) or BLX Rm',
        mechanism: 'Bit [0] of the target address held in register Rm indicates the target state: LSB = 1 enters Thumb state (T bit in CPSR set); LSB = 0 enters 32-bit ARM state (T bit cleared).'
      },
      comparison: [
        { metric: 'Instruction Word Length', arm: '32 bits', thumb: '16 bits' },
        { metric: 'Directly Accessible Registers', arm: 'R0 - R15 (All 16)', thumb: 'R0 - R7 (Low registers) + SP, LR, PC' },
        { metric: 'Conditional Execution', arm: 'Every instruction conditional (bits 31–28)', thumb: 'Only conditional branch (B<cond>) instructions' },
        { metric: 'Barrel Shifter Integration', arm: 'Built into all Data Processing instructions', thumb: 'Separate shift/rotate instructions required' }
      ]
    };
  },

  // ------------------------------------------------------------------------
  // 5. Instruction Encoding Format
  // ------------------------------------------------------------------------
  instructionFormats: {
    armDataProcessing: {
      title: 'ARM 32-bit Data Processing Format (e.g., ADDS R1, R2, R3)',
      totalBits: 32,
      fields: [
        { name: 'Cond', bits: '31..28 (4 bits)', desc: 'Condition code (e.g. 1110 = AL / Always, 0000 = EQ)' },
        { name: '00', bits: '27..26 (2 bits)', desc: 'Format specifier (00 = Data Processing)' },
        { name: 'I', bits: '25 (1 bit)', desc: 'Immediate operand flag (0 = Register/shifted, 1 = Immediate)' },
        { name: 'Opcode', bits: '24..21 (4 bits)', desc: 'Operation code (0100 = ADD, 0010 = SUB, 0000 = AND)' },
        { name: 'S', bits: '20 (1 bit)', desc: 'Set condition code flags (1 = Update CPSR N, Z, C, V; 0 = Keep flags)' },
        { name: 'Rn', bits: '19..16 (4 bits)', desc: 'First source register specifier (R0–R15)' },
        { name: 'Rd', bits: '15..12 (4 bits)', desc: 'Destination register specifier (R0–R15)' },
        { name: 'Operand2', bits: '11..0 (12 bits)', desc: 'Flexible second operand (Shift amount & Rm, or 8-bit immediate with 4-bit rotate)' }
      ]
    },
    armLoadStore: {
      title: 'ARM 32-bit Load/Store Format (e.g., LDR R1, [R2, #4])',
      totalBits: 32,
      fields: [
        { name: 'Cond', bits: '31..28 (4 bits)', desc: 'Condition field' },
        { name: '01', bits: '27..26 (2 bits)', desc: 'Format specifier (01 = Single data transfer)' },
        { name: 'I/P/U/B/W/L', bits: '25..20 (6 bits)', desc: 'Indexing flags: P=Pre/Post, U=Up/Down, B=Byte/Word, W=Writeback, L=Load(1)/Store(0)' },
        { name: 'Rn', bits: '19..16 (4 bits)', desc: 'Base register' },
        { name: 'Rd', bits: '15..12 (4 bits)', desc: 'Source or Destination register' },
        { name: 'Offset', bits: '11..0 (12 bits)', desc: '12-bit unsigned displacement or shifted register' }
      ]
    },
    thumbFormat: {
      title: 'ARM Thumb 16-bit Format (e.g., ADD Rd, Rn, Rm)',
      totalBits: 16,
      fields: [
        { name: 'Opcode', bits: '15..9 (7 bits)', desc: '0001100 (Add register)' },
        { name: 'Rm', bits: '8..6 (3 bits)', desc: 'Second operand register (R0–R7)' },
        { name: 'Rn', bits: '5..3 (3 bits)', desc: 'First operand register (R0–R7)' },
        { name: 'Rd', bits: '2..0 (3 bits)', desc: 'Destination register (R0–R7)' }
      ]
    }
  },

  // ------------------------------------------------------------------------
  // 6. Memory Load and Store Instructions
  // ------------------------------------------------------------------------
  simulateLoadStore(type, baseRegVal, offset, regVal = 0) {
    const base = parseInt(baseRegVal, 16) || 0x0020;
    const off = parseInt(offset, 10) || 4;
    const ea = (base + off) & 0xFFFF;
    const eaHex = '0x' + ea.toString(16).toUpperCase().padStart(4, '0');

    if (type.toUpperCase() === 'LDR') {
      const simulatedMemValue = 0x8F;
      return {
        instruction: `LDR R1, [R2, #${off}]`,
        type: 'LOAD',
        baseRegister: 'R2 = 0x' + base.toString(16).toUpperCase().padStart(4, '0'),
        offset: off,
        effectiveAddress: eaHex,
        busCycle: 'Memory Read: CPU asserts EA on Address Bus, reads byte onto Data Bus',
        result: `R1 receives 0x${simulatedMemValue.toString(16).toUpperCase()} from memory [${eaHex}]`
      };
    } else {
      const val = parseInt(regVal, 16) || 0x42;
      return {
        instruction: `STR R1, [R2, #${off}]`,
        type: 'STORE',
        baseRegister: 'R2 = 0x' + base.toString(16).toUpperCase().padStart(4, '0'),
        offset: off,
        effectiveAddress: eaHex,
        busCycle: 'Memory Write: CPU asserts EA on Address Bus, drives R1 onto Data Bus with MEMW pulse',
        result: `Memory at [${eaHex}] written with byte 0x${val.toString(16).toUpperCase()} from R1`
      };
    }
  },

  // ------------------------------------------------------------------------
  // 7. Basics of I/O Operations: Polling vs. Interrupt vs. DMA
  // ------------------------------------------------------------------------
  getIOOperations() {
    return {
      techniques: [
        {
          id: 'polling',
          name: 'Programmed I/O (Polling)',
          mechanism: 'CPU continually checks the peripheral status register in a busy-wait loop until the device indicates READY.',
          cpuUtilization: '100% busy-wait during transfer (High CPU overhead / cycle waste).',
          hardwareCost: 'Minimal (No extra interrupt controller required).',
          bestFor: 'Simple, dedicated single-task microcontrollers with predictable timing.'
        },
        {
          id: 'interrupt',
          name: 'Interrupt-Driven I/O',
          mechanism: 'Device asserts Interrupt Request (INTR/IRQ) when ready. CPU completes current instruction, pushes PC/flags onto stack, executes Interrupt Service Routine (ISR), and resumes.',
          cpuUtilization: 'Low (CPU performs useful work while device prepares data).',
          hardwareCost: 'Requires interrupt controller lines (PIC/NVIC) and vector table.',
          bestFor: 'Asynchronous events: keyboard typing, network packets, timer ticks.'
        },
        {
          id: 'dma',
          name: 'Direct Memory Access (DMA)',
          mechanism: 'Dedicated DMA Controller (DMAC) takes master control of system buses to transfer high-speed data blocks directly between peripheral and memory without CPU intervention.',
          cpuUtilization: 'Zero CPU involvement during actual data block transfer.',
          hardwareCost: 'Requires dedicated DMA Controller hardware and bus arbitration logic.',
          bestFor: 'High-speed mass storage transfers (SSD, NVMe), audio streams, and Ethernet buffers.'
        }
      ],
      dmaModes: {
        burst: 'Burst Mode: DMA controller retains continuous bus control until entire block is transferred. High throughput, but CPU is halted.',
        cycleStealing: 'Cycle Stealing Mode: DMA steals 1 bus cycle between CPU instruction phases. CPU execution slows slightly, but remains responsive.'
      },
      mappingTypes: {
        memoryMapped: 'Memory-Mapped I/O: Peripheral registers share the uniform memory address space. Accessed via standard LOAD and STORE instructions.',
        isolated: 'Isolated / Port I/O: Separate 8-bit/16-bit I/O address space. Requires dedicated processor instructions (e.g., IN and OUT in Intel 8086).'
      }
    };
  }
};


  // --- APPLICATION CONTROLLER ---
  // ==========================================================================
// SENSECORE — COA LAB CONTROLLER (SYLLABUS-ALIGNED ARCHITECTURE LAB)
// ==========================================================================







class SenseCoreLabApp {
  constructor() {
    this.currentPage = 'overview';
    this.clockCycles = 0;
    this.isSimRunning = false;
    this.simInterval = null;

    // Simulated 64-byte RAM
    this.ram = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      this.ram[i] = (i * 7 + 0x12) & 0xFF;
    }

    // Bind DOM events after DOM is ready
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }
  }

  init() {
    this.bindNavigation();
    this.bindTopBarControls();
    this.bindUnitTabs();
    this.initUnit1();
    this.initUnit2();
    this.initUnit3();
    this.initUnit4();
    this.initUnit5();
    this.updateClockDisplay();
    console.log('SENSECORE COA Simulation Lab initialized successfully.');
  }

  // ------------------------------------------------------------------------
  // Navigation & Topbar
  // ------------------------------------------------------------------------
  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetPage = item.getAttribute('data-page');
        this.navigateTo(targetPage);
      });
    });

    // Quick action buttons in Overview
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dest = btn.getAttribute('data-goto');
        const [page, tab] = dest.split(':');
        this.navigateTo(page);
        if (tab) {
          const tabBtn = document.querySelector(`.unit-tab-btn[data-tab="${tab}"]`);
          if (tabBtn) tabBtn.click();
        }
      });
    });
  }

  navigateTo(pageId) {
    this.currentPage = pageId;

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update visible page view
    document.querySelectorAll('.page-view').forEach(view => {
      if (view.id === `page-${pageId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update topbar active module label
    const topbarModule = document.getElementById('topbar-active-module');
    if (topbarModule) {
      const pageNames = {
        overview: 'OVERVIEW',
        unit1: 'UNIT 1: NUMBER SYSTEMS',
        unit2: 'UNIT 2: ARCHITECTURES',
        unit3: 'UNIT 3: ARITHMETIC / ALU',
        unit4: 'UNIT 4: BASIC PROCESSING UNIT',
        unit5: 'UNIT 5: PARALLELISM',
        about: 'ABOUT PROJECT'
      };
      topbarModule.textContent = pageNames[pageId] || pageId.toUpperCase();
    }
  }

  bindTopBarControls() {
    const btnToggle = document.getElementById('btn-sim-toggle');
    const btnToggleText = document.getElementById('btn-sim-toggle-text');
    const btnReset = document.getElementById('btn-sim-reset');
    const btnStep = document.getElementById('btn-sim-step');

    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        if (this.isSimRunning) {
          this.pauseSimulation();
          if (btnToggleText) btnToggleText.textContent = 'RUN SIMULATION';
        } else {
          this.startSimulation();
          if (btnToggleText) btnToggleText.textContent = 'PAUSE SIMULATION';
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.pauseSimulation();
        this.clockCycles = 0;
        this.updateClockDisplay();
        if (btnToggleText) btnToggleText.textContent = 'RUN SIMULATION';
      });
    }

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.clockCycles++;
        this.updateClockDisplay();
      });
    }
  }

  startSimulation() {
    this.isSimRunning = true;
    const statusText = document.getElementById('topbar-status-text');
    if (statusText) statusText.textContent = 'RUNNING';

    this.simInterval = setInterval(() => {
      this.clockCycles++;
      this.updateClockDisplay();
    }, 1000);
  }

  pauseSimulation() {
    this.isSimRunning = false;
    clearInterval(this.simInterval);
    const statusText = document.getElementById('topbar-status-text');
    if (statusText) statusText.textContent = 'PAUSED';
  }

  updateClockDisplay() {
    const el = document.getElementById('topbar-cycles');
    if (el) el.textContent = this.clockCycles;
  }

  bindUnitTabs() {
    document.querySelectorAll('.unit-nav-tabs').forEach(tabBar => {
      const buttons = tabBar.querySelectorAll('.unit-tab-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const targetTabId = btn.getAttribute('data-tab');
          const parentView = tabBar.closest('.page-view');
          if (parentView) {
            parentView.querySelectorAll('.unit-tab-pane').forEach(pane => {
              if (pane.id === targetTabId) {
                pane.classList.add('active');
              } else {
                pane.classList.remove('active');
              }
            });
          }
        });
      });
    });
  }

  // ------------------------------------------------------------------------
  // UNIT 1: Number Systems, Codes, Parity, Arithmetic, Logic Gates
  // ------------------------------------------------------------------------
  initUnit1() {
    // 1. Base Converter
    const numInput = document.getElementById('u1-num-input');
    const baseSelect = document.getElementById('u1-base-select');
    const updateConverter = () => {
      const val = numInput ? numInput.value : '42';
      const base = baseSelect ? baseSelect.value : '10';
      const res = Unit1.convertNumber(val, base);

      const decEl = document.getElementById('u1-conv-dec');
      const binEl = document.getElementById('u1-conv-bin');
      const octEl = document.getElementById('u1-conv-oct');
      const hexEl = document.getElementById('u1-conv-hex');
      const bitsContainer = document.getElementById('u1-bit-array');

      if (res.error) {
        if (decEl) decEl.textContent = 'Error';
        return;
      }

      if (decEl) decEl.textContent = res.decimal;
      if (binEl) binEl.textContent = res.binary;
      if (octEl) octEl.textContent = res.octal;
      if (hexEl) hexEl.textContent = '0x' + res.hex;

      if (bitsContainer) {
        bitsContainer.innerHTML = '';
        res.breakdown.forEach(item => {
          const cell = document.createElement('div');
          cell.className = `bit-cell ${item.bit === 1 ? 'active' : ''}`;
          cell.innerHTML = `
            <span class="bit-cell__val">${item.bit}</span>
            <span class="bit-cell__idx">2^${item.power} (${item.weight})</span>
          `;
          bitsContainer.appendChild(cell);
        });
      }
    };

    if (numInput) numInput.addEventListener('input', updateConverter);
    if (baseSelect) baseSelect.addEventListener('change', updateConverter);
    updateConverter();

    // 2. Codes & Parity
    const codeDecInput = document.getElementById('u1-code-dec-input');
    const updateCodes = () => {
      const decVal = parseInt(codeDecInput ? codeDecInput.value : '25', 10) || 0;
      const bin = (decVal & 0xFF).toString(2).padStart(8, '0');
      const gray = Unit1.binaryToGray(bin);
      const bcd = Unit1.decimalToBCD(decVal);
      const xs3 = Unit1.decimalToExcess3(decVal);

      const binEl = document.getElementById('u1-code-bin');
      const grayEl = document.getElementById('u1-code-gray');
      const bcdEl = document.getElementById('u1-code-bcd');
      const xs3El = document.getElementById('u1-code-xs3');

      if (binEl) binEl.textContent = bin;
      if (grayEl) grayEl.textContent = gray;
      if (bcdEl) bcdEl.textContent = bcd.rawBCD;
      if (xs3El) xs3El.textContent = xs3.rawExcess3;
    };

    if (codeDecInput) codeDecInput.addEventListener('input', updateCodes);
    updateCodes();

    // ASCII Encoder
    const asciiCharInput = document.getElementById('u1-ascii-input');
    const updateAscii = () => {
      const char = asciiCharInput ? asciiCharInput.value : 'A';
      const res = Unit1.charToASCII(char || 'A');
      const resEl = document.getElementById('u1-ascii-output');
      if (res && resEl) {
        resEl.textContent = `Character '${res.char}' -> Decimal: ${res.decimal} | Hex: ${res.hex} | 7-bit ASCII: ${res.binary7} | 8-bit: ${res.binary8}`;
      }
    };
    if (asciiCharInput) asciiCharInput.addEventListener('input', updateAscii);
    updateAscii();

    // Parity Generator & Checker
    const parityBitsInput = document.getElementById('u1-parity-bits');
    const parityTypeSelect = document.getElementById('u1-parity-type');
    const updateParity = () => {
      const bits = parityBitsInput ? parityBitsInput.value : '1101001';
      const type = parityTypeSelect ? parityTypeSelect.value : 'even';
      const res = Unit1.generateParity(bits, type);
      const outEl = document.getElementById('u1-parity-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Data Bits: <strong>${res.dataBits}</strong> (Count of 1s: ${res.onesCount})</div>
          <div>Calculated ${res.parityType.toUpperCase()} Parity Bit: <strong style="color:var(--accent-cyan)">${res.parityBit}</strong></div>
          <div>Transmitted Codeword: <strong>${res.transmittedBits}</strong></div>
        `;
      }
    };
    if (parityBitsInput) parityBitsInput.addEventListener('input', updateParity);
    if (parityTypeSelect) parityTypeSelect.addEventListener('change', updateParity);
    updateParity();

    // 3. Binary Arithmetic
    const arithA = document.getElementById('u1-arith-a');
    const arithB = document.getElementById('u1-arith-b');
    const arithOp = document.getElementById('u1-arith-op');
    const arithMode = document.getElementById('u1-arith-mode');

    const updateArith = () => {
      const a = parseInt(arithA ? arithA.value : '25', 10) || 0;
      const b = parseInt(arithB ? arithB.value : '17', 10) || 0;
      const op = arithOp ? arithOp.value : 'ADD';
      const mode = arithMode ? arithMode.value : 'unsigned';

      const res = Unit1.binaryArithmetic(a, b, op, mode);
      const outEl = document.getElementById('u1-arith-result');
      if (outEl) {
        if (res.error) {
          outEl.textContent = res.error;
          return;
        }
        if (op === 'DIV') {
          outEl.innerHTML = `
            <div>Quotient: <strong>${res.quotient}</strong> (Binary: ${res.quotientBin})</div>
            <div>Remainder: <strong>${res.remainder}</strong> (Binary: ${res.remainderBin})</div>
          `;
        } else {
          outEl.innerHTML = `
            <div>Result: <strong>${res.result}</strong> (Hex: 0x${res.raw8.toString(16).toUpperCase()}, Binary: ${res.binary})</div>
            <div>Flags: Carry/Borrow = <strong>${res.carryOut ? '1' : '0'}</strong> | Overflow (V) = <strong>${res.overflow ? '1' : '0'}</strong> | Zero (Z) = <strong>${res.zeroFlag ? '1' : '0'}</strong> | Sign (S) = <strong>${res.signFlag ? '1' : '0'}</strong></div>
          `;
        }
      }
    };

    if (arithA) arithA.addEventListener('input', updateArith);
    if (arithB) arithB.addEventListener('input', updateArith);
    if (arithOp) arithOp.addEventListener('change', updateArith);
    if (arithMode) arithMode.addEventListener('change', updateArith);
    updateArith();

    // BCD Addition Simulator
    const bcdA = document.getElementById('u1-bcd-a');
    const bcdB = document.getElementById('u1-bcd-b');
    const updateBcdAdd = () => {
      const a = parseInt(bcdA ? bcdA.value : '7', 10) || 0;
      const b = parseInt(bcdB ? bcdB.value : '8', 10) || 0;
      const res = Unit1.bcdAddition(a, b);
      const outEl = document.getElementById('u1-bcd-result');
      if (outEl) {
        if (res.error) {
          outEl.textContent = res.error;
          return;
        }
        outEl.innerHTML = `
          <div>Input A: ${res.digitA} (${res.binA}) | Input B: ${res.digitB} (${res.binB})</div>
          <div>Initial Binary Sum: <strong>${res.initialSum}</strong> (${res.initialBin})</div>
          <div>Needs Correction: <strong>${res.needsCorrection ? 'YES (> 9)' : 'NO (<= 9)'}</strong></div>
          <div>${res.explanation}</div>
        `;
      }
    };
    if (bcdA) bcdA.addEventListener('input', updateBcdAdd);
    if (bcdB) bcdB.addEventListener('input', updateBcdAdd);
    updateBcdAdd();

    // 4. Logic Gates Laboratory
    const gateSelect = document.getElementById('u1-gate-select');
    const gateInA = document.getElementById('u1-gate-in-a');
    const gateInB = document.getElementById('u1-gate-in-b');

    const updateGateLab = () => {
      const gate = gateSelect ? gateSelect.value : 'AND';
      const a = gateInA ? (gateInA.checked ? 1 : 0) : 1;
      const b = gateInB ? (gateInB.checked ? 1 : 0) : 0;

      const evalRes = Unit1.evaluateGate(gate, a, b);
      const outEl = document.getElementById('u1-gate-output');
      const formEl = document.getElementById('u1-gate-formula');
      if (outEl) outEl.textContent = evalRes.output;
      if (formEl) formEl.textContent = evalRes.formula;

      // Update truth table
      const tt = Unit1.getTruthTable(gate);
      const tbody = document.getElementById('u1-gate-truth-table-body');
      if (tbody) {
        tbody.innerHTML = '';
        tt.forEach(row => {
          const tr = document.createElement('tr');
          const isCurrent = (gate === 'NOT') ? (row.a === a) : (row.a === a && row.b === b);
          if (isCurrent) tr.className = 'active-row';

          if (gate === 'NOT') {
            tr.innerHTML = `<td>${row.a}</td><td>-</td><td>${row.out}</td>`;
          } else {
            tr.innerHTML = `<td>${row.a}</td><td>${row.b}</td><td>${row.out}</td>`;
          }
          tbody.appendChild(tr);
        });
      }
    };

    if (gateSelect) gateSelect.addEventListener('change', updateGateLab);
    if (gateInA) gateInA.addEventListener('change', updateGateLab);
    if (gateInB) gateInB.addEventListener('change', updateGateLab);
    updateGateLab();
  }

  // ------------------------------------------------------------------------
  // UNIT 2: Architectures, Buses, Memory, Addressing, 8086
  // ------------------------------------------------------------------------
  initUnit2() {
    // 1. Functional Units Inspector
    document.querySelectorAll('.functional-unit-card').forEach(card => {
      card.addEventListener('click', () => {
        const unitKey = card.getAttribute('data-unit');
        const unitData = Unit2.functionalUnits[unitKey];
        const inspector = document.getElementById('u2-unit-inspector');
        if (inspector && unitData) {
          inspector.innerHTML = `
            <div style="font-size:1.1rem; font-weight:700; color:var(--accent-cyan); margin-bottom:6px;">${unitData.name}</div>
            <div style="margin-bottom:8px;"><strong>Role:</strong> ${unitData.role}</div>
            <div style="margin-bottom:8px;"><strong>Key Components:</strong> ${unitData.components.join(', ')}</div>
            <div><strong>Bus Interconnections:</strong> ${unitData.busConnections}</div>
          `;
        }
      });
    });

    // 2. Bus Transaction & 64-Byte RAM
    const busAddrInput = document.getElementById('u2-bus-addr');
    const busDataInput = document.getElementById('u2-bus-data');
    const btnRead = document.getElementById('u2-btn-bus-read');
    const btnWrite = document.getElementById('u2-btn-bus-write');

    const renderRamGrid = (activeAddr = -1, mode = '') => {
      const grid = document.getElementById('u2-ram-grid');
      if (!grid) return;
      grid.innerHTML = '';
      for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        const isActive = (i === activeAddr);
        cell.className = `mem-cell ${isActive ? (mode === 'READ' ? 'active-read' : 'active-write') : ''}`;
        cell.innerHTML = `
          <div style="color:var(--text-muted); font-size:0.6rem;">0x${i.toString(16).padStart(2,'0').toUpperCase()}</div>
          <div style="font-weight:700; color:#fff;">${this.ram[i].toString(16).padStart(2,'0').toUpperCase()}</div>
        `;
        cell.addEventListener('click', () => {
          if (busAddrInput) busAddrInput.value = '0x00' + i.toString(16).padStart(2,'0').toUpperCase();
        });
        grid.appendChild(cell);
      }
    };
    renderRamGrid();

    const executeBusCycle = (type) => {
      const addrHex = busAddrInput ? busAddrInput.value : '0x0020';
      const addr = parseInt(addrHex, 16) & 0x3F;
      let val = 0;

      if (type === 'READ') {
        val = this.ram[addr];
        if (busDataInput) busDataInput.value = '0x' + val.toString(16).padStart(2,'0').toUpperCase();
      } else {
        val = parseInt(busDataInput ? busDataInput.value : '0x42', 16) & 0xFF;
        this.ram[addr] = val;
      }

      renderRamGrid(addr, type);

      const res = Unit2.simulateBusTransaction(type, addr, val);
      const logEl = document.getElementById('u2-bus-log');
      if (logEl) {
        logEl.innerHTML = res.steps.map(s => `<div>${s}</div>`).join('');
      }

      // Visual bus lanes update
      const laneAddr = document.getElementById('u2-lane-addr');
      const laneData = document.getElementById('u2-lane-data');
      const laneCtrl = document.getElementById('u2-lane-ctrl');

      if (laneAddr) laneAddr.className = 'bus-lane active-addr';
      if (laneData) laneData.className = 'bus-lane active-data';
      if (laneCtrl) laneCtrl.className = 'bus-lane active-ctrl';
    };

    if (btnRead) btnRead.addEventListener('click', () => executeBusCycle('READ'));
    if (btnWrite) btnWrite.addEventListener('click', () => executeBusCycle('WRITE'));

    // 3. Addressing Modes
    const addrModeSelect = document.getElementById('u2-addr-mode-select');
    const addrModeInput = document.getElementById('u2-addr-mode-input');
    const updateAddressingMode = () => {
      const modeId = addrModeSelect ? addrModeSelect.value : 'imm';
      const param = addrModeInput ? addrModeInput.value : '42';
      const modeObj = Unit2.addressingModes.find(m => m.id === modeId);
      const outEl = document.getElementById('u2-addr-mode-output');

      if (modeObj && outEl) {
        const calc = modeObj.calculate(param, this.ram, { R2: 0x0020, PC: 0x0100 });
        outEl.innerHTML = `
          <div><strong>Mode:</strong> ${modeObj.name}</div>
          <div><strong>Syntax:</strong> <code>${modeObj.syntax}</code></div>
          <div><strong>Effective Address (EA):</strong> <code>${calc.ea}</code></div>
          <div><strong>Operand Fetched:</strong> <code>${calc.value}</code></div>
          <div><strong>Memory Cycles:</strong> ${calc.cycles} cycle(s)</div>
          <div style="color:var(--text-secondary); margin-top:4px;">${modeObj.description}</div>
        `;
      }
    };
    if (addrModeSelect) addrModeSelect.addEventListener('change', updateAddressingMode);
    if (addrModeInput) addrModeInput.addEventListener('input', updateAddressingMode);
    updateAddressingMode();

    // 4. 8086 Physical Address Calculator
    const segInput = document.getElementById('u2-8086-seg');
    const offInput = document.getElementById('u2-8086-off');
    const update8086 = () => {
      const seg = segInput ? segInput.value : '1234';
      const off = offInput ? offInput.value : '0056';
      const res = Unit2.calculate8086Address(seg, off);
      const outEl = document.getElementById('u2-8086-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Segment Base (${res.segment} × 16): <strong>${res.segmentBase}</strong></div>
          <div>Offset Address: <strong>${res.offset}</strong></div>
          <div>20-Bit Physical Address: <strong style="color:var(--accent-cyan); font-size:1.1rem;">${res.physicalAddress}</strong> (${res.decimal} bytes / ${res.kbyte})</div>
          <div style="color:var(--text-muted); font-size:0.75rem;">Calculation: ${res.formula}</div>
        `;
      }
    };
    if (segInput) segInput.addEventListener('input', update8086);
    if (offInput) offInput.addEventListener('input', update8086);
    update8086();
  }

  // ------------------------------------------------------------------------
  // UNIT 3: Arithmetic: De Morgan, CLA, CSA, Multipliers, Division, IEEE 754
  // ------------------------------------------------------------------------
  initUnit3() {
    // 1. De Morgan's Theorem
    const dmInA = document.getElementById('u3-dm-a');
    const dmInB = document.getElementById('u3-dm-b');
    const updateDeMorgan = () => {
      const a = dmInA ? (dmInA.checked ? 1 : 0) : 1;
      const b = dmInB ? (dmInB.checked ? 1 : 0) : 0;
      const res = Unit3.verifyDeMorgan(a, b);
      const outEl = document.getElementById('u3-dm-result');
      if (outEl) {
        outEl.innerHTML = `
          <div><strong>Theorem 1:</strong> ¬(${a} ∧ ${b}) = ${res.t1.lhs} ≡ (¬${a} ∨ ¬${b}) = ${res.t1.rhs} &nbsp;[<strong>${res.t1.verified ? 'VERIFIED ✓' : 'FAIL'}</strong>]</div>
          <div><strong>Theorem 2:</strong> ¬(${a} ∨ ${b}) = ${res.t2.lhs} ≡ (¬${a} ∧ ¬${b}) = ${res.t2.rhs} &nbsp;[<strong>${res.t2.verified ? 'VERIFIED ✓' : 'FAIL'}</strong>]</div>
        `;
      }
    };
    if (dmInA) dmInA.addEventListener('change', updateDeMorgan);
    if (dmInB) dmInB.addEventListener('change', updateDeMorgan);
    updateDeMorgan();

    // 2. Adders (CLA & CSA)
    const claA = document.getElementById('u3-cla-a');
    const claB = document.getElementById('u3-cla-b');
    const claCin = document.getElementById('u3-cla-cin');
    const updateCLA = () => {
      const a = parseInt(claA ? claA.value : '5', 10) || 0;
      const b = parseInt(claB ? claB.value : '7', 10) || 0;
      const cin = claCin ? (claCin.checked ? 1 : 0) : 0;
      const res = Unit3.carryLookaheadAdder(a, b, cin);
      const outEl = document.getElementById('u3-cla-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Generate terms (G = A · B): <strong>[${res.G.join(', ')}]</strong></div>
          <div>Propagate terms (P = A ⊕ B): <strong>[${res.P.join(', ')}]</strong></div>
          <div>Carries computed concurrently: <strong>[${res.C.join(', ')}]</strong></div>
          <div>Sum: <strong>${res.sumVal}</strong> (${res.sumBits.join('')}) | Cout: <strong>${res.cout}</strong> | Total: <strong>${res.total}</strong></div>
          <div style="color:var(--accent-cyan); font-size:0.75rem;">${res.gateDelays}</div>
        `;
      }
    };
    if (claA) claA.addEventListener('input', updateCLA);
    if (claB) claB.addEventListener('input', updateCLA);
    if (claCin) claCin.addEventListener('change', updateCLA);
    updateCLA();

    // Carry-Save Adder
    const csaX = document.getElementById('u3-csa-x');
    const csaY = document.getElementById('u3-csa-y');
    const csaZ = document.getElementById('u3-csa-z');
    const updateCSA = () => {
      const x = parseInt(csaX ? csaX.value : '3', 10) || 0;
      const y = parseInt(csaY ? csaY.value : '4', 10) || 0;
      const z = parseInt(csaZ ? csaZ.value : '5', 10) || 0;
      const res = Unit3.carrySaveAdder(x, y, z);
      const outEl = document.getElementById('u3-csa-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Sum Vector: <strong>${res.sumVector}</strong> (${res.sumNum})</div>
          <div>Carry Vector (shifted): <strong>${res.carryVector}</strong> (${res.carryNum})</div>
          <div>Final Total: <strong>${res.finalTotal}</strong> (Expected: ${res.expectedTotal})</div>
          <div style="color:var(--text-muted); font-size:0.75rem;">${res.explanation}</div>
        `;
      }
    };
    if (csaX) csaX.addEventListener('input', updateCSA);
    if (csaY) csaY.addEventListener('input', updateCSA);
    if (csaZ) csaZ.addEventListener('input', updateCSA);
    updateCSA();

    // 3. Multipliers: Booth's Algorithm
    const boothM = document.getElementById('u3-booth-m');
    const boothQ = document.getElementById('u3-booth-q');
    const updateBooth = () => {
      const m = parseInt(boothM ? boothM.value : '-3', 10) || 0;
      const q = parseInt(boothQ ? boothQ.value : '5', 10) || 0;
      const res = Unit3.boothMultiplier(m, q);
      const tbody = document.getElementById('u3-booth-table-body');
      const outEl = document.getElementById('u3-booth-summary');
      if (tbody) {
        tbody.innerHTML = '';
        res.steps.forEach(s => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>Cycle ${s.cycle}</td>
            <td>${s.A}</td>
            <td>${s.Q}</td>
            <td>${s.qMinus1}</td>
            <td>${s.action}</td>
          `;
          tbody.appendChild(tr);
        });
      }
      if (outEl) {
        outEl.innerHTML = `Product: <strong>${res.signedProduct}</strong> (Expected: ${res.expected}, Binary: ${res.productBin})`;
      }
    };
    if (boothM) boothM.addEventListener('input', updateBooth);
    if (boothQ) boothQ.addEventListener('input', updateBooth);
    updateBooth();

    // 4. Division: Restoring vs Non-Restoring
    const divDividend = document.getElementById('u3-div-dividend');
    const divDivisor = document.getElementById('u3-div-divisor');
    const updateDivision = () => {
      const d = parseInt(divDividend ? divDividend.value : '13', 10) || 0;
      const m = parseInt(divDivisor ? divDivisor.value : '3', 10) || 1;
      const rRes = Unit3.restoringDivision(d, m);
      const nrRes = Unit3.nonRestoringDivision(d, m);

      const rTbody = document.getElementById('u3-restoring-table-body');
      if (rTbody && !rRes.error) {
        rTbody.innerHTML = '';
        rRes.steps.forEach(s => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${s.step}</td><td>${s.A}</td><td>${s.Q}</td><td>${s.action}</td>`;
          rTbody.appendChild(tr);
        });
      }

      const nrTbody = document.getElementById('u3-nonrestoring-table-body');
      if (nrTbody && !nrRes.error) {
        nrTbody.innerHTML = '';
        nrRes.steps.forEach(s => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${s.step}</td><td>${s.A}</td><td>${s.Q}</td><td>${s.action}</td>`;
          nrTbody.appendChild(tr);
        });
      }
    };
    if (divDividend) divDividend.addEventListener('input', updateDivision);
    if (divDivisor) divDivisor.addEventListener('input', updateDivision);
    updateDivision();

    // 5. IEEE 754 Floating Point
    const floatInput = document.getElementById('u3-float-input');
    const updateFloat = () => {
      const val = parseFloat(floatInput ? floatInput.value : '-12.625');
      const res = Unit3.decimalToIEEE754(val);
      const outEl = document.getElementById('u3-float-output');
      if (outEl && !res.error) {
        outEl.innerHTML = `
          <div class="ieee-strip">
            <div class="ieee-field-sign" title="Sign Bit">${res.signBit} (Sign)</div>
            <div class="ieee-field-exp" title="Exponent">${res.exponentBits} (Exp: ${res.exponentValue} - 127 = ${res.unbiasedExponent})</div>
            <div class="ieee-field-mant" title="Mantissa">${res.mantissaBits} (Mantissa)</div>
          </div>
          <div>Hex Representation: <strong>${res.hex}</strong></div>
          <div>Normalized Scientific: <strong>${res.normalizedNotation}</strong></div>
        `;
      }
    };
    if (floatInput) floatInput.addEventListener('input', updateFloat);
    updateFloat();
  }

  // ------------------------------------------------------------------------
  // UNIT 4: Basic Processing Unit, Multiple Buses, Control Unit, Pipelining, ARM
  // ------------------------------------------------------------------------
  initUnit4() {
    // 1. T-States Step Generator
    const tbody = document.getElementById('u4-tstates-table-body');
    if (tbody) {
      tbody.innerHTML = '';
      const steps = Unit4.getInstructionExecutionSteps();
      steps.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${s.step}</strong></td>
          <td>${s.name}</td>
          <td><code>${s.activeSignals.join(', ')}</code></td>
          <td>${s.hardwareAction}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 2. Pipeline Speedup Calculator
    const pipeN = document.getElementById('u4-pipe-n');
    const pipeK = document.getElementById('u4-pipe-k');
    const updatePipelineCalc = () => {
      const n = parseInt(pipeN ? pipeN.value : '100', 10) || 100;
      const k = parseInt(pipeK ? pipeK.value : '5', 10) || 5;
      const res = Unit4.calculatePipelinePerformance(n, k);
      const outEl = document.getElementById('u4-pipe-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Non-pipelined Execution Cycles: <strong>${res.nonPipelinedCycles}</strong> (${res.nonPipelinedTime})</div>
          <div>Pipelined Execution Cycles: <strong>${res.pipelinedCycles}</strong> (${res.pipelinedTime})</div>
          <div>Calculated Speedup: <strong style="color:var(--accent-cyan); font-size:1.1rem;">${res.speedup}×</strong> (Max Theoretical: ${res.maxTheoreticalSpeedup}×)</div>
          <div>Pipeline Efficiency: <strong>${res.efficiency}</strong> | Throughput: <strong>${res.throughputMIPS}</strong></div>
        `;
      }
    };
    if (pipeN) pipeN.addEventListener('input', updatePipelineCalc);
    if (pipeK) pipeK.addEventListener('input', updatePipelineCalc);
    updatePipelineCalc();

    // 3. Pipeline Hazards Simulator
    const hazardSelect = document.getElementById('u4-hazard-select');
    const updateHazardSim = () => {
      const type = hazardSelect ? hazardSelect.value : 'DATA_RAW';
      const res = Unit4.simulatePipelineHazards(type);
      const outEl = document.getElementById('u4-hazard-output');
      if (outEl) {
        outEl.innerHTML = `
          <div style="font-weight:700; color:#fff; margin-bottom:6px;">${res.title}</div>
          <pre style="background:rgba(0,0,0,0.4); padding:8px; border-radius:4px; margin-bottom:8px;">${res.code.join('\n')}</pre>
          <div style="color:var(--danger); margin-bottom:4px;">Hazard Problem: ${res.unmitigated}</div>
          <div style="color:var(--warning); margin-bottom:4px;">Mitigation 1 (Stalls): ${res.solution1}</div>
          <div style="color:var(--success);">Mitigation 2 (Hardware Forwarding): ${res.solution2}</div>
        `;
      }
    };
    if (hazardSelect) hazardSelect.addEventListener('change', updateHazardSim);
    updateHazardSim();
  }

  // ------------------------------------------------------------------------
  // UNIT 5: Parallelism, Flynn, Multi-Core, Thumb, Load/Store, I/O
  // ------------------------------------------------------------------------
  initUnit5() {
    // 1. Amdahl's Law Calculator
    const amdahlP = document.getElementById('u5-amdahl-p');
    const amdahlN = document.getElementById('u5-amdahl-n');
    const updateAmdahl = () => {
      const p = parseFloat(amdahlP ? amdahlP.value : '0.8');
      const n = parseInt(amdahlN ? amdahlN.value : '4', 10) || 4;
      const res = Unit5.calculateAmdahlsLaw(p, n);
      const outEl = document.getElementById('u5-amdahl-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Parallel Fraction (P): <strong>${res.parallelFraction}</strong> | Serial Portion: <strong>${res.serialFraction}</strong></div>
          <div>Cores: <strong>${res.numCores}</strong></div>
          <div>Speedup Achieved: <strong style="color:var(--accent-cyan); font-size:1.15rem;">${res.speedup}×</strong> (Max with infinite cores: ${res.maxTheoreticalSpeedup}×)</div>
          <div style="color:var(--text-secondary); margin-top:4px;">${res.explanation}</div>
        `;
      }
    };
    if (amdahlP) amdahlP.addEventListener('input', updateAmdahl);
    if (amdahlN) amdahlN.addEventListener('input', updateAmdahl);
    updateAmdahl();

    // 2. Multi-Core Simulation
    const mcTasks = document.getElementById('u5-mc-tasks');
    const mcCores = document.getElementById('u5-mc-cores');
    const updateMultiCore = () => {
      const tasks = parseInt(mcTasks ? mcTasks.value : '8', 10) || 8;
      const cores = parseInt(mcCores ? mcCores.value : '4', 10) || 4;
      const res = Unit5.simulateMultiCoreWorkload(tasks, cores);
      const container = document.getElementById('u5-mc-grid');
      if (container) {
        container.innerHTML = '';
        res.cores.forEach(c => {
          const card = document.createElement('div');
          card.className = 'flynn-card';
          card.innerHTML = `
            <div class="flynn-card__title">${c.coreId}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:6px;">Cycles: <strong>${c.cycles}</strong> | Utilization: <strong>${c.utilization}%</strong></div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${c.assignedTasks.join('<br>')}</div>
          `;
          container.appendChild(card);
        });
      }
    };
    if (mcTasks) mcTasks.addEventListener('input', updateMultiCore);
    if (mcCores) mcCores.addEventListener('input', updateMultiCore);
    updateMultiCore();

    // 3. Load/Store Simulator
    const lsType = document.getElementById('u5-ls-type');
    const lsBase = document.getElementById('u5-ls-base');
    const lsOffset = document.getElementById('u5-ls-offset');
    const updateLoadStore = () => {
      const type = lsType ? lsType.value : 'LDR';
      const base = lsBase ? lsBase.value : '0x0020';
      const offset = parseInt(lsOffset ? lsOffset.value : '4', 10) || 4;
      const res = Unit5.simulateLoadStore(type, base, offset);
      const outEl = document.getElementById('u5-ls-result');
      if (outEl) {
        outEl.innerHTML = `
          <div>Instruction: <code>${res.instruction}</code></div>
          <div>Effective Address: <strong style="color:var(--accent-cyan);">${res.effectiveAddress}</strong></div>
          <div>Bus Cycle: ${res.busCycle}</div>
          <div>Result: <strong>${res.result}</strong></div>
        `;
      }
    };
    if (lsType) lsType.addEventListener('change', updateLoadStore);
    if (lsBase) lsBase.addEventListener('input', updateLoadStore);
    if (lsOffset) lsOffset.addEventListener('input', updateLoadStore);
    updateLoadStore();
  }
}

// Bootstrap application in browser
if (typeof window !== 'undefined') {
  window.app = new SenseCoreLabApp();
}


  window.SenseCore = { Unit1, Unit2, Unit3, Unit4, Unit5 };
})();
