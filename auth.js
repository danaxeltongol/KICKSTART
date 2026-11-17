// ============================================================
//  KICKSTART - accounts, cart, orders and stock
//
//  Loaded on every page. It gives the other scripts one object,
//  KS, with everything they need:
//
//    KS.ready            -> Promise that gives the logged-in user (or null)
//    KS.signUp / signIn / signOut / resetPassword / changePassword ...
//    KS.getCart / addToCart / setQty / removeFromCart / clearCart
//    KS.getProfile / saveProfile / placeOrder / getOrders
//    KS.getStock                                   (product pages)
//    KS.isAdmin / getCatalogue / saveStock / loadCatalogue
//    KS.getAllOrders / updateOrderStatus           (admin page)
//
//  Logged in  -> the cart is saved in the database (Firestore)
//  Logged out -> the cart is kept in the browser (localStorage),
//                and moved into the account when the user logs in
// ============================================================

const KS = (function () {
  const GUEST_CART_KEY = 'cart';
  const MAX_QTY = 10;
  const NO_IMAGE = 'images/logonobg.png';
  const STATUSES = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  // ---------- connect to Firebase ----------
  const config = (typeof firebaseConfig !== 'undefined') ? firebaseConfig : null;
  const firebaseLoaded = (typeof firebase !== 'undefined');
  const configured = !!(firebaseLoaded && config && config.apiKey &&
                        config.apiKey.indexOf('PASTE') !== 0);

  let auth = null;
  let db = null;
  if (configured) {
    firebase.initializeApp(config);
    auth = firebase.auth();
    db = firebase.firestore();
  }

  const NOT_SET_UP = 'Accounts are not connected yet. Paste your Firebase keys in firebase-config.js (see README.md).';

  function needFirebase() {
    if (!configured) throw new Error(NOT_SET_UP);
  }

  // ---------- where everything lives in the database ----------
  //  users/{uid}                  -> profile (name, address, contact)
  //  users/{uid}/cart/{itemId}    -> shoes in the cart
  //  products/{slug}              -> one shoe
  //  products/{slug}/sizes/{size} -> how many pairs are left
  //  orders/{orderId}             -> one order, stamped with its uid
  //  admins/{uid}                 -> made by hand in the Firebase console
  function userDoc(uid) { return db.collection('users').doc(uid); }
  function cartCol(uid) { return userDoc(uid).collection('cart'); }
  function productsCol() { return db.collection('products'); }
  function sizesCol(slug) { return productsCol().doc(slug).collection('sizes'); }
  function ordersCol() { return db.collection('orders'); }

  // "9 US" -> "9-us", so it can be used as a document name
  function sizeId(size) {
    return String(size).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  // Every cart item ends up in this shape, no matter where it was saved
  function cleanItem(item) {
    let qty = parseInt(item.qty, 10);
    if (!(qty >= 1)) qty = 1;
    if (qty > MAX_QTY) qty = MAX_QTY;
    return {
      slug: String(item.slug || ''),
      name: String(item.name || 'Shoe'),
      price: Number(item.price) || 0,
      size: String(item.size || ''),
      image: String(item.image || NO_IMAGE),
      qty: qty
    };
  }

  function sameShoe(a, b) {
    return a.name === b.name && a.size === b.size;
  }

  // ---------- guest cart (browser only) ----------
  function readGuestCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(GUEST_CART_KEY));
      return Array.isArray(saved) ? saved.map(cleanItem) : [];
    } catch (e) {
      return [];
    }
  }

  function writeGuestCart(items) {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }

  // ---------- account cart (database) ----------
  async function readAccountCart(uid) {
    const snapshot = await cartCol(uid).orderBy('addedAt').get();
    const items = [];
    snapshot.forEach(function (doc) {
      items.push(Object.assign({ id: doc.id }, cleanItem(doc.data())));
    });
    return items;
  }

  // Move whatever is in the guest cart into the logged-in account.
  let mergeInProgress = null;
  function mergeGuestCart() {
    if (mergeInProgress) return mergeInProgress;
    const user = auth && auth.currentUser;
    const guestItems = readGuestCart();
    if (!user || guestItems.length === 0) return Promise.resolve();

    mergeInProgress = readAccountCart(user.uid)
      .then(function (saved) {
        const batch = db.batch();
        const now = Date.now();
        guestItems.forEach(function (item, i) {
          const match = saved.find(function (s) { return sameShoe(s, item); });
          if (match) {
            // same shoe + size already in the account: add the quantities together
            match.qty = Math.min(MAX_QTY, match.qty + item.qty);
            batch.set(cartCol(user.uid).doc(match.id), { qty: match.qty }, { merge: true });
          } else {
            batch.set(cartCol(user.uid).doc(), Object.assign({ addedAt: now + i }, item));
          }
        });
        return batch.commit();
      })
      .then(function () { writeGuestCart([]); })
      .finally(function () { mergeInProgress = null; });
    return mergeInProgress;
  }

  // ---------- who is logged in ----------
  let adminCheck = null;

  function updateNav(user) {
    const link = document.getElementById('account-link');
    if (!link) return;
    link.href = user ? 'account.html' : 'login.html';
    link.title = user ? 'My account' : 'Log in';
  }

  const ready = new Promise(function (resolve) {
    if (!auth) { resolve(null); return; }
    auth.onAuthStateChanged(function (user) {
      adminCheck = null;                       // different user, check again
      updateNav(user);
      if (!user) { resolve(null); return; }
      mergeGuestCart()
        .catch(function (e) { console.error('Could not move guest cart:', e); })
        .then(function () { resolve(user); });
    });
  });

  function currentUser() {
    return auth ? auth.currentUser : null;
  }

  // Is this the store owner? True only if admins/{uid} exists.
  function isAdmin() {
    if (adminCheck) return adminCheck;
    adminCheck = ready.then(function (user) {
      if (!user) return false;
      return db.collection('admins').doc(user.uid).get()
        .then(function (doc) { return doc.exists; })
        .catch(function () { return false; });
    });
    return adminCheck;
  }

  // ---------- accounts ----------
  async function signUp(name, email, password) {
    needFirebase();
    const result = await auth.createUserWithEmailAndPassword(email, password);
    const user = result.user;
    await user.updateProfile({ displayName: name });
    await userDoc(user.uid).set({
      name: name,
      email: user.email,
      createdAt: Date.now()
    }, { merge: true });
    // Verification email is a nice-to-have, never block sign up on it
    try { await user.sendEmailVerification(); } catch (e) { console.warn(e); }
    await mergeGuestCart();
    return user;
  }

  async function signIn(email, password) {
    needFirebase();
    const result = await auth.signInWithEmailAndPassword(email, password);
    await mergeGuestCart();
    return result.user;
  }

  function signOut() {
    needFirebase();
    return auth.signOut();
  }

  function resetPassword(email) {
    needFirebase();
    return auth.sendPasswordResetEmail(email);
  }

  // Firebase asks for the current password again before sensitive changes
  function confirmPassword(password) {
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    return user.reauthenticateWithCredential(credential);
  }

  async function changePassword(currentPassword, newPassword) {
    needFirebase();
    await confirmPassword(currentPassword);
    await auth.currentUser.updatePassword(newPassword);
  }

  // Sends a confirmation link to the NEW address. The email only
  // changes after the user clicks that link.
  async function changeEmail(currentPassword, newEmail) {
    needFirebase();
    await confirmPassword(currentPassword);
    await auth.currentUser.verifyBeforeUpdateEmail(newEmail);
  }

  function resendVerification() {
    needFirebase();
    return auth.currentUser.sendEmailVerification();
  }

  async function deleteDocs(refs) {
    if (refs.length === 0) return;
    const batch = db.batch();
    refs.forEach(function (ref) { batch.delete(ref); });
    await batch.commit();
  }

  async function deleteEverythingIn(collection) {
    const snapshot = await collection.get();
    const refs = [];
    snapshot.forEach(function (doc) { refs.push(doc.ref); });
    await deleteDocs(refs);
  }

  async function deleteAccount(password) {
    needFirebase();
    await confirmPassword(password);
    const user = auth.currentUser;
    await deleteEverythingIn(cartCol(user.uid));

    const myOrders = await ordersCol().where('uid', '==', user.uid).get();
    const refs = [];
    myOrders.forEach(function (doc) { refs.push(doc.ref); });
    await deleteDocs(refs);

    await userDoc(user.uid).delete();
    await user.delete();
  }

  // ---------- profile ----------
  async function getProfile() {
    await ready;
    const user = currentUser();
    if (!user) return { name: '', address: '', contact: '' };
    const doc = await userDoc(user.uid).get();
    const data = doc.exists ? doc.data() : {};
    return {
      name: data.name || user.displayName || '',
      address: data.address || '',
      contact: data.contact || ''
    };
  }

  async function saveProfile(profile) {
    needFirebase();
    const user = auth.currentUser;
    await userDoc(user.uid).set({
      name: profile.name,
      address: profile.address,
      contact: profile.contact,
      email: user.email
    }, { merge: true });
    await user.updateProfile({ displayName: profile.name });
  }

  // ---------- cart ----------
  // Every item looks like { id, slug, name, price, size, image, qty }
  async function getCart() {
    await ready;
    const user = currentUser();
    if (!user) {
      return readGuestCart().map(function (item, i) {
        return Object.assign({ id: String(i) }, item);
      });
    }
    return readAccountCart(user.uid);
  }

  // Adding the same shoe in the same size again raises its quantity
  async function addToCart(newItem) {
    await ready;
    const user = currentUser();
    const item = cleanItem(newItem);

    if (!user) {
      const items = readGuestCart();
      const match = items.find(function (s) { return sameShoe(s, item); });
      if (match) match.qty = Math.min(MAX_QTY, match.qty + item.qty);
      else items.push(item);
      writeGuestCart(items);
      return;
    }

    const saved = await readAccountCart(user.uid);
    const match = saved.find(function (s) { return sameShoe(s, item); });
    if (match) {
      await cartCol(user.uid).doc(match.id).set(
        { qty: Math.min(MAX_QTY, match.qty + item.qty) }, { merge: true });
    } else {
      await cartCol(user.uid).add(Object.assign({ addedAt: Date.now() }, item));
    }
  }

  async function setQty(id, qty) {
    qty = parseInt(qty, 10);
    if (!(qty >= 1)) return removeFromCart(id);
    if (qty > MAX_QTY) qty = MAX_QTY;

    await ready;
    const user = currentUser();
    if (!user) {
      const items = readGuestCart();
      if (items[Number(id)]) items[Number(id)].qty = qty;
      writeGuestCart(items);
      return;
    }
    await cartCol(user.uid).doc(id).set({ qty: qty }, { merge: true });
  }

  async function removeFromCart(id) {
    await ready;
    const user = currentUser();
    if (!user) {
      const items = readGuestCart();
      items.splice(Number(id), 1);
      writeGuestCart(items);
      return;
    }
    await cartCol(user.uid).doc(id).delete();
  }

  async function clearCart() {
    await ready;
    const user = currentUser();
    if (!user) { writeGuestCart([]); return; }
    await deleteEverythingIn(cartCol(user.uid));
  }

  // ---------- shoes ----------
  // Gives back { "8 US": 5, "9 US": 0, ... } or null when the
  // catalogue has not been loaded into the database yet.
  async function getStock(slug) {
    if (!configured) return null;
    const snapshot = await sizesCol(slug).get();
    if (snapshot.empty) return null;

    // the database sorts "10 US" before "8 US" because it compares text,
    // so put the sizes back in number order before handing them over
    const sizes = [];
    snapshot.forEach(function (doc) {
      const data = doc.data();
      sizes.push({ label: data.label, stock: Number(data.stock) || 0 });
    });
    sizes.sort(function (a, b) { return parseFloat(a.label) - parseFloat(b.label); });

    const stock = {};
    sizes.forEach(function (size) { stock[size.label] = size.stock; });
    return stock;
  }

  // Fills in anything a shoe is missing, so the pages never show "undefined"
  function cleanProduct(slug, data) {
    const name = String(data.name || data.title || 'Shoe');
    return {
      slug: slug,
      name: name,
      title: String(data.title || name),
      brand: String(data.brand || ''),
      price: Number(data.price) || 0,
      image: String(data.image || NO_IMAGE),
      description: String(data.description || ''),
      order: Number(data.order) || 999,
      // before the database is filled, "newest" follows the order in products.js
      createdAt: Number(data.createdAt) || Number(data.order) || 0,
      stock: data.stock || null
    };
  }

  // The shoes the shop shows. Straight from the database, or - before
  // Firebase is connected or Load Catalogue is pressed - from products.js,
  // so the website always has something on the shelf.
  function builtInProducts() {
    if (typeof KS_PRODUCTS === 'undefined') return [];
    return KS_PRODUCTS.map(function (p) { return cleanProduct(p.slug, p); });
  }

  function sortProducts(list) {
    list.sort(function (a, b) {
      return (a.order - b.order) || a.name.localeCompare(b.name);
    });
    return list;
  }

  async function getProducts(withStock) {
    if (!configured) return sortProducts(builtInProducts());

    let snapshot;
    try {
      snapshot = await productsCol().get();
    } catch (e) {
      console.warn('Could not read the shoes:', e);
      return sortProducts(builtInProducts());
    }
    if (snapshot.empty) return sortProducts(builtInProducts());

    const products = [];
    snapshot.forEach(function (doc) { products.push(cleanProduct(doc.id, doc.data())); });

    if (withStock) {
      for (const product of products) product.stock = await getStock(product.slug);
    }
    return sortProducts(products);
  }

  async function getProduct(slug) {
    if (configured) {
      const doc = await productsCol().doc(slug).get();
      if (doc.exists) {
        const product = cleanProduct(doc.id, doc.data());
        product.stock = await getStock(slug);
        return product;
      }
    }
    const builtIn = builtInProducts().find(function (p) { return p.slug === slug; });
    return builtIn || null;
  }

  // "Nike Dunk Low" -> "nike-dunk-low", used as the document name
  function toSlug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  async function addProduct(data, startingStock) {
    needFirebase();
    const slug = toSlug(data.slug || data.name);
    if (!slug) throw new Error('Please give the shoe a name.');

    const existing = await productsCol().doc(slug).get();
    if (existing.exists) throw new Error('A shoe with that name is already in the shop.');

    await productsCol().doc(slug).set({
      name: data.name,
      title: data.title || data.name,
      brand: data.brand || '',
      price: Number(data.price) || 0,
      image: data.image || NO_IMAGE,
      description: data.description || '',
      order: Number(data.order) || 999,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const batch = db.batch();
    (data.sizes || KS_SIZES).forEach(function (label) {
      batch.set(sizesCol(slug).doc(sizeId(label)), {
        label: label,
        stock: Number(startingStock) || 0
      });
    });
    await batch.commit();
    return slug;
  }

  async function updateProduct(slug, data) {
    needFirebase();
    await productsCol().doc(slug).set({
      name: data.name,
      title: data.title || data.name,
      brand: data.brand || '',
      price: Number(data.price) || 0,
      image: data.image || NO_IMAGE,
      description: data.description || '',
      updatedAt: Date.now()
    }, { merge: true });
  }

  async function deleteProduct(slug) {
    needFirebase();
    await deleteEverythingIn(sizesCol(slug));     // its sizes first
    await productsCol().doc(slug).delete();
  }

  // ---------- orders ----------
  function newOrderNumber() {
    const d = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const date = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    const random = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
    return 'KS-' + date + '-' + random;
  }

  // Takes the stock off the shelf and writes the order in ONE transaction,
  // so two people buying the last pair at the same time cannot both win.
  async function placeOrder(order) {
    await ready;
    const user = currentUser();
    // Before the Firebase keys are pasted in, the shop still shows a
    // receipt so the checkout can be tried - it just saves nothing.
    if (configured && !user) throw new Error('Please log in to place your order.');

    const items = order.items.map(cleanItem);
    const record = {
      uid: user ? user.uid : 'demo',
      email: user ? user.email : '',
      orderNumber: newOrderNumber(),
      items: items,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      payment: order.payment,
      name: order.name,
      address: order.address,
      contact: order.contact,
      status: 'Processing',
      createdAt: Date.now()
    };

    if (!configured) return record;          // demo receipt, nothing saved

    const orderRef = ordersCol().doc();
    const tracked = items.filter(function (item) { return item.slug; });

    await db.runTransaction(async function (tx) {
      // every read first, then every write - that is how Firestore wants it
      const snaps = [];
      for (const item of tracked) {
        snaps.push(await tx.get(sizesCol(item.slug).doc(sizeId(item.size))));
      }

      snaps.forEach(function (snap, i) {
        if (!snap.exists) return;                 // this shoe is not tracked yet
        const left = Number(snap.data().stock) || 0;
        const item = tracked[i];
        if (left < item.qty) {
          throw new Error(left === 0
            ? item.name + ' (size ' + item.size + ') just sold out. Please remove it from your cart.'
            : 'Only ' + left + ' left of ' + item.name + ' in size ' + item.size + '. Please lower the quantity.');
        }
      });

      snaps.forEach(function (snap, i) {
        if (!snap.exists) return;
        tx.update(sizesCol(tracked[i].slug).doc(sizeId(tracked[i].size)),
                  { stock: (Number(snap.data().stock) || 0) - tracked[i].qty });
      });

      tx.set(orderRef, record);
    });

    return record;
  }

  async function getOrders() {
    await ready;
    const user = currentUser();
    if (!user) return [];
    const snapshot = await ordersCol().where('uid', '==', user.uid).get();
    const orders = [];
    snapshot.forEach(function (doc) {
      orders.push(Object.assign({ id: doc.id }, doc.data()));
    });
    orders.sort(function (a, b) { return b.createdAt - a.createdAt; });  // newest first
    return orders;
  }

  // ---------- admin only ----------
  async function getAllOrders() {
    needFirebase();
    const snapshot = await ordersCol().orderBy('createdAt', 'desc').limit(200).get();
    const orders = [];
    snapshot.forEach(function (doc) {
      orders.push(Object.assign({ id: doc.id }, doc.data()));
    });
    return orders;
  }

  function updateOrderStatus(id, status) {
    needFirebase();
    if (STATUSES.indexOf(status) === -1) throw new Error('Unknown status.');
    return ordersCol().doc(id).set({ status: status }, { merge: true });
  }

  // What the Store Admin page lists: only what is really in the database,
  // each shoe with its stock. Empty until Load Catalogue is pressed.
  async function getCatalogue() {
    needFirebase();
    const snapshot = await productsCol().get();
    const products = [];
    snapshot.forEach(function (doc) { products.push(cleanProduct(doc.id, doc.data())); });

    for (const product of products) {
      product.stock = (await getStock(product.slug)) || {};
    }
    return sortProducts(products);
  }

  // Copies products.js into the database. Safe to press again later:
  // it refreshes names and prices and leaves existing stock alone.
  async function loadCatalogue(list, sizes, defaultStock) {
    needFirebase();
    for (const product of list) {
      await productsCol().doc(product.slug).set({
        name: product.name,
        title: product.title || product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        description: product.description || '',
        order: product.order || 999,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      const existing = (await getStock(product.slug)) || {};
      const batch = db.batch();
      sizes.forEach(function (label) {
        batch.set(sizesCol(product.slug).doc(sizeId(label)), {
          label: label,
          stock: (label in existing) ? existing[label] : defaultStock
        });
      });
      await batch.commit();
    }
  }

  async function saveStock(slug, stock) {
    needFirebase();
    const batch = db.batch();
    Object.keys(stock).forEach(function (label) {
      let value = parseInt(stock[label], 10);
      if (!(value >= 0)) value = 0;
      batch.set(sizesCol(slug).doc(sizeId(label)), { label: label, stock: value });
    });
    await batch.commit();
  }

  // ---------- turn Firebase error codes into normal sentences ----------
  function friendlyError(error) {
    const code = (error && error.code) || '';
    const messages = {
      'auth/email-already-in-use': 'That email already has an account. Try logging in instead.',
      'auth/invalid-email': 'That email address does not look right.',
      'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
      'auth/user-not-found': 'Wrong email or password.',
      'auth/wrong-password': 'Wrong email or password.',
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/invalid-login-credentials': 'Wrong email or password.',
      'auth/missing-password': 'Please enter your password.',
      'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
      'auth/network-request-failed': 'No internet connection. Please try again.',
      'auth/requires-recent-login': 'Please log out, log in again, then retry.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/operation-not-allowed': 'Email/Password sign-in is not turned on in Firebase yet (see README.md).',
      'auth/api-key-not-valid': 'The Firebase keys in firebase-config.js are not valid.',
      'auth/invalid-api-key': 'The Firebase keys in firebase-config.js are not valid.',
      'auth/configuration-not-found': 'Authentication is not turned on in Firebase yet (see README.md).',
      'permission-denied': 'The database refused that. Check that you published the rules from firestore.rules.',
      'unavailable': 'Could not reach the database. Check your internet connection.'
    };
    return messages[code] || (error && error.message) || 'Something went wrong. Please try again.';
  }

  // true when the error means "the password you typed is wrong"
  function isWrongPassword(error) {
    return ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials']
      .indexOf(error && error.code) !== -1;
  }

  // Safe way to put user-typed text inside HTML
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatPeso(amount) {
    return '₱' + Number(amount).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  return {
    configured: configured,
    notSetUpMessage: NOT_SET_UP,
    maxQty: MAX_QTY,
    statuses: STATUSES,
    ready: ready,
    currentUser: currentUser,
    isAdmin: isAdmin,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    resetPassword: resetPassword,
    changePassword: changePassword,
    changeEmail: changeEmail,
    resendVerification: resendVerification,
    deleteAccount: deleteAccount,
    getProfile: getProfile,
    saveProfile: saveProfile,
    getCart: getCart,
    addToCart: addToCart,
    setQty: setQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getStock: getStock,
    getProducts: getProducts,
    getProduct: getProduct,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    placeOrder: placeOrder,
    getOrders: getOrders,
    getAllOrders: getAllOrders,
    updateOrderStatus: updateOrderStatus,
    getCatalogue: getCatalogue,
    loadCatalogue: loadCatalogue,
    saveStock: saveStock,
    friendlyError: friendlyError,
    isWrongPassword: isWrongPassword,
    escapeHtml: escapeHtml,
    formatPeso: formatPeso
  };
})();