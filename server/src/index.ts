import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { chatRouter } from "./routes/chat.js";
import { healthRouter } from "./routes/health.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", chatRouter);

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
