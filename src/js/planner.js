import { getFavorites, getMealPlan, setPlannedMeal } from "./storage.js";
import { loadPartial } from "./utils.js";

const plannerGrid = document.querySelector("#planner-grid");
const weekLabel = document.querySelector("#week-label");
let weekOffset = 0;

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDates() {
  const monday = new Date();
  const weekday = monday.getDay() || 7;
  monday.setDate(monday.getDate() - weekday + 1 + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function recipeOptions(selectedId) {
  const favorites = getFavorites();
  const options = favorites
    .map(
      (meal) =>
        `<option value="${meal.idMeal}" ${meal.idMeal === selectedId ? "selected" : ""}>${meal.strMeal}</option>`,
    )
    .join("");
  return `<option value="">No meal planned</option>${options}`;
}

function mealSlot(date, type, meal) {
  return `
    <label class="meal-slot">
      <span>${type === "lunch" ? "Lunch" : "Dinner"}</span>
      <select data-date="${toDateKey(date)}" data-meal-type="${type}">
        ${recipeOptions(meal?.idMeal)}
      </select>
    </label>
  `;
}

function renderPlan() {
  const dates = getWeekDates();
  const plan = getMealPlan();
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  weekLabel.textContent = `${formatter.format(dates[0])} - ${formatter.format(dates[6])}`;

  plannerGrid.innerHTML = dates
    .map((date) => {
      const dateKey = toDateKey(date);
      const dayPlan = plan[dateKey] ?? {};
      return `
        <article class="day-card">
          <h2>${new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)}</h2>
          <p>${formatter.format(date)}</p>
          ${mealSlot(date, "lunch", dayPlan.lunch)}
          ${mealSlot(date, "dinner", dayPlan.dinner)}
        </article>
      `;
    })
    .join("");
}

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  renderPlan();

  document.querySelector("#previous-week").addEventListener("click", () => {
    weekOffset -= 1;
    renderPlan();
  });
  document.querySelector("#next-week").addEventListener("click", () => {
    weekOffset += 1;
    renderPlan();
  });
  plannerGrid.addEventListener("change", (event) => {
    const select = event.target.closest("select[data-date]");
    if (!select) return;
    const meal = getFavorites().find((item) => item.idMeal === select.value);
    setPlannedMeal(select.dataset.date, select.dataset.mealType, meal);
  });
}

init();
