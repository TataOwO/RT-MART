# ---使用Vite dev server----
ARG REGISTRY_PREFIX=""
FROM ${REGISTRY_PREFIX}node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# 開發用啟動指令，開放 5173 port
EXPOSE 5173
CMD ["npm", "run", "dev"]