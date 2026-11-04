# Experiment 9: Secure DevOps (DevSecOps) Implementation in a Healthcare System

## Aim
To build a CI/CD pipeline for a healthcare application in which security checks run automatically at every stage ("shift-left security"), so vulnerable code, leaked secrets, vulnerable images or insecure configuration can never reach production, protecting patient data in line with HIPAA and India's DPDP Act 2023.

## The application: Patient Portal API (demo)
A small API serving **fake** patient records, with security built in:

| Control | Implementation |
|---|---|
| Authentication | `x-api-token` header checked with a constant-time comparison; token comes from a Kubernetes Secret |
| Authorization (RBAC) | `doctor` sees diagnosis and blood group; `receptionist` sees only demographics; other roles get 403 |
| Data masking | Aadhaar and phone shown as `********1234` |
| Security headers | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, no-store caching |
| Audit logging | Every access attempt to patient data is logged as JSON (role, action, outcome) |

## DevSecOps pipeline
```
 Code ─▶ ① Secret scan ─▶ ② Tests ─▶ ③ SCA ─▶ ④ SAST ─▶ ⑤ Quality gate ─▶ ⑥ Build
     ─▶ ⑦ Image scan ─▶ ⑧ IaC scan ─▶ ⑨ Secure deploy ─▶ ⑩ Runtime checks ─▶ ⑪ DAST
          ✋ any HIGH/CRITICAL finding = pipeline stops, release blocked
```

| Stage | What it catches | Tool |
|---|---|---|
| 1 Secret scan | Passwords, API keys, tokens committed to Git | Gitleaks |
| 2 Unit & security tests | Broken auth, missing masking, missing headers | Node test runner |
| 3 SCA | Known CVEs in dependencies | Trivy fs |
| 4 SAST | Insecure code patterns, bugs, code smells | SonarQube |
| 5 Quality gate | Blocks if SonarQube rating fails | SonarQube |
| 6 Build | Hardened image: Alpine, npm removed, non-root | Docker |
| 7 Image scan | OS and library CVEs inside the image | Trivy image |
| 8 IaC scan | Insecure Dockerfile or Kubernetes YAML (root, privileged, etc.) | Trivy config |
| 9 Secure deploy | Secret injected from Jenkins, hardened pods, network policies | kubectl |
| 10 Runtime checks | Unauthenticated access blocked (401), headers present | curl |
| 11 DAST | Vulnerabilities in the running app | OWASP ZAP baseline |

## Kubernetes hardening (`k8s/`)
- Namespace enforces the **restricted** Pod Security Standard
- `runAsNonRoot`, `readOnlyRootFilesystem`, `allowPrivilegeEscalation: false`, all Linux capabilities dropped, seccomp `RuntimeDefault`
- Dedicated ServiceAccount with no API token mounted
- CPU and memory limits (protection against resource exhaustion)
- **NetworkPolicy**: deny all by default, allow only port 3000 into the app (enforced on CNIs such as Calico)
- API token stored as a **Secret** created by Jenkins, never committed to Git

## Extra setup for this experiment
SonarQube is already running from `jenkins-setup/docker-compose.yml`.

1. Open **http://localhost:9000** and log in with `admin` / `admin` (you'll be asked to change it).
2. *My Account → Security → Generate Token* (type: Global analysis token). Copy it.
3. In Jenkins, add credential **Secret text** with ID `sonar-token` and the token.
4. *Manage Jenkins → System → SonarQube servers → Add*: Name **`sonarqube`**, URL **`http://sonarqube:9000`**, token `sonar-token`.
5. *Manage Jenkins → Tools → SonarQube Scanner installations → Add*: Name **`SonarScanner`**, tick *Install automatically*.
6. In SonarQube: *Administration → Configuration → Webhooks → Create*: URL **`http://jenkins:8080/sonarqube-webhook/`** (needed for the Quality Gate stage).
7. Add the Jenkins credential **Secret text** with ID `patient-portal-api-token` (any long random string).

> In a hurry? Run the job with `RUN_SONARQUBE` unticked; every other security stage still runs.

## Procedure
1. Create the job with Script Path `exp9-devsecops-healthcare/Jenkinsfile` and run it.
2. Watch every security gate pass. Open the build's **Artifacts** for the Gitleaks, Trivy and header reports.
3. Test the deployed API:
   ```bash
   curl -i http://localhost:30009/api/patients                                   # 401 Unauthorized
   curl -H "x-api-token: <your token>" -H "x-user-role: receptionist" http://localhost:30009/api/patients   # no diagnosis
   curl -H "x-api-token: <your token>" -H "x-user-role: doctor"       http://localhost:30009/api/patients   # full record, IDs masked
   kubectl logs -n healthcare deploy/patient-portal | grep AUDIT                   # audit trail
   ```
4. **Prove the gates work** (good for the viva, do it on a separate branch):
   - Add a fake GitHub token to `server.js`, e.g. `const GITHUB_TOKEN = 'ghp_'` followed by 36 random letters and digits. Push, and the build fails at **Secret Scan**. (Gitleaks checks Git history too, so do this on a throwaway branch.)
   - Remove `USER 1000` from the Dockerfile, and the build fails at the **IaC scan**.
   - Change `FROM node:22-alpine` to an old image such as `node:14`, and the build fails at the **Image Scan**.
   - Delete the masking in `server.js`, and the build fails at **Unit & Security Tests**.
   Then revert the change.

## Screenshots for the record
- [ ] Stage View with all 11 stages green
- [ ] SonarQube project dashboard with *Quality Gate: Passed*
- [ ] Trivy image scan output
- [ ] A **failed** build blocked by a security gate (from step 4)
- [ ] curl outputs: 401, receptionist vs doctor
- [ ] `kubectl get pods,networkpolicy -n healthcare` and the AUDIT log lines
- [ ] OWASP ZAP baseline summary in the console

## Result
A DevSecOps pipeline was implemented for a healthcare application. Security was automated across the whole lifecycle (secret scanning, SCA, SAST, image and configuration scanning, hardened deployment and DAST), so insecure changes are blocked before they reach production and patient data stays protected.
