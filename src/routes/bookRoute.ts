import { Router } from "express";
import {
  addBook,
  getGutenbergDownloadInfo,
  searchGutenbergBooks,
} from "../controllers/bookController";

const router = Router();

router.post("/register", addBook);
router.get("/gutenberg/search", searchGutenbergBooks);
router.get("/gutenberg/download/:gutenbergId", getGutenbergDownloadInfo);

export default router;
