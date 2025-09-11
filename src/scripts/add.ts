import mongoose from 'mongoose';
import { config } from 'dotenv';
import Restaurant, { IRestaurant } from '../models/Restaurant';
import Pagesnew, { IPages, IPage } from '../models/Pagenew';

// Load environment variables
config();

async function addOrUpdateRestaurant(restaurantData: Partial<IRestaurant>) {
  try {
    const existingRestaurant = await Restaurant.findOne({ subdomain: restaurantData.subdomain });
    
    if (existingRestaurant) {
      // Update existing restaurant
      Object.assign(existingRestaurant, restaurantData);
      await existingRestaurant.save();
      console.log(`Restaurant "${existingRestaurant.nameEn}" updated successfully.`);
      return existingRestaurant;
    } else {
      // Add new restaurant
      const newRestaurant = new Restaurant(restaurantData);
      await newRestaurant.save();
      console.log(`Restaurant "${newRestaurant.nameEn}" added successfully.`);
      return newRestaurant;
    }
  } catch (error) {
    console.error('Error adding/updating restaurant:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function addOrUpdatePages(restaurantId: mongoose.Types.ObjectId, pagesData: { name: string, pages: Partial<IPage>[] }) {
  try {
    const existingPages = await Pagesnew.findOne({ restaurantId });
    
    if (existingPages) {
      // Update existing pages
      existingPages.name = pagesData.name;
      existingPages.pages = pagesData.pages as IPage[];
      await existingPages.save();
      console.log(`Pages for restaurant "${pagesData.name}" updated successfully.`);
      return existingPages;
    } else {
      // Add new pages
      const newPages = new Pagesnew({
        restaurantId,
        name: pagesData.name,
        pages: pagesData.pages
      });
      await newPages.save();
      console.log(`Pages for restaurant "${pagesData.name}" added successfully.`);
      return newPages;
    }
  } catch (error) {
    console.error('Error adding/updating pages:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log('Connected to MongoDB');

    // Sample restaurant data
    const restaurantData: Partial<IRestaurant> = {
      subdomain: "hamadasheraton",
      nameEn: "Hamada Sheraton",
      nameAr: "حمادة شيراتون",
      cuisineEn: "Egyptian",
      cuisineAr: "مصري",
      hotline: "0222748080",
      locationEn: "Cairo, Egypt",
      locationAr: "القاهرة، مصر"
    };

    const restaurant = await addOrUpdateRestaurant(restaurantData);

    // Sample pages data
    const pagesData: { name: string, pages: Partial<IPage>[] } = {
      name: restaurant.nameEn,
      pages: [
        {
          _id: new mongoose.Types.ObjectId(),
          name: "الرئيسية",
          slug: "home",
          language: "ar",
          template: false,
          isPublished: true,
          headerImage: "/hadramotantar/logo.jpg",
          seo: {
            title: "الصفحة الرئيسية",
            description: "وصف الصفحة الرئيسية",
            keywords: ["مطعم", "طعام", "وجبات"],
            og_title: "الصفحة الرئيسية",
            og_description: "وصف الصفحة الرئيسية للشبكات الاجتماعية",
            og_image: "/hadramotantar/logo.jpg",
            og_type: "website",
            twitter_card: "summary",
            twitter_title: "الصفحة الرئيسية",
            twitter_description: "وصف الصفحة الرئيسية لتويتر",
            twitter_image: "/hadramotantar/logo.jpg",
            canonical_url: "https://example.com/ar",
            structured_data: {
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "اسم المطعم",
              "url": "https://example.com/ar",
              "image": "/hadramotantar/logo.jpg",
              "hasMenu": {
                "@type": "Menu",
                "name": "قائمتنا",
                "description": "استكشف قائمتنا المتنوعة",
                "hasMenuSection": [
                  {
                    "@type": "MenuSection",
                    "name": "المقبلات",
                    "image": "/hadramotantar/appetizers.jpg"
                  }
                ]
              }
            }
          },
          components: [
            { 
              component_id: "hero", 
              type: "hero", 
              props: { 
                title: "مرحبًا بكم في مطعمنا", 
                subtitle: "أفضل تجربة طعام",
                backgroundImage: "/hadramotantar/logo.jpg"
              }, 
              position: 1 
            },
            { 
              component_id: "about", 
              type: "about", 
              props: { 
                text: "نحن نقدم أشهى الأطباق المصرية التقليدية في أجواء مريحة وودية."
              }, 
              position: 2 
            },
            { 
              component_id: "menu", 
              type: "menu", 
              props: { 
                title: "قائمتنا",
                description: "استمتع بمجموعة متنوعة من الأطباق الشهية"
              }, 
              position: 3 
            },
            { 
              component_id: "contact", 
              type: "contact", 
              props: { 
                title: "اتصل بنا",
                phone: "0222748080",
                email: "info@hamadasheraton.com",
                address: "القاهرة، مصر"
              }, 
              position: 4 
            }
          ],
          metadata: {
            created_at: new Date(),
            updated_at: new Date(),
            published_at: new Date()
          }
        }
      ]
    };

    // Add pages for the restaurant
    await addOrUpdatePages(restaurant._id, pagesData);

  } catch (error) {
    console.error('An error occurred:', error instanceof Error ? error.message : String(error));
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the main function
main();