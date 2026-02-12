import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as productService from '../services/productService';

export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const filters = req.query;
  const result = await productService.getProducts(filters);

  res.status(200).json(result);
};

export const getProductById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const product = await productService.getProductById(id);

  res.status(200).json({ product });
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await productService.createProduct(req.body);

  res.status(201).json({
    message: 'Product created successfully',
    product,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const product = await productService.updateProduct(id, req.body);

  res.status(200).json({
    message: 'Product updated successfully',
    product,
  });
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  await productService.deleteProduct(id);

  res.status(200).json({
    message: 'Product deleted successfully',
  });
};
