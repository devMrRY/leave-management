import rateLimit from "express-rate-limit";
import { verifyJwtGateway } from "./verifyJwt";

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: "Too many login attempts. Try again later." },
});

const publicPrefixes = ["/auth", "/public", "/health"];

export function maybeVerifyJwt(req: any, res: any, next: any) {
    if (publicPrefixes.some(p => req.path.startsWith(p))) {
        return authLimiter(req, res, next);
    }
    return verifyJwtGateway(req, res, next);
}