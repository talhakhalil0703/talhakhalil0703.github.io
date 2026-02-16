## Why Memory Matters in Embedded

Embedded systems operate with **severely constrained memory** — often kilobytes, not gigabytes. Understanding memory architecture is critical for writing efficient, reliable firmware.

## Memory Types

### Flash (Non-Volatile)

Stores the program code and constants. Persists without power.

- Typical size: 64KB – 2MB on MCUs
- Read-only during execution (execute-in-place, XIP)
- Limited write cycles (~10,000 – 100,000 erase cycles)
- Used for: firmware, lookup tables, configuration

### SRAM (Static RAM)

Fast, volatile memory for runtime data. No refresh needed (unlike DRAM).

- Typical size: 8KB – 512KB on MCUs
- Used for: stack, heap, global variables
- Expensive per bit — use wisely

### EEPROM

Electrically erasable, byte-addressable non-volatile storage.

- Typical size: 256B – 64KB
- Slower than Flash but byte-writable
- Used for: calibration data, user settings, small persistent values

### External Memory

For systems needing more than internal memory:

- **External SRAM/PSRAM** — additional runtime memory
- **External Flash (SPI/QSPI)** — large data storage, firmware images
- **SD Card** — file-based storage for data logging

## Memory Layout

A typical embedded system's memory map:

```
┌─────────────────┐ High Address
│    Stack ↓      │ ← Grows downward
│                 │
│    (free)       │
│                 │
│    Heap ↑       │ ← Grows upward
├─────────────────┤
│    .bss         │ ← Uninitialized globals (zeroed)
├─────────────────┤
│    .data        │ ← Initialized globals (copied from Flash)
├─────────────────┤
│    .text        │ ← Program code (often in Flash)
├─────────────────┤
│    Vectors      │ ← Interrupt vector table
└─────────────────┘ Low Address
```

### .text Section

Program instructions. Usually executes directly from Flash (XIP) or copied to RAM for speed.

### .data Section

Initialized global/static variables. Values stored in Flash, copied to RAM at startup by the startup code.

### .bss Section

Uninitialized global/static variables. Zeroed out at startup. Uses no Flash space (only RAM).

### Stack

Function call frames, local variables, return addresses. Fixed size per task in RTOS.

**Stack overflow** is a common embedded bug — no virtual memory to catch it.

### Heap

Dynamic memory allocation (`malloc`/`free`). Generally **avoided** in embedded due to fragmentation risks.

## Memory Optimization Techniques

### Use `const` Aggressively

```c
// Bad: stored in RAM (.data)
char message[] = "Hello World";

// Good: stored in Flash (.rodata), no RAM used
const char message[] = "Hello World";
```

### Minimize Global Variables

- Use local variables when possible (stack, freed automatically)
- Group related data into structs for better cache behavior
- Use `static` for file-scoped globals

### Bit Fields and Packed Structs

```c
// Without packing: 12 bytes (padding)
struct SensorData {
    uint8_t type;      // 1 byte + 3 padding
    uint32_t value;    // 4 bytes
    uint16_t checksum; // 2 bytes + 2 padding
};

// With packing: 7 bytes
struct __attribute__((packed)) SensorData {
    uint8_t type;
    uint32_t value;
    uint16_t checksum;
};
```

**Warning:** Packed structs can cause unaligned access faults on some architectures (ARM Cortex-M0).

### Memory Pools

Pre-allocate fixed-size blocks instead of using general-purpose `malloc`:

```c
#define POOL_SIZE 32
#define BLOCK_SIZE 64

static uint8_t memory_pool[POOL_SIZE][BLOCK_SIZE];
static bool block_used[POOL_SIZE] = {false};

void* pool_alloc(void) {
    for (int i = 0; i < POOL_SIZE; i++) {
        if (!block_used[i]) {
            block_used[i] = true;
            return memory_pool[i];
        }
    }
    return NULL; // Pool exhausted
}
```

**No fragmentation**, deterministic allocation time.

## Common Memory Bugs

### Stack Overflow

Recursion or large local arrays exceed the stack size. Often silently corrupts adjacent memory.

**Detection:** Stack canary values, MPU (Memory Protection Unit), high-water mark monitoring.

### Memory Leaks

Allocated memory never freed. In long-running embedded systems, this eventually exhausts memory.

**Prevention:** Prefer static allocation, use memory pools, track allocations.

### Buffer Overflow

Writing beyond array bounds corrupts adjacent data or code.

```c
char buf[10];
strcpy(buf, "This string is way too long!"); // Overflow!
```

**Prevention:** Use `strncpy`, bounds checking, static analysis tools.

### Use After Free

Accessing memory that has been freed. Undefined behavior.

**Prevention:** Set pointers to `NULL` after freeing, use memory pool patterns.

## The `volatile` Keyword

Tells the compiler: **don't optimize out reads/writes to this variable** — its value may change outside the current code flow (e.g., hardware register, ISR variable).

```c
volatile uint32_t *timer_reg = (uint32_t *)0x40000024;
volatile bool data_ready = false; // Set by ISR

void ISR_Handler(void) {
    data_ready = true;
}

void main_loop(void) {
    while (!data_ready) {
        // Without volatile, compiler may optimize this to while(true)
    }
}
```
