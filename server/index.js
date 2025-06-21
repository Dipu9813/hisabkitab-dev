// Load environment variables from .env file
require("dotenv").config();

// Check if .env file is loaded
if (!process.env.SUPABASE_URL) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "ERROR: .env file not found or not properly loaded."
  );
  console.error(
    "\x1b[33m%s\x1b[0m",
    "Please create a .env file based on the .env.example template."
  );
  process.exit(1);
}

console.log(
  "\x1b[36m%s\x1b[0m",
  "🔑 Environment variables loaded from .env file"
);
console.log(
  "\x1b[36m%s\x1b[0m",
  "📝 Note: For full functionality, ensure you have added your Supabase service role key in the .env file."
);

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected");
const profileRoutes = require("./routes/profile");
const lendRoutes = require("./routes/lend");
const usersRoutes = require("./routes/users");
const groupsRoutes = require("./routes/groups");
const expensesRoutes = require("./routes/expenses");
const businessRoutes = require("./routes/business");

const app = express();
app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use("/", authRoutes);
app.use("/", protectedRoutes);
app.use("/", profileRoutes);
app.use("/", lendRoutes);
app.use("/", usersRoutes);
app.use("/", groupsRoutes);
app.use("/", expensesRoutes);
app.use("/", businessRoutes);

// Global error handler to always return JSON
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\x1b[32m%s\x1b[0m", `✓ Server running on port ${PORT}`);
  console.log("\x1b[32m%s\x1b[0m", "✓ API endpoints available at:");
  console.log("\x1b[36m%s\x1b[0m", `  - http://localhost:${PORT}/profile`);
  console.log("\x1b[36m%s\x1b[0m", `  - http://localhost:${PORT}/loans`);
  console.log("\x1b[36m%s\x1b[0m", `  - http://localhost:${PORT}/users`);
});
