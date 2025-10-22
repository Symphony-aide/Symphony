# Property-Based Backend Code Indexing

**Context:**

Symphony’s frontend intelligence benefits from layout-based component indexing. However, to empower backend-aware agents (e.g., Fixer, Analyzer, Planner), we need a backend indexing system that provides structured access to the core logic (classes, methods, functions). Backend codebases often include **thousands of elements**, and naively indexing everything will create massive, inefficient, and unhelpful index files.

---

### ❗ Problem Without Selective Indexing

If we attempt to index **every class and function** without prioritization:

- 📉 **Model Overload:**
    
    Models will receive irrelevant or low-priority code, causing context dilution and decreased output quality.
    
- 😌 **Performance Bottlenecks:**
    
    Index files could reach tens of thousands of entries (e.g., 1,000 classes × 20 methods = 20,000 items), leading to slow parsing, increased memory usage, and longer inference times.
    
- 🤖 **Agent Confusion:**
    
    Without guidance on which parts of the codebase are risky or relevant, backend agents may waste time analyzing stable or low-priority functions.
    
- 🧪 **Uninformed Reasoning:**
    
    Agents won't understand which functions lack tests, have failed recently, or exhibit high complexity — all of which are critical for debugging or refactoring tasks.
    

---

### ✅ Suggested Solution: Property-Based Backend Indexing

Introduce a **`backend-index.json`** file that selectively includes backend elements **based on heuristics and dynamic analysis**, giving priority to code segments with high potential for bugs, regressions, or architectural improvement.

---

### Indexed Elements May Include:

- Classes
- Methods
- Functions
- Constructors
- Decorated (e.g. API route handlers, task schedulers)

Each item is scored or flagged using **quality, complexity, and stability metrics**.

---

### Prioritization Metrics:

| Metric | Description | Purpose |
| --- | --- | --- |
| ✅ Is Tested | Whether automated tests exist | Measures confidence |
| ✅ Tests Passing | Recent test result status | Detects unstable logic |
| 🧠 Cognitive Complexity | Algorithmic complexity score (e.g., nested logic) | Estimates potential bugs |
| 📏 Lines of Code | Measures method/function length | Flag overly large routines |
| 🔀 Responsibility Bloat | Assesses single-responsibility violations | Encourages better modularization |
| ❗ Error History | Log-based or exception tagging | Flags frequent problem areas |

---

### Example Snippet – `backend-index.json`

```json
{
  "OrderService.checkout": {
    "tested": false,
    "linesOfCode": 61,
    "complexity": 7.5,
    "recentErrors": true,
    "riskLevel": "high"
  },
  "Notification.sendEmail": {
    "tested": true,
    "linesOfCode": 14,
    "complexity": 2.1,
    "recentErrors": false,
    "riskLevel": "low"
  }
}
```

---

### Updating the Index

- 🧠 Use **AST parsing** + **test coverage tools** + **static analyzers** to collect metrics
- 📂 Update on **file save** or **post-test-run hooks**
- ⚙️ Define thresholds for when a method is added or removed from the index

---

### Outcome Goal

Make backend agents smarter by providing them with a **relevant, prioritized map of the backend codebase** — helping them focus where bugs are most likely, refactors are most impactful, and design debt is heaviest. This balances **performance, intelligence, and agent efficiency**.

---

Would you like a draft structure for a `backend_indexer/` module, including file watchers, analysis rules, and an output schema for `backend-index.json`?