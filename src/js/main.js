import ExternalServices from "./external-services.js";
import { isFavorite, toggleFavorite } from "./storage.js";
import { loadPartial } from "./utils.js";

const services = new ExternalServices();
const resultsElement = document.querySelector("#recipe-results");
const resultsCount = document.querySelector("#results-count");

function renderMessage(title, message, isError = false) {
  resultsElement.innerHTML = `
    <div class="empty-state${isError ? " empty-state--error" : ""}">
      <span class="empty-state__icon" aria-hidden="true">${isError ? "!" : "?"}</span>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

function renderRecipes(meals) {
  if (!meals.length) {
    resultsCount.textContent = "0 recipes";
    renderMessage("No recipes found", "Try another spelling, ingredient, or category.");
    return;
  }

  resultsCount.textContent = `${meals.length} recipes`;
  resultsElement.innerHTML = meals
    .map(
      (meal) => `
        <article class="recipe-card" data-meal-id="${meal.idMeal}">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" />
          <div class="recipe-card__body">
            <h3>${meal.strMeal}</h3>
            <p>${meal.strCategory ?? "Recipe"}</p>
            <div class="recipe-card__actions">
              <a class="card-button" href="/recipe/?id=${meal.idMeal}">View Details</a>
              <button class="card-button" type="button" data-favorite-id="${meal.idMeal}">
                ${isFavorite(meal.idMeal) ? "♥ Favorited" : "♡ Favorite"}
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

async function handleSearch(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const query = formData.get("query").trim();
  const category = formData.get("category");

  if (!query && !category) {
    resultsCount.textContent = "Start with a search";
    renderMessage("Add a search term", "Enter a recipe name, ingredient, or choose a category.");
    return;
  }

  resultsCount.textContent = "Searching...";
  renderMessage("Finding recipes", "Searching TheMealDB for meal ideas.");

  try {
    let meals = category
      ? await services.searchByCategory(category)
      : await services.searchByName(query);
    if (!category && !meals.length) meals = await services.searchByIngredient(query);
    renderRecipes(meals);
  } catch (error) {
    resultsCount.textContent = "Search unavailable";
    renderMessage("Something went wrong", error.message, true);
  }
}

async function loadCategories() {
  const categorySelect = document.querySelector("#category-filter");
  try {
    const categories = await services.getCategories();
    categorySelect.insertAdjacentHTML(
      "beforeend",
      categories.map((category) => `<option value="${category.strCategory}">${category.strCategory}</option>`).join(""),
    );
  } catch {
    categorySelect.disabled = true;
  }
}

function handleFavorite(event) {
  const button = event.target.closest("[data-favorite-id]");
  if (!button) return;
  const card = button.closest(".recipe-card");
  const saved = toggleFavorite({
    idMeal: button.dataset.favoriteId,
    strMeal: card.querySelector("h3").textContent,
    strMealThumb: card.querySelector("img").src,
    strCategory: card.querySelector("p").textContent,
  });
  button.textContent = saved ? "♥ Favorited" : "♡ Favorite";
}

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#recipe-search-form").addEventListener("submit", handleSearch);
  resultsElement.addEventListener("click", handleFavorite);
  loadCategories();
}

init();
