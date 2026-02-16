---
tags: [Fundamentals]
---

## What Is an API?

An **API** (Application Programming Interface) is a contract between two software components. It defines how they communicate—what requests you can make, what data you send, and what you get back.

In system design, APIs define the interface between your client and server, or between microservices.

## REST (Representational State Transfer)

The most common API style for web services. REST uses HTTP methods and treats everything as a **resource**.

### Key Principles

- **Stateless** — each request contains all necessary information
- **Resource-based** — URLs represent resources (`/users/123`, `/posts`)
- **HTTP methods** — `GET`, `POST`, `PUT`, `DELETE` map to CRUD operations
- **JSON responses** — standard data format

### Example

```
GET    /api/users          → List all users
GET    /api/users/123      → Get user 123
POST   /api/users          → Create a new user
PUT    /api/users/123      → Update user 123
DELETE /api/users/123      → Delete user 123
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — success |
| 201 | Created |
| 400 | Bad Request — client error |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## GraphQL

Developed by Facebook. Instead of multiple endpoints, you have a **single endpoint** and the client specifies exactly what data it needs.

```graphql
query {
  user(id: "123") {
    name
    email
    posts {
      title
      createdAt
    }
  }
}
```

### Pros

- No over-fetching or under-fetching
- Single endpoint simplifies routing
- Strongly typed schema

### Cons

- Complex to implement and cache
- Can lead to performance issues with deeply nested queries
- Harder to rate-limit since all queries hit one endpoint

## gRPC

A high-performance RPC framework by Google using **Protocol Buffers** (protobuf) for serialization.

```protobuf
service UserService {
  rpc GetUser (UserRequest) returns (UserResponse);
  rpc ListUsers (Empty) returns (stream UserResponse);
}
```

### When to Use gRPC

- **Server-to-server** communication (microservices)
- Low-latency, high-throughput requirements
- Bi-directional streaming
- When you need strict contracts between services

### Not Great For

- Browser clients (limited browser support)
- Public-facing APIs (REST is more universal)

## API Design Best Practices

### Pagination

Never return unbounded results. Use cursor-based or offset-based pagination:

```
GET /api/posts?cursor=abc123&limit=20
```

### Rate Limiting

Protect your API from abuse:

- Token bucket algorithm
- Return `429 Too Many Requests` with `Retry-After` header
- Differentiate limits per user/API key tier

### Versioning

Plan for change:

```
/api/v1/users
/api/v2/users
```

Or use headers: `Accept: application/vnd.myapp.v2+json`

### Idempotency

For operations that might be retried (network failures), ensure the same request produces the same result:

- `GET` is naturally idempotent
- `POST` with an idempotency key: `Idempotency-Key: abc-123`
- `PUT` and `DELETE` should be idempotent by design

## Choosing the Right API Style

| Factor | REST | GraphQL | gRPC |
|--------|------|---------|------|
| Client type | Any | Web/mobile | Server-to-server |
| Performance | Good | Good | Excellent |
| Flexibility | Moderate | High | Low |
| Caching | Easy (HTTP) | Complex | Complex |
| Learning curve | Low | Medium | High |
