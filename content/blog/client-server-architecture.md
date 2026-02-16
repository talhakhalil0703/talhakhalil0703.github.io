---
tags: [Fundamentals]
---

## The Basic Model

Every networked application starts as a **client-server architecture**. A client sends a request, a server processes it and sends a response. This is the simplest distributed system.

```
┌──────────┐         HTTP          ┌──────────┐
│  Client  │  ──── Request ────▶  │  Server  │
│ (Browser)│  ◀── Response ────   │  (API)   │
└──────────┘                      └──────────┘
```

## Client

The client is any device or application that initiates requests:

- Web browsers (Chrome, Firefox)
- Mobile apps (iOS, Android)
- Desktop applications
- IoT devices
- Other servers (server-to-server communication)

Clients are typically **stateless** — they don't remember previous interactions unless they store something locally (cookies, localStorage, etc.).

## Server

The server listens for incoming requests, processes them, and returns responses:

- **Web server** — serves HTML, CSS, JS files (Nginx, Apache)
- **Application server** — runs business logic (Node.js, Django, Spring)
- **Database server** — stores and retrieves data (PostgreSQL, MongoDB)

In practice, a "server" can be one machine handling all three roles, or separate machines for each.

## The Request-Response Cycle

1. **DNS Resolution** — client resolves `example.com` to an IP address
2. **TCP Connection** — client opens a connection to the server (TCP handshake)
3. **Request** — client sends an HTTP request (method, headers, body)
4. **Processing** — server routes the request, runs logic, queries a database
5. **Response** — server sends back status code, headers, and body
6. **Rendering** — client processes the response (renders HTML, parses JSON)

## Communication Protocols

### HTTP / HTTPS

The most common protocol for web communication. Stateless, request-response based.

- `GET` — retrieve data
- `POST` — create data
- `PUT` / `PATCH` — update data
- `DELETE` — remove data

### WebSocket

Persistent, bidirectional connection. Useful for real-time features:

- Chat applications
- Live dashboards
- Multiplayer games

### gRPC

High-performance RPC framework using Protocol Buffers. Used for server-to-server communication where performance matters.

## Scaling Beyond a Single Server

A single server can handle a limited number of concurrent connections. When traffic grows, you have options:

1. **Vertical scaling** — upgrade the server hardware
2. **Horizontal scaling** — add more servers behind a load balancer
3. **Caching** — reduce load by serving repeated requests from memory
4. **CDN** — distribute static content geographically

The transition from single-server to multi-server architecture is where system design really begins. Every topic in this course builds on this foundation.

## When to Use This Pattern

Client-server is appropriate for:

- Web applications
- APIs and microservices
- Mobile backends
- Any request-response workflow

Alternatives include **peer-to-peer** (BitTorrent, blockchain) and **event-driven architectures** (Kafka, pub/sub).
