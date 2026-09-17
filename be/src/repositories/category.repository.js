import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lấy danh sách danh mục kèm số lượng sản phẩm liên quan
 */
export const findCategories = async ({ search, status }) => {
  const where = {};

  if (search) {
    where.OR = [
      { category_name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const categories = await prisma.category.findMany({
    where,
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return categories;
};

export const findCategoryById = async (id) => {
  const category = await prisma.category.findUnique({
    where: { category_id: BigInt(id) },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return category;
};

export const findCategoryByName = async (category_name) => {
  const category = await prisma.category.findUnique({
    where: { category_name },
  });
  return category;
};

export const createCategory = async (data) => {
  const newCategory = await prisma.category.create({
    data: {
      category_name: data.category_name,
      description: data.description || null,
      status: data.status || 'ACTIVE',
    },
  });
  return newCategory;
};

export const updateCategory = async (id, data) => {
  const updated = await prisma.category.update({
    where: { category_id: BigInt(id) },
    data: {
      ...(data.category_name && { category_name: data.category_name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status && { status: data.status }),
    },
  });
  return updated;
};

export const deleteCategory = async (id) => {
  const deleted = await prisma.category.delete({
    where: { category_id: BigInt(id) },
  });
  return deleted;
};
