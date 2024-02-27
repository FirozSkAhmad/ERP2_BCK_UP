const express = require('express')
const Constants = require('../utils/Constants/response_messages');
const ReceiptServices = require('../services/receipts_service');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.post('/createReceipt', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const reciptsServiceObj = new ReceiptServices();
        const data = await reciptsServiceObj.createReceipt(req.body)

        res.send({
            "status": 201,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getPendingReceiptsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {

            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getPendingReceiptsList()
                .catch(err => {
                    console.log("errors:", err.message);
                    throw err;
                })

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getReceipts",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getParticularReceiptData', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const { receipt_id } = req.query
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getParticularReceiptData(receipt_id)
                .catch(err => {
                    console.log("errors:", err.message);
                    throw err;
                })

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getReceipts",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.post('/validateReceipt/:approveOrReject', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === Constants.ROLES.SUPER_ADMIN) { // Assuming Constants.ROLES.SUPER_ADMIN is defined elsewhere
            const { approveOrReject } = req.params;
            const receiptsServiceObj = new ReceiptServices();

            try {
                const data = await receiptsServiceObj.validateReceipt(req.body, approveOrReject);
                res.status(201).send({
                    "status": 201,
                    "message": Constants.SUCCESS,
                    "data": data
                });
            } catch (err) {
                console.error("Error validating receipt:", err.message);
                next(err); // Letting the central error handler take care of it
            }
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to validateReceipt",
            });
        }
    } catch (err) {
        next(err);
    }
});

router.get('/getRejectedReceiptsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getRejectedReceiptsList()
                .catch(err => {
                    console.log("errors:", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getReceipts",
            })
        }


    } catch (err) {
        next(err);
    }
})

router.get('/getPartPaymentHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getPartPaymentHistory()
                .catch(err => {
                    console.log("errors:", err.message);
                    throw err;
                })

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getPartPaymentHistory",
            })
        }


    } catch (err) {
        next(err);
    }
})


router.get('/getAvailableReceiptProjectNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const reciptsServiceObj = new ReceiptServices();
        const data = await reciptsServiceObj.getAvailableReceiptProjectNames()
            .catch(err => {
                console.log("errors:", err.message);
                throw err;
            })

        res.send({
            "status": 201,
            "message": Constants.SUCCESS,
            "data": data
        })

    } catch (err) {
        next(err);
    }
})

module.exports = router;