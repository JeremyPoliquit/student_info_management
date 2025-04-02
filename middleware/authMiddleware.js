const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "Unauthorized: No token provided" });

    const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
    
    jwt.verify(token, "your_secret_key", (err, user) => {
        if (err) return res.status(403).json({ message: "Forbidden: Invalid token" });
        req.user = user; // Attach user to request
        next();
    });
};

module.exports = authenticateToken;
