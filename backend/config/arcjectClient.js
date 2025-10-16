import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/node";

// Initialize Arcjet with your site key and desired rules
const aj = arcjet({

    key:process.env.ARCJET_KEY,
    characteristics: ["ip.src"], // Track requests by IP
    rules: [
        //Shield protection with default settings(This protects against SQL injection, XSS, LFI, RFI, SSRF, etc)
        shield({ mode: "LIVE" }),

        // Detect bots and allow only search engine bots
        detectBot({
        mode: "LIVE", 
        allow: [
        "CATEGORY:SEARCH_ENGINE", 
        ],
      }),
      // Create a token bucket rate limit. 
      tokenBucket({
        mode: "LIVE",
        refillRate: 5, // Refill 5 tokens per interval
        interval: 10, // Refill every 10 seconds
        capacity: 10, // Bucket capacity of 10 tokens
      }),
    ],
  });

  export default aj;