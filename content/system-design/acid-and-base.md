## Two Models for Data Guarantees

ACID and BASE represent two different philosophies for how databases handle transactions and consistency.

## ACID

Traditional relational database guarantees. Prioritizes **correctness**.

### Atomicity

A transaction is **all or nothing**. If any part fails, the entire transaction is rolled back.

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
-- If either UPDATE fails, neither happens
```

### Consistency

A transaction brings the database from one **valid state** to another. All constraints (foreign keys, unique indexes, checks) are enforced.

### Isolation

Concurrent transactions don't interfere with each other. Each transaction sees a consistent snapshot of the database.

**Isolation levels (from weakest to strongest):**

| Level | Dirty Reads | Non-Repeatable Reads | Phantom Reads |
|-------|------------|---------------------|---------------|
| Read Uncommitted | ✓ | ✓ | ✓ |
| Read Committed | ✗ | ✓ | ✓ |
| Repeatable Read | ✗ | ✗ | ✓ |
| Serializable | ✗ | ✗ | ✗ |

Higher isolation = more correct but slower (more locking).

### Durability

Once a transaction is committed, it **survives** system crashes. Data is written to non-volatile storage (disk, WAL).

## BASE

NoSQL/distributed database philosophy. Prioritizes **availability** and **performance**.

### Basically Available

The system **guarantees availability** according to the CAP theorem. Every request gets a response, even during partial failures.

### Soft State

The system's state **may change over time**, even without new input, as data propagates between replicas.

### Eventually Consistent

If no new updates are made, all replicas will **eventually** converge to the same value. There's a window where reads may return stale data.

## Comparison

| Property | ACID | BASE |
|----------|------|------|
| Consistency | Strong | Eventual |
| Availability | May sacrifice for correctness | Prioritized |
| Complexity | Simpler mental model | Requires handling inconsistency |
| Performance | Lower (locking overhead) | Higher (no coordination) |
| Scaling | Vertical (primarily) | Horizontal (native) |
| Use case | Financial, transactional | Social media, analytics |

## ACID in Practice

### Traditional RDBMS

PostgreSQL, MySQL, Oracle — ACID by default.

### Distributed SQL

CockroachDB, Google Spanner, YugabyteDB — ACID across distributed nodes using consensus algorithms.

**How Spanner achieves global ACID:**
- TrueTime API (GPS + atomic clocks) for globally synchronized timestamps
- Paxos consensus for replication
- Two-phase commit for cross-shard transactions

## BASE in Practice

### DynamoDB

- Eventual consistency by default
- Optional strong consistency reads (at 2x cost)
- Partition-tolerant and highly available

### Cassandra

- Tunable consistency per query
- `QUORUM` reads/writes for stronger guarantees
- `ONE` for maximum performance

### MongoDB

- Default: eventual consistency with single-document ACID
- Multi-document transactions available (with performance cost)

## When to Choose

### Use ACID When:

- **Money is involved** — bank transfers, payments, billing
- **Inventory management** — can't oversell products
- **User authentication** — security-critical data
- **Legal compliance** — audit trails must be accurate

### Use BASE When:

- **Social features** — likes, comments, feeds (a stale like count is OK)
- **Analytics** — approximate counts are acceptable
- **Content delivery** — serving content with slight staleness
- **IoT data** — high-volume sensor data where individual accuracy matters less

## The Spectrum

Modern systems often use **both models** in different parts of the same application:

```
Payment Service → PostgreSQL (ACID)
Product Catalog → DynamoDB (BASE)
User Sessions  → Redis (BASE)
Order History  → Cassandra (BASE)
Inventory      → PostgreSQL (ACID)
```

Choose the right model for each subsystem based on its requirements.
