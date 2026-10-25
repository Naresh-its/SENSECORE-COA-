// ==========================================================================
// UNIT 3: Design of ALU / Arithmetic
// Syllabus: De Morgan's Theorem, Adders, Multiplier - Unsigned, Signed,
// Fast Carry Addition of summands. Division-Restoring and Non-Restoring;
// IEEE 754 Floating point numbers and operations.
// ==========================================================================

export const Unit3 = {
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
