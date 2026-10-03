import 'dotenv/config';
import mongoose from 'mongoose';
import { categoryTree } from '../../client/src/data/categories.js';
import { products } from '../../client/src/data/products.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const destroyProducts = process.argv.includes('--destroy');

const flattenCategories = (tree, parent = null) => tree.flatMap((category) => [
  { ...category, parent },
  ...flattenCategories(category.children || [], category.slug),
]);

const productSubcategory = (product) => ({
  'gothic-cross-buckle-leather-belt': 'gothic-belts',
  'layered-cross-link-chain-set': 'cross-chains',
  'silver-cross-pendant-ball-chain': 'pendant-chains',
  'long-cross-pendant-necklace': 'pendant-chains',
  'retro-silver-mp3-player-with-earbuds': 'retro-mp3-players',
  'silver-curb-chain-bracelet': 'chain-bracelets',
  'gothic-studded-bracelet-set': 'cuff-bracelets',
  'gothic-skull-hair-clip': 'claw-clips',
  'black-crescent-shoulder-bag': 'shoulder-bags',
  'gothic-skull-signet-ring': 'gothic-rings',
})[product.id];

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

    const flatCategories = flattenCategories(categoryTree);
    const existingSlugs = new Set((await Category.find({ slug: { $in: flatCategories.map(({ slug }) => slug) } }).select('slug')).map(({ slug }) => slug));
    let createdMainCategories = 0;
    let createdSubcategories = 0;
    const categoryBySlug = new Map();

    for (const mainCategory of categoryTree) {
      const result = await Category.findOneAndUpdate(
        { slug: mainCategory.slug },
        {
          $set: {
            name: mainCategory.name,
            parent: null,
            icon: mainCategory.icon,
            sortOrder: mainCategory.sortOrder,
            order: mainCategory.sortOrder,
            active: true,
            ...(mainCategory.image ? { image: mainCategory.image } : {}),
          },
          $setOnInsert: { slug: mainCategory.slug },
        },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
      categoryBySlug.set(mainCategory.slug, result._id);
      if (!existingSlugs.has(mainCategory.slug)) createdMainCategories += 1;

      for (const subcategory of mainCategory.children) {
        const created = await Category.findOneAndUpdate(
          { slug: subcategory.slug },
          {
            $set: {
              name: subcategory.name,
              parent: result._id,
              sortOrder: subcategory.sortOrder,
              order: subcategory.sortOrder,
              active: true,
            },
            $setOnInsert: { slug: subcategory.slug },
          },
          { returnDocument: 'after', upsert: true, runValidators: true }
        );
        categoryBySlug.set(subcategory.slug, created._id);
        if (!existingSlugs.has(subcategory.slug)) createdSubcategories += 1;
      }
    }

    for (const [slug, categoryId] of categoryBySlug) {
      if (categoryTree.some((category) => category.slug === slug)) {
        await Product.updateMany({ category: slug }, { $set: { categoryRef: categoryId } });
      }
    }

    const seededProducts = await Promise.all(products.map(async (product) => {
      const initialFields = {
        name: product.name,
        description: product.description,
        price: product.price,
        mrp: product.mrp,
        sold: 0,
        stock: product.stock,
        category: product.category,
        categoryRef: categoryBySlug.get(product.category),
        subcategory: productSubcategory(product),
        brand: product.brand,
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        collections: product.collections ?? [],
        images: product.image ? [product.image] : [],
        imageFocus: product.imageFocus ?? '50% 50%',
        rating: 0,
        numReviews: 0,
        featured: false,
        createdBy: adminUser._id,
      };
      const fields = Object.fromEntries(Object.entries(initialFields).filter(([, value]) => value !== undefined));
      const updates = {
        name: product.name,
        description: product.description,
        price: product.price,
        mrp: product.mrp,
        brand: product.brand,
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        images: product.image ? [product.image] : [],
        imageFocus: product.imageFocus ?? '50% 50%',
      };
      const mappedSubcategory = productSubcategory(product);
      if (mappedSubcategory) updates.subcategory = mappedSubcategory;
      const insertOnlyFields = Object.fromEntries(Object.entries(fields).filter(([field]) => !(field in updates)));
      return Product.findOneAndUpdate(
        { name: product.name },
        { $set: updates, $setOnInsert: insertOnlyFields },
        { returnDocument: 'after', upsert: true, runValidators: true }
      );
    }));

    console.log(`Created ${createdMainCategories} main categories and ${createdSubcategories} subcategories.`);
    console.log(`Imported ${seededProducts.length} products.`);
  } finally {
    await mongoose.disconnect();
  }
};

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});