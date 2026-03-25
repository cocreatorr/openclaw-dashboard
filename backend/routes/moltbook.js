// backend/routes/moltbook.js
import express from "express";
import { callMoltbookAPI } from "../services/moltbook.js";

const router = express.Router();

router.post("/moltbook", async (req, res) => {
  const result = await callMoltbookAPI(req.body);

  if (!result.success) {
    return res.status(503).json({ error: result.message });
  }

  res.json(result);
});

export default router;
