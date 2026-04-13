import { Request, Response } from "express";

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "Chow Reader backend is running.",
    environment: process.env.NODE_ENV || "development",
  });
};
