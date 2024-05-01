const express = require('express')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const LeadsService = require('../services/leads_service');
const router = express.Router();
const Constants = require('../utils/Constants/response_messages')
const jwtHelperObj = new JwtHelper();

// Add new Payroll
router.post('/createLead', async (req, res, next) => {
    try {
            const leadsServiceObj = new LeadsService(req.io);
            const message = await leadsServiceObj.createLead(req.body);

            res.send({
                "status": 201,
                message
            })
    }
    catch (err) {
        next(err);
    }
})

router.get("/getLeads", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") {
            const leadsServiceObj = new LeadsService();
            const leads = await leadsServiceObj.getLeads({
                attributes: ['role_type']
            });
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                leads
            })
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to getLeads",
            });
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;