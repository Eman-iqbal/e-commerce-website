const mongoose = require('mongoose');
const Product = require('../models/Product');

// Local MongoDB — since you have Compass installed
const MONGO_URI = 'mongodb://localhost:27017';

const products = [
  // FASHION
  { name: 'Embroidered Kurta', price: 4500, category: 'Fashion', rating: 4.5, stock: 20, image: '/images/p1.webp' },
  { name: 'Floral V-Neck Kurta', price: 4800, category: 'Fashion', rating: 4.2, stock: 15, image: '/images/p2.webp' },
  { name: 'Solid Longline Kurta', price: 7000, category: 'Fashion', rating: 4.7, stock: 10, image: '/images/p3.webp' },
  { name: 'Cotton Dobby Kurta', price: 3000, category: 'Fashion', rating: 3.9, stock: 25, image: '/images/p4.webp' },
  { name: 'Printed Summer Kurta', price: 5500, category: 'Fashion', rating: 4.1, stock: 18, image: '/images/p5.webp' },
  { name: 'Luxury Embroidered Suit', price: 12000, category: 'Fashion', rating: 4.8, stock: 8, image: '/images/p6.jpg' },
  { name: 'Casual Cotton Shirt', price: 2500, category: 'Fashion', rating: 3.8, stock: 30, image: '/images/p7.jpg' },
  { name: 'Formal Lawn Kurta', price: 6500, category: 'Fashion', rating: 4.3, stock: 12, image: '/images/p1.webp' },
  { name: 'Party Wear Outfit', price: 15000, category: 'Fashion', rating: 4.9, stock: 5, image: '/images/p2.webp' },
  { name: 'Festive Collection Suit', price: 9500, category: 'Fashion', rating: 4.6, stock: 9, image: '/images/p3.webp' },

  // FRAGRANCES
  { name: 'Rose Oud Perfume', price: 3500, category: 'Fragrances', rating: 4.4, stock: 22, image: '/images/p4.webp' },
  { name: 'Khaadi Signature Scent', price: 4200, category: 'Fragrances', rating: 4.7, stock: 16, image: '/images/p5.webp' },
  { name: 'Oriental Musk Spray', price: 2800, category: 'Fragrances', rating: 4.0, stock: 28, image: '/images/p6.jpg' },
  { name: 'Floral Breeze Attar', price: 1800, category: 'Fragrances', rating: 3.7, stock: 35, image: '/images/p7.jpg' },
  { name: 'Premium Oud Collection', price: 7500, category: 'Fragrances', rating: 4.8, stock: 10, image: '/images/p1.webp' },

  // FABRICS
  { name: 'Premium Lawn Fabric', price: 1200, category: 'Fabrics', rating: 4.2, stock: 50, image: '/images/p2.webp' },
  { name: 'Cotton Dobby Roll', price: 950, category: 'Fabrics', rating: 3.9, stock: 45, image: '/images/p3.webp' },
  { name: 'Embroidered Net Fabric', price: 2200, category: 'Fabrics', rating: 4.5, stock: 20, image: '/images/p4.webp' },
  { name: 'Chiffon Fabric Roll', price: 1500, category: 'Fabrics', rating: 4.1, stock: 38, image: '/images/p5.webp' },
  { name: 'Silk Blend Fabric', price: 3200, category: 'Fabrics', rating: 4.6, stock: 15, image: '/images/p6.jpg' },

  // ACCESSORIES
  { name: 'Handwoven Tote Bag', price: 2200, category: 'Accessories', rating: 4.3, stock: 18, image: '/images/p7.jpg' },
  { name: 'Embroidered Clutch', price: 1800, category: 'Accessories', rating: 4.0, stock: 22, image: '/images/p1.webp' },
  { name: 'Cotton Dupatta', price: 800, category: 'Accessories', rating: 3.8, stock: 40, image: '/images/p2.webp' },
  { name: 'Printed Scarf', price: 650, category: 'Accessories', rating: 3.6, stock: 55, image: '/images/p3.webp' },
  { name: 'Luxury Shawl', price: 4500, category: 'Accessories', rating: 4.7, stock: 12, image: '/images/p4.webp' }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');

    await Product.deleteMany({});
    console.log('Cleared old products...');

    await Product.insertMany(products);
    console.log('25 products inserted successfully!');

    await mongoose.disconnect();
    console.log('Done! Database seeded.');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();