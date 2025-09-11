import fs from 'fs/promises';

async function processMenuData(enFilePath, arFilePath, outputFilePath) {
  try {
    console.log('Reading English and Arabic menu data files...');
    const enData = await fs.readFile(enFilePath, 'utf8');
    const arData = await fs.readFile(arFilePath, 'utf8');

    console.log('Parsing JSON data...');
    const enJsonData = JSON.parse(enData);
    const arJsonData = JSON.parse(arData);

    console.log('Validating data structure...');
    if (!enJsonData.name || !arJsonData.name) {
      throw new Error('Missing restaurant name in one or both language files');
    }

    const restaurantInfo = {
      name: { en: enJsonData.name, ar: arJsonData.name },
      uuid: enJsonData.uuid || arJsonData.uuid,
      availability: enJsonData.availability || arJsonData.availability
    };

    const processedMenu = {
      ...restaurantInfo,
      categories: []
    };

    console.log('Processing menu categories...');
    if (!Array.isArray(enJsonData.categories) || !Array.isArray(arJsonData.categories)) {
      throw new Error('Categories are not arrays in one or both language files');
    }

    enJsonData.categories.forEach((enCategory, index) => {
      const arCategory = arJsonData.categories[index];
      if (!enCategory || !arCategory) {
        console.warn(`Skipping category at index ${index} due to missing data`);
        return;
      }

      const processedCategory = {
        name: { 
          en: enCategory.name || 'Missing English Name', 
          ar: arCategory.name || 'Missing Arabic Name' 
        },
        menuItems: []
      };

      if (Array.isArray(enCategory.items) && Array.isArray(arCategory.items)) {
        enCategory.items.forEach((enItem, itemIndex) => {
          const arItem = arCategory.items[itemIndex];
          if (!enItem || !arItem) {
            console.warn(`Skipping item at index ${itemIndex} in category ${index} due to missing data`);
            return;
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
            sizes: [],
            price: 0,
            image: enItem.image || arItem.image || "",
          };

          if (Array.isArray(enItem.sizes) && Array.isArray(arItem.sizes)) {
            processedItem.sizes = enItem.sizes.map((enSize, sizeIndex) => {
              const arSize = arItem.sizes[sizeIndex];
              return {
                name: { 
                  en: enSize?.sizeName || 'Missing English Size Name', 
                  ar: arSize?.sizeName || 'Missing Arabic Size Name' 
                },
                price: enSize?.price || arSize?.price || 0,
              };
            });

            if (processedItem.sizes.length > 0) {
              processedItem.price = processedItem.sizes[0].price;
            }
          } else {
            console.warn(`Missing sizes for item ${itemIndex} in category ${index}`);
          }

          processedCategory.menuItems.push(processedItem);
        });
      } else {
        console.warn(`Missing items for category ${index}`);
      }

      processedMenu.categories.push(processedCategory);
    });

    console.log('Saving processed menu data to file...');
    await fs.writeFile(outputFilePath, JSON.stringify(processedMenu, null, 2), 'utf8');

    console.log(`Processed menu data saved to ${outputFilePath}`);
    console.log('\nMenu data processing completed successfully.');
  } catch (error) {
    console.error('Error processing menu data:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Usage
processMenuData('en.json', 'ar.json', 'processed-menu-data.json');