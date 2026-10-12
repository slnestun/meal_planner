import ExternalServices from "./external-services.js";
import {
  addMealToShoppingList,
  isFavorite,
  toggleFavorite,
} from "./storage.js";
import { loadPartial } from "./utils.js";

const services = new ExternalServices();
const detailElement = document.querySelector("#recipe-detail");

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}

function getIngredientItems(meal) {
  return Array.from({ length: 20 }, (_, index) => index + 1)
    .map((number) => ({
      ingredient: meal[`strIngredient${number}`]?.trim(),
      measure: meal[`strMeasure${number}`]?.trim(),
    }))
    .filter(({ ingredient }) => ingredient);
}

function getIngredients(meal) {
  return getIngredientItems(meal)
    .map(
      ({ ingredient, measure }) => `
        <li><span>${escapeHtml(ingredient)}</span><span>${escapeHtml(measure || "To taste")}</span></li>
      `,
    )
    .join("");
}

function getSteps(instructions) {
  const paragraphs = escapeHtml(instructions)
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean);
  const steps = paragraphs.length > 1 ? paragraphs : [paragraphs.join("")];
  return steps.map((step) => `<li>${step}</li>`).join("");
}

function renderRecipe(meal) {
  const description = meal.strInstructions.split(/[.!?]/)[0];
  const nutritionUrl = `/nutrition/?recipe=${encodeURIComponent(meal.idMeal)}`;
  document.title = `${meal.strMeal} | Meal Planner`;
  detailElement.innerHTML = `
    <article class="recipe-detail">
      <div class="recipe-detail__hero">
        <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" />
        <div class="recipe-summary">
          <h1>${escapeHtml(meal.strMeal)}</h1>
          <p class="recipe-description">${escapeHtml(description)}.</p>
          <p class="recipe-detail__meta">${escapeHtml(meal.strArea || "International")} · ${escapeHtml(meal.strCategory || "Recipe")}</p>
          <div class="recipe-actions">
            <button class="favorite-button" type="button" data-favorite-id="${meal.idMeal}">
              ${isFavorite(meal.idMeal) ? "♥ Favorited" : "Add to Favorites"}
            </button>
            <button class="plan-button" type="button" data-plan-id="${meal.idMeal}">Add to Meal Plan</button>
            <button class="shopping-button" type="button" data-shopping-meal-id="${meal.idMeal}">Add Ingredients to Shopping List</button>
          </div>
        </div>
      </div>

      <div class="recipe-detail__content">
        <section class="ingredients" aria-labelledby="ingredients-title">
          <div class="detail-heading"><h2 id="ingredients-title">Ingredients</h2><span>Recipe</span></div>
          <ul>${getIngredients(meal)}</ul>
        </section>

        <section class="instructions" aria-labelledby="instructions-title">
          <h2 id="instructions-title">Cooking instructions</h2>
          <ol class="instructions-list">${getSteps(meal.strInstructions)}</ol>
        </section>
      </div>

      <section class="nutrition-summary" aria-labelledby="nutrition-title">
        <div>
          <h2 id="nutrition-title">Nutrition per serving · approximate</h2>
          <p><a href="${nutritionUrl}">View the recipe ingredients in Nutrition</a> to compare current product values.</p>
        </div>
        <dl>
          <div><dt>Calories</dt><dd>—</dd></div>
          <div><dt>Protein</dt><dd>—</dd></div>
          <div><dt>Carbs</dt><dd>—</dd></div>
          <div><dt>Fat</dt><dd>—</dd></div>
        </dl>
      </section>
    </article>
  `;

  detailElement.querySelector("[data-favorite-id]").addEventListener("click", (event) => {
    const saved = toggleFavorite(meal);
    event.currentTarget.textContent = saved ? "♥ Favorited" : "Add to Favorites";
  });
  detailElement.querySelector("[data-plan-id]").addEventListener("click", () => {
    if (!isFavorite(meal.idMeal)) toggleFavorite(meal);
    window.location.href = "/planner/";
  });
  detailElement.querySelector("[data-shopping-meal-id]").addEventListener("click", (event) => {
    const added = addMealToShoppingList(meal);
    event.currentTarget.textContent = added
      ? "Added to Shopping List"
      : "Already in Shopping List";
  });
}

function renderError() {
  detailElement.innerHTML = `
    <div class="empty-state empty-state--error">
      <span class="empty-state__icon" aria-hidden="true">!</span>
      <h1>Recipe unavailable</h1>
      <p>We could not find this recipe. Return to the recipe search and try again.</p>
    </div>
  `;
}

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return renderError();

  try {
    const meal = await services.getMealById(id);
    if (!meal) return renderError();
    renderRecipe(meal);
  } catch {
    renderError();
  }
}

init();
