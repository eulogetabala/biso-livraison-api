import { MenuItemCategory } from '@prisma/client';

/** UUIDs fixes partagés avec l'app mobile (`delivery-app/src/config/seed-ids.ts`). */
export const SEED_IDS = {
  restaurants: {
    nganda: 'f0000001-0000-4000-8000-000000000001',
    pizza: 'f0000001-0000-4000-8000-000000000002',
    green: 'f0000001-0000-4000-8000-000000000003',
    market: 'f0000001-0000-4000-8000-000000000004',
  },
  drivers: {
    armel: 'f0000002-0000-4000-8000-000000000001',
    merveille: 'f0000002-0000-4000-8000-000000000002',
    junior: 'f0000002-0000-4000-8000-000000000003',
  },
  driverProfiles: {
    armel: 'f0000003-0000-4000-8000-000000000001',
    merveille: 'f0000003-0000-4000-8000-000000000002',
    junior: 'f0000003-0000-4000-8000-000000000003',
  },
  admin: 'f0000004-0000-4000-8000-000000000001',
  partnerNganda: 'f0000009-0000-4000-8000-000000000001',
  demoClient: 'f0000008-0000-4000-8000-000000000001',
  marketCategories: {
    boulangerie: 'f0000005-0000-4000-8000-000000000001',
    desserts: 'f0000005-0000-4000-8000-000000000002',
    boissons: 'f0000005-0000-4000-8000-000000000003',
    volailles: 'f0000005-0000-4000-8000-000000000004',
    boucherie: 'f0000005-0000-4000-8000-000000000005',
    fruits: 'f0000005-0000-4000-8000-000000000006',
    legumes: 'f0000005-0000-4000-8000-000000000007',
    epicerie: 'f0000005-0000-4000-8000-000000000008',
  },
} as const;

export const RESTAURANTS = [
  {
    id: SEED_IDS.restaurants.nganda,
    name: 'Nganda Premium',
    description: 'Cuisine congolaise raffinée avec grillades, saka-saka et plats généreux.',
    address: 'Avenue de la Paix',
    city: 'Brazzaville',
    zipCode: '0000',
    phone: '+242055000001',
    cuisineType: 'AFRICAIN',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    rating: 4.8,
    deliveryFee: 1000,
    estimatedDeliveryTime: 25,
    latitude: -4.2634,
    longitude: 15.2429,
    type: 'RESTAURANT' as const,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: SEED_IDS.restaurants.pizza,
    name: 'Pizza Maya',
    description: 'Pizzas gourmandes, burgers maison et desserts frais pour toute la famille.',
    address: 'Boulevard Denis Sassou Nguesso',
    city: 'Pointe-Noire',
    zipCode: '0001',
    phone: '+242055000002',
    cuisineType: 'PIZZA',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    rating: 4.6,
    deliveryFee: 1000,
    estimatedDeliveryTime: 30,
    latitude: -4.7694,
    longitude: 11.8636,
    type: 'RESTAURANT' as const,
    isFeatured: true,
    sortOrder: 2,
  },
  {
    id: SEED_IDS.restaurants.green,
    name: 'Green Bowl',
    description: 'Salades, bowls et jus naturels pour une pause légère et moderne.',
    address: 'Rue Mfoa',
    city: 'Brazzaville',
    zipCode: '0002',
    phone: '+242055000003',
    cuisineType: 'SALADE',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=1200&auto=format&fit=crop',
    rating: 4.4,
    deliveryFee: 1000,
    estimatedDeliveryTime: 20,
    latitude: -4.2588,
    longitude: 15.251,
    type: 'RESTAURANT' as const,
    isFeatured: false,
    sortOrder: 3,
  },
  {
    id: SEED_IDS.restaurants.market,
    name: 'Biso Market',
    description: 'Produits du quotidien, boulangerie, fruits, légumes et épicerie livrés chez vous.',
    address: 'Marché Total',
    city: 'Brazzaville',
    zipCode: '0000',
    phone: '+242055000099',
    cuisineType: 'EPICERIE',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    coverImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
    rating: 4.5,
    deliveryFee: 1000,
    estimatedDeliveryTime: 25,
    latitude: -4.261,
    longitude: 15.245,
    type: 'MARKET' as const,
    isFeatured: true,
    sortOrder: 0,
  },
] as const;

