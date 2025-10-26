import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const totalUsers = await prisma.$queryRaw`
      SELECT COUNT(*) AS totalUsers FROM User;
    `;
    const totalEmployees = await prisma.$queryRaw`
      SELECT COUNT(*) AS totalEmployees FROM Employee;
    `;
    const totalDepartments = await prisma.$queryRaw`
      SELECT COUNT(*) AS totalDepartments FROM Department;
    `;
    const totalSalaries = await prisma.$queryRaw`
      SELECT SUM(Salary) AS totalSalariesPaid FROM Salary;
    `;
    const salariesByDept = await prisma.$queryRaw`
      SELECT 
        d.Dept_Name AS name,
        COALESCE(SUM(s.Salary), 0) AS value
      FROM Department d
      LEFT JOIN Employee e ON e.Dept_Id = d.Dept_Id
      LEFT JOIN Salary s ON s.Employee_Id = e.Employee_Id
      GROUP BY d.Dept_Name;
    `;
    const employeesByGrade = await prisma.$queryRaw`
      SELECT 
        g.Grade_Name AS name,
        COUNT(e.Employee_Id) AS value
      FROM Grade g
      LEFT JOIN Employee e ON e.Grade_Id = g.Grade_Id
      GROUP BY g.Grade_Name;
    `;

    const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

    return res.json({
      totalUsers: toNum(totalUsers[0]?.totalUsers) || 0,
      totalEmployees: toNum(totalEmployees[0]?.totalEmployees) || 0,
      totalDepartments: toNum(totalDepartments[0]?.totalDepartments) || 0,
      totalSalariesPaid: toNum(totalSalaries[0]?.totalSalariesPaid) || 0,
      salariesByDept: salariesByDept.map((row) => ({
        name: row.name,
        value: toNum(row.value),
      })),
      employeesByGrade: employeesByGrade.map((row) => ({
        name: row.name,
        value: toNum(row.value),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
