# --- Dev Stage ---
FROM node:20-alpine
WORKDIR /app

# ติดตั้ง package.json ก่อน (เพื่อ cache)
COPY package*.json ./
RUN npm install

# คัดลอกโค้ดทั้งหมด
COPY . .

# Prisma generate ให้มี client ใช้งาน
RUN npx prisma generate

# expose port backend
EXPOSE 3001

# ใช้ ts-node-dev สำหรับ hot reload
CMD ["npm", "run", "dev"]
