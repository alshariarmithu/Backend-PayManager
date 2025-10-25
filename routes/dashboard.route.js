import express from "express";
import prisma from "../config/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    //console.log("paichi")
    const totalUsers = await prisma.user.count();
    const totalEmployees = await prisma.employee.count();
    const totalDepartments = await prisma.department.count();

    const totalSalaries = await prisma.salary.aggregate({
      _sum: { salary: true },
    });

    const salariesByDept = await prisma.department.findMany({
      select: {
        name: true,
        employees: {
          select: {
            salaries: {
              select: { salary: true },
            },
          },
        },
      },
    });

    const salaryData = salariesByDept.map((dept) => ({
      name: dept.name,
      value: dept.employees.reduce(
        (sum, emp) =>
          sum + emp.salaries.reduce((sub, sal) => sub + sal.salary, 0),
        0
      ),
    }));

    const employeesByGrade = await prisma.grade.findMany({
      select: {
        name: true,
        employees: {
          select: { id: true },
        },
      },
    });

    const gradeData = employeesByGrade.map((g) => ({
      name: g.name,
      value: g.employees.length,
    }));

    return res.json({
      totalUsers,
      totalEmployees,
      totalDepartments,
      totalSalariesPaid: totalSalaries._sum.salary || 0,
      salariesByDept: salaryData,
      employeesByGrade: gradeData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
