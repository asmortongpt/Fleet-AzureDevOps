import { doubleCsrf } from "csrf-csrf";

const result = doubleCsrf({
  getSecret: () => "test-secret",
  cookieName: "x-csrf-token",
  cookieOptions: {
    sameSite: "strict",
    path: "/",
    secure: false,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req: any) => req.headers["x-csrf-token"],
});

console.log("Keys:", Object.keys(result));
console.log("generateToken type:", typeof result.generateToken);
console.log("Full result:", result);
