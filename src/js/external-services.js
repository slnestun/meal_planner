const MEAL_DB_URL = "https://www.themealdb.com/api/json/v1/1";

export default class ExternalServices {
  constructor() {
    this.baseUrl = MEAL_DB_URL;
  }

  async #get(endpoint) {
    const response = await fetch(`${this.baseUrl}/${endpoint}`);

    if (!response.ok) {
      throw new Error("The recipe service is unavailable. Please try again.");
    }

    return response.json();
  }

  async searchByName(query) {
    const data = await this.#get(`search.php?s=${encodeURIComponent(query)}`);
    return data.meals ?? [];
  }

  async searchByIngredient(ingredient) {
    const data = await this.#get(
      `filter.php?i=${encodeURIComponent(ingredient)}`,
    );
    return data.meals ?? [];
  }

  async searchByCategory(category) {
    const data = await this.#get(`filter.php?c=${encodeURIComponent(category)}`);
    return data.meals ?? [];
  }

  async getCategories() {
    const data = await this.#get("categories.php");
    return data.categories ?? [];
  }
}
