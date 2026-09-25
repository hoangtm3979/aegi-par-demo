# AEGI PAR — Authority Freeze — 2026-09-25

Status: **FROZEN BEFORE UI 1.2 FRONTEND-ONLY CHANGE**

## Engine authority

- Engine: `PAR_CORE v0.4.2-rc4`
- Backend bundle: `AEGI_PAR_P3_APP_BUNDLE.zip`
- SHA-256: `28ef2504f91ffac2dce6a1e613e56802fe61d011b3b840b0963e8bb675b5d0c0`
- Decision behavior, backend API contract and dataset are frozen for the UI 1.2 submission pass.
- UI 1.2 must not change policy, scoring, evidence semantics in backend, or benchmark packets.

## Benchmark authority

- Package: `AEGI_PAR_PilotReadiness_FINAL_v1.0_20260924.zip`
- Package SHA-256: `92f45ad930034d93bf30a5f5d165ebde9f678aa6b6401cc7079f4aa7d6c79960`
- Evaluation: internal source-grounded controlled offline evaluation.
- Corpus: 40 source-grounded families = 12 harmful + 10 natural uncertainty + 10 benign + 8 recovery.
- Normalized decision configurations: 22.
- Preferred action: PAR rc4 40/40; B2 v0.2 40/40.
- Action-class disagreement: 0/40.
- Unsafe continuation: 0/22 eligible.
- Benign unnecessary interruption: 0/10.
- Execution success: 40/40.
- PAR trace materialization: 40/40, post-hoc descriptive only.
- Gold is rubric-derived and not independently expert validated.
- Benchmark is development-exposed and not sealed.
- No claim of incremental action-level superiority or real-world effectiveness.

## Public runtime before UI 1.2

- UI: 1.1 production-accepted.
- Public URL: `https://aegi-par-demo-rc4-production.up.railway.app`
- Railway service: `aegi-par-demo-rc4`
- Accepted deployment ID: `dc3f8d1e-ded6-482e-a478-251b8bc96d8b`
- Accepted application commit: `6136c4b19db235c47d4a7cbe588f1e4b714e0364`
- External smoke: readiness/health/UI/assets PASS; 3/3 decision flows PASS; evidence 3/3 PASS; temporary case cleanup 3/3 PASS.

## Change boundary for UI 1.2

Allowed: HTML/CSS/JavaScript presentation, state handling, accessibility, frontend timeout/cancellation, evidence presentation, exposure input mapping to existing API contract, and explanatory architecture/evidence content.

Not allowed in this pass: backend/policy/dataset changes, new provider integrations, new decision classes, autonomous learning, or claims not supported by frozen evidence.

Any behavior-affecting backend change invalidates this freeze and requires a new engine identity plus appropriate evaluation.
