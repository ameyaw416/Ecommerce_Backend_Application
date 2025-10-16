import aj from "../config/arcjectClient.js";

// Arcjet middleware to protect routes
const arcjetMiddleware = async (req, res, next) => {
    try {
        const decision = await aj.protect(req, {requested: 1});
        if (decision.isDenied()) {
            if(decision.reason.isRateLimit()) return res.status(403).json({ error: "Rate limit exceeded" });
            if(decision.reason.isBot()) return res.status(403).json({ error: "Bot detected" });
            
            

            return res.status(403).json({ error: "Request denied" });

        } 

        next();
    
    } catch (error) {
        console.error(`Error in arcjet middleware:, ${error}`);
        next(error);
    }   
}

export default arcjetMiddleware;