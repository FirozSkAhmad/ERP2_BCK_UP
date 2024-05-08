const express = require('express')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const PayrollService = require('../services/payroll_service');
const router = express.Router();
const Constants = require('../utils/Constants/response_messages')
const jwtHelperObj = new JwtHelper();

// Add new Payroll
router.post('/addNewPayRoll', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        if (role_type === "SUPER ADMIN") {
            const payRollServiceObj = new PayrollService(req.io);
            const message = await payRollServiceObj.addNewPayRoll(req.body, user_name, role_type);

            res.send({
                "status": 201,
                message
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to addNewPayRoll",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/getRoleTypes", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") {
            const payRollServiceObj = new PayrollService();
            const roleTypes = await payRollServiceObj.getRoleTypes();
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                roleTypes
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to getRoleTypes",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

router.post("/addRoleType", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        if (role_type === "SUPER ADMIN") {
            const { role_type: roleType } = req.body;


            if (!req.body.hasOwnProperty('role_type')) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("role_type field is missing");
            }

            const payRollServiceObj = new PayrollService(req.io);
            console.log(roleType)
            const message = await payRollServiceObj.addRoleType(user_name, role_type, roleType.toUpperCase());
            res.send({
                "status": 201,
                message
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to addRoleType",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

// router.post("/deletePayrollRole", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
//     try {
//         const payRollServiceObj = new PayrollService();
//         const data = await payRollServiceObj.deletePayrollRole(req.body.id);
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

module.exports = router;