import express, { Request, Response } from "express";
import healthRoutes from "./routes/healthRoutes";
import userRoutes from "./routes/userRoute";
import bookRoutes from "./routes/bookRoute";
import commentThreadRoutes from "./routes/commentThreadRoute";
import notFound from "./middleware/notFound";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Chow Reader backend API.",
  });
});
app.use("/health", healthRoutes);
app.use("/user", userRoutes);
app.use("/books", bookRoutes);
app.use("/comment-threads", commentThreadRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
