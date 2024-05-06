const express = require('express')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const MiscellaneousService = require('../services/miscellaneous_service');
const router = express.Router();
const Constants = require('../utils/Constants/response_messages')
const jwtHelperObj = new JwtHelper();

// Add new Payroll
router.post('/addMiscellaneous', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        if (role_type === "SUPER ADMIN") {
            const miscellaneousServiceObj = new MiscellaneousService(req.io);
            const message = await miscellaneousServiceObj.addMiscellaneous(req.body, user_name, role_type);

            res.send({
                "status": 201,
                message
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to addMiscellaneous",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;