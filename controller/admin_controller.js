const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()


router.post('/createSuperAdmin', multer().any(), async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService();
        await adminServiceObj.createSuperAdmin(req.body, req.files);
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/getPendingUsersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const adminServiceObj = new AdminService();
            const data = await adminServiceObj.getPendingUsersList();

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

router.post('/validateUser', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const res = await adminServiceObj.validateUser(req.body)
            res.send({
                "status": 200,
                "message": res.message,

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

router.get('/getApprovedUsersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN" || role === "MANAGER") {
            const adminServiceObj = new AdminService()
            const data = await adminServiceObj.approvedUsersList(req.body)
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin AND Manager has access to getApprovedUsersList",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getRejectedUsersList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN" || role === "MANAGER") {
            const adminServiceObj = new AdminService()
            const data = await adminServiceObj.rejectedUsersList(req.body)
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin AND Manager has access to getRejectedUsersList",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;