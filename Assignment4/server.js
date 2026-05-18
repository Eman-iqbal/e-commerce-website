const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const multer = require('multer');
const path = require('path');

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
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage
});

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

// ADMIN DASHBOARD
app.get('/admin', async (req, res) => {

  try {

    const products = await Product.find();

    res.render('admin-dashboard', {
      title: 'Admin Dashboard',
      products: products
    });

  } catch (err) {

    res.send('Error loading admin dashboard');

  }

});

// ADD PRODUCT PAGE
app.get('/admin/products/add', (req, res) => {

  res.render('add-product', {
    title: 'Add Product'
  });

});
// ADD PRODUCT TO DATABASE
app.post('/admin/products/add', upload.single('image'), async (req, res) => {

  try {

    const { name, price, category, rating, stock } = req.body;

    if (!name || !price || !category || !rating || !stock) {

      return res.send('All fields are required');

    }

    const imagePath = req.file
      ? '/uploads/' + req.file.filename
      : '/images/p1.webp';

    const newProduct = new Product({
      name,
      price,
      category,
      rating,
      stock,
      image: imagePath
    });

    await newProduct.save();

    res.redirect('/admin');

  } catch (err) {

    res.send('Error adding product');

  }

});

// EDIT PRODUCT PAGE
app.get('/admin/products/edit/:id', async (req, res) => {

  try {

    const product = await Product.findById(req.params.id);

    res.render('edit-product', {
      title: 'Edit Product',
      product: product
    });

  } catch (err) {

    res.send('Error loading edit page');

  }

});


// UPDATE PRODUCT
app.post('/admin/products/edit/:id', upload.single('image'), async (req, res) => {

  try {

    const { name, price, category, rating, stock } = req.body;

    const product = await Product.findById(req.params.id);

    product.name = name;
    product.price = price;
    product.category = category;
    product.rating = rating;
    product.stock = stock;

    if (req.file) {

      product.image = '/uploads/' + req.file.filename;

    }

    await product.save();

    res.redirect('/admin');

  } catch (err) {

    res.send('Error updating product');

  }

});

// DELETE PRODUCT
app.post('/admin/products/delete/:id', async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id);

    res.redirect('/admin');

  } catch (err) {

    res.send('Error deleting product');

  }

});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});