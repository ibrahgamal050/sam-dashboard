import { handler } from './services/perplexity.js';

export async function processRestaurantData(nameEn, nameAr) {
   
    
    const messege = `{
        "subdomain": "test",
        "nameEn": "${nameEn}",
        "nameAr": "${nameAr}",
        "cuisineEn": "Italian",
        "cuisineAr": "إيطالي",
        "hotline": "0222748080",
        "locationEn": "City Stars Mall, Nasr City, Cairo, Egypt",
        "locationAr": "مول سيتي ستارز، مدينة نصر، القاهرة، مصر"
    }`;

    try {
        const response = await handler(messege);

        if (!response.ok) {
            throw new Error(`خطأ في جلب البيانات: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("❌ حدث خطأ أثناء جلب بيانات المطعم:", error);
        throw error;
    }
}
