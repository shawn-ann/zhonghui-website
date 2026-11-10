FROM node:22-bookworm-slim

WORKDIR /app

# 安装全部依赖（构建期需要 devDependencies；运行时构建器需要 tsx）
COPY package*.json ./
RUN npm ci

COPY . .

# 预编译静态生成器，运行时用 node 直接执行，避免 tsx 冷启动开销。
RUN npm run build:generator

# 构建期占位环境变量；真正的数据库在容器运行时注入。
ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build-only-secret
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ARG NEXT_PUBLIC_SITE_URL=https://new.chinaaupairs.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
