# DevOps Lab: Jenkins + Docker + Kubernetes

Three hands-on experiments built around a small demo web app.

| # | Experiment | Folder | App URL |
|---|---|---|---|
| 7 | CI/CD pipeline to deploy a Dockerized app on Kubernetes using Jenkins | [`exp7-cicd-kubernetes`](exp7-cicd-kubernetes) | http://localhost:30007 |
| 8 | Automated Blue-Green deployment using Jenkins, Kubernetes, Docker | [`exp8-blue-green`](exp8-blue-green) | live: http://localhost:30008 · preview: http://localhost:30018 |
| 9 | Secure DevOps (DevSecOps) in a healthcare system | [`exp9-devsecops-healthcare`](exp9-devsecops-healthcare) | http://localhost:30009 |

```
devops-lab/
├── app/                          demo web app (Node.js, zero dependencies) + Dockerfile  [Exp 7, 8]
├── jenkins-setup/                Jenkins (+ SonarQube) in Docker with all tools pre-installed
├── exp7-cicd-kubernetes/         Jenkinsfile + Kubernetes manifests
├── exp8-blue-green/              Jenkinsfile + blue/green manifests
└── exp9-devsecops-healthcare/    patient-portal app, hardened manifests, security pipeline
```

---

## One-time setup (≈ 30 minutes)

### 1. Install Docker Desktop and turn on Kubernetes
1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (give it at least 4 GB RAM in *Settings → Resources*).
2. *Settings → Kubernetes → Enable Kubernetes → Apply & Restart*. Wait for the green "Kubernetes running" light.
3. Check in a terminal:
   ```bash
   kubectl get nodes          # should show docker-desktop   Ready
   ```

### 2. Start Jenkins (and SonarQube)
```bash
git clone https://github.com/<your-username>/<this-repo>.git
cd <this-repo>/jenkins-setup
docker compose up -d --build        # first build takes ~5-10 min
```
> **Windows:** run this from PowerShell or Git Bash. If the `~/.kube/config` mount fails, replace `~` with `C:/Users/<you>` in `docker-compose.yml`.

Get the first-login password:
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
Open **http://localhost:8080**, paste it, choose **Install suggested plugins**, create your admin user.

Check Jenkins can reach Docker and Kubernetes:
```bash
docker exec jenkins docker ps
docker exec jenkins kubectl get nodes
```

### 3. Add credentials in Jenkins
*Manage Jenkins → Credentials → System → Global credentials → Add Credentials*

| Kind | ID | Value | Used by |
|---|---|---|---|
| Username with password | `dockerhub` | your Docker Hub username + [access token](https://hub.docker.com/settings/security) | Exp 7 (and 8 if pushing) |
| Secret text | `patient-portal-api-token` | any long random string | Exp 9 |

### 4. Create a pipeline job per experiment
*New Item → name it (e.g. `exp7-cicd`) → **Pipeline** → OK*, then under **Pipeline**:
- Definition: **Pipeline script from SCM**
- SCM: **Git**, Repository URL: this repo's URL, Branch: `*/main`
- **Script Path**: `exp7-cicd-kubernetes/Jenkinsfile` (or `exp8-blue-green/Jenkinsfile`, `exp9-devsecops-healthcare/Jenkinsfile`)

Click **Save → Build with Parameters**. (The very first run of a parameterised job may just register the parameters; run it again.)

Optional auto-trigger on every push: tick **Poll SCM** with schedule `H/5 * * * *` (GitHub webhooks can't reach `localhost` without a tunnel such as ngrok).

Experiment-specific steps are in each folder's README.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `docker exec jenkins kubectl get nodes` fails | Make sure Kubernetes is running in Docker Desktop, then `docker compose restart jenkins`. Your kubeconfig must point to `https://kubernetes.docker.internal:6443` (Docker Desktop's default). |
| `permission denied ... docker.sock` | The compose file runs Jenkins as root to avoid this; rebuild with `docker compose up -d --build`. |
| Pods stuck in `ImagePullBackOff` | You're not on Docker Desktop Kubernetes (e.g. Minikube). Tick `PUSH_TO_DOCKERHUB` so the cluster can pull from Docker Hub. |
| Port 8080 or 9000 already in use | Change the left-hand port in `docker-compose.yml`, e.g. `"8081:8080"`. |
| SonarQube container keeps restarting | Give Docker Desktop more memory (4 GB+). |

---

## Clean up
```bash
kubectl delete namespace exp7 exp8 healthcare
cd jenkins-setup && docker compose down        # add -v to also delete Jenkins data
```
