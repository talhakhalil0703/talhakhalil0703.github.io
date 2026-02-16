---
tags: [Fundamentals]
---

## Why Replicate?

Database replication copies data across multiple servers to achieve:

- **High availability** — if one server dies, others serve requests
- **Read scalability** — distribute read queries across replicas
- **Data durability** — data survives hardware failures
- **Geographic performance** — replicas closer to users reduce latency

## Leader-Follower (Primary-Replica)

The most common replication model.

```
Writes ──▶ [Leader/Primary]
              │
         ┌────┼────┐
         ▼    ▼    ▼
      [Replica] [Replica] [Replica]
         ▲    ▲    ▲
Reads ───┴────┴────┘
```

- **One leader** accepts all writes
- **Multiple followers** replicate from the leader and serve reads
- If the leader fails, a follower is **promoted** to leader (failover)

### Synchronous vs Asynchronous

**Synchronous replication:**
- Leader waits for followers to confirm writes
- Guarantees consistency but increases write latency
- If a follower is slow, the whole system slows down

**Asynchronous replication:**
- Leader writes locally and returns immediately
- Followers catch up eventually
- Risk: data loss if leader fails before replication completes

**Semi-synchronous:** One follower is synchronous (guarantees at least one copy), others are asynchronous.

## Leader-Leader (Multi-Master)

Multiple nodes accept writes. Each replicates to the others.

```
[Leader A] ◀──▶ [Leader B]
     ▲                ▲
     │                │
  Writes           Writes
(Region US)    (Region EU)
```

### Pros

- Writes from any region — great for geo-distributed systems
- No single point of failure for writes

### Cons

- **Write conflicts** — what if two leaders modify the same row simultaneously?
- Conflict resolution is hard: last-write-wins, merge, or manual resolution
- More complex to operate

## Leaderless Replication

Every node can accept reads and writes. Used by Dynamo-style databases.

**Examples:** Cassandra, Riak, Amazon DynamoDB

### Quorum Reads and Writes

With `N` replicas, configure:
- `W` = number of nodes that must acknowledge a write
- `R` = number of nodes that must respond to a read

**Rule:** `W + R > N` ensures you'll always read the latest write.

```
N = 3, W = 2, R = 2
Write to 2 out of 3 nodes
Read from 2 out of 3 nodes
Overlap guarantees freshness
```

### Anti-Entropy

Background processes compare replicas and fix inconsistencies using:
- **Merkle trees** — efficient comparison of data between nodes
- **Read repair** — on a read, if replicas disagree, update the stale ones

## Replication Lag

In asynchronous replication, followers may be behind the leader. This causes:

### Read-After-Write Inconsistency

User writes data, but the next read hits a stale replica:

**Fix:** Read from leader for recently written data, or track last write timestamp.

### Monotonic Read Inconsistency

User reads from different replicas and sees data go "backward" in time:

**Fix:** Pin user to a specific replica (session stickiness).

## Failover

When the leader fails, a follower must be promoted:

1. **Detect failure** — heartbeat/health check timeout
2. **Choose new leader** — most up-to-date follower
3. **Reconfigure** — redirect writes to new leader, update followers

### Split-Brain Problem

Two nodes both think they're the leader. Both accept writes, data diverges.

**Prevention:** Fencing tokens, consensus algorithms (Raft, Paxos), or managed databases that handle this automatically.

## Replication in Practice

| Database | Default Model | Notes |
|----------|--------------|-------|
| PostgreSQL | Leader-follower | Streaming replication |
| MySQL | Leader-follower | binlog replication |
| MongoDB | Leader-follower | Replica sets |
| Cassandra | Leaderless | Tunable quorums |
| CockroachDB | Consensus (Raft) | Strong consistency |
