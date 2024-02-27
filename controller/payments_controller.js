const express = require('express')
const Constants = require('../utils/Constants/response_messages');
const PaymentsServices = require('../services/payments_service');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.get('/getPartPaymentsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER_ADMIN") {
            const paymentsServiceObj = new PaymentsServices();
            const data = await paymentsServiceObj.getPartPaymentsList(req.body)

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

router.get('/payPartPayment', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER_ADMIN") {
            const paymentsServiceObj = new PaymentsServices();
            const data = await paymentsServiceObj.payPartPayment(req.body)

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

router.get('/getBlockedList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER_ADMIN") {
            const paymentsServiceObj = new PaymentsServices();
            const data = await paymentsServiceObj.getBlockedList(req.body)

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

module.exports = router;