# Custom Jenkins image with every tool the 3 experiments need:
# Docker CLI, kubectl, Node.js, Trivy and Gitleaks.
FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates gnupg git nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI (talks to your laptop's Docker through the mounted socket)
RUN ARCH=$(uname -m) \
    && curl -fsSL "https://download.docker.com/linux/static/stable/${ARCH}/docker-27.3.1.tgz" \
       | tar -xz -C /usr/local/bin --strip-components=1 docker/docker

# kubectl
RUN ARCH=$(dpkg --print-architecture) \
    && curl -fsSLo /usr/local/bin/kubectl \
       "https://dl.k8s.io/release/$(curl -fsSL https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl" \
    && chmod +x /usr/local/bin/kubectl

# Trivy (image, filesystem and Kubernetes-YAML scanner) - used in Exp 9
RUN curl -fsSL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
       | sh -s -- -b /usr/local/bin

# Gitleaks (secret scanner) - used in Exp 9
RUN ARCH=$(dpkg --print-architecture | sed 's/amd64/x64/') \
    && curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_${ARCH}.tar.gz" \
       | tar -xz -C /usr/local/bin gitleaks

# Jenkins plugins
RUN jenkins-plugin-cli --plugins \
    workflow-aggregator git docker-workflow credentials-binding \
    pipeline-stage-view sonar ws-cleanup timestamper

# Run as root so Jenkins can use the mounted Docker socket (fine for a lab, not for production)
USER root
