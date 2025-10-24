import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

// GET all departments
router.get("/", async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    // Transform to match frontend structure
    const formattedDepartments = departments.map((dept) => ({
      Dept_Id: dept.id,
      Dept_Name: dept.name,
      Total_Employees: dept._count.employees,
    }));

    res.json(formattedDepartments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// POST create new department
router.post("/", async (req, res) => {
  try {
    const { Dept_Name, Total_Employees } = req.body;

    if (!Dept_Name || Dept_Name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }

    const department = await prisma.department.create({
      data: {
        name: Dept_Name,
        // Note: Total_Employees is typically calculated from actual employees
        // If you want to store it directly, add it to your schema
      },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const formattedDepartment = {
      Dept_Id: department.id,
      Dept_Name: department.name,
      Total_Employees: department._count.employees,
    };

    res.json(formattedDepartment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

// PUT update department
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Dept_Name, Total_Employees } = req.body;

    if (!Dept_Name || Dept_Name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }

    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: { name: Dept_Name },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    const formattedDepartment = {
      Dept_Id: department.id,
      Dept_Name: department.name,
      Total_Employees: department._count.employees,
    };

    res.json(formattedDepartment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update department" });
  }
});

// DELETE department
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
