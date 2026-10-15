FROM node:24-alpine AS build
WORKDIR /app
COPY . .
RUN node build.cjs

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.cjs ./server.cjs
COPY --from=build /app/package.json ./package.json
EXPOSE 3000 8080
CMD ["node", "server.cjs"]
