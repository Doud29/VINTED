//-----------------------------------------------------------------------//
//-------------------------//ROUTE(s) publish //-------------------------//
//-----------------------------------------------------------------------//

const express = require("express");

const router = express.Router();

const Offer = require("../models/Offer");

const mongoose = require("mongoose");

const User = require("../models/User");
const res = require("express/lib/response");
const { count } = require("../models/Offer");

const cloudinary = require("cloudinary").v2;

//---------------------------------------------------------------------------------//
//---------------// Construction de fonction middleWare [filtre] //---------------//
//-------------------------------------------------------------------------------//

//cette fonction permet de faire filtre quand à la requête du client. cela nous permet aussi de récupérer le profil du user dans ce cas.
const isAuthenticated = async (req, res, next) => {
  //on vérifier qu'un Token est présent dans la demande du client
  if (req.headers.authorization) {
    //on vient récupérer la valeur de notre token
    const token = req.headers.authorization.replace("Bearer ", "");
    //on va chercher dans notre base de données si il il exite un token similaire
    const isTokenValid = await User.findOne({ token });

    //on vient vérifier si il nous trouve dans notre base de données un utilisateur correspondant au token fourni
    if (isTokenValid) {
      //On définie un objet qui récupérera le porfil dans notre base de données
      req.user = isTokenValid;
      return next();
    } else {
      return res.status(401).json({ error: "unauthorized" });
    }
  } else {
    return res.status(401).json({ error: "unauthorized" });
  }
  //const token = req.headers.authorization.replace("Bearer ", "");
};

//---------------------------------------------------------------------------//
//-----------------// Configuration de cloudinary //-------------------------//
//---------------------------------------------------------------------------//

