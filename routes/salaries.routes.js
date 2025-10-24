import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany({
      include: { employee: { include: { user: true } } },
    });

    const formatted = salaries.map((s) => ({
      Salary_Id: s.id,
      Employee_Name: s.employee.user.name,
      Salary: s.salary,
      Salary_Date: s.salaryDate,
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch salaries" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, salary, salaryDate } = req.body;
    const newSalary = await prisma.salary.create({
      data: { employeeId, salary, salaryDate: new Date(salaryDate) },
    });
    res.json(newSalary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create salary record" });
  }
});

export default router;
