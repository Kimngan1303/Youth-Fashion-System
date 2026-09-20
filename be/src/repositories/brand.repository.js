import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy danh sách thương hiệu kèm số lượng sản phẩm liên quan
 */
export const findBrands = async ({ search, status }) => {
  const where = {};

  if (search) {
    where.OR = [
      { brand_name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const brands = await prisma.brand.findMany({
    where,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return brands;
};

export const findBrandById = async (id) => {
  const brand = await prisma.brand.findUnique({
    where: { brand_id: BigInt(id) },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return brand;
};

export const findBrandByName = async (brand_name) => {
  const brand = await prisma.brand.findUnique({
    where: { brand_name },
  });
  return brand;
};

export const createBrand = async (data) => {
  const newBrand = await prisma.brand.create({
    data: {
      brand_name: data.brand_name,
      description: data.description || null,
      status: data.status || 'ACTIVE',
    },
  });
  return newBrand;
};

export const updateBrand = async (id, data) => {
  const updated = await prisma.brand.update({
    where: { brand_id: BigInt(id) },
    data: {
      ...(data.brand_name && { brand_name: data.brand_name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
    },
  });
  return updated;
};

export const deleteBrand = async (id) => {
  const deleted = await prisma.brand.delete({
    where: { brand_id: BigInt(id) },
  });
  return deleted;
};
