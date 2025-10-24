import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.5-flash";

    const prompt = `
You are a MySQL SQL query generator.
Given the following schema:
- User(User_Id, User_Name, E_mail, Password, Role)
- Department(Dept_Id, Dept_Name)
- Grade(Grade_Id, Grade_Name, Basic_Salary, Grade_Bonus)
- Employee(Employee_Id, User_Id, Dept_Id, Grade_Id, Hire_Date)
- Salary(Salary_Id, Employee_Id, Salary, Salary_Date)

Convert the following natural language request into a valid SELECT SQL query.
Return **only the SQL**, no explanations or markdown formatting.

Request: "${query}"
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    //console.log("Gemini response:", JSON.stringify(data, null, 2));

    let sqlQuery = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!sqlQuery) throw new Error("No SQL returned from Gemini");

    sqlQuery = sqlQuery
      .replace(/```sql/gi, "")
      .replace(/```/g, "")
      .replace(/\n/g, " ")
      .trim();

    // 🧨 Safety check (only SELECT)
    if (!/^SELECT/i.test(sqlQuery)) {
      return res.status(400).json({
        error: "Only SELECT queries are allowed",
        sql: sqlQuery,
      });
    }

    //console.log("Executing SQL:", sqlQuery);
    const result = await prisma.$queryRawUnsafe(sqlQuery);

    res.json({ sql: sqlQuery, result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
