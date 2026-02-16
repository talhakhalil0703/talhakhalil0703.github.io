---
tags: [Fundamentals]
---

## The Scaling Problem

When your single server can't handle the load, you have two options: make it bigger or add more of them.

## Vertical Scaling (Scale Up)

Add more resources to your **existing server**: more CPU, more RAM, faster disks.

```
Before: 4 cores, 16GB RAM, 500GB SSD
After:  32 cores, 128GB RAM, 2TB NVMe
```

### Pros

- **Simple** — no code changes required
- **No distributed systems complexity** — single machine, no network partitions
- **Strong consistency** — all data is on one machine
- **Lower operational overhead** — one server to manage

### Cons

- **Hardware limits** — there's a ceiling to how big a single machine can get
- **Single point of failure** — if it goes down, everything goes down
- **Expensive** — high-end hardware cost grows exponentially
- **Downtime for upgrades** — need to restart to add hardware

## Horizontal Scaling (Scale Out)

Add **more machines** to distribute the load across a fleet of servers.

```
Before: 1 server handling 10,000 req/s
After:  10 servers handling 1,000 req/s each
        + load balancer distributing traffic
```

### Pros

- **Nearly unlimited scaling** — just add more machines
- **Fault tolerance** — if one server dies, others continue
- **Cost-effective** — commodity hardware is cheaper than high-end
- **Geographic distribution** — servers in different regions

### Cons

- **Complexity** — distributed systems are hard
- **Data consistency** — need strategies for data sync across nodes
- **Network overhead** — inter-server communication adds latency
- **Operational overhead** — more servers to deploy, monitor, and maintain

## Comparison

| Aspect | Vertical | Horizontal |
|--------|----------|------------|
| Complexity | Low | High |
| Cost at scale | Exponential | Linear |
| Fault tolerance | None | Built-in |
| Consistency | Easy | Challenging |
| Latency | Lower | Higher (network) |
| Limit | Hardware ceiling | Practically unlimited |

## When to Use What

### Start Vertical When:

- You're early stage and traffic is predictable
- Your application isn't easily parallelizable
- You want to avoid distributed systems complexity
- Database workloads (PostgreSQL scales vertically well)

### Go Horizontal When:

- You're at scale (thousands of requests per second)
- You need high availability (zero downtime)
- Your workload is stateless and easily parallelizable
- You're building for global users across regions

## The Hybrid Approach

Most real systems use **both**:

1. Vertically scale each individual server to a reasonable size
2. Horizontally scale by adding more servers behind a load balancer
3. Use databases that support both (e.g., read replicas for horizontal, primary with beefy hardware for vertical)

> In interviews, default to horizontal scaling—but explain why and when vertical scaling is appropriate.
