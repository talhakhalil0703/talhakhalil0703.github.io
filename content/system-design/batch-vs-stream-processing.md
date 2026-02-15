## Two Paradigms for Processing Data

When your system generates large volumes of data, you need to process it. There are two fundamental approaches:

## Batch Processing

Process data in **large chunks** at scheduled intervals. Collect data over time, then process it all at once.

```
Raw Data ──▶ Accumulate (hours/days) ──▶ Batch Job ──▶ Results
```

### Examples

- Daily analytics reports: aggregate all yesterday's events overnight
- ETL pipelines: extract from DB, transform, load into data warehouse
- Machine learning training: retrain models on accumulated data
- Monthly billing calculations
- Search index rebuilding

### Technologies

| Tool | Description |
|------|-------------|
| **MapReduce** | Google's original batch framework |
| **Apache Spark** | Fast in-memory batch processing |
| **Apache Hadoop** | Distributed file system + MapReduce |
| **AWS Glue** | Managed ETL service |
| **dbt** | SQL-based data transformation |

### Pros

- **Simple** — process data in well-understood chunks
- **Efficient** — optimize for throughput, not latency
- **Cost-effective** — use cheaper compute during off-peak hours
- **Reprocessable** — run the job again if something fails

### Cons

- **High latency** — results are hours or days old
- **Not real-time** — can't react immediately to events
- **Resource spikes** — large jobs consume significant resources

## Stream Processing

Process data **continuously** as it arrives, event by event or in micro-batches.

```
Events ──▶ Stream Processor ──▶ Real-time Results
  (continuous flow)              (milliseconds/seconds)
```

### Examples

- Real-time fraud detection: flag suspicious transactions instantly
- Live dashboards: update metrics as events happen
- Alerting: trigger alerts when anomalies are detected
- Real-time recommendations: update feed as user browses
- IoT sensor monitoring: process telemetry as it arrives

### Technologies

| Tool | Description |
|------|-------------|
| **Apache Kafka Streams** | Stream processing on Kafka |
| **Apache Flink** | Stateful stream processing |
| **Apache Storm** | Real-time computation |
| **AWS Kinesis** | Managed streaming service |
| **Google Dataflow** | Unified batch + stream |

### Pros

- **Low latency** — results in milliseconds to seconds
- **Real-time insights** — react immediately to events
- **Continuous** — no batch windows or scheduling

### Cons

- **Complex** — handling ordering, exactly-once, and failures is hard
- **State management** — maintaining state across events is challenging
- **Harder to debug** — continuous flow vs discrete batches
- **Higher cost** — always-on infrastructure

## Comparison

| Aspect | Batch | Stream |
|--------|-------|--------|
| Latency | Hours/days | Milliseconds/seconds |
| Throughput | Very high | High |
| Complexity | Lower | Higher |
| Cost | Lower (scheduled) | Higher (always-on) |
| Data correctness | Easier to guarantee | Harder (ordering, duplicates) |
| Use case | Reports, ETL, ML training | Alerts, dashboards, fraud |

## The Lambda Architecture

Combines both approaches:

```
                ┌──▶ Batch Layer (accurate, slow) ──────┐
Raw Events ─────┤                                       ├──▶ Query
                └──▶ Speed Layer (approximate, fast) ───┘
```

- **Batch layer** reprocesses all historical data for accurate results
- **Speed layer** processes recent events for real-time approximate results
- Queries merge both layers

**Drawback:** Maintaining two separate codebases for the same logic.

## The Kappa Architecture

Simplification: use **stream processing for everything**. Replay the event log when you need to reprocess.

```
Event Log (Kafka) ──▶ Stream Processor ──▶ Results
         └──▶ Replay from beginning for reprocessing
```

**Advantage:** One processing pipeline for both real-time and historical data.

## When to Use What

| Situation | Approach |
|-----------|----------|
| Daily reports | Batch |
| Real-time dashboard | Stream |
| ML model training | Batch |
| Fraud detection | Stream |
| Data warehouse ETL | Batch (or micro-batch) |
| Live notifications | Stream |
| Historical analysis | Batch |
| IoT sensor processing | Stream |
