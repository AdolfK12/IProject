const { verifyToken } = require('../helpers/jwt')
const { User } = require('../models/index')

async function authentication(req, res, next) {
    const { access_token } = req.headers
    try {
        if (!access_token) throw { name: 'AuthenticationFailed' }

        const decoded = verifyToken(access_token)
        const user = await User.findOne({ where: { email: decoded.email } })
        
        if (!user) throw { name: 'AuthenticationFailed' }

        req.loggedInUser = decoded
        next()

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                "message": "Failed to authenticate "
            })
        } else if (error.name === 'AuthenticationFailed') {
            res.status(401).json({
                "message": "Failed to authenticate "
            })
        } else {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }
}

async function otorisasi(req, res, next) {
    try {
        const user = await User.findOne({ where: { email: req.loggedInUser.email } })

        if (!user) throw { name: 'UserNotFound' }
        if (!user.isSubscribed) throw { name: 'SubscriptionRequired' }

        next()

    } catch (error) {
        if (error.name === 'UserNotFound') {
            res.status(404).json({
                "message": "User not found"
            })
        } else if (error.name === 'SubscriptionRequired') {
            res.status(403).json({
                "message": "Subscription is required to access this feature"
            })
        } else {
            console.log(error);
            res.status(500).json({
                "message": "Internal server error"
            })
        }
    }
}

module.exports = { authentication, otorisasi }
