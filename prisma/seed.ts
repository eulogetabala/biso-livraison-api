import 'dotenv/config';
import { PrismaClient, DeliveryStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import {
  CUISINE_TYPES,
  DEMO_CLIENT,
  DEMO_ORDERS,
  DRIVER_USERS,
  HOME_BANNERS,
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  MENU_ITEMS,
  MENU_ITEM_SUPPLEMENTS,
  RESTAURANTS,
  SEED_IDS,
} from './seed-data';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('Seeding CMS, restaurants, menus, market products and drivers…');

  for (const category of MARKET_CATEGORIES) {
    await prisma.marketCategory.upsert({
      where: { id: category.id },
      create: category,
      update: category,
    });
  }

  for (const banner of HOME_BANNERS) {
    await prisma.homeBanner.upsert({
      where: { id: banner.id },
      create: banner,
      update: banner,
    });
  }

  for (const cuisine of CUISINE_TYPES) {
    await prisma.cuisineTypeConfig.upsert({
      where: { id: cuisine.id },
      create: cuisine,
      update: cuisine,
    });
  }

  for (const restaurant of RESTAURANTS) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      create: { ...restaurant },
      update: { ...restaurant },
    });
  }

  for (const item of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: { ...item, kind: 'RESTAURANT_DISH' },
      update: { ...item, kind: 'RESTAURANT_DISH' },
    });
  }

  for (const supplement of MENU_ITEM_SUPPLEMENTS) {
    await prisma.menuItemSupplement.upsert({
      where: { id: supplement.id },
      create: supplement,
      update: supplement,
    });
  }

  for (const product of MARKET_PRODUCTS) {
    await prisma.menuItem.upsert({
      where: { id: product.id },
      create: product,
      update: product,
    });
  }

  const clientPassword = await bcrypt.hash(DEMO_CLIENT.password, 10);
  await prisma.user.upsert({
    where: { id: DEMO_CLIENT.id },
    create: {
      id: DEMO_CLIENT.id,
      firstName: DEMO_CLIENT.firstName,
      lastName: DEMO_CLIENT.lastName,
      phone: DEMO_CLIENT.phone,
      password: clientPassword,
      role: UserRole.CLIENT,
      phoneVerified: true,
    },
    update: {
      firstName: DEMO_CLIENT.firstName,
      lastName: DEMO_CLIENT.lastName,
      phone: DEMO_CLIENT.phone,
      password: clientPassword,
      role: UserRole.CLIENT,
      phoneVerified: true,
    },
  });

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { id: SEED_IDS.admin },
    create: {
      id: SEED_IDS.admin,
      firstName: 'Admin',
      lastName: 'Biso',
      phone: '+242065644299',
      email: 'admin@biso.cg',
      password: adminPassword,
      role: UserRole.ADMIN,
      phoneVerified: true,
    },
    update: {
      firstName: 'Admin',
      lastName: 'Biso',
      password: adminPassword,
      role: UserRole.ADMIN,
      phoneVerified: true,
    },
  });

  const passwordHash = await bcrypt.hash('Driver123!', 10);

  for (const driver of DRIVER_USERS) {
    await prisma.user.upsert({
      where: { id: driver.id },
      create: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        password: passwordHash,
        role: UserRole.DRIVER,
        phoneVerified: true,
      },
      update: {
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone,
        role: UserRole.DRIVER,
        phoneVerified: true,
      },
    });

    await prisma.driverProfile.upsert({
      where: { id: driver.profileId },
      create: {
        id: driver.profileId,
        userId: driver.id,
        vehicleType: driver.vehicleType,
        isAvailable: true,
        rating: driver.rating,
        reviewCount: 12,
      },
      update: {
        vehicleType: driver.vehicleType,
        isAvailable: true,
        rating: driver.rating,
      },
    });

    await prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      create: {
        driverId: driver.id,
        latitude: driver.lat,
        longitude: driver.lng,
      },
      update: {
        latitude: driver.lat,
        longitude: driver.lng,
      },
    });
  }

  function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(10 + (days % 8), 30, 0, 0);
    return date;
  }

  for (const demo of DEMO_ORDERS) {
    const total = demo.unitPrice * demo.quantity;
    const grandTotal = total + demo.deliveryFee;
    const createdAt = daysAgo(demo.daysAgo);

    await prisma.order.upsert({
      where: { id: demo.id },
      create: {
        id: demo.id,
        userId: DEMO_CLIENT.id,
        restaurantId: demo.restaurantId,
        status: demo.status,
        total,
        deliveryFee: demo.deliveryFee,
        grandTotal,
        deliveryAddress: '12 Avenue Matsoua',
        deliveryCity: 'Brazzaville',
        deliveryZipCode: '0000',
        deliveryLatitude: demo.daysAgo <= 2 ? -4.258 + demo.daysAgo * 0.001 : -4.2634,
        deliveryLongitude: demo.daysAgo <= 2 ? 15.248 + demo.daysAgo * 0.001 : 15.2429,
        createdAt,
        updatedAt: createdAt,
        items: {
          create: {
            menuItemId: demo.menuItemId,
            quantity: demo.quantity,
            unitPrice: demo.unitPrice,
          },
        },
        payment: {
          create: {
            method: 'CASH_ON_DELIVERY',
            status: demo.paymentStatus ?? 'PENDING',
            amount: grandTotal,
            paidAt: demo.paymentStatus === 'PAID' ? createdAt : null,
          },
        },
      },
      update: {
        status: demo.status,
        total,
        deliveryFee: demo.deliveryFee,
        grandTotal,
        createdAt,
        updatedAt: createdAt,
      },
    });

    if (demo.driverId && demo.deliveryStatus) {
      await prisma.delivery.upsert({
        where: { orderId: demo.id },
        create: {
          orderId: demo.id,
          driverId: demo.driverId,
          status: demo.deliveryStatus,
          pickedUpAt:
            demo.deliveryStatus !== 'ASSIGNED' ? daysAgo(Math.max(0, demo.daysAgo - 1)) : null,
          deliveredAt: demo.deliveryStatus === 'DELIVERED' ? createdAt : null,
        },
        update: {
          driverId: demo.driverId,
          status: demo.deliveryStatus,
        },
      });
    }
  }

  const activeOrderIds = [
    'f0000030-0000-4000-8000-000000000004',
    'f0000030-0000-4000-8000-000000000005',
  ];
  for (const orderId of activeOrderIds) {
    const delivery = await prisma.delivery.findUnique({ where: { orderId } });
    if (!delivery) continue;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order?.restaurant) continue;
    const rLat = order.restaurant.latitude ?? -4.2634;
    const rLng = order.restaurant.longitude ?? 15.2429;
    const dLat = order.deliveryLatitude ?? rLat;
    const dLng = order.deliveryLongitude ?? rLng;
    const midLat = rLat + (dLat - rLat) * 0.55;
    const midLng = rLng + (dLng - rLng) * 0.55;
    await prisma.driverLocation.upsert({
      where: { driverId: delivery.driverId },
      update: {
        latitude: midLat,
        longitude: midLng,
        deliveryId: delivery.id,
      },
      create: {
        driverId: delivery.driverId,
        latitude: midLat,
        longitude: midLng,
        deliveryId: delivery.id,
      },
    });
  }

  const trackingMilestones: Record<
    DeliveryStatus,
    { message: string; statuses: DeliveryStatus[] }
  > = {
    ASSIGNED: { message: 'Livreur assigné à la commande', statuses: [DeliveryStatus.ASSIGNED] },
    PICKED_UP: {
      message: 'Le livreur a récupéré votre commande',
      statuses: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP],
    },
    IN_TRANSIT: {
      message: 'Votre commande est en route vers vous',
      statuses: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
    },
    DELIVERED: {
      message: 'Commande livrée',
      statuses: [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELIVERED,
      ],
    },
  };

  for (const demo of DEMO_ORDERS) {
    if (!demo.driverId || !demo.deliveryStatus) continue;
    const delivery = await prisma.delivery.findUnique({ where: { orderId: demo.id } });
    if (!delivery) continue;
    await prisma.trackingEvent.deleteMany({ where: { deliveryId: delivery.id } });
    const order = await prisma.order.findUnique({
      where: { id: demo.id },
      include: { restaurant: true },
    });
    const rLat = order?.restaurant?.latitude ?? -4.2634;
    const rLng = order?.restaurant?.longitude ?? 15.2429;
    const dLat = order?.deliveryLatitude ?? rLat;
    const dLng = order?.deliveryLongitude ?? rLng;
    const config = trackingMilestones[demo.deliveryStatus];
    for (let i = 0; i < config.statuses.length; i++) {
      const status = config.statuses[i];
      const lat =
        status === DeliveryStatus.ASSIGNED
          ? rLat
          : status === DeliveryStatus.PICKED_UP
            ? rLat + (dLat - rLat) * 0.35
            : status === DeliveryStatus.IN_TRANSIT
              ? rLat + (dLat - rLat) * 0.65
              : dLat;
      const lng =
        status === DeliveryStatus.ASSIGNED
          ? rLng
          : status === DeliveryStatus.PICKED_UP
            ? rLng + (dLng - rLng) * 0.35
            : status === DeliveryStatus.IN_TRANSIT
              ? rLng + (dLng - rLng) * 0.65
              : dLng;
      await prisma.trackingEvent.create({
        data: {
          deliveryId: delivery.id,
          status,
          message:
            status === DeliveryStatus.ASSIGNED
              ? 'Livreur assigné à la commande'
              : status === DeliveryStatus.PICKED_UP
                ? 'Le livreur a récupéré votre commande'
                : status === DeliveryStatus.IN_TRANSIT
                  ? 'Votre commande est en route vers vous'
                  : 'Commande livrée',
          latitude: lat,
          longitude: lng,
          createdAt: daysAgo(Math.max(0, demo.daysAgo - (config.statuses.length - 1 - i))),
        },
      });
    }
  }

  // Nettoie les anciens accompagnements SIDE devenus suppléments.
  await prisma.menuItem.deleteMany({
    where: {
      id: {
        in: [
          'f0000010-0000-4000-8000-000000000002',
          'f0000010-0000-4000-8000-000000000003',
          'f0000010-0000-4000-8000-000000000004',
          'f0000010-0000-4000-8000-000000000005',
        ],
      },
    },
  });

  console.log('Seed completed (CMS, restaurants, menus, produits simples, commandes demo, livreurs).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
