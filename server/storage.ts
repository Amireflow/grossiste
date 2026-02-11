import {
  users, userProfiles, categories, products, orders, orderItems, cartItems, productBoosts, walletTransactions,
  subscriptionPlans, userSubscriptions,
  type UserProfile, type InsertUserProfile,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
  type ProductBoost, type InsertProductBoost,
  type WalletTransaction, type InsertWalletTransaction,
  type SubscriptionPlan, type UserSubscription, type InsertUserSubscription,
  type User,
  type Notification, type InsertNotification,
  notifications
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or, gte, lte, inArray, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export interface IStorage {
  getProfileByUserId(userId: string): Promise<UserProfile | undefined>;
  createProfile(data: InsertUserProfile): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  getProducts(categoryId?: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsBySupplier(supplierId: string): Promise<Product[]>;
  getMarketplaceProducts(categoryId?: string, search?: string, supplierId?: string): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null; isSponsored: boolean; boostLevel: string | null })[]>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;

  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  getCartItemById(id: string): Promise<CartItem | undefined>;
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  getOrdersByBuyer(buyerId: string): Promise<(Order & { items: OrderItem[] })[]>;
  getOrdersBySupplier(supplierId: string): Promise<(Order & { items: OrderItem[] })[]>;
  createOrder(data: InsertOrder): Promise<Order>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrder(id: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] }) | undefined>;
  checkoutTransaction(
    userId: string,
    cartItemsData: (CartItem & { product: Product })[],
    delivery: {
      currency: string;
      contactName: string;
      deliveryPhone: string;
      deliveryAddress: string;
      deliveryCity: string;
      paymentMethod: string;
      notes: string;
    }
  ): Promise<Order[]>;

  getStats(userId: string, role: string): Promise<{ totalOrders: number; pendingOrders: number; totalProducts: number; totalRevenue: string }>;
  getSuppliers(): Promise<{ id: string; businessName: string; city: string | null; country: string | null; description: string | null; productCount: number; profileImageUrl: string | null }[]>;

  getBoostsBySupplier(supplierId: string): Promise<(ProductBoost & { productName: string })[]>;
  getActiveBoostForProduct(productId: string): Promise<ProductBoost | undefined>;
  getBoostById(id: string): Promise<ProductBoost | undefined>;
  createBoost(data: InsertProductBoost): Promise<ProductBoost>;
  updateBoost(id: string, data: Partial<{ status: string; endDate: Date }>): Promise<ProductBoost | undefined>;
  getActiveBoostProductIds(): Promise<Set<string>>;

  getWalletBalance(userId: string): Promise<string>;
  getWalletTransactions(userId: string): Promise<WalletTransaction[]>;
  topUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction>;
  chargeWalletForBoost(userId: string, amount: number, boostId: string, description: string): Promise<WalletTransaction>;

  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getActiveSubscription(userId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined>;
  createSubscription(data: InsertUserSubscription): Promise<UserSubscription>;
  chargeWalletForSubscription(userId: string, amount: number, planId: string, description: string): Promise<WalletTransaction>;
  getSupplierProductCount(supplierId: string): Promise<number>;

  // Admin methods
  getAllUsers(): Promise<(User & { profile: UserProfile | null })[]>;
  getPlatformStats(): Promise<{
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: string;
  }>;
  getAllProducts(): Promise<(Product & { supplierName: string; categoryName: string })[]>;
  getAllOrders(): Promise<(Order & { buyerName: string; supplierName: string; itemsCount: number })[]>;
  updateProductStatus(id: string, isActive: boolean): Promise<Product>;
  updateUserRole(userId: string, role: string): Promise<UserProfile>;
  getRevenueStats(): Promise<{ date: string; revenue: number }[]>;
  getUserStats(): Promise<{ role: string; count: number }[]>;
  getDashboardActivity(): Promise<{
    recentOrders: (Order & { buyerName: string; supplierName: string })[];
    recentUsers: User[];
  }>;
  getPendingProducts(): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null })[]>;
  moderateProduct(id: string, status: "active" | "rejected", reason?: string): Promise<Product | undefined>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Admin Finance & Subs
  getAllSubscriptions(): Promise<(UserSubscription & { user: User; plan: SubscriptionPlan })[]>;
  getAllTransactions(): Promise<(WalletTransaction & { user: User })[]>;
  adminTopUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction>;
  adminAssignSubscription(userId: string, planId: string, durationDays?: number): Promise<UserSubscription>;

  // Analytics
  getSalesHistory(days: number): Promise<{ date: string; revenue: number }[]>;
  getProductRevenueStats(): Promise<{ productId: string; name: string; revenue: number }[]>;
  getInactiveProducts(days: number): Promise<{ productId: string; name: string; lastOrderDate: Date | null; daysInactive: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getProfileByUserId(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile || undefined;
  }

  async createProfile(data: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db.insert(userProfiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [profile] = await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId)).returning();
    return profile || undefined;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
    return cat || undefined;
  }

  async getProducts(categoryId?: string): Promise<Product[]> {
    if (categoryId) {
      return db.select().from(products)
        .where(and(eq(products.categoryId, categoryId), eq(products.isActive, true)))
        .orderBy(desc(products.createdAt));
    }
    return db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    return db.select().from(products)
      .where(eq(products.supplierId, supplierId))
      .orderBy(desc(products.createdAt));
  }

  async getMarketplaceProducts(categoryId?: string, search?: string, supplierId?: string): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null; isSponsored: boolean; boostLevel: string | null })[]> {
    const conditions = [eq(products.isActive, true)];
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (supplierId) {
      conditions.push(eq(products.supplierId, supplierId));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )!
      );
    }

    const now = new Date();
    const rows = await db.select({
      product: products,
      supplierName: userProfiles.businessName,
      supplierCity: userProfiles.city,
      supplierImage: users.profileImageUrl, // Add supplier image
      boostLevel: productBoosts.boostLevel,
      boostStatus: productBoosts.status,
      boostEnd: productBoosts.endDate,
      boostStart: productBoosts.startDate,
    })
      .from(products)
      .innerJoin(userProfiles, eq(products.supplierId, userProfiles.userId))
      .innerJoin(users, eq(products.supplierId, users.id)) // Join users table
      .leftJoin(productBoosts, and(
        eq(productBoosts.productId, products.id),
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ))
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN ${productBoosts.boostLevel} = 'premium' THEN 0 WHEN ${productBoosts.boostLevel} = 'standard' THEN 1 ELSE 2 END`,
        desc(products.createdAt)
      );

    return rows.map(row => ({
      ...row.product,
      supplierName: row.supplierName,
      supplierCity: row.supplierCity,
      supplierImage: row.supplierImage, // Return supplier image
      isSponsored: !!row.boostLevel && !!row.boostStatus,
      boostLevel: row.boostLevel || null,
    }));
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db.select().from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return items.map((row) => ({
      ...row.cart_items,
      product: row.products,
    }));
  }

  async getCartItemById(id: string): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item || undefined;
  }

  async addToCart(data: InsertCartItem): Promise<CartItem> {
    const existing = await db.select().from(cartItems)
      .where(and(eq(cartItems.userId, data.userId), eq(cartItems.productId, data.productId)));

    if (existing.length > 0) {
      const [updated] = await db.update(cartItems)
        .set({ quantity: (existing[0].quantity || 0) + (data.quantity || 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    }

    const [item] = await db.insert(cartItems).values(data).returning();
    return item;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return item || undefined;
  }

  async removeCartItem(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async getOrdersByBuyer(buyerId: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] })[]> {
    const allOrders = await db.select().from(orders)
      .where(eq(orders.buyerId, buyerId))
      .orderBy(desc(orders.createdAt));

    if (allOrders.length === 0) return [];

    const orderIds = allOrders.map(o => o.id);
    const allItems = await db.select({
      orderItem: orderItems,
      product: { name: products.name, imageUrl: products.imageUrl },
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<string, (OrderItem & { product?: { name: string; imageUrl: string | null } })[]>();
    for (const r of allItems) {
      const arr = itemsByOrderId.get(r.orderItem.orderId) || [];
      arr.push({ ...r.orderItem, product: r.product || undefined });
      itemsByOrderId.set(r.orderItem.orderId, arr);
    }

    return allOrders.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));
  }

  async getOrdersBySupplier(supplierId: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] })[]> {
    const allOrders = await db.select().from(orders)
      .where(eq(orders.supplierId, supplierId))
      .orderBy(desc(orders.createdAt));

    if (allOrders.length === 0) return [];

    const orderIds = allOrders.map(o => o.id);
    const allItems = await db.select({
      orderItem: orderItems,
      product: { name: products.name, imageUrl: products.imageUrl },
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrderId = new Map<string, (OrderItem & { product?: { name: string; imageUrl: string | null } })[]>();
    for (const r of allItems) {
      const arr = itemsByOrderId.get(r.orderItem.orderId) || [];
      arr.push({ ...r.orderItem, product: r.product || undefined });
      itemsByOrderId.set(r.orderItem.orderId, arr);
    }

    return allOrders.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async updateOrderStatus(id: string, newStatus: string): Promise<Order | undefined> {
    const [currentOrder] = await db.select().from(orders).where(eq(orders.id, id));
    if (!currentOrder) return undefined;

    const current = currentOrder.status || "pending";
    const allowedTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: []
    };

    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${current} to ${newStatus}`);
    }

    const [order] = await db.update(orders)
      .set({ status: newStatus as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async checkoutTransaction(
    userId: string,
    cartItemsData: (CartItem & { product: Product })[],
    delivery: {
      currency: string;
      contactName: string;
      deliveryPhone: string;
      deliveryAddress: string;
      deliveryCity: string;
      paymentMethod: string;
      notes: string;
    }
  ): Promise<Order[]> {
    return await db.transaction(async (tx) => {
      const ordersBySupplier: Record<string, typeof cartItemsData> = {};
      for (const item of cartItemsData) {
        const sid = item.product.supplierId;
        if (!ordersBySupplier[sid]) ordersBySupplier[sid] = [];
        ordersBySupplier[sid].push(item);
      }

      const createdOrders: Order[] = [];
      for (const [supplierId, items] of Object.entries(ordersBySupplier)) {
        const totalAmount = items.reduce(
          (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
          0
        );

        const [order] = await tx.insert(orders).values({
          buyerId: userId,
          supplierId,
          totalAmount: totalAmount.toFixed(2),
          currency: delivery.currency,
          contactName: delivery.contactName,
          deliveryPhone: delivery.deliveryPhone,
          deliveryAddress: delivery.deliveryAddress,
          deliveryCity: delivery.deliveryCity,
          paymentMethod: delivery.paymentMethod,
          notes: delivery.notes,
          status: "pending",
        } as InsertOrder).returning();

        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
          });

          // Decrement stock atomically
          if (item.product.stock !== null) {
            await tx.update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, item.productId));
          }
        }

        createdOrders.push(order);
      }

      // Clear cart within the transaction
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return createdOrders;
    });
  }

  async getOrder(id: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const rawItems = await db.select({
      orderItem: orderItems,
      product: { name: products.name, imageUrl: products.imageUrl },
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    const items = rawItems.map((r) => ({
      ...r.orderItem,
      product: r.product || undefined,
    }));

    return { ...order, items };
  }

  async getStats(userId: string, role: string): Promise<{ totalOrders: number; pendingOrders: number; totalProducts: number; totalRevenue: string }> {
    if (role === "supplier") {
      const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
        .where(eq(orders.supplierId, userId));
      const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
        .where(and(eq(orders.supplierId, userId), eq(orders.status, "pending")));
      const productsResult = await db.select({ count: sql<number>`count(*)` }).from(products)
        .where(and(eq(products.supplierId, userId), eq(products.isActive, true)));
      const revenueResult = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(orders)
        .where(and(eq(orders.supplierId, userId), eq(orders.status, "delivered")));

      return {
        totalOrders: Number(totalOrdersResult[0]?.count || 0),
        pendingOrders: Number(pendingResult[0]?.count || 0),
        totalProducts: Number(productsResult[0]?.count || 0),
        totalRevenue: String(revenueResult[0]?.total || "0"),
      };
    }

    const totalOrdersResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(eq(orders.buyerId, userId));
    const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(and(eq(orders.buyerId, userId), eq(orders.status, "pending")));
    const productsResult = await db.select({ count: sql<number>`count(distinct product_id)` }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.buyerId, userId));
    const revenueResult = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(orders)
      .where(eq(orders.buyerId, userId));

    return {
      totalOrders: Number(totalOrdersResult[0]?.count || 0),
      pendingOrders: Number(pendingResult[0]?.count || 0),
      totalProducts: Number(productsResult[0]?.count || 0),
      totalRevenue: String(revenueResult[0]?.total || "0"),
    };
  }

  async getSuppliers(): Promise<{ id: string; businessName: string; city: string | null; country: string | null; description: string | null; productCount: number; profileImageUrl: string | null }[]> {
    const rows = await db.select({
      id: userProfiles.userId,
      businessName: userProfiles.businessName,
      city: userProfiles.city,
      country: userProfiles.country,
      description: userProfiles.description,
      productCount: sql<number>`count(${products.id})::int`,
      profileImageUrl: users.profileImageUrl, // Add profile image
    })
      .from(userProfiles)
      .innerJoin(users, eq(userProfiles.userId, users.id)) // Join users table
      .leftJoin(products, and(eq(products.supplierId, userProfiles.userId), eq(products.isActive, true)))
      .where(eq(userProfiles.role, "supplier"))
      .groupBy(userProfiles.userId, userProfiles.businessName, userProfiles.city, userProfiles.country, userProfiles.description, users.profileImageUrl);

    return rows;
  }

  async getBoostsBySupplier(supplierId: string): Promise<(ProductBoost & { productName: string })[]> {
    const rows = await db.select({
      boost: productBoosts,
      productName: products.name,
    })
      .from(productBoosts)
      .innerJoin(products, eq(productBoosts.productId, products.id))
      .where(eq(productBoosts.supplierId, supplierId))
      .orderBy(desc(productBoosts.createdAt));

    return rows.map(r => ({ ...r.boost, productName: r.productName }));
  }

  async getActiveBoostForProduct(productId: string): Promise<ProductBoost | undefined> {
    const now = new Date();
    const [boost] = await db.select().from(productBoosts)
      .where(and(
        eq(productBoosts.productId, productId),
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ));
    return boost || undefined;
  }

  async getBoostById(id: string): Promise<ProductBoost | undefined> {
    const [boost] = await db.select().from(productBoosts).where(eq(productBoosts.id, id));
    return boost || undefined;
  }

  async createBoost(data: InsertProductBoost): Promise<ProductBoost> {
    const [boost] = await db.insert(productBoosts).values(data).returning();
    return boost;
  }

  async updateBoost(id: string, data: Partial<{ status: string; endDate: Date }>): Promise<ProductBoost | undefined> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.endDate) updateData.endDate = data.endDate;
    const [boost] = await db.update(productBoosts).set(updateData).where(eq(productBoosts.id, id)).returning();
    return boost || undefined;
  }

  async getActiveBoostProductIds(): Promise<Set<string>> {
    const now = new Date();
    const rows = await db.select({ productId: productBoosts.productId })
      .from(productBoosts)
      .where(and(
        eq(productBoosts.status, "active"),
        lte(productBoosts.startDate, now),
        gte(productBoosts.endDate, now)
      ));
    return new Set(rows.map(r => r.productId));
  }

  async getWalletBalance(userId: string): Promise<string> {
    const [profile] = await db.select({ walletBalance: userProfiles.walletBalance })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile?.walletBalance || "0";
  }

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async topUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction> {
    return db.transaction(async (tx) => {
      await tx.update(userProfiles)
        .set({ walletBalance: sql`(coalesce(${userProfiles.walletBalance}::numeric, 0) + ${amount})::text` })
        .where(eq(userProfiles.userId, userId));

      const [walletTx] = await tx.insert(walletTransactions).values({
        userId,
        type: "topup",
        amount: String(amount),
        description,
      }).returning();
      return walletTx;
    });
  }

  async chargeWalletForBoost(userId: string, amount: number, boostId: string, description: string): Promise<WalletTransaction> {
    return db.transaction(async (tx) => {
      const [result] = await tx.update(userProfiles)
        .set({ walletBalance: sql`cast(coalesce(${userProfiles.walletBalance}::numeric, 0) - ${amount}::numeric as numeric)` })
        .where(and(
          eq(userProfiles.userId, userId),
          sql`coalesce(${userProfiles.walletBalance}::numeric, 0) >= ${amount}`
        ))
        .returning({ walletBalance: userProfiles.walletBalance });

      if (!result) {
        throw new Error("Solde insuffisant");
      }

      const [walletTx] = await tx.insert(walletTransactions).values({
        userId,
        type: "boost_charge",
        amount: amount.toString(),
        description,
        boostId, // Use direct column - metadata doesn't exist
      }).returning();
      return walletTx;
    });
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getActiveSubscription(userId: string): Promise<(UserSubscription & { plan: SubscriptionPlan }) | undefined> {
    const now = new Date();
    const rows = await db.select({
      subscription: userSubscriptions,
      plan: subscriptionPlans
    })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, "active"),
        gte(userSubscriptions.endDate, now)
      ))
      .orderBy(desc(userSubscriptions.endDate))
      .limit(1);

    if (rows.length === 0) return undefined;

    return {
      ...rows[0].subscription,
      plan: rows[0].plan
    };
  }

  async createSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    const [sub] = await db.insert(userSubscriptions).values(data).returning();
    return sub;
  }

  async chargeWalletForSubscription(userId: string, amount: number, planId: string, description: string): Promise<WalletTransaction> {
    return db.transaction(async (tx) => {
      const [result] = await tx.update(userProfiles)
        .set({ walletBalance: sql`cast(coalesce(${userProfiles.walletBalance}::numeric, 0) - ${amount}::numeric as numeric)` })
        .where(and(
          eq(userProfiles.userId, userId),
          sql`coalesce(${userProfiles.walletBalance}::numeric, 0) >= ${amount}`
        ))
        .returning({ walletBalance: userProfiles.walletBalance });

      if (!result) {
        throw new Error("Solde insuffisant");
      }

      const [walletTx] = await tx.insert(walletTransactions).values({
        userId,
        type: "subscription_payment",
        amount: amount.toString(),
        description,
        subscriptionId: planId
      }).returning();
      return walletTx;
    });
  }

  async getSupplierProductCount(supplierId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.supplierId, supplierId));
    return Number(result.count);
  }

  async getAllUsers(): Promise<(User & { profile: UserProfile | null })[]> {
    const rows = await db.select({
      user: users,
      profile: userProfiles,
    })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    return rows.map(row => ({
      ...row.user,
      profile: row.profile,
    }));
  }

  async getAllProducts(): Promise<(Product & { supplierName: string; categoryName: string })[]> {
    const rows = await db.select({
      product: products,
      supplierName: userProfiles.businessName,
      categoryName: categories.nameFr,
    })
      .from(products)
      .leftJoin(userProfiles, eq(products.supplierId, userProfiles.userId))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));

    return rows.map(row => ({
      ...row.product,
      supplierName: row.supplierName || "Inconnu",
      categoryName: row.categoryName || "Non classé",
    }));
  }

  async getAllOrders(): Promise<(Order & { buyerName: string; supplierName: string; itemsCount: number })[]> {
    const buyer = alias(users, "buyer");
    const supplier = alias(users, "supplier");
    const buyerProfile = alias(userProfiles, "buyer_profile");
    const supplierProfile = alias(userProfiles, "supplier_profile");

    const rows = await db.select({
      order: orders,
      buyerName: sql<string>`coalesce(${buyer.firstName} || ' ' || ${buyer.lastName}, ${buyer.email})`,
      supplierName: supplierProfile.businessName,
      itemsCount: sql<number>`count(${orderItems.id})::int`,
    })
      .from(orders)
      .leftJoin(buyer, eq(orders.buyerId, buyer.id))
      .leftJoin(supplier, eq(orders.supplierId, supplier.id))
      .leftJoin(supplierProfile, eq(supplier.id, supplierProfile.userId))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .groupBy(orders.id, buyer.id, buyer.email, buyer.firstName, buyer.lastName, supplierProfile.businessName)
      .orderBy(desc(orders.createdAt));

    return rows.map(row => ({
      ...row.order,
      buyerName: row.buyerName || "Client inconnu",
      supplierName: row.supplierName || "Fournisseur inconnu",
      itemsCount: row.itemsCount || 0,
    }));
  }

  async updateProductStatus(id: string, isActive: boolean): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ isActive })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getPendingProducts(): Promise<(Product & { supplierName: string; supplierCity: string | null; supplierImage: string | null })[]> {
    const rows = await db.select({
      product: products,
      supplierName: userProfiles.businessName,
      supplierCity: userProfiles.city,
      supplierImage: users.profileImageUrl,
    })
      .from(products)
      .innerJoin(userProfiles, eq(products.supplierId, userProfiles.userId))
      .innerJoin(users, eq(products.supplierId, users.id))
      .where(eq(products.status, "pending"))
      .orderBy(desc(products.createdAt));

    return rows.map(row => ({
      ...row.product,
      supplierName: row.supplierName,
      supplierCity: row.supplierCity,
      supplierImage: row.supplierImage,
    }));
  }

  async moderateProduct(id: string, status: "active" | "rejected", reason?: string): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        status,
        isActive: status === "active", // Sync isActive with status
        rejectionReason: reason || null
      })
      .where(eq(products.id, id))
      .returning();

    if (product) {
      if (status === "active") {
        await this.createNotification({
          userId: product.supplierId,
          type: "product_moderation",
          title: "Produit validé",
          message: `Votre produit "${product.name}" a été validé et est maintenant actif sur le marketplace.`,
          metadata: JSON.stringify({ productId: product.id }),
        });
      } else if (status === "rejected") {
        await this.createNotification({
          userId: product.supplierId,
          type: "product_moderation",
          title: "Produit refusé",
          message: `Votre produit "${product.name}" a été refusé. Motif : ${reason}`,
          metadata: JSON.stringify({ productId: product.id }),
        });
      }
    }

    return product || undefined;
  }

  async updateUserRole(userId: string, role: "shop_owner" | "supplier" | "admin"): Promise<UserProfile> {
    const [profile] = await db
      .update(userProfiles)
      .set({ role })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return profile;
  }


  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: string;
  }> {
    const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [ordersCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [revenue] = await db.select({ total: sql<string>`coalesce(sum(total_amount::numeric), 0)` }).from(orders);

    return {
      totalUsers: Number(usersCount?.count || 0),
      totalProducts: Number(productsCount?.count || 0),
      totalOrders: Number(ordersCount?.count || 0),
      totalRevenue: String(revenue?.total || "0"),
    };
  }

  async getRevenueStats(): Promise<{ date: string; revenue: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        total: sql<string>`sum(${orders.totalAmount}::numeric)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, sevenDaysAgo))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    // Fill in missing dates with 0
    const stats = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = result.find(r => r.date === dateStr);
      stats.push({
        date: dateStr,
        revenue: existing ? Number(existing.total) : 0
      });
    }
    return stats.reverse();
  }

  async getUserStats(): Promise<{ role: string; count: number }[]> {
    const result = await db
      .select({
        role: userProfiles.role,
        count: sql<number>`count(*)::int`,
      })
      .from(userProfiles)
      .groupBy(userProfiles.role);

    return result.map(r => ({
      role: r.role === 'shop_owner' ? 'Commerçants' : r.role === 'supplier' ? 'Fournisseurs' : r.role === 'admin' ? 'Admin' : r.role,
      count: r.count
    }));
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getSalesHistory(days: number): Promise<{ date: string; revenue: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
        total: sql<string>`sum(${orders.totalAmount}::numeric)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, cutoff))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    // Fill in missing dates
    const stats: { date: string; revenue: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = result.find(r => r.date === dateStr);
      stats.push({
        date: dateStr,
        revenue: existing ? Number(existing.total) : 0
      });
    }
    return stats.reverse();
  }

  async getProductRevenueStats(): Promise<{ productId: string; name: string; revenue: number }[]> {
    const rows = await db.select({
      productId: products.id,
      name: products.name,
      revenue: sql<string>`coalesce(sum(${orderItems.totalPrice}::numeric), 0)`
    })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .groupBy(products.id, products.name)
      .orderBy(sql`sum(${orderItems.totalPrice}::numeric) DESC`);

    return rows.map(r => ({ ...r, revenue: Number(r.revenue) }));
  }

  async getInactiveProducts(days: number): Promise<{ productId: string; name: string; lastOrderDate: Date | null; daysInactive: number }[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Get all products and their max order date
    const rows = await db.select({
      productId: products.id,
      name: products.name,
      lastOrderDate: sql<Date>`max(${orders.createdAt})`
    })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(products.isActive, true)) // Only check active products
      .groupBy(products.id, products.name)
      .having(or(
        lte(sql`max(${orders.createdAt})`, cutoff),
        sql`max(${orders.createdAt}) IS NULL`
      ))
      .orderBy(asc(sql`max(${orders.createdAt}) NULLS FIRST`));

    const now = new Date();
    return rows.map(r => {
      const lastDate = r.lastOrderDate ? new Date(r.lastOrderDate) : null;
      let daysInactive = -1;
      if (lastDate) {
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        daysInactive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        daysInactive = 999; // Never sold
      }
      return {
        ...r,
        lastOrderDate: lastDate,
        daysInactive
      };
    });
  }

  async getDashboardActivity(): Promise<{
    recentOrders: (Order & { buyerName: string; supplierName: string })[];
    recentUsers: (User & { profile: UserProfile | null })[];
  }> {
    const recentOrders = await this.getAllOrders(); // Reuse existing method but slice result
    // Note: getAllOrders already sorts by desc createdAt

    // Fetch users with profiles
    const rows = await db.select({
      user: users,
      profile: userProfiles
    })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(users.createdAt))
      .limit(5);

    return {
      recentOrders: recentOrders.slice(0, 5),
      recentUsers: rows.map(r => ({ ...r.user, profile: r.profile }))
    };
  }

  async getAllSubscriptions(): Promise<(UserSubscription & { user: User; plan: SubscriptionPlan })[]> {
    const rows = await db.select({
      subscription: userSubscriptions,
      user: users,
      plan: subscriptionPlans
    })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(userSubscriptions.createdAt));

    return rows.map(r => ({
      ...r.subscription,
      user: r.user,
      plan: r.plan
    }));
  }

  async getAllTransactions(): Promise<(WalletTransaction & { user: User })[]> {
    const rows = await db.select({
      transaction: walletTransactions,
      user: users
    })
      .from(walletTransactions)
      .innerJoin(users, eq(walletTransactions.userId, users.id))
      .orderBy(desc(walletTransactions.createdAt));

    return rows.map(r => ({
      ...r.transaction,
      user: r.user
    }));
  }

  async adminTopUpWallet(userId: string, amount: number, description: string): Promise<WalletTransaction> {
    // Reuse topUpWallet but explicitly for admin actions (logic is same for now)
    return this.topUpWallet(userId, amount, description);
  }

  async adminAssignSubscription(userId: string, planId: string, durationDays?: number): Promise<UserSubscription> {
    // 1. Get plan details
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
    if (!plan) throw new Error("Plan not found");

    const duration = durationDays || plan.duration;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duration);

    // 2. Deactivate existing active subscriptions?
    // For now, let's assume we just add a new one. The logic for "active" usually grabs the one with latest end date or actively checks status.
    // Let's set status of overlaps to 'expired'?
    await db.update(userSubscriptions)
      .set({ status: 'cancelled' })
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ));

    // 3. Create new subscription
    const [sub] = await db.insert(userSubscriptions).values({
      userId,
      planId,
      startDate,
      endDate,
      status: 'active',
      autoRenew: false
    } as InsertUserSubscription).returning();

    return sub;
  }
}

export const storage = new DatabaseStorage();
