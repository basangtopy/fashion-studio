import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/apiResponse.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { getStockStatus } from "../utils/stockStatus.js";
import { notifyOrderPlaced } from "../services/notification.service.js";

// ─── Helper: Get or create the user's cart ───────────────────────────────────

const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }

  return cart;
};

// ─── Helper: Calculate cart total ────────────────────────────────────────────

const formatCartResponse = (cart) => {
  const items = cart.items.map((item) => ({
    ...item,
    lineTotal: Number(item.readyToWear.price) * item.quantity,
  }));

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { ...cart, items, total };
};

// ─── GET /cart ───────────────────────────────────────────────────────────────
// Returns the authenticated user's cart with all items, prices, and total

export const getCart = async (req, res) => {
  const userId = req.user.userId;

  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          readyToWear: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              availableSizes: true,
              stockStatus: true,
              stockCount: true,
              isActive: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    return successResponse(res, 200, "Cart is empty", {
      cart: { items: [], total: 0 },
    });
  }

  return successResponse(res, 200, "Cart retrieved", {
    cart: formatCartResponse(cart),
  });
};

// ─── POST /cart/items ────────────────────────────────────────────────────────
// Add an item to the cart. If item+size exists, increment quantity.

export const addToCart = async (req, res) => {
  const userId = req.user.userId;
  const { readyToWearId, selectedSize, quantity } = req.validatedBody;

  // Validate the ready-to-wear item exists and is active
  const item = await prisma.readyToWear.findUnique({
    where: { id: readyToWearId },
  });

  if (!item || !item.isActive) {
    throw new AppError("Item not found or no longer available", 404);
  }

  // Validate size is available for this item
  if (!item.availableSizes.includes(selectedSize)) {
    throw new AppError(
      `Size "${selectedSize}" is not available. Available sizes: ${item.availableSizes.join(", ")}`,
      400,
    );
  }

  // Validate stock
  if (item.stockStatus === "OUT_OF_STOCK" || item.stockCount < quantity) {
    throw new AppError(
      item.stockCount === 0
        ? "This item is currently out of stock"
        : `Only ${item.stockCount} left in stock`,
      400,
    );
  }

  // Get or create cart
  const cart = await getOrCreateCart(userId);

  // Check if same item+size already in cart — if so, increment quantity
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_readyToWearId_selectedSize: {
        cartId: cart.id,
        readyToWearId,
        selectedSize,
      },
    },
  });

  let cartItem;

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;

    if (newQuantity > item.stockCount) {
      throw new AppError(
        `Cannot add ${quantity} more. You already have ${existingCartItem.quantity} in your cart, and only ${item.stockCount} are in stock`,
        400,
      );
    }

    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
      include: { readyToWear: { select: { name: true, price: true } } },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: { cartId: cart.id, readyToWearId, selectedSize, quantity },
      include: { readyToWear: { select: { name: true, price: true } } },
    });
  }

  return successResponse(
    res,
    existingCartItem ? 200 : 201,
    existingCartItem
      ? `Quantity updated to ${cartItem.quantity}`
      : "Item added to cart",
    { cartItem },
  );
};

// ─── PUT /cart/items/:itemId ─────────────────────────────────────────────────
// Update the quantity of a specific cart item

export const updateCartItem = async (req, res) => {
  const userId = req.user.userId;
  const { itemId } = req.params;
  const { quantity } = req.validatedBody;

  // Find the cart item and verify it belongs to this user
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: { select: { userId: true } },
      readyToWear: { select: { stockCount: true, name: true } },
    },
  });

  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  // Validate stock
  if (quantity > cartItem.readyToWear.stockCount) {
    throw new AppError(
      `Only ${cartItem.readyToWear.stockCount} of "${cartItem.readyToWear.name}" available in stock`,
      400,
    );
  }

  const updated = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: { readyToWear: { select: { name: true, price: true } } },
  });

  return successResponse(res, 200, "Cart item updated", { cartItem: updated });
};

// ─── DELETE /cart/items/:itemId ──────────────────────────────────────────────
// Remove a single item from the cart

export const removeCartItem = async (req, res) => {
  const userId = req.user.userId;
  const { itemId } = req.params;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: { select: { userId: true } } },
  });

  if (!cartItem || cartItem.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });

  return successResponse(res, 200, "Item removed from cart");
};

