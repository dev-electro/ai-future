const apiKey = process.env.OPENROUTER_API_KEY;
const url = "https://openrouter.ai/api/v1/chat/completions";
const body = {
  model: "google/gemma-4-26b-a4b-it:free",
  messages: [{ role: "user", content: "Hello" }]
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
  console.log(`Took ${Date.now() - start}ms`, data);
}).catch(console.error);
