import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME || !ADMIN_PHONE) {
  console.error('Missing admin env variables. Set ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME and ADMIN_PHONE in .env');
  process.exit(1);
}

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL} (role: ${existing.role})`);
    await mongooseConnectionClose();
    return;
  }

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    phone: ADMIN_PHONE,
    password: ADMIN_PASSWORD,
    role: 'admin',
  });

  console.log(`Admin created:`);
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log('  Role:     admin');

  await mongooseConnectionClose();
}

async function mongooseConnectionClose() {
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect();
}

seedAdmin();