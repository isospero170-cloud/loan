require("dotenv").config();

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const { loadDB, saveDB } = require("./db");
const COUNTRIES = require("./public/js/countries.js");

const app = express();
const PORT = process.env.PORT || 3000;
const COUNTRY_NAMES = new Set(COUNTRIES.map((c) => c.name));

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 jours
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "not_authenticated" });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.isAdmin) return res.status(401).json({ error: "not_authorized" });
  next();
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    birthDate: u.birthDate,
    country: u.country,
    currencyCode: u.currencyCode,
    currencySymbol: u.currencySymbol,
    createdAt: u.createdAt
  };
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- Auth : inscription / connexion ----------

app.post("/api/signup", (req, res) => {
  const { email, birthDate, country, password } = req.body || {};

  if (!isValidEmail(email)) return res.status(400).json({ error: "invalid_email" });
  if (!birthDate) return res.status(400).json({ error: "invalid_birth_date" });
  if (!COUNTRY_NAMES.has(country)) return res.status(400).json({ error: "invalid_country" });
  if (!password || password.length < 8) return res.status(400).json({ error: "weak_password" });

  const db = loadDB();
  const emailLower = email.toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === emailLower)) {
    return res.status(409).json({ error: "email_already_used" });
  }

  const countryInfo = COUNTRIES.find((c) => c.name === country);
  const user = {
    id: crypto.randomUUID(),
    email,
    birthDate,
    country,
    currencyCode: countryInfo.currencyCode,
    currencySymbol: countryInfo.symbol,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  saveDB(db);

  req.session.userId = user.id;
  res.json(publicUser(user));
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: "invalid_credentials" });
  }

  const db = loadDB();
  const emailLower = email.toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === emailLower);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  req.session.userId = user.id;
  res.json(publicUser(user));
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get("/api/me", requireAuth, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.session.userId);
  if (!user) return res.status(401).json({ error: "not_authenticated" });
  const loans = db.loans.filter((l) => l.userId === user.id);
  res.json({ user: publicUser(user), loans });
});

// ---------- Formulaire de demande de prêt ----------

app.post("/api/loan", requireAuth, (req, res) => {
  const { firstName, lastName, amount, durationMonths } = req.body || {};

  const amountNum = Number(amount);
  const durationNum = Number(durationMonths);

  if (!firstName || !firstName.trim()) return res.status(400).json({ error: "invalid_first_name" });
  if (!lastName || !lastName.trim()) return res.status(400).json({ error: "invalid_last_name" });
  if (!Number.isFinite(amountNum) || amountNum <= 0) return res.status(400).json({ error: "invalid_amount" });
  if (!Number.isInteger(durationNum) || durationNum <= 0) {
    return res.status(400).json({ error: "invalid_duration" });
  }

  const db = loadDB();
  const loan = {
    id: crypto.randomUUID(),
    userId: req.session.userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    amount: amountNum,
    durationMonths: durationNum,
    createdAt: new Date().toISOString()
  };
  db.loans.push(loan);
  saveDB(db);

  res.json({ success: true, loan });
});

// ---------- Admin ----------

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "admin_password_not_configured" });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "invalid_password" });
  }
  req.session.isAdmin = true;
  res.json({ success: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

app.get("/api/admin/summary", requireAdmin, (req, res) => {
  const db = loadDB();
  const users = db.users
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((u) => ({
      ...publicUser(u),
      loans: db.loans.filter((l) => l.userId === u.id)
    }));

  res.json({
    totalUsers: db.users.length,
    totalLoanRequests: db.loans.length,
    users
  });
});

// Export CSV des e-mails + infos, pratique pour relancer les clients.
app.get("/api/admin/export.csv", requireAdmin, (req, res) => {
  const db = loadDB();
  const rows = [["email", "pays", "devise", "date_naissance", "nom", "prenom", "montant", "duree_mois", "inscrit_le"]];

  db.users.forEach((u) => {
    const loans = db.loans.filter((l) => l.userId === u.id);
    if (loans.length === 0) {
      rows.push([u.email, u.country, u.currencyCode, u.birthDate, "", "", "", "", u.createdAt]);
    } else {
      loans.forEach((l) => {
        rows.push([
          u.email,
          u.country,
          u.currencyCode,
          u.birthDate,
          l.lastName,
          l.firstName,
          l.amount,
          l.durationMonths,
          u.createdAt
        ]);
      });
    }
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=clients.csv");
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
