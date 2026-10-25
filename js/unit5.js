// ==========================================================================
// UNIT 5: Parallelism
// Syllabus: Need, types, applications and challenges, Architecture of
// Parallel Systems-Flynn's classification; ARM Processor; The thumb instruction set,
// Processor and CPU cores, Instruction Encoding format, Memory load and Store
// instruction, Basics of I/O operations.
// ==========================================================================

export const Unit5 = {
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
