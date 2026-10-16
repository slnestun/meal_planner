import NutritionServices from "./nutrition-services.js";
import ExternalServices from "./external-services.js";
import { escapeHtml, loadPartial } from "./utils.js";

const services = new NutritionServices();
const recipeServices = new ExternalServices();
const resultsElement = document.querySelector("#nutrition-results");
const countElement = document.querySelector("#nutrition-count");
const recipeNutritionElement = document.querySelector("#recipe-nutrition");

function nutritionValue(value, unit = "g") {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} ${unit}` : "Not available";
}

function renderMessage(title, message, isError = false) {
  resultsElement.innerHTML = `
    <div class="empty-state${isError ? " empty-state--error" : ""}">
      <span class="empty-state__icon" aria-hidden="true">${isError ? "!" : "+"}</span>
      <h2>${title}</h2>
      <p>${message}</p>
    </div>
  `;
}

function renderProducts(products) {
  const validProducts = products.filter((product) => product.product_name);
  if (!validProducts.length) {
    countElement.textContent = "0 products found";
    renderMessage("No products found", "Try a more general food or product name.");
    return;
  }

  countElement.textContent = `${validProducts.length} product${validProducts.length === 1 ? "" : "s"} found`;
  resultsElement.innerHTML = validProducts
    .map((product) => {
      const nutrients = product.nutriments ?? {};
      const image = product.image_front_small_url
        ? `<img src="${escapeHtml(product.image_front_small_url)}" alt="" loading="lazy" />`
        : `<div class="nutrition-card__image nutrition-card__image--empty" aria-hidden="true">Nutrition</div>`;
      return `
        <article class="nutrition-card">
          ${image}
          <div class="nutrition-card__body">
            <h2>${escapeHtml(product.product_name)}</h2>
            <p>${escapeHtml(product.brands || "Brand not available")}</p>
            <dl>
              <div><dt>Calories</dt><dd>${nutritionValue(nutrients["energy-kcal_100g"], "kcal")}</dd></div>
              <div><dt>Fat</dt><dd>${nutritionValue(nutrients.fat_100g)}</dd></div>
              <div><dt>Carbs</dt><dd>${nutritionValue(nutrients.carbohydrates_100g)}</dd></div>
              <div><dt>Protein</dt><dd>${nutritionValue(nutrients.proteins_100g)}</dd></div>
            </dl>
          </div>
        </article>
      `;
    })
    .join("");
}

function getIngredientItems(meal) {
  return Array.from({ length: 20 }, (_, index) => index + 1)
    .map((number) => ({
      ingredient: meal[`strIngredient${number}`]?.trim(),
      measure: meal[`strMeasure${number}`]?.trim(),
    }))
    .filter(({ ingredient }) => ingredient);
}

function renderRecipeIngredients(meal) {
  const ingredients = getIngredientItems(meal);
  recipeNutritionElement.hidden = false;
  recipeNutritionElement.innerHTML = `
    <div class="recipe-nutrition__heading">
      <div>
        <p class="eyebrow">Recipe ingredients</p>
        <h2>${escapeHtml(meal.strMeal)}</h2>
        <p>All ingredients are selected. We will find the closest available product for each one.</p>
      </div>
      <button id="load-recipe-nutrition" type="button">Compare selected ingredients</button>
    </div>
    <fieldset class="ingredient-picker">
      <legend>Select ingredients to compare</legend>
      <div>
        ${ingredients
          .map(
            ({ ingredient, measure }) => `
              <label><input type="checkbox" name="recipe-ingredient" value="${escapeHtml(ingredient)}" checked />
                <span>${escapeHtml(ingredient)}</span><small>${escapeHtml(measure || "To taste")}</small>
              </label>`,
          )
          .join("")}
      </div>
    </fieldset>
    <p class="recipe-nutrition__note">Results are product values per 100 g. Recipe quantities and servings are not converted.</p>
  `;

  document.querySelector("#load-recipe-nutrition").addEventListener("click", loadSelectedIngredients);
}

function nutritionCard(product, ingredient) {
  const nutrients = product?.nutriments ?? {};
  const image = product?.image_front_small_url
    ? `<img src="${escapeHtml(product.image_front_small_url)}" alt="" loading="lazy" />`
    : `<div class="nutrition-card__image nutrition-card__image--empty" aria-hidden="true">Nutrition</div>`;
  return `
    <article class="nutrition-card">
      ${image}
      <div class="nutrition-card__body">
        <p class="nutrition-card__ingredient">${escapeHtml(ingredient)}</p>
        <h2>${escapeHtml(product?.product_name || "No matching product found")}</h2>
        <p>${escapeHtml(product?.brands || "Try the manual search below")}</p>
        <dl>
          <div><dt>Calories</dt><dd>${nutritionValue(nutrients["energy-kcal_100g"], "kcal")}</dd></div>
          <div><dt>Fat</dt><dd>${nutritionValue(nutrients.fat_100g)}</dd></div>
          <div><dt>Carbs</dt><dd>${nutritionValue(nutrients.carbohydrates_100g)}</dd></div>
          <div><dt>Protein</dt><dd>${nutritionValue(nutrients.proteins_100g)}</dd></div>
        </dl>
      </div>
    </article>
  `;
}

async function loadSelectedIngredients() {
  const ingredients = [...document.querySelectorAll('input[name="recipe-ingredient"]:checked')].map(
    (input) => input.value,
  );
  if (!ingredients.length) {
    countElement.textContent = "Select at least one ingredient";
    return;
  }

  const compareButton = document.querySelector("#load-recipe-nutrition");
  compareButton.disabled = true;
  countElement.textContent = `Comparing 0 of ${ingredients.length} ingredients...`;
  renderMessage("Loading ingredient values", "Open Food Facts is finding products for the selected ingredients.");
  try {
    const matches = [];
    for (const [index, ingredient] of ingredients.entries()) {
      countElement.textContent = `Comparing ${index + 1} of ${ingredients.length} ingredients...`;
      try {
        const products = await services.searchProducts(ingredient);
        matches.push({ ingredient, product: products.find((product) => product.product_name) });
      } catch {
        matches.push({ ingredient, product: null });
      }
    }
    const foundMatches = matches.filter(({ product }) => product);
    const unavailableIngredients = matches
      .filter(({ product }) => !product)
      .map(({ ingredient }) => ingredient);
    const foundCount = foundMatches.length;
    countElement.textContent = `${foundCount} of ${matches.length} ingredients found · values per 100 g`;
    resultsElement.innerHTML = `
      ${unavailableIngredients.length ? `
        <aside class="nutrition-unavailable">
          <strong>No product match found for:</strong>
          <span>${unavailableIngredients.map(escapeHtml).join(", ")}</span>
          <p>Use the manual search if you want to try a different product name.</p>
        </aside>` : ""}
      ${foundMatches.map(({ ingredient, product }) => nutritionCard(product, ingredient)).join("")}
    `;
  } finally {
    compareButton.disabled = false;
  }
}

async function handleSearch(event) {
  event.preventDefault();
  const query = new FormData(event.currentTarget).get("query").trim();
  countElement.textContent = "Searching nutrition...";
  renderMessage("Searching products", "Looking up nutrition information.");

  try {
    renderProducts(await services.searchProducts(query));
  } catch (error) {
    countElement.textContent = "Search unavailable";
    renderMessage("Something went wrong", error.message, true);
  }
}

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#nutrition-form").addEventListener("submit", handleSearch);
  const recipeId = new URLSearchParams(window.location.search).get("recipe");
  if (!recipeId) return;

  try {
    const meal = await recipeServices.getMealById(recipeId);
    if (meal) renderRecipeIngredients(meal);
  } catch {
    // Manual product search remains available if the recipe cannot be loaded.
  }
}

init();
