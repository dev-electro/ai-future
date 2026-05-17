const { fetchWithFallback } = await import("./lib/llm.js");
(async () => {
  try {
    console.log("Testing fetchWithFallback...");
    const res = await fetchWithFallback("Return JSON", "Analyze software engineer", null);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
