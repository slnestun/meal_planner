const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/cgi/search.pl";

export default class NutritionServices {
  async searchProducts(query) {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "12",
      fields: "product_name,brands,nutriments,image_front_small_url",
    });
    const response = await fetch(`${OPEN_FOOD_FACTS_URL}?${params}`);

    if (!response.ok) {
      throw new Error("The nutrition service is unavailable. Please try again.");
    }

    const data = await response.json();
    return data.products ?? [];
  }
}
