// ==========================================================================
// UNIT 4: Basic Processing Unit / Control Unit
// Syllabus: Basic processing unit, ALU operations, Instruction execution,
// Branch instruction, Multiple bus organization, Hardwired control,
// Generation of control signals, Micro-programmed control; Pipelining;
// Basic concepts of pipelining, Performance, Hazards-Data, Instruction and Control,
// Influence on instruction sets. Case study: ARM 5 and ARM 7 Architecture.
// ==========================================================================

export const Unit4 = {
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
