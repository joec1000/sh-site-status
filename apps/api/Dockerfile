FROM node:22-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules apps/api/node_modules
COPY . .
RUN pnpm --filter @sh/shared build && pnpm --filter @sh/api build

FROM node:22-slim AS runtime
WORKDIR /app
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/package.json apps/api/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "apps/api/dist/index.js"]
