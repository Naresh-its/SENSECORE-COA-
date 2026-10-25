// ==========================================================================
// SENSECORE — COA LAB CONTROLLER (SYLLABUS-ALIGNED ARCHITECTURE LAB)
// ==========================================================================

import { Unit1 } from './unit1.js';
import { Unit2 } from './unit2.js';
import { Unit3 } from './unit3.js';
import { Unit4 } from './unit4.js';
import { Unit5 } from './unit5.js';

export class SenseCoreLabApp {
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
