require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("../models");

const userRoutes = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Pathordinator API",
    status: "running"
  });
});

app.use("/users", userRoutes);

const PORT = Number(process.env.PORT) || 8080;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected.");
  } catch (error) {
    console.error("DB connection failed. Starting API without database access:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
