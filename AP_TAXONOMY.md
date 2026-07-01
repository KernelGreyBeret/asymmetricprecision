# AP Taxonomy

**Version:** 0.1  
**Purpose:** Organizing model for content, Atlas nodes, metadata, and learning paths.

---

## Root Discipline

Applied Systems Thinking

---

## Domains

- Systems
- Complexity
- Leadership
- Organizations
- Architecture
- Trust
- Decision Making
- Incentives
- Constraints
- Feedback
- Failure
- Learning
- Visualization
- Operational Design
- Cybersecurity
- Zero Trust
- Governance
- Risk
- Authority
- Culture
- Adaptation

---

## Content Types

- Principle
- Essay
- Framework
- Book
- Field Note
- Laboratory
- Diagram
- Talk
- Question
- Observation
- Reflection
- Tool
- Visual Language Pattern

---

## Relationship Types

- Explains
- Extends
- Challenges
- Applies
- Demonstrates
- Depends On
- Contrasts With
- Precedes
- Follows
- Belongs To
- Reveals
- Supports
- Questions

---

## Atlas Node Model

Each Atlas node should eventually include:

- id
- title
- type
- summary
- domains
- principles
- related_nodes
- source_url
- difficulty
- status
- created
- updated

---

## Example Node

```yaml
id: essay-the-system-was-telling-the-truth
title: The System Was Telling the Truth
type: Essay
summary: An operational reflection on drift, failure, and ignored signals.
domains:
  - Systems
  - Failure
  - Organizations
  - Evidence
principles:
  - See the System
  - Evidence Over Assumption
  - Systems Tell the Truth
related_nodes:
  - principle-evidence-over-assumption
  - domain-failure
  - framework-outcome-thinking
source_url: /essays/the-system-was-telling-the-truth.html
difficulty: 2
status: published
```
