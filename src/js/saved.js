import ExternalServices from "./external-services.js";
import {
  getManualShoppingMeals,
  getFavorites,
  getPlannedMeals,
  getShoppingState,
  removeFavorite,
  removeShoppingItem,
  resetShoppingList,
  toggleShoppingItem,
} from "./storage.js";
import { escapeHtml, loadPartial } from "./utils.js";

const services = new ExternalServices();
const favoritesElement = document.querySelector("#favorites-list");
const countElement = document.querySelector("#favorites-count");
const shoppingElement = document.querySelector("#shopping-list");
let shoppingItems = [];

function renderFavorites() {
  const favorites = getFavorites();
  countElement.textContent = `${favorites.length} saved recipe${favorites.length === 1 ? "" : "s"}`;

  if (!favorites.length) {
    favoritesElement.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon" aria-hidden="true">+</span>
        <h2>No favorites yet</h2>
        <p>Open a recipe and use Add to favorites to save it here.</p>
      </div>
    `;
    return;
  }

  favoritesElement.innerHTML = favorites
    .map(
      (meal) => `
        <article class="recipe-card favorite-card">
          <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
          <div class="recipe-card__body">
            <h3>${escapeHtml(meal.strMeal)}</h3>
            <p>${escapeHtml(meal.strCategory ?? "Recipe")}${meal.strArea ? ` · ${escapeHtml(meal.strArea)}` : ""}</p>
            <div class="favorite-card__actions">
              <a class="card-button" href="/recipe/?id=${meal.idMeal}">View Details</a>
              <button class="card-button" type="button" data-remove-id="${meal.idMeal}">♥ Favorited</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderShoppingList() {
  const state = getShoppingState();
  const items = shoppingItems.filter((item) => !state.removed[item.id]);

  if (!items.length) {
    shoppingElement.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon" aria-hidden="true">+</span>
        <h3>No ingredients to buy</h3>
        <p>Add favorite recipes to your weekly plan to generate a shopping list.</p>
      </div>
    `;
    return;
  }

  shoppingElement.innerHTML = `
    <ul class="shopping-list">
      ${items
        .map(
          (item) => `
            <li class="${state.checked[item.id] ? "is-checked" : ""}">
              <label>
                <input type="checkbox" data-shopping-id="${item.id}" ${state.checked[item.id] ? "checked" : ""} />
                <span>${escapeHtml(item.name)}</span>
              </label>
              <span class="shopping-measure">${item.measures.map(escapeHtml).join(", ")}</span>
              <button type="button" data-remove-shopping-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">Remove</button>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

async function loadShoppingList() {
  const shoppingMeals = [...getPlannedMeals(), ...getManualShoppingMeals()];
  const uniqueMeals = [...new Map(shoppingMeals.map((meal) => [meal.idMeal, meal])).values()];

  if (!uniqueMeals.length) {
    shoppingItems = [];
    renderShoppingList();
    return;
  }

  shoppingElement.innerHTML = `<p class="results-count">Building your shopping list...</p>`;
  try {
    const meals = await Promise.all(uniqueMeals.map((meal) => services.getMealById(meal.idMeal)));
    const grouped = new Map();

    meals.filter(Boolean).forEach((meal) => {
      for (let number = 1; number <= 20; number += 1) {
        const name = meal[`strIngredient${number}`]?.trim();
        const measure = meal[`strMeasure${number}`]?.trim();
        if (!name) continue;
        const id = name.toLowerCase();
        const item = grouped.get(id) ?? { id, name, measures: [] };
        if (measure && !item.measures.includes(measure)) item.measures.push(measure);
        grouped.set(id, item);
      }
    });

    shoppingItems = [...grouped.values()].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
    renderShoppingList();
  } catch {
    shoppingElement.innerHTML = `
      <div class="empty-state empty-state--error">
        <span class="empty-state__icon" aria-hidden="true">!</span>
        <h3>Shopping list unavailable</h3>
        <p>Try again when the recipe service is available.</p>
      </div>
    `;
  }
}

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  renderFavorites();
  loadShoppingList();

  favoritesElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-id]");
    if (!button) return;
    removeFavorite(button.dataset.removeId);
    renderFavorites();
  });
  shoppingElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-shopping-id]");
    if (!button) return;
    removeShoppingItem(button.dataset.removeShoppingId);
    renderShoppingList();
  });
  shoppingElement.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-shopping-id]");
    if (!checkbox) return;
    toggleShoppingItem(checkbox.dataset.shoppingId);
    renderShoppingList();
  });
  document.querySelector("#reset-shopping-list").addEventListener("click", () => {
    resetShoppingList();
    renderShoppingList();
  });
}

init();
