import { processRestaurantData } from './services/perplexity.js';
import { saveToDatabase } from './services/database.js';
import restaurants from './data/restaurants.json';

async function main() {
    for (const restaurant of restaurants) {
        try {
            console.log(`🔍 البحث عن بيانات: ${restaurant.nameAr}...`);
            
            // جلب بيانات المطعم باستخدام Perplexity API
            const restaurantData = await processRestaurantData(restaurant.nameEn, restaurant.nameAr);

            // حفظ البيانات في قاعدة البيانات
            await saveToDatabase('restaurants', restaurantData);

            console.log(`✅ تم حفظ بيانات ${restaurant.nameAr} بنجاح!`);
        } catch (error) {
            console.error(`❌ خطأ أثناء معالجة ${restaurant.nameAr}:`, error);
        }
    }
}

// تشغيل السكريبت
main();
