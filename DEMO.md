# Live demo: change code on GitHub → Jenkins redeploys automatically

Uses **Experiment 7** (`exp7-cicd-kubernetes`). Takes about 2 minutes once Jenkins is set up.

## Before the demo (do once)

1. **Rebuild Jenkins** so it gets the new dashboard plugin (your jobs and settings are kept):
   ```bash
   cd jenkins-setup
   docker compose up -d --build
   ```
2. **Make sure the job exists:** a Pipeline job named e.g. `exp7-cicd`, *Pipeline script from SCM*,
   Git URL `https://github.com/anushree10000/Devops`, branch `*/main`,
   Script Path `exp7-cicd-kubernetes/Jenkinsfile` (see the main README, step 4).
3. **Run it once by hand** (*Build with Parameters → Build*). This first run registers the
   "check GitHub every minute" trigger. After it, *Configure* should show **Poll SCM** ticked.
4. **Create the dashboard:** Jenkins home → **+ New View** → name `CI/CD Dashboard` →
   select **Build Monitor View** → Create → tick `exp7-cicd` (and the other jobs if you like) → OK.
   Optionally, also open the job page to see the **Stage View** (each stage as a green or red box).

## During the demo

| Step | What to do | What sir sees |
|---|---|---|
| 1 | Open http://localhost:30007 | The app with the message *Hello from the CI/CD pipeline!* |
| 2 | Open the **CI/CD Dashboard** view in Jenkins (full screen) | A big green tile for `exp7-cicd` |
| 3 | On GitHub, open `app/server.js`, click ✏️, change the `MESSAGE` line, e.g. `const MESSAGE = 'Version 2 - deployed live for the demo!';` → **Commit changes** | |
| 4 | Wait up to 1 minute | The tile starts flashing (building). On the job page, Stage View fills in: Checkout → Unit Test → Docker Build → Deploy → Verify Rollout. The build description shows your commit message. |
| 5 | Refresh http://localhost:30007 | The new message and a new version (`v<build number>`) |

No manual `docker` or `kubectl` commands were run: the push to GitHub alone tested, built and deployed the change.

## Bonus: show a failed build and automatic rollback
Break a test on GitHub (e.g. change `/DevOps Demo App/` in `app/test.js` to `/Wrong Title/`) and commit.
The *Unit Test* stage goes red, the dashboard tile turns red, and the live site is untouched.
Revert the change and it goes green again.

## If it doesn't trigger
- Wait the full minute; Jenkins checks GitHub once a minute.
- Job → **Git Polling Log** shows the last check.
- Not triggering at all? Run the job once by hand (step 3 above), then try again.
- In a hurry, just click **Build Now** after committing; it does the same thing.
