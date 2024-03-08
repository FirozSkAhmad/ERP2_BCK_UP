const JwtHelper = require('../utils/Helpers/jwt_helper')
const express = require('express')
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const CommissionService = require('../services/commission_service')
const Constants = require('../utils/Constants/response_messages')

router.get('/getCommissionHoldersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { commissionFilter } = req.query
        const commissionServiceObj = new CommissionService()
        const data = await commissionServiceObj.getCommissionHoldersList(commissionFilter.toUpperCase())

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getPraticularCommissionHolderHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { commission_holder_id, commissionFilter } = req.query
        const commissionServiceObj = new CommissionService()
        const data = await commissionServiceObj.getPraticularCommissionHolderHistory(commission_holder_id, commissionFilter.toUpperCase())

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getPraticularCommissionDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { receipt_id, projectType } = req.query
        const commissionServiceObj = new CommissionService()
        const data = await commissionServiceObj.getPraticularCommissionDetails(receipt_id, projectType.toUpperCase())

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            data
        })
    }
    catch (err) {
        next(err);
    }
})

router.put('/payCommission', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { commission_id, commission_amount } = req.body;
        const commissionServiceObj = new CommissionService()
        const data = await commissionServiceObj.payCommission(commission_id, commission_amount)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            data
        })
    }
    catch (err) {
        next(err);
    }
})
router.get('/getPraticularHistoryDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const userId = req.aud.split(":")[0];
        const { receipt_id, projectType } = req.query
        const historyServiceObj = new HistoryService()
        const Details = await historyServiceObj.getPraticularHistoryDetails(userId, receipt_id, projectType)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            Details
        })
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;