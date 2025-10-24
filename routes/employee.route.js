import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
        department: true,
        grade: true,
      },
    });

    const formatted = employees.map((e) => ({
      Employee_Id: e.id,
      User_Name: e.user.name,
      Dept_Name: e.department.name,
      Grade_Name: e.grade.name,
      Hire_Date: e.hireDate,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /employees error:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// POST create employee
router.post("/", async (req, res) => {
  try {
    const { userId, deptId, gradeId, hireDate } = req.body;
    const newEmployee = await prisma.employee.create({
      data: { userId, deptId, gradeId, hireDate: new Date(hireDate) },
    });
    res.json(newEmployee);
  } catch (error) {
    console.error("POST /employees error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// DELETE employee by id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.employee.delete({ where: { id } });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("DELETE /employees error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
