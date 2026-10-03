const category = (name, slug, sortOrder, icon, subcategoryNames, image) => ({
  name,
  slug,
  sortOrder,
  icon,
  image,
  children: subcategoryNames.map((subcategoryName, index) => ({
    name: subcategoryName,
    slug: subcategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    sortOrder: index,
  })),
})

export const categoryTree = [
  category('Necklaces & Chains', 'chains-necklaces', 0, 'Link2', ['Pendant Chains', 'Cross Chains', 'Layered Chains', 'Curb Chains'], '/images/products/cross-pendant-chain.jpg'),
  category('Rings', 'rings', 1, 'Gem', ['Statement Rings', 'Stackable Rings', 'Signet Rings', 'Gothic Rings']),
  category('Earrings', 'earrings', 2, 'Sparkles', ['Hoops', 'Huggies', 'Butterfly Earrings', 'Statement Earrings']),
  category('Bracelets', 'bracelets', 3, 'Watch', ['Cuff Bracelets', 'Chain Bracelets', 'Beaded Bracelets', 'Charm Bracelets']),
  category('Belts & Waist Accessories', 'belts', 4, 'CircleDot', ['Gothic Belts', 'Chain Belts', 'Studded Belts', 'Y2K Belts'], '/images/products/gothic-cross-belt.jpg'),
  category('Bags & Mini Bags', 'bags', 5, 'ShoppingBag', ['Shoulder Bags', 'Crossbody Bags', 'Mini Bags', 'Y2K Bags']),
  category('Hair Accessories', 'hair-accessories', 6, 'Scissors', ['Claw Clips', 'Hair Chains', 'Scrunchies', 'Headbands']),
  category('Sunglasses', 'sunglasses', 7, 'Glasses', ['Y2K', 'Retro', 'Cyber', 'Oversized']),
  category('Tech & Lifestyle', 'retro-tech', 8, 'Headphones', ['Retro MP3 Players', 'Phone Charms', 'Keychains', 'Phone Accessories'], '/images/products/retro-mp3-player.jpg'),
]

export const specialCollections = [
  { name: 'Y2K', slug: 'y2k' },
  { name: 'Gothic', slug: 'gothic' },
  { name: 'Streetwear', slug: 'streetwear' },
  { name: 'Minimal', slug: 'minimal' },
  { name: 'Retro', slug: 'retro' },
  { name: 'Korean-Inspired', slug: 'korean-inspired' },
  { name: 'New Drops', slug: 'new-drops' },
  { name: 'Best Sellers', slug: 'best-sellers' },
  { name: 'Under ₹499', slug: 'under-499' },
]

export default categoryTree