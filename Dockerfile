
FROM node:22-bookworm-slim AS base
RUN npm install -g pnpm turbo

FROM base AS pruner
WORKDIR /usr/src/app
ARG PKG_NAME
COPY . .
RUN turbo prune "@apps/${PKG_NAME}" --docker

FROM base AS builder
WORKDIR /usr/src/app
ARG PKG_NAME
COPY tsconfig.json .
COPY --from=pruner /usr/src/app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /usr/src/app/out/full/ .
RUN pnpm run build --filter="@apps/${PKG_NAME}"

FROM base AS runner
RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*
ARG PKG_NAME
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/ .
RUN pnpm install --frozen-lockfile --prod
WORKDIR /usr/src/app/apps/${PKG_NAME}

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
