import fs from 'fs/promises';

async function processMenuData(arData, enData, outputFilePath) {
  try {
    console.log('Processing menu data...');
    
    // Validate data structure
    console.log('Validating data structure...');
    if (!Array.isArray(arData.categories) || !Array.isArray(enData.categories)) {
      throw new Error('Invalid data structure: categories is not an array');
    }

    const processedMenu = {
      categories: []
    };

    // Create a map of English categories by ID for easier lookup
    const enCategoriesMap = {};
    enData.categories.forEach(category => {
      enCategoriesMap[category.id] = category;
      
      // Also create a map of items by index for this category
      if (Array.isArray(category.items)) {
        category.itemsMap = {};
        category.items.forEach((item, index) => {
          category.itemsMap[index] = item;
        });
      }
    });

    console.log('Processing menu categories...');
    arData.categories.forEach((arCategory) => {
      // Find matching English category by ID
      const enCategory = enCategoriesMap[arCategory.id] || { name: 'Missing English Category', items: [] };
      
      const processedCategory = {
        name: { 
          en: enCategory.name || 'Missing English Name', 
          ar: arCategory.name || 'Missing Arabic Name' 
        },
        menuItems: []
      };

      if (Array.isArray(arCategory.items)) {
        arCategory.items.forEach((arItem, itemIndex) => {
          // Find corresponding English item - first try by index, then by ID if available
          let enItem = enCategory.itemsMap ? enCategory.itemsMap[itemIndex] : undefined;
          
          // If no English item found by index, try to find by ID
          if (!enItem && Array.isArray(enCategory.items)) {
            enItem = enCategory.items.find(item => item.id === arItem.id);
          }
          
          // If still no match, use a placeholder
          if (!enItem) {
            enItem = { 
              name: `Missing English Name for ${arItem.name}`, 
              description: '' 
            };
          }

          const processedItem = {
            name: { 
              en: enItem.name || 'Missing English Name', 
              ar: arItem.name || 'Missing Arabic Name' 
            },
            description: { 
              en: enItem.description || '', 
              ar: arItem.description || '' 
            },
            price: arItem.price || 0,
            image: arItem.image || "",
          };

          processedCategory.menuItems.push(processedItem);
        });
      } else {
        console.warn(`Missing items for category ${arCategory.name}`);
      }

      processedMenu.categories.push(processedCategory);
    });

    if (outputFilePath) {
      console.log('Saving processed menu data to file...');
      await fs.writeFile(outputFilePath, JSON.stringify(processedMenu, null, 2), 'utf8');
      console.log(`Processed menu data saved to ${outputFilePath}`);
    }

    console.log('Menu data processing completed successfully.');
    return processedMenu;
  } catch (error) {
    console.error('Error processing menu data:', error);
    throw error;
  }
}

