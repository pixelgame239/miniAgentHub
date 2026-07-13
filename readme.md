# README

## 1. Cấu trúc thư mục

```text
├── backend/    # Server, API, Prisma, Database
└── frontend/   # Giao diện người dùng
```

---
### Khởi tạo Redis
```bash
docker compose up -d redis-cache
```
## 2. Chuẩn bị trước khi chạy

Yêu cầu:

* Đã cài đặt node
* PostgreSQL đang hoạt động
* Đã khởi tạo và chạy Redis

### Cấu hình Backend

Di chuyển vào thư mục backend:

```bash
cd backend
```

### Khởi tạo Database

Trong thư mục `backend`, chạy:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---
## 3. Chạy dự án

Mở 2 terminal riêng biệt.

### Terminal 1 - Chạy Backend

```bash
cd backend
npm install
npm run dev
```

### Terminal 2- Chạy Prisma Studio (tùy chọn) (Mở để xem chi tiết ở trong database thông qua prisma studio)
```bash
npx prisma studio
```
### Terminal 3 - Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

## 4. Các lệnh Backend thường dùng

| Lệnh                     | Mục đích                            |
| ------------------------ | ----------------------------------- |
| `npm run dev`            | Chạy API Server    |
| `npx prisma studio`      | Mở giao diện quản lý database       |
| `npx prisma migrate dev` | Đồng bộ database sau khi sửa schema |
| `npx prisma generate`    | Cập nhật Prisma Client              |

---