import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

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

// Create agent with config
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

// List all agents
app.get("/agents", (req, res) => {
  res.json({ agents });
});

// Delete agent
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

// Get agent logs
app.get("/agent/:name/logs", (req, res) => {
  const { name } = req.params;
  if (agents[name]) {
    res.json({ logs: agents[name].logs });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
});

// Update agent mode
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

// Run agent task
app.post("/agent/:name/run", (req, res) => {
  const { name } = req.params;
  if (!agents[name]) return res.status(404).json({ error: "Agent not found" });

  const role = agents[name].config.role;
  const taskResult = `Agent ${name} performed ${role} task`;

  agents[name].logs.push(`[${timestamp()}] ${taskResult}`);
  res.json({ status: "Task executed", result: taskResult });
});

// Register agent to Moltbook
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

app.listen(3001, () => console.log("Backend running on port 3001"));
