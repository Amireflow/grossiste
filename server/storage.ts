import {
  users, userProfiles, categories, products, orders, orderItems, cartItems,
  type UserProfile, type InsertUserProfile,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  getProfileByUserId(userId: string): Promise<UserProfile | undefined>;
  createProfile(data: InsertUserProfile): Promise<UserProfile>;

  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;

  getProducts(categoryId?: string): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductsBySupplier(supplierId: string): Promise<Product[]>;
  getMarketplaceProducts(categoryId?: string, search?: string): Promise<(Product & { supplierName: string; supplierCity: string | null })[]>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;

  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(data: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  getOrdersByBuyer(buyerId: string): Promise<(Order & { items: OrderItem[] })[]>;
  getOrdersBySupplier(supplierId: string): Promise<(Order & { items: OrderItem[] })[]>;
  createOrder(data: InsertOrder): Promise<Order>;
  createOrderItem(data: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  getStats(userId: string, role: string): Promise<{ totalOrders: number; pendingOrders: number; totalProducts: number; totalRevenue: string }>;
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

  async getMarketplaceProducts(categoryId?: string, search?: string): Promise<(Product & { supplierName: string; supplierCity: string | null })[]> {
    const conditions = [eq(products.isActive, true)];
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )!
      );
    }

    const rows = await db.select({
      product: products,
      supplierName: userProfiles.businessName,
      supplierCity: userProfiles.city,
    })
      .from(products)
      .innerJoin(userProfiles, eq(products.supplierId, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));

    return rows.map(row => ({
      ...row.product,
      supplierName: row.supplierName,
      supplierCity: row.supplierCity,
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

    const result = [];
    for (const order of allOrders) {
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
      result.push({ ...order, items });
    }
    return result;
  }

  async getOrdersBySupplier(supplierId: string): Promise<(Order & { items: (OrderItem & { product?: { name: string; imageUrl: string | null } })[] })[]> {
    const allOrders = await db.select().from(orders)
      .where(eq(orders.supplierId, supplierId))
      .orderBy(desc(orders.createdAt));

    const result = [];
    for (const order of allOrders) {
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
      result.push({ ...order, items });
    }
    return result;
  }

  async createOrder(data: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  }

  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(data).returning();
    return item;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
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
}

export const storage = new DatabaseStorage();
