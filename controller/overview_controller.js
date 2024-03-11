const express = require('express')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const OverviewService = require('../services/overview_service');
const router = express.Router();
const Constants = require('../utils/Constants/response_messages')
const jwtHelperObj = new JwtHelper();


router.get("/getOverview", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN" || role === "MANAGER") {
            const overviewServiceObj = new OverviewService();
            const leads = await overviewServiceObj.getOverview({
                attributes: ['role_type']
            });
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                leads
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN or MANAGER has access to getOverview",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;