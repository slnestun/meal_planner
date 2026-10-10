import ExternalServices from "./external-services.js";
import { isFavorite, toggleFavorite } from "./storage.js";
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

function getIngredients(meal) {
  return Array.from({ length: 20 }, (_, index) => index + 1)
    .map((number) => ({
      ingredient: meal[`strIngredient${number}`]?.trim(),
      measure: meal[`strMeasure${number}`]?.trim(),
    }))
    .filter(({ ingredient }) => ingredient)
    .map(
      ({ ingredient, measure }) => `
        <li>
          <span>${escapeHtml(ingredient)}</span>
          <span>${escapeHtml(measure || "To taste")}</span>
        </li>
      `,
    )
    .join("");
}

function renderRecipe(meal) {
  const instructions = escapeHtml(meal.strInstructions)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((step) => `<p>${step}</p>`)
    .join("");

  document.title = `${meal.strMeal} | Meal Planner`;
  detailElement.innerHTML = `
    <article class="recipe-detail">
      <div class="recipe-detail__hero">
        <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" />
        <div>
          <p class="eyebrow">${escapeHtml(meal.strCategory || "Recipe")}</p>
          <h1>${escapeHtml(meal.strMeal)}</h1>
          <p class="recipe-detail__meta">${escapeHtml(meal.strArea || "International cuisine")}</p>
          <button class="favorite-button" type="button" data-favorite-id="${meal.idMeal}">
            ${isFavorite(meal.idMeal) ? "Remove from favorites" : "Add to favorites"}
          </button>
          ${
            meal.strYoutube
              ? `<a class="video-link" href="${escapeHtml(meal.strYoutube)}" target="_blank" rel="noreferrer">Watch video tutorial</a>`
              : ""
          }
        </div>
      </div>

      <div class="recipe-detail__content">
        <section class="ingredients" aria-labelledby="ingredients-title">
          <h2 id="ingredients-title">Ingredients</h2>
          <ul>${getIngredients(meal)}</ul>
        </section>

        <section class="instructions" aria-labelledby="instructions-title">
          <h2 id="instructions-title">Instructions</h2>
          ${instructions}
        </section>
      </div>
    </article>
  `;

  document.querySelector("[data-favorite-id]").addEventListener("click", (event) => {
    const saved = toggleFavorite(meal);
    event.currentTarget.textContent = saved
      ? "Remove from favorites"
      : "Add to favorites";
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

  if (!id) {
    renderError();
    return;
  }

  try {
    const meal = await services.getMealById(id);
    if (!meal) {
      renderError();
      return;
    }
    renderRecipe(meal);
  } catch {
    renderError();
  }
}

init();
