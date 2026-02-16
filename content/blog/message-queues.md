---
tags: [Fundamentals]
---

## What Is a Message Queue?

A message queue is a **buffer** between a producer (sender) and a consumer (receiver). The producer adds messages to the queue, and the consumer processes them asynchronously.

```
Producer ──▶ [Queue: msg1, msg2, msg3] ──▶ Consumer
```

This **decouples** the producer from the consumer. They don't need to be running at the same time or at the same speed.

## Why Use Message Queues?

### Decoupling

Services don't need to know about each other. The producer publishes a message; it doesn't care who processes it.

### Async Processing

Offload slow work (sending emails, processing images, generating reports) so the main request returns quickly.

### Load Leveling

If traffic spikes, the queue absorbs the burst. Consumers process at their own pace instead of being overwhelmed.

### Reliability

Messages persist in the queue until successfully processed. If a consumer crashes, the message is redelivered.

## Messaging Models

### Point-to-Point (Queue)

Each message is consumed by **exactly one** consumer. Once processed, the message is removed.

```
Producer ──▶ [Queue] ──▶ Consumer A (gets msg1)
                    ──▶ Consumer B (gets msg2)
```

**Use case:** Task distribution, job processing

### Pub/Sub (Publish-Subscribe)

Each message is delivered to **all subscribers**. Every consumer gets a copy.

```
Publisher ──▶ [Topic]
              ├──▶ Subscriber A (gets all messages)
              ├──▶ Subscriber B (gets all messages)
              └──▶ Subscriber C (gets all messages)
```

**Use case:** Event broadcasting, notifications, real-time updates

## Message Delivery Guarantees

| Guarantee | Description | Trade-off |
|-----------|-------------|-----------|
| **At-most-once** | Message may be lost, never duplicated | Fastest, least reliable |
| **At-least-once** | Message is never lost, may be duplicated | Most common, requires idempotent consumers |
| **Exactly-once** | Message is delivered exactly once | Hardest to achieve, highest overhead |

In practice, most systems use **at-least-once** delivery with **idempotent consumers** (processing the same message twice produces the same result).

## Popular Message Queue Systems

### RabbitMQ

Traditional message broker with rich routing capabilities.

- Supports multiple messaging patterns
- AMQP protocol
- Good for complex routing needs
- Not designed for massive throughput

### Apache Kafka

Distributed **event streaming platform**. Not just a queue — it's a commit log.

- **Very high throughput** (millions of messages/second)
- Messages are **persisted** and **replayed**
- Consumer groups for parallel processing
- Great for event sourcing and stream processing

### Amazon SQS

Fully managed queue service by AWS.

- No infrastructure to manage
- Standard queues (at-least-once, best-effort ordering)
- FIFO queues (exactly-once, strict ordering)
- Dead letter queues for failed messages

### Redis Streams

Lightweight streaming data structure in Redis.

- Consumer groups like Kafka
- Good for simpler use cases
- Part of your existing Redis infrastructure

## Dead Letter Queues

When a message fails processing repeatedly, it's moved to a **dead letter queue** (DLQ) instead of being retried forever.

```
Main Queue ──▶ Consumer (fails 3 times) ──▶ Dead Letter Queue
```

Engineers investigate DLQ messages manually or with alerting.

## Message Queues in System Design

Common patterns in interviews:

1. **Order processing:** User places order → queue → payment service → inventory service
2. **Email/notification:** User action → queue → email service (async)
3. **Image processing:** Upload → queue → resize/thumbnail workers
4. **Analytics pipeline:** Events → Kafka → stream processing → data warehouse
