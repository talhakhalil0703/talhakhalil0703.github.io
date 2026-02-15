## The Core Distinction

How your server handles state determines your architecture's scalability, resilience, and complexity.

## Stateful Web Servers

The server **remembers** information about the client between requests. User session data is stored in the server's memory.

```
Client A ──▶ Server 1 (has A's session)
Client B ──▶ Server 2 (has B's session)
Client A ──▶ Server 2 ❌ (Server 2 doesn't know A)
```

### Problems

- **Sticky sessions required** — clients must always route to the same server
- **Scaling is hard** — adding/removing servers breaks sessions
- **Failover loses data** — if the server dies, all sessions are lost
- **Uneven load** — some servers hold more sessions than others

## Stateless Web Servers

The server treats every request independently. **No session data is stored on the server.** All state lives externally.

```
Client A ──▶ Any Server ✓ (state in shared store)
Client A ──▶ Any Server ✓ (state in shared store)
Client B ──▶ Any Server ✓ (state in shared store)
```

### How It Works

State is moved to an **external store** accessible by all servers:

- **Redis / Memcached** — session data, user preferences
- **Database** — persistent user state
- **JWT tokens** — encoded in the request itself (client-side state)
- **Cookies** — small amounts of client-side data

### Benefits

- **Easy horizontal scaling** — any server can handle any request
- **Simple load balancing** — round robin works, no sticky sessions needed
- **Fault tolerant** — server death doesn't lose user state
- **Easy deployments** — swap out servers without session migration

## Session Management Approaches

### Server-Side Sessions (Stateful)

```
1. User logs in → server creates session in memory
2. Server returns session ID via cookie
3. Client sends session ID with every request
4. Server looks up session in its memory
```

**Problem:** Session is tied to one server.

### Shared Session Store (Stateless)

```
1. User logs in → server creates session in Redis
2. Server returns session ID via cookie
3. Client sends session ID with every request
4. Any server looks up session in Redis
```

**Benefit:** Any server can serve any request.

### JWT Tokens (Stateless)

```
1. User logs in → server creates signed JWT
2. Server returns JWT to client
3. Client sends JWT with every request
4. Any server verifies JWT signature (no external lookup)
```

**Benefit:** No session store needed at all. But tokens can't be easily revoked.

## Comparison

| Aspect | Stateful | Stateless |
|--------|----------|-----------|
| Scaling | Difficult | Easy |
| Load balancing | Sticky sessions | Any algorithm |
| Fault tolerance | Poor | Excellent |
| Server complexity | Higher | Lower |
| External dependencies | None | Session store (Redis) |
| Session revocation | Easy | Harder (JWT) |

## Best Practice

> **Default to stateless.** Move state to an external store. Your web servers should be interchangeable commodity machines.

This is a foundational principle. Almost every system design interview answer benefits from stateless servers:

1. Web servers are stateless — easy to add/remove
2. Session state lives in Redis or is client-side (JWT)
3. Load balancer distributes freely
4. Auto-scaling groups can spin up/down without concern
