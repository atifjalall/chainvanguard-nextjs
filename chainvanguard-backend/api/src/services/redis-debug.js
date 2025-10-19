// api/src/services/redis-debug.js
import redisClient from "./redis.service.js";

// Get all keys
const keys = await redisClient.keys("*");
console.log("All Keys:", keys);

// Get session
const session = await redisClient.get("session:USER_ID_HERE");
console.log("Session:", JSON.parse(session));

// Get all sessions
const sessionKeys = await redisClient.keys("session:*");
for (const key of sessionKeys) {
  const data = await redisClient.get(key);
  console.log(key, ":", JSON.parse(data));
}
