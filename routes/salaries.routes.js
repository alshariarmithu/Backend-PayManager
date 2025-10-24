import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

// GET all salaries
router.get("/", async (req, res) => {
  try {
    const salaries = await prisma.salary.findMany({
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    const formattedSalaries = salaries.map((salary) => ({
      Salary_Id: `SAL${String(salary.id).padStart(3, "0")}`,
      Employee_Name: salary.employee.user.name,
      Salary: salary.salary,
      Pay_Date: salary.salaryDate.toISOString().split("T")[0],
    }));

    res.json(formattedSalaries);
  } catch (error) {
    console.error("Error fetching salaries:", error);
    res.status(500).json({ error: "Failed to fetch salaries" });
  }
});

// GET all employees (for dropdown)
router.get("/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: true,
      },
    });

    const formattedEmployees = employees.map((employee) => ({
      id: employee.id,
      name: employee.user.name,
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// POST create new salary
router.post("/", async (req, res) => {
  try {
    const { Employee_Name, Salary, Pay_Date } = req.body;

    const user = await prisma.user.findFirst({
      where: { name: Employee_Name },
    });

    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee record not found" });
    }

    const newSalary = await prisma.salary.create({
      data: {
        employeeId: employee.id,
        salary: parseFloat(Salary),
        salaryDate: new Date(Pay_Date),
      },
    });

    const formattedSalary = {
      Salary_Id: `SAL${String(newSalary.id).padStart(3, "0")}`,
      Employee_Name: Employee_Name,
      Salary: parseFloat(Salary),
      Pay_Date: Pay_Date,
    };

    res.json(formattedSalary);
  } catch (error) {
    console.error("Error creating salary:", error);
    res.status(500).json({ error: "Failed to create salary record" });
  }
});

// PUT update salary
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Employee_Name, Salary, Pay_Date } = req.body;

    const salaryId = parseInt(id.replace("SAL", ""));

    const user = await prisma.user.findFirst({
      where: { name: Employee_Name },
    });

    if (!user) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });

    if (!employee) {
      return res.status(404).json({ error: "Employee record not found" });
    }

    const updatedSalary = await prisma.salary.update({
      where: { id: salaryId },
      data: {
        employeeId: employee.id,
        salary: parseFloat(Salary),
        salaryDate: new Date(Pay_Date),
      },
    });

    const formattedSalary = {
      Salary_Id: `SAL${String(updatedSalary.id).padStart(3, "0")}`,
      Employee_Name: Employee_Name,
      Salary: parseFloat(Salary),
      Pay_Date: Pay_Date,
    };

    res.json(formattedSalary);
  } catch (error) {
    console.error("Error updating salary:", error);
    res.status(500).json({ error: "Failed to update salary record" });
  }
});

// DELETE salary
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const salaryId = parseInt(id.replace("SAL", ""));

    await prisma.salary.delete({
      where: { id: salaryId },
    });

    res.json({ message: "Salary record deleted successfully" });
  } catch (error) {
    console.error("Error deleting salary:", error);
    res.status(500).json({ error: "Failed to delete salary record" });
  }
});

export default router;
