#!/bin/sh
# Builds the container's kubeconfig from the host's one (mounted read-only at
# /root/.kube/host-config) every time Jenkins starts, then starts Jenkins.
#
# Docker Desktop (Kubeadm cluster) writes  server: https://127.0.0.1:6443  into
# ~/.kube/config. Inside this container 127.0.0.1 is the container itself, so
# that address is rewritten to kubernetes.docker.internal (same port), which
# docker-compose.yml maps to the host and which is on the API server's
# TLS certificate. Any other server address is left unchanged.
set -e
HOST_CFG=/root/.kube/host-config
CFG=/root/.kube/config

if [ -f "$HOST_CFG" ]; then
    cp "$HOST_CFG" "$CFG"
    kubectl --kubeconfig "$CFG" config view \
        -o jsonpath='{range .clusters[*]}{.name}{" "}{.cluster.server}{"\n"}{end}' |
    while read -r name server; do
        case "$server" in
            https://127.0.0.1:*|https://localhost:*)
                port=${server##*:}
                kubectl --kubeconfig "$CFG" config set-cluster "$name" \
                    --server="https://kubernetes.docker.internal:${port}" >/dev/null
                echo "kubeconfig: cluster '$name' -> https://kubernetes.docker.internal:${port}"
                ;;
        esac
    done
else
    echo "WARNING: no host kubeconfig mounted at $HOST_CFG; kubectl will not work." >&2
    echo "         Enable Kubernetes in Docker Desktop, then: docker compose up -d --force-recreate jenkins" >&2
fi

exec /usr/bin/tini -- /usr/local/bin/jenkins.sh "$@"
