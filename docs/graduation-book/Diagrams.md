# Required Diagrams

Proposed diagram set and where they appear in the book.

- System Overview — microkernel + Conductor dual-ensemble (System Architecture chapter)
- IPC Message Flow — sequence across UI ⇄ bridges ⇄ microkernel ⇄ extensions (Communication chapter)
- Orchestration DAG — The Melody execution (System Orchestration chapter)
- Extension Lifecycle — Installed → Loaded → Activated → Running (Kernel/Extension chapters)
- Pit Pool Manager — state machine: Unloaded → Loading → Warming → Ready → Active (The Pit chapter)
- Artifact Store — content-addressable + versioning + quality scoring (Pit/Artifacts)
- ERD — core entities (Existing: ERD doc; include in Appendix or Architecture)
- Minimal IDE Layout — major panes and primitives (Minimal IDE Design chapter)
- PPO Training Loop — data flow, reward shaping, update steps (PPO/RL chapter)
- FQT/FQG Pipeline — data, skills, promotion criteria (FQT/FQG chapter)

Production notes:
- Prefer Mermaid for quick iteration; export SVG/PNG for final PDF.
- Store sources in `docs/assets/diagrams/` and reference relatively.
