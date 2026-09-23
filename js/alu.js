export class ALU {
  constructor(engine) {
    this.engine = engine;
    this.operations = ['ADD', 'SUBTRACT', 'AND', 'OR', 'XOR', 'NOT', 'COMPARE'];
    this.lastResult = null;
    this.lastFlags = { zero: false, negative: false, carry: false, overflow: false };
  }
  
  getSymbol(op) {
    switch (op.toUpperCase()) {
      case 'ADD': return '+';
      case 'SUB':
      case 'SUBTRACT': return '−';
      case 'AND': return '&';
      case 'OR': return '|';
      case 'XOR': return '⊕';
      case 'NOT': return '~';
      case 'CMP':
      case 'COMPARE': return '≟';
      default: return '?';
    }
  }
  
  execute(op, inputA, inputB = 0) {
    let result = 0;
    let flags = { zero: false, negative: false, carry: false, overflow: false };
    
    // Convert to 8-bit unsigned integer operands
    inputA = (parseInt(inputA, 10) || 0) & 0xFF;
    inputB = (parseInt(inputB, 10) || 0) & 0xFF;
    
    const normOp = op.toUpperCase();
    
    switch (normOp) {
      case 'ADD': {
        const sum = inputA + inputB;
        flags.carry = sum > 0xFF;
        result = sum & 0xFF;
        flags.overflow = (!((inputA ^ inputB) & 0x80) && Boolean((inputA ^ result) & 0x80));
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'SUB':
      case 'SUBTRACT': {
        const diff = inputA - inputB;
        flags.carry = inputA < inputB; // borrow
        result = diff & 0xFF;
        flags.overflow = (Boolean((inputA ^ inputB) & 0x80) && Boolean((inputA ^ result) & 0x80));
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'AND': {
        result = (inputA & inputB) & 0xFF;
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'OR': {
        result = (inputA | inputB) & 0xFF;
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'XOR': {
        result = (inputA ^ inputB) & 0xFF;
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'NOT': {
        result = (~inputA) & 0xFF;
        flags.zero = (result === 0);
        flags.negative = Boolean((result & 0x80));
        break;
      }
      case 'CMP':
      case 'COMPARE': {
        const cmpVal = (inputA - inputB) & 0xFF;
        flags.carry = inputA < inputB;
        flags.zero = (inputA === inputB);
        flags.negative = Boolean((cmpVal & 0x80));
        result = inputA; // CMP does not modify accumulator
        break;
      }
      default:
        result = 0;
        flags.zero = true;
    }
    
    this.lastResult = result;
    this.lastFlags = flags;
    
    this.engine.emit('alu-operation', {
      op: normOp,
      symbol: this.getSymbol(normOp),
      inputA,
      inputB,
      result,
      resultHex: '0x' + result.toString(16).toUpperCase().padStart(2, '0'),
      resultBin: result.toString(2).padStart(8, '0'),
      flags
    });
    
    return { result, flags };
  }
  
  tick() {}
  
  reset() {
    this.lastResult = null;
    this.lastFlags = { zero: false, negative: false, carry: false, overflow: false };
    this.engine.emit('alu-reset');
  }
}
