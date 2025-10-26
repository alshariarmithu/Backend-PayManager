import express from "express";
import prisma from "../config/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Raw SQL
    const [user] = await prisma.$queryRaw`
      SELECT User_Id AS id, User_Name AS name, E_mail AS email, Password AS password, Role AS role
      FROM User
      WHERE E_mail = ${email}
      LIMIT 1;
    `;

    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: toNum(user.id), role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      user: {
        id: toNum(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //INSERT INTO user (name, email, password, role) VALUES (?, ?, ?, IFNULL(?, 'Employee'));

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "Employee",
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT User_Id AS id, User_Name AS name, E_mail AS email, Role AS role
      FROM User
      ORDER BY User_Id ASC;
    `;

    res.status(200).json(
      users.map((u) => ({
        id: toNum(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
      }))
    );
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const [user] = await prisma.$queryRaw`
      SELECT User_Id AS id, User_Name AS name, E_mail AS email, Role AS role
      FROM User
      WHERE User_Id = ${userId}
      LIMIT 1;
    `;

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      id: toNum(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Get User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    const updateData = { name, email, role };

    // Only update password
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    //console.log("user", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
