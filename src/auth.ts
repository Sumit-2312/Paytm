import jwt from 'jsonwebtoken';
require('dotenv').config();
// @ts-ignore
const auth = (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const token = req.headers.token;

        if (!token) {
            return res.status(401).json({ message: "Access Denied: No Token Provided" });
        }

        // Verify the token
        const decoded = jwt.verify(token, "Secret_Key");

        if (!decoded) {
            return res.status(401).json({ message: "Invalid Token" });
        }

        // Attach user details to request body
        // @ts-ignore
        req.body.firstName = decoded.firstName;
        // @ts-ignore
        req.body.lastName = decoded.lastName;
        next(); // Proceed to the next middleware or route handler
    } catch (error:any) {
        return res.status(401).json({ message: "Unauthorized Access", error: error.message });
    }
};

export default auth;