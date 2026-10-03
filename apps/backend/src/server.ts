import express from "express";

import mediaController from "./routes/mediaController.ts"

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "My Library API"
  });
});

app.get("/ping", (_req, res) => {
    res.json(
      { message: "Pong!" })
})

app.use('/media', mediaController)

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});