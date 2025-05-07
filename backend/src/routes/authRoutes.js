import express from "express";
import {logInUser, logOutUser, onboardUser, signUpUser} from "../controllers/auth.controller.js";
import {protectRoute} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signUpUser);
router.post("/login", logInUser);
router.post("/logout", logOutUser);


// Protected Routes
router.post("/onboarding", protectRoute, onboardUser);

export default router;
