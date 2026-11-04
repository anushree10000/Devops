# Experiment 7: CI/CD Pipeline to Deploy a Dockerized Application on Kubernetes using Jenkins

## Aim
To automate building, testing, containerizing and deploying a web application to a Kubernetes cluster using a Jenkins pipeline.

## Tools
Git & GitHub · Jenkins · Docker · Docker Hub · Kubernetes (Docker Desktop) · kubectl · Node.js

## Architecture
```
 Developer ──push──▶ GitHub ──▶ Jenkins Pipeline
                                  │
          ┌───────────────────────┼─────────────────────────────────┐
          ▼            ▼          ▼              ▼                  ▼
      Checkout    Unit Test   Docker Build   Push to Docker Hub   kubectl apply
                                                                    │
                                                                    ▼
                                          Kubernetes Deployment (3 pods, rolling update)
                                                                    │
                                          NodePort Service :30007 ◀─┘ ◀── Users
```

## Files
| File | Purpose |
|---|---|
| `../app/Dockerfile` | Builds the app image (Node 20 Alpine, non-root user, health check) |
| `k8s/deployment.yaml` | Namespace `exp7` + Deployment with 3 replicas, rolling update, probes, resource limits |
| `k8s/service.yaml` | NodePort Service exposing the app on port 30007 |
| `Jenkinsfile` | The CI/CD pipeline |

## Pipeline stages
1. **Checkout**: pulls the latest code from GitHub.
2. **Unit Test**: `npm test` runs automated tests; a failing test stops the pipeline.
3. **Docker Build**: builds `<user>/devops-demo-app:v<build-number>`.
4. **Push to Docker Hub**: logs in with the `dockerhub` credential and pushes the image.
5. **Deploy to Kubernetes**: injects the new image tag into the manifest and runs `kubectl apply`.
6. **Verify Rollout**: waits for `kubectl rollout status` and lists pods and services.
7. **Post (failure)**: automatically runs `kubectl rollout undo` to restore the previous version.

## Procedure
1. Complete the one-time setup in the main README.
2. Create the pipeline job with Script Path `exp7-cicd-kubernetes/Jenkinsfile`.
3. **Build with Parameters**: enter your Docker Hub username. Untick *PUSH_TO_DOCKERHUB* if you don't want to push.
4. When all stages are green, open **http://localhost:30007**.
5. Demonstrate continuous delivery: change the `<h1>` text in `app/server.js`, commit, push, rebuild. The page shows the new version with no manual deployment.

## Verify from a terminal
```bash
kubectl get all -n exp7
kubectl rollout history deployment/demo-app -n exp7
kubectl rollout undo deployment/demo-app -n exp7      # manual rollback
```

## Screenshots for the record
- [ ] Jenkins Stage View with all stages green
- [ ] Console output of the *Verify Rollout* stage
- [ ] Docker Hub repository showing the pushed tags
- [ ] `kubectl get all -n exp7`
- [ ] Browser at http://localhost:30007 (before and after a code change)

## Result
A complete CI/CD pipeline was implemented. Every commit is automatically tested, packaged as a Docker image, pushed to Docker Hub and deployed to Kubernetes with a zero-downtime rolling update and automatic rollback on failure.
