# Hardened image for the healthcare app
#  - small Alpine base, pinned major version
#  - npm removed from the final image (smaller attack surface, fewer CVEs)
#  - runs as the unprivileged "node" user (UID 1000), never root
FROM node:22-alpine
RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
              /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
COPY --chown=node:node package.json server.js ./
ENV NODE_ENV=production
USER 1000
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
