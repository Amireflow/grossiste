import "dotenv/config";
import { db } from "../server/db";
import { users, userProfiles } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    const email = "khadimsn2.0@gmail.com";
    console.log(`Looking for user with email: ${email}`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    console.log(`Found user: ${user.id} (${user.firstName} ${user.lastName})`);

    const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, user.id),
    });

    if (!profile) {
        console.log("Profile not found, creating one...");
        // This shouldn't happen for a valid user, but just in case
        await db.insert(userProfiles).values({
            userId: user.id,
            role: "admin",
            businessName: "Admin",
            phone: "",
        });
    } else {
        console.log(`Current role: ${profile.role}. Updating to 'admin'...`);
        await db.update(userProfiles)
            .set({ role: "admin" })
            .where(eq(userProfiles.userId, user.id));
    }

    console.log("Successfully updated user role to admin.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
