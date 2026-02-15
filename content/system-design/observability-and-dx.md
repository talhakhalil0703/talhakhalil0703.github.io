## Why Observability Matters

Building a system is only half the battle. You also need to **understand what it's doing** in production. Observability gives you the ability to ask questions about your system's behavior without deploying new code.

## The Three Pillars

### Logs

Discrete events recorded by your application. The most basic form of observability.

```
2026-02-14T10:23:45Z INFO [auth-service] User login successful user_id=12345
2026-02-14T10:23:46Z ERROR [payment-service] Payment failed order_id=67890 error="card_declined"
```

**Best practices:**
- **Structured logging** (JSON format) — machine-parseable
- Include **context** — request ID, user ID, timestamps
- Use **log levels** — DEBUG, INFO, WARN, ERROR, FATAL
- Centralize logs — don't ssh into individual servers

**Tools:** ELK Stack (Elasticsearch, Logstash, Kibana), Datadog, Splunk, Grafana Loki

### Metrics

**Numerical measurements** aggregated over time. Answer "how much" or "how fast" questions.

```
http_request_duration_seconds{method="GET", path="/api/users", status="200"} 0.045
http_requests_total{method="GET", path="/api/users"} 150423
```

**Key metric types:**
- **Counter** — monotonically increasing (total requests, errors)
- **Gauge** — value that goes up and down (CPU usage, queue depth)
- **Histogram** — distribution of values (request latency p50, p95, p99)

**The RED Method (for services):**
- **R**ate — requests per second
- **E**rror — error rate
- **D**uration — latency distribution

**The USE Method (for resources):**
- **U**tilization — how busy is the resource?
- **S**aturation — how much queued work?
- **E**rrors — error count

**Tools:** Prometheus, Grafana, Datadog, CloudWatch, StatsD

### Traces

Follow a single request across **multiple services**. Critical for debugging microservices.

```
Request → API Gateway (5ms) → Auth Service (2ms) → User Service (15ms) → Database (8ms)
                                                                    Total: 30ms
```

Each span represents a unit of work. Together they form a **trace** showing the full request lifecycle.

**Tools:** Jaeger, Zipkin, AWS X-Ray, Datadog APT, OpenTelemetry

## Alerting

Metrics without alerts are just pretty graphs. Alert on **symptoms, not causes**:

### Good Alerts

- "Error rate exceeded 1% for 5 minutes" (symptom)
- "P99 latency above 500ms for 10 minutes" (symptom)
- "Database connection pool at 90% capacity" (leading indicator)

### Bad Alerts

- "CPU at 80%" (might be fine — depends on context)
- "One request failed" (noise — not actionable)
- "Disk at 70%" (too early, unless growing fast)

### Alert Fatigue

Too many alerts = alerts get ignored. Prioritize:

- **Page-worthy** — service is down, data loss risk
- **Ticket-worthy** — needs attention but not urgent
- **Logged** — informational, investigate if pattern emerges

## Developer Experience (DX)

Observability isn't just for operations teams. Good DX means developers can understand, debug, and iterate on systems quickly.

### Local Development

- **Hot reload** — see changes immediately
- **Docker Compose** — run dependencies locally
- **Seed data** — realistic test data for development

### CI/CD Pipeline

- **Fast builds** — minutes, not hours
- **Automated testing** — unit, integration, end-to-end
- **Preview environments** — deploy PRs to isolated environments
- **Feature flags** — decouple deployment from release

### Documentation

- **API docs** — auto-generated from code (OpenAPI/Swagger)
- **Architecture Decision Records (ADRs)** — document why decisions were made
- **Runbooks** — step-by-step guides for common incidents

### On-Call and Incident Response

- **Runbooks** for common alerts
- **Post-mortems** after incidents — blameless, focused on learning
- **SLOs (Service Level Objectives)** — measurable targets for reliability
- **Error budgets** — allowed failure rate before slowing feature development

## Observability in System Design

When discussing your design:

1. "We'll add structured logging with request tracing across services"
2. "We'll track RED metrics (rate, errors, duration) on every service"
3. "Distributed tracing with OpenTelemetry to debug cross-service issues"
4. "Alerts on error rate and latency SLOs, with PagerDuty integration"
5. "Dashboards in Grafana for real-time visibility"
