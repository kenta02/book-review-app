import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import bookRoutes from "./routes/books";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// ルートのインポート
app.use("/api/books", bookRoutes);

export default app;
