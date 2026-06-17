const express = require("express");
const router = express.Router();
const multer = require("multer");
const tryOnController = require("../controllers/tryOnController");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/try-on",
  upload.fields([
    { name: "userImage", maxCount: 1 },
    { name: "clothImage", maxCount: 1 },
  ]),
  tryOnController.tryOnClothes
);

module.exports = router;
