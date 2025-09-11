import mongoose, { Schema, Model, Document } from 'mongoose';

// Define interfaces for nested structures
interface ISEO {
  title: string;
  description: string;
  keywords: string[];
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: 'website' | 'article' | 'product';
  twitter_card: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
  structured_data: {
    "@context": string;
    "@type": string;
    name: string;
    url: string;
    image: string;
    hasMenu: {
      "@type": string;
      name: string;
      description: string;
      hasMenuSection: Array<{
        "@type": string;
        name: string;
        image: string;
      }>;
    };
  };
}

interface IComponent {
  component_id: string;
  type: string;
  props: Record<string, any>;
  position: number;
}

export interface IPage {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  language: 'en' | 'ar';
  template: boolean;
  isPublished: boolean;
  headerImage: string;
  seo: ISEO;
  components: IComponent[];
  metadata: {
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
  };
}

export interface IPages extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  pages: IPage[];
}

const componentSchema = new Schema<IComponent>({
  component_id: { type: String, required: true },
  type: { type: String, required: true },
  props: { type: Schema.Types.Mixed, required: true },
  position: { type: Number, required: true }
}, { _id: false });

const seoSchema = new Schema<ISEO>({
  
  title: { type: String, required: true, maxlength: 60 },
  description: { type: String, required: true, maxlength: 160 },
  keywords: [{ type: String, maxlength: 50 }],
  og_title: { type: String, required: true, maxlength: 60 },
  og_description: { type: String, required: true, maxlength: 200 },
  og_image: { type: String, required: true },
  og_type: { type: String, required: true, enum: ['website', 'article', 'product'] },
  twitter_card: { type: String, required: true, enum: ['summary', 'summary_large_image', 'app', 'player'] },
  twitter_title: { type: String, required: true, maxlength: 60 },
  twitter_description: { type: String, required: true, maxlength: 200 },
  twitter_image: { type: String, required: true },
  canonical_url: { type: String, required: true },
  structured_data: {
    "@context": { type: String, required: true },
    "@type": { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    image: { type: String, required: true },
    hasMenu: {
      "@type": { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String, required: true },
      hasMenuSection: [{
        "@type": { type: String, required: true },
        name: { type: String, required: true },
        image: { type: String, required: true }
      }]
    }
  },
}, { _id: false });

const PageSchema = new Schema<IPage>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  language: { type: String, enum: ['en', 'ar'], required: true },
  template: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  headerImage: { type: String, default: '/placeholder.svg?height=400&width=800' },
  seo: seoSchema,
  components: [componentSchema],
  metadata: {
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    published_at: { type: Date }
  },
}, { _id: false });

const PagesSchema = new Schema<IPages>({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  pages: [PageSchema],
}, {
  timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' }
});

// Indexes
PagesSchema.index({ restaurantId: 1 });
PagesSchema.index({ 'pages.slug': 1, 'pages.language': 1 });
PagesSchema.index({ 'pages.isPublished': 1 });

// Pre-save middleware
PagesSchema.pre('save', function(next) {
  this.pages.forEach(page => {
    if (page.isPublished && !page.metadata.published_at) {
      page.metadata.published_at = new Date();
    }
  });
  next();
});

// Ensure the model is only compiled once
const Pagesnew: Model<IPages> = mongoose.models.Pagesnew || mongoose.model<IPages>('Pagesnew', PagesSchema);

export default Pagesnew;