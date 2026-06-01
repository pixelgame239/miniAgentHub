import { prisma } from "./lib/prisma.js";
import app from "./src/app.js";
import 'reflect-metadata';
import { createRandomPassword } from "./src/utils/passwordGenerator.js";
import { hashPassword } from "./src/utils/passwordHashing.js";
const PORT = 3000;
const ADMIN_PERMISSIONS = [
  "USER_C",
  "USER_R",
  "USER_U",
  "USER_D",
  "GROUP_C",
  "GROUP_R",
  "GROUP_U",
  "GROUP_D",
  "GROUP_ADD_USER",
  "GROUP_DELETE_USER",
  "CHAT",
  "CONV_C",
  "CONV_R",
  "CONV_U",
  "CONV_D"
];
const USER_PERMISSIONS = [
  "CHAT",
  "CONV_C",
  "CONV_R",
  "CONV_U",
  "CONV_D"
];
const initServer = async()=>{
    try{
        const userCount = await prisma.user.count();
        if(userCount === 0){
            const adminPassword = createRandomPassword();
            const hashedPassword = await hashPassword(adminPassword);
            const groupCount = await prisma.group.count();
            if(groupCount === 0){
                await prisma.group.createMany({
                    data:[
                        {
                            groupName:"ADMIN",
                            permissions: ADMIN_PERMISSIONS    
                        },
                        {
                            groupName:"USER",
                            permissions: USER_PERMISSIONS
                        }
                    ]
                })
                console.log("Default groups created with respective permissions");
            }
            await prisma.user.create({
                data:{
                    email:"admin@miniagent.hub",
                    fullname:"Admin",
                    userPassword:hashedPassword,
                    groups:{
                        connect: {
                            groupName: "ADMIN"
                        }
                    }
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