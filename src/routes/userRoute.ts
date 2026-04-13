import { Router } from "express";
import { handleCreateUser } from "../controllers/userController";

const router = Router();

router.post("/", handleCreateUser);

export default router;