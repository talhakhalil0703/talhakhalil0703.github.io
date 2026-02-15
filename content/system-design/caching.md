## What Is Caching?

Caching stores copies of frequently accessed data in a **faster storage layer** so future requests are served more quickly. It's one of the most impactful performance optimizations in system design.

```
Client ──▶ Cache (hit?) ──▶ yes ──▶ return cached data
                          └──▶ no ──▶ Database ──▶ store in cache ──▶ return
```

## Cache Levels

### Client-Side Cache

Browser cache, mobile app cache. Stores static assets, API responses.

### CDN Cache

Geographically distributed. Caches static content (images, CSS, JS) close to users.

### Application Cache

In-memory cache in your application layer (e.g., Redis, Memcached).

### Database Cache

Query result cache built into the database engine. Automatic but limited control.

## Caching Strategies

### Cache-Aside (Lazy Loading)

Application checks cache first. On miss, reads from database and populates cache.

```
1. Check cache for key
2. If miss → read from DB → write to cache → return
3. If hit → return cached value
```

**Pros:** Only caches what's actually requested. Cache failure doesn't break the system.

**Cons:** Cache miss = 3 round trips (cache check + DB read + cache write). Data can become stale.

### Write-Through

Every write goes to both cache and database simultaneously.

```
1. Write to cache
2. Cache writes to database
3. Return success
```

**Pros:** Cache is always consistent with DB.

**Cons:** Higher write latency (two writes per operation). Cache may hold data that's never read.

### Write-Behind (Write-Back)

Write to cache immediately, asynchronously flush to database.

```
1. Write to cache → return immediately
2. Background process flushes cache to DB
```

**Pros:** Very fast writes.

**Cons:** Risk of data loss if cache fails before flushing.

### Read-Through

Similar to cache-aside but the cache itself manages database interaction.

## Cache Eviction Policies

When the cache is full, something must be removed:

| Policy | Description | Best For |
|--------|-------------|----------|
| **LRU** (Least Recently Used) | Evict the item accessed longest ago | General purpose |
| **LFU** (Least Frequently Used) | Evict the least popular item | Frequency-based workloads |
| **FIFO** (First In, First Out) | Evict the oldest item | Simple, predictable |
| **TTL** (Time To Live) | Evict after a set time period | Data with known freshness |
| **Random** | Evict a random item | Surprisingly effective |

## Cache Invalidation

The hardest problem in caching:

> "There are only two hard things in Computer Science: cache invalidation and naming things." – Phil Karlton

### Strategies

- **TTL-based** — set expiration time. Simple but may serve stale data.
- **Event-based** — invalidate on write events. More accurate but complex.
- **Version-based** — append version number to cache key. New version = cache miss.

## Thundering Herd Problem

When a popular cache entry expires, hundreds of requests simultaneously hit the database.

**Solutions:**

- **Mutex/lock** — only one request fetches from DB, others wait
- **Stale-while-revalidate** — serve stale data while refreshing in background
- **Pre-warming** — populate cache before expiration

## Common Caching Tools

| Tool | Type | Use Case |
|------|------|----------|
| **Redis** | In-memory key-value | Sessions, leaderboards, rate limiting |
| **Memcached** | In-memory key-value | Simple caching, string/object storage |
| **Varnish** | HTTP reverse proxy | Full-page caching |
| **Cloudflare** | CDN + edge cache | Static assets, DDoS protection |
| **Browser Cache** | Client-side | Static resources (Cache-Control headers) |

## Caching in Interviews

When to mention caching:

1. **Read-heavy system** — "We'll add a Redis cache in front of the database"
2. **Hot data** — "Popular items get cached with a 5-minute TTL"
3. **Global users** — "Static assets served from CDN"
4. Always discuss **invalidation strategy** — don't just say "add a cache"
