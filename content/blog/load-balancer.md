---
tags: [Fundamentals]
---

## What Is a Load Balancer?

A **load balancer** distributes incoming network traffic across multiple servers. It's the first thing you add when you horizontally scale — it sits between clients and your server fleet, ensuring no single server is overwhelmed.

```
                    ┌─────────┐
                    │ Server 1│
┌────────┐   ┌─────┤         │
│ Clients│──▶│ LB  │ Server 2│
└────────┘   └─────┤         │
                    │ Server 3│
                    └─────────┘
```

## Load Balancing Algorithms

### Round Robin

Distributes requests sequentially across servers. Simple and fair when servers are identical.

```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A  (cycle repeats)
```

### Weighted Round Robin

Assigns weights based on server capacity. A server with weight 3 gets 3x more traffic than one with weight 1.

### Least Connections

Routes to the server with the fewest active connections. Best when request processing times vary.

### Least Response Time

Routes to the server with the lowest response time + fewest connections. Accounts for actual server performance.

### IP Hash

Hashes the client's IP to determine the server. Ensures the same client always hits the same server (useful for session persistence).

### Consistent Hashing

Maps both servers and requests to a hash ring. Minimizes redistribution when servers are added or removed. Used in distributed caches and databases.

## Types of Load Balancers

### Layer 4 (Transport Layer)

Operates at the TCP/UDP level. Routes based on IP address and port number without inspecting packet contents.

- **Faster** — doesn't need to parse application data
- **Simpler** — no awareness of HTTP, just TCP connections
- **Use case** — high-throughput, low-latency requirements

### Layer 7 (Application Layer)

Operates at the HTTP level. Can make routing decisions based on URL path, headers, cookies, or request body.

- **Smarter** — can route `/api` to API servers and `/static` to CDN
- **SSL termination** — handles HTTPS decryption
- **Use case** — web applications, API gateways, microservices

## Health Checks

Load balancers continuously check if servers are healthy:

- **Active health checks** — LB sends periodic requests to a `/health` endpoint
- **Passive health checks** — LB monitors response codes and timeouts from real traffic

Unhealthy servers are **removed from the pool** until they recover.

## High Availability for the Load Balancer

The load balancer itself can be a single point of failure. Solutions:

- **Active-passive** — standby LB takes over if primary fails
- **Active-active** — multiple LBs share the load (DNS round-robin or anycast)
- **Managed services** — AWS ELB, GCP Load Balancer, Cloudflare — handle HA for you

## Real-World Examples

| Load Balancer | Type | Notable For |
|--------------|------|-------------|
| Nginx | L4/L7 | Reverse proxy + load balancing |
| HAProxy | L4/L7 | High performance, widely used |
| AWS ALB | L7 | Application-aware, auto-scaling |
| AWS NLB | L4 | Ultra-low latency |
| Envoy | L7 | Service mesh, gRPC support |
| Cloudflare | L7 | Global anycast network |

## In System Design Interviews

When you mention horizontal scaling, immediately follow with:

1. "We'll put a load balancer in front of our servers"
2. Choose an algorithm (default: round robin or least connections)
3. Mention health checks for fault tolerance
4. Address the LB's own availability (active-passive or managed service)
