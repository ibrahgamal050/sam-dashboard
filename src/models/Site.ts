import mongoose, { Schema, Document, Model } from 'mongoose';

// Define interfaces for Page and Site documents
interface IPage extends Document {
  path: string;
  content: string;
}

interface ISite extends Document {
  siteId: string;
  title: string;
  pages: IPage[];
}

// تعريف نموذج الصفحة
const pageSchema = new Schema<IPage>({
  path: { type: String, required: true },
  content: { type: String, required: true }
});

// تعريف نموذج الموقع
const siteSchema = new Schema<ISite>({
  siteId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  pages: [pageSchema]
});

// إنشاء نموذج الموقع
const Site: Model<ISite> = mongoose.models.Site || mongoose.model<ISite>('Site', siteSchema);

export default Site;