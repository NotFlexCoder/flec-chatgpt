export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const message = url.searchParams.get("q");

  if (!message) {
    res.status(400).json({ status: "failed", response: "Missing query parameter ?q=" });
    return;
  }

  let prompt = "";
  try {
    const promptRes = await fetch("https://storebix.serv00.net/prompt/title.txt");
    prompt = await promptRes.text();
  } catch {
    res.status(500).json({ status: "failed", response: "Failed to fetch prompt" });
    return;
  }

  const timestamp = Date.now();
  const sign = await generateSHA256(`${timestamp}:${message}:`);

  const data = {
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message }
    ],
    time: timestamp,
    pass: null,
    sign: sign,
  };

  const headers = {
    "User-Agent": getUserAgent(),
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Referer: "https://www.google.com/",
    Connection: "keep-alive",
  };

  try {
    const response = await fetch("https://chat10.free2gpt.xyz/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const textResponse = await response.text();

    let flexcoder;
    try {
      const jsonResponse = JSON.parse(textResponse);
      flexcoder = jsonResponse?.choices?.[0]?.message || textResponse;
    } catch {
      flexcoder = textResponse;
    }

    res.status(200).json({
      status: "success",
      response: flexcoder,
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      response: error.message,
    });
  }
}

async function generateSHA256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getUserAgent() {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
