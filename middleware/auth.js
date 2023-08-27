const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

function Auth(req, res, next) {
    const authorization = req.headers.authorization || req.cookies.token || req.body.authorization
    if (!authorization) {
        console.log("No Authorization Header");
        return res.status(401).json({
            success: false, message: 'User is not authenticated'
        })
    }
    try {
        const token = authorization.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({
                success: false, message: 'Invalid Token Format'
            })
        }
        const decode = jwt.verify(token, SECRET_KEY);
        req.decoded = decode
        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false, message: 'Session Expired',
                error: error.message,
            })
        }
        if (error instanceof jwt.JsonWebTokenError || error instanceof TokenError) {
            return res.status(401).json({
                success: false, message: 'Invalid Token',
                error: error.message,
            })
        }
        res.status(500).json({
            success: false, message: 'Internal server Error',
            error: error.message,
            stack: error.stack
        });
        console.log(error);
    }
}

module.exports = Auth