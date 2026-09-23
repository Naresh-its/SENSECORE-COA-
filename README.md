# SENSECORE — Real-Time Embedded Computer Architecture Simulator

A live, interactive Computer Organization & Architecture (COA) simulator with frosted glass aesthetics, realistic physical transducer physics, CPU instruction pipelines, ALU workbenches, and system bus visualizations.

![SENSECORE Preview](favicon.svg)

---

## 🏛️ System Architecture Overview

SENSECORE models a complete 8-bit Harvard microcontroller architecture with unified telemetry and peripheral buses:

- **Transducer Subsystem**: 6 physical sensors (Temperature, Humidity, Barometer, Ambient Light, Air Quality, Ultrasonic Proximity) updating via smoothed random-walk noise.
- **CPU Core**: 4-stage sequential instruction execution pipeline (`FETCH` $\to$ `DECODE` $\to$ `EXECUTE` $\to$ `STORE`) with opcode decoding and side-effect dispatching.
- **8-Bit ALU**: Supports `ADD`, `SUBTRACT`, `AND`, `OR`, `XOR`, `NOT`, and `COMPARE` with real-time condition flag evaluation ($Z$, $N$, $C$, $V$).
- **Register File**: $R_0$–$R_7$, Program Counter ($PC$), Stack Pointer ($SP$), and Condition Flags ($FLAGS$).
- **Static RAM (SRAM)**: 64-Byte memory array with animated `READ` (emerald) and `WRITE` (amber) pulse cycles.
- **System Buses**: Three dedicated interconnect buses (**ADDRESS BUS**, **DATA BUS**, **CONTROL BUS**) with live moving data telemetry indicators.
- **Real-Time Instrumentation**: 60-point rolling Canvas charts and terminal execution telemetry.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+) or any web browser.

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Naresh-its/SENSECORE-COA-.git
   cd SENSECORE-COA-
   ```

2. **Start the local server:**
   ```bash
   node server.js
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000/](http://localhost:3000/)

---

## 🧪 Automated Subsystem Tests

Run the built-in 33-step automated test suite:

```bash
node test_simulator.js
```

---

## 📂 Project Structure

```
SENSECORE-COA-/
├── index.html              # Standalone single-file application
├── style.css               # Complete stylesheet bundle
├── app.bundle.js           # Complete subsystem controller bundle
├── server.js               # Zero-dependency local static HTTP server
├── test_simulator.js       # Automated subsystem verification suite
├── favicon.svg             # Microchip vector icon
├── package.json            # Project manifest
├── css/                    # Modular source CSS
└── js/                     # Modular source ES modules
```

---

## 📄 License

MIT License. Designed for Computer Organization and Architecture (COA) educational labs and real-time embedded system simulations.
