//-----------------------------------------------------------------------//
//-------------------------//ROUTE(s) Login -//--------------------------//
//-----------------------------------------------------------------------//

const express = require("express");

const router = express.Router();

const User = require("../models/User");

//importation du package permettant de haser nos codes
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//-------------------route n°2-----------------//

router.post("/user/login", async (req, res) => {
  console.log("la route login a été sollicité");

  const isEmailExisting = await User.findOne({ email: req.fields.email });

  try {
    if (isEmailExisting && req.fields.password) {
      const existingHASH = isEmailExisting.hash;
      const existingSALT = isEmailExisting.salt;
      const password = req.fields.password;

      const newhash = SHA256(password + existingSALT).toString(encBase64);

      if (existingHASH === newhash) {
        res.json({
          _id: isEmailExisting._id,
          token: isEmailExisting.token,
          account: {
            username: isEmailExisting.account.username,
          },
        });
      }
    } else {
      res.status(400).json({
        message:
          "vous devez créer un compte car votre mail ou votre password n'existe pas",
      });
    }

    res.json("vous avez sollicité cette route");
  } catch (error) {
    console.log({ message: error.message });
  }
});

module.exports = router;
