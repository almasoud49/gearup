import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = 5000;

async function main() {
    try {
        await prisma.$connect();
        console.log("Connected to the gearup database successfully.");
       app.listen(PORT, () => {
        console.log(`Gearup Server is running on port ${PORT}`);
       }) 
    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();