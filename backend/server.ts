import app from "./src/app.js";
import 'reflect-metadata';
const PORT = 3000;
const startServer = () =>{
    app.listen(PORT, () => {
        console.log(`🚀 Server ready at: http://localhost:${PORT}`);
    });
};
startServer();