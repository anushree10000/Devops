FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
EXPOSE 3000
USER node
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["npm", "start"]
