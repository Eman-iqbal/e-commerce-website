const express = require('express');
const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the public folder
app.use(express.static('public'));

// ── DATA ──────────────────────────────────────────────────

const products = [
  {
    id: 1,
    category: 'Embroidered | Cotton Dobby',
    name: 'Embroidered Kurta',
    price: 'PKR 4,500',
    image: '/images/p1.webp',
    link: '/product/1'
  },
  {
    id: 2,
    category: 'Embroidered | Cotton Dobby',
    name: 'Floral V-Neck Kurta',
    price: 'PKR 4,800',
    image: '/images/p2.webp',
    link: '/product/2'
  },
  {
    id: 3,
    category: 'Embroidered | Cotton Dobby',
    name: 'Solid Longline Kurta',
    price: 'PKR 7,000',
    image: '/images/p3.webp',
    link: '/product/3'
  },
  {
    id: 4,
    category: 'Embroidered | Cotton Textured',
    name: 'Solid Longline Kurta',
    price: 'PKR 3,000',
    image: '/images/p4.webp',
    link: '/product/4'
  },
  {
    id: 5,
    category: 'Embroidered | Cotton Dobby',
    name: 'Solid Longline Kurta',
    price: 'PKR 7,000',
    image: '/images/p5.webp',
    link: '/product/5'
  },
  {
    id: 6,
    category: 'Embroidered | Cotton Textured',
    name: 'Solid Longline Kurta',
    price: 'PKR 4,000',
    image: '/images/p6.jpg',
    link: '/product/6'
  },
  {
    id: 7,
    category: 'Embroidered | Cotton Dobby',
    name: 'Solid Longline Kurta',
    price: 'PKR 6,000',
    image: '/images/p7.jpg',
    link: '/product/7'
  }
];

// ── ROUTES ────────────────────────────────────────────────

// Homepage
app.get('/', (req, res) => {
  res.render('homepage', {
    title: 'Khaadi - New In',
    products: products
  });
});

// Contact Us page
app.get('/contact-us', (req, res) => {
  res.render('contact-us', {
    title: 'Contact Us - Khaadi'
  });
});

// Hobbies page
app.get('/hobbies', (req, res) => {
  res.render('hobbies', {
    title: 'Hobbies - Khaadi',
    hobbies: [
      'Fashion Design',
      'Fabric Crafting',
      'Embroidery',
      'Sustainable Fashion'
    ]
  });
});

// ── START SERVER ──────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});