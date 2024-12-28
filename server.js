const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.set("view engine","ejs")
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database Connection
mongoose
  .connect("mongodb+srv://user1:malafiki@leodb.5mf7q.mongodb.net/?retryWrites=true&w=majority&appName=leodb", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  FirstName: { type: String, required: true },
  LastName: { type: String, required: true },
  UserEmail: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "leomwahalende@gmail.com", // Replace with your email
    pass: "mcgs nqmy munl obrk", // Replace with your app password
  },
});

// Helper: Generate Random Password
const generateRandomPassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Routes

// Home Route
app.get("/", (req, res) => {
  res.render("chandelogin.ejs");
});

// Registration
app.post("/register", async (req, res) => {
  const { FirstName, LastName, UserEmail, Password, ConfirmPassword } = req.body;

  if (Password !== ConfirmPassword) {
    return res.send("Passwords do not match!");
  }

  try {
    const hashedPassword = await bcrypt.hash(Password, 10);

    const newUser = new User({
      FirstName,
      LastName,
      UserEmail,
      Password: hashedPassword,
    });

    await newUser.save();

    const mailOptions = {
      from: "leomwahalende@gmail.com",
      to: UserEmail,
      subject: "Welcome to Our Platform",
      text: `Hi ${FirstName},\n\nThank you for registering at Leo Mwahalende's site!`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return res.send("Registration successful, but email could not be sent.");
      res.render("login.ejs",{text: "registration  successful check your email or login to continue"});
    });
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

// Login
app.post("/login", async (req, res) => {
  const { UserEmail, Password } = req.body;

  try {
    const user = await User.findOne({ UserEmail });
    if (!user) return res.send("Email not found.");

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) return res.status(500).send("Invalid password.");

    //res.send(`Welcome back, ${user.FirstName}!`);
    res.render("leoapp.ejs");
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
  const { UserEmail } = req.body;

  try {
    const user = await User.findOne({ UserEmail });
    if (!user) return res.send("Email not found.");

    const newPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.Password = hashedPassword;
    await user.save();

    const mailOptions = {
      from: "leomwahalende@gmail.com",
      to: UserEmail,
      subject: "Password Reset",
      text: `Hi ${user.FirstName},\n\nYour new password is: ${newPassword}\n\nPlease change it after logging in.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return res.send("Password reset, but email could not be sent.");
      res.render("passlog.ejs",{texts:"login with your new password or change password for your security !"});
    });
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

// Change Password
app.post("/change-password", async (req, res) => {
  const { UserEmail, OldPassword, NewPassword, ConfirmNewPassword } = req.body;

  if (NewPassword !== ConfirmNewPassword) {
    return res.status(500).send("New passwords do not match!");
  }

  try {
    const user = await User.findOne({ UserEmail });
    if (!user) return res.send("Email not found.");

    const isMatch = await bcrypt.compare(OldPassword, user.Password);
    if (!isMatch) return res.send("Incorrect current password.");

    const hashedPassword = await bcrypt.hash(NewPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    const mailOptions = {
      from: "leomwahalende@gmail.com",
      to: UserEmail,
      subject: "Password Changed Successfully",
      text: `Hi ${user.FirstName},\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact support immediately.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) return res.send("Password changed, but email could not be sent.");
      res.render("chandelogin.ejs",{textd:"Password changed successfully! A confirmation email has been sent.\n login now!"});
    });
  } catch (err) {
    res.send(`Error: ${err.message}`);
  }
});

// Serve HTML Files
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public", "register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public", "login.html")));
app.get("/forgot-password", (req, res) => res.sendFile(path.join(__dirname, "public", "forgot-password.html")));
app.get("/change-password", (req, res) => res.sendFile(path.join(__dirname, "public", "change-password.html")));

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
