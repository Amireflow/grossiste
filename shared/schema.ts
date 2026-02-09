import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const userRoleEnum = pgEnum("user_role", ["shop_owner", "supplier"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]);
export const currencyEnum = pgEnum("currency", ["XOF", "XAF", "NGN", "GHS"]);
export const boostLevelEnum = pgEnum("boost_level", ["standard", "premium"]);
export const boostStatusEnum = pgEnum("boost_status", ["active", "paused", "expired"]);
export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", ["topup", "boost_charge", "refund"]);

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: userRoleEnum("role").notNull().default("shop_owner"),
  businessName: text("business_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country").default("Bénin"),
  currency: currencyEnum("currency").default("XOF"),
  description: text("description"),
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0"),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameFr: text("name_fr").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("XOF"),
  unit: text("unit").notNull().default("unité"),
  minOrder: integer("min_order").default(1),
  stock: integer("stock").default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentMethodEnum = pgEnum("payment_method", ["mobile_money", "cash_on_delivery"]);

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").default("pending"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("XOF"),
  contactName: text("contact_name"),
  deliveryPhone: text("delivery_phone"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  paymentMethod: paymentMethodEnum("payment_method").default("mobile_money"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

export const productBoosts = pgTable("product_boosts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  supplierId: varchar("supplier_id").notNull().references(() => users.id),
  boostLevel: boostLevelEnum("boost_level").notNull().default("standard"),
  status: boostStatusEnum("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: walletTransactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("XOF"),
  description: text("description"),
  boostId: varchar("boost_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  supplier: one(users, { fields: [products.supplierId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id], relationName: "buyer" }),
  supplier: one(users, { fields: [orders.supplierId], references: [users.id], relationName: "supplier" }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const productBoostsRelations = relations(productBoosts, ({ one }) => ({
  product: one(products, { fields: [productBoosts.productId], references: [products.id] }),
  supplier: one(users, { fields: [productBoosts.supplierId], references: [users.id] }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, { fields: [walletTransactions.userId], references: [users.id] }),
}));

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertProductBoostSchema = createInsertSchema(productBoosts).omit({ id: true, createdAt: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertProductBoost = z.infer<typeof insertProductBoostSchema>;
export type ProductBoost = typeof productBoosts.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
