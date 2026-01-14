import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to database');

    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      console.log('\n=== ADMIN CREDENTIALS ===');
      console.log('Email:', admin.email);
      console.log('Current Password: Check with admin or reset below');
      
      // Reset password to default
      const newPassword = 'Admin@123';
      admin.password = newPassword;
      await admin.save();
      
      console.log('\n✅ Password has been reset to:', newPassword);
      console.log('\n⚠️  Please change this password after login!');
      console.log('========================\n');
    } else {
      console.log('No admin user found. Creating new admin...');
      
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'admin@triveni.com',
        password: 'Admin@123',
        role: 'admin'
      });
      
      console.log('\n=== NEW ADMIN CREATED ===');
      console.log('Email:', newAdmin.email);
      console.log('Password: Admin@123');
      console.log('========================\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
