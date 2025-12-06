import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://atif:jjjjjjjj@cluster0.c97s5.mongodb.net/chainvanguard');

    // Find an expert user
    const expert = await User.findOne({ role: 'expert' }).lean();
    if (!expert) {
      console.log('❌ No expert user found');
      process.exit(1);
    }

    console.log('✅ Found expert:', expert.email, expert.walletAddress);

    // Generate JWT token
    const token = jwt.sign(
      { userId: expert._id, email: expert.email, role: expert.role },
      process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Expert Token:');
    console.log(token);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
