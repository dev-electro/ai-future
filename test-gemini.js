const apiKey = process.env.GEMINI_API_KEY;
const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const body = {
  model: "gemma-4-26b-a4b-it",
  messages: [{ role: "user", content: "Hello" }]
};
fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify(body)
}).then(res => res.json()).then(console.log).catch(console.error);
