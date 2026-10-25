// ==========================================================================
// UNIT 1: Introduction to Number Systems and Logic Gates
// Syllabus: Number Systems (Binary, Decimal, Octal, Hexadecimal);
// Codes (Gray, BCD, Excess-3, ASCII); Parity; Binary Arithmetic (Addition,
// Subtraction, Multiplication, Division using Sign Magnitude, 1's complement,
// 2's complement, BCD Arithmetic); Logic Gates (AND, OR, NOT, NAND, NOR, EX-OR, EX-NOR).
// ==========================================================================

export const Unit1 = {
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
