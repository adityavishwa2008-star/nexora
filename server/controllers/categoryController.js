import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { specialCollections } from '../../client/src/data/categories.js';

const slugify = (value) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const validId = (value) => /^[a-f\d]{24}$/i.test(value);

export const getCollections = (req, res) => {
  res.json(specialCollections);
};

const respondError = (error, res, next) => {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError || error.code === 11000) {
    res.status(400);
  }
  next(error);
};

const buildTree = (categories) => {
  const nodes = categories.map((category) => ({ ...category.toObject(), children: [] }));
  const byId = new Map(nodes.map((category) => [category._id.toString(), category]));
  const roots = [];

  for (const category of nodes) {
    const parent = category.parent ? byId.get(category.parent.toString()) : null;
    if (parent) parent.children.push(category);
    else roots.push(category);
  }

  return roots;
};

const validateBody = (body, partial = false) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object';
  if (!partial && (typeof body.name !== 'string' || !body.name.trim())) return 'Name is required';
  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) return 'Name must be a non-empty string';
  if (body.slug !== undefined && (typeof body.slug !== 'string' || !slugify(body.slug))) return 'Slug must contain letters or numbers';
  if (body.parent !== undefined && body.parent !== null && typeof body.parent !== 'string') return 'Parent must be a category id or null';
  if (body.icon !== undefined && typeof body.icon !== 'string') return 'Icon must be a string';
  if (body.image !== undefined && typeof body.image !== 'string') return 'Image must be a URL string';
  if (body.order !== undefined && (!Number.isInteger(body.order) || body.order < 0)) return 'Order must be a non-negative integer';
  if (body.sortOrder !== undefined && (!Number.isInteger(body.sortOrder) || body.sortOrder < 0)) return 'Sort order must be a non-negative integer';
  if (body.active !== undefined && typeof body.active !== 'boolean') return 'Active must be a boolean';
  return null;
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, order: 1, name: 1 });
    res.json(buildTree(categories));
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  const validationError = validateBody(req.body);
  if (validationError) {
    res.status(400);
    return next(new Error(validationError));
  }

  try {
    const parentId = req.body.parent || null;
    if (parentId && (!validId(parentId) || !(await Category.exists({ _id: parentId })))) {
      res.status(400);
      throw new Error('Parent category was not found');
    }
    const category = await Category.create({
      name: req.body.name,
      slug: slugify(req.body.slug || req.body.name),
      parent: parentId,
      icon: req.body.icon,
      image: req.body.image,
      order: req.body.order,
      sortOrder: req.body.sortOrder,
      active: req.body.active,
    });
    res.status(201).json(category);
  } catch (error) {
    respondError(error, res, next);
  }
};

export const updateCategory = async (req, res, next) => {
  if (!validId(req.params.id)) {
    res.status(400);
    return next(new Error('Invalid category id'));
  }
  const validationError = validateBody(req.body, true);
  if (validationError) {
    res.status(400);
    return next(new Error(validationError));
  }

  const updates = {};
  for (const field of ['name', 'icon', 'image', 'order', 'sortOrder', 'active']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (req.body.slug !== undefined) updates.slug = slugify(req.body.slug);
  if (req.body.parent !== undefined) updates.parent = req.body.parent || null;
  if (Object.keys(updates).length === 0) {
    res.status(400);
    return next(new Error('No updatable category fields were provided'));
  }

  try {
    if (updates.parent) {
      if (!validId(updates.parent) || updates.parent === req.params.id || !(await Category.exists({ _id: updates.parent }))) {
        res.status(400);
        throw new Error('Parent category is invalid');
      }
      let ancestor = await Category.findById(updates.parent).select('parent');
      while (ancestor) {
        if (ancestor._id.toString() === req.params.id) {
          res.status(400);
          throw new Error('Category cannot be nested under its own descendant');
        }
        ancestor = ancestor.parent ? await Category.findById(ancestor.parent).select('parent') : null;
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    res.json(category);
  } catch (error) {
    respondError(error, res, next);
  }
};

export const deleteCategory = async (req, res, next) => {
  if (!validId(req.params.id)) {
    res.status(400);
    return next(new Error('Invalid category id'));
  }

  try {
    const [category, hasChildren, hasProducts] = await Promise.all([
      Category.findById(req.params.id),
      Category.exists({ parent: req.params.id }),
      Product.exists({ categoryRef: req.params.id }),
    ]);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }
    if (hasChildren || hasProducts) {
      res.status(400);
      throw new Error('Category cannot be deleted while it has child categories or products');
    }
    await category.deleteOne();
    res.json({ message: 'Category removed' });
  } catch (error) {
    respondError(error, res, next);
  }
};