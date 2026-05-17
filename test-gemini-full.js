const apiKey = process.env.GEMINI_API_KEY;
const url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const body = {
  model: "gemma-4-26b-a4b-it",
  max_tokens: 2000,
  temperature: 0.1,
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: "You are an AI." },
    { role: "user", content: "Output valid JSON containing a key 'message' with value 'hello'." }
  ]
};
const start = Date.now();
fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify(body)
}).then(res => res.json()).then(data => {
  console.log(`Took ${Date.now() - start}ms`, JSON.stringify(data).slice(0, 300));
}).catch(console.error);
