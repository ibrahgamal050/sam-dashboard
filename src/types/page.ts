import type { Document, Types } from 'mongoose'

export interface ISEO {
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

export interface IComponent {
  component_id: string;
  
  type: string;
  props: any;
  position: number;
}

export type BuilderSection = {
  id?: string
  key?: string
  type?: string
  position?: number
  layout?: Record<string, any>
  elements?: Array<Record<string, any>>
  [key: string]: any
}

export interface IPage {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  language: 'en' | 'ar';
  template: boolean;
  isPublished: boolean;
  headerImage: string;
  seo: ISEO;
  components: IComponent[];
  sections?: BuilderSection[];
  metadata: {
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
  };
}

export interface IPages extends Document {
  restaurantId: Types.ObjectId;
  subdomain: string;
  pages: IPage[];
}

export type PageMetadata = {
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export type PageDto = Omit<IPage, '_id' | 'metadata'> & {
  _id: string;
  metadata: Partial<PageMetadata>;
}

export type PageApiPayload = Omit<IPage, '_id' | 'metadata'> & {
  _id?: string;
  metadata?: Partial<Record<keyof PageMetadata, string | Date>>;
}
