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

router.get('/getPraticularCommissionHolderHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { commission_holder_id } = req.query
        const expensesServiceObj = new ExpensesService()
        const data = await expensesServiceObj.getPraticularCommissionHolderHistory(commission_holder_id)

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

module.exports = router;