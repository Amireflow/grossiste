
import "dotenv/config";
import { storage } from "../server/storage";

async function main() {
    try {
        console.log("Fetching revenue stats...");
        const revenueStats = await storage.getRevenueStats();
        console.log("Revenue Stats:", JSON.stringify(revenueStats, null, 2));

        console.log("Fetching user stats...");
        const userStats = await storage.getUserStats();
        console.log("User Stats:", JSON.stringify(userStats, null, 2));

    } catch (error) {
        console.error("Error fetching stats:", error);
    }
    process.exit(0);
}

main();
