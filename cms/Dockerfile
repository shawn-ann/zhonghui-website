FROM node:22-bookworm-slim

WORKDIR /app

# 安装全部依赖（构建期需要 devDependencies；运行时构建器需要 tsx）
COPY package*.json ./
RUN npm ci

COPY . .

# 构建期占位环境变量；真正的数据库在容器运行时注入。
ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_SECRET=build-only-secret
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
