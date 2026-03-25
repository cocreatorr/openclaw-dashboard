// backend/services/moltbook.js
export async function callMoltbookAPI(payload) {
  const key = process.env.MOLTBOOK_KEY;

  if (!key) {
    console.warn("Moltbook API not configured, skipping call");
    return { success: false, message: "Moltbook unavailable" };
  }

  try {
    const response = await fetch("https://api.moltbook.com/endpoint", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (err) {
    console.error("Moltbook API error:", err);
    return { success: false, message: "Moltbook error" };
  }
}
