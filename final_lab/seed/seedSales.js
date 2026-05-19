const mongoose = require('mongoose');
const Sale = require('../models/Sale');

mongoose.connect('mongodb://localhost:27017')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const sales = [
  {
    productName: 'Embroidered Kurta',
    quantity: 2,
    totalAmount: 9000,
    customerName: 'Ayesha'
  },
  {
    productName: 'Floral V-Neck Kurta',
    quantity: 1,
    totalAmount: 4800,
    customerName: 'Hina'
  },
  {
    productName: 'Embroidered Kurta',
    quantity: 3,
    totalAmount: 13500,
    customerName: 'Sara'
  },
  {
    productName: 'Rose Oud Perfume',
    quantity: 2,
    totalAmount: 7000,
    customerName: 'Ali'
  }
];

async function seedSales() {
  await Sale.deleteMany({});
  await Sale.insertMany(sales);
  console.log('Sales data inserted');
  mongoose.connection.close();
}

seedSales();