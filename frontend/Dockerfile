FROM oven/bun:1.4.4-alpine

WORKDIR /app
RUN chown bun:bun /app
USER bun

COPY --chown=bun:bun package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY --chown=bun:bun . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun --bun run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "--bun", "run", "preview", "--host", "0.0.0.0", "--port", "3000", "--strictPort"]
