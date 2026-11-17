// The shop page. Draws a card for every shoe in the database
// (or from products.js before Firebase is connected).

(async function () {
  const grid = document.getElementById('procontainer');
  const arrivals = document.getElementById('arrivals');

  function card(product, cls) {
    return `
      <div class="${cls}" onclick="window.location.href='product.html?id=${encodeURIComponent(product.slug)}'">
        <img src="${KS.escapeHtml(product.image)}" alt="${KS.escapeHtml(product.name)}">
        <div class="${cls === 'pro' ? 'des' : 'descript'}">
          <span>${KS.escapeHtml(product.brand)}</span>
          <h5>${KS.escapeHtml(product.title)}</h5>
          <h4>${KS.formatPeso(product.price).replace('.00', '')}</h4>
        </div>
      </div>`;
  }

  let products = [];
  try {
    products = await KS.getProducts();
  } catch (error) {
    console.error(error);
  }

  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;">No shoes in the shop yet.</p>';
    return;
  }

  // the four shoes added most recently go in the NEW ARRIVALS strip,
  // the rest fill the main grid, so no shoe is shown twice
  const newest = products.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 4);
  const rest = products.filter(function (p) { return newest.indexOf(p) === -1; });

  grid.innerHTML = (rest.length ? rest : products).map(function (p) { return card(p, 'pro'); }).join('');
  arrivals.innerHTML = newest.map(function (p) { return card(p, 'arrival'); }).join('');
})();
