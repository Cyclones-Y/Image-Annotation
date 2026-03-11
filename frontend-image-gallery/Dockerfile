# 构建阶段
FROM node:18-slim AS builder
WORKDIR /app
COPY . .
RUN npm config set registry https://registry.npmmirror.com
RUN npm install
RUN npm run build

# 运行阶段
FROM nginx:latest
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

