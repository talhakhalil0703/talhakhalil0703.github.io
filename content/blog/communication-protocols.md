## Overview

Embedded systems communicate with sensors, actuators, and other systems through **communication protocols**. Choosing the right protocol depends on speed, distance, number of devices, and power requirements.

## I2C (Inter-Integrated Circuit)

A **two-wire** synchronous protocol for short-distance communication between ICs on the same board.

```
┌──────┐   SDA (Data)    ┌──────────┐   ┌──────────┐
│Master├──────────────────┤ Slave 1  │───┤ Slave 2  │
│      ├──────────────────┤ (0x48)   │───┤ (0x68)   │
└──────┘   SCL (Clock)   └──────────┘   └──────────┘
```

### Key Characteristics

| Property | Value |
|----------|-------|
| Wires | 2 (SDA, SCL) + GND |
| Speed | 100 kHz (standard), 400 kHz (fast), 3.4 MHz (high-speed) |
| Topology | Multi-master, multi-slave |
| Addressing | 7-bit or 10-bit addresses |
| Distance | Short (< 1m on PCB) |

### How It Works

1. Master sends **START** condition
2. Master sends **slave address** + R/W bit
3. Slave sends **ACK**
4. Data transfer (8 bits + ACK per byte)
5. Master sends **STOP** condition

### Use Cases

- Temperature sensors (LM75, TMP102)
- IMUs (MPU6050)
- EEPROMs (AT24C256)
- Display controllers (SSD1306 OLED)

### Pros & Cons

- ✅ Only 2 wires for multiple devices
- ✅ Built-in addressing — no chip select lines
- ❌ Slower than SPI
- ❌ More complex protocol (ACK/NACK, arbitration)

## SPI (Serial Peripheral Interface)

A **four-wire** synchronous protocol optimized for high-speed, full-duplex communication.

```
┌──────┐  MOSI (Master Out)  ┌──────┐
│Master├─────────────────────┤Slave │
│      │  MISO (Master In)   │      │
│      ├─────────────────────┤      │
│      │  SCK  (Clock)       │      │
│      ├─────────────────────┤      │
│      │  CS   (Chip Select) │      │
│      ├─────────────────────┤      │
└──────┘                     └──────┘
```

### Key Characteristics

| Property | Value |
|----------|-------|
| Wires | 4 (MOSI, MISO, SCK, CS) |
| Speed | Up to 100+ MHz |
| Topology | Single master, multiple slaves (1 CS per slave) |
| Duplex | Full duplex |
| Distance | Short (PCB-level) |

### Use Cases

- Flash memory (W25Q series)
- SD cards
- Display controllers (ILI9341 TFT)
- ADCs and DACs
- Wireless modules (nRF24L01)

### Pros & Cons

- ✅ Very fast — no addressing overhead
- ✅ Full duplex — simultaneous send/receive
- ✅ Simple protocol — just shift data
- ❌ More wires (1 CS per slave)
- ❌ No built-in ACK — no error detection
- ❌ Single master only

## UART (Universal Asynchronous Receiver-Transmitter)

An **asynchronous** serial protocol — no clock line. Both sides agree on a baud rate.

```
┌──────┐   TX ──▶ RX   ┌──────┐
│Device├───────────────┤Device│
│  A   │   RX ◀── TX   │  B   │
└──────┘               └──────┘
```

### Key Characteristics

| Property | Value |
|----------|-------|
| Wires | 2 (TX, RX) + GND |
| Speed | Common: 9600, 115200 baud |
| Topology | Point-to-point |
| Duplex | Full duplex |
| Distance | Short to medium |

### Framing

```
[START (1)] [DATA (5-9 bits)] [PARITY (0-1)] [STOP (1-2)]
```

No clock — both sides must agree on baud rate, data bits, parity, and stop bits (e.g., `115200 8N1`).

### Use Cases

- Debug console / serial monitor
- GPS modules
- Bluetooth modules (HC-05)
- Inter-processor communication

### Variants

- **RS-232** — voltage levels for longer distances, legacy computers
- **RS-485** — differential signaling, multi-drop, up to 1200m, industrial

## CAN (Controller Area Network)

A **robust, multi-master** protocol designed for automotive and industrial environments.

```
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│ECU 1 ├───┤ECU 2 ├───┤ECU 3 ├───┤ECU 4 │
└──┬───┘   └──┬───┘   └──┬───┘   └──┬───┘
   │          │          │          │
───┴──────────┴──────────┴──────────┴──── CAN Bus
    CAN_H ──────────────────────────────
    CAN_L ──────────────────────────────
```

### Key Characteristics

| Property | Value |
|----------|-------|
| Wires | 2 (CAN_H, CAN_L) — differential |
| Speed | Up to 1 Mbps (CAN 2.0), 5 Mbps (CAN FD) |
| Topology | Multi-master bus |
| Message-based | Broadcast, priority by ID |
| Error handling | Built-in CRC, ACK, error frames |

### How It Works

- **Message-based** — no addresses, messages have IDs
- **Priority** — lower ID = higher priority (bitwise arbitration)
- **Broadcast** — all nodes see all messages, filter by ID
- **Error detection** — CRC, bit stuffing, ACK checking, error counters

### Use Cases

- Automotive (engine control, ABS, airbags)
- Industrial automation
- Medical devices
- Aerospace

## Protocol Comparison

| Protocol | Speed | Wires | Distance | Multi-device | Use Case |
|----------|-------|-------|----------|-------------|----------|
| I2C | Medium | 2 | Short | Yes (addressing) | Sensors, EEPROMs |
| SPI | High | 4+ | Short | Yes (CS lines) | Flash, displays |
| UART | Low-Med | 2 | Medium | No (point-to-point) | Debug, GPS |
| CAN | Medium | 2 | Long | Yes (bus) | Automotive, industrial |

## Choosing the Right Protocol

1. **I2C** when you need many low-speed devices on 2 wires
2. **SPI** when speed matters and you have spare GPIO for CS lines
3. **UART** for simple point-to-point debug or module communication
4. **CAN** for robust, safety-critical multi-node networks