export const MARKET_CATEGORIES = [
  { id: SEED_IDS.marketCategories.boulangerie, label: 'Boulangerie', subtitle: 'Pain, croissants du matin', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop', icon: 'cafe-outline', iconLib: 'ionicons', tint: '#FEF3C7', iconColor: '#D97706', sortOrder: 1 },
  { id: SEED_IDS.marketCategories.desserts, label: 'Desserts', subtitle: 'Gâteaux et douceurs', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop', icon: 'ice-cream-outline', iconLib: 'ionicons', tint: '#FCE7F3', iconColor: '#DB2777', sortOrder: 2 },
  { id: SEED_IDS.marketCategories.boissons, label: 'Boissons', subtitle: 'Jus frais, sodas, eau', imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?q=80&w=900&auto=format&fit=crop', icon: 'wine-outline', iconLib: 'ionicons', tint: '#E0F2FE', iconColor: '#0284C7', sortOrder: 3 },
  { id: SEED_IDS.marketCategories.volailles, label: 'Volailles', subtitle: 'Poulet, pintade, fermiers', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=900&auto=format&fit=crop', icon: 'food-drumstick-outline', iconLib: 'mci', tint: '#FEF3C7', iconColor: '#D97706', sortOrder: 4 },
  { id: SEED_IDS.marketCategories.boucherie, label: 'Boucherie', subtitle: 'Viandes fraîches', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=900&auto=format&fit=crop', icon: 'food-steak', iconLib: 'mci', tint: '#FEE2E2', iconColor: '#DC2626', sortOrder: 5 },
  { id: SEED_IDS.marketCategories.fruits, label: 'Fruits', subtitle: 'Mangues, bananes, ananas', imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=900&auto=format&fit=crop', icon: 'nutrition-outline', iconLib: 'ionicons', tint: '#ECFCCB', iconColor: '#65A30D', sortOrder: 6 },
  { id: SEED_IDS.marketCategories.legumes, label: 'Légumes', subtitle: 'Produits du potager', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop', icon: 'carrot', iconLib: 'mci', tint: '#DCFCE7', iconColor: '#16A34A', sortOrder: 7 },
  { id: SEED_IDS.marketCategories.epicerie, label: 'Epicerie', subtitle: 'Essentiels du quotidien', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=900&auto=format&fit=crop', icon: 'shopping-bag', iconLib: 'feather', tint: '#EDE9FE', iconColor: '#7C3AED', sortOrder: 8 },
];

export const HOME_BANNERS = [
  { id: 'f0000006-0000-4000-8000-000000000001', title: 'Les meilleurs restos de Brazzaville, livrés chaud', subtitle: 'Cuisine locale, burgers premium, pizzas et jus frais en quelques minutes.', imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop', ctaLabel: 'Commander un repas', linkType: 'RESTAURANTS' as const, sortOrder: 1 },
  { id: 'f0000006-0000-4000-8000-000000000002', title: 'Pains, gâteaux et produits maison juste autour de toi', subtitle: 'Des produits du quotidien et des douceurs artisanales livrés avec soin.', imageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=1200&auto=format&fit=crop', ctaLabel: 'Voir les produits', linkType: 'PRODUCTS' as const, sortOrder: 2 },
  { id: 'f0000006-0000-4000-8000-000000000003', title: 'Un colis à livrer dans Brazzaville ou vers Pointe-Noire ?', subtitle: 'Petits colis, coursiers disponibles et suivi rassurant pour chaque expédition.', imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop', ctaLabel: 'Expédier maintenant', linkType: 'PARCEL' as const, sortOrder: 3 },
];

export const CUISINE_TYPES = [
  { id: 'f0000007-0000-4000-8000-000000000001', value: 'AFRICAIN', label: 'Africain', emoji: '🥘', sortOrder: 1 },
  { id: 'f0000007-0000-4000-8000-000000000002', value: 'PIZZA', label: 'Pizza', emoji: '🍕', sortOrder: 2 },
  { id: 'f0000007-0000-4000-8000-000000000003', value: 'BURGER', label: 'Burgers', emoji: '🍔', sortOrder: 3 },
  { id: 'f0000007-0000-4000-8000-000000000004', value: 'SALADE', label: 'Salades', emoji: '🥗', sortOrder: 4 },
  { id: 'f0000007-0000-4000-8000-000000000005', value: 'DESSERT', label: 'Desserts', emoji: '🧁', sortOrder: 5 },
];

type MenuSeed = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: MenuItemCategory;
  imageUrl?: string;
};

export const MENU_ITEMS: MenuSeed[] = [
  { id: 'f0000010-0000-4000-8000-000000000001', restaurantId: SEED_IDS.restaurants.nganda, name: 'Poulet braisé', description: 'Poulet tendre, plantain et sauce maison.', price: 4500, category: 'MAIN_COURSE', imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000010-0000-4000-8000-000000000006', restaurantId: SEED_IDS.restaurants.nganda, name: 'Jus de bissap', description: 'Jus frais légèrement sucré.', price: 1500, category: 'DRINK' },
  { id: 'f0000010-0000-4000-8000-000000000007', restaurantId: SEED_IDS.restaurants.pizza, name: 'Pizza pepperoni', description: 'Pâte fine, pepperoni, mozzarella fondante.', price: 6000, category: 'MAIN_COURSE', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000010-0000-4000-8000-000000000008', restaurantId: SEED_IDS.restaurants.pizza, name: 'Burger maya', description: 'Steak juteux, cheddar, sauce signature.', price: 5500, category: 'MAIN_COURSE' },
  { id: 'f0000010-0000-4000-8000-000000000009', restaurantId: SEED_IDS.restaurants.pizza, name: 'Tiramisu', description: 'Dessert léger au café et cacao.', price: 2500, category: 'DESSERT' },
  { id: 'f0000010-0000-4000-8000-000000000010', restaurantId: SEED_IDS.restaurants.green, name: 'Chicken bowl', description: 'Bowl complet au poulet grillé et crudités.', price: 5000, category: 'LUNCH', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000010-0000-4000-8000-000000000011', restaurantId: SEED_IDS.restaurants.green, name: 'Salade avocat', description: 'Avocat frais, tomates, vinaigrette citronnée.', price: 3500, category: 'APPETIZER' },
  { id: 'f0000010-0000-4000-8000-000000000012', restaurantId: SEED_IDS.restaurants.green, name: 'Smoothie mangue', description: 'Mangue mixée, lait frais et glaçons.', price: 2000, category: 'DRINK' },
];

/** Suppléments liés à un plat (modal restaurant). */
export const MENU_ITEM_SUPPLEMENTS = [
  { id: 'f0000011-0000-4000-8000-000000000001', menuItemId: 'f0000010-0000-4000-8000-000000000001', name: 'Saka-saka', price: 3000, sortOrder: 1 },
  { id: 'f0000011-0000-4000-8000-000000000002', menuItemId: 'f0000010-0000-4000-8000-000000000001', name: 'Riz sauté', price: 1500, sortOrder: 2 },
  { id: 'f0000011-0000-4000-8000-000000000003', menuItemId: 'f0000010-0000-4000-8000-000000000001', name: 'Légumes vapeur', price: 1000, sortOrder: 3 },
  { id: 'f0000011-0000-4000-8000-000000000004', menuItemId: 'f0000010-0000-4000-8000-000000000001', name: 'Plantain mûr', price: 1200, sortOrder: 4 },
  { id: 'f0000011-0000-4000-8000-000000000005', menuItemId: 'f0000010-0000-4000-8000-000000000008', name: 'Frites maison', price: 1500, sortOrder: 1 },
];

const PRODUCT_CATEGORY_MAP: Record<string, MenuItemCategory> = {
  Boulangerie: 'SNACK',
  Desserts: 'DESSERT',
  Boissons: 'DRINK',
  Volailles: 'MAIN_COURSE',
  Boucherie: 'MAIN_COURSE',
  Fruits: 'FRUIT',
  Légumes: 'SIDE',
  Epicerie: 'SNACK',
};

const MARKET_CATEGORY_ID_BY_LABEL: Record<string, string> = {
  Boulangerie: SEED_IDS.marketCategories.boulangerie,
  Desserts: SEED_IDS.marketCategories.desserts,
  Boissons: SEED_IDS.marketCategories.boissons,
  Volailles: SEED_IDS.marketCategories.volailles,
  Boucherie: SEED_IDS.marketCategories.boucherie,
  Fruits: SEED_IDS.marketCategories.fruits,
  Légumes: SEED_IDS.marketCategories.legumes,
  Epicerie: SEED_IDS.marketCategories.epicerie,
};

export const MARKET_PRODUCTS = [
  { id: 'f0000020-0000-4000-8000-000000000001', name: 'Pain brioché du matin', category: 'Boulangerie', seller: 'Chez Maman Solange', price: 1200, badge: 'Du jour', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000002', name: 'Gâteau vanille maison', category: 'Desserts', seller: 'Atelier Grâce', price: 6500, badge: 'Fait maison', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000003', name: 'Croissants beurre', category: 'Boulangerie', seller: 'La Fournée', price: 2500, badge: 'Populaire', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000004', name: 'Jus gingembre ananas', category: 'Boissons', seller: 'Fresh Mama', price: 1800, badge: 'Très frais', imageUrl: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000005', name: 'Eau minérale pack', category: 'Boissons', seller: 'Market Express', price: 3500, badge: 'Essentiel', imageUrl: 'https://images.unsplash.com/photo-1564419439262-c0c9b2f90b41?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000006', name: 'Cuisse de poulet fermier', category: 'Volailles', seller: 'Ferme du Fleuve', price: 4200, badge: 'Frais', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000007', name: 'Viande de boeuf découpée', category: 'Boucherie', seller: 'Boucherie Centre', price: 5800, badge: 'Qualité', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000008', name: 'Mangues bien mûres', category: 'Fruits', seller: 'Marché Total', price: 2200, badge: 'Saison', imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000009', name: 'Panier de légumes frais', category: 'Légumes', seller: 'Potager Vert', price: 3000, badge: 'Local', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000010', name: 'Riz parfumé 5kg', category: 'Epicerie', seller: 'Biso Market', price: 9000, badge: 'Famille', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000011', name: 'Baguette tradition', category: 'Boulangerie', seller: 'La Fournée', price: 800, badge: 'Du jour', imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000012', name: 'Beignets sucre', category: 'Boulangerie', seller: 'Chez Maman Solange', price: 1500, badge: 'Fait maison', imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000013', name: 'Tarte aux fruits', category: 'Desserts', seller: 'Atelier Grâce', price: 7500, badge: 'Populaire', imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f982e1b5da?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000014', name: 'Coca-Cola 1,5L', category: 'Boissons', seller: 'Market Express', price: 1200, badge: 'Essentiel', imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000015', name: 'Pintade entière', category: 'Volailles', seller: 'Ferme du Fleuve', price: 8500, badge: 'Frais', imageUrl: 'https://images.unsplash.com/photo-1587593816765-3ee0f036a001?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000016', name: 'Steak haché 500g', category: 'Boucherie', seller: 'Boucherie Centre', price: 4500, badge: 'Qualité', imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca794aea0?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000017', name: 'Bananes plantain', category: 'Fruits', seller: 'Marché Total', price: 1800, badge: 'Local', imageUrl: 'https://images.unsplash.com/photo-1571771890050-7d2b1a4f3f3f?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000018', name: 'Tomates fraîches 1kg', category: 'Légumes', seller: 'Potager Vert', price: 1500, badge: 'Saison', imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000019', name: 'Huile végétale 1L', category: 'Epicerie', seller: 'Biso Market', price: 2200, badge: 'Essentiel', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=900&auto=format&fit=crop' },
  { id: 'f0000020-0000-4000-8000-000000000020', name: 'Ananas mûr', category: 'Fruits', seller: 'Marché Total', price: 2500, badge: 'Très frais', imageUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?q=80&w=900&auto=format&fit=crop' },
].map((p) => ({
  id: p.id,
  kind: 'SIMPLE_PRODUCT' as const,
  name: p.name,
  description: p.name,
  price: p.price,
  category: PRODUCT_CATEGORY_MAP[p.category] ?? 'SNACK',
  imageUrl: p.imageUrl,
  seller: p.seller,
  badge: p.badge,
  marketCategoryId: MARKET_CATEGORY_ID_BY_LABEL[p.category],
  isFeatured: p.badge === 'Populaire' || p.badge === 'Du jour',
  sortOrder: 0,
}));

export const DEMO_CLIENT = {
  id: SEED_IDS.demoClient,
  firstName: 'Marie',
  lastName: 'Nkounkou',
  phone: '+242061234567',
  password: 'Client123!',
};

type DemoOrderSeed = {
  id: string;
  restaurantId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  daysAgo: number;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  deliveryFee: number;
  driverId?: string;
  deliveryStatus?: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED';
  paymentStatus?: 'PENDING' | 'PAID' | 'CANCELLED';
};

export const DEMO_ORDERS: DemoOrderSeed[] = [
  {
    id: 'f0000030-0000-4000-8000-000000000001',
    restaurantId: SEED_IDS.restaurants.nganda,
    status: 'DELIVERED',
    daysAgo: 13,
    menuItemId: 'f0000010-0000-4000-8000-000000000001',
    quantity: 2,
    unitPrice: 4500,
    deliveryFee: 1000,
    driverId: SEED_IDS.drivers.armel,
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'PAID',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000002',
    restaurantId: SEED_IDS.restaurants.pizza,
    status: 'DELIVERED',
    daysAgo: 10,
    menuItemId: 'f0000010-0000-4000-8000-000000000007',
    quantity: 1,
    unitPrice: 6000,
    deliveryFee: 1000,
    driverId: SEED_IDS.drivers.merveille,
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'PAID',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000003',
    restaurantId: SEED_IDS.restaurants.market,
    status: 'DELIVERED',
    daysAgo: 7,
    menuItemId: 'f0000020-0000-4000-8000-000000000001',
    quantity: 3,
    unitPrice: 1200,
    deliveryFee: 1000,
    paymentStatus: 'PAID',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000004',
    restaurantId: SEED_IDS.restaurants.nganda,
    status: 'IN_TRANSIT',
    daysAgo: 2,
    menuItemId: 'f0000010-0000-4000-8000-000000000001',
    quantity: 1,
    unitPrice: 4500,
    deliveryFee: 1000,
    driverId: SEED_IDS.drivers.armel,
    deliveryStatus: 'IN_TRANSIT',
    paymentStatus: 'PENDING',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000005',
    restaurantId: SEED_IDS.restaurants.green,
    status: 'CONFIRMED',
    daysAgo: 1,
    menuItemId: 'f0000010-0000-4000-8000-000000000010',
    quantity: 1,
    unitPrice: 5000,
    deliveryFee: 1000,
    driverId: SEED_IDS.drivers.merveille,
    deliveryStatus: 'ASSIGNED',
    paymentStatus: 'PENDING',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000006',
    restaurantId: SEED_IDS.restaurants.pizza,
    status: 'PREPARING',
    daysAgo: 1,
    menuItemId: 'f0000010-0000-4000-8000-000000000008',
    quantity: 2,
    unitPrice: 5500,
    deliveryFee: 1000,
    paymentStatus: 'PENDING',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000007',
    restaurantId: SEED_IDS.restaurants.nganda,
    status: 'PENDING',
    daysAgo: 0,
    menuItemId: 'f0000010-0000-4000-8000-000000000001',
    quantity: 1,
    unitPrice: 4500,
    deliveryFee: 1000,
    paymentStatus: 'PENDING',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000008',
    restaurantId: SEED_IDS.restaurants.market,
    status: 'PENDING',
    daysAgo: 0,
    menuItemId: 'f0000020-0000-4000-8000-000000000004',
    quantity: 2,
    unitPrice: 1800,
    deliveryFee: 1000,
    paymentStatus: 'PENDING',
  },
  {
    id: 'f0000030-0000-4000-8000-000000000009',
    restaurantId: SEED_IDS.restaurants.pizza,
    status: 'CANCELLED',
    daysAgo: 5,
    menuItemId: 'f0000010-0000-4000-8000-000000000009',
    quantity: 1,
    unitPrice: 2500,
    deliveryFee: 1000,
    paymentStatus: 'CANCELLED',
  },
  {
    id: 'f0000030-0000-4000-8000-00000000000a',
    restaurantId: SEED_IDS.restaurants.green,
    status: 'DELIVERED',
    daysAgo: 3,
    menuItemId: 'f0000010-0000-4000-8000-000000000011',
    quantity: 1,
    unitPrice: 3500,
    deliveryFee: 1000,
    driverId: SEED_IDS.drivers.junior,
    deliveryStatus: 'DELIVERED',
    paymentStatus: 'PAID',
  },
];

export const DRIVER_USERS = [
  { id: SEED_IDS.drivers.armel, profileId: SEED_IDS.driverProfiles.armel, firstName: 'Armel', lastName: 'Mavoungou', phone: '+242066000111', vehicleType: 'Express', rating: 4.9, lat: -4.2612, lng: 15.2445 },
  { id: SEED_IDS.drivers.merveille, profileId: SEED_IDS.driverProfiles.merveille, firstName: 'Merveille', lastName: 'Nkaya', phone: '+242066000222', vehicleType: 'Moto', rating: 4.8, lat: -4.2688, lng: 15.2512 },
  { id: SEED_IDS.drivers.junior, profileId: SEED_IDS.driverProfiles.junior, firstName: 'Junior', lastName: 'Mboko', phone: '+242066000333', vehicleType: 'Interville', rating: 4.7, lat: -4.2555, lng: 15.2388 },
] as const;
