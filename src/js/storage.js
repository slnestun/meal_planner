const FAVORITES_KEY = "mealPlannerFavorites";
const PLAN_KEY = "mealPlannerPlan";
const SHOPPING_STATE_KEY = "mealPlannerShoppingState";

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getFavorites() {
  return read(FAVORITES_KEY, []);
}

export function isFavorite(id) {
  return getFavorites().some((meal) => meal.idMeal === id);
}

export function toggleFavorite(meal) {
  const favorites = getFavorites();
  const existingIndex = favorites.findIndex((item) => item.idMeal === meal.idMeal);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    write(FAVORITES_KEY, favorites);
    return false;
  }

  favorites.push({
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb,
    strCategory: meal.strCategory,
    strArea: meal.strArea,
  });
  write(FAVORITES_KEY, favorites);
  return true;
}

export function removeFavorite(id) {
  write(
    FAVORITES_KEY,
    getFavorites().filter((meal) => meal.idMeal !== id),
  );
}

export function getMealPlan() {
  return read(PLAN_KEY, {});
}

export function setPlannedMeal(date, mealType, meal) {
  const plan = getMealPlan();
  const day = plan[date] ?? {};

  if (meal) {
    day[mealType] = meal;
  } else {
    delete day[mealType];
  }

  if (Object.keys(day).length) {
    plan[date] = day;
  } else {
    delete plan[date];
  }

  write(PLAN_KEY, plan);
}

export function getPlannedMeals() {
  return Object.values(getMealPlan()).flatMap((day) => Object.values(day));
}

export function getShoppingState() {
  return read(SHOPPING_STATE_KEY, { checked: {}, removed: {} });
}

export function toggleShoppingItem(id) {
  const state = getShoppingState();
  state.checked[id] = !state.checked[id];
  write(SHOPPING_STATE_KEY, state);
}

export function removeShoppingItem(id) {
  const state = getShoppingState();
  state.removed[id] = true;
  write(SHOPPING_STATE_KEY, state);
}

export function resetShoppingList() {
  write(SHOPPING_STATE_KEY, { checked: {}, removed: {} });
}
