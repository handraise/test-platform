---
name: flake-triage
description: Pull flaky test history from Datadog Test Optimization and rank what to fix first. Use when smoke or nightly tests fail intermittently or retry analytics show instability.
---

# Flake triage

## When to use

- Intermittent red CI on unchanged code
- High retry rates in Datadog Test Optimization
- Nightly shard failures that do not reproduce locally

## Steps

1. Query Datadog Test Optimization for `service:naapp-e2e` and `env:stage2`.
2. Sort tests by flake rate / retry count over the last 7-14 days.
3. For each candidate, pull Playwright trace from the failing run.
4. Classify: selector brittleness, stage2 data drift, flag drift, timing, or true product bug.
5. Propose fixes ranked by impact, with smoke failures first.

## Mitigations by class

| Class | Fix |
| --- | --- |
| Selector | Add `data-testid` or `.or()` fallback |
| Data drift | Pin tenant snapshot or stub GraphQL |
| Flag drift | Pin GrowthBook flags in fixture |
| Timing | Prefer locator assertions over fixed waits |
| Product bug | File issue; do not mute the test |