// Use the sample data from your original script
const arData = {
  categories: [
    {
        "id": 1,
        "name": "🔥 الأكثر مبيعًا",
        "branch_id": 3197,
        "items": [
            {
                "id": 43263766,
                "name": "بيتزا وسط",
                "calories": 1075,
                "price": "17.0",
                "group_id": 1,
                "description": "بيتزا خضار وسط",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/a94092c6ddb4a3f8cd897daf0646c2e4?width=222"
            },
            {
                "id": 89979,
                "name": "فطيرة جبنة عكاوي",
                "calories": 537,
                "price": "6.75",
                "group_id": 1,
                "description": "فطيرة محشية بالجبن العكاوي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89979?width=222"
            },
            {
                "id": 39011975,
                "name": "عش البلبل - وسط",
                "calories": 1182,
                "price": "17.0",
                "group_id": 1,
                "description": "عجينة مغطاة بالجبن واللبنة والعسل",
                "image": null
            },
            {
                "id": 89987,
                "name": "فطيرة لبنة بالعسل",
                "calories": 721,
                "price": "6.75",
                "group_id": 1,
                "description": "عجينة الفطائر اللذيذة بحشوة اللبنة الطازجة والعسل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89987?width=222"
            }
        ]
    },
    {
        "id": 55552,
        "name": "الشاورما",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812342,
                "name": "سندوتش شاورما",
                "calories": 265,
                "price": "6.75",
                "group_id": 55552,
                "description": "ساندويتش محشو بقطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-1812342?width=222"
            },
            {
                "id": 1812343,
                "name": "صاروخ شاورما",
                "calories": 310,
                "price": "13.0",
                "group_id": 55552,
                "description": "قطع طرية من الشاورما المتبل المحمص ومحشو في الخبز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812343?width=222"
            },
            {
                "id": 1812345,
                "name": "شاورما  خبز فرنسي",
                "calories": 265,
                "price": "13.5",
                "group_id": 55552,
                "description": "ساندويتش محشو بقطع الشاورما المتبلة بخبز الفرنسي اللذيذ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812345?width=222"
            },
            {
                "id": 1812336,
                "name": "صحن شاورما .",
                "calories": 265,
                "price": "17.0",
                "group_id": 55552,
                "description": "قطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812336?width=222"
            },
            {
                "id": 1812337,
                "name": "صحن شاورما ..",
                "calories": 265,
                "price": "25.0",
                "group_id": 55552,
                "description": "قطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812337?width=222"
            },
            {
                "id": 1812338,
                "name": "صحن شاورما",
                "calories": null,
                "price": "35.0",
                "group_id": 55552,
                "description": "قطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812338?width=222"
            },
            {
                "id": 33503317,
                "name": "صحن شاورما عربي",
                "calories": null,
                "price": "55.0",
                "group_id": 55552,
                "description": "صحن شاورما عربي  مقاس عائلي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/e80aef62e348b42a873b387a25b4dd95?width=222"
            },
            {
                "id": 1812365,
                "name": "وجبة الشاورما العربي كبير",
                "calories": null,
                "price": "45.0",
                "group_id": 55552,
                "description": "ساندويتش محشو بقطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812365?width=222"
            },
            {
                "id": 1812341,
                "name": "الوجبة الشاورما العربي",
                "calories": 265,
                "price": "35.0",
                "group_id": 55552,
                "description": "قطع طرية من الدجاج المتبل المحمص ومحشو في الخبز يقدم مع البطاطس المقلية و الصوصات اللذيذة و المخلل ، كبير",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812341?width=222"
            },
            {
                "id": 1812340,
                "name": "الوجبة الشاورما العربي..",
                "calories": 265,
                "price": "26.0",
                "group_id": 55552,
                "description": "قطع طرية من الدجاج المتبل المحمص ومحشو في الخبز يقدم مع البطاطس المقلية و الصوصات اللذيذة و المخلل ، وسط",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812340?width=222"
            },
            {
                "id": 1812339,
                "name": "وجبة شاورما العربي",
                "calories": 265,
                "price": "17.0",
                "group_id": 55552,
                "description": "ساندويتش محشو بقطع الشاورما المتبلة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812339?width=222"
            },
            {
                "id": 29658776,
                "name": "فطيرة شاورما",
                "calories": 730,
                "price": "15.0",
                "group_id": 55552,
                "description": "عجينة الفطائر الشهية محشوة بقطع  الشاورم",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/9174a1fd2ce2706e10b3f3ec9b2ec0ea?width=222"
            }
        ]
    },
    {
        "id": 12725,
        "name": "الفطائر",
        "branch_id": 3197,
        "items": [
            {
                "id": 29659222,
                "name": "صحن فطائر مشكل. - وسط",
                "calories": 4500,
                "price": "45.0",
                "group_id": 12725,
                "description": "تشكيلة من الفطائر المحمصة بعناية بالحشوة الشهية",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/905011?width=1920"
            },
            {
                "id": 29659223,
                "name": "صحن فطائر مشكل - كبير",
                "calories": 5500,
                "price": "55.0",
                "group_id": 12725,
                "description": "تشكيلة من الفطائر المحمصة بعناية بالحشوة الشهية",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/905012?width=1920"
            },
            {
                "id": 33503318,
                "name": "فطائر مشكلة",
                "calories": 9500,
                "price": "65.0",
                "group_id": 12725,
                "description": "صحن فطائر حجم عائلي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/33503318?width=222"
            },
            {
                "id": 29815240,
                "name": "صحن فطائر",
                "calories": 3500,
                "price": "35.0",
                "group_id": 12725,
                "description": "فطائر بعجينة هشة ولذيذة مع حشوات مختلفة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/29815240?width=222"
            },
            {
                "id": 29815243,
                "name": "عرائس جبن سائل",
                "calories": 545,
                "price": "10.0",
                "group_id": 12725,
                "description": "عرائس محشوه بالجبن السائل والموزريلا الشهية",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/8829e418debc45f8209c707dc65e2d07?width=222"
            },
            {
                "id": 29815242,
                "name": "فطيرة كودو",
                "calories": 529,
                "price": "13.75",
                "group_id": 12725,
                "description": "فطيرة محشوه بحميس الدجاج مع الصوصات والبهارات اللذيذ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/4ee9508bf19a9f620a397ec3b27d1c85?width=222"
            },
            {
                "id": 89973,
                "name": "فطيرة جبنة سائلة",
                "calories": 454,
                "price": "6.75",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبن السائل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89973?width=222"
            },
            {
                "id": 89975,
                "name": "فطيرة لبنة",
                "calories": 529,
                "price": "6.75",
                "group_id": 12725,
                "description": "فطيرة محشية باللبنة الطازجة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89975?width=222"
            },
            {
                "id": 89979,
                "name": "فطيرة جبنة عكاوي",
                "calories": 537,
                "price": "6.75",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبن العكاوي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89979?width=222"
            },
            {
                "id": 478295,
                "name": "فطيرة جبن محمرة",
                "calories": 600,
                "price": "7.5",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبن",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/478295?width=222"
            },
            {
                "id": 89970,
                "name": "فطيرة عرايس دجاج",
                "calories": null,
                "price": "9.0",
                "group_id": 12725,
                "description": "",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89970?width=222"
            },
            {
                "id": 89971,
                "name": "فطيرة عرايس لحم",
                "calories": 625,
                "price": "9.0",
                "group_id": 12725,
                "description": "خبز مشوي محشي بحشوات خاصة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89971?width=222"
            },
            {
                "id": 89972,
                "name": "فطيرة سبانخ",
                "calories": 455,
                "price": "6.0",
                "group_id": 12725,
                "description": "فطيرة بحشوة السبانخ الشهية",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89972?width=222"
            },
            {
                "id": 89974,
                "name": "فطيرة لحم",
                "calories": 652,
                "price": "7.5",
                "group_id": 12725,
                "description": "فطيرة محشية باللحم اللذيذ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89974?width=222"
            },
            {
                "id": 89976,
                "name": "فطيرة بيض",
                "calories": 601,
                "price": "5.99",
                "group_id": 12725,
                "description": "فطيرة محشية بالبيض اللذيذ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-731975?width=222"
            },
            {
                "id": 89978,
                "name": "فطيرة دجاج",
                "calories": 414,
                "price": "6.75",
                "group_id": 12725,
                "description": "فطيرة محشية بقطع الدجاج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89978?width=222"
            },
            {
                "id": 89980,
                "name": "فطيرة بطاطس",
                "calories": 395,
                "price": "6.0",
                "group_id": 12725,
                "description": "عجينة بحشوة البطاطس اللذيذ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89980?width=222"
            },
            {
                "id": 89982,
                "name": "فطيرة بطاطس محمرة",
                "calories": 519,
                "price": "6.0",
                "group_id": 12725,
                "description": "بطاطس محمرة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89982?width=222"
            },
            {
                "id": 89983,
                "name": "فطيرة فلافل",
                "calories": 454,
                "price": "9.75",
                "group_id": 12725,
                "description": "عجينة الفطائر الهشة المحضرة على طريقتنا بحشوة فلافل مشكل خضار وصوص",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89983?width=222"
            },
            {
                "id": 89984,
                "name": "فطيرة خضروات",
                "calories": 521,
                "price": "6.5",
                "group_id": 12725,
                "description": "عجينة بحشوة الخضار مع البهارات اللذيذة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89984?width=222"
            },
            {
                "id": 89985,
                "name": "فطيرة جبن قشقوان",
                "calories": 485,
                "price": "8.5",
                "group_id": 12725,
                "description": "عجينة بحشوة الجبن محضرة على طريقتنا الخاصة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89985?width=222"
            },
            {
                "id": 89986,
                "name": "فطيرة لبنة بالزعتر",
                "calories": 547,
                "price": "6.75",
                "group_id": 12725,
                "description": "لبنة مع الزعتر",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89986?width=222"
            },
            {
                "id": 89987,
                "name": "فطيرة لبنة بالعسل",
                "calories": 721,
                "price": "6.75",
                "group_id": 12725,
                "description": "عجينة الفطائر اللذيذة بحشوة اللبنة الطازجة والعسل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89987?width=222"
            },
            {
                "id": 89988,
                "name": "فطيرة جبنة بالزعتر",
                "calories": 491,
                "price": "7.0",
                "group_id": 12725,
                "description": "الفطيرة المحضرة على الطريقة الخاصة بالحشوة الشهية",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89988?width=222"
            },
            {
                "id": 89990,
                "name": "فطيرة جبنة بالزيتون",
                "calories": 491,
                "price": "6.5",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبنة مع الزيتون",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/9280058a5549cb975c695e5a79ce4d88.jfif?width=222"
            },
            {
                "id": 89991,
                "name": "فطيرة جبنة بالسبانخ",
                "calories": 501,
                "price": "7.0",
                "group_id": 12725,
                "description": "فطيرة محشية بالسبانخ مع الجبنة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89991?width=222"
            },
            {
                "id": 89993,
                "name": "فطيرة لبنة بالسبانخ",
                "calories": 477,
                "price": "6.5",
                "group_id": 12725,
                "description": "لبنة سبانخ",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89993?width=222"
            },
            {
                "id": 89994,
                "name": "فطيرة جبنة بالمشروم",
                "calories": 490,
                "price": "7.0",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبنة مع المشروم",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89994?width=222"
            },
            {
                "id": 89995,
                "name": "فطيرة جبنة بالطماطم",
                "calories": 485,
                "price": "7.0",
                "group_id": 12725,
                "description": "فطيرة محشية بالجبنة مع الطماطم الطازجة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89995?width=222"
            },
            {
                "id": 89997,
                "name": "فطيرة لحم بالجبنة",
                "calories": 773,
                "price": "8.5",
                "group_id": 12725,
                "description": "لحم بالجبن",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89997?width=222"
            },
            {
                "id": 89998,
                "name": "فطيرة دجاج بالجبنة",
                "calories": 678,
                "price": "8.5",
                "group_id": 12725,
                "description": "دجاج بالجبن",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89998?width=222"
            },
            {
                "id": 89999,
                "name": "فطيرة محمرة بالزعتر",
                "calories": 480,
                "price": "6.0",
                "group_id": 12725,
                "description": "فطيرة المحمرة المحضرة على طريقتنا الخاصة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89999?width=222"
            },
            {
                "id": 90000,
                "name": "فطيرة بيض بالجبنة الدائرية",
                "calories": 458,
                "price": "6.0",
                "group_id": 12725,
                "description": "بيض بالجبن",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-11434482?width=222"
            },
            {
                "id": 90002,
                "name": "فطيرة جبنة حلوم",
                "calories": 655,
                "price": "8.0",
                "group_id": 12725,
                "description": "فطيرة محشية بجبنة الحلوم",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/90002?width=222"
            },
            {
                "id": 90005,
                "name": "فطيرة مناقيش بالزعتر",
                "calories": 465,
                "price": "6.0",
                "group_id": 12725,
                "description": "فطيرة محضرة على طريقتنا الخاصة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-90005?width=222"
            },
            {
                "id": 90006,
                "name": "فطيرة محمرة",
                "calories": 350,
                "price": "5.5",
                "group_id": 12725,
                "description": "عجينة الفطائر اللذيذة مغطاه بصوص السبايسي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/90006?width=222"
            }
        ]
    },
    {
        "id": 12723,
        "name": "البيتزا",
        "branch_id": 3197,
        "items": [
            {
                "id": 43263766,
                "name": "بيتزا وسط",
                "calories": 1075,
                "price": "17.0",
                "group_id": 12723,
                "description": "بيتزا خضار وسط",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/a94092c6ddb4a3f8cd897daf0646c2e4?width=222"
            },
            {
                "id": 43263767,
                "name": "بيتزا خضار كبير",
                "calories": 1810,
                "price": "27.0",
                "group_id": 12723,
                "description": "بيتزا كبير خضار",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/2e025a88c5f6031a3b694ed83c88c71a?width=222"
            },
            {
                "id": 43263768,
                "name": "بيتزا وسط لحم",
                "calories": 1135,
                "price": "18.0",
                "group_id": 12723,
                "description": "بيتزا لحم",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/3f04b3ad1d40ee8ff395dc5a88c9f1b4?width=222"
            },
            {
                "id": 43263771,
                "name": "بيتزا كبير لحم",
                "calories": 1921,
                "price": "30.0",
                "group_id": 12723,
                "description": "بيتزا كبير لحم ا",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/30988b0f6f0b756de10911e9dfb887c2?width=222"
            },
            {
                "id": 43263776,
                "name": "بيتزا وسط جبن",
                "calories": 1035,
                "price": "17.0",
                "group_id": 12723,
                "description": "بيتزا وسط جبن مرغريتا",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/87b3973dd0fb7abcdd0d12e49d679f1c.jpg?width=222"
            },
            {
                "id": 43263777,
                "name": "بيتزا كبير جبن",
                "calories": 1821,
                "price": "27.0",
                "group_id": 12723,
                "description": "بيتزا كبير جبن مرغريتا",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/87b3973dd0fb7abcdd0d12e49d679f1c.jpg?width=222"
            },
            {
                "id": 53042205,
                "name": "بيتزا وسط رانش",
                "calories": 1201,
                "price": "24.0",
                "group_id": 12723,
                "description": "بيتزا وسط مع الدجاج وصلصلة الرانش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/0aea0e05f5247b6df8a009bfe739c057?width=222"
            },
            {
                "id": 53042210,
                "name": "بيتزا كبير رانش",
                "calories": 2000,
                "price": "36.0",
                "group_id": 12723,
                "description": "بيتزا كبير دجاج مع صلصلة الرانش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/445ebf6bb8115724899029306d2dd3be?width=222"
            },
            {
                "id": 53042499,
                "name": "بيتزا وسط ببروني",
                "calories": 1200,
                "price": "27.0",
                "group_id": 12723,
                "description": "بيتزا مقاس الوسط ببروني",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/2da81dc3fe57ca03b943565b241a3a9f?width=222"
            },
            {
                "id": 53042501,
                "name": "بيتزا كبير ببروني",
                "calories": 2000,
                "price": "37.0",
                "group_id": 12723,
                "description": "بيتزا مقاي الكبير ببروني",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/dc685fb769578a1b5bbd2f46e64d465d?width=222"
            },
            {
                "id": 53084479,
                "name": "بيتزا وسط نقانق",
                "calories": 1250,
                "price": "25.0",
                "group_id": 12723,
                "description": "بيتزا وسط النقانق",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/99623778bf209143f7124f8b57f32a08?width=222"
            },
            {
                "id": 53084480,
                "name": "بيتزا كبير نقانق",
                "calories": 2010,
                "price": "35.0",
                "group_id": 12723,
                "description": "بيتزا الكبير نقانق",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/5058a70451005e0e56e59192eb2ffa76?width=222"
            },
            {
                "id": 39011974,
                "name": "بيتزا دجاج - وسط",
                "calories": 1134,
                "price": "18.0",
                "group_id": 12723,
                "description": "عجينة البيتزا المغطاة بالخضروات والدجاج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-943390?width=1920"
            },
            {
                "id": 39011975,
                "name": "عش البلبل - وسط",
                "calories": 1182,
                "price": "17.0",
                "group_id": 12723,
                "description": "عجينة مغطاة بالجبن واللبنة والعسل",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image_url_ref/075dbb71666f8a919db9fd8305f4f299.jpeg?width=1920"
            },
            {
                "id": 39011976,
                "name": "عش البلبل - كبير",
                "calories": 1915,
                "price": "27.0",
                "group_id": 12723,
                "description": "عجينة مغطاة بالجبن واللبنة والعسل",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image_url_ref/075dbb71666f8a919db9fd8305f4f299.jpeg?width=1920"
            }
        ]
    },
    {
        "id": 165684,
        "name": "الفلافل الشامية",
        "branch_id": 3197,
        "items": [
            {
                "id": 44889756,
                "name": "صحن فلافل  - صحن فلافل",
                "calories": 1327,
                "price": "17.0",
                "group_id": 165684,
                "description": "الفلافل مقليه",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889757,
                "name": "صحن فلافل  - صحن فلافل",
                "calories": 2227,
                "price": "25.0",
                "group_id": 165684,
                "description": "الفلافل مقليه",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889758,
                "name": "صحن فلافل  - صحن فلافل",
                "calories": 3401,
                "price": "35.0",
                "group_id": 165684,
                "description": "الفلافل مقليه",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889759,
                "name": "صحن فلافل  - صحن فلافل",
                "calories": 4000,
                "price": "40.0",
                "group_id": 165684,
                "description": "الفلافل مقليه",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 1815924,
                "name": "فلافل مع الحمص",
                "calories": 365,
                "price": "6.5",
                "group_id": 165684,
                "description": "ساندوتش بحشوة الفلافل الشهية مع الحمص و الخضروات الطازجة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1815924?width=222"
            },
            {
                "id": 1812352,
                "name": "فلافل شامية",
                "calories": 327,
                "price": "6.0",
                "group_id": 165684,
                "description": "ساندوتش فلافل مشكل خضار وصوص",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812352?width=222"
            },
            {
                "id": 1812353,
                "name": "فلافل مشكل .",
                "calories": 365,
                "price": "7.0",
                "group_id": 165684,
                "description": "فلافل مع  البيض",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812353?width=222"
            },
            {
                "id": 1812354,
                "name": "فلافل مشكل",
                "calories": 400,
                "price": "8.0",
                "group_id": 165684,
                "description": "مع الحمص والبيض",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812354?width=222"
            }
        ]
    },
    {
        "id": 165685,
        "name": "الكودو والمكسيكي",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812355,
                "name": "كودو .",
                "calories": 652,
                "price": "13.0",
                "group_id": 165685,
                "description": "خبز فرنسي محشي بقطع  الدجاج المتبل و مضاف له الصوص و الخس و الجبنة و الطماطم و الخس الطازج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812355?width=222"
            },
            {
                "id": 1812356,
                "name": "كودو",
                "calories": 571,
                "price": "12.0",
                "group_id": 165685,
                "description": "قطع دجاج مشوية مع تشكيلة من الخضار الطازجة بالخبز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812356?width=222"
            },
            {
                "id": 1812357,
                "name": "مكسيكي ..",
                "calories": 651,
                "price": "13.0",
                "group_id": 165685,
                "description": "خبز الصامولي الطري بحشوة الدجاج المتبل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812357?width=222"
            },
            {
                "id": 1812358,
                "name": "مكسيكي",
                "calories": 700,
                "price": "14.0",
                "group_id": 165685,
                "description": "خبز الصامولي الطري بحشوة الدجاج المتبل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812358?width=222"
            },
            {
                "id": 1812360,
                "name": "صحن كودو",
                "calories": 2222,
                "price": "30.0",
                "group_id": 165685,
                "description": "صدوردجاج مع الصوص والبهارات",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812360?width=222"
            }
        ]
    },
    {
        "id": 12722,
        "name": "الساندوتشات",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812346,
                "name": "كرسبي دجاج",
                "calories": 556,
                "price": "12.0",
                "group_id": 12722,
                "description": "شرائح الدجاج المقرمش مع الخضار في الخبز الفرنسي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812346?width=222"
            },
            {
                "id": 29658756,
                "name": "وجبة همبرجر",
                "calories": null,
                "price": "23.0",
                "group_id": 12722,
                "description": "وجبة برجر مع بطاطا وببسي وسلطة وصوصات",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/197d801c040d3290837135b4e9015608?width=222"
            },
            {
                "id": 29658757,
                "name": "وجبة كودو ببسي",
                "calories": null,
                "price": "25.0",
                "group_id": 12722,
                "description": "خبز جامبو محشي بقطع  الدجاج المتبل و مضاف له الصوص و الخس و الجبنة و الطماطم و الخس الطازج ويقدم مع  البطاطس و المشروب وتقدم مع عصير و مقبلات وصوصات",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/3c1b17ce7b778280adfd1593479faed1?width=222"
            },
            {
                "id": 89955,
                "name": "ساندوتش برجر دجاج",
                "calories": null,
                "price": "8.0",
                "group_id": 12722,
                "description": "شريحة لحم طرية في خبز البرجر  مع الجبن",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89955?width=222"
            }
        ]
    },
    {
        "id": 12721,
        "name": "المقبلات",
        "branch_id": 3197,
        "items": [
            {
                "id": 39011960,
                "name": "حمص - حمص صغير",
                "calories": 425,
                "price": "7.5",
                "group_id": 12721,
                "description": "مزيج كريمي من الحمص والطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011965,
                "name": "متبل - صغير",
                "calories": 392,
                "price": "7.5",
                "group_id": 12721,
                "description": "باذنجان مشوي مهروس مع الطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011966,
                "name": "ورق عنب - صغير عدد4",
                "calories": 392,
                "price": "6.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 39011972,
                "name": "تبولة - صغير",
                "calories": 301,
                "price": "10.0",
                "group_id": 12721,
                "description": "سلطة تحتوي على البقدونس والنعناع والطماطم والبصل والبرغل بعصير الليمون وزيت الزيتون",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89946?width=1920"
            },
            {
                "id": 56122602,
                "name": "كبة",
                "calories": 731,
                "price": "1.0",
                "group_id": 12721,
                "description": "كبة بحشوة الدجاج لذيذة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/367713369b48913f2ba64b87785d3bb8?width=222"
            },
            {
                "id": 39011961,
                "name": "حمص - حمص وسط",
                "calories": 531,
                "price": "15.0",
                "group_id": 12721,
                "description": "مزيج كريمي من الحمص والطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011963,
                "name": "متبل - وسط",
                "calories": 547,
                "price": "15.0",
                "group_id": 12721,
                "description": "باذنجان مشوي مهروس مع الطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011967,
                "name": "ورق عنب - وسط عدد8",
                "calories": 457,
                "price": "12.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 39011973,
                "name": "تبولة - تبولة",
                "calories": 500,
                "price": "25.0",
                "group_id": 12721,
                "description": "سلطة تحتوي على البقدونس والنعناع والطماطم والبصل والبرغل بعصير الليمون وزيت الزيتون",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89946?width=1920"
            },
            {
                "id": 53225494,
                "name": "بطاطس مقلية",
                "calories": 317,
                "price": "10.0",
                "group_id": 12721,
                "description": "بطاطس مقلية بالزيت مقرمشة و لذيذة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/45004954?width=222"
            },
            {
                "id": 39011962,
                "name": "حمص - حمص كبير",
                "calories": 1062,
                "price": "25.0",
                "group_id": 12721,
                "description": "مزيج كريمي من الحمص والطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011964,
                "name": "متبل - كبير",
                "calories": 967,
                "price": "25.0",
                "group_id": 12721,
                "description": "باذنجان مشوي مهروس مع الطحينة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011971,
                "name": "ورق عنب - كبير عدد13",
                "calories": 1000,
                "price": "20.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225495,
                "name": "بطاطس مقلية وسط",
                "calories": 601,
                "price": "15.0",
                "group_id": 12721,
                "description": "بطاطس مقلية مقاس وسط",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/348a9d66da9cc1a56d55d1062c2eed92?width=222"
            },
            {
                "id": 39011968,
                "name": "ورق عنب - كبير 17 حبة",
                "calories": 1200,
                "price": "25.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225497,
                "name": "صحن بطاطس مقاس كبير",
                "calories": 1200,
                "price": "20.0",
                "group_id": 12721,
                "description": "صحن بطاطس كبير",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/45004954?width=222"
            },
            {
                "id": 39011969,
                "name": "ورق عنب - كبير عدد25",
                "calories": 1600,
                "price": "35.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225496,
                "name": "صحن بطاطس كبير جدا",
                "calories": 1400,
                "price": "25.0",
                "group_id": 12721,
                "description": "صحن بطاطس مقاس كبير جدا",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/69055017605bd6a8c37467c279da667e?width=222"
            },
            {
                "id": 39011970,
                "name": "ورق عنب -  36كبير جدا عدد",
                "calories": 2500,
                "price": "50.0",
                "group_id": 12721,
                "description": "ورق العنب المحشي بخلطة الأرز",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            }
        ]
    },
    {
        "id": 12726,
        "name": "العصائر",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812317,
                "name": "عصير جوافة",
                "calories": 170,
                "price": "8.0",
                "group_id": 12726,
                "description": "عصير جوافة طبيعي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812317?width=222"
            },
            {
                "id": 36297646,
                "name": "برتقال",
                "calories": 123,
                "price": "8.0",
                "group_id": 12726,
                "description": "برتقال طازج",
                "image": "https://images.deliveryhero.io/image/menu-import-gateway-prd/regions/ME/chains/HS-MMH/a5338a4960fd0744f4c11587add7cb13.jpg?width=222"
            },
            {
                "id": 36297759,
                "name": "ليمون",
                "calories": 4,
                "price": "8.0",
                "group_id": 12726,
                "description": "عصير ليمون طازج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-6729795?width=222"
            },
            {
                "id": 36297841,
                "name": "مانجو",
                "calories": 80,
                "price": "8.0",
                "group_id": 12726,
                "description": "عصير مانجو طازج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/754e88d0e621ba511321f7cbc5b66056.jpg?width=222"
            },
            {
                "id": 36297842,
                "name": "كوكتيل",
                "calories": 165,
                "price": "8.0",
                "group_id": 12726,
                "description": "كوكتيل مشكل",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/b2151153d40ea2f8c63319113c100f62?width=222"
            },
            {
                "id": 36297843,
                "name": "فراولة",
                "calories": 120,
                "price": "8.0",
                "group_id": 12726,
                "description": "فراولة فرش",
                "image": "https://images.deliveryhero.io/image/menu-import-gateway-prd/regions/ME/chains/HS-MMH/43984b26785f655d3096041d3176d567.jpg?width=222"
            },
            {
                "id": 36297956,
                "name": "رمان",
                "calories": 130,
                "price": "9.0",
                "group_id": 12726,
                "description": "رمان طبيعي",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-127741?width=222"
            },
            {
                "id": 36355962,
                "name": "جالون رمان طبيعي",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "عصير رمان طازج و منعش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/ed013ecca070ca24c7be24ff5844c7f1?width=222"
            },
            {
                "id": 36355963,
                "name": "جالون كوكتيل",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "عصير مشكل فواكه طازجة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/185849fa5a700835ca757ab5b5d457be?width=222"
            },
            {
                "id": 36355964,
                "name": "جالون منجا فرشش",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "عصير منعش محضر من المانجو الطازج.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/cc8bf9006e176e0176424397a88dbdeb?width=222"
            },
            {
                "id": 36355965,
                "name": "جالون فراولة",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "فراولة منعش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/ed013ecca070ca24c7be24ff5844c7f1?width=222"
            },
            {
                "id": 36355966,
                "name": "جالون موز حليب طبيعي",
                "calories": 150,
                "price": "30.0",
                "group_id": 12726,
                "description": "موز مع الحليب الطازج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/5b77027c565292babdfa0654b1cb4f87?width=222"
            },
            {
                "id": 36355967,
                "name": "جالون برتقال فرش",
                "calories": null,
                "price": "25.0",
                "group_id": 12726,
                "description": "عصير برتقال طازج",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/e3c6218e24ad2f3b885046b9e3025193?width=222"
            }
        ]
    },
    {
        "id": 859095,
        "name": "الصوصات",
        "branch_id": 3197,
        "items": [
            {
                "id": 29815236,
                "name": "شطة شامي",
                "calories": 30,
                "price": "3.0",
                "group_id": 859095,
                "description": "شطه معجونه  بزيت الزيتون",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/08f8e324c0a5754e9490ed3b54043602?width=222"
            },
            {
                "id": 29815238,
                "name": "كتشب",
                "calories": 20,
                "price": "1.0",
                "group_id": 859095,
                "description": "صلصة الطماطم الشهيه",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/29c1913b4e6508f0e5a0ed910142a099?width=222"
            },
            {
                "id": 29815239,
                "name": "طحينة",
                "calories": 20,
                "price": "2.0",
                "group_id": 859095,
                "description": "طحينةصوص محضر من معجون الطحينة، عصير الليمون، الثوم، والماء,",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/174fcf2ead0f4ddea2aa53bd715c3877?width=222"
            },
            {
                "id": 29815244,
                "name": "مكس مايونيز وثوم",
                "calories": 50,
                "price": "5.0",
                "group_id": 859095,
                "description": "صوص المايونيز مع الثوم علبة كبيرة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/18c0f0ddde538c90d6c4ab0158bd7cdf?width=222"
            },
            {
                "id": 29815245,
                "name": "شطة عادية",
                "calories": 20,
                "price": "1.0",
                "group_id": 859095,
                "description": "بهارات حاره تقدم بطريقة شهيه",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/d1a84b46a51c72fdbad4026a988148ff?width=222"
            },
            {
                "id": 39530692,
                "name": "علبة عسل خارجية",
                "calories": 50,
                "price": "4.0",
                "group_id": 859095,
                "description": "علبة عسل  اونصة واحده",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/c20a4d64bf1904c6a115aa0cc5c4aa22?width=222"
            }
        ]
    },
    {
        "id": 864456,
        "name": "مشروبات غازية وماء",
        "branch_id": 3197,
        "items": [
            {
                "id": 29754314,
                "name": "بيبسي",
                "calories": 42,
                "price": "5.0",
                "group_id": 864456,
                "description": "مشروب بيبسي غازي منعش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1d2b05c5f8ce5bec091e2a19a4f8347a?width=222"
            },
            {
                "id": 29815237,
                "name": "ديو",
                "calories": 48,
                "price": "5.0",
                "group_id": 864456,
                "description": "مشروب غازي منعش",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/c28f23dfd5f92c82b3d0ae19e88bb11c?width=222"
            },
            {
                "id": 29815241,
                "name": "سفن اب",
                "calories": 44,
                "price": "5.0",
                "group_id": 864456,
                "description": "مشروب غازي بنكهة الليمون",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/d32e29512da2569ff674ca4fca729a6f?width=222"
            },
            {
                "id": 45019706,
                "name": "ماء",
                "calories": null,
                "price": "2.0",
                "group_id": 864456,
                "description": "مياة عذبة للشرب نقية ومنعشة",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/459c9e666794d1121961881c5f404358?width=222"
            }
        ]
    }
]
};

