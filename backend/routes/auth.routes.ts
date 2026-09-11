import { Router } from "express";
import {
  register,
  login,
  getMe,
  getTestAccounts,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.get("/test-accounts", getTestAccounts);

export default router;
