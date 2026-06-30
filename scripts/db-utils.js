#!/usr/bin/env node
/**
 * KitchenHood DB Utilities
 * 
 * Usage:
 *   node scripts/db-utils.js <command>
 * 
 * Commands:
 *   test-db             - Test MongoDB connection
 *   check-admin         - Check if admin user exists
 *   create-admin        - Create or reset admin user (admin@kitchenhood.com / admin123)
 *   seed                - Seed default admin, services & products
 *   fix-product-images  - Update product images by category
 *   seed-products       - Add missing products to DB
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const command = process.argv[2];

if (!command) {
  console.log(`
  KitchenHood DB Utilities
  ========================
  Usage: node scripts/db-utils.js <command>

  Commands:
    test-db             Test MongoDB connection
    check-admin         Check if admin user exists
    create-admin        Create or reset admin user
    seed                Seed admin + services + products
    fix-product-images  Update product images by category
    seed-products       Add missing extra products
  `);
  process.exit(0);
}

// ── Connect & Run ───────────────────────────────────────────────
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅ MongoDB connected');
    await runCommand(command);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });

async function runCommand(cmd) {
  switch (cmd) {
    case 'test-db':
      console.log('✅ Connection test passed!');
      break;

    case 'check-admin':
      await checkAdmin();
      break;

    case 'create-admin':
      await createAdmin();
      break;

    case 'seed':
      await seedAll();
      break;

    case 'fix-product-images':
      await fixProductImages();
      break;

    case 'seed-products':
      await seedMissingProducts();
      break;

    default:
      console.error(`❌ Unknown command: "${cmd}". Run without arguments to see available commands.`);
      process.exit(1);
  }
}

// ── Commands ────────────────────────────────────────────────────

async function checkAdmin() {
  const User = require('../models/User');
  const admin = await User.findOne({ email: 'admin@kitchenhood.com' });
  if (admin) {
    console.log('✅ Admin exists:', { name: admin.name, email: admin.email, role: admin.role });
  } else {
    console.log('⚠️  Admin user not found.');
  }
}

async function createAdmin() {
  const User = require('../models/User');
  const existing = await User.findOne({ email: 'admin@kitchenhood.com' });
  if (!existing) {
    await User.create({ name: 'Admin', email: 'admin@kitchenhood.com', password: 'admin123', role: 'admin' });
    console.log('✅ Admin created: admin@kitchenhood.com / admin123');
  } else {
    existing.password = 'admin123';
    await existing.save();
    console.log('✅ Admin already existed. Password reset to admin123.');
  }
}

async function seedAll() {
  const User = require('../models/User');
  const Service = require('../models/Service');
  const Product = require('../models/Product');

  // Admin
  const adminExists = await User.findOne({ email: 'admin@kitchenhood.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@kitchenhood.com', password: 'admin123', role: 'admin', status: 'active' });
    console.log('  → Admin user created');
  } else {
    console.log('  → Admin already exists');
  }

  // Services
  await Service.updateMany({ isAvailable: { $exists: false } }, { $set: { isAvailable: true } });
  const svcCount = await Service.countDocuments();
  if (svcCount === 0) {
    await Service.insertMany([
      { name: 'Kitchen Hood Deep Cleaning', description: 'Complete deep cleaning of your kitchen hood including filters, fan, and exterior. We use eco-friendly cleaning solutions to remove all grease and grime.', price: 1500, category: 'cleaning', estimatedTime: '2-3 hours', features: ['Filter cleaning', 'Fan blade cleaning', 'Exterior polishing', 'Grease trap cleaning', 'Eco-friendly chemicals'] },
      { name: 'Kitchen Hood Repair', description: 'Expert repair service for all types of kitchen hoods. We fix motor issues, fan problems, lighting, and control panel malfunctions.', price: 2000, category: 'repair', estimatedTime: '1-2 hours', features: ['Motor repair/replacement', 'Fan repair', 'Light replacement', 'Control panel fix', 'Wiring check'] },
      { name: 'Kitchen Hood Installation', description: 'Professional installation service for new kitchen hoods. We ensure proper mounting, ducting, and electrical connections.', price: 3000, category: 'installation', estimatedTime: '3-4 hours', features: ['Wall mounting', 'Duct installation', 'Electrical connection', 'Testing & demo', '1 year warranty'] },
      { name: 'Filter Replacement', description: 'Replace old, clogged filters with new high-quality ones. We carry filters for all major brands.', price: 800, category: 'maintenance', estimatedTime: '30 min', features: ['Filter removal', 'Size measurement', 'New filter installation', 'Old filter disposal', 'Brand compatibility'] },
      { name: 'Emergency Repair Service', description: 'Urgent repair service for kitchen hood emergencies. Same-day service available in Dhaka city.', price: 3500, category: 'repair', estimatedTime: '1-2 hours', features: ['Same day service', 'Priority dispatch', 'Full diagnostic', 'Temporary fix if needed', '24/7 support'] },
      { name: 'Annual Maintenance Contract', description: 'Yearly maintenance contract for your kitchen hood. Includes quarterly cleaning and priority repair service.', price: 5000, category: 'maintenance', estimatedTime: 'Yearly contract', features: ['Quarterly cleaning', 'Priority service', 'Free inspection', '10% discount on repairs', 'Free filter replacement'] }
    ]);
    console.log('  → 6 services seeded');
  } else {
    console.log(`  → ${svcCount} services already exist`);
  }

  // Products
  const prodCount = await Product.countDocuments();
  if (prodCount === 0) {
    await Product.insertMany([
      { name: 'Elica 60cm Auto Clean Chimney', description: 'Elica 60cm auto clean chimney with motion sensor, 1200 m3/h suction capacity', price: 18500, category: 'chimney', stock: 15, specs: { brand: 'Elica', size: '60cm', suction: '1200 m3/h', type: 'Auto Clean', filter: 'Baffle Filter' } },
      { name: 'Faber 90cm Kitchen Hood', description: 'Faber 90cm chimney with touch control, LED display, 1000 m3/h suction', price: 22000, category: 'hood', stock: 10, specs: { brand: 'Faber', size: '90cm', suction: '1000 m3/h', type: 'Touch Control', filter: 'Aluminum Filter' } },
      { name: 'Kutchina 60cm Filterless Chimney', description: 'Kutchina 60cm filterless chimney with auto clean technology, 1100 m3/h', price: 16500, category: 'chimney', stock: 20, specs: { brand: 'Kutchina', size: '60cm', suction: '1100 m3/h', type: 'Filterless', filter: 'Oil Collector' } },
      { name: 'Baffle Filter Set (2 pcs)', description: 'Stainless steel baffle filter set compatible with most kitchen hood brands', price: 1200, category: 'filter', stock: 50, specs: { material: 'Stainless Steel', quantity: '2 pcs', compatibility: 'Universal', type: 'Baffle Filter' } },
      { name: 'Activated Carbon Filter', description: 'Activated carbon filter for recirculating kitchen hoods. Removes odors effectively.', price: 600, category: 'filter', stock: 100, specs: { material: 'Activated Carbon', quantity: '1 pc', compatibility: 'Recirculating Hoods', type: 'Carbon Filter' } },
      { name: 'Kitchen Hood Motor (Universal)', description: 'Universal replacement motor for kitchen hoods. Fits most brands with adjustable mounting.', price: 2500, category: 'part', stock: 25, specs: { voltage: '220V', power: '150W', type: 'Universal', brand: 'Compatible' } }
    ]);
    console.log('  → 6 products seeded');
  } else {
    console.log(`  → ${prodCount} products already exist`);
  }

  console.log('✅ Seed complete!');
}

async function fixProductImages() {
  const Product = require('../models/Product');
  await Product.updateMany({ category: 'chimney' }, { image: '/images/hood.png' });
  await Product.updateMany({ category: 'hood' }, { image: '/images/hood.png' });
  await Product.updateMany({ category: 'filter' }, { image: '/images/filter.png' });
  await Product.updateMany({ category: 'part' }, { image: '/images/motor.png' });
  console.log('✅ Product images updated by category');
}

async function seedMissingProducts() {
  const Product = require('../models/Product');
  const missingProducts = [
    { name: 'Hindware 90cm Auto Clean Hood', description: 'Hindware 90cm sleek smart kitchen hood with thermal auto-clean. Offers an impressive 1200 m³/h suction power.', price: 24500, category: 'chimney', stock: 8, image: '/images/hood.png', specs: { brand: 'Hindware', size: '90cm', suction: '1200 m³/h', type: 'Thermal Auto Clean', filter: 'Baffle Filter' } },
    { name: 'Bosch Series 4 Wall-Mounted Chimney', description: 'Bosch Series 4 European-style wall-mounted chimney. Whisper-quiet BLDC motor technology with 3-stage filtration.', price: 32000, category: 'hood', stock: 5, image: '/images/hood.png', specs: { brand: 'Bosch', size: '60cm', suction: '800 m³/h', noise: 'Low (55dB)', motor: 'BLDC' } },
    { name: 'Aluminum Flexible Duct Pipe (10 ft)', description: 'Expandable 10-foot premium aluminum flexible ducting hose for kitchen hoods.', price: 850, category: 'part', stock: 40, image: '/images/motor.png', specs: { material: 'Aluminum', length: '10 Feet', diameter: '6 Inches', heat_resistance: '150°C' } },
    { name: 'Chimney LED Replacement Bulb (Pair)', description: 'Energy-efficient 1.5W LED replacement bulbs for all major kitchen hood brands.', price: 450, category: 'part', stock: 80, image: '/images/filter.png', specs: { power: '1.5W', color: 'Daylight (6000K)', quantity: '2 Bulbs', lifespan: '20,000 hrs' } },
    { name: 'Heavy Duty Degreaser Spray (500ml)', description: 'Industrial strength alkaline chemical degreaser spray for hoods and filters.', price: 550, category: 'part', stock: 120, image: '/images/filter.png', specs: { volume: '500ml', type: 'Alkaline Liquid', usage: 'Direct Spray', eco_friendly: 'Yes' } },
    { name: 'Touch Control Motherboard (Universal)', description: 'Universal replacement motherboard for touch-control auto-clean chimneys.', price: 3500, category: 'part', stock: 12, image: '/images/motor.png', specs: { type: 'Universal PCB', voltage: '220-240V', controls: 'Touch/Gesture', features: 'Auto Clean Logic' } }
  ];

  let added = 0;
  for (const p of missingProducts) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await Product.create(p);
      added++;
    }
  }
  console.log(`✅ ${added} missing products added (${missingProducts.length - added} already existed)`);
}
