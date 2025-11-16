import express from "express";
import { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

export default app;
