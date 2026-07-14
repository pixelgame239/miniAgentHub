FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Chạy frontend ở chế độ dev (hoặc preview) tùy theo script trong package.json
CMD ["npm", "run", "dev"]