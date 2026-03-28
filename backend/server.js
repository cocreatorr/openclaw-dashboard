import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import moltbookRouter from "./routes/moltbook.js";

const app = express();
app.use(cors());
app.use(express.json());

// Mount Moltbook route
app.use("/api", moltbookRouter);

let agents = {};

function timestamp() {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// --- Agent management routes ---
app.post("/agent", (req, res) => {
  const { name, mode, config } = req.body;
  agents[name] = {
    name,
    mode,
    config: config || { role: "generic", schedule: "manual" },
    logs: []
  };
  agents[name].logs.push(`[${timestamp()}] Agent ${name} created`);
  res.json({ status: "Agent created", agent: agents[name] });
});

app.get("/agents", (req, res) => {
  res.json({ agents });
});

app.delete("/agent/:name", (req, res) => {
  const { name } = req.params;
  if (agents[name]) {
    agents[name].logs.push(`[${timestamp()}] Agent ${name} deleted`);
    delete agents[name];
    res.json({ status: `Agent ${name} deleted` });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
});

app.get("/agent/:name/logs", (req, res) => {
  const { name } = req.params;
  if (agents[name]) {
    res.json({ logs: agents[name].logs });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
});

app.put("/agent/:name", (req, res) => {
  const { name } = req.params;
  const { mode } = req.body;
  if (agents[name]) {
    agents[name].mode = mode;
    agents[name].logs.push(`[${timestamp()}] Agent ${name} mode updated to ${mode}`);
    res.json({ status: `Agent ${name} updated`, agent: agents[name] });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
});

app.post("/agent/:name/run", (req, res) => {
  const { name } = req.params;
  if (!agents[name]) return res.status(404).json({ error: "Agent not found" });

  const role = agents[name].config.role;
  const taskResult = `Agent ${name} performed ${role} task`;

  agents[name].logs.push(`[${timestamp()}] ${taskResult}`);
  res.json({ status: "Task executed", result: taskResult });
});

// --- Moltbook registration ---
app.post("/agent/:name/register", async (req, res) => {
  const { name } = req.params;
  if (!agents[name]) return res.status(404).json({ error: "Agent not found" });

  try {
    const response = await fetch("https://api.moltbook.com/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MOLTBOOK_KEY}`
      },
      body: JSON.stringify(agents[name])
    });

    const result = await response.json();
    agents[name].logs.push(`[${timestamp()}] Agent ${name} registered to Moltbook`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to register agent", details: err.message });
  }
});

// --- Environment variable checks ---
if (!process.env.MOLTBOOK_KEY) {
  console.warn("⚠️ MOLTBOOK_KEY is not set. Moltbook registration will fail.");
}

// --- Error handling middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// --- Start server ---
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
