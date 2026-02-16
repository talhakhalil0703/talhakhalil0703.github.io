## Why Power Management Matters

Battery-powered embedded devices must make every microamp count. A poorly optimized device lasts days; an optimized one lasts years. Power management is a **system-level design concern** that spans hardware and software.

## Power Consumption Fundamentals

### Dynamic Power

Power consumed during active operation (CPU executing, peripherals running):

```
P_dynamic = C × V² × f
```

- **C** = capacitance (chip design)
- **V** = supply voltage (lower = less power, quadratic effect)
- **f** = clock frequency (lower = less power)

**Key insight:** Reducing voltage has a **squared** effect on power. This is why DVFS (Dynamic Voltage and Frequency Scaling) is so effective.

### Static Power (Leakage)

Power consumed even when idle. Proportional to transistor count and temperature. Significant in modern process nodes.

## MCU Low-Power Modes

Most microcontrollers provide multiple power modes:

| Mode | CPU | Peripherals | RAM | Wake Source | Current |
|------|-----|-------------|-----|-------------|---------|
| **Run** | Active | Active | Retained | N/A | 1-100 mA |
| **Sleep** | Stopped | Active | Retained | Any interrupt | 0.1-10 mA |
| **Deep Sleep** | Stopped | Most off | Retained | RTC, GPIO, watchdog | 1-100 µA |
| **Standby** | Stopped | Off | Lost | Reset, RTC, WKUP pin | 0.1-10 µA |
| **Shutdown** | Off | Off | Lost | Reset, WKUP pin | < 1 µA |

### Sleep Mode Design Pattern

```c
void main(void) {
    init_hardware();
    
    while (1) {
        // Do work
        process_sensor_data();
        transmit_data();
        
        // Configure wake-up source
        set_rtc_alarm(NEXT_WAKE_INTERVAL);
        
        // Enter low-power mode
        enter_deep_sleep();
        
        // Execution resumes here after wake-up
    }
}
```

## Duty Cycling

Alternate between active and sleep modes. The **duty cycle** determines battery life.

```
Active: 10ms every 1 second
Duty cycle = 10ms / 1000ms = 1%

If active current = 10mA, sleep current = 5µA:
Average current = (10mA × 1%) + (5µA × 99%) ≈ 105 µA
```

### Battery Life Estimation

```
Battery capacity: 1000 mAh
Average current: 105 µA

Battery life = 1000 mAh / 0.105 mA ≈ 9,524 hours ≈ 397 days
```

## Peripheral Power Management

### Clock Gating

Disable clocks to unused peripherals. Most MCUs allow per-peripheral clock control.

```c
// Disable UART2 clock when not in use
RCC->APB1ENR &= ~RCC_APB1ENR_UART2EN;

// Re-enable when needed
RCC->APB1ENR |= RCC_APB1ENR_UART2EN;
```

### Power Domains

Group peripherals into power domains that can be independently powered on/off. Turn off entire domains when their peripherals aren't needed.

### DMA (Direct Memory Access)

Let the DMA controller handle data transfers while the CPU sleeps. CPU wakes only to process completed transfers.

```c
// Start DMA transfer, CPU goes to sleep
HAL_ADC_Start_DMA(&hadc1, buffer, BUFFER_SIZE);
enter_sleep_mode();

// DMA complete interrupt wakes CPU
void DMA_IRQHandler(void) {
    process_adc_data(buffer, BUFFER_SIZE);
}
```

## Communication Power Optimization

### Radio Power

Wireless communication (BLE, WiFi, LoRa, cellular) is often the **biggest power consumer**.

| Radio | TX Current | Strategy |
|-------|-----------|----------|
| BLE | 5-15 mA | Short bursts, low duty cycle |
| WiFi | 100-300 mA | Batch data, use PSM |
| LoRa | 20-120 mA | Very low data rate, long sleep |
| LTE-M | 100-300 mA | PSM + eDRX |

### Strategies

- **Batch data** — collect multiple readings, transmit in one burst
- **Reduce TX power** — only use needed signal strength
- **Use connection intervals** — BLE: longer intervals = less power
- **Power Save Mode (PSM)** — cellular: device is unreachable but alive

## Software Optimization

### Algorithm Efficiency

More efficient algorithms = fewer CPU cycles = less time active = less power.

```c
// Bad: O(n²) — CPU active longer
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        process(data[i][j]);

// Good: O(n) — CPU sleeps sooner
for (int i = 0; i < n; i++)
    process_batch(data[i], n);
```

### Interrupt-Driven vs Polling

```c
// Bad: Polling wastes CPU cycles
while (!uart_data_available()) {
    // CPU is active doing nothing
}

// Good: Interrupt-driven, CPU sleeps until data arrives
void UART_IRQHandler(void) {
    process_received_byte(UART->DR);
}
```

### Compiler Optimization

Use `-Os` (optimize for size) or `-O2` (optimize for speed). Smaller code = fewer Flash reads = less power. Faster execution = more time in sleep.

## Energy Harvesting

For ultra-long-life or maintenance-free devices:

- **Solar** — indoor (µW) or outdoor (mW) harvesting
- **Vibration** — piezoelectric harvesting from mechanical energy
- **Thermal** — thermoelectric generators (TEG) from temperature differentials
- **RF** — harvesting energy from ambient radio waves

These supplement or replace batteries but provide intermittent power — your firmware must handle **power interruptions gracefully**.

## Design Checklist

1. ☐ Profile power consumption in all modes (multimeter, power analyzer)
2. ☐ Identify and disable unused peripherals/clocks
3. ☐ Use deepest sleep mode possible for the duty cycle
4. ☐ Optimize communication duty cycle and TX power
5. ☐ Use DMA and interrupts instead of polling
6. ☐ Estimate battery life with measured current values
7. ☐ Test wake-up latency from each sleep mode
8. ☐ Verify all wake-up sources work correctly
