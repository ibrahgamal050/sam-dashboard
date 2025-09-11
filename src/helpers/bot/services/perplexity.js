import fetch from 'node-fetch';
import 'dotenv/config';

export async function handler(query) {
    try {
        console.log("🔑 API Key:", process.env.PERPLEXITY_API_KEY);

        const response = await fetch("https://api.perplexity.ai/search", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`❌ API Error! Status: ${response.status} - ${response.statusText}`);
        }

        return await response.json();  // إرجاع البيانات مباشرة
    } catch (error) {
        console.error("❌ Error fetching data from Perplexity API:", error);
        return null;
    }
}
