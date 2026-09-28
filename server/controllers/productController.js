import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const writableFields = [
  'name',
  'description',
  'price',
  'mrp',
  'stock',
  'category',
  'categoryRef',
  'brand',
  'colors',
  'sizes',
  'freeDelivery',
  'drops',
  'images',
  'featured',
];

const sortOptions = {
  featured: { featured: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  best_sellers: { sold: -1, createdAt: -1 },
  biggest_discount: { discountPercent: -1, createdAt: -1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sendBadRequest = (res, next, message) => {
  res.status(400);
  next(new Error(message));
};

const handleError = (error, res, next) => {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    res.status(400);
  }
  next(error);
};

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const validatePayload = (body, partial = false) => {
  if (!isObject(body)) {
    return 'Request body must be a JSON object';
  }

  const requiredFields = ['name', 'description', 'price', 'category'];
  if (!partial && requiredFields.some((field) => body[field] === undefined)) {
    return 'Name, description, price, and category are required';
  }

  for (const field of ['name', 'description', 'category', 'brand']) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || !body[field].trim())) {
      return `${field} must be a non-empty string`;
    }
  }

  if (body.price !== undefined && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0)) {
    return 'Price must be a non-negative number';
  }

  if (body.mrp !== undefined && (typeof body.mrp !== 'number' || !Number.isFinite(body.mrp) || body.mrp < 0 || (body.price !== undefined && body.mrp < body.price))) {
    return 'MRP must be a number greater than or equal to price';
  }

  if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
    return 'Stock must be a non-negative integer';
  }

  for (const field of ['colors', 'sizes']) {
    if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].some((value) => typeof value !== 'string' || !value.trim()))) {
      return `${field} must be an array of non-empty strings`;
    }
  }

  for (const field of ['freeDelivery', 'drops']) {
    if (body[field] !== undefined && typeof body[field] !== 'boolean') return `${field} must be a boolean`;
  }

  if (body.categoryRef !== undefined && body.categoryRef !== null && !/^[a-f\d]{24}$/i.test(body.categoryRef)) {
    return 'categoryRef must be a valid category id';
  }

  if (body.featured !== undefined && typeof body.featured !== 'boolean') {
    return 'Featured must be a boolean';
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      return 'Images must be an array of URLs';
    }

    for (const image of body.images) {
      if (typeof image !== 'string') {
        return 'Images must contain only HTTP or HTTPS URLs';
      }

      try {
        const url = new URL(image);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return 'Images must contain only HTTP or HTTPS URLs';
        }
      } catch {
        return 'Images must contain only HTTP or HTTPS URLs';
      }
    }
  }

  return null;
};

const pickWritableFields = (body) =>
  Object.fromEntries(writableFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

const hasValidId = (id) => /^[a-f\d]{24}$/i.test(id);

const listValues = (value) => {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : String(value).split(',')).map((item) => item.trim()).filter(Boolean);
};

const parseBoolean = (value, name) => {
  if (value === undefined) return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  const error = new Error(`${name} must be true or false`);
  error.status = 400;
  throw error;
};

