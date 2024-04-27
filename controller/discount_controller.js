const JwtHelper = require('../utils/Helpers/jwt_helper')
const express = require('express')
const jwtHelperObj = new JwtHelper();
const router = express.Router()
const DiscountService = require('../services/discount_service')
const Constants = require('../utils/Constants/response_messages')

router.get('/getDiscountsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const discountServiceObj = new DiscountService()
        const data = await discountServiceObj.getDiscountsList()

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

router.get('/getPraticularDiscountDetails', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const { receipt_id, projectType } = req.query
        if (!receipt_id || !projectType) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("missing receipt_id/projectType.")
        }
        const discountServiceObj = new DiscountService()
        const data = await discountServiceObj.getPraticularDiscountDetails(receipt_id, projectType.toUpperCase())

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