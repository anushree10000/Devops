# Experiment 8: Automated Blue-Green Deployment using Jenkins, Kubernetes and Docker

## Aim
To release new application versions with zero downtime and instant rollback by running two identical environments (Blue and Green) and switching user traffic between them through a Jenkins pipeline.

## Concept
| | Blue | Green |
|---|---|---|
| Role | Current live version | New version being released |
| Deployment | `demo-app-blue` | `demo-app-green` |

Two Kubernetes Services sit in front:
- **`demo-app-live`** (port **30008**): what users see.
- **`demo-app-preview`** (port **30018**): the idle colour, for testing before go-live.

Switching is a single, atomic change to the live Service's `selector.version`. Each release goes to whichever colour is idle, so they alternate: blue → green → blue …

```
                         ┌─────────────────────────┐
 Users ──▶ :30008 live ──┤ selector: version=blue  │──▶  demo-app-blue  (v1)  ✅ live
                         └─────────────────────────┘
 Tester ─▶ :30018 preview ─────────────────────────────▶ demo-app-green (v2)  🧪 new

         Jenkins: kubectl patch service demo-app-live  →  version=green

 Users ──▶ :30008 live ────────────────────────────────▶ demo-app-green (v2)  ✅ live
                                                         demo-app-blue  (v1)  standby for rollback
```

## Files
| File | Purpose |
|---|---|
| `k8s/namespace.yaml` | Namespace `exp8` |
| `k8s/deployment-template.yaml` | One template; Jenkins fills in colour, image and version |
| `k8s/services.yaml` | Live and preview Services (created on the first run only) |
| `Jenkinsfile` | The blue-green pipeline |

## Pipeline stages
1. **Detect Live Environment**: reads which colour the live Service points to; the new version goes to the other one.
2. **Unit Test** and **Build Image**.
3. **Deploy to Idle Environment**: creates or updates `demo-app-<idle>` and points the preview Service at it.
4. **Smoke Test**: calls `/health` inside the new pods; a failure stops the pipeline and users never notice.
5. **Approve Switch**: manual approval in Jenkins (skip with `AUTO_SWITCH`).
6. **Switch Live Traffic**: patches the live Service selector to the new colour. The old version moves to the preview port.
7. **Verify**: shows the Service, endpoints and pods with their colour label.
8. **Post (failure)**: if anything fails after the switch, traffic is sent back automatically.

`ACTION = rollback` skips the build and simply switches traffic back to the other colour.

## Procedure
1. Complete the one-time setup in the main README. Create the job with Script Path `exp8-blue-green/Jenkinsfile`.
2. **Run 1** (*ACTION = deploy*): v1 goes to **BLUE**, which becomes live. Open http://localhost:30008 to see a blue page.
3. Make a visible change (e.g. edit the `<p>` text in `app/server.js`), commit and push.
4. **Run 2** (*ACTION = deploy*): v2 goes to **GREEN**. Before approving, open:
   - http://localhost:30008 → still BLUE v1 (users unaffected)
   - http://localhost:30018 → GREEN v2 (preview)
5. Click **Switch traffic** in Jenkins. Refresh http://localhost:30008: it is now GREEN v2, with no downtime.
6. **Run 3** (*ACTION = rollback*): live traffic goes straight back to BLUE v1.

Watch the switch live from a terminal while you approve:
```bash
# Linux / Git Bash
while true; do curl -s localhost:30008/health; echo; sleep 1; done
# PowerShell
while ($true) { (Invoke-WebRequest -UseBasicParsing localhost:30008/health).Content; Start-Sleep 1 }
```
Every line succeeds; the colour simply changes from `blue` to `green`.

## Verify from a terminal
```bash
kubectl get pods -n exp8 -L version
kubectl get service demo-app-live -n exp8 -o jsonpath='{.spec.selector}'
```

## Screenshots for the record
- [ ] Stage View of Run 2 waiting at *Approve Switch*
- [ ] Browser: live = BLUE and preview = GREEN side by side
- [ ] Browser: live = GREEN after the switch
- [ ] `kubectl get pods -n exp8 -L version` showing both colours
- [ ] The curl loop output during the switch (no errors)
- [ ] Rollback run output

## Result
An automated blue-green deployment was implemented. New versions are deployed and tested in the idle environment, traffic is switched atomically with zero downtime, and rollback takes one click.

**Advantages:** zero downtime, instant rollback, testing in a production-identical environment.
**Limitation:** needs double the resources during a release.
