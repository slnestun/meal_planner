import "../css/style.css";
import { loadPartial } from "./utils.js";

async function init() {
  await loadPartial("#main-header", "/partials/header.html");
  await loadPartial("#main-footer", "/partials/footer.html");

  document.querySelector("#current-year").textContent = new Date().getFullYear();
}

init();
