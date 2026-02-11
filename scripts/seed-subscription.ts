
import "dotenv/config";
import { seedSubscriptionPlans } from "../server/seed";
import { db } from "../server/db";

async function main() {
    try {
        console.log("Starting manual subscription plans seed...");
        await seedSubscriptionPlans();
        console.log("Done!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding plans:", error);
        process.exit(1);
    }
}

main();