const buildProductFilter = async (query) => {
  const {
    keyword = '', category, brand, minPrice, maxPrice, rating, minDiscount,
    inStock, includeOutOfStock, colors, sizes, freeDelivery, drops, onSale,
  } = query;
  if (typeof keyword !== 'string' || (category !== undefined && typeof category !== 'string')) {
    const error = new Error('Keyword and category must be strings');
    error.status = 400;
    throw error;
  }

  const filter = {};
  if (keyword.trim()) {
    const expression = new RegExp(escapeRegex(keyword.trim()), 'i');
    filter.$or = [{ name: expression }, { description: expression }, { brand: expression }];
  }

  if (category?.trim()) {
    const slug = category.trim().toLowerCase();
    const root = await Category.findOne({ slug });
    if (root) {
      const allCategories = await Category.find({ active: true }).select('_id parent');
      const descendants = new Map();
      for (const item of allCategories) {
        const parentId = item.parent?.toString();
        if (parentId) descendants.set(parentId, [...(descendants.get(parentId) || []), item._id]);
      }
      const ids = [root._id];
      for (let index = 0; index < ids.length; index += 1) {
        ids.push(...(descendants.get(ids[index].toString()) || []));
      }
      filter.$and = [...(filter.$and || []), { $or: [{ categoryRef: { $in: ids } }, { category: slug }] }];
    } else {
      filter.category = slug;
    }
  }

  const brands = listValues(brand);
  if (brands.length) filter.brand = { $in: brands.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i')) };

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price = {};
    if (minPrice !== undefined) price.$gte = Number(minPrice);
    if (maxPrice !== undefined) price.$lte = Number(maxPrice);
    if (Object.values(price).some((value) => !Number.isFinite(value) || value < 0)) {
      const error = new Error('Price filters must be non-negative numbers');
      error.status = 400;
      throw error;
    }
    if (price.$gte !== undefined && price.$lte !== undefined && price.$gte > price.$lte) {
      const error = new Error('minPrice cannot be greater than maxPrice');
      error.status = 400;
      throw error;
    }
    filter.price = price;
  }

  if (rating !== undefined) {
    const minimumRating = Number(rating);
    if (!Number.isFinite(minimumRating) || minimumRating < 0 || minimumRating > 5) {
      const error = new Error('Rating must be between 0 and 5');
      error.status = 400;
      throw error;
    }
    filter.rating = { $gte: minimumRating };
  }

  if (minDiscount !== undefined) {
    const discount = Number(minDiscount);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      const error = new Error('minDiscount must be between 0 and 100');
      error.status = 400;
      throw error;
    }
    filter.$expr = { $gte: [{ $cond: [{ $gt: ['$mrp', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] }, 100] }, 0] }, discount] };
  }

  const stockOnly = parseBoolean(inStock, 'inStock');
  const includeOutOfStockValue = parseBoolean(includeOutOfStock, 'includeOutOfStock');
  if (stockOnly === true || includeOutOfStockValue === false || (stockOnly === undefined && includeOutOfStockValue === undefined)) {
    filter.stock = { $gt: 0 };
  }
  if (stockOnly === false) filter.stock = 0;
  const saleOnly = parseBoolean(onSale, 'onSale');
    if (saleOnly === true) {
      filter.$and = [...(filter.$and || []), { $expr: { $gt: ['$mrp', '$price'] } }];
    }
  const deliveryOnly = parseBoolean(freeDelivery, 'freeDelivery');
  if (deliveryOnly !== undefined) filter.freeDelivery = deliveryOnly;
  const dropsOnly = parseBoolean(drops, 'drops');
  if (dropsOnly !== undefined) filter.drops = dropsOnly;

  for (const [field, rawValue] of [['colors', colors], ['sizes', sizes]]) {
    const values = listValues(rawValue);
    if (values.length) filter[field] = { $in: values.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i')) };
  }
  return filter;
};

const productSort = (sort) => sort === 'biggest_discount'
  ? { $addFields: { discountPercent: { $cond: [{ $gt: ['$mrp', 0] }, { $multiply: [{ $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] }, 100] }, 0] } } }
  : null;

const sortedProducts = async (filter, sort, skip, limit) => {
  const addDiscount = productSort(sort);
  if (addDiscount) {
    return Product.aggregate([
      { $match: filter },
      addDiscount,
      { $sort: sortOptions[sort] },
      { $skip: skip },
      { $limit: limit },
    ]);
  }
  return Product.find(filter).sort(sortOptions[sort]).skip(skip).limit(limit);
};

export const getProducts = async (req, res, next) => {
  try {
    const {
      keyword = '',
      sort = 'newest',
      page: pageValue = '1',
      limit: limitValue = '12',
    } = req.query;

    const page = Number(pageValue);
    const requestedLimit = Number(limitValue);
    const limit = Math.min(requestedLimit, 50);

    if (!Number.isInteger(page) || page < 1) {
      return sendBadRequest(res, next, 'Page must be a positive integer');
    }
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
      return sendBadRequest(res, next, 'Limit must be a positive integer');
    }
    if (!Object.hasOwn(sortOptions, sort)) {
      return sendBadRequest(res, next, 'Unsupported product sort order');
    }

    const filter = await buildProductFilter(req.query);
    const total = await Product.countDocuments(filter);
    const products = await sortedProducts(filter, sort, (page - 1) * limit, limit);

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    if (error.status === 400) res.status(400);
    next(error);
  }
};

