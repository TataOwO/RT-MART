# Node 官方映像檔
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install
RUN npm install -g @nestjs/cli

# 複製所有原始碼
COPY . .

# 編譯 TypeScript
RUN npm run build

# 開放 port
EXPOSE 3000

# 啟動應用程式
CMD ["node", "dist/main"]
