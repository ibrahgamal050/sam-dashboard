import mongoose from 'mongoose';

const SizeSchema = new mongoose.Schema({
  name: {
    en: { type: String, required: true }, // اسم الحجم بالإنجليزية
    ar: { type: String, required: true }, // اسم الحجم بالعربية
  },
  price: { type: Number, required: true }, // سعر الحجم
});

const menuImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  altText: { type: String, required: true },
 
});
// Define the menu item subdocument schema
const menuItemSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: false, // جعل الاسم باللغة الإنجليزية اختياريًا
      maxlength: [120, 'Name cannot be more than 60 characters in English'],
    },
    ar: {
      type: String,
      required: false, // جعل الاسم باللغة العربية اختياريًا
      maxlength: [120, 'Name cannot be more than 60 characters in Arabic'],
    }
  },
  description: {
    en: {
      type: String,
      required: false,
      maxlength: [500, 'Description cannot be more than 200 characters in English'],
    },
    ar: {
      type: String,
      required: false,
      maxlength: [500, 'Description cannot be more than 200 characters in Arabic'],
    }
  },
  price: {
    type: Number,
   
    min: [0, 'Price cannot be negative'],
  },
  image: {
    type: String,
    default: '/placeholder.svg?height=200&width=300',
  },
  sizes: [SizeSchema]
});


// Define the category schema with embedded menu items
const categorySchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please provide a name for the category in English.'],
      maxlength: [100, 'Category name cannot be more than 30 characters in English'],
    },
    ar: {
      type: String,
      required: [true, 'Please provide a name for the category in Arabic.'],
      maxlength: [100, 'Category name cannot be more than 30 characters in Arabic'],
    }
  },
  description: {
    en: {
      type: String,
      maxlength: [100, 'Description cannot be more than 100 characters in English'],
    },
    ar: {
      type: String,
      maxlength: [100, 'Description cannot be more than 100 characters in Arabic'],
    }
  },
  image: {
    type: String,
    default: '/placeholder-category.svg?height=100&width=100',
  },
  menuItems: [menuItemSchema],
}, {
  timestamps: true,
});

// Define the restaurant schema with embedded categories
const restaurantMenuSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Please provide a restaurant ID.'],
  },
  name: {
    type: String,
    required: [true, 'Please provide a name for the restaurant.'],
    maxlength: [50, 'Restaurant name cannot be more than 50 characters'],
  },
  
  categories: [categorySchema], // Embed categories directly within the restaurant
  menuImages: [menuImageSchema], 
}, {
  timestamps: true,
});

// Create the Restaurant model
const Menu = mongoose.models.Menu || mongoose.model('Menu', restaurantMenuSchema);

export default Menu;
