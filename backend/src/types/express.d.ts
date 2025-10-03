declare namespace Express {
  interface User {
    id: string; // user_id จาก DB (ตาม schema เป็น String)
    email?: string; // ใช้ ? ถ้าเป็น optional
    username?: string;
    role: import("../config/db.config").Role; // Import Role enum จาก Prisma
    profilePictureUrl?: string | null;
    googleId?: string;
    // เพิ่ม fields อื่นๆ ที่คุณต้องการให้เข้าถึงผ่าน req.user ได้
  }

  interface Request {
    user?: User;
  }
}
