import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

router.get("/", async (req, res) => {
  try {
    const grades = await prisma.$queryRaw`
      SELECT 
        g.Grade_Id,
        g.Grade_Name,
        g.Basic_Salary,
        g.Grade_Bonus,
        COUNT(e.Employee_Id) AS Employee_Count
      FROM Grade g
      LEFT JOIN Employee e ON g.Grade_Id = e.Grade_Id
      GROUP BY g.Grade_Id, g.Grade_Name, g.Basic_Salary, g.Grade_Bonus
      ORDER BY g.Grade_Id ASC;
    `;

    const formattedGrades = grades.map((g) => ({
      Grade_Id: toNum(g.Grade_Id),
      Grade_Name: g.Grade_Name,
      Basic_Salary: Number(g.Basic_Salary),
      Grade_Bonus: Number(g.Grade_Bonus),
      Employee_Count: Number(g.Employee_Count),
    }));

    res.json(formattedGrades);
  } catch (error) {
    console.error("GET /grades error:", error);
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
      return res
        .status(400)
        .json({
          error: "Grade_Name, Basic_Salary, and Grade_Bonus are required",
        });
    }

    const salary = parseFloat(Basic_Salary);
    const bonus = parseFloat(Grade_Bonus);

    if (isNaN(salary) || isNaN(bonus) || salary < 0 || bonus < 0) {
      return res
        .status(400)
        .json({
          error: "Basic_Salary and Grade_Bonus must be valid positive numbers",
        });
    }

    // Insert grade
    await prisma.$executeRaw`
      INSERT INTO Grade (Grade_Name, Basic_Salary, Grade_Bonus)
      VALUES (${Grade_Name}, ${salary}, ${bonus});
    `;

    // Fetch newly created grade
    const [newGrade] = await prisma.$queryRaw`
      SELECT *
      FROM Grade
      WHERE Grade_Id = LAST_INSERT_ID();
    `;

    res.status(201).json({
      Grade_Id: toNum(newGrade.Grade_Id),
      Grade_Name: newGrade.Grade_Name,
      Basic_Salary: Number(newGrade.Basic_Salary),
      Grade_Bonus: Number(newGrade.Grade_Bonus),
    });
  } catch (error) {
    console.error("POST /grades error:", error);
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
      return res
        .status(400)
        .json({
          error: "Grade_Name, Basic_Salary, and Grade_Bonus are required",
        });
    }

    const salary = parseFloat(Basic_Salary);
    const bonus = parseFloat(Grade_Bonus);

    if (isNaN(salary) || isNaN(bonus) || salary < 0 || bonus < 0) {
      return res
        .status(400)
        .json({
          error: "Basic_Salary and Grade_Bonus must be valid positive numbers",
        });
    }

    // Check if grade exists
    const [existingGrade] = await prisma.$queryRaw`
      SELECT *
      FROM Grade
      WHERE Grade_Id = ${parseInt(id)};
    `;

    if (!existingGrade) {
      return res.status(404).json({ error: "Grade not found" });
    }

    // Update grade
    await prisma.$executeRaw`
      UPDATE Grade
      SET Grade_Name = ${Grade_Name}, Basic_Salary = ${salary}, Grade_Bonus = ${bonus}
      WHERE Grade_Id = ${parseInt(id)};
    `;

    const [updatedGrade] = await prisma.$queryRaw`
      SELECT *
      FROM Grade
      WHERE Grade_Id = ${parseInt(id)};
    `;

    res.json({
      Grade_Id: toNum(updatedGrade.Grade_Id),
      Grade_Name: updatedGrade.Grade_Name,
      Basic_Salary: Number(updatedGrade.Basic_Salary),
      Grade_Bonus: Number(updatedGrade.Grade_Bonus),
    });
  } catch (error) {
    console.error("PUT /grades/:id error:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
});

// Delete a grade
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check employees assigned to this grade
    const [countResult] = await prisma.$queryRaw`
      SELECT COUNT(*) AS Employee_Count
      FROM Employee
      WHERE Grade_Id = ${parseInt(id)};
    `;

    if (countResult.Employee_Count > 0) {
      return res.status(400).json({
        error: `Cannot delete grade. ${countResult.Employee_Count} employee(s) are assigned to this grade.`,
        employeeCount: Number(countResult.Employee_Count),
      });
    }

    // Delete grade
    await prisma.$executeRaw`
      DELETE FROM Grade
      WHERE Grade_Id = ${parseInt(id)};
    `;

    res.json({ message: "Grade deleted successfully" });
  } catch (error) {
    console.error("DELETE /grades/:id error:", error);
    res.status(500).json({ error: "Failed to delete grade" });
  }
});

// Get a single grade with employees
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const gradeWithEmployees = await prisma.$queryRaw`
      SELECT 
        g.Grade_Id,
        g.Grade_Name,
        g.Basic_Salary,
        g.Grade_Bonus,
        e.Employee_Id,
        u.User_Name,
        u.E_mail
      FROM Grade g
      LEFT JOIN Employee e ON g.Grade_Id = e.Grade_Id
      LEFT JOIN User u ON e.User_Id = u.User_Id
      WHERE g.Grade_Id = ${parseInt(id)}
      ORDER BY e.Employee_Id ASC;
    `;

    if (!gradeWithEmployees || gradeWithEmployees.length === 0) {
      return res.status(404).json({ error: "Grade not found" });
    }

    // Format grade info
    const grade = {
      Grade_Id: toNum(gradeWithEmployees[0].Grade_Id),
      Grade_Name: gradeWithEmployees[0].Grade_Name,
      Basic_Salary: Number(gradeWithEmployees[0].Basic_Salary),
      Grade_Bonus: Number(gradeWithEmployees[0].Grade_Bonus),
      Employees: gradeWithEmployees
        .filter((e) => e.Employee_Id !== null)
        .map((e) => ({
          Employee_Id: toNum(e.Employee_Id),
          User_Name: e.User_Name,
          E_mail: e.E_mail,
        })),
    };

    res.json(grade);
  } catch (error) {
    console.error("GET /grades/:id error:", error);
    res.status(500).json({ error: "Failed to fetch grade" });
  }
});

export default router;
