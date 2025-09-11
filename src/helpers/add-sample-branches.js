import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branches from '../models/branches.ts';
import Restaurant from '../models/Restaurant.ts';

dotenv.config();

const MONGODB_URI = process.env.local.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable');
  process.exit(1);
}

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function addSampleBranches() {
  try {
    await connectToDatabase();

    // Find or create a sample restaurant
    let restaurant = await Restaurant.findOne({ nameEn: "Hadramout Anbar" });
    if (!restaurant) {
      
      console.log('Sample restaurant created');
    }

    const newBranches = new Branches({
      restaurantId: restaurant._id,
      name: restaurant.nameEn,
      branches: [
        {
          nameEn: "Al Tagamoa Branch",
          nameAr: "فرع التجمع",
          address: "التجمع",
          image: "/placeholder.svg?height=200&width=200",
          mapurl: "https://maps.google.com",
          slug: "al-tagamoa"
        },
        {
          nameEn: "Gesr El Suez Branch",
          nameAr: "فرع جسر السويس",
          address: "جسر السويس",
          image: "/placeholder.svg?height=200&width=200",
          mapurl: "https://maps.google.com",
          slug: "gesr-el-suez"
        },
        {
          nameEn: "El Obour Branch",
          nameAr: "فرع العبور",
          address: "العبور",
          image: "/placeholder.svg?height=200&width=200",
          mapurl: "https://maps.google.com",
          slug: "el-obour"
        }
      ]
    });

    await newBranches.save();
    console.log('Branches added successfully');

  } catch (error) {
    console.error('Error adding branches:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

addSampleBranches();