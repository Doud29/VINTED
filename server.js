//-----------------------------------------------------------------------//
//-----------------------//On importe nos packages//---------------------//
//-----------------------------------------------------------------------//

//express [serveur]
const express = require("express");
const app = express();
//Formidable [lecture des paramètres de types Body]
const formidable = require("express-formidable");
//Formidable [Base de données]
const mongoose = require("mongoose");
//Cloundinary  [Base de données photo]
const cloudinary = require("cloudinary").v2;

require("dotenv").config();

app.use(formidable());

// mongoose.connect permet ici de se connecter à la base de données locale nommée "vinted"
mongoose.connect(process.env.MONGODB_URI);

//-----------------------------------------------------------------------//
//---------------------//Importation des routes //-----------------------//
//-----------------------------------------------------------------------//

const signupRoutes = require("./routes/signup");
app.use(signupRoutes);

const loginRoutes = require("./routes/login");
app.use(loginRoutes);

const publishRoutes = require("./routes/publish");
app.use(publishRoutes);

//-----------------------------------------------------------------------//
//--------/fonction signalement si une page est un trouvable//-----------//
//-----------------------------------------------------------------------//

app.all("*", (req, res) => {
  res.status(404).send("Page introuvable");
});

//-----------------------------------------------------------------------//
//-----------------------//On lance le serveur //------------------------//
//-----------------------------------------------------------------------//

app.listen(process.env.PORT, () => {
  console.log("Serveur en cours de fonctionnement");
});
