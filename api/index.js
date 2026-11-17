const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const Book = require("./models/Book");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(err.name === "ValidationError" ? 400 : 500).json({ message: err.message });
  });

// ---------- NAME API ----------
app.get("/api/name", wrap(async (req, res) => {
  const user = await User.findOne();
  res.json({ name: user ? user.name : null });
}));

app.post("/api/name", wrap(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
  await User.deleteMany({});
  const user = await User.create({ name });
  res.status(201).json({ message: "Name added successfully", name: user.name });
}));

app.put("/api/name", wrap(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
  const user = await User.findOneAndUpdate({}, { name: name.trim() }, { new: true, upsert: true });
  res.json({ message: "Name updated successfully", name: user.name });
}));

app.delete("/api/name", wrap(async (req, res) => {
  await User.deleteMany({});
  res.json({ message: "Name deleted successfully" });
}));

// ---------- USERS API ----------
app.get("/api/users", wrap(async (req, res) => res.json(await User.find())));

app.post("/api/users", wrap(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ message: "User added successfully", user });
}));

app.put("/api/users/:id", wrap(async (req, res) => {
  const user = isValidId(req.params.id) &&
    (await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User updated successfully", user });
}));

app.delete("/api/users/:id", wrap(async (req, res) => {
  const user = isValidId(req.params.id) && (await User.findByIdAndDelete(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User deleted successfully", user });
}));

// ---------- BOOKS API ----------
app.get("/api/books", wrap(async (req, res) => res.json(await Book.find().sort({ createdAt: 1 }))));

app.get("/api/books/:id", wrap(async (req, res) => {
  const book = isValidId(req.params.id) && (await Book.findById(req.params.id));
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
}));

app.post("/api/books", wrap(async (req, res) => {
  const { title, author, category } = req.body;
  if (!title || !author)
    return res.status(400).json({ message: "Title and author are required" });
  const book = await Book.create({ title, author, category });
  res.status(201).json({ message: "Book added successfully", book });
}));

app.put("/api/books/:id", wrap(async (req, res) => {
  const book = isValidId(req.params.id) &&
    (await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }));
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json({ message: "Book updated successfully", book });
}));

app.delete("/api/books/:id", wrap(async (req, res) => {
  const book = isValidId(req.params.id) && (await Book.findByIdAndDelete(req.params.id));
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json({ message: "Book deleted successfully", book });
}));

// ---------- Connect to MongoDB, then start server ----------
async function seed() {
  if ((await Book.countDocuments()) === 0) {
    await Book.insertMany([
      { title: "JavaScript Basics", author: "John", category: "Education" },
      { title: "Learning React", author: "David", category: "Education" },
    ]);
    console.log("Sample books inserted");
  }
  if ((await User.countDocuments()) === 0) {
    await User.create({ name: "Your Name" }); // <-- apna naam likho
  }
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seed();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });