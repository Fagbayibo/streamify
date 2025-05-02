import express from "express";
import "dotenv/config";
import authRoutes from "./routes/authRoutes.js";
import {dbConnect} from "./config/db.js";

const app = express();

// Express Middleware
app.use(express.json());

const PORT = process.env.PORT;

app.use("/api/auth/", authRoutes);
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`Server running on PORT ${PORT}`);
  dbConnect();
  console.log("====================================");
});
