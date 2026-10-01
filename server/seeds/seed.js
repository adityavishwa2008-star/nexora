import 'dotenv/config';
import mongoose from 'mongoose';
import { categories, products } from '../../client/src/data/products.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const destroyProducts = process.argv.includes('--destroy');

const seed = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI || !/^mongodb(?:\+srv)?:\/\//.test(mongoURI)) {
    throw new Error('MONGO_URI is missing or invalid in server/.env');
  }

  await mongoose.connect(mongoURI);

  try {
    if (destroyProducts) {
      const result = await Product.deleteMany({});
      console.log(`Deleted ${result.deletedCount} products.`);
      return;
    }

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() || !ADMIN_PASSWORD) {
      throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env before seeding.');
    }
    if (ADMIN_PASSWORD.length < 6) {
      throw new Error('ADMIN_PASSWORD must be at least 6 characters.');
    }

    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase();
    let adminUser = await User.findOne({ email: normalizedEmail });

    if (adminUser && adminUser.role !== 'admin') {
      throw new Error('ADMIN_EMAIL belongs to a non-admin user; choose a different email.');
    }

    if (!adminUser) {
      adminUser = await User.create({
        name: ADMIN_NAME.trim(),
        email: normalizedEmail,
        password: ADMIN_PASSWORD,
        role: 'admin',
      });
      console.log('Created admin user.');
    } else {
      console.log('Admin user already exists; skipping creation.');
    }

    await Category.updateMany({}, { $set: { active: false } });
    const seededCategories = await Promise.all(categories.map(async (category) => {
      return Category.findOneAndUpdate(
        { slug: category.slug },
        { $set: { name: category.name, image: category.image, order: category.order, active: true }, $setOnInsert: { slug: category.slug, parent: null } },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
    }));
    const categoryBySlug = new Map(seededCategories.map((category) => [category.slug, category._id]));
    const seededProducts = await Promise.all(products.map(async (product) => {
      const fields = {
        name: product.name,
        description: product.description,
        price: product.price,
        mrp: product.mrp,
        sold: 0,
        stock: product.stock,
        category: product.category,
        categoryRef: categoryBySlug.get(product.category),
        brand: product.brand,
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        images: product.image ? [product.image] : [],
        imageFocus: product.imageFocus ?? '50% 50%',
        rating: 0,
        numReviews: 0,
        featured: false,
        createdBy: adminUser._id,
      };
      return Product.findOneAndUpdate(
        { name: product.name },
        { $set: fields },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
    }));

    console.log(`Imported ${seededProducts.length} products.`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});