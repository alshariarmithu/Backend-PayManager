import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

//type casting
const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

router.get("/", async (req, res) => {
  try {
    const departments = await prisma.$queryRaw`
      SELECT 
        d.Dept_Id AS Dept_Id,
        d.Dept_Name AS Dept_Name,
        COUNT(e.Employee_Id) AS Total_Employees
      FROM Department d
      LEFT JOIN Employee e ON e.Dept_Id = d.Dept_Id
      GROUP BY d.Dept_Id, d.Dept_Name
      ORDER BY d.Dept_Id ASC;
    `;

    const formatted = departments.map((d) => ({
      Dept_Id: toNum(d.Dept_Id),
      Dept_Name: d.Dept_Name,
      Total_Employees: toNum(d.Total_Employees),
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

//create dept
router.post("/", async (req, res) => {
  try {
    const { Dept_Name } = req.body;

    if (!Dept_Name || Dept_Name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }

    const result = await prisma.$executeRaw`
      INSERT INTO Department (Dept_Name)
      VALUES (${Dept_Name});
    `;

    const [newDept] = await prisma.$queryRaw`
      SELECT 
        d.Dept_Id AS Dept_Id,
        d.Dept_Name AS Dept_Name,
        COUNT(e.Employee_Id) AS Total_Employees
      FROM Department d
      LEFT JOIN Employee e ON e.Dept_Id = d.Dept_Id
      WHERE d.Dept_Id = LAST_INSERT_ID()
      GROUP BY d.Dept_Id, d.Dept_Name;
    `;

    const formatted = {
      Dept_Id: toNum(newDept.Dept_Id),
      Dept_Name: newDept.Dept_Name,
      Total_Employees: toNum(newDept.Total_Employees),
    };

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

//update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Dept_Name } = req.body;

    if (!Dept_Name || Dept_Name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }

    // Update the department
    await prisma.$executeRaw`
      UPDATE Department
      SET Dept_Name = ${Dept_Name}
      WHERE Dept_Id = ${parseInt(id)};
    `;

    // Fetch updated department with employee count
    const [updatedDept] = await prisma.$queryRaw`
      SELECT 
        d.Dept_Id AS Dept_Id,
        d.Dept_Name AS Dept_Name,
        COUNT(e.Employee_Id) AS Total_Employees
      FROM Department d
      LEFT JOIN Employee e ON e.Dept_Id = d.Dept_Id
      WHERE d.Dept_Id = ${parseInt(id)}
      GROUP BY d.Dept_Id, d.Dept_Name;
    `;

    const formatted = {
      Dept_Id: toNum(updatedDept.Dept_Id),
      Dept_Name: updatedDept.Dept_Name,
      Total_Employees: toNum(updatedDept.Total_Employees),
    };

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update department" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$executeRaw`
      DELETE FROM Department
      WHERE Dept_Id = ${parseInt(id)};
    `;

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
