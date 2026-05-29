import { prisma } from "./lib/prisma.js";
import app from "./src/app.js";
import 'reflect-metadata';
import { createRandomPassword } from "./src/utils/passwordGenerator.js";
import { hashPassword } from "./src/utils/passwordHashing.js";
const PORT = 3000;

const initServer = async()=>{
    try{
        const userCount = await prisma.user.count();
        if(userCount === 0){
            const adminPassword = createRandomPassword();
            const hashedPassword = await hashPassword(adminPassword);
            await prisma.user.create({
                data:{
                    email:"admin@miniagent.hub",
                    fullname:"Admin",
                    userPassword:hashedPassword, 
                    userRole:"ADMIN"
                }
            })
            console.log("Admin user created with email: admin@miniagent.hub and password: " + adminPassword);
        }
    }catch(error){
        console.error("Error initializing server:", error);
        process.exit(1);
    }
}
const startServer = () =>{
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server ready at: http://localhost:${PORT}`);
    });
    server.on("error", (error: NodeJS.ErrnoException): void => {
        if (error.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use. Please free the port and try again.`);
        } else {
            console.error("Server error:", error);
        }
        process.exit(1);
    });
};
initServer().then(() => {
    startServer();
});