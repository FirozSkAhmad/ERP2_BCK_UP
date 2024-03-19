const JwtHelper = require('../utils/Helpers/jwt_helper')
const express = require('express')
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const HistoryService = require('../services/history_service')
const Constants = require('../utils/Constants/response_messages')

router.get('/getHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const userId = req.aud.split(":")[0];
        const historyServiceObj = new HistoryService()
        const history = await historyServiceObj.getHistory(userId)

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            history
        })
    }
    catch (err) {
        next(err);
    }
})
router.get('/getPraticularHistoryDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { userId, receipt_id, projectType } = req.query
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

router.get('/getCommissionHolderslist', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { role_type } = req.query
        const historyServiceObj = new HistoryService()
        const data = await historyServiceObj.getCommissionHolderslist(role_type.toUpperCase())

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
        const { commission_holder_id } = req.query
        const historyServiceObj = new HistoryService()
        const data = await historyServiceObj.getPraticularCommissionHolderHistory(commission_holder_id)

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

module.exports = router;