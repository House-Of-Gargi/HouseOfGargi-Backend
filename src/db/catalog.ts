export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  region: string;
  artisanNote: string;
  fabric: string;
  technique: string;
  occasion: string;
  description: string;
  images: string[];
  inStock: boolean;
  featured?: boolean;
}

export const categories = [
  { id: 'sarees', name: 'Sarees', image: '/images/cat-sarees.png', count: 12 },
  { id: 'lehengas', name: 'Lehengas', image: '/images/cat-lehengas.png', count: 8 },
  { id: 'kurta-sets', name: 'Kurta Sets', image: '/images/cat-kurta.png', count: 10 },
  { id: 'accessories', name: 'Accessories', image: '/images/cat-jewellery.png', count: 6 },
];

export const products: Product[] = [
  {
    id: 'banarasi-gold-saree',
    name: 'Banarasi Gold Weave Saree',
    category: 'sarees',
    price: 343,
    region: 'Varanasi, Uttar Pradesh',
    artisanNote: 'Handwoven by master weavers in Varanasi',
    fabric: 'Pure Silk',
    technique: 'Handloom Zari Weave',
    occasion: 'Wedding',
    description: 'A luminous Banarasi silk saree with intricate gold zari jaal work, traditionally woven on a handloom over three weeks.',
    images: ['/images/saree-banarasi-gold-1.png'],
    inStock: true,
    featured: true,
  },
  {
    id: 'royal-zardozi-bridal-lehenga',
    name: 'Royal Zardozi Bridal Lehenga',
    category: 'lehengas',
    price: 1506,
    region: 'Lucknow, Uttar Pradesh',
    artisanNote: 'Hand-embroidered by zardozi karigars in Lucknow',
    fabric: 'Silk Velvet & Georgette',
    technique: 'Zardozi Embroidery',
    occasion: 'Bridal',
    description: 'Exquisite bridal silhouette embellished with real metallic threads, semi-precious stones, and dabka work.',
    images: ['/images/lehenga-royal-zardozi-1.png'],
    inStock: true,
    featured: true,
  },
  {
    id: 'sanganeri-block-print-kurta',
    name: 'Sanganeri Block Print Kurta Set',
    category: 'kurta-sets',
    price: 58,
    region: 'Sanganer, Jaipur',
    artisanNote: 'Hand block-printed in Sanganer, Jaipur',
    fabric: 'Pure Mulmul Cotton',
    technique: 'Natural Dye Block Print',
    occasion: 'Festive',
    description: 'Breezy handcrafted kurta set adorned with traditional Mughal floral jaal hand-printed with carved teakwood blocks.',
    images: ['/images/kurta-sanganeri-1.png'],
    inStock: true,
    featured: true,
  },
  {
    id: 'kundan-polki-choker-set',
    name: 'Kundan Polki Choker Set',
    category: 'accessories',
    price: 223,
    region: 'Jaipur, Rajasthan',
    artisanNote: 'Handset kundan work by jadau artisans in Jaipur',
    fabric: '24K Gold Foil & Silver Alloy',
    technique: 'Jadau Setting with Meenakari',
    occasion: 'Festive & Bridal',
    description: 'Regal choker set featuring uncut polki stones set in pure gold foil, backed with traditional Jaipuri meenakari enamel.',
    images: ['/images/jewel-kundan-polki-1.png'],
    inStock: true,
    featured: true,
  },
  {
    id: 'chanderi-floral-jaal',
    name: 'Chanderi Floral Jaal',
    category: 'sarees',
    price: 154,
    region: 'Chanderi, Madhya Pradesh',
    artisanNote: 'Handwoven in Chanderi, Madhya Pradesh',
    fabric: 'Chanderi Silk-Cotton',
    technique: 'Tissue Weave with Zari Butis',
    occasion: 'Celebration',
    description: 'Gossamer-light Chanderi saree shimmering with delicate gold coin motifs and sheer pastel handloom border.',
    images: ['/images/saree-chanderi-floral-1.png'],
    inStock: true,
    featured: true,
  },
  {
    id: 'gota-patti-festive-lehenga',
    name: 'Gota Patti Festive Lehenga',
    category: 'lehengas',
    price: 819,
    region: 'Jaipur, Rajasthan',
    artisanNote: 'Gota work by artisans in Jaipur, Rajasthan',
    fabric: 'Georgette & Silk',
    technique: 'Handcut Gota Ribbon Appliqué',
    occasion: 'Sangeet & Festive',
    description: 'Flared festive skirt detailed with artisanal ribbons cut into leaves and flowers, sewn individually onto sheer georgette.',
    images: ['/images/lehenga-gota-patti-1.png'],
    inStock: true,
    featured: true,
  },
];
