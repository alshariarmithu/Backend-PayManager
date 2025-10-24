import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import employeesRoutes from "./routes/employee.route.js";
import departmentsRoutes from "./routes/departments.routes.js";
import gradesRoutes from "./routes/grades.routes.js";
import salariesRoutes from "./routes/salaries.routes.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import nlqueryRoutes from "./routes/nlquery.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/salaries", salariesRoutes);
app.use("/api/nlquery", nlqueryRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
