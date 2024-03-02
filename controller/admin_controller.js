const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()


router.post('/createSuperAdmin', async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService();
        await adminServiceObj.createSuperAdmin(req.body);
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/getUsersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {

            const { status_filter } = req.query
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getUsersList(status_filter);

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin AND Manager has access to getPendingUsersList",
            })
        }

    }
    catch (err) {
        next(err);
    }
})

router.put('/validateUser', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const message = await adminServiceObj.validateUser(req.body)
            res.send({
                "status": 200,
                "message": message,
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to validateUser",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;