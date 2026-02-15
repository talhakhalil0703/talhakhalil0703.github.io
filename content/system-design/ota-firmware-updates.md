## Why OTA Updates?

Firmware updates deployed through physical connections (JTAG, USB) are impractical at scale. **Over-The-Air (OTA) updates** allow you to push firmware to thousands or millions of devices remotely.

- Fix bugs after deployment
- Add features without recalls
- Patch security vulnerabilities
- Comply with evolving regulations

## OTA Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ Build Server│────▶│ OTA Server   │────▶│   Device     │
│ (CI/CD)     │     │ (S3, CDN)    │     │ (MCU/SoC)    │
└─────────────┘     └──────────────┘     └──────────────┘
     │                     │                    │
  Build &              Host binary         Download &
  Sign firmware        + manifest          Verify & Apply
```

### Components

1. **Build pipeline** — compiles firmware, creates update package, signs it
2. **Update server** — hosts firmware binaries, manages rollout campaigns
3. **Device client** — checks for updates, downloads, verifies, and applies

## Update Strategies

### Full Image Update

Replace the entire firmware image. Simple but large downloads.

```
Slot A (current): v1.2.0 [ACTIVE]
Slot B (backup):  v1.1.0 [INACTIVE]

Update: Download v1.3.0 → write to Slot B → reboot into Slot B
```

### Delta/Differential Update

Only download the **difference** between current and new firmware. Smaller payloads.

```
Current: v1.2.0 (256KB)
Patch:   v1.2.0 → v1.3.0 (12KB diff)
Apply:   Reconstruct v1.3.0 from current + patch
```

**Tools:** bsdiff/bspatch, Zephyr's SUIT, Google's Puffin

### A/B (Dual-Bank) Updates

Two firmware slots in Flash. Update writes to the inactive slot while the system continues running from the active slot.

```
┌─────────────────────────────────────┐
│ Flash Memory                        │
│ ┌───────────┐  ┌───────────┐       │
│ │  Slot A   │  │  Slot B   │       │
│ │  (Active) │  │ (Staging) │       │
│ │  v1.2.0   │  │  v1.3.0   │       │
│ └───────────┘  └───────────┘       │
│ ┌──────────────────────────┐       │
│ │  Bootloader (validates)  │       │
│ └──────────────────────────┘       │
└─────────────────────────────────────┘
```

**Pros:** Zero-downtime updates, instant rollback
**Cons:** Requires 2x Flash for firmware

## Security

OTA updates are a **high-value attack target**. A malicious firmware update could brick devices or compromise users.

### Signing and Verification

```
Build Server:
  1. Hash firmware binary (SHA-256)
  2. Sign hash with private key (ECDSA/RSA)
  3. Bundle: firmware + signature + metadata

Device:
  1. Download update package
  2. Verify signature with embedded public key
  3. Verify hash matches firmware
  4. Only then write to Flash
```

### Secure Boot Chain

1. **ROM Bootloader** — immutable, verifies first-stage bootloader
2. **First-Stage Bootloader** — verifies application firmware
3. **Application** — verified, runs only if chain is intact

Each stage cryptographically validates the next. If any check fails, the device refuses to boot the new image.

### Transport Security

- TLS 1.3 for download connections
- Certificate pinning to prevent MITM attacks
- Encrypted firmware (optional) to protect IP

## Rollback Protection

### Automatic Rollback

```
1. Boot into new firmware (Slot B)
2. New firmware runs self-test
3. If self-test passes → mark Slot B as "confirmed"
4. If self-test fails or watchdog triggers → reboot into Slot A (rollback)
```

### Anti-Rollback

Prevent downgrading to older firmware versions that may have known vulnerabilities.

- Store firmware version counter in one-time-programmable (OTP) memory or secure element
- Bootloader refuses to boot firmware with version < stored counter

## Reliability

### Watchdog Timer

If the new firmware hangs, a hardware watchdog timer resets the device, triggering a rollback to the previous working firmware.

### Power Failure Safety

Interrupted updates can brick a device. Mitigations:

- A/B scheme — incomplete writes only affect the inactive slot
- Checksums on written data — detect partial writes
- Transactional metadata updates — update the "active slot" pointer atomically

### Progressive Rollout

Don't update all devices at once:

```
Day 1: 1% of devices (canary group)
Day 3: 10% (if no issues)
Day 7: 50%
Day 10: 100%
```

Monitor error rates, crash reports, and telemetry at each stage.

## Real-World OTA Platforms

| Platform | Provider | Features |
|----------|----------|----------|
| **AWS IoT** | Amazon | Device shadows, jobs, Greengrass |
| **Azure IoT Hub** | Microsoft | Device Update for IoT Hub |
| **MCUboot** | Open source | Bootloader for Zephyr, NuttX |
| **Mender** | Open source | Full OTA platform, delta updates |
| **golioth** | Golioth | Cloud platform for MCUs |
| **SWUpdate** | Open source | Linux-based embedded updates |
