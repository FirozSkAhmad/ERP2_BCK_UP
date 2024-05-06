const express = require('express');
const NotificationService = require('../services/notifications_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()


router.post('/createNotification', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        const { message } = req.body
        if (!message) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest('required message in request body');
        }
        const notificationServiceObj = new NotificationService(req.io);
        await notificationServiceObj.createNotification(message, user_name, role_type);
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        });
    } catch (err) {
        next(err);
    }
});

router.get('/getNotifications', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]

        const notificationServiceObj = new NotificationService(req.io);
        const data = await notificationServiceObj.getNotifications(user_name, role_type);

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


router.patch('/deleteParticularNotification', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const role_type = req.aud.split(":")[1]
        const user_name = req.aud.split(":")[2]
        const { notificationIndex } = req.body

        const notificationServiceObj = new NotificationService(req.io);
        const data = await notificationServiceObj.deleteParticularNotification(notificationIndex, user_name, role_type);

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

module.exports = router;