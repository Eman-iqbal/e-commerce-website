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

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.log('MongoDB error:', err));

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});