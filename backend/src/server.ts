import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/api";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`Backend API is running on http://localhost:${port}`);
});
