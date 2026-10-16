/** Loads an HTML partial into the element identified by selector. */
export async function loadPartial(selector, filePath) {
  const container = document.querySelector(selector);
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Could not load ${filePath}`);
  }

  container.innerHTML = await response.text();

  if (selector === "#main-header") {
    const currentPath = window.location.pathname;
    container.querySelectorAll("a").forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      if (linkPath === currentPath) link.setAttribute("aria-current", "page");
    });
  }
}

/** Escapes text before it is inserted into an HTML template. */
export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ],
  );
}
