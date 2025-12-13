import mongoose, { Schema, Model, Document } from 'mongoose';
import {IComponent,ISEO,IPage,IPages } from "@/types/page"

const componentSchema = new Schema<IComponent>({
  component_id: { type: String, required: true },
  type: { type: String, required: true },
  props: { type: Schema.Types.Mixed, required: true },
  position: { type: Number, required: true }
});

const seoSchema = new Schema<ISEO>({
  
  title: { type: String, required: true },
  description: { type: String, required: true},
  keywords: [{ type: String,}],
  og_title: { type: String, required: true, },
  og_description: { type: String, required: true, },
  og_image: { type: String, required: true },
  og_type: { type: String, required: true, enum: ['website', 'article', 'product'] },
  twitter_card: { type: String, required: true, enum: ['summary', 'summary_large_image', 'app', 'player'] },
  twitter_title: { type: String, required: true},
  twitter_description: { type: String, required: true },
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
});

const PageSchema = new Schema<IPage>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  language: { type: String, enum: ['en', 'ar'], required: true },
  template: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  headerImage: { type: String, default: '/placeholder.svg?height=400&width=800' },
  seo: seoSchema,
  components: { type: [componentSchema], default: [] },
  sections: { type: [Schema.Types.Mixed], default: undefined },
  metadata: {
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    published_at: { type: Date }
  },
});

const PagesSchema = new Schema<IPages>({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  subdomain: {
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
const Pages: Model<IPages> = mongoose.models.Pages || mongoose.model<IPages>('Pages', PagesSchema);

export default Pages;
