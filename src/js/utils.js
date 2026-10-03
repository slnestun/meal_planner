/** Loads an HTML partial into the element identified by selector. */
export async function loadPartial(selector, filePath) {
  const container = document.querySelector(selector);
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Could not load ${filePath}`);
  }

  container.innerHTML = await response.text();
}
