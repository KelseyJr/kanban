FROM oven/bun:1.4.4-alpine

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY drizzle ./drizzle
COPY src ./src

ENV NODE_ENV=production
USER bun
EXPOSE 3333

CMD ["sh", "-c", "bun --no-env-file src/providers/drizzle/migrate.ts && exec bun --no-env-file src/main/server.ts"]
