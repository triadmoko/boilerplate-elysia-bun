FROM oven/bun:1.4 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4 AS runtime
WORKDIR /app
ENV APP_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
USER bun
EXPOSE 3000
CMD ["sh", "-c", "bun run db:migrate && bun run start"]
