## Why Requirements Gathering Matters

System design interviews start with vague prompts: *Design Uber. Design Yelp. Design LeetCode.* Your goal is to ask questions and clarify requirements—not jump straight to solutions.

You'll gather two types: **functional requirements** (what the system does) and **non-functional requirements** (how it behaves). Real systems are massive; you can't design the whole thing in an hour. Collaborate with the interviewer to pick the right subset. Skip this step and start drawing databases—you'll fail immediately.

## Functional Requirements

What the system needs to do.

For example, when designing a newsfeed:

- Get a newsfeed
- Post to the newsfeed
- Follow / unfollow users
- Like and comment on posts

These are the **core features** the user directly interacts with. In an interview, clarify scope:

> "Should we support images and videos, or text only?"
> "Do we need real-time updates or is polling acceptable?"

### Tips for Scoping

- Start broad, then narrow down with the interviewer
- Focus on 2-3 core features rather than trying to cover everything
- Write them down explicitly before moving on

## Non-Functional Requirements

System characteristics—how the system behaves:

- **Is it scalable?** Can it handle 10x or 100x growth?
- **Is it reliable?** What happens when a server goes down?
- **Is it consistent?** Do all users see the same data at the same time?
- **Is it low latency?** Does it respond within milliseconds?

### Scale Estimation

A critical part of non-functional requirements is estimating scale:

- How many users? (DAU — daily active users)
- How many requests per second?
- How much data stored per day/year?
- Read-heavy or write-heavy?

**Back-of-the-envelope calculations** are expected. For example:

```
100M DAU
Each user reads 10 posts/day → 1B reads/day
1B / 86,400 seconds ≈ ~12,000 reads/sec
```

## Putting It Together

A solid requirements gathering section in a system design interview looks like:

1. **Ask clarifying questions** — don't assume
2. **List functional requirements** — 2-3 core features
3. **List non-functional requirements** — scalability, latency, availability
4. **Estimate scale** — users, QPS, storage
5. **Get interviewer agreement** — before drawing a single box
