## Why Partition Data?

When a single database can't hold all your data or handle all your queries, you split it across multiple machines. This is **data partitioning** (also called **sharding**).

## Horizontal Partitioning (Sharding)

Split rows across multiple databases. Each shard holds a subset of the data.

```
Shard 1: Users A-M
Shard 2: Users N-Z
```

Each shard has the same schema but different data. This is the most common approach.

## Vertical Partitioning

Split columns across different databases. Put frequently accessed columns together and rarely accessed ones separately.

```
Database 1: user_id, name, email (hot data)
Database 2: user_id, bio, preferences, avatar_url (cold data)
```

## Partitioning Strategies

### Range-Based Partitioning

Divide data by ranges of a key:

```
Shard 1: user_id 1 - 1,000,000
Shard 2: user_id 1,000,001 - 2,000,000
Shard 3: user_id 2,000,001 - 3,000,000
```

**Pros:** Simple, range queries are efficient within a shard

**Cons:** **Hotspots** — if most new users are in the latest range, one shard gets hammered

### Hash-Based Partitioning

Hash the partition key and assign based on the hash:

```
shard_id = hash(user_id) % num_shards
```

**Pros:** Even distribution of data across shards

**Cons:** Range queries become expensive (must query all shards), adding shards requires rehashing

### Consistent Hashing

Maps both data and servers to a hash ring. When a server is added/removed, only a fraction of data needs to move.

Used by: DynamoDB, Cassandra, Memcached

**Pros:** Minimal data movement when scaling

**Cons:** More complex to implement, can lead to uneven distribution without virtual nodes

### Directory-Based Partitioning

A lookup service maps each key to its shard:

```
Lookup Table:
  user_123 → Shard 2
  user_456 → Shard 1
  user_789 → Shard 3
```

**Pros:** Flexible — can move data without changing logic

**Cons:** Lookup service is a single point of failure and a bottleneck

## Challenges of Partitioning

### Cross-Shard Queries

JOINs across shards are expensive. You need to:

- Denormalize data (duplicate across shards)
- Use application-level joins
- Design your partition key to keep related data together

### Rebalancing

When a shard gets too large or too hot, you need to redistribute data. This is operationally complex and can impact performance.

### Unique IDs

Auto-increment doesn't work across shards. Solutions:

- **UUID** — universally unique, but not sortable
- **Snowflake ID** — Twitter's approach: timestamp + machine ID + sequence
- **Database sequences** — centralized ID generation service

### Transactions

ACID transactions across shards are very difficult. Options:

- **Two-phase commit (2PC)** — slow but correct
- **Saga pattern** — sequence of local transactions with compensating actions
- **Design around it** — keep transaction boundaries within a single shard

## Choosing a Partition Key

The partition key determines data distribution. A good key:

- **Distributes evenly** — no hotspots
- **Supports your query patterns** — queries should hit one shard when possible
- **Rarely changes** — repartitioning on key changes is expensive

Examples:
- User-based app → `user_id`
- E-commerce → `order_id` or `customer_id`
- Time-series → `timestamp` (with care for hotspots)
