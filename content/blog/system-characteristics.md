---
tags: [Fundamentals]
---

## What Are System Characteristics?

System characteristics define the **quality attributes** of a distributed system. When someone asks "design X at scale," they're really asking about these properties. Understanding the tradeoffs between them is the foundation of system design.

## Scalability

The ability of a system to handle increased load by adding resources.

- **Vertical scaling** — add more power to a single machine (bigger CPU, more RAM)
- **Horizontal scaling** — add more machines to distribute the load

A scalable system can grow gracefully. An unscalable system falls over when traffic doubles.

### Key Metrics

- Requests per second (RPS)
- Concurrent connections
- Data volume growth rate

## Availability

The percentage of time a system is operational and accessible.

Measured in "nines":

| Availability | Downtime/year |
|-------------|---------------|
| 99% (two nines) | 3.65 days |
| 99.9% (three nines) | 8.76 hours |
| 99.99% (four nines) | 52.6 minutes |
| 99.999% (five nines) | 5.26 minutes |

High availability is achieved through:

- **Redundancy** — no single point of failure
- **Failover mechanisms** — automatic switching to backup systems
- **Health checks** — continuous monitoring

## Reliability

A reliable system produces correct results even under adverse conditions.

Reliability ≠ availability. A system can be available but unreliable (it responds, but with wrong data). Key strategies:

- Data replication across nodes
- Checksums and validation
- Retry logic with idempotency
- Graceful degradation

## Consistency

Every read receives the most recent write or an error.

Three consistency models:

- **Strong consistency** — reads always reflect the latest write (e.g., bank transactions)
- **Eventual consistency** — reads may be stale temporarily but will converge (e.g., social media likes)
- **Causal consistency** — operations that are causally related are seen in order

## Latency vs Throughput

**Latency** is the time it takes to process a single request (milliseconds). **Throughput** is the number of requests processed per unit time (requests/second).

```
Low latency + high throughput = ideal
Low latency + low throughput = bottleneck somewhere
High latency + high throughput = batch processing system
```

Optimizing one often comes at the cost of the other. Adding a cache improves latency but may reduce consistency.

## Partition Tolerance

The system continues to operate despite network partitions (communication failures between nodes).

In distributed systems, network partitions **will happen**. The question is: when they do, do you sacrifice consistency or availability? This is the essence of the CAP theorem.

## Durability

Once data is committed, it persists even through system failures.

Achieved through:

- Write-ahead logs (WAL)
- Replication to multiple disks/nodes
- Periodic snapshots and backups

## The Tradeoff Game

No system gets all characteristics at maximum. System design is about making **informed tradeoffs**:

- E-commerce checkout → strong consistency + high availability
- Social media feed → eventual consistency + low latency
- Banking → strong consistency + durability
- IoT sensor data → high throughput + partition tolerance
