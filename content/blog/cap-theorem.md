---
tags: [Fundamentals]
---

## The CAP Theorem

The **CAP theorem** (Brewer's theorem) states that a distributed system can guarantee at most **two out of three** properties:

- **C** — Consistency
- **A** — Availability
- **P** — Partition Tolerance

## The Three Properties

### Consistency

Every read receives the **most recent write** or an error. All nodes see the same data at the same time.

### Availability

Every request receives a **non-error response**, without guarantee that it contains the most recent write. The system is always responsive.

### Partition Tolerance

The system continues to operate despite **network partitions** — when communication between nodes is lost or delayed.

## The Tradeoff

In a distributed system, network partitions **will happen** (P is mandatory). So the real choice is:

> **CP** or **AP** — you can't have both C and A during a partition.

```
         C
        / \
       /   \
      /     \
    CP      CA ← not practical in distributed systems
      \     /
       \   /
        \ /
    AP───P (always required)
```

## CP Systems (Consistency + Partition Tolerance)

During a partition, the system **refuses to respond** rather than return potentially stale data.

**Behavior:** Some requests may be rejected or timeout, but any response you do get is guaranteed to be correct.

**Examples:**
- **MongoDB** (with majority write concern)
- **HBase**
- **Redis** (single-node)
- **Zookeeper**
- **etcd**

**Use cases:** Banking, inventory management, leader election — where wrong data is worse than no data

## AP Systems (Availability + Partition Tolerance)

During a partition, the system **always responds** but may return stale data.

**Behavior:** Every request gets a response, but different nodes may show different values temporarily.

**Examples:**
- **Cassandra**
- **DynamoDB**
- **CouchDB**
- **DNS**

**Use cases:** Social media feeds, product catalogs, shopping carts — where availability matters more than perfect accuracy

## The Nuance

CAP is often oversimplified. Important caveats:

### It's About Partitions

When there's **no partition**, you can have both consistency and availability. The tradeoff only matters during failures.

### Consistency Is a Spectrum

It's not binary. Real systems offer tunable consistency:

- **Strong consistency** — linearizable reads
- **Causal consistency** — respects causal ordering
- **Eventual consistency** — converges over time
- **Read-your-writes** — you see your own writes immediately

### PACELC Extension

An extension of CAP:

> If there's a **P**artition, choose between **A**vailability and **C**onsistency.
> **E**lse (normal operation), choose between **L**atency and **C**onsistency.

| System | Partition (PA/PC) | Normal (EL/EC) |
|--------|-------------------|-----------------|
| DynamoDB | PA | EL |
| Cassandra | PA | EL |
| MongoDB | PC | EC |
| PNUTS (Yahoo) | PC | EL |
| VoltDB | PC | EC |

## In System Design Interviews

1. Know the theorem and its implications
2. Don't just say "CAP" — explain what your system chooses and **why**
3. For most web applications, choose **AP** (users prefer a response, even if slightly stale)
4. For financial/transactional systems, choose **CP** (correctness over availability)
5. Mention PACELC for bonus points — shows deeper understanding
