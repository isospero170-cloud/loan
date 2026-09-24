<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Créer un compte</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body class="page">
  <div class="topbar">
    <div class="brand">Votre <span>Prêt</span></div>
  </div>

  <div class="wrap">
    <div class="card">
      <h1>Créer votre compte</h1>
      <p class="lead">Renseignez vos informations pour démarrer votre demande de prêt.</p>

      <form id="signup-form">
        <label for="email">Adresse e-mail</label>
        <input type="email" id="email" required autocomplete="email">

        <label for="birthDate">Date de naissance</label>
        <input type="date" id="birthDate" required autocomplete="bday">

        <label for="country">Pays</label>
        <input type="text" id="country" list="country-list" required autocomplete="off" placeholder="Commencez à taper…">
        <datalist id="country-list"></datalist>

        <label for="password">Mot de passe</label>
        <input type="password" id="password" required minlength="8" autocomplete="new-password" placeholder="8 caractères minimum">

        <div id="msg" class="msg"></div>

        <button type="submit" class="btn-primary" id="submit-btn">Créer mon compte</button>
      </form>

      <div class="switch-link">
        Vous avez déjà un compte ? <a href="/login.html">Se connecter</a>
      </div>
    </div>
  </div>

  <script src="/js/countries.js"></script>
  <script>
    const list = document.getElementById("country-list");
    COUNTRIES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.name;
      list.appendChild(opt);
    });

    const form = document.getElementById("signup-form");
    const msg = document.getElementById("msg");
    const submitBtn = document.getElementById("submit-btn");

    const errors = {
      invalid_email: "Adresse e-mail invalide.",
      invalid_birth_date: "Merci d'indiquer votre date de naissance.",
      invalid_country: "Merci de choisir un pays dans la liste proposée.",
      weak_password: "Le mot de passe doit contenir au moins 8 caractères.",
      email_already_used: "Un compte existe déjà avec cet e-mail."
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.className = "msg";
      msg.textContent = "";
      submitBtn.disabled = true;

      const country = document.getElementById("country").value;
      const isValidCountry = COUNTRIES.some((c) => c.name === country);
      if (!isValidCountry) {
        msg.className = "msg error";
        msg.textContent = "Merci de sélectionner un pays dans la liste proposée.";
        submitBtn.disabled = false;
        return;
      }

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: document.getElementById("email").value.trim(),
            birthDate: document.getElementById("birthDate").value,
            country,
            password: document.getElementById("password").value
          })
        });
        const data = await res.json();

        if (!res.ok) {
          msg.className = "msg error";
          msg.textContent = errors[data.error] || "Une erreur est survenue. Réessayez.";
          submitBtn.disabled = false;
          return;
        }

        window.location.href = "/form.html";
      } catch (err) {
        msg.className = "msg error";
        msg.textContent = "Impossible de contacter le serveur. Réessayez.";
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>
