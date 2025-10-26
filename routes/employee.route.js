import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

router.get("/", async (req, res) => {
  try {
    const employees = await prisma.$queryRaw`
      SELECT 
        e.Employee_Id AS Employee_Id,
        u.User_Name AS User_Name,
        d.Dept_Name AS Dept_Name,
        g.Grade_Name AS Grade_Name,
        e.Hire_Date AS Hire_Date
      FROM Employee e
      INNER JOIN User u ON e.User_Id = u.User_Id
      INNER JOIN Department d ON e.Dept_Id = d.Dept_Id
      INNER JOIN Grade g ON e.Grade_Id = g.Grade_Id
      ORDER BY e.Employee_Id ASC;
    `;

    const formatted = employees.map((e) => ({
      Employee_Id: toNum(e.Employee_Id),
      User_Name: e.User_Name,
      Dept_Name: e.Dept_Name,
      Grade_Name: e.Grade_Name,
      Hire_Date: e.Hire_Date,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /employees error:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

//create employee
router.post("/", async (req, res) => {
  try {
    const { userId, deptId, gradeId, hireDate } = req.body;

    await prisma.$executeRaw`
      INSERT INTO Employee (User_Id, Dept_Id, Grade_Id, Hire_Date)
      VALUES (${userId}, ${deptId}, ${gradeId}, ${new Date(hireDate)});
    `;

    // Fetch the newly inserted employee
    const [newEmployee] = await prisma.$queryRaw`
      SELECT 
        e.Employee_Id AS Employee_Id,
        e.User_Id AS User_Id,
        e.Dept_Id AS Dept_Id,
        e.Grade_Id AS Grade_Id,
        e.Hire_Date AS Hire_Date
      FROM Employee e
      WHERE e.Employee_Id = LAST_INSERT_ID();
    `;

    res.json({
      Employee_Id: toNum(newEmployee.Employee_Id),
      User_Id: toNum(newEmployee.User_Id),
      Dept_Id: toNum(newEmployee.Dept_Id),
      Grade_Id: toNum(newEmployee.Grade_Id),
      Hire_Date: newEmployee.Hire_Date,
    });
  } catch (error) {
    console.error("POST /employees error:", error);
    res.status(500).json({ error: "Failed to create employee" });
  }
});

//update
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, deptId, gradeId, hireDate } = req.body;

    if (!userId || !deptId || !gradeId || !hireDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await prisma.$executeRaw`
      UPDATE Employee
      SET 
        User_Id = ${userId},
        Dept_Id = ${deptId},
        Grade_Id = ${gradeId},
        Hire_Date = ${new Date(hireDate)}
      WHERE Employee_Id = ${parseInt(id)};
    `;

    // Fetch updated employee with joined info
    const [updatedEmployee] = await prisma.$queryRaw`
      SELECT 
        e.Employee_Id AS Employee_Id,
        u.User_Name AS User_Name,
        d.Dept_Name AS Dept_Name,
        g.Grade_Name AS Grade_Name,
        e.Hire_Date AS Hire_Date
      FROM Employee e
      INNER JOIN User u ON e.User_Id = u.User_Id
      INNER JOIN Department d ON e.Dept_Id = d.Dept_Id
      INNER JOIN Grade g ON e.Grade_Id = g.Grade_Id
      WHERE e.Employee_Id = ${parseInt(id)};
    `;

    res.json({
      Employee_Id: toNum(updatedEmployee.Employee_Id),
      User_Name: updatedEmployee.User_Name,
      Dept_Name: updatedEmployee.Dept_Name,
      Grade_Name: updatedEmployee.Grade_Name,
      Hire_Date: updatedEmployee.Hire_Date,
    });
  } catch (error) {
    console.error("PUT /employees/:id error:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

//delete employee
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.$executeRaw`
      DELETE FROM Employee
      WHERE Employee_Id = ${id};
    `;

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("DELETE /employees error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

//get dept
router.get("/departments", async (req, res) => {
  try {
    const departments = await prisma.$queryRaw`
      SELECT Dept_Id AS id, Dept_Name AS name
      FROM Department
      ORDER BY Dept_Name ASC;
    `;

    const formatted = departments.map((d) => ({
      id: toNum(d.id),
      name: d.name,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /departments error:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

//get grade for dropdown
router.get("/grades", async (req, res) => {
  try {
    const grades = await prisma.$queryRaw`
      SELECT 
        Grade_Id AS id,
        Grade_Name AS name,
        Basic_Salary AS basicSalary,
        Grade_Bonus AS bonus
      FROM Grade
      ORDER BY Grade_Name ASC;
    `;

    const formatted = grades.map((g) => ({
      id: toNum(g.id),
      name: g.name,
      basicSalary: Number(g.basicSalary),
      bonus: Number(g.bonus),
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /grades error:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

//get user with employee role
router.get("/users/employees", async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT 
        User_Id AS id,
        User_Name AS name,
        E_mail AS email
      FROM User
      WHERE Role = 'employee'
      ORDER BY User_Name ASC;
    `;

    const formatted = users.map((u) => ({
      id: toNum(u.id),
      name: u.name,
      email: u.email,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("GET /users/employees error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
