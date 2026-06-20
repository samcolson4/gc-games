FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "dist/index.js"]
