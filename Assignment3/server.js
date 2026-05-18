const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const app = express();
const port = 3000;

// Local MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

// Set EJS as view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// ── ROUTES ────────────────────────────────────────────────

// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {
    title: 'Khaadi - New In',
    products: [
      { id: 1, category: 'Fashion', name: 'Embroidered Kurta',     price: 'PKR 4,500', image: '/images/p1.webp', link: '/products' },
      { id: 2, category: 'Fashion', name: 'Floral V-Neck Kurta',   price: 'PKR 4,800', image: '/images/p2.webp', link: '/products' },
      { id: 3, category: 'Fashion', name: 'Solid Longline Kurta',  price: 'PKR 7,000', image: '/images/p3.webp', link: '/products' },
      { id: 4, category: 'Fashion', name: 'Cotton Dobby Kurta',    price: 'PKR 3,000', image: '/images/p4.webp', link: '/products' },
      { id: 5, category: 'Fashion', name: 'Printed Summer Kurta',  price: 'PKR 5,500', image: '/images/p5.webp', link: '/products' },
      { id: 6, category: 'Fashion', name: 'Luxury Embroidered',    price: 'PKR 4,000', image: '/images/p6.jpg',  link: '/products' },
      { id: 7, category: 'Fashion', name: 'Casual Cotton Shirt',   price: 'PKR 6,000', image: '/images/p7.jpg',  link: '/products' }
    ]
  });
});

// Products page — with pagination, search, filtering
app.get('/products', async (req, res) => {
  try {
    // Read query parameters from URL
    const page     = parseInt(req.query.page)      || 1;
    const search   = req.query.search               || '';
    const category = req.query.category             || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999;

    const limit = 8;                    // products per page
    const skip  = (page - 1) * limit;  // how many to skip

    // Build MongoDB filter
    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }

    filter.price = { $gte: minPrice, $lte: maxPrice };

    // Count total matching products
    const totalProducts = await Product.countDocuments(filter);
    const totalPages    = Math.ceil(totalProducts / limit);

    // Fetch products for this page
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit);

    // Get all categories for dropdown
    const categories = await Product.distinct('category');

    res.render('products', {
      title:         'Products - Khaadi',
      products,
      currentPage:   page,
      totalPages,
      totalProducts,
      search,
      category,
      minPrice:      minPrice === 0      ? '' : minPrice,
      maxPrice:      maxPrice === 999999 ? '' : maxPrice,
      categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

// Contact Us
app.get('/contact-us', (req, res) => {
  res.render('contact-us', { title: 'Contact Us - Khaadi' });
});

// Hobbies
app.get('/hobbies', (req, res) => {
  res.render('hobbies', {
    title:   'Hobbies - Khaadi',
    hobbies: ['Fashion Design', 'Fabric Crafting', 'Embroidery', 'Sustainable Fashion']
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});