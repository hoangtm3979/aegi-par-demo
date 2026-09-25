# AEGI PAR — Production Acceptance — UI 1.1

Status: **PRODUCTION_ACCEPTED**  
Accepted: 2026-09-25 00:06:44 UTC  
Public URL: https://aegi-par-demo-rc4-production.up.railway.app

## Authority

- Engine: `PAR_CORE v0.4.2-rc4`
- Frozen backend ZIP SHA-256: `28ef2504f91ffac2dce6a1e613e56802fe61d011b3b840b0963e8bb675b5d0c0`
- Railway service: `aegi-par-demo-rc4`
- Deployment ID: `dc3f8d1e-ded6-482e-a478-251b8bc96d8b`
- Deployed application commit: `6136c4b19db235c47d4a7cbe588f1e4b714e0364`
- External smoke workflow run: `36075997191`
- External smoke job: `107887201659`

## External production smoke

GitHub-hosted runner called the public Railway domain from outside Railway.

| Check | Result |
|---|---|
| `GET /api/v1/readyz` | 200 PASS |
| `GET /api/v1/health` | 200 PASS |
| `GET /` | 200 PASS |
| UI marker `Demo rc4 / UI 1.1` | PASS |
| Hero `Kiểm tra trước khi chuyển tiền` | PASS |
| `GET /static/app.js` | 200 PASS |
| `GET /static/styles.css` | 200 PASS |
| `GET /api/v1/demo/profiles` | 200 PASS |
| Flow 1 | `PREVENT_VERIFY` PASS |
| Flow 2 | `VERIFY_LIGHT` PASS |
| Flow 3 | `RECOVER` PASS |
| Evidence endpoint for created cases | 3/3 PASS |
| Cleanup: DELETE then GET=404 | 3/3 PASS |

Profile IDs observed in production:

- `hero1_unknown_identifier`
- `hero2_legitimate_unfamiliar`
- `hero3_reviewed_memory`

## Claim boundary

This acceptance establishes deployment/runtime/UI behavior for the submission demo. It is not a new effectiveness benchmark, independent validation, or evidence that PAR reduces real-world fraud loss.

The external smoke run created only temporary demo cases for acceptance and deleted all three successfully after verification.
