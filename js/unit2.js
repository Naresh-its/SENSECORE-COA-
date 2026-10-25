// ==========================================================================
// UNIT 2: Architectures
// Syllabus: Basic structure of computers: Functional Units of a computer,
// Operational concepts, Bus structures, Memory addresses and operations,
// assembly language, Instructions, Instruction sequencing, Addressing modes.
// Case study: 8086.
// ==========================================================================

export const Unit2 = {
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
