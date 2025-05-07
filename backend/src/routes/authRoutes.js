import express from "express";
import {logInUser, logOutUser, onboardUser, signUpUser} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUpUser);
router.post("/login", logInUser);
router.post("/logout", logOutUser);

router.post("/onboarding", onboardUser);

export default router;
