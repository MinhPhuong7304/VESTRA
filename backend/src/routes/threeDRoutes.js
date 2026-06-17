const express = require("express");
const router = express.Router();
const threeDController = require("../controllers/threeDController");

router.post("/3d-avatar", threeDController.generate3DAvatar);

module.exports = router;
