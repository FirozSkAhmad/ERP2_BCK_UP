const JwtHelper = require('../utils/Helpers/jwt_helper')
const express = require('express')
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const CustomerService = require('../services/customer_service')
const Constants = require('../utils/Constants/response_messages')

router.get('/getCustomersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { customersFilter } = req.query
        if (!customersFilter) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing customersFilter.")
        }
        const customerServiceObj = new CustomerService()
        const data = await customerServiceObj.getCustomersList(customersFilter.toUpperCase())

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

router.get('/getPraticularCustomerDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { receipt_id, projectType } = req.query
        if (!receipt_id || !projectType) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing receipt_id/projectType.")
        }
        const customerServiceObj = new CustomerService()
        const data = await customerServiceObj.getPraticularCustomerDetails(receipt_id, projectType.toUpperCase())

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