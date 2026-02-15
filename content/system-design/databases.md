## Why Databases Matter

Every system needs to persist data. The choice of database affects your system's performance, scalability, consistency, and complexity. This is one of the most important decisions in system design.

## Relational Databases (SQL)

Store data in structured **tables** with rows and columns. Enforce schemas and relationships through foreign keys.

**Examples:** PostgreSQL, MySQL, SQLite, Oracle

### Strengths

- **ACID transactions** — Atomicity, Consistency, Isolation, Durability
- **Strong consistency** — data is always valid and up-to-date
- **Complex queries** — JOINs, aggregations, subqueries
- **Mature tooling** — decades of optimization and tooling

### When to Use

- Financial systems (transactions must be correct)
- Applications with complex relationships (e-commerce, ERP)
- When data integrity is critical
- When your schema is well-defined and stable

## Non-Relational Databases (NoSQL)

Flexible data models that trade some guarantees for performance and scalability.

### Document Stores

Store data as JSON-like documents. Each document can have a different structure.

**Examples:** MongoDB, CouchDB, Firestore

```json
{
  "_id": "user_123",
  "name": "Talha Khalil",
  "skills": ["C", "Python", "System Design"],
  "experience": {
    "company": "GARMIN",
    "role": "Senior Embedded Engineer"
  }
}
```

**Best for:** Content management, user profiles, catalogs

### Key-Value Stores

Simplest model: a key maps to a value. Extremely fast reads and writes.

**Examples:** Redis, DynamoDB, Memcached

**Best for:** Session storage, caching, leaderboards, rate limiting

### Wide-Column Stores

Organize data by columns rather than rows. Excellent for time-series and analytical queries.

**Examples:** Cassandra, HBase, ScyllaDB

**Best for:** IoT sensor data, event logs, time-series analytics

### Graph Databases

Model data as nodes and edges. Optimized for traversing relationships.

**Examples:** Neo4j, Amazon Neptune, JanusGraph

**Best for:** Social networks, recommendation engines, fraud detection

## SQL vs NoSQL Decision Framework

| Factor | SQL | NoSQL |
|--------|-----|-------|
| Schema | Fixed, structured | Flexible, schema-less |
| Scaling | Vertical (primary) | Horizontal (native) |
| Consistency | Strong (ACID) | Eventual (BASE) |
| Queries | Complex JOINs | Simple key-based lookups |
| Transactions | Built-in | Limited or manual |
| Use case | Relational data | High-volume, flexible data |

## Indexing

An **index** is a data structure that speeds up data retrieval at the cost of additional storage and slower writes.

### B-Tree Index

Default for most SQL databases. Balanced tree structure, great for range queries:

```sql
CREATE INDEX idx_user_email ON users(email);
```

### Hash Index

Direct key → value lookup. O(1) average case. Great for exact matches, useless for ranges.

### Composite Index

Index on multiple columns. Column order matters:

```sql
CREATE INDEX idx_user_name_date ON users(last_name, created_at);
```

## Denormalization

Trading storage for speed. Instead of JOINing tables at query time, pre-compute and store redundant data.

**Normalized:**
- `users` table + `posts` table → JOIN on every feed request

**Denormalized:**
- `feed_items` table with user name embedded → single table scan

Denormalization is a common technique in read-heavy systems where latency matters more than storage.

## Database in System Design Interviews

1. Start with the data model — what entities exist and how they relate
2. Choose SQL or NoSQL based on access patterns
3. Identify indexes based on query patterns
4. Plan for sharding/replication as scale grows
5. Consider caching (Redis) in front of the database
