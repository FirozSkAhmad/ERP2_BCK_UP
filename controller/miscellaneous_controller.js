const express = require('express')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const MiscellaneousService = require('../services/miscellaneous_service');
const router = express.Router();
const Constants = require('../utils/Constants/response_messages')
const jwtHelperObj = new JwtHelper();

// Add new Payroll
router.post('/addMiscellaneous', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") {
            const miscellaneousServiceObj = new MiscellaneousService();
            const message = await miscellaneousServiceObj.addMiscellaneous(req.body);

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