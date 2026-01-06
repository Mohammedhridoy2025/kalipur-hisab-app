
import { GoogleGenAI } from "@google/genai";

/**
 * Get intelligent financial advice using Gemini AI based on current trust stats.
 */
export async function getFinancialInsights(membersCount: number, balance: number, monthlyExpenses: any[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `আমরা একটি কালিপুর গ্রামের পাহারাদার কল্যাণ ট্রাস্ট চালাই। আমাদের ${membersCount} জন প্রবাসী সদস্য আছেন যারা চাঁদা দেন। বর্তমান তহবিলের ব্যালেন্স ৳${balance}। আমাদের সাম্প্রতিক কিছু খরচ: ${JSON.stringify(monthlyExpenses)}। আমাদের জন্য বাংলায় একটি অত্যন্ত ছোট ও প্রফেশনাল আর্থিক সামারি বা পরামর্শ দাও (সর্বোচ্চ ৪০ শব্দ)। কথাগুলো যেন উৎসাহব্যঞ্জক হয়।`,
      config: {
        systemInstruction: "You are a village financial mentor. Speak in polite, clear, and very concise Bengali. Focus on community growth and security.",
      }
    });
    return response.text || "তহবিল ব্যবস্থাপনায় স্বচ্ছতা ও প্রবাসীদের অবদান গ্রামের উন্নয়নে মাইলফলক।";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "তহবিল ব্যবস্থাপনায় স্বচ্ছতা ও প্রবাসীদের অবদান গ্রামের উন্নয়নে মাইলফলক। নিয়মিত অডিট ও হিসাব সংরক্ষণের মাধ্যমে তহবিল সমৃদ্ধ হবে।";
  }
}

/**
 * Generate a heart-touching Islamic motivational quote for donors.
 */
export async function getMotivationalQuote(memberName: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `সদস্যের নাম: ${memberName}। কালিপুর গ্রামের পাহারাদার কল্যাণ তহবিলে উনার অবদানের জন্য ধন্যবাদ জানিয়ে ইসলামী মূল্যবোধের (সদকা/নেকি) আলোকে সর্বোচ্চ ১-২ লাইনের একটি হৃদয়স্পর্শী উক্তি দাও। শুধু উক্তিটি লিখবে।`,
      config: {
        systemInstruction: "Write a 1-line beautiful Bengali quote about charity and Allah's reward. No intro, no extra text.",
      }
    });
    return response.text?.replace(/^["']|["']$/g, '').trim() || "আপনার এই দান সদকায়ে জারিয়া হিসেবে কবুল হোক। গ্রামের নিরাপত্তায় আপনার অবদান মহান আল্লাহ উত্তম প্রতিদান হিসেবে দান করুন।";
  } catch (error) {
    console.error("AI Quote Error:", error);
    return "আপনার এই দান সদকায়ে জারিয়া হিসেবে কবুল হোক। গ্রামের নিরাপত্তায় আপনার অবদান মহান আল্লাহ উত্তম প্রতিদান হিসেবে দান করুন।";
  }
}
