import Page from '@/models/Pagenew';

const createArabicPagesForRestaurant = async (restaurantId) => {
  const arabicPages = [
    {
      name: "الرئيسية",
      slug: "home",
      language: "ar",
      headerImage: "/citycrepe/logo.jpg",
      components: [
        { 
          component_id: "Home", 
          type: "Home", 
          props: { 
            title: "مرحبًا بكم في مطعمنا", 
            subtitle: "أفضل تجربة طعام",
            backgroundImage: "/citycrepe/logo.jpg"
          }, 
          position: 1 
        }
      ]
    },
    {
      name: "عن المطعم",
      slug: "about",
      language: "ar",
      headerImage: "/citycrepe/logo.jpg",
      components: [
        { 
          component_id: "about_section", 
          type: "TextSection", 
          props: { 
            title: "عن مطعمنا", 
            content: "بدأت قصتنا في...",
            image: "/citycrepe/logo.jpg"
          }, 
          position: 1 
        }
      ]
    },
    {
      name: "القائمة",
      slug: "menu",
      language: "ar",
      headerImage: "/citycrepe/logo.jpg",
      seo: {
        title: "قائمتنا الشهية | اسم مطعمك",
        description: "استكشف قائمتنا المتنوعة...",
        keywords: ["قائمة", "مقبلات", "أطباق رئيسية", "حلويات", "اسم مطعمك"],
        og_title: "اكتشف قائمتنا | اسم مطعمك",
        og_description: "استمتع بمجموعتنا الرائعة...",
        og_image: "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
        og_type: "website",
        twitter_card: "summary_large_image",
        twitter_title: "استكشف قائمتنا | اسم مطعمك",
        twitter_description: "من المقبلات إلى الحلويات...",
        twitter_image: "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
        canonical_url: "https://yourrestaurant.com/ar/menu",
        structured_data: {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "اسم مطعمك",
          "url": "https://yourrestaurant.com/ar",
          "image": "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
          "hasMenu": {
            "@type": "Menu",
            "name": "قائمتنا",
            "description": "استكشف قائمتنا المتنوعة...",
            "hasMenuSection": [
              { "@type": "MenuSection", "name": "المقبلات", "image": "https://storage.yandexcloud.net/foodmenu/photos/File8.jpg" },
              { "@type": "MenuSection", "name": "الأطباق الرئيسية", "image": "https://storage.yandexcloud.net/foodmenu/photos/File8.jpg" },
              { "@type": "MenuSection", "name": "الحلويات", "image": "https://storage.yandexcloud.net/foodmenu/photos/File8.jpg" }
            ]
          }
        }
      },
      components: [
        {
          component_id: "menu_list",
          type: "MenuList",
          props: {
            backgroundImage: "/citycrepe/logo.jpg"
          },
          position: 1
        }
      ]
    },
    {
      name: "الفروع",
      slug: "branches",
      language: "ar",
      headerImage: "/citycrepe/logo.jpg",
      components: [
        {
          component_id: "branches_map",
          type: "Map",
          props: {
            backgroundImage: "/citycrepe/logo.jpg"
          },
          position: 1
        }
      ]
    }
  ];

  try {
    const pages = arabicPages.map((page) => ({
      name: page.name,
      slug: page.slug,
      language: page.language,
      headerImage: page.headerImage,
      restaurantId,
      template: false,
      seo: page.seo || {},
      components: page.components,
      metadata: {
        created_at: Date.now(),
        updated_at: Date.now(),
      }
    }));

    // Insert the Arabic pages into the Page collection
    await Page.insertMany(pages);

    console.log(`Arabic pages created successfully for restaurant ${restaurantId}!`);
  } catch (error) {
    console.error('Error creating Arabic pages:', error);
    throw error; // Re-throw the error for the caller to handle
  }
};

// Example usage
const restaurantId = 'citycrepe123';
createArabicPagesForRestaurant(restaurantId)
  .then(() => console.log('Arabic pages created successfully'))
  .catch((error) => console.error('Error:', error));

// If you want to run this script, uncomment the following lines:
// import mongoose from 'mongoose';
// mongoose.connect('your_mongodb_connection_string_here')
//   .then(() => {
//     console.log('Connected to MongoDB');
//     return createArabicPagesForRestaurant(restaurantId);
//   })
//   .then(() => {
//     console.log('Script completed successfully');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Script failed:', error);
//     process.exit(1);
//   });