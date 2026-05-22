import express from "express";
import { errorHandler } from "./middleware/error.middleware";
import authRouter from "./routes/auth.route";
import cors from "cors";
import { groupRouter } from "./routes/group.route";
import { jwtVerify } from "./middleware/jwt.middleware";
import { conversationRouter } from "./routes/conversation.route";
import { userRouter } from "./routes/user.route";
import { AIRouter } from "./routes/ai.route";
import { messageRouter } from "./routes/message.route";

const app = express();
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    exposedHeaders:["Authorization"]
}))
app.use(express.json());
app.use("/api/auth", authRouter);
app.use(jwtVerify);
app.use("/api/groups", groupRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/users", userRouter);
app.use("/api/ai", AIRouter);
app.use("/api/messages", messageRouter);
// app.use("/api/users", userRouter);
app.use(errorHandler);
export default app;
