import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

// Get all grades
router.get("/", async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        basicSalary: true,
        bonus: true,
        _count: {
          select: { employees: true },
        },
      },
    });

    const formattedGrades = grades.map((grade) => ({
      Grade_Id: grade.id,
      Grade_Name: grade.name,
      Basic_Salary: grade.basicSalary,
      Grade_Bonus: grade.bonus,
      Employee_Count: grade._count.employees,
    }));

    res.json(formattedGrades);
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// Create a new grade
router.post("/", async (req, res) => {
  try {
    const { Grade_Name, Basic_Salary, Grade_Bonus } = req.body;

    if (
      !Grade_Name ||
      Basic_Salary === undefined ||
      Grade_Bonus === undefined
    ) {
      return res.status(400).json({
        error: "Grade_Name, Basic_Salary, and Grade_Bonus are required",
      });
    }

    const salary = parseFloat(Basic_Salary);
    const bonus = parseFloat(Grade_Bonus);

    if (isNaN(salary) || isNaN(bonus) || salary < 0 || bonus < 0) {
      return res.status(400).json({
        error: "Basic_Salary and Grade_Bonus must be valid positive numbers",
      });
    }

    const grade = await prisma.grade.create({
      data: {
        name: Grade_Name,
        basicSalary: salary,
        bonus: bonus,
      },
    });

    // Return in frontend format
    const formattedGrade = {
      Grade_Id: grade.id,
      Grade_Name: grade.name,
      Basic_Salary: grade.basicSalary,
      Grade_Bonus: grade.bonus,
    };

    res.status(201).json(formattedGrade);
  } catch (error) {
    console.error("Error creating grade:", error);
    res.status(500).json({ error: "Failed to create grade" });
  }
});

// Update a grade
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Grade_Name, Basic_Salary, Grade_Bonus } = req.body;

    if (
      !Grade_Name ||
      Basic_Salary === undefined ||
      Grade_Bonus === undefined
    ) {
      return res.status(400).json({
        error: "Grade_Name, Basic_Salary, and Grade_Bonus are required",
      });
    }

    const salary = parseFloat(Basic_Salary);
    const bonus = parseFloat(Grade_Bonus);

    if (isNaN(salary) || isNaN(bonus) || salary < 0 || bonus < 0) {
      return res.status(400).json({
        error: "Basic_Salary and Grade_Bonus must be valid positive numbers",
      });
    }
    const existingGrade = await prisma.grade.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingGrade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    const grade = await prisma.grade.update({
      where: { id: parseInt(id) },
      data: {
        name: Grade_Name,
        basicSalary: salary,
        bonus: bonus,
      },
    });

    const formattedGrade = {
      Grade_Id: grade.id,
      Grade_Name: grade.name,
      Basic_Salary: grade.basicSalary,
      Grade_Bonus: grade.bonus,
    };

    res.json(formattedGrade);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
});

// Delete a grade
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingGrade = await prisma.grade.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!existingGrade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    if (existingGrade._count.employees > 0) {
      return res.status(400).json({
        error: `Cannot delete grade. ${existingGrade._count.employees} employee(s) are assigned to this grade.`,
        employeeCount: existingGrade._count.employees,
      });
    }

    await prisma.grade.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("Error deleting grade:", error);

    // Handle foreign key constraint errors
    if (error.code === "P2003") {
      return res.status(400).json({
        error: "Cannot delete grade. It is referenced by other records.",
      });
    }

    res.status(500).json({ error: "Failed to delete grade" });
  }
});

// Get single grade by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await prisma.grade.findUnique({
      where: { id: parseInt(id) },
      include: {
        employees: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    // Return in frontend format
    const formattedGrade = {
      Grade_Id: grade.id,
      Grade_Name: grade.name,
      Basic_Salary: grade.basicSalary,
      Grade_Bonus: grade.bonus,
      Employees: grade.employees,
    };

    res.json(formattedGrade);
  } catch (error) {
    console.error("Error fetching grade:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
});

export default router;
