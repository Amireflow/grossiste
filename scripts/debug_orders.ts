
import "dotenv/config";
import { storage } from "../server/storage";

async function main() {
    try {
        console.log("Fetching all orders...");
        const orders = await storage.getAllOrders();
        console.log(`Found ${orders.length} orders.`);
        if (orders.length > 0) {
            console.log("First order sample:", JSON.stringify(orders[0], null, 2));
        } else {
            // Check if there are ANY orders in the raw table
            const { db } = await import("../server/db");
            const { orders: ordersTable } = await import("../shared/schema");
            const rawOrders = await db.select().from(ordersTable);
            console.log(`Raw orders table count: ${rawOrders.length}`);
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
    process.exit(0);
}

main();
