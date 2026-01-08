# FedRAMP Control Mapping Notes (Select Controls)

## AC - Access Control

| Control | Implementation Detail | Status |
| :--- | :--- | :--- |
| AC-2 | **Account Management**: System Admins use the Admin Portal to invite users. Roles assigned on invite. Deactivation is immediate. | Implemented |
| AC-7 | **Unsuccessful Logon Attempts**: Rate limiter on `/api/auth/login`. Block IP after 5 failures in 1 min. Lock account after 3 failed password attempts. | Pending Verification |
| AC-11 | **Device Lock**: Frontend detects checking `idle` state and dims screen/locks session. | To Do |
| AC-12 | **Session Termination**: JWT expiration set to 15 mins. Refresh token rotation enabled with 12 hour absolute timeout. | Implemented |

## AU - Audit and Accountability

| Control | Implementation Detail | Status |
| :--- | :--- | :--- |
| AU-2 | **Audit Events**: `AuditLog` table records Actor, Action, Target, Timestamp. | Implemented |
| AU-3 | **Content of Records**: Includes original values for updates (JSON diff). | Implemented |
| AU-12 | **Audit Generation**: Middleware intercepts all non-GET requests and attempts to log. | Implemented |

## SC - System and Communications

| Control | Implementation Detail | Status |
| :--- | :--- | :--- |
| SC-8 | **Transmission Confidentiality**: TLS 1.2+ forced on load balancer. HSTS enabled. | Implemented |
| SC-13 | **Cryptographic Protection**: FIPS 140-2 validated modules (where applicable via OS/Node crypto). | N/A (Platform dependent) |
| SC-28 | **Data at Rest**: Database encryption enabled. | Implemented |

## SI - System and Information Integrity

| Control | Implementation Detail | Status |
| :--- | :--- | :--- |
| SI-2 | **Flaw Remediation**: Dependencies scanned via `npm audit` / Snyk. | Continuous |
| SI-10 | **Input Validation**: Zod schemas on all API inputs. | Implemented |
