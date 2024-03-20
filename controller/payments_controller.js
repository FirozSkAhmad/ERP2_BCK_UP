const express = require('express')
const Constants = require('../utils/Constants/response_messages');
const PaymentsServices = require('../services/payments_service');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.get('/getPaymentsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") {
            const { statusFilter } = req.query;
            if (!statusFilter) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Status filter is required");
            }
            if (!["PART PAYMENT", "BLOCK"].includes(statusFilter.toUpperCase())) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid Status Filter Provided");
            }

            const paymentsServiceObj = new PaymentsServices();
            const data = await paymentsServiceObj.getPaymentsList(statusFilter.toUpperCase())

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to getPartPaymentsList",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

router.post('/payPartPayment', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") {
            const paymentsServiceObj = new PaymentsServices();
            const data = await paymentsServiceObj.payPartPayment(req.body)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to payPartPayment",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;