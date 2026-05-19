const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const session = require('express-session');

//const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const app = express();
const port = 3000;

const MONGO_URI = 'mongodb://localhost:27017';
const jwt = require('jsonwebtoken');
require('dotenv').config();
const expressLayouts = require('express-ejs-layouts');
const Sale = require('./models/Sale');

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

function isLoggedIn(req, res, next) {
  if (req.session.user) {
    return next();
  }

  req.flash('error', 'Please login first');
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  req.flash('error', 'Access denied. Admins only.');
  res.redirect('/login');
}

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token format.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

// HOME
app.get('/', (req, res) => {
  res.render('homepage', {
    title: 'Khaadi - New In',
    currentUser: req.session.user,
    products: [
      { id: 1, category: 'Fashion', name: 'Embroidered Kurta', price: 'PKR 4,500', image: '/images/p1.webp', link: '/products' },
      { id: 2, category: 'Fashion', name: 'Floral V-Neck Kurta', price: 'PKR 4,800', image: '/images/p2.webp', link: '/products' },
      { id: 3, category: 'Fashion', name: 'Solid Longline Kurta', price: 'PKR 7,000', image: '/images/p3.webp', link: '/products' },
      { id: 4, category: 'Fashion', name: 'Cotton Dobby Kurta', price: 'PKR 3,000', image: '/images/p4.webp', link: '/products' },
      { id: 5, category: 'Fashion', name: 'Printed Summer Kurta', price: 'PKR 5,500', image: '/images/p5.webp', link: '/products' },
      { id: 6, category: 'Fashion', name: 'Luxury Embroidered', price: 'PKR 4,000', image: '/images/p6.jpg', link: '/products' },
      { id: 7, category: 'Fashion', name: 'Casual Cotton Shirt', price: 'PKR 6,000', image: '/images/p7.jpg', link: '/products' }
    ]
  });
});

// PRODUCTS
app.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999;

    const limit = 8;
    const skip = (page - 1) * limit;

    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    filter.price = { $gte: minPrice, $lte: maxPrice };

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit);

    const categories = await Product.distinct('category');

    res.render('products', {
      title: 'Products - Khaadi',
      currentUser: req.session.user,
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      search,
      category,
      minPrice: minPrice === 0 ? '' : minPrice,
      maxPrice: maxPrice === 999999 ? '' : maxPrice,
      categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});

// CONTACT
app.get('/contact-us', (req, res) => {
  res.render('contact-us', {
    title: 'Contact Us - Khaadi',
    currentUser: req.session.user
  });
});

// HOBBIES
app.get('/hobbies', (req, res) => {
  res.render('hobbies', {
    title: 'Hobbies - Khaadi',
    currentUser: req.session.user,
    hobbies: ['Fashion Design', 'Fabric Crafting', 'Embroidery', 'Sustainable Fashion']
  });
});

// REGISTER PAGE
app.get('/register', (req, res) => {
  res.render('register', {
    title: 'Register'
  });
});

// REGISTER USER
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer'
    });

    await newUser.save();

    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/login');

  } catch (err) {
    console.log('REGISTER ERROR:', err);
    res.send('Error registering user: ' + err.message);
  }
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Login'
  });
});

// LOGIN USER
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');

  } catch (err) {
    console.log(err);
    res.send('Error logging in');
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// PROFILE
app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', {
    title: 'My Profile',
    user: req.session.user
  });
});

// CHECKOUT PROTECTED EXAMPLE
app.get('/checkout', isLoggedIn, (req, res) => {
  res.render('checkout');
});

// ADMIN DASHBOARD
app.get('/admin', isAdmin, async (req, res) => {
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
app.get('/admin/products/add', isAdmin, (req, res) => {
  res.render('add-product', {
    title: 'Add Product'
  });
});

// ADD PRODUCT
app.post('/admin/products/add', isAdmin, upload.single('image'), async (req, res) => {
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
app.get('/admin/products/edit/:id', isAdmin, async (req, res) => {
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
app.post('/admin/products/edit/:id', isAdmin, upload.single('image'), async (req, res) => {
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
app.post('/admin/products/delete/:id', isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin');

  } catch (err) {
    res.send('Error deleting product');
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        user_id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token: token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

app.get('/api/v1/products', async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const search = req.query.search || '';
    const category = req.query.category || '';

    const skip = (page - 1) * limit;

    let filter = {};

    if (search) {
      filter.name = {
        $regex: search,
        $options: 'i'
      };
    }

    if (category) {
      filter.category = category;
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      currentPage: page,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      products
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

app.get('/api/v1/user/profile', verifyToken, async (req, res) => {
  try {

    const user = await User.findById(req.user.user_id).select('-password');

    res.json({
      success: true,
      user
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});

app.post('/api/v1/orders', verifyToken, async (req, res) => {

  try {

    res.json({
      success: true,
      message: 'Order placed successfully',
      user: req.user
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});

async function getSalesStats() {
  const totalOrders = await Sale.countDocuments();

  const revenueResult = await Sale.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' }
      }
    }
  ]);

  const topProductResult = await Sale.aggregate([
    {
      $group: {
        _id: '$productName',
        totalSold: { $sum: '$quantity' }
      }
    },
    {
      $sort: { totalSold: -1 }
    },
    {
      $limit: 1
    }
  ]);

  const recentTransactions = await Sale.find()
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    totalRevenue: revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0,
    totalOrders,
    topProduct: topProductResult.length > 0 ? topProductResult[0]._id : 'No sales yet',
    recentTransactions
  };
}

app.get('/sales', async (req, res) => {
  try {
    const stats = await getSalesStats();

    res.render('sales', {
      title: 'Sales Dashboard',
      stats
    });

  } catch (err) {
    console.log(err);
    res.send('Error loading sales dashboard');
  }
});

app.get('/api/sales-data', async (req, res) => {
  try {
    const stats = await getSalesStats();

    res.json({
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      topProduct: stats.topProduct,
      recentTransactions: stats.recentTransactions
    });

  } catch (err) {
    res.status(500).json({
      message: 'Error fetching sales data'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});