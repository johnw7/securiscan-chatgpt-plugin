FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
ENV PORT=3100
EXPOSE 3100
CMD ["node", "--disable-warning=ExperimentalWarning", "server.js"]
