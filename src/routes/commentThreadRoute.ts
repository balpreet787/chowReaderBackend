import { Router } from "express";
import {
  handleCreateCommentThread,
  handleListCommentThreads,
} from "../controllers/commentThreadController";

const router = Router();

router.post("/", handleCreateCommentThread);
router.get("/", handleListCommentThreads);

export default router;