cloudinary.config({
  cloud_name: "le-r-acteur",
  api_key: "927477243267287",
  api_secret: "KvTumojz0oud0xPSDAtK2Ev7a_I",
});
//----------------------------------------------------------------------//
//--------------------------// route n°3 //-----------------------------//
//----------------------------------------------------------------------//

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  //console.log("ma route offer a bien été sollicitée");

  try {
    //on peut maintenant utiliser ce package pour envoyer des fichiers et récupérer l'image (sous forme d'objet de donnés)
    //on récupère la photo de la requête client
    let pictureToUpload = req.files.picture.path;
    //on upload notre photo dans cloudinary
    const result = await cloudinary.uploader.upload(pictureToUpload, {
      //on demande à Cloudinary de créer un dossier au monent de l'import de la photo.
      folder: "vinted/offers",
      public_id: `${req.fields.title}`,
    });

    // on créeait une constante pour venir chercher la longueur de notre titre
    const isTitleEnoughBig = req.fields.title;

    // on créeait une constante pour venir chercher la longueur de notre description
    const isDescriptiveIsBigEnough = req.fields.description;

    // on créeait une constante pour comparer le prix limite au prix annoncé par le client
    const isPriceIsBigEnough = req.fields.price;

    if (
      //condition pour vérifier que l'annonce corresponde bien à aux critères de vente.
      isTitleEnoughBig.length < 50 &&
      isDescriptiveIsBigEnough.length < 500 &&
      isPriceIsBigEnough < 100000
    ) {
      //creéation de l'offre
      const newOffer = new Offer({
        product_name: isTitleEnoughBig,
        product_description: isDescriptiveIsBigEnough,
        product_price: isPriceIsBigEnough,
        product_details: [
          { marque: req.fields.brand },
          { Taille: req.fields.size },
          { Etat: req.fields.condition },
          { Couleur: req.fields.color },
          { Emplacement: req.fields.city },
        ],
        owner: req.user,
        product_image: result.url,
      });

      await newOffer.save();

      res.json({
        _id: newOffer._id,
        product_name: newOffer.product_name,
        product_description: newOffer.product_description,
        product_price: newOffer.product_price,
        product_details: newOffer.product_details,
        owner: req.user.account.username,
        avatar: req.user.account.avatar,
        product_image: newOffer.product_image,
      });
    } else {
      res.status(400).json({
        message:
          "soit titre est trop long [moins de 50 caractères] soit votre description est trop longue [moins de 500 caractères], soit le prix [<100000]",
      });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

//-----------------------------------------------------------------------//
//-----------------//ROUTE(s) modification publish //--------------------//
//-----------------------------------------------------------------------//

// router.put("/update/publish/", async (req, res) => {
//   console.log(req.params);
//   console.log(req.fields);

//   try {
//     let pictureToUploadAndUpdate = req.files.picture.path;

//     const result = await cloudinary.uploader.upload(pictureToUploadAndUpdate);

//     const offerToupdate = await Offer.findById({ id: req.fields._id });

//     offerToupdate.product_details[0].marque = req.fields.brand;
//     offerToupdate.product_details[1].Taille = req.fields.size;
//     offerToupdate.product_details[2].Etat = req.fields.condition;
//     offerToupdate.product_details[3].Couleur = req.fields.brand;
//     offerToupdate.product_details[4].Emplacement = req.fields.city;
//     offerToupdate.product_image = result.product_image;
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

//-----------------------------------------------------------------------//
//----------------//ROUTE(s) filtrer nos recherches //-------------------//
//-----------------------------------------------------------------------//

router.get("/filters", async (req, res) => {
  let title = req.query.title;
  let priceMin = req.query.priceMin;
  let priceMax = req.query.priceMax;
  let sort = req.query.sort;
  const count = await Offer.countDocuments();
  let limit = 2;
  let page = req.query.page;
  let skip = limit * (page - 1);

  if (title) {
  } else {
    title = "";
  }

  if (priceMin) {
  } else {
    priceMin = 0;
  }

  if (priceMax) {
  } else {
    priceMax = 200000;
  }

  if (req.query.page) {
    skip;
  } else {
    skip = 0;
  }

  if (sort === "price-desc") {
    sort = -1;
  } else if (sort === "price-asc") {
    sort = 1;
  } else {
    sort = 1;
  }

  const offers = await Offer.find({
    product_name: new RegExp(title, "i"),
    product_price: { $gte: priceMin, $lte: priceMax },
  })
    .sort({ product_price: sort })
    .select("product_name product_description product_price")
    .limit(limit)
    .skip(skip);
  res.json({ count: count, offers });
});

//demande n°3
// const offers = await Offer.find({
//   product_name: new RegExp("pantalon", "i"),
// });
// res.json({ offers });

//demande n°4
// const offers = await Offer.find({
//   product_name: new RegExp("pantalon", "i"),
//   product_price: { $lte: 100 },
// }).select("product_name product_description product_price");
// res.json({ offers });

//demande n°5
//   const offers = await Offer.find({
//     product_name: new RegExp("pantalon", "i"),
//     product_price: { $gte: 40, $lte: 600 },
//   }).select("product_name product_description product_price");
//   res.json({ offers });
// });

//demande n°6
//   const offers = await Offer.find({
//     product_price: { $gte: 10, $lte: 5000 },
//   }).select("product_name product_description product_price");
//   res.json({ offers });
// });

//demande n°7
//   const offers = await Offer.find({
//     product_price: { $gte: 10, $lte: 5000 },
//   }).select("product_name product_description product_price");
//   res.json({ offers });
// });

//demande n°8 Ordre Croissant
//   const offers = await Offer.find()
//     .sort({ product_price: 1 })
//     .select("product_name product_description product_price");
//   res.json({ offers });
// });

//demande n°9 Ordre décroissant
// const offers = await Offer.find()
//   .sort({ product_price: -1 })
//   .select("product_name product_description product_price");
//res.json({ offers });
//------------------------------------------------------------------------//
//------------------------// on exporte les routes //--------------------//
//----------------------------------------------------------------------//

module.exports = router;
