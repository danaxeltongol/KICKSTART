// One page for every shoe: product.html?id=af1
//
// It reads the shoe from the database (or from products.js before
// Firebase is connected), fills in the page, shows what sizes are
// left, and handles Add to Cart.

(async function () {
  const details = document.getElementById('prodetails');
  const related = document.getElementById('related');

  const slug = new URLSearchParams(location.search).get('id') || '';
  let product = null;

  try {
    product = slug ? await KS.getProduct(slug) : null;
  } catch (error) {
    console.error(error);
  }

  // ---------- no such shoe ----------
  if (!product) {
    details.innerHTML =
      '<div class="notfound">' +
        '<h2>Shoe not found</h2>' +
        '<p>This shoe may have been removed from the shop.</p>' +
        '<br><a class="normal" href="shop.html">Back to Shop</a>' +
      '</div>';
    return;
  }

  document.title = 'Kickstart | ' + product.title;

  // ---------- the shoe ----------
  const sizes = product.stock ? Object.keys(product.stock) : KS_SIZES;
  const options = sizes.map(function (size) {
    const left = product.stock ? product.stock[size] : null;
    const soldOut = (left !== null && left <= 0);
    return '<option' + (soldOut ? ' disabled' : '') + ' value="' + KS.escapeHtml(size) + '">' +
             KS.escapeHtml(size) + (soldOut ? ' - Sold out' : '') +
           '</option>';
  }).join('');

  details.innerHTML = `
    <div class="singleproimage">
      <img src="${KS.escapeHtml(product.image)}" width="90%" height="90%" alt="${KS.escapeHtml(product.name)}">
    </div>

    <div class="singledeets">
      <h3><i> ${KS.escapeHtml(product.brand)} </i></h3>
      <h2> ${KS.escapeHtml(product.title)} </h2>
      <h1>${KS.formatPeso(product.price).replace('.00', '')}</h1>
      <br>
      <select>
        <option>Select Size</option>
        ${options}
      </select>
      <p id="stock-note"></p>

      <button class="normal add-to-cart"
        data-name="${KS.escapeHtml(product.name)}" data-product="${KS.escapeHtml(product.slug)}"
        data-price="${product.price}"> Add to Cart
      </button>
      <br>
      <br>
      <h4> PRODUCT DETAILS </h4>
      <br>
      <span>${KS.escapeHtml(product.description)}</span>
    </div>
  `;

  const select = details.querySelector('select');
  const button = details.querySelector('.add-to-cart');
  const note = document.getElementById('stock-note');

  // ---------- how many pairs are left ----------
  function showStock() {
    if (!product.stock) return;                 // stock is not tracked yet
    const left = product.stock[select.value];

    if (left === undefined) { note.textContent = ''; return; }
    if (left <= 0) {
      note.textContent = 'Out of stock in ' + select.value;
      note.style.color = 'crimson';
    } else if (left <= 3) {
      note.textContent = 'Only ' + left + ' left in ' + select.value;
      note.style.color = '#a33a12';
    } else {
      note.textContent = 'In stock';
      note.style.color = '#0f5132';
    }
  }

  if (product.stock && !sizes.some(function (s) { return product.stock[s] > 0; })) {
    button.disabled = true;
    button.textContent = 'Sold Out';
    note.textContent = 'This shoe is sold out in every size.';
    note.style.color = 'crimson';
  } else {
    select.addEventListener('change', showStock);
  }

  // ---------- add to cart ----------
  button.addEventListener('click', async () => {
    const size = select.value;
    if (size === 'Select Size') {
      alert('Please select a shoe size first!');
      return;
    }

    button.disabled = true;
    try {
      await KS.addToCart({
        slug: product.slug,
        name: product.name,
        price: product.price,
        size: size,
        image: product.image,
        qty: 1
      });
      alert(`${product.name} (Size: ${size}) added to cart!`);
    } catch (error) {
      alert(KS.friendlyError(error));
    } finally {
      button.disabled = false;
    }
  });

  // ---------- other shoes at the bottom ----------
  try {
    const all = await KS.getProducts();
    const others = all.filter(function (p) { return p.slug !== product.slug; }).slice(0, 4);
    related.innerHTML = others.map(function (p) {
      return `
        <div class="arrival" onclick="window.location.href='product.html?id=${encodeURIComponent(p.slug)}'">
          <img src="${KS.escapeHtml(p.image)}" alt="${KS.escapeHtml(p.name)}">
          <div class="descript">
            <span>${KS.escapeHtml(p.brand)}</span>
            <h5>${KS.escapeHtml(p.title)}</h5>
            <h4>${KS.formatPeso(p.price).replace('.00', '')}</h4>
          </div>
        </div>`;
    }).join('');
  } catch (error) {
    console.warn(error);
  }
})();
