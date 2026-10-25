# SENSECORE — Computer Organization and Architecture Simulation Lab

**Course Code: 21CSS201T — Computer Organization and Architecture**  
*School of Computing, Department of Computer Science & Engineering*

A syllabus-aligned, interactive academic simulation laboratory designed strictly according to the official curriculum. Features interactive visualizations and mathematical workbenches across all five units: Number Systems, Computer Architectures, ALU Design, Basic Processing Unit, and Parallel Systems.

![SENSECORE Microchip](favicon.svg)

---

## 🏛️ Syllabus Curriculum Coverage

### Unit 1 — Introduction to Number Systems & Logic Gates
- **Number Systems**: Binary, Decimal, Octal, Hexadecimal multi-base conversion with bit-weight breakdowns.
- **Codes**: Gray code ($G = B \oplus (B \gg 1)$), BCD (8421 nibbles), Excess-3, and ASCII character encoder.
- **Parity**: Even and Odd parity generator and single-bit corruption error detection.
- **Binary Arithmetic**: Unsigned and signed addition, subtraction, multiplication, and division.
- **Complements**: Sign-Magnitude, 1's Complement, and 2's Complement with overflow ($V$) flag detection.
- **BCD Arithmetic**: BCD addition with $+6$ ($0110_2$) correction when sum $> 9$ or carry out is generated.
- **Logic Gates**: Interactive workbench for AND, OR, NOT, NAND, NOR, EX-OR, and EX-NOR with dynamic truth tables and Boolean formulas.

### Unit 2 — Architectures
- **Basic Functional Units**: Input Unit, Memory Unit, ALU, Control Unit, and Output Unit interactive inspection.
- **Operational Concepts**: Fetch, decode, execute sequencing, and register transfers (PC, MAR, MDR, IR).
- **Bus Structures**: Address Bus (unidirectional), Data Bus (bidirectional), and Control Bus (MEMR/MEMW strobes).
- **Memory Operations**: 64-Byte static RAM matrix with interactive byte-level read and write cycles.
- **Assembly Language**: Instruction formatting and program counter progression.
- **Addressing Modes**: Immediate, Direct/Absolute, Register Direct, Register Indirect, Indexed/Displacement, Relative (PC-relative), and Auto-increment/decrement with Effective Address (EA) calculation.
- **8086 Case Study**: Bus Interface Unit (BIU), Execution Unit (EU), 6-byte instruction queue, and 20-bit Physical Address Calculator:
  $$\text{Physical Address} = (\text{Segment} \times 16) + \text{Offset} = (\text{Segment} \ll 4) + \text{Offset}$$

### Unit 3 — Arithmetic (Design of ALU)
- **De Morgan's Theorem**: Interactive proof and truth table comparison for $\overline{A \cdot B} = \overline{A} + \overline{B}$ and $\overline{A + B} = \overline{A} \cdot \overline{B}$.
- **Adders**: Half Adder, Full Adder, 4-bit Carry-Lookahead Adder (CLA) with Generate ($G$) and Propagate ($P$) equations, and Carry-Save Adder (CSA) for 3 summands.
- **Multipliers**: 4-bit Shift-and-Add Unsigned Multiplier and Booth's Algorithm for signed 2's complement multiplication with cycle trace table.
- **Division**: Restoring Division and Non-Restoring Division step-by-step register tables.
- **IEEE 754 Floating-Point Standard**: 32-bit single-precision converter (1-bit Sign, 8-bit Biased Exponent, 23-bit Mantissa) and 4-stage arithmetic pipeline.

### Unit 4 — Basic Processing Unit
- **Instruction Execution**: Micro-operation timing ladder ($T_1$ to $T_6$) with active control signals.
- **Branch Instructions**: Target calculation and pipeline flush penalties.
- **Multiple-Bus Organization**: Comparison of Single-Bus (3-cycle arithmetic) vs Three-Bus (1-cycle arithmetic) architectures.
- **Control Units**: Hardwired control vs Microprogrammed control with Microcode ROM inspector.
- **Pipelining & Hazards**: 5-stage space-time diagram, speedup calculator ($S = \frac{n \cdot k}{k+n-1}$), and hazard mitigation (Data RAW forwarding/bubbles, Structural, Control).
- **ARM Case Study**: ARM7 3-stage pipeline, 37 physical registers, and 4-bit conditional execution field eliminating branch hazards.

### Unit 5 — Parallelism
- **Parallel Computing**: Speedup limits and Amdahl's Law Calculator:
  $$S = \frac{1}{(1 - P) + \frac{P}{N}}$$
- **Flynn's Classification**: 2×2 taxonomy (SISD, SIMD, MISD, MIMD) with architectural models.
- **Multi-Core Processors**: Symmetric multiprocessing task scheduler across multiple CPU cores.
- **ARM Thumb Instruction Set**: 16-bit compact ISA, 30%–40% code density reduction, and `BX Rm` state switching.
- **Instruction Encoding**: Bitfield dissection of 32-bit ARM vs 16-bit Thumb formats.
- **Memory Load & Store**: RISC Load/Store architecture simulation (`LDR` and `STR`).
- **Basics of I/O**: Programmed I/O (Polling) vs Interrupt-Driven I/O vs Direct Memory Access (DMA Cycle Stealing & Burst Mode); Memory-Mapped vs Port I/O.

---

## 🚀 Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Naresh-its/SENSECORE-COA-.git
   cd SENSECORE-COA-
   ```

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000/](http://localhost:3000/)

---

## 🧪 Automated Syllabus Verification Suite

Run the 43-assertion verification suite covering calculations and algorithms from all 5 units:

```bash
node test_simulator.js
```

---

## 📚 Official Course References

1. Carl Hamacher, Zvonko Vranesic, Safwat Zaky, *Computer Organization*, 5th ed., McGraw-Hill, 2015.
2. Kai Hwang, Faye A. Briggs, *Computer Architecture and Parallel Processing*, 3rd ed., McGraw-Hill, 2016.
3. Ghosh T.K., *Computer Organization and Architecture*, 3rd ed., Tata McGraw-Hill, 2011.
4. P. Hayes, *Computer Architecture and Organization*, 3rd ed., McGraw-Hill, 2015.
5. William Stallings, *Computer Organization and Architecture: Designing for Performance*, 10th ed., Pearson Education, 2015.
6. David A. Patterson and John L. Hennessy, *Computer Organization and Design: The Hardware/Software Interface*, 5th ed., Morgan Kaufmann, 2014.
