import mongoose, { Document, Schema } from 'mongoose';

export interface IBranch {
  nameEn: string;
  nameAr: string;
  address: string;
  image: string;
  mapurl: string;
  slug: string;
}

export interface IBranches extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  branches: IBranch[];
}

const BranchSchema: Schema = new Schema({
  nameEn: {
    type: String,
    required: [true, 'Branch name in English is required'],
    trim: true
  },
  nameAr: {
    type: String,
    required: [true, 'Branch name in Arabic is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Branch address is required'],
    trim: true,
    maxlength: [200, 'Branch address cannot be more than 200 characters']
  },
  image: {
    type: String,
    required: [true, 'Branch image URL is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Branch slug is required'],
    trim: true
  },
  mapurl: {
    type: String,
    required: [true, 'Branch URL is required'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }
});

const BranchesSchema: Schema = new Schema({
  restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  branches: [BranchSchema]
}, {
  timestamps: true
});

// Remove the unique index on the slug field
BranchesSchema.index({ restaurantId: 1}, { unique: false });

const Branches = mongoose.models.Branches || mongoose.model<IBranches>('Branches', BranchesSchema);

export default Branches;