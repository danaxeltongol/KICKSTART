// ============================================================
//  KICKSTART - the starting shoe catalogue
//
//  Two jobs:
//   1. Before Firebase is connected (or before you press
//      "Load Catalogue" in Store Admin), the shop reads the
//      shoes from here, so the website always has something
//      to show.
//   2. "Load Catalogue" copies this list into the database.
//
//  After that, add, edit and delete shoes from the Store Admin
//  page. You do not need to touch this file again.
// ============================================================

const KS_PRODUCTS = [
  {
    slug: 'j1-lost-found',
    brand: 'Jordan',
    title: 'Air Jordan 1 Retro High OG "Chicago Lost And Found" sneakers',
    name: 'Air Jordan 1 Retro High OG \'Chicago Lost And Found\'',
    price: 14995,
    image: 'images/18316489_41349181_1000.webp',
    order: 10,
    description:
      'The Air Jordan 1 Retro High OG "Lost And Found" is a storytelling masterpiece, designed to evoke the thrill of uncovering a forgotten, deadstock pair of the original 1985\' "Chicago" colorway in a dusty stockroom of a vintage mom-and-pop shop. This sneaker is a meticulously "aged" recreation of the legendary shoe that started it all, featuring details that capture a true vintage aesthetic. The Air Jordan 1 Retro High OG generally fits True to Size. We recommend ordering your normal sneaker size for the best fit.'
  },
  {
    slug: 'nb-1906r',
    brand: 'New Balance',
    title: 'New Balance 1906R "White/Gold" sneakers',
    name: 'New Balance 1906R',
    price: 12995,
    image: 'images/19056.webp',
    order: 20,
    description:
      'The New Balance 1906R is a standout model that takes inspiration from 2000s-era running shoes, offering a sleek, technical look paired with premium comfort technology. The "White/Metallic Gold" colorway is a brilliant and striking combination, perfect for those who want a versatile sneaker with a touch of luxury. The New Balance 1906R generally runs True to Size. We recommend selecting your standard size for a comfortable, supportive fit.'
  },
  {
    slug: 'j1-midnight',
    brand: 'Jordan',
    title: 'Air Jordan 1 Retro High OG "Midnight Navy" sneakers',
    name: 'Jordan 1 Midnight Navy',
    price: 6995,
    image: 'images/NAVY.webp',
    order: 30,
    description:
      'The Air Jordan 1 Retro High OG "Midnight Navy" delivers a sleek, essential two-tone look to the iconic silhouette. Drawing inspiration from classic color blocking, this edition features rich, durable leather and the classic high-top design, making it an effortlessly stylish and versatile addition to any collection. It carries the full heritage of the shoe that started sneaker culture while offering a fresh, modern palette. The Air Jordan 1 Retro High OG "Midnight Navy" delivers a sleek, essential two-tone look to the iconic silhouette. Drawing inspiration from classic color blocking, this edition features rich, durable leather and the classic high-top design, making it an effortlessly stylish and versatile addition to any collection. It carries the full heritage of the shoe that started sneaker culture while offering a fresh, modern palette.'
  },
  {
    slug: 'af1',
    brand: 'Nike',
    title: 'Air Force 1 07 sneakers',
    name: 'Air Force 1 07',
    price: 4995,
    image: 'images/af1.webp',
    order: 40,
    description:
      'The Air Force 1 \'07 is the staple shoe that transitioned the original 1982 basketball footwear technology into a globally recognized fashion and street culture icon. It\'s celebrated for its clean design, sturdy build, and versatility. Many wearers find the shoe fits best when ordering half a size down from their regular size, especially if you prefer a snug fit.'
  },
  {
    slug: 'mexico66',
    brand: 'Onitsuka Tiger',
    title: 'Onitsuka Tiger Mexico 66™ "White/Blue"',
    name: 'Onitsuka Tiger Mexico 66',
    price: 8995,
    image: 'images/oni.webp',
    order: 50,
    description:
      'The Onitsuka Tiger Mexico 66 delivers a sleek, heritage look, combining the features of the original 1960s training shoe that debuted before the Mexico City Olympics. It features a crisp white leather upper with the iconic blue Tiger Stripes and a signature low-profile silhouette. The design is finished with a supportive heel-cross reinforcement and an OrthoLite™ inner sole, offering a classic, lightweight, and perpetually stylish look for urban living.'
  },
  {
    slug: 'nb-2002r',
    brand: 'New Balance',
    title: 'New Balance 2002R "Protection Pack - Grey" sneakers',
    name: 'New Balance 2002R - Protection Pack',
    price: 10995,
    image: 'images/2002r.webp',
    order: 60,
    description:
      'The New Balance 2002R "Protection Pack" is a modern reinterpretation of a classic running silhouette, known for its distinct deconstructed and raw aesthetic. This "Grey" iteration features a mesh base with tonal, shaggy suede overlays cut with jagged edges, giving it a deliberately worn or "protected" look. Built on an ACTEVA LITE midsole and ABZORB heel cushioning, it blends a cutting-edge, layered design with superior comfort and performance technology.'
  },
  {
    slug: 'yeezy-350',
    brand: 'Adidas Yeezy',
    title: 'Adidas Yeezy Boost 350 V2 "Bone" sneakers',
    name: 'Yeezy Boost 350 V2 - Bone',
    price: 12995,
    image: 'images/ye.webp',
    order: 70,
    description:
      'The Yeezy Boost 350 V2 "Bone" presents a minimalist and monochromatic take on the popular lifestyle sneaker, highlighting its architectural design with an understated ivory hue. It features a breathable Primeknit upper with a signature monofilament side stripe and webbing pull tab at the heel. The shoe is elevated by a full-length, responsive BOOST midsole wrapped in a semi-translucent TPU casing, delivering ultimate comfort in a clean, contemporary form.'
  },
  {
    slug: 'samba',
    brand: 'Adidas',
    title: 'Adidas Samba OG "Night Navy/Cream White" sneakers',
    name: 'Adidas Samba OG - Night Navy/Cream White',
    price: 8995,
    image: 'images/samba.webp',
    order: 80,
    description:
      'The Adidas Samba OG takes the timeless indoor soccer shoe and refines it with a rich, versatile palette. This edition features a luxurious navy leather upper with a suede T-toe overlay, contrasted by creamy-white serrated Three Stripes and heel tab. It sits atop the traditional gum rubber outsole, staying true to its pitch-born heritage while serving as a global street-style icon that effortlessly pairs with any modern casual look.'
  },
  {
    slug: 'asics-kayano',
    brand: 'Asics',
    title: 'Asics Gel-Kayano sneakers',
    name: 'Asics Gel-Kayano',
    price: 9885,
    image: 'images/gelkayano.webp',
    order: 90,
    description:
      'The Asics GEL-Kayano is a long-standing icon in the world of stability running shoes, designed to offer premium comfort and support for long-distance efforts. Modern iterations, such as the GEL-Kayano 32, feature advanced FF BLAST™ PLUS cushioning and a 4D GUIDANCE SYSTEM™ for adaptive stability. Blending an engineered mesh upper with signature PureGEL™ technology in the heel, it ensures a smooth, cushioned, and supportive stride for athletes and casual wearers alike.'
  },
  {
    slug: 'asics-gel-nyc',
    brand: 'Asics',
    title: 'Asics GEL NYC "Graphite Grey Black" sneakers',
    name: 'Asics GEL-NYC - Graphite Grey Black',
    price: 10999,
    image: 'images/asics.webp',
    order: 100,
    description:
      'The Asics GEL-NYC blends inspiration from several heritage and modern performance running shoes, creating a unique and layered aesthetic. Its upper borrows elements from the GEL-NIMBUS® 3 and MC-PLUS V designs, while sitting atop the advanced tooling system of the GEL-CUMULUS® 16. The "Graphite Grey Black" colorway utilizes a dark, modern palette with mesh underlays and rugged synthetic leather overlays, providing a comfortable, cushioned ride with a distinct retro-meets-contemporary look.'
  },
  {
    slug: 'dunk-orange',
    brand: 'Nike',
    title: 'Nike Dunk Low "Total Orange" sneakers',
    name: 'Nike Dunk Low \'Total Orange\'',
    price: 8999,
    image: 'images/orange.webp',
    order: 110,
    description:
      'The Nike Dunk Low "Total Orange" delivers a bold, statement-making colorway to the classic \'80s basketball silhouette. Keeping the iconic shape with a low-cut, padded collar and premium leather construction, this version commands attention with vibrant orange accents set against a darker base. Its simple, effective two-tone blocking and rubber outsole with the classic pivot circle uphold the Dunk\'s legacy as a versatile sneaker that easily transitions from the hardwood to the street.'
  },
  {
    slug: 'superstar',
    brand: 'Adidas',
    title: 'Adidas Superstar XLG lace-up sneakers',
    name: 'Adidas Superstar XLG',
    price: 6999,
    image: 'images/superstar.webp',
    order: 120,
    description:
      'The Adidas Superstar XLG takes the timeless shell-toe design of the 1970s icon and amplifies its proportions for a modern, bold aesthetic. It retains the signature full leather upper and serrated Three-Stripes but sits on an enlarged, chunky outsole and features an EVA midsole drop-in for enhanced comfort. This revamped design pays homage to \'80s basketball style with its bigger build, transforming the classic court shoe into a distinct and elevated streetwear staple.'
  }
];

// Every shoe is sold in these sizes
const KS_SIZES = ['8 US', '9 US', '10 US', '11 US'];

// How many pairs each size starts with when you press Load Catalogue
const KS_DEFAULT_STOCK = 5;
