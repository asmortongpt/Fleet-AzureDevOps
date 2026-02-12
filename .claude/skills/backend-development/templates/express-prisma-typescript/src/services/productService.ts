import { Prisma } from '@prisma/client';
import { prisma } from '../app';
import { AppError } from '../middleware/errorHandler';

interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  tireType?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'rating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const getProducts = async (filters: ProductFilters) => {
  const {
    page = 1,
    limit = 20,
    search,
    brand,
    tireType,
    size,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(brand && { brand }),
    ...(tireType && { tireType }),
    ...(size && { size }),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice && { gte: minPrice }),
            ...(maxPrice && { lte: maxPrice }),
          },
        }
      : {}),
  };

  // Execute query with pagination
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      inventory: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return product;
};

export const createProduct = async (data: Prisma.ProductCreateInput) => {
  return prisma.product.create({
    data,
  });
};

export const updateProduct = async (id: string, data: Prisma.ProductUpdateInput) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return prisma.product.update({
    where: { id },
    data,
  });
};

export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  // Soft delete
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
};
