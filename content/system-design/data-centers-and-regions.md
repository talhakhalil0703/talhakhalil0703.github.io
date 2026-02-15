## Why Multiple Data Centers?

If all your servers are in one location and that location goes down—power outage, natural disaster, network failure—your entire service goes offline. Data centers and regions solve this.

## Regions and Availability Zones

### Region

A **geographic area** containing one or more data centers. Examples: US-East (Virginia), EU-West (Ireland), AP-Southeast (Singapore).

### Availability Zone (AZ)

**Independent data centers within a region.** Each AZ has its own power, cooling, and networking. AZs in the same region are connected via low-latency private links.

```
Region: US-East
├── AZ-1 (Data Center A)
├── AZ-2 (Data Center B)
└── AZ-3 (Data Center C)
```

**Key insight:** Deploying across multiple AZs within a region protects against single data center failures with minimal latency impact.

## Multi-Region Architecture

### Why Go Multi-Region?

- **Disaster recovery** — entire region can fail (rare but possible)
- **Lower latency** — serve users from the nearest region
- **Compliance** — data residency laws (GDPR requires EU data stays in EU)
- **Higher availability** — survive region-level outages

### Challenges

- **Data replication** — keeping data in sync across regions with acceptable lag
- **Consistency** — cross-region writes are slow (speed of light is the bottleneck)
- **DNS routing** — directing users to the nearest healthy region
- **Cost** — running infrastructure in multiple regions is expensive
- **Complexity** — deployments, monitoring, and debugging multiply

## Traffic Routing

### GeoDNS

DNS resolves to the nearest region's IP address based on the client's location.

```
User in Tokyo → DNS → asia-1.example.com → Singapore DC
User in London → DNS → eu-1.example.com → Ireland DC
User in NYC    → DNS → us-1.example.com → Virginia DC
```

### Anycast

Multiple servers share the same IP address. BGP routing sends traffic to the nearest server.

Used by CDNs (Cloudflare) and DNS services.

### Global Load Balancer

Cloud providers offer global load balancers that route based on latency, health, and proximity. Examples: AWS Global Accelerator, GCP Cloud Load Balancing.

## Data Replication Across Regions

### Active-Passive

One region is primary (handles writes). Other regions are passive (read-only replicas). On primary failure, a passive region is promoted.

```
US-East (Primary) ──replication──▶ EU-West (Passive)
                  ──replication──▶ AP-South (Passive)
```

### Active-Active

Multiple regions accept writes. Requires conflict resolution for concurrent writes to the same data.

```
US-East ◀──sync──▶ EU-West ◀──sync──▶ AP-South
```

## Failover Strategies

### DNS-Based Failover

Update DNS records to point to a healthy region. Slow — DNS TTL means users may still hit the failed region for minutes.

### Health Check + Auto-Failover

Cloud services continuously monitor region health and automatically reroute traffic.

### Manual Failover

Used for critical systems where automated failover risks data corruption. Engineers manually promote the backup region after verifying data integrity.

## Real-World Patterns

| Company | Approach | Details |
|---------|----------|---------|
| Netflix | Active-Active, 3 regions | Zuul gateway, Eureka service discovery |
| Cloudflare | Anycast, 300+ cities | Edge computing, no "origin" concept |
| AWS | Regions + AZs | 30+ regions, 90+ AZs globally |
| Google | Global Spanner | Single globally-consistent database |
