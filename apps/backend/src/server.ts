import express from "express";

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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});