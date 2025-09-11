import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(req) {
  try {
    const url = new URL(req.url).searchParams.get('url');
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL parameter is required' }), { status: 400 });
    }

    // Fetch the page content
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Initialize an array to hold the final menu data
    const finalMenu = [];

    // Find all <h3> elements and their corresponding tables
    $('h3').each((i, titleElement) => {
      const titleText = $(titleElement).text().trim();
      if (titleText) {
        // Initialize an array to hold the menu items for this section
        const menu = [];

        // Find the table that comes immediately after this <h3> element
        const table = $(titleElement).next('table');
        if (table.length) {
          // Read the header row to get size names
         
          const sizeHeaders = ['الصغير', 'الوسط', 'الكبير', 'العائلي'];
          
          
          // Print the final size headers for debugging
          console.log('Size Headers:', sizeHeaders);

          // Read the table body to get menu items
          table.find('tbody tr').each((i, rowElement) => {
            // Skip the first row (header row)
            if (i === 0) return;

            const cells = $(rowElement).find('td');
            const dishName = $(cells[0]).text().trim();
            const sizes = [];

            for (let j = 1; j < cells.length; j++) {
              const priceText = $(cells[j]).text().trim();
              const price = parseFloat(priceText.replace('جنيه', '').trim().replace(',', ''));

              if (price && !isNaN(price)) {
                sizes.push({
                    name: {ar: sizeHeaders[j - 1]}, // Use size names from the header
                  price: price
                });
              }
            }

            if (dishName && sizes.length > 0) {
              menu.push({
                name: {ar: dishName},
                sizes: sizes
              });
            }
          });

          // Add the current title and its menu items to the final array
          finalMenu.push({
            name: {ar: titleText},
            menuItems: menu
          });
        }
      }
    });

    return new Response(JSON.stringify(finalMenu), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching the page:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
