# KICKSTART

Sneaker store website by Dan Axel M. Tongol. Built with plain HTML, CSS and JavaScript, with Firebase for accounts and the database.

## Features

- Shop page and product pages built from the database
- Cart with a photo of every shoe, quantity buttons, voucher code and totals
- 3-step checkout: Cart, Delivery Details (with checks on name, address and mobile number, plus payment method), Order Placed receipt with an order number
- Create account, log in, log out
- Forgot password (reset link sent by email)
- My Account page: delivery details, order history, change password, change email, email verification, delete account
- Cart is saved in the database per account, so it follows you to any device
- Guests can browse and fill a cart; it moves into their account when they log in
- Stock per size, kept on the product page, the cart and the admin page
- Store admin page: add, edit and delete shoes, stock per size, every order with its customer, order status (Processing to Delivered), sales totals

## Scope

Orders are paid **Cash on Delivery, GCash on Delivery or at store pickup**, so the site takes orders rather than card payments. Stock is taken off the shelf inside a database transaction when an order is placed, so the last pair cannot be sold twice.

The shop reads its shoes from the database. Before Firebase is connected, it falls back to `products.js` so the site still works.

Planned: email confirmation after an order, and a delivery tracking page.

## Setup (one time, about 15 minutes)

The site needs a free Firebase project to store accounts and carts.

### 1. Create the Firebase project

1. Go to <https://console.firebase.google.com> and sign in with a Google account.
2. Click **Create a project**, name it `kickstart`, and finish the steps (Google Analytics can be turned off).

### 2. Turn on accounts

1. In the left menu open **Build -> Authentication** and click **Get started**.
2. In **Sign-in method**, choose **Email/Password**, enable it, and save.

### 3. Create the database

1. In the left menu open **Build -> Firestore Database** and click **Create database**.
2. Pick a location near you (for the Philippines, `asia-southeast1` Singapore) and start in **production mode**.
3. Open the **Rules** tab, delete what is there, paste everything from `firestore.rules`, and click **Publish**.

### 4. Connect the website

1. Click the gear icon -> **Project settings**. Under **Your apps**, click the web icon `</>`, give it any nickname, and register it (no need for Firebase Hosting).
2. Firebase shows a `firebaseConfig = { ... }` block. Copy the values.
3. Open `firebase-config.js` in VS Code and replace the `PASTE_...` values with yours. Save.

That is the only file that needs editing.

### 5. Make yourself the store owner

1. Create your account on the website first (Sign Up), so Firebase knows about you.
2. In the Firebase console open **Authentication -> Users** and copy your **User UID**.
3. Open **Firestore Database -> Data**, click **Start collection**, name it `admins`, and set the **Document ID** to the UID you copied. Add one field, `email`, with your email as the value, and save.
4. Reload the site. **Store Admin** now appears in the menu on My Account, and `admin.html` lets you in.

Nobody can make themselves an admin from the website; the rules only allow it from this console.

### 6. Fill the shop with stock

Open **Store Admin -> Shoes & Stock** and press **Load Catalogue** once. That copies the twelve shoes from `products.js` into the database and gives every size 5 pairs to start with.

From then on everything happens on that page:

- **Add a Shoe** - fill in the form. The shoe gets its own page straight away at `product.html?id=...` and shows up in the shop.
- **Edit** - change the name, brand, heading, price, photo or product details.
- **Delete Shoe** - tap twice to confirm. The shoe and its stock are removed.
- **Save Stock** - set how many pairs are left in each size.

For a photo, drop the image file into the `images` folder in VS Code and type its file name (for example `images/airmax90.webp`). A full `https://` link works too.

## Run it on your computer

Open the folder in VS Code, install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.

(Opening the file by double-clicking can block log in on some browsers, so use Live Server.)

## Upload to GitHub

1. Create a new empty repository on GitHub (for example `kickstart`).
2. In VS Code open the Source Control panel, click **Initialize Repository**, type a message like `first upload`, and commit.
3. Click **Publish Branch** and pick the repository.

## Deploy on Vercel

1. Go to <https://vercel.com>, click **Add New -> Project**, and import the GitHub repository.
2. Leave Framework Preset as **Other** and leave the build settings empty. Click **Deploy**.
3. Copy your site address (for example `kickstart-yourname.vercel.app`).
4. Back in Firebase: **Authentication -> Settings -> Authorized domains -> Add domain**, and paste that address (without `https://`).

Every time you push to GitHub, Vercel updates the site by itself.

## Where the data lives

| Firestore path | What it holds |
| --- | --- |
| `users/{uid}` | name, email, address, contact number |
| `users/{uid}/cart/{item}` | shoes in the cart (name, price, size, image, qty) |
| `orders/{order}` | every order: order number, items, totals, delivery details, payment, status |
| `products/{slug}` | one shoe: name, brand, price, photo |
| `products/{slug}/sizes/{size}` | how many pairs of that size are left |
| `admins/{uid}` | the store owner, created by hand in the Firebase console |

Passwords are never stored in the database. Firebase Authentication keeps them hashed on its side.

## Files

| File | What it does |
| --- | --- |
| `firebase-config.js` | your Firebase keys (edit this) |
| `auth.js` | accounts + cart storage, used by every page |
| `auth.css` | styles for the account pages |
| `login.html`, `signup.html`, `forgot-password.html`, `account.html` | account pages |
| `admin.html` | store admin: shoes, stock, orders and their status |
| `product.html` | one page that shows any shoe: `product.html?id=af1` |
| `shop.js`, `product.js` | fill the shop and product pages from the database |
| `products.js` | the starting catalogue, also used before Firebase is connected |
| `firestore.rules` | database security rules to paste into Firebase |
| `af1.html`, `samba.html`, ... | short redirects, so old links keep working |
| everything else | the original store pages |

Voucher code for testing: `DISCOUNT20`
