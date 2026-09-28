import 'dotenv/config';
import mongoose from 'mongoose';
import { products } from '../../client/src/data/products.js';
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

    const categoryNames = [...new Set(products.map((product) => product.category.trim()))];
    const categories = await Promise.all(categoryNames.map(async (name, index) => {
      const sourceProduct = products.find((product) => product.category.trim() === name);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return Category.findOneAndUpdate(
        { slug },
        { $set: { name, image: sourceProduct?.image, order: index, active: true }, $setOnInsert: { slug, parent: null } },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
    }));
    const categoryByName = new Map(categories.map((category) => [category.name.toLowerCase(), category._id]));
    const seededProducts = await Promise.all(products.map(async (product) => {
      const fields = {
        name: product.name,
        description: product.description,
        price: product.price,
        mrp: product.discount ? Number((product.price / (1 - product.discount / 100)).toFixed(2)) : product.price,
        stock: product.stock ?? 0,
        category: product.category,
        categoryRef: categoryByName.get(product.category.toLowerCase()),
        brand: product.brand,
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        images: product.image ? [product.image] : [],
        rating: product.rating ?? 0,
        numReviews: 0,
        featured: false,
        createdBy: adminUser._id,
      };
      return Product.findOneAndUpdate(
        { name: product.name },
        { $set: fields, $setOnInsert: { sold: 0 } },
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