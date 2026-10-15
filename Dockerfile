FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN node build.cjs

FROM node:24-alpine
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server.cjs ./server.cjs
USER node
EXPOSE 3000
CMD ["node", "server.cjs"]