// ─── DELETE /cart ─────────────────────────────────────────────────────────────
// Clear the entire cart

export const clearCart = async (req, res) => {
  const userId = req.user.userId;

  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    return successResponse(res, 200, "Cart is already empty");
  }

  // Cascade delete handles the cart items automatically
  await prisma.cart.delete({ where: { id: cart.id } });

  return successResponse(res, 200, "Cart cleared");
};

// ─── POST /cart/checkout ─────────────────────────────────────────────────────
// Validate stock → create Model 3 order → decrease stock → clear cart

export const checkout = async (req, res) => {
  const userId = req.user.userId;
  const { fulfillmentMethod, deliveryAddress, clientNotes } = req.validatedBody;

  // Delivery requires an address
  if (fulfillmentMethod === "DELIVERY" && !deliveryAddress) {
    throw new AppError("Delivery address is required for delivery orders", 400);
  }

  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          readyToWear: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  // ── Stock validation (critical checkout check) ───────────────────────────
  const stockErrors = [];

  for (const item of cart.items) {
    if (!item.readyToWear.isActive) {
      stockErrors.push(`"${item.readyToWear.name}" is no longer available`);
    } else if (item.quantity > item.readyToWear.stockCount) {
      stockErrors.push(
        `"${item.readyToWear.name}" (${item.selectedSize}): only ${item.readyToWear.stockCount} left, you requested ${item.quantity}`,
      );
    }
  }

  if (stockErrors.length > 0) {
    throw new AppError(
      `Some items in your cart have stock issues: ${stockErrors.join("; ")}`,
      400,
    );
  }

  // ── Create single order + decrease stock in a transaction ──────────────────────
  // The cart items are transformed into OrderItems attached to a single new Order.

  const result = await prisma.$transaction(async (tx) => {
    // Generate order number INSIDE the transaction to prevent race conditions
    const orderNumber = await generateOrderNumber(tx);

    // Calculate total agreed fee from the cart items
    const totalAgreedFee = cart.items.reduce(
      (sum, item) => sum + Number(item.readyToWear.price) * item.quantity,
      0,
    );

    // Map cart items exactly to the new OrderItem shape
    const orderItemsData = cart.items.map((item) => ({
      readyToWearId: item.readyToWearId,
      selectedSize: item.selectedSize,
      quantity: item.quantity,
      priceAtPurchase: item.readyToWear.price,
    }));

    // Generate client notes including cart quantity breakdown if needed,
    // though OrderItems captures this securely now.
    const cartSummary = cart.items
      .map(
        (item) =>
          `${item.readyToWear.name} (${item.selectedSize}) x${item.quantity}`,
      )
      .join(", ");

    const finalClientNotes = clientNotes
      ? `${clientNotes} | Cart: ${cartSummary}`
      : `Cart: ${cartSummary}`;

    // Create the single unified order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        clientId: userId,
        orderType: "MODEL_3",
        fulfillmentMethod,
        deliveryAddress,
        clientNotes: finalClientNotes,
        totalAgreedFee,
        status: "AGREED_AWAITING_PAYMENT",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            readyToWear: true,
          },
        },
      },
    });

    // Log the history status
    await tx.orderStatusHistory.create({
      data: {
        orderId: newOrder.id,
        status: "AGREED_AWAITING_PAYMENT",
        changedById: userId,
        note: `Order placed via Cart checkout (${cart.items.length} ${cart.items.length > 1 ? "items" : "item"})`,
      },
    });

    // Decrease stock for each item using shared utility for consistent thresholds
    for (const item of cart.items) {
      const newStockCount = Math.max(0, item.readyToWear.stockCount - item.quantity);
      await tx.readyToWear.update({
        where: { id: item.readyToWearId },
        data: {
          stockCount: newStockCount,
          stockStatus: getStockStatus(newStockCount),
        },
      });
    }

    // Clear the cart (cascade deletes items)
    await tx.cart.delete({ where: { id: cart.id } });

    return newOrder;
  });

  // Send notification to admin and client about the new order
  const client = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, phone: true },
  });
  await notifyOrderPlaced({ order: result, client });

  return successResponse(
    res,
    201,
    "Checkout successful. Order has been placed.",
    {
      order: result,
      itemCount: cart.items.length,
      grandTotal: Number(result.totalAgreedFee),
    },
  );
};

