import mongoose, { Schema, Document } from 'mongoose';

interface IRestaurant extends Document {
  nameEn: string;
  nameAr: string;
  subdomain: string;
  cuisineEn: string;
  cuisineAr: string;
  locationEn: string;
  locationAr: string;
  url: string;
  logo: string;
  coverImage: string;
  hotline: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  settings?: Record<string, unknown>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const generateUniqueUrl = async function(name: string): Promise<string> {
    const baseUrl = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    let uniqueUrl = baseUrl;
    let counter = 1;

    while (await mongoose.models.Restaurant.findOne({ url: uniqueUrl })) {
        uniqueUrl = `${baseUrl}-${counter++}`;
    }
    
    return uniqueUrl;
};

const generateUniqueSubdomain = async function(name: string): Promise<string> {
    const baseSubdomain = name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]+/g, '');
    let uniqueSubdomain = baseSubdomain;
    let counter = 1;

    while (await mongoose.models.Restaurant.findOne({ subdomain: uniqueSubdomain })) {
        uniqueSubdomain = `${baseSubdomain}${counter++}`;
    }
    
    return uniqueSubdomain;
};

const restaurantSchema = new Schema({
    nameEn: {
        type: String,
        required: true,
        trim: true
    },
    nameAr: {
        type: String,
        required: true,
        trim: true
    },
    subdomain: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    cuisineEn: {
        type: String,
        required: true,
        trim: true
    },
    cuisineAr: {
        type: String,
        required: true,
        trim: true
    },
    locationEn: {
        type: String,
        required: true,
        trim: true
    },
    locationAr: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        type: String,
        default: '/placeholder.svg?height=100&width=100'
    },
    contactEmail: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    settings: {
        type: Schema.Types.Mixed,
        default: {}
    },
    hotline: {
        type: String,
        default: '55555'
    },
    themeColor: {
        type: String,
        default: '#000000'
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

restaurantSchema.pre<IRestaurant>('save', async function(next) {
    if (!this.url) {
        this.url = await generateUniqueUrl(this.nameEn);
    }
    if (!this.subdomain) {
        this.subdomain = await generateUniqueSubdomain(this.nameEn);
    }
    next();
});

const Restaurant = mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', restaurantSchema);

export default Restaurant;
