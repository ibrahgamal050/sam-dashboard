import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

const restaurantData = {
  subdomain: "pizza-el-sultan",
  nameEn: "Pizza El Sultan",
  nameAr: "مطعم بيتزا السلطان",
  cuisineEn: "Italian",
  cuisineAr: "إيطالي",
  hotline: "0222748080",
  locationEn: "City Stars Mall, Nasr City, Cairo, Egypt",
  locationAr: "مول سيتي ستارز، مدينة نصر، القاهرة، مصر"
};


const menuData = {
  "categories": [
    {
      "name": {
        "en": "Pizzas",
        "ar": "البيتزا"
      },
      "menuItems": [
        {
          "name": {
            "en": "Margherita Pizza",
            "ar": "بيتزا مارغريتا"
          },
          "description": {
            "en": "Classic pizza topped with fresh mozzarella and basil.",
            "ar": "بيتزا كلاسيكية مغطاة بالموزاريلا الطازجة والريحان."
          },
          "price": 71,
          "image": ""
        },
        {
          "name": {
            "en": "Pepperoni Pizza",
            "ar": "بيتزا بيبروني"
          },
          "description": {
            "en": "Delicious pizza topped with spicy pepperoni slices.",
            "ar": "بيتزا لذيذة مغطاة بشرائح البيبروني الحارة."
          },
          "price": 80,
          "image": ""
        },
        {
          "name": {
            "en": "Vegetable Pizza",
            "ar": "بيتزا الخضار"
          },
          "description": {
            "en": "A mix of fresh vegetables on a cheesy base.",
            "ar": "مزيج من الخضروات الطازجة على قاعدة جبنية."
          },
          "price": 71,
          "image": ""
        },
        {
          "name": {
            "en": 'Mixed Chicken Pizza',
            'ar': 'بيتزا فراخ مشكل'
          },
          'description': {
              'en': 'Pizza topped with a mix of chicken and spices.',
              'ar': 'بيتزا مغطاة بمزيج من الدجاج والتوابل.'
           },
           'price': 80,
           'image': ''
         }
       ]
     },
     {
       "name": {
         "en": 'Side Dishes',
         'ar': 'الأطباق الجانبية'
       },
       'menuItems': [
         {
           'name': {
             'en': 'Chicken Wings',
             'ar': 'أجنحة الدجاج'
           },
           'description': {},
           'price': 180,
           'image': ''
         },
         {
           'name': {
             'en': 'Caesar Salad',
             'ar': 'سلطة سيزر بالدجاج'
           },
           'description': {},
           'price': 350,
           'image': ''
         }
       ]
     },
     {
       "name": {
         "en": 'Desserts',
         'ar': 'الحلويات'
       },
       menuItems: [
         { 
              name: { 
                  en: `Lotus Cake`, 
                  ar: `كيك لوتس` 
              }, 
              description: {}, 
              price: 60, 
              image: '' 
         }, 
         { 
              name: { 
                  en: `Chocolate Pizza`, 
                  ar: `بيتزا بالشوكولاتة` 
              }, 
              description: {}, 
              price: 85, 
              image: '' 
         } 
       ]
     }
   ]
}





