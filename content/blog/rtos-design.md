## What Is an RTOS?

A **Real-Time Operating System** provides deterministic task scheduling — guaranteeing that tasks complete within defined time constraints. Unlike general-purpose OS (Linux, Windows), an RTOS prioritizes **predictability** over throughput.

## When to Use an RTOS vs Bare-Metal

### Bare-Metal (Super Loop)

A simple `while(1)` loop that polls peripherals and runs tasks sequentially.

```c
int main(void) {
    init_hardware();
    while (1) {
        read_sensors();
        process_data();
        update_display();
        check_communication();
    }
}
```

**Good for:** Simple systems with few tasks, predictable timing, no prioritization needed.

**Problems:** If `process_data()` takes too long, `check_communication()` gets delayed. No preemption.

### RTOS

Multiple tasks run concurrently with prioritized, preemptive scheduling.

```c
void sensor_task(void *params) {
    while (1) {
        read_sensors();
        vTaskDelay(pdMS_TO_TICKS(10));  // Run every 10ms
    }
}

void comm_task(void *params) {
    while (1) {
        check_communication();
        vTaskDelay(pdMS_TO_TICKS(50));  // Run every 50ms
    }
}
```

**Good for:** Complex systems with multiple time-critical tasks, different priorities, and inter-task communication.

## Hard vs Soft Real-Time

### Hard Real-Time

Missing a deadline = **system failure**. Examples:

- Airbag deployment (must fire within milliseconds)
- Anti-lock braking systems (ABS)
- Pacemaker timing
- Industrial motor control

### Soft Real-Time

Missing a deadline degrades quality but doesn't cause failure. Examples:

- Audio/video streaming (glitch, not crash)
- Touchscreen responsiveness
- Data logging (late data is still useful)

## Scheduling Algorithms

### Priority-Based Preemptive

Most common in RTOS. Higher-priority tasks **preempt** lower-priority ones.

```
Task A (Priority 3) — Running
Task B (Priority 5) — Ready → PREEMPTS Task A
Task A — Suspended until B completes or blocks
```

### Round-Robin

Tasks of **equal priority** share CPU time in fixed time slices (time quantum).

### Rate Monotonic Scheduling (RMS)

Tasks with **shorter periods** get higher priorities. Mathematically proven optimal for fixed-priority systems.

```
Task A: Period = 10ms → Priority = High
Task B: Period = 50ms → Priority = Medium
Task C: Period = 100ms → Priority = Low
```

### Earliest Deadline First (EDF)

Dynamic priority — task closest to its deadline runs first. Theoretically optimal but harder to implement.

## Synchronization Primitives

### Mutex (Mutual Exclusion)

Protects shared resources. Only one task can hold the mutex at a time.

```c
xSemaphoreTake(uart_mutex, portMAX_DELAY);
// Access UART — only this task has it
send_uart_data(buffer, len);
xSemaphoreGive(uart_mutex);
```

### Semaphore

Signaling mechanism. Binary semaphore for synchronization, counting semaphore for resource pools.

### Message Queue

Tasks communicate by sending messages through a queue. Producer-consumer pattern.

```c
// Producer task
xQueueSend(data_queue, &sensor_reading, portMAX_DELAY);

// Consumer task
xQueueReceive(data_queue, &received_data, portMAX_DELAY);
```

### Event Flags / Event Groups

Signal multiple conditions to waiting tasks. Tasks can wait for combinations of events (AND/OR).

## Common Pitfalls

### Priority Inversion

A high-priority task waits for a resource held by a low-priority task, which is preempted by a medium-priority task.

```
High (blocked on mutex) → can't run
Medium (running) → preempts Low
Low (holds mutex) → can't release
```

**Solution:** Priority inheritance — temporarily elevate Low's priority to High's level.

### Deadlock

Two tasks each hold a resource the other needs:

```
Task A holds Mutex 1, wants Mutex 2
Task B holds Mutex 2, wants Mutex 1
```

**Prevention:** Always acquire mutexes in the same order. Use timeouts.

### Stack Overflow

Each task has a fixed stack size. Deep call chains or large local variables can overflow.

**Prevention:** Use stack high-water mark monitoring, analyze worst-case stack usage.

## Popular RTOS Options

| RTOS | License | Notable For |
|------|---------|-------------|
| **FreeRTOS** | MIT | Most popular, AWS IoT integration |
| **Zephyr** | Apache 2.0 | Modern, comprehensive, Linux Foundation |
| **ThreadX** (Azure RTOS) | MIT | Certified for safety-critical (IEC 61508) |
| **RTEMS** | BSD | Used in space missions |
| **NuttX** | Apache 2.0 | POSIX compliant, used in PX4 drones |
| **ChibiOS** | GPL/Commercial | Very small footprint for MCUs |
