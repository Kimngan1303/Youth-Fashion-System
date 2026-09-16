import { prisma } from '../repositories/prisma.js';

const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Lỗi: DATABASE_URL chưa được khai báo trong file .env!');
      process.exit(1);
    }
    await prisma.$connect();
    console.log('✅ MySQL Connected via Prisma ORM (Database: youth_fashion)');
    return prisma;
  } catch (err) {
    console.error('Lỗi kết nối CSDL MySQL:', err.message);
    process.exit(1);
  }
};

export default connectDB;