export const getProductFacets = async (req, res, next) => {
  try {
    const filter = await buildProductFilter(req.query);
    const [brands, colors, sizes, priceRange, ratings] = await Promise.all([
      Product.aggregate([{ $match: filter }, { $match: { brand: { $nin: ['', null] } } }, { $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
      Product.aggregate([{ $match: filter }, { $unwind: '$colors' }, { $group: { _id: '$colors', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Product.aggregate([{ $match: filter }, { $unwind: '$sizes' }, { $group: { _id: '$sizes', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Product.aggregate([{ $match: filter }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
      Product.aggregate([{ $match: filter }, { $bucket: { groupBy: '$rating', boundaries: [0, 1, 2, 3, 4, 5.1], default: 'other', output: { count: { $sum: 1 } } } }]),
    ]);
    res.json({
      brands: brands.map((item) => ({ name: item._id, count: item.count })),
      colors: colors.map((item) => ({ name: item._id, count: item.count })),
      sizes: sizes.map((item) => ({ name: item._id, count: item.count })),
      price: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 0 },
      ratings: ratings.map((item) => ({ minimum: item._id, count: item.count })),
    });
  } catch (error) {
    if (error.status === 400) res.status(400);
    next(error);
  }
};

export const suggestProducts = async (req, res, next) => {
  try {
    const query = req.query.q;
    if (query !== undefined && typeof query !== 'string') return sendBadRequest(res, next, 'q must be a string');
    const term = (query || '').trim();
    if (term.length < 2) return res.json({ products: [], categories: [], brands: [] });
    const expression = new RegExp(escapeRegex(term), 'i');
    const [products, categories, brands] = await Promise.all([
      Product.find({ $or: [{ name: expression }, { brand: expression }] }).select('name images price mrp rating').limit(8).lean(),
      Category.find({ active: true, name: expression }).select('name slug').limit(8).lean(),
      Product.distinct('brand', { brand: expression }),
    ]);
    let remaining = 8;
    const limitedProducts = products.slice(0, remaining);
    remaining -= limitedProducts.length;
    const limitedCategories = categories.slice(0, remaining);
    remaining -= limitedCategories.length;
    const limitedBrands = brands.slice(0, remaining);
    res.json({ products: limitedProducts, categories: limitedCategories, brands: limitedBrands });
  } catch (error) {
    next(error);
  }
};

export const getProductCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories.sort());
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return sendBadRequest(res, next, 'Invalid product id');
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(product);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const createProduct = async (req, res, next) => {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return sendBadRequest(res, next, validationError);
  }

  try {
    const product = await Product.create({
      ...pickWritableFields(req.body),
      createdBy: req.user._id,
    });
    res.status(201).json(product);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateProduct = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return sendBadRequest(res, next, 'Invalid product id');
  }

  const validationError = validatePayload(req.body, true);
  if (validationError) {
    return sendBadRequest(res, next, validationError);
  }

  const updates = pickWritableFields(req.body);
  if (Object.keys(updates).length === 0) {
    return sendBadRequest(res, next, 'No updatable product fields were provided');
  }

  try {
    if (updates.mrp !== undefined && updates.price === undefined) {
      const currentProduct = await Product.findById(req.params.id).select('price');
      if (!currentProduct) {
        res.status(404);
        throw new Error('Product not found');
      }
      if (updates.mrp < currentProduct.price) {
        return sendBadRequest(res, next, 'MRP must be greater than or equal to price');
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json(product);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteProduct = async (req, res, next) => {
  if (!hasValidId(req.params.id)) {
    return sendBadRequest(res, next, 'Invalid product id');
  }

  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    res.json({ message: 'Product removed' });
  } catch (error) {
    handleError(error, res, next);
  }
};