const pagesData = {
    pages: [
        {
          "name": "الرئيسية",
          "slug": "home",
          "language": "ar",
          "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
          "components": [
             { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
            { 
              "component_id": "hero", 
              "type": "hero", 
              "props": { 
                "title": "مرحبًا بكم في مطعمنا", 
                "subtitle": "أفضل تجربة طعام",
                "backgroundImage": `/${restaurantData.subdomain}/logo.jpg`
              }, 
              "position": 1 
            },
             { 
              "component_id": "menu", 
              "type": "menu", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 3
            },
            
            { 
              "component_id": "branch", 
              "type": "branch", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 4
            },
            { 
              "component_id": "footer", 
              "type": "footer", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            }
           
          ]
        },
         {
          "name": "Home",
          "slug": "home",
          "language": "en",
          "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
          "components": [
             { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
            { 
              "component_id": "hero", 
              "type": "hero", 
              "props": { 
                "title": "مرحبًا بكم في مطعمنا", 
                "subtitle": "أفضل تجربة طعام",
                "backgroundImage": `/${restaurantData.subdomain}/logo.jpg`
              }, 
              "position": 1 
            },
             { 
              "component_id": "menu", 
              "type": "menu", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 3
            },
            
            { 
              "component_id": "branch", 
              "type": "branch", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 4
            },
            { 
              "component_id": "footer", 
              "type": "footer", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            }
           
           
          ]
        },
        {
          "name": "عن المطعم",
          "slug": "about",
          "language": "ar",
          "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
          "components": [
             { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
            { 
              "component_id": "about_section", 
              "type": "TextSection", 
              "props": { 
                "title": "عن مطعمنا", 
                "content": "بدأت قصتنا في...",
                "image": `/${restaurantData.subdomain}/logo.jpg`
              }, 
              "position": 1 
            },
            { 
                "component_id": "footer", 
                "type": "footer", 
                "props": { 
                  "text": "مرحبًا بكم في مطعمنا"
                }, 
                "position": 1 
              }
          ]
        },
        {
            "name": "About",
            "slug": "about",
            "language": "en",
            "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
            "components": [
               { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
              { 
                "component_id": "about_section", 
                "type": "TextSection", 
                "props": { 
                  "title": "عن مطعمنا", 
                  "content": "بدأت قصتنا في...",
                  "image": `/${restaurantData.subdomain}/logo.jpg`
                }, 
                "position": 1 
              },
              { 
                "component_id": "footer", 
                "type": "footer", 
                "props": { 
                  "text": "مرحبًا بكم في مطعمنا"
                }, 
                "position": 1 
              }
            ]
          },
        {
          "name": "المنيو",
          "slug": "menu",
          "language": "ar",
          "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
          "seo": {
            "title": "قائمتنا الشهية | اسم مطعمك",
            "description": "استكشف قائمتنا المتنوعة...",
            "keywords": ["قائمة", "مقبلات", "أطباق رئيسية", "حلويات", "اسم مطعمك"],
            "og_title": "اكتشف قائمتنا | اسم مطعمك",
            "og_description": "استمتع بمجموعتنا الرائعة...",
            "og_image": "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
            "og_type": "website",
            "twitter_card": "summary_large_image",
            "twitter_title": "استكشف قائمتنا | اسم مطعمك",
            "twitter_description": "من المقبلات إلى الحلويات...",
            "twitter_image": "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
            "canonical_url": "https://yourrestaurant.com/ar/menu",
            "structured_data": {
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
          "components": [
            { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
            {
              "component_id": "menu_list",
              "type": "MenuList",
              "props": {
                "backgroundImage": `/${restaurantData.subdomain}/logo.jpg`
              },
              "position": 1
            },
            { 
                "component_id": "footer", 
                "type": "footer", 
                "props": { 
                  "text": "مرحبًا بكم في مطعمنا"
                }, 
                "position": 1 
              }
          ]
        },
        {
            "name": "Menu",
            "slug": "menu",
            "language": "en",
            "headerImage": `/${restaurantData.subdomain}/logo.jpg`,
            "seo": {
              "title": "قائمتنا الشهية | اسم مطعمك",
              "description": "استكشف قائمتنا المتنوعة...",
              "keywords": ["قائمة", "مقبلات", "أطباق رئيسية", "حلويات", "اسم مطعمك"],
              "og_title": "اكتشف قائمتنا | اسم مطعمك",
              "og_description": "استمتع بمجموعتنا الرائعة...",
              "og_image": "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
              "og_type": "website",
              "twitter_card": "summary_large_image",
              "twitter_title": "استكشف قائمتنا | اسم مطعمك",
              "twitter_description": "من المقبلات إلى الحلويات...",
              "twitter_image": "https://storage.yandexcloud.net/foodmenu/photos/15280-372x322.jpg",
              "canonical_url": "https://yourrestaurant.com/ar/menu",
              "structured_data": {
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
            "components": [
               { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
              {
                "component_id": "menu_list",
                "type": "MenuList",
                "props": {
                  "backgroundImage": `/${restaurantData.subdomain}/logo.jpg`
                },
                "position": 1
              },
              { 
                "component_id": "footer", 
                "type": "footer", 
                "props": { 
                  "text": "مرحبًا بكم في مطعمنا"
                }, 
                "position": 1 
              }
            ]
          },
       {
      "name": "الفروع",
      "slug": "branches",
      "language": "ar",
      "components": [
         { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
        {
          "component_id": "branches_map",
          "type": "Map",
          "props": {
            "backgroundImage":`/${restaurantData.subdomain}/logo.jpg`
          },
          "position": 1
        },
        { 
            "component_id": "footer", 
            "type": "footer", 
            "props": { 
              "text": "مرحبًا بكم في مطعمنا"
            }, 
            "position": 1 
          }
      ]
    },
    {
        "name": "branches",
        "slug": "branches",
        "language": "en",
        "components": [
           { 
              "component_id": "header", 
              "type": "header", 
              "props": { 
                "text": "مرحبًا بكم في مطعمنا"
              }, 
              "position": 1 
            },
          {
            "component_id": "branches_map",
            "type": "Map",
            "props": {
              "backgroundImage":`/${restaurantData.subdomain}/logo.jpg`
            },
            "position": 1
          },
          { 
            "component_id": "footer", 
            "type": "footer", 
            "props": { 
              "text": "مرحبًا بكم في مطعمنا"
            }, 
            "position": 1 
          }
        ]
      }
    
      ]
};

const branchesData = {
  restaurantName:restaurantData.nameEn ,
  branches: [
    {
      "nameEn": "City Stars",
      "nameAr": "سيتي ستارز",
      "address": "مول سيتي ستارز، مدينة نصر، القاهرة، مصر.",
      "image": `/${restaurantData.subdomain}/logo.jpg`,
      "mapurl": "https://maps.app.goo.gl/placeholder",
      "slug": "city-stars"
    },
    {
      "nameEn": "Heliopolis",
      "nameAr": "مصر الجديدة",
      "address": "شارع الميرغني، أمام مستشفى هليوبوليس، مصر الجديدة، القاهرة.",
      "image": `/${restaurantData.subdomain}/logo.jpg`,
      "mapurl": "https://maps.app.goo.gl/placeholder",
      "slug": "heliopolis"
    }
]



};

async function makeRequest(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const responseData = await response.json();
    console.log(`Data added successfully to ${endpoint}:`, responseData);
    return responseData;
  } catch (error) {
    console.error(`Error adding data to ${endpoint}:`, error);
  }
}


// Call the function and log the result


async function main() {
  /**
  try {
    const response = await fetch('http://localhost:3000/api/restaurants', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const restaurants = await response.json();

    if (!Array.isArray(restaurants) || restaurants.length === 0) {
      console.log('No restaurants found');
      return [];
    }

    console.log('Restaurant subdomains:');
    const subdomains = [];

    for (const [index, restaurant] of restaurants.entries()) {
      const subdomain = restaurant.subdomain;
      subdomains.push(subdomain);
      console.log(`${index + 1}. ${subdomain}`);

      try {
        await makeRequest(`/${subdomain}/pages`, pagesData);
        console.log(`Pages data added successfully for ${subdomain}`);
      } catch (error) {
        console.error(`Error adding pages data for ${subdomain}:`, error);
      }
    }

    return subdomains;
  } catch (error) {
    console.error('Error fetching restaurant data:', error);
    return [];
  }
**/
  
  
 await makeRequest('/restaurants', restaurantData);
 await makeRequest(`/${restaurantData.subdomain}/pages`, pagesData);
  await makeRequest(`/${restaurantData.subdomain}/branches`, branchesData);
 await makeRequest(`/${restaurantData.subdomain}/menu`, menuData);
}

main();