const enData = {
  categories: [
    {
        "id": 1,
        "name": "Bestsellers 🔥",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812343,
                "name": "Shawarma Sarukh",
                "calories": 310,
                "price": "13.0",
                "group_id": 1,
                "description": "Tender pieces of marinated shawarma roasted and stuffed into bread",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812343?width=222"
            },
            {
                "id": 1812342,
                "name": "Shawarmaa",
                "calories": 265,
                "price": "6.75",
                "group_id": 1,
                "description": "Sandwich stuffed with marinated shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-1812342?width=222"
            },
            {
                "id": 43263766,
                "name": "Pizza",
                "calories": 1075,
                "price": "17.0",
                "group_id": 1,
                "description": "Medium vegetable pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/a94092c6ddb4a3f8cd897daf0646c2e4?width=222"
            },
            {
                "id": 89979,
                "name": "Akawi Cheese Pie",
                "calories": 537,
                "price": "6.75",
                "group_id": 1,
                "description": "Pie stuffed with akkawi cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89979?width=222"
            }
        ]
    },
    {
        "id": 55552,
        "name": "Shawarma",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812342,
                "name": "Shawarmaa",
                "calories": 265,
                "price": "6.75",
                "group_id": 55552,
                "description": "Sandwich stuffed with marinated shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-1812342?width=222"
            },
            {
                "id": 1812343,
                "name": "Shawarma Sarukh",
                "calories": 310,
                "price": "13.0",
                "group_id": 55552,
                "description": "Tender pieces of marinated shawarma roasted and stuffed into bread",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812343?width=222"
            },
            {
                "id": 1812345,
                "name": "Shawarmaaa",
                "calories": 265,
                "price": "13.5",
                "group_id": 55552,
                "description": "A sandwich stuffed with marinated shawarma pieces in delicious french bread",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812345?width=222"
            },
            {
                "id": 1812336,
                "name": "Shawarma",
                "calories": 265,
                "price": "17.0",
                "group_id": 55552,
                "description": "Marinated shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812336?width=222"
            },
            {
                "id": 1812337,
                "name": "Shawarmaaaa",
                "calories": 265,
                "price": "25.0",
                "group_id": 55552,
                "description": "Marinated shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812337?width=222"
            },
            {
                "id": 1812338,
                "name": "Shawarmma",
                "calories": null,
                "price": "35.0",
                "group_id": 55552,
                "description": "Marinated shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812338?width=222"
            },
            {
                "id": 33503317,
                "name": "Box Shwarma Arab",
                "calories": null,
                "price": "55.0",
                "group_id": 55552,
                "description": "Box shwarma arabi",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/e80aef62e348b42a873b387a25b4dd95?width=222"
            },
            {
                "id": 1812365,
                "name": "Large Arabic Shawarma Meal",
                "calories": null,
                "price": "45.0",
                "group_id": 55552,
                "description": "Sandwich stuffed with spiced shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812365?width=222"
            },
            {
                "id": 1812341,
                "name": "Shawarma",
                "calories": 265,
                "price": "35.0",
                "group_id": 55552,
                "description": "Tender pieces of marinated chicken roasted and stuffed in bread served with french fries, delicious sauces and pickles, large.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812341?width=222"
            },
            {
                "id": 1812340,
                "name": "Shawarma2",
                "calories": 265,
                "price": "26.0",
                "group_id": 55552,
                "description": "Tender pieces of marinated chicken roasted and stuffed in bread served with french fries, delicious sauces and pickles, medium.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812340?width=222"
            },
            {
                "id": 1812339,
                "name": "Shawarma1",
                "calories": 265,
                "price": "17.0",
                "group_id": 55552,
                "description": "Sandwich stuffed with spiced shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812339?width=222"
            },
            {
                "id": 29658776,
                "name": "Shawarma Pie",
                "calories": 730,
                "price": "15.0",
                "group_id": 55552,
                "description": "Delicious pie dough stuffed with shawarma pieces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/9174a1fd2ce2706e10b3f3ec9b2ec0ea?width=222"
            }
        ]
    },
    {
        "id": 12725,
        "name": "Pies",
        "branch_id": 3197,
        "items": [
            {
                "id": 29659222,
                "name": "Mix Pies Platter. - Medium",
                "calories": 4500,
                "price": "45.0",
                "group_id": 12725,
                "description": "A selection of carefully toasted pies with delicious filling",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/905011?width=1920"
            },
            {
                "id": 29659223,
                "name": "Mix Pies Platter - Large",
                "calories": 5500,
                "price": "55.0",
                "group_id": 12725,
                "description": "A selection of carefully toasted pies with delicious filling",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/905012?width=1920"
            },
            {
                "id": 33503318,
                "name": "A Mix Plate Of Pies",
                "calories": 9500,
                "price": "65.0",
                "group_id": 12725,
                "description": "A plate of pies family size",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/33503318?width=222"
            },
            {
                "id": 29815240,
                "name": "A Plate Of Pies",
                "calories": 3500,
                "price": "35.0",
                "group_id": 12725,
                "description": "Flaky and delicious dough pies with different fillings",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/29815240?width=222"
            },
            {
                "id": 29815243,
                "name": "Cheese Brides",
                "calories": 545,
                "price": "10.0",
                "group_id": 12725,
                "description": "Dollops stuffed with liquid cheese and delicious mozzarella",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/8829e418debc45f8209c707dc65e2d07?width=222"
            },
            {
                "id": 29815242,
                "name": "Kudu Pie",
                "calories": 529,
                "price": "13.75",
                "group_id": 12725,
                "description": "Pie stuffed with chicken hummus with delicious sauces and spices\\",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/4ee9508bf19a9f620a397ec3b27d1c85?width=222"
            },
            {
                "id": 89973,
                "name": "Cream Cheese Pie",
                "calories": 454,
                "price": "6.75",
                "group_id": 12725,
                "description": "Pie stuffed with cream cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89973?width=222"
            },
            {
                "id": 89975,
                "name": "Labneh Pie",
                "calories": 529,
                "price": "6.75",
                "group_id": 12725,
                "description": "Pie stuffed with fresh labneh",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89975?width=222"
            },
            {
                "id": 89979,
                "name": "Akawi Cheese Pie",
                "calories": 537,
                "price": "6.75",
                "group_id": 12725,
                "description": "Pie stuffed with akkawi cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89979?width=222"
            },
            {
                "id": 478295,
                "name": "Chicken Arays Pie.",
                "calories": 600,
                "price": "7.5",
                "group_id": 12725,
                "description": "Pie stuffed with cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/478295?width=222"
            },
            {
                "id": 89970,
                "name": "Chicken Arays Pie",
                "calories": null,
                "price": "9.0",
                "group_id": 12725,
                "description": "",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89970?width=222"
            },
            {
                "id": 89971,
                "name": "Meat Arays Pie",
                "calories": 625,
                "price": "9.0",
                "group_id": 12725,
                "description": "Grilled bread stuffed with special stuffed",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89971?width=222"
            },
            {
                "id": 89972,
                "name": "Spinach Pie",
                "calories": 455,
                "price": "6.0",
                "group_id": 12725,
                "description": "Pie stuffed with spinach",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89972?width=222"
            },
            {
                "id": 89974,
                "name": "Meat Pie",
                "calories": 652,
                "price": "7.5",
                "group_id": 12725,
                "description": "pie stuffed with delicious meat",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89974?width=222"
            },
            {
                "id": 89976,
                "name": "Eggs Pie",
                "calories": 601,
                "price": "5.99",
                "group_id": 12725,
                "description": "Pie stuffed with delicious eggs",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-731975?width=222"
            },
            {
                "id": 89978,
                "name": "Chicken Pie",
                "calories": 414,
                "price": "6.75",
                "group_id": 12725,
                "description": "Pie stuffed with pieces of chicken",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89978?width=222"
            },
            {
                "id": 89980,
                "name": "Potatoes Pie",
                "calories": 395,
                "price": "6.0",
                "group_id": 12725,
                "description": "Delicious potato stuffed dough",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89980?width=222"
            },
            {
                "id": 89982,
                "name": "French Fries Pie",
                "calories": 519,
                "price": "6.0",
                "group_id": 12725,
                "description": "French fries with muhammara",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89982?width=222"
            },
            {
                "id": 89983,
                "name": "Falafel Pie",
                "calories": 454,
                "price": "9.75",
                "group_id": 12725,
                "description": "Fluffy pie dough prepared in our way with falafel filling, mixed vegetables and sauce",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89983?width=222"
            },
            {
                "id": 89984,
                "name": "Vegetables Pie",
                "calories": 521,
                "price": "6.5",
                "group_id": 12725,
                "description": "Vegetable stuffed dough with delicious spices",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89984?width=222"
            },
            {
                "id": 89985,
                "name": "Labneh With Cheese Pie",
                "calories": 485,
                "price": "8.5",
                "group_id": 12725,
                "description": "Cheese stuffed dough prepared in our own way",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89985?width=222"
            },
            {
                "id": 89986,
                "name": "Labneh With Thyme Pie",
                "calories": 547,
                "price": "6.75",
                "group_id": 12725,
                "description": "labneh thyme",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89986?width=222"
            },
            {
                "id": 89987,
                "name": "Labneh With Honey Pie",
                "calories": 721,
                "price": "6.75",
                "group_id": 12725,
                "description": "delicious pie dough filled with fresh labneh and honey",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89987?width=222"
            },
            {
                "id": 89988,
                "name": "Cheese With Thyme Pie",
                "calories": 491,
                "price": "7.0",
                "group_id": 12725,
                "description": "Pie prepared in a special way with delicious filling",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89988?width=222"
            },
            {
                "id": 89990,
                "name": "Cheese With Olives Pie",
                "calories": 491,
                "price": "6.5",
                "group_id": 12725,
                "description": "Pie stuffed with cheese and olives",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/9280058a5549cb975c695e5a79ce4d88.jfif?width=222"
            },
            {
                "id": 89991,
                "name": "Cheese With Spinach Pie",
                "calories": 501,
                "price": "7.0",
                "group_id": 12725,
                "description": "Pie stuffed with spinach and cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89991?width=222"
            },
            {
                "id": 89993,
                "name": "Labneh With Spinach Pie",
                "calories": 477,
                "price": "6.5",
                "group_id": 12725,
                "description": "Labneh with spinach",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89993?width=222"
            },
            {
                "id": 89994,
                "name": "Cheese With Mushroom Pie",
                "calories": 490,
                "price": "7.0",
                "group_id": 12725,
                "description": "Pie stuffed with cheese and mushroom",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89994?width=222"
            },
            {
                "id": 89995,
                "name": "Cheese With Tomatoes Pie",
                "calories": 485,
                "price": "7.0",
                "group_id": 12725,
                "description": "Pie stuffed with cheese and fresh tomatoes",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89995?width=222"
            },
            {
                "id": 89997,
                "name": "Meat With Cheese Pie",
                "calories": 773,
                "price": "8.5",
                "group_id": 12725,
                "description": "meat with cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89997?width=222"
            },
            {
                "id": 89998,
                "name": "Chicken With Cheese Pie",
                "calories": 678,
                "price": "8.5",
                "group_id": 12725,
                "description": "Chicken with cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89998?width=222"
            },
            {
                "id": 89999,
                "name": "Muhammara With Thyme Pie",
                "calories": 480,
                "price": "6.0",
                "group_id": 12725,
                "description": "Muhammara pie prepared in our own way",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89999?width=222"
            },
            {
                "id": 90000,
                "name": "Eggs With Round Cheese Pie",
                "calories": 458,
                "price": "6.0",
                "group_id": 12725,
                "description": "Eggs with cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-11434482?width=222"
            },
            {
                "id": 90002,
                "name": "Halloumi Cheese Pie",
                "calories": 655,
                "price": "8.0",
                "group_id": 12725,
                "description": "pie stuffed with halloumi cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/90002?width=222"
            },
            {
                "id": 90005,
                "name": "Manoucheh With Thyme Pie",
                "calories": 465,
                "price": "6.0",
                "group_id": 12725,
                "description": "Pie prepared in our own way",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-90005?width=222"
            },
            {
                "id": 90006,
                "name": "Manoucheh With Muhammara Pie",
                "calories": 350,
                "price": "5.5",
                "group_id": 12725,
                "description": "Delicious pancake dough covered with spicy sauce",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/90006?width=222"
            }
        ]
    },
    {
        "id": 12723,
        "name": "Pizza",
        "branch_id": 3197,
        "items": [
            {
                "id": 43263766,
                "name": "Pizza",
                "calories": 1075,
                "price": "17.0",
                "group_id": 12723,
                "description": "Medium vegetable pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/a94092c6ddb4a3f8cd897daf0646c2e4?width=222"
            },
            {
                "id": 43263767,
                "name": "Pizaa Big",
                "calories": 1810,
                "price": "27.0",
                "group_id": 12723,
                "description": "Large vegetable pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/2e025a88c5f6031a3b694ed83c88c71a?width=222"
            },
            {
                "id": 43263768,
                "name": "Pizza Meat",
                "calories": 1135,
                "price": "18.0",
                "group_id": 12723,
                "description": "Medium meat pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/3f04b3ad1d40ee8ff395dc5a88c9f1b4?width=222"
            },
            {
                "id": 43263771,
                "name": "Large Meat Pizza",
                "calories": 1921,
                "price": "30.0",
                "group_id": 12723,
                "description": "Large meat pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/30988b0f6f0b756de10911e9dfb887c2?width=222"
            },
            {
                "id": 43263776,
                "name": "Pizza Cheese",
                "calories": 1035,
                "price": "17.0",
                "group_id": 12723,
                "description": "Medium pizza with margherita cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/87b3973dd0fb7abcdd0d12e49d679f1c.jpg?width=222"
            },
            {
                "id": 43263777,
                "name": "Pizza Cheese Big",
                "calories": 1821,
                "price": "27.0",
                "group_id": 12723,
                "description": "Large margherita cheese pizza",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/87b3973dd0fb7abcdd0d12e49d679f1c.jpg?width=222"
            },
            {
                "id": 53042205,
                "name": "Medium Ranch Pizza",
                "calories": 1201,
                "price": "24.0",
                "group_id": 12723,
                "description": "Medium ranch pizza1",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/0aea0e05f5247b6df8a009bfe739c057?width=222"
            },
            {
                "id": 53042210,
                "name": "Large Ranch Pizza",
                "calories": 2000,
                "price": "36.0",
                "group_id": 12723,
                "description": "Large ranch pizzaa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/445ebf6bb8115724899029306d2dd3be?width=222"
            },
            {
                "id": 53042499,
                "name": "Medium Pepperoni Pizza",
                "calories": 1200,
                "price": "27.0",
                "group_id": 12723,
                "description": "Medium pepperoni pizzaa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/2da81dc3fe57ca03b943565b241a3a9f?width=222"
            },
            {
                "id": 53042501,
                "name": "Large Pepperoni Pizza",
                "calories": 2000,
                "price": "37.0",
                "group_id": 12723,
                "description": "Large pepperoni pizzaa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/dc685fb769578a1b5bbd2f46e64d465d?width=222"
            },
            {
                "id": 53084479,
                "name": "Hot Dog Pizza",
                "calories": 1250,
                "price": "25.0",
                "group_id": 12723,
                "description": "Hot dog pizzaa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/99623778bf209143f7124f8b57f32a08?width=222"
            },
            {
                "id": 53084480,
                "name": "Large Sausage Pizza",
                "calories": 2010,
                "price": "35.0",
                "group_id": 12723,
                "description": "Large sausage pizzaa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/5058a70451005e0e56e59192eb2ffa76?width=222"
            },
            {
                "id": 39011974,
                "name": "Chicken Pizza - Medium",
                "calories": 1134,
                "price": "18.0",
                "group_id": 12723,
                "description": "Pizza dough covered with vegetables and chicken",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-943390?width=1920"
            },
            {
                "id": 39011975,
                "name": "Ash Albulbul - Medium",
                "calories": 1182,
                "price": "17.0",
                "group_id": 12723,
                "description": "Dough topped with cheese, labneh and honey",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image_url_ref/075dbb71666f8a919db9fd8305f4f299.jpeg?width=1920"
            },
            {
                "id": 39011976,
                "name": "Ash Albulbul - Large",
                "calories": 1915,
                "price": "27.0",
                "group_id": 12723,
                "description": "Dough topped with cheese, labneh and honey",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image_url_ref/075dbb71666f8a919db9fd8305f4f299.jpeg?width=1920"
            }
        ]
    },
    {
        "id": 165684,
        "name": "Syrian Falafel",
        "branch_id": 3197,
        "items": [
            {
                "id": 44889756,
                "name": "Falafel Phate - Small",
                "calories": 1327,
                "price": "17.0",
                "group_id": 165684,
                "description": "Falafl and potatoes",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889757,
                "name": "Falafel Phate - Medium",
                "calories": 2227,
                "price": "25.0",
                "group_id": 165684,
                "description": "Falafl and potatoes",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889758,
                "name": "Falafel Phate - Big",
                "calories": 3401,
                "price": "35.0",
                "group_id": 165684,
                "description": "Falafl and potatoes",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 44889759,
                "name": "Falafel Phate - Very Big",
                "calories": 4000,
                "price": "40.0",
                "group_id": 165684,
                "description": "Falafl and potatoes",
                "image": "https://images.deliveryhero.io/image/hungerstation/product/image/97e7ebd6544a62d3b576b44aabe0a716?width=1920"
            },
            {
                "id": 1815924,
                "name": "Falafel",
                "calories": 365,
                "price": "6.5",
                "group_id": 165684,
                "description": "A sandwich filled with delicious falafel, hummus and fresh vegetables",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1815924?width=222"
            },
            {
                "id": 1812352,
                "name": "Falafel1",
                "calories": 327,
                "price": "6.0",
                "group_id": 165684,
                "description": "Falafel sandwich with mixed vegetables and sauce",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812352?width=222"
            },
            {
                "id": 1812353,
                "name": "Falafel",
                "calories": 365,
                "price": "7.0",
                "group_id": 165684,
                "description": "Falafel with eggs",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812353?width=222"
            },
            {
                "id": 1812354,
                "name": "Falafel",
                "calories": 400,
                "price": "8.0",
                "group_id": 165684,
                "description": "Falafel with eggs and homos",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812354?width=222"
            }
        ]
    },
    {
        "id": 165685,
        "name": "Kudo And Mexican",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812355,
                "name": "Kudo",
                "calories": 652,
                "price": "13.0",
                "group_id": 165685,
                "description": "French bread stuffed with pieces of marinated chicken, topped with sauce, lettuce, cheese, tomatoes and fresh lettuce",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812355?width=222"
            },
            {
                "id": 1812356,
                "name": "Kudo",
                "calories": 571,
                "price": "12.0",
                "group_id": 165685,
                "description": "Grilled chicken pieces with a variety of fresh vegetables in bread",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812356?width=222"
            },
            {
                "id": 1812357,
                "name": "Mexican",
                "calories": 651,
                "price": "13.0",
                "group_id": 165685,
                "description": "Soft samuli bread stuffed with spiced chicken",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812357?width=222"
            },
            {
                "id": 1812358,
                "name": "Mexican",
                "calories": 700,
                "price": "14.0",
                "group_id": 165685,
                "description": "Soft samuli bread stuffed with spiced chicken",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812358?width=222"
            },
            {
                "id": 1812360,
                "name": "Kudo",
                "calories": 2222,
                "price": "30.0",
                "group_id": 165685,
                "description": "Kudu plate",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812360?width=222"
            }
        ]
    },
    {
        "id": 12722,
        "name": "Sandwiches",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812346,
                "name": "Sandwich",
                "calories": 556,
                "price": "12.0",
                "group_id": 12722,
                "description": "Crispy chicken strips with vegetables in french bread",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812346?width=222"
            },
            {
                "id": 29658756,
                "name": "Hamburger Meal",
                "calories": null,
                "price": "23.0",
                "group_id": 12722,
                "description": "Burger meal with fries, pepsi, salad and sauces",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/197d801c040d3290837135b4e9015608?width=222"
            },
            {
                "id": 29658757,
                "name": "Kudu Meal",
                "calories": null,
                "price": "25.0",
                "group_id": 12722,
                "description": "Jumbo bread stuffed with pieces of marinated chicken and added sauce, lettuce, cheese, tomatoes and fresh lettuce and served with potatoes and drink and served with juice, appetizers and sauces.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/3c1b17ce7b778280adfd1593479faed1?width=222"
            },
            {
                "id": 89955,
                "name": "Chicken Burger Sandwich",
                "calories": null,
                "price": "8.0",
                "group_id": 12722,
                "description": "Juicy beef burger served in a soft bun with cheese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/89955?width=222"
            }
        ]
    },
    {
        "id": 12721,
        "name": "Appetizers",
        "branch_id": 3197,
        "items": [
            {
                "id": 39011960,
                "name": "Hummus - Hummus",
                "calories": 425,
                "price": "7.5",
                "group_id": 12721,
                "description": "A creamy blend of chickpeas, tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011965,
                "name": "Mtabbal - Small",
                "calories": 392,
                "price": "7.5",
                "group_id": 12721,
                "description": "Grilled eggplant mashed with tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011966,
                "name": "Grape Leaves - ورق عنب1",
                "calories": 392,
                "price": "6.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 39011972,
                "name": "Tabbouleh  - تبوله1",
                "calories": 301,
                "price": "10.0",
                "group_id": 12721,
                "description": "Salad that includes parsley, mint, tomatoes, onions, and bulgur marinated in lemon juice and olive oil.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89946?width=1920"
            },
            {
                "id": 56122602,
                "name": "Kibbeh",
                "calories": 731,
                "price": "1.0",
                "group_id": 12721,
                "description": "Kibbeh stuffed with chicen",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/367713369b48913f2ba64b87785d3bb8?width=222"
            },
            {
                "id": 39011961,
                "name": "Hummus - Hummus.",
                "calories": 531,
                "price": "15.0",
                "group_id": 12721,
                "description": "A creamy blend of chickpeas, tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011963,
                "name": "Mtabbal -  Medium",
                "calories": 547,
                "price": "15.0",
                "group_id": 12721,
                "description": "Grilled eggplant mashed with tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011967,
                "name": "Grape Leaves - ورق عنب2",
                "calories": 457,
                "price": "12.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 39011973,
                "name": "Tabbouleh  - Tabbouleh",
                "calories": 500,
                "price": "25.0",
                "group_id": 12721,
                "description": "Salad that includes parsley, mint, tomatoes, onions, and bulgur marinated in lemon juice and olive oil.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89946?width=1920"
            },
            {
                "id": 53225494,
                "name": "French Fries",
                "calories": 317,
                "price": "10.0",
                "group_id": 12721,
                "description": "Crispy and delicious fried potatoes in oil",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/45004954?width=222"
            },
            {
                "id": 39011962,
                "name": "Hummus - Hummus1",
                "calories": 1062,
                "price": "25.0",
                "group_id": 12721,
                "description": "A creamy blend of chickpeas, tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/97d012f00837510f732b762a43b394fd?width=1920"
            },
            {
                "id": 39011964,
                "name": "Mtabbal - Large",
                "calories": 967,
                "price": "25.0",
                "group_id": 12721,
                "description": "Grilled eggplant mashed with tahini",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89944?width=1920"
            },
            {
                "id": 39011971,
                "name": "Grape Leaves - ورق عنب3",
                "calories": 1000,
                "price": "20.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225495,
                "name": "French Frie",
                "calories": 601,
                "price": "15.0",
                "group_id": 12721,
                "description": "French friesa",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/348a9d66da9cc1a56d55d1062c2eed92?width=222"
            },
            {
                "id": 39011968,
                "name": "Grape Leaves - 17 Pieces Large",
                "calories": 1200,
                "price": "25.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225497,
                "name": "French Fries",
                "calories": 1200,
                "price": "20.0",
                "group_id": 12721,
                "description": "French friess",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/45004954?width=222"
            },
            {
                "id": 39011969,
                "name": "Grape Leaves - ورق عنب4",
                "calories": 1600,
                "price": "35.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            },
            {
                "id": 53225496,
                "name": "French Friess",
                "calories": 1400,
                "price": "25.0",
                "group_id": 12721,
                "description": "French friese",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/69055017605bd6a8c37467c279da667e?width=222"
            },
            {
                "id": 39011970,
                "name": "Grape Leaves - ورق عنب5",
                "calories": 2500,
                "price": "50.0",
                "group_id": 12721,
                "description": "Grape leaves stuffed with a rice mixture",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-89945?width=1920"
            }
        ]
    },
    {
        "id": 12726,
        "name": "Juices",
        "branch_id": 3197,
        "items": [
            {
                "id": 1812317,
                "name": "Guava Juice",
                "calories": 170,
                "price": "8.0",
                "group_id": 12726,
                "description": "Natural guava juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1812317?width=222"
            },
            {
                "id": 36297646,
                "name": "Orange",
                "calories": 123,
                "price": "8.0",
                "group_id": 12726,
                "description": "Fresh orange",
                "image": "https://images.deliveryhero.io/image/menu-import-gateway-prd/regions/ME/chains/HS-MMH/a5338a4960fd0744f4c11587add7cb13.jpg?width=222"
            },
            {
                "id": 36297759,
                "name": "Lemon",
                "calories": 4,
                "price": "8.0",
                "group_id": 12726,
                "description": "Fresh lemon juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-6729795?width=222"
            },
            {
                "id": 36297841,
                "name": "Mango",
                "calories": 80,
                "price": "8.0",
                "group_id": 12726,
                "description": "Fresh mango juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image_url_ref/754e88d0e621ba511321f7cbc5b66056.jpg?width=222"
            },
            {
                "id": 36297842,
                "name": "Cockatiel",
                "calories": 165,
                "price": "8.0",
                "group_id": 12726,
                "description": "Mix cockatiel",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/b2151153d40ea2f8c63319113c100f62?width=222"
            },
            {
                "id": 36297843,
                "name": "Strawberry",
                "calories": 120,
                "price": "8.0",
                "group_id": 12726,
                "description": "Fresh strawberry",
                "image": "https://images.deliveryhero.io/image/menu-import-gateway-prd/regions/ME/chains/HS-MMH/43984b26785f655d3096041d3176d567.jpg?width=222"
            },
            {
                "id": 36297956,
                "name": "Pomegranate",
                "calories": 130,
                "price": "9.0",
                "group_id": 12726,
                "description": "Fresh pomegranate",
                "image": "https://images.deliveryhero.io/image/hungerstation/menus/menuitem/hsimg-127741?width=222"
            },
            {
                "id": 36355962,
                "name": "Gallon Of Natural Pomegranate",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "Fresh and refreshing pomegranate juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/ed013ecca070ca24c7be24ff5844c7f1?width=222"
            },
            {
                "id": 36355963,
                "name": "Cocktail Gallon",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "Fresh fruit mixed juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/185849fa5a700835ca757ab5b5d457be?width=222"
            },
            {
                "id": 36355964,
                "name": "Mango1",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "Refreshing juice made from fresh mango.",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/cc8bf9006e176e0176424397a88dbdeb?width=222"
            },
            {
                "id": 36355965,
                "name": "Strawberry1",
                "calories": 918,
                "price": "25.0",
                "group_id": 12726,
                "description": "Strawberry",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/ed013ecca070ca24c7be24ff5844c7f1?width=222"
            },
            {
                "id": 36355966,
                "name": "Banana Milk",
                "calories": 150,
                "price": "30.0",
                "group_id": 12726,
                "description": "Banana milk1",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/5b77027c565292babdfa0654b1cb4f87?width=222"
            },
            {
                "id": 36355967,
                "name": "An Orange",
                "calories": null,
                "price": "25.0",
                "group_id": 12726,
                "description": "Fresh orange juice",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/e3c6218e24ad2f3b885046b9e3025193?width=222"
            }
        ]
    },
    {
        "id": 859095,
        "name": "Sauces",
        "branch_id": 3197,
        "items": [
            {
                "id": 29815236,
                "name": "Levantine Hot Sauce",
                "calories": 30,
                "price": "3.0",
                "group_id": 859095,
                "description": "Sautéed sauce with olive oil",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/08f8e324c0a5754e9490ed3b54043602?width=222"
            },
            {
                "id": 29815238,
                "name": "Ketchup",
                "calories": 20,
                "price": "1.0",
                "group_id": 859095,
                "description": "Delicious tomato sauce",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/29c1913b4e6508f0e5a0ed910142a099?width=222"
            },
            {
                "id": 29815239,
                "name": "Tahini",
                "calories": 20,
                "price": "2.0",
                "group_id": 859095,
                "description": "Sauce made from tahini paste, lemon juice, garlic, and water,",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/174fcf2ead0f4ddea2aa53bd715c3877?width=222"
            },
            {
                "id": 29815244,
                "name": "Mayonnaise With Garlic",
                "calories": 50,
                "price": "5.0",
                "group_id": 859095,
                "description": "Mayonnaise sauce with garlic, large size",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/18c0f0ddde538c90d6c4ab0158bd7cdf?width=222"
            },
            {
                "id": 29815245,
                "name": "Hot Sauce",
                "calories": 20,
                "price": "1.0",
                "group_id": 859095,
                "description": "Hot spices served in a delicious way",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/d1a84b46a51c72fdbad4026a988148ff?width=222"
            },
            {
                "id": 39530692,
                "name": "A Box Of Honey",
                "calories": 50,
                "price": "4.0",
                "group_id": 859095,
                "description": "A box of honey",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/c20a4d64bf1904c6a115aa0cc5c4aa22?width=222"
            }
        ]
    },
    {
        "id": 864456,
        "name": "Soft Drinks",
        "branch_id": 3197,
        "items": [
            {
                "id": 29754314,
                "name": "Pepsi",
                "calories": 42,
                "price": "5.0",
                "group_id": 864456,
                "description": "Refreshing carbonated soft drink",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/1d2b05c5f8ce5bec091e2a19a4f8347a?width=222"
            },
            {
                "id": 29815237,
                "name": "Deo",
                "calories": 48,
                "price": "5.0",
                "group_id": 864456,
                "description": "Refreshing soft drink",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/c28f23dfd5f92c82b3d0ae19e88bb11c?width=222"
            },
            {
                "id": 29815241,
                "name": "Seven Up",
                "calories": 44,
                "price": "5.0",
                "group_id": 864456,
                "description": "Refreshing carbonated soft drink",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/d32e29512da2569ff674ca4fca729a6f?width=222"
            },
            {
                "id": 45019706,
                "name": "Wataer",
                "calories": null,
                "price": "2.0",
                "group_id": 864456,
                "description": "Pure and refreshing fresh drinking water",
                "image": "https://images.deliveryhero.io/image/hungerstation/menuitem/image/459c9e666794d1121961881c5f404358?width=222"
            }
        ]
    }
]
};

// Process a small sample to demonstrate the fix
const sampleArData = {
  categories: arData.categories.slice(0, 2)
};
const sampleEnData = {
  categories: enData.categories.slice(0, 2)
};

console.log("Processing sample data to demonstrate the fix...");
const result = await processMenuData(sampleArData, sampleEnData, 'sample-output.json');
console.log("Sample processing complete. Here's the first category:");
console.log(JSON.stringify(result.categories[0], null, 2));

// Now process the full data
console.log("\nProcessing full menu data...");
await processMenuData(arData, enData, 'full-output.json');
console.log("Full menu processing complete!");