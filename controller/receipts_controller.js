const express = require('express')
const Constants = require('../utils/Constants/response_messages');
const ReceiptServices = require('../services/receipts_service');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.post('/createReceipt', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SALES PERSON" || req.aud.split(":")[1] === "CHANNEL PARTNER") {
            const commission_holder_id = req.aud.split(":")[0]
            const role_type = req.aud.split(":")[1]
            const user_name = req.aud.split(":")[2]
            const reciptsServiceObj = new ReceiptServices(req.io);
            const details = await reciptsServiceObj.createReceipt(req.body, commission_holder_id, user_name, role_type)

            res.send({
                "status": 201,
                details
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SALES PERSON and CHANNEL PARTNER has access to createReceipt",
            })
        }
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

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getPendingReceiptsList",
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
            if (!receipt_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing receipt_id.")
            }
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getParticularReceiptData(receipt_id)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getParticularReceiptData",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.put('/validateReceipt/:approveOrReject', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        if (role_type === "SUPER ADMIN") { // Assuming Constants.ROLES.SUPER_ADMIN is defined elsewhere
            const { approveOrReject } = req.params;
            if (!['APPROVE', 'REJECT'].includes(approveOrReject.toUpperCase())) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("approveOrReject must be 'APPROVE'or 'REJECT'");
            }

            const receiptsServiceObj = new ReceiptServices(req.io);
            const message = await receiptsServiceObj.validateReceipt(req.body, approveOrReject.toUpperCase(), user_name, role_type);
            res.send({
                "status": 200,
                message
            });
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

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getRejectedReceiptsList",
            })
        }


    } catch (err) {
        next(err);
    }
})

router.get('/getList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { statusFilter } = req.query;
            if (!['PART PAYMENT', 'SOLD'].includes(statusFilter.toUpperCase())) {
                throw new global.global.DATA.PLUGINS.httperrors.BadRequest("Invalid status filter, must be 'PART PAYMENT'or 'SOLD'");
            }
            const data = await reciptsServiceObj.getList(statusFilter.toUpperCase())

            res.send({
                "status": 200,
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

router.get('/getParticularPartPaymentHistoryList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { project_id } = req.query;
            if (!project_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_id.")
            }
            const data = await reciptsServiceObj.getParticularPartPaymentHistoryList(project_id)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getParticularPartPaymentHistoryDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { receipt_id, pp_id } = req.query
            if (!receipt_id || !pp_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing receipt_id/pp_id.")
            }
            const data = await reciptsServiceObj.getParticularPartPaymentHistoryDetails(receipt_id, pp_id)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getParticularPartPaymentHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { project_id } = req.query;
            if (!project_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_id.")
            }
            const data = await reciptsServiceObj.getParticularPartPaymentHistory(project_id)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.put('/editParticularPartPaymentAmount', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const reciptsServiceObj = new ReceiptServices(req.io);
            const role_type = req.aud.split(":")[1]
            const user_name = req.aud.split(":")[2]
            const message = await reciptsServiceObj.editParticularPartPaymentAmount(req.body, user_name, role_type)

            res.send({
                "status": 201,
                message
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to editParticularPartPaymentAmount",
            })
        }

    } catch (err) {
        console.error("Error in /editParticularPartPaymentAmount route:", err.message);
        next(err);
    }
})

router.put('/deleteParticularPartPaymentAmount', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const reciptsServiceObj = new ReceiptServices(req.io);
            const role_type = req.aud.split(":")[1]
            const user_name = req.aud.split(":")[2]
            const { pp_id, pd_id } = req.query
            if (!pp_id || !pd_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing pd_id/pp_id.")
            }
            const message = await reciptsServiceObj.deleteParticularPartPaymentAmount(pp_id, pd_id, user_name, role_type)

            res.send({
                "status": 201,
                message
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to deleteParticularPartPaymentAmount",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.put('/deleteParticularProjectPartPayments', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const { project_id, pd_id } = req.query
            if (!project_id || !pd_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing pd_id/project_id.")
            }
            const role_type = req.aud.split(":")[1]
            const user_name = req.aud.split(":")[2]
            const reciptsServiceObj = new ReceiptServices(req.io);
            const message = await reciptsServiceObj.deleteParticularProjectPartPayments(project_id, pd_id, user_name, role_type)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                message
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to deleteParticularProjectPartPayments",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getDeletedHistoryList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { deletedFilter, statusFilter } = req.query
            if (!statusFilter || !deletedFilter) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing statusFilter/deletedFilter.")
            }
            const data = await reciptsServiceObj.getDeletedHistoryList(deletedFilter, statusFilter)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getPartPaymentDeletedHistoryList",
            })
        }
    } catch (err) {
        next(err);
    }
})

router.get('/getParticularPartPaymentDeletedHistoryList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const { project_id } = req.query;
            if (!project_id) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("missing project_id.")
            }
            const data = await reciptsServiceObj.getParticularPartPaymentDeletedHistoryList(project_id)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

module.exports = router;