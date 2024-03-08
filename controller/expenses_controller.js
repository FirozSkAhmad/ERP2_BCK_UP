const JwtHelper = require('../utils/Helpers/jwt_helper')
const express = require('express')
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const ExpensesService = require('../services/expenses_service')
const Constants = require('../utils/Constants/response_messages')

router.get('/getExpenses', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { expensesFilter } = req.query
        const expensesServiceObj = new ExpensesService()
        const data = await expensesServiceObj.getExpenses(expensesFilter.toUpperCase())

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
router.get('/getPraticularCommisionDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { receipt_id, projectType } = req.query
        const expensesServiceObj = new ExpensesService()
        const Details = await expensesServiceObj.getPraticularCommisionDetails(receipt_id, projectType)

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

router.get('/getCancledCommissions', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const projectsServiceObj = new CommissionService()
        const data = await projectsServiceObj.getCancledCommissions()
            .catch(err => {
                console.log("Error occured", err.message);
                throw err;
            })

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.post("/validateCommission", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const commissionServiceObj = new CommissionService();
        const data = await commissionServiceObj.validateCommission(req.body).catch(err => {
            console.log("Error occured", err.message);
            throw err;
        })

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": "COMMISSION VALIDATED SUCCESSFULLY"
        })
    }
    catch (err) {
        next(err);
    }
})

router.post("/deleteComission", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const commissionServiceObj = new CommissionService();
        const data = await commissionServiceObj.cancelCommission(req.body).catch(err => {
            console.log("Error occured", err.message);
            throw err;
        })

        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": "COMMISSION DELETED"
        })
    }
    catch (err) {
        next(err);
    }
})
module.exports = router;