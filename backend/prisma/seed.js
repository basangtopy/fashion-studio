import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- UTILS ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pastDate = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
const futureDate = (daysAhead) => new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

// Helper to chunk arrays for processing
function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

// --- DATA SETS ---
const firstNames = [
  "Adebayo", "Chidi", "Ngozi", "Fatima", "Emeka", "Oluwaseun", "Amina", "Kemi",
  "Tunde", "Zainab", "Ibrahim", "Chinwe", "Eze", "Funke", "Hassan", "Yusuf",
  "Bisi", "Bola", "Damilola", "Kehinde", "Taiwo", "Idris", "Nnamdi", "Chioma",
  "Ada", "Obi", "Uche", "Yemi", "Sani", "Musa", "Michael", "John", "Sarah",
  "David", "Elizabeth", "Daniel", "Grace", "Samuel", "Ruth", "Isaac", "Mary",
  "Joshua", "Esther", "Paul", "Lydia", "Peter", "Martha", "James", "Rachel",
  "Onyinye", "Chinedu", "Amaka", "Tochukwu", "Chika", "Babajide", "Folake",
  "Opeyemi", "Olumide", "Simisola", "Kayode", "Temitope", "Ayomide", "Bukunmi"
];

const lastNames = [
  "Okafor", "Abubakar", "Ogunleye", "Adeyemi", "Eze", "Nwosu", "Bello",
  "Ibrahim", "Aliyu", "Okonkwo", "Okoro", "Olawale", "Balogun", "Adebayo",
  "Bakare", "Umar", "Garba", "Muhammad", "Ademola", "Nwachukwu", "Onyeka",
  "Chukwu", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
  "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Awolowo", "Azikiwe", "Buhari", "Dangote", "Otedola", "Adenuga", "Alakija",
  "Macaulay", "Fashola", "Sanwo-Olu", "Tinubu", "Osinbajo", "Jonathan"
];

const cities = [
  "Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu", "Kaduna",
  "Benin City", "Jos", "Ilorin", "Owerri", "Calabar", "Uyo", "Asaba", "Akure",
  "Abeokuta", "Osogbo", "Ado-Ekiti", "Lokoja", "Minna", "Sokoto", "Maiduguri",
  "Zaria", "Warri", "Onitsha", "Aba", "Gombe", "Bauchi", "Yola", "Jalingo"
];

const streets = [
  "Awolowo Road", "Bode Thomas St", "Isaac John St", "Adeola Odeku St",
  "Wuse 2", "Maitama", "Asokoro", "Victoria Island", "Lekki Phase 1",
  "Allen Avenue", "Toyin Street", "Opebi Road", "Ademola Adetokunbo Crescent",
  "Gana Street", "Aminu Kano Crescent", "Aguiyi Ironsi Street", "Nnamdi Azikiwe Express",
  "Broad Street", "Marina", "Ozumba Mbadiwe", "Ahmadu Bello Way", "Herbert Macaulay Way",
  "Independence Avenue", "Constitution Avenue", "Shehu Shagari Way", "Yakubu Gowon Way"
];

const sexes = ["MALE", "FEMALE", "OTHER"];

// Verified Unsplash Photo IDs (These are known to be persistent)
const portraitIds = [
  "1534528741775-53994a69daeb", "1506794778202-cad84cf45f1d", "1517841905240-472988babdf9",
  "1531746020798-e6953c6e8e04", "1544005313-94ddf0286df2", "1519699047748-de8e457a634e",
  "1438761681033-6461ffad8d80", "1494790108377-be9c29b29330", "1517070208541-6ddc4d3efbcb",
  "1524504388266-26e46622fb84", "1507003211169-0a1dd7228f2d", "1531123897727-8f129e1688ce",
  "1500648767791-00dcc994a43e", "1554151228-14d9def656e4", "1508214751196-bcfd4ca60f91",
  "1494790108377-be9c29b29330", "1529626455594-4ff0802cfb7e", "1546961329-78bef0414d7c"
];

const fashionIds = [
  "1515886657613-9f3515b0c78f", "1483985988355-763728e1935b", "1550614000-4b95dd2db85a",
  "1571513722275-4b41940f54b8", "1591369822096-ffd140ec948f", "1485230895925-8c7107db7cf1",
  "1566206091558-4f11ef73be14", "1618932260643-eee4a2f652a6", "1583391733958-d20531e115ae",
  "1603400521630-9f2de124b33b", "1594938298603-c8148c4dae35", "1620012253295-c15bc3e6554c",
  "1515347619253-abbed38a4cd7", "1576566588028-4147f3842f27", "1600003014755-ba31aa59c4b6",
  "1529139574466-a303a2ac2515", "1490481651827-2c9769ae6dfd", "1445205170230-053b83016050",
  "1469334031218-e382a71b716b", "1509319117193-57bab727e09d", "1485968579580-b6d095142e6e",
  "1520975954732-57dd06fd8332", "1512436991641-6745cdb1723f", "1496747611176-843222e1e57c",
  "1518049362265-d5b2a640db90", "1552374196-1ab2a1c593e8", "1502716119720-123acb47ced3"
];

const profilePics = portraitIds.map(id => `https://images.unsplash.com/photo-${id}?q=80&w=400&auto=format&fit=crop`);
const styleImages = fashionIds.map(id => `https://images.unsplash.com/photo-${id}?q=80&w=600&auto=format&fit=crop`);
const rtwImages = fashionIds.slice().reverse().map(id => `https://images.unsplash.com/photo-${id}?q=80&w=600&auto=format&fit=crop`);

const careInstructions = [
  "Dry clean only. Do not bleach. Iron on low heat.",
  "Machine wash cold with like colors. Tumble dry low.",
  "Hand wash gently. Lay flat to dry. Do not wring.",
  "Professional dry cleaning recommended to maintain fabric luster.",
  "Wash inside out. Do not tumble dry.",
  "Spot clean only with damp cloth."
];

const fabricDetails = [
  "100% Cotton", "Lace and Silk Blend", "Polyester Blend", "Premium Italian Wool",
  "African Print Ankara", "Luxury Satin", "Linen", "Chiffon", "Velvet", "Cashmere Blend",
  "Adire/Kampala", "Aso-Oke", "Damask", "Crepe"
];

async function clearDatabase() {
  console.log("Clearing existing data...");
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.measurementHistory.deleteMany();
  await prisma.measurementAppointment.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.readyToWear.deleteMany();
  await prisma.style.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleared.");
}

async function main() {
  await clearDatabase();

  const passwordHash = await bcrypt.hash("Password@123", 12);
  const users = [];

  console.log("Seeding Super Admin and Staff...");
  // 1. Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      fullName: "Super Admin",
      email: "admin@fashionstudio.com",
      phone: "+2348000000000",
      sex: "FEMALE",
      role: "SUPER_ADMIN",
      authProvider: "LOCAL",
      passwordHash,
      isEmailVerified: true,
      address: "1 Fashion Avenue, Victoria Island, Lagos",
      profilePicture: profilePics[0],
    },
  });

  // 2. Staff Admins
  const staffAdmins = [];
  for (let i = 1; i <= 5; i++) {
    const staff = await prisma.user.create({
      data: {
        fullName: `${randomChoice(firstNames)} ${randomChoice(lastNames)} (Staff)`,
        email: `staff${i}@fashionstudio.com`,
        phone: `+234801000000${i}`,
        sex: randomChoice(sexes),
        role: "STAFF_ADMIN",
        authProvider: "LOCAL",
        passwordHash,
        isEmailVerified: true,
        address: `${randomInt(1, 100)} ${randomChoice(streets)}, ${randomChoice(cities)}`,
        profilePicture: randomChoice(profilePics),
      },
      select: { id: true, fullName: true }
    });
    staffAdmins.push(staff);
  }

  const allAdmins = [superAdmin, ...staffAdmins];

  // 3. Massive Clients
  const NUM_CLIENTS = 500;
  console.log(`Seeding ${NUM_CLIENTS} Clients...`);

  // Batch insert users for speed
  const clientsData = [];
  for (let i = 1; i <= NUM_CLIENTS; i++) {
    clientsData.push({
      fullName: `${randomChoice(firstNames)} ${randomChoice(lastNames)}`,
      email: `client${i}_${Date.now()}@example.com`,
      phone: `+23481${String(randomInt(0, 99999999)).padStart(8, '0')}`,
      sex: randomChoice(sexes),
      role: "CLIENT",
      authProvider: "LOCAL",
      passwordHash,
      isEmailVerified: randomInt(0, 10) > 2,
      address: `${randomInt(1, 200)}, ${randomChoice(streets)}, ${randomChoice(cities)}`,
      profilePicture: randomInt(0, 10) > 3 ? randomChoice(profilePics) : null,
      dateOfBirth: pastDate(randomInt(7000, 18000)),
      createdAt: pastDate(randomInt(1, 365))
    });
  }

  await prisma.user.createMany({ data: clientsData });

  // Retrieve the generated clients
  const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });
  users.push(...clients);

  // Cart for each client
  console.log("Seeding Carts for Clients...");
  const cartsData = clients.map(client => ({ userId: client.id }));
  await prisma.cart.createMany({ data: cartsData });

  // 4. Measurements
  console.log("Seeding Measurements...");
  const measurementsData = [];
  const measurementHistoryData = [];

  // Create measurements sequentially to get IDs for history
  const clientsWithMeasurements = clients.filter(() => randomInt(1, 10) <= 8);
  const createdMeasurements = [];

  // Limit to batches to avoid memory overwhelming
  for (const batch of chunkArray(clientsWithMeasurements, 50)) {
    const batchMeasurements = await prisma.$transaction(
      batch.map(client => prisma.measurement.create({
        data: {
          clientId: client.id,
          bust: randomFloat(80, 120),
          waist: randomFloat(60, 100),
          hips: randomFloat(85, 130),
          shoulderWidth: randomFloat(35, 50),
          sleeveLength: randomFloat(55, 70),
          dressLength: randomFloat(90, 160),
          thigh: randomFloat(40, 75),
          inseam: randomFloat(70, 95),
          neck: randomFloat(30, 45),
          armLength: randomFloat(50, 65),
          armCircumference: randomFloat(25, 45),
          ankleCircumference: randomFloat(20, 35),
          wristCircumference: randomFloat(15, 25),
          backLength: randomFloat(35, 50),
          frontLength: randomFloat(40, 55),
          customParams: {
            preference: randomChoice(["Fitted", "Loose", "Regular"]),
            rise: randomFloat(20, 35),
          },
          updatedById: randomChoice(allAdmins).id,
          updatedByRole: "STAFF_ADMIN",
          notes: "Initial measurements taken in studio.",
          createdAt: pastDate(randomInt(30, 360)),
        },
      }))
    );
    createdMeasurements.push(...batchMeasurements);
  }

  // Create Measurement Histories simultaneously
  createdMeasurements.forEach(m => {
    if (randomInt(1, 10) > 4) {
      measurementHistoryData.push({
        clientId: m.clientId,
        measurementId: m.id,
        changedFields: {
          waist: { from: m.waist - 2, to: m.waist },
          hips: { from: m.hips - 1, to: m.hips },
        },
        updatedById: m.clientId,
        updatedByRole: "CLIENT",
        updatedByName: m.clientId, // We simplify here
        notes: "Client updated waist a bit before order.",
        createdAt: pastDate(randomInt(1, 30))
      });
    }
  });

  await prisma.measurementHistory.createMany({ data: measurementHistoryData });

  // 5. Styles
  const NUM_STYLES = 120;
  console.log(`Seeding ${NUM_STYLES} Styles...`);
  const stylesData = [];
  const styleCategories = ["Gowns", "Corporate", "Bridal", "Traditional", "Senator", "Agbada", "Casual Chic", "Evening Wear"];

  for (let i = 1; i <= NUM_STYLES; i++) {
    stylesData.push({
      name: `Bespoke Style ${i} - ${randomChoice(["Elegance", "Royalty", "Classic", "Modern", "Glamour", "Vogue", "Signature"])}`,
      description: "A stunning piece perfect for your next big event. Customizable to your exact measurements.",
      category: randomChoice(styleCategories),
      images: [randomChoice(styleImages), randomChoice(styleImages), randomChoice(styleImages)].slice(0, randomInt(1, 3)),
      availableForModel1: true,
      availableForModel2: true,
      isFeatured: randomInt(1, 10) > 8,
      isActive: randomInt(1, 10) > 1,
      createdAt: pastDate(randomInt(30, 300))
    });
  }
  await prisma.style.createMany({ data: stylesData });
  const styles = await prisma.style.findMany();

  // 6. Ready To Wear
  const NUM_RTW = 150;
  console.log(`Seeding ${NUM_RTW} Ready-To-Wear Items...`);
  const rtwsData = [];
  const rtwCategories = ["Casual", "Office Wear", "Party", "Lounge Wear", "Accessories", "Outerwear", "Activewear"];

  for (let i = 1; i <= NUM_RTW; i++) {
    rtwsData.push({
      name: `RTW ${i} - ${randomChoice(["Chic Dress", "Silk Shirt", "Ankara Trousers", "Linen Crop", "Maxi Skirt", "Blazer", "Jumpsuit"])}`,
      description: "Ready to wear straight out of the box. High quality finish.",
      price: randomFloat(15000, 150000),
      category: randomChoice(rtwCategories),
      images: [randomChoice(rtwImages), randomChoice(rtwImages)],
      availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"].slice(0, randomInt(3, 7)),
      fabricDetails: randomChoice(fabricDetails),
      careInstructions: randomChoice(careInstructions),
      stockStatus: randomChoice(["IN_STOCK", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]),
      stockCount: randomInt(0, 100),
      isFeatured: randomInt(1, 10) > 8,
      isActive: randomInt(1, 10) > 1,
      createdAt: pastDate(randomInt(10, 300))
    });
  }
  await prisma.readyToWear.createMany({ data: rtwsData });
  const rtws = await prisma.readyToWear.findMany();

  // 7. Orders & Workflows (Massive)
  const NUM_ORDERS = 1500;
  console.log(`Seeding ${NUM_ORDERS} Orders... (This might take a minute)`);

  const allStatuses = ["PENDING_REVIEW", "AWAITING_CLIENT_RESPONSE", "AGREED_AWAITING_PAYMENT",
    "IN_PROGRESS", "CUTTING", "SEWING", "FINISHING", "AWAITING_FINAL_PAYMENT",
    "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"
  ];

  const orderItemsData = [];
  const statusHistoryData = [];
  const paymentsData = [];
  const notificationsData = [];
  const portfoliosData = [];
  const chatMessagesData = [];
  const testimonialsData = [];

  // Create orders sequentially to manage nested data arrays efficiently
  for (let i = 1; i <= NUM_ORDERS; i++) {
    if (i % 200 === 0) console.log(`Processed ${i} / ${NUM_ORDERS} orders...`);

    const client = randomChoice(clients);
    const orderType = randomChoice(["MODEL_1", "MODEL_2", "MODEL_3"]);

    // Bias towards completed or in-progress orders
    let statusWeight = randomInt(1, 100);
    let status;
    if (statusWeight > 60) status = "COMPLETED";
    else if (statusWeight > 50) status = "CANCELLED";
    else status = randomChoice(allStatuses.filter(s => s !== "COMPLETED" && s !== "CANCELLED"));

    const fulfillment = randomChoice(["PICKUP", "DELIVERY"]);
    const hasDelivery = fulfillment === "DELIVERY" && randomInt(1, 10) > 2;

    const createdAt = pastDate(randomInt(1, 360));

    const baseOrder = {
      orderNumber: `ORD-2025-${String(i).padStart(5, "0")}`,
      clientId: client.id,
      orderType,
      fulfillmentMethod: fulfillment,
      deliveryAddress: hasDelivery ? client.address : null,
      deliveryFee: hasDelivery ? randomFloat(2000, 15000) : null,
      status,
      clientNotes: randomInt(1, 10) > 5 ? "Please ensure it fits well." : null,
      adminNotes: randomInt(1, 10) > 8 ? "VIP Client." : null,
      createdAt
    };

    let createdOrder;
    let totalCost = 0;

    if (orderType === "MODEL_3") {
      // Ready to wear
      totalCost = randomFloat(25000, 250000);
      createdOrder = await prisma.order.create({
        data: {
          ...baseOrder,
          totalAgreedFee: totalCost,
          totalPaid: ["COMPLETED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(status) ? totalCost : randomFloat(0, totalCost),
        },
      });

      // Accumulate order items
      const numItems = randomInt(1, 4);
      for (let j = 0; j < numItems; j++) {
        const item = randomChoice(rtws);
        orderItemsData.push({
          orderId: createdOrder.id,
          readyToWearId: item.id,
          selectedSize: randomChoice(item.availableSizes) || "M",
          quantity: randomInt(1, 3),
          priceAtPurchase: item.price,
        });
      }
    } else {
      // Bespoke
      const style = randomChoice(styles);
      const mId = randomChoice(createdMeasurements.filter((m) => m.clientId === client.id))?.id || null;
      totalCost = randomFloat(50000, 500000);

      createdOrder = await prisma.order.create({
        data: {
          ...baseOrder,
          styleId: style.id,
          clientProvidesFabric: orderType === "MODEL_1",
          fabricNotes: orderType === "MODEL_1" ? "Client will bring Ankara" : null,
          measurementId: mId,
          totalAgreedFee: totalCost,
          totalPaid: ["COMPLETED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(status) ? totalCost : randomFloat(0, totalCost),
        },
      });

      chatMessagesData.push(
        { orderId: createdOrder.id, senderId: client.id, senderRole: "CLIENT", message: "Hi! I love this style.", createdAt },
        { orderId: createdOrder.id, senderId: superAdmin.id, senderRole: "SUPER_ADMIN", message: "Hello! We can certainly make this for you.", createdAt: new Date(createdAt.getTime() + 3600000) }
      );
    }

    // Status History
    statusHistoryData.push({
      orderId: createdOrder.id,
      status: "PENDING_REVIEW",
      changedById: client.id,
      note: "Order created.",
      createdAt
    });

    if (status !== "PENDING_REVIEW") {
      statusHistoryData.push({
        orderId: createdOrder.id,
        status,
        changedById: randomChoice(allAdmins).id,
        note: `Admin moved order to ${status}`,
        createdAt: new Date(createdAt.getTime() + 86400000) // 1 day later
      });
    }

    // Payment
    if (createdOrder.totalPaid > 0) {
      paymentsData.push({
        orderId: createdOrder.id,
        clientId: client.id,
        amount: createdOrder.totalPaid,
        paymentType: ["COMPLETED", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(status) ? "FULL" : "INSTALLMENT",
        status: "CONFIRMED",
        confirmedById: superAdmin.id,
        confirmedAt: new Date(createdAt.getTime() + 86400000),
        createdAt: new Date(createdAt.getTime() + 86400000)
      });
    }

    // Notification
    notificationsData.push({
      userId: client.id,
      type: "ORDER_PLACED",
      title: "Order Received",
      message: `Your order ${createdOrder.orderNumber} has been placed successfully.`,
      relatedOrderId: createdOrder.id,
      createdAt
    });

    // Portfolio & Testimonials (only for some completed)
    if (status === "COMPLETED" && randomInt(1, 100) > 85 && orderType !== "MODEL_3") {
      portfoliosData.push({
        orderId: createdOrder.id,
        title: `Bespoke Masterpiece for ${client.fullName}`,
        description: "An incredible custom design tailored to perfection.",
        category: randomChoice(styleCategories),
        images: [randomChoice(styleImages), randomChoice(styleImages)],
        clientConsent: true,
        isFeatured: randomInt(1, 10) > 6,
        isPublished: true,
      });

      if (randomInt(1, 10) > 5) {
        testimonialsData.push({
          clientId: client.id,
          clientName: client.fullName,
          rating: randomChoice([4, 5, 5, 5]),
          review: "Amazing work! The fit is absolutely perfect and the delivery was fast. I highly recommend Fashion Studio!",
          photoUrl: client.profilePicture || randomChoice(profilePics),
          source: "CLIENT_SUBMITTED",
          status: "APPROVED",
          isFeatured: randomInt(1, 10) > 7,
          createdAt: new Date(createdAt.getTime() + 10 * 86400000) // 10 days after order
        });
      }
    }
  }

  // Insert all the gathered relational data in batches to avoid parameters bounds
  console.log("Inserting Order Items...");
  for (const batch of chunkArray(orderItemsData, 5000)) await prisma.orderItem.createMany({ data: batch });

  console.log("Inserting Chat Messages...");
  for (const batch of chunkArray(chatMessagesData, 5000)) await prisma.chatMessage.createMany({ data: batch });

  console.log("Inserting Status Histories...");
  for (const batch of chunkArray(statusHistoryData, 5000)) await prisma.orderStatusHistory.createMany({ data: batch });

  console.log("Inserting Payments...");
  for (const batch of chunkArray(paymentsData, 5000)) await prisma.payment.createMany({ data: batch });

  console.log("Inserting Notifications...");
  for (const batch of chunkArray(notificationsData, 5000)) await prisma.notification.createMany({ data: batch });

  console.log("Inserting Portfolios & Testimonials...");
  for (const batch of chunkArray(portfoliosData, 2000)) await prisma.portfolio.createMany({ data: batch });
  for (const batch of chunkArray(testimonialsData, 2000)) await prisma.testimonial.createMany({ data: batch });

  // 8. Appointments
  const NUM_APPOINTMENTS = 200;
  console.log(`Seeding ${NUM_APPOINTMENTS} Appointments...`);
  const appointmentsData = [];
  for (let i = 0; i < NUM_APPOINTMENTS; i++) {
    const client = randomChoice(clients);
    appointmentsData.push({
      clientId: client.id,
      requestedDate: futureDate(randomInt(-30, 30)), // some past, some future
      confirmedDate: randomInt(1, 10) > 4 ? futureDate(randomInt(-30, 30)) : null,
      status: randomChoice(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]),
    });
  }
  await prisma.measurementAppointment.createMany({ data: appointmentsData });

  // 9. Carts items
  console.log("Seeding Cart Items...");
  const allCarts = await prisma.cart.findMany();
  const cartItemsData = [];
  // Give 30% of users some items in their cart
  const activeCarts = allCarts.filter(() => randomInt(1, 10) <= 3);

  for (const cart of activeCarts) {
    const numCartItems = randomInt(1, 4);
    const addedRtws = new Set();

    for (let j = 0; j < numCartItems; j++) {
      const rtw = randomChoice(rtws);
      if (!addedRtws.has(rtw.id) && rtw.availableSizes.length > 0) {
        cartItemsData.push({
          cartId: cart.id,
          readyToWearId: rtw.id,
          selectedSize: randomChoice(rtw.availableSizes),
          quantity: randomInt(1, 3),
        });
        addedRtws.add(rtw.id);
      }
    }
  }

  // Create carefully to avoid compound unique constraints if duplicates exist
  for (const batch of chunkArray(cartItemsData, 1000)) {
    await prisma.cartItem.createMany({ data: batch, skipDuplicates: true });
  }

  console.log("Massive Database seeded successfully! 🎉");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    if (pool) {
      await pool.end();
    }
  });
