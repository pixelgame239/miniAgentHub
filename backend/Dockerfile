# 1. Chọn base image nhẹ từ Docker Hub
FROM node:24-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file quản lý thư viện vào trước để tận dụng cache của Docker
COPY package*.json ./

# 4. Cài đặt các thư viện
RUN npm install

# 5. Copy toàn bộ mã nguồn còn lại vào container
COPY . .

# 6. Mở cổng mạng mà backend chạy bên trong container (như trong compose là 3000)
EXPOSE 3000

# 7. Lệnh để khởi chạy backend
CMD ["npm", "run", "dev"]