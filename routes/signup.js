//-----------------------------------------------------------------------//
//-------------------------//ROUTE(s) Sign Up//--------------------------//
//-----------------------------------------------------------------------//

const express = require("express");

const router = express.Router();

const User = require("../models/User");

//importation du package permettant de haser nos codes
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//on importe cloudinary
const cloudinary = require("cloudinary").v2;

//-----------------------------------------------------------------------------//
//-----------------// Configuration de cloudinary //--------------------------//
//---------------------------------------------------------------------------//

cloudinary.config({
  cloud_name: "le-r-acteur",
  api_key: "927477243267287",
  api_secret: "KvTumojz0oud0xPSDAtK2Ev7a_I",
});

//-------------------route n°1-----------------//

router.post("/user/signup", async (req, res) => {
  try {
    console.log("la route singup a été sollicitée");
    //on encode notre mot de passe pour éviter que ce dernier ne soit pas utilisable

    let pictureToUpload = req.files.avatar.path;
    const result = await cloudinary.uploader.upload(pictureToUpload);

    const isEmailExisting = await User.findOne({ email: req.fields.email });

    if (req.fields.username) {
      if (isEmailExisting === null) {
        const password = req.fields.password;
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(16);
        //on créait notre base de données
        const newUser = new User({
          account: { username: req.fields.username, avatar: result.url },
          email: req.fields.email,
          salt: salt,
          hash: hash,
          token: token,
        });

        await newUser.save();

        res.json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
            avatar: newUser.account.avatar,
          },
        });
      } else {
        res.status(200).json("ce mail est déjà utilisé");
      }
    } else {
      res.json("vous devez renseigner un nom d'utilisateur");
    }

    // await newUser.save();
    //res.json("votre compte a bien été enregistré");
  } catch (error) {
    console.log({ message: error.message });
  }
});

module.exports = router;
