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

// router.get('/getCancledCommissions', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
//     try {
//         const projectsServiceObj = new CommissionService()
//         const data = await projectsServiceObj.getCancledCommissions()
//             .catch(err => {
//                 console.log("Error occured", err.message);
//                 throw err;
//             })

//         res.send({
//             "status": 200,
//             "message": Constants.SUCCESS,
//             "data": data
//         })
//     }
//     catch (err) {
//         next(err);
//     }
// })

// router.post("/validateCommission", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
//     try {
//         const commissionServiceObj = new CommissionService();
//         const data = await commissionServiceObj.validateCommission(req.body).catch(err => {
//             console.log("Error occured", err.message);
//             throw err;
//         })

//         res.send({
//             "status": 200,
//             "message": Constants.SUCCESS,
//             "data": "COMMISSION VALIDATED SUCCESSFULLY"
//         })
//     }
//     catch (err) {
//         next(err);
//     }
// })

// router.post("/deleteComission", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
//     try {
//         const commissionServiceObj = new CommissionService();
//         const data = await commissionServiceObj.cancelCommission(req.body).catch(err => {
//             console.log("Error occured", err.message);
//             throw err;
//         })

//         res.send({
//             "status": 200,
//             "message": Constants.SUCCESS,
//             "data": "COMMISSION DELETED"
//         })
//     }
//     catch (err) {
//         next(err);
//     }
// })
module.exports = router;