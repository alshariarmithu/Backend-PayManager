import express from "express";
import prisma from "../config/client.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();
const toNum = (val) => (typeof val === "bigint" ? Number(val) : val);

//login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

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

// signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingUser] = await prisma.$queryRaw`
      SELECT User_Id AS id
      FROM User
      WHERE E_mail = ${email}
      LIMIT 1;
    `;
    if (existingUser)
      return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$executeRaw`
      INSERT INTO User (User_Name, E_mail, Password, Role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${role || "Employee"});
    `;

    const [newUser] = await prisma.$queryRaw`
      SELECT *
      FROM User
      WHERE User_Id = LAST_INSERT_ID();
    `;

    const token = jwt.sign(
      { id: toNum(newUser.User_Id), email: newUser.E_mail, role: newUser.Role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: toNum(newUser.User_Id),
        name: newUser.User_Name,
        email: newUser.E_mail,
        role: newUser.Role,
      },
      token,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get all users
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

//create user
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingUser] = await prisma.$queryRaw`
      SELECT User_Id AS id
      FROM User
      WHERE E_mail = ${email}
      LIMIT 1;
    `;
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$executeRaw`
      INSERT INTO User (User_Name, E_mail, Password, Role)
      VALUES (${name}, ${email}, ${hashedPassword}, ${role});
    `;

    const [newUser] = await prisma.$queryRaw`
      SELECT *
      FROM User
      WHERE User_Id = LAST_INSERT_ID();
    `;

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: toNum(newUser.User_Id),
        name: newUser.User_Name,
        email: newUser.E_mail,
        role: newUser.Role,
      },
    });
  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//update
router.put("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, password, role } = req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    const [existingUser] = await prisma.$queryRaw`
      SELECT *
      FROM User
      WHERE User_Id = ${userId}
      LIMIT 1;
    `;
    if (!existingUser)
      return res.status(404).json({ message: "User not found" });

    // Check for email
    if (email !== existingUser.E_mail) {
      const [emailExists] = await prisma.$queryRaw`
        SELECT User_Id
        FROM User
        WHERE E_mail = ${email}
        LIMIT 1;
      `;
      if (emailExists)
        return res.status(409).json({ message: "Email already exists" });
    }

    // Hash password
    let sqlUpdate;
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      sqlUpdate = prisma.$executeRaw`
        UPDATE User
        SET User_Name = ${name}, E_mail = ${email}, Role = ${role}, Password = ${hashedPassword}
        WHERE User_Id = ${userId};
      `;
    } else {
      sqlUpdate = prisma.$executeRaw`
        UPDATE User
        SET User_Name = ${name}, E_mail = ${email}, Role = ${role}
        WHERE User_Id = ${userId};
      `;
    }
    await sqlUpdate;

    const [updatedUser] = await prisma.$queryRaw`
      SELECT *
      FROM User
      WHERE User_Id = ${userId}
      LIMIT 1;
    `;

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: toNum(updatedUser.User_Id),
        name: updatedUser.User_Name,
        email: updatedUser.E_mail,
        role: updatedUser.Role,
      },
    });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//delete
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const [user] = await prisma.$queryRaw`
      SELECT *
      FROM User
      WHERE User_Id = ${userId}
      LIMIT 1;
    `;
    if (!user) return res.status(404).json({ message: "User not found" });

    await prisma.$executeRaw`
      DELETE FROM User
      WHERE User_Id = ${userId};
    `;

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
