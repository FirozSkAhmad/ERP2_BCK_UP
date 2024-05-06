const Constants = require('../utils//Constants/response_messages')
const UsersModel = require('../utils/Models/Users/UsersModel')
const { Op } = require('sequelize');


class NotificationService {
    constructor(io) {
        this.io = io;
    }

    async createNotification(message, userName, roleType) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                // Find the user by user_name and role_type
                const user = await UsersModel.findOne({
                    where: {
                        user_name: userName,
                        role_type: roleType
                    },
                    transaction: t
                });

                if (!user) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("No user exists with the given user_name and role_type");
                }

                // Retrieve current notifications or initialize if null
                const notifications = user.notifications ? JSON.parse(user.notifications) : [];
                const currentNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];

                // Append new message to notifications array
                currentNotifications.push({ message: message, date: new Date(), deleted: false });

                // Update user's notifications
                await UsersModel.update({
                    notifications: JSON.stringify(currentNotifications)
                }, {
                    where: {
                        user_id: user.user_id
                    },
                    transaction: t
                });

                // Transaction will auto-commit if no errors
            } catch (err) {
                console.error("Error in createNotification: ", err.message);

                // If it's a known error, rethrow it for the router to handle
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    throw err;
                } else {
                    // Log and throw a generic server error for unknown errors
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
                }
            }
        });
    }

    async getNotifications(user_name, role_type) {
        try {
            const user = await UsersModel.findOne({
                where: {
                    user_name: user_name,
                    role_type: role_type
                },
                attributes: ['notifications'],  // Only fetch the notifications attribute
            });

            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("User not found");
            }


            const notifications = user.notifications ? JSON.parse(user.notifications) : [];
            const currentNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];
            // Check if notifications exist, filter out deleted ones and sort by date
            const filteredNotifications = (currentNotifications).filter(n => !n.deleted).sort((a, b) => {
                // Assuming 'date' is stored in a way that can be directly compared
                return new Date(b.date) - new Date(a.date);  // Sort by date descending
            });

            return filteredNotifications;
        } catch (err) {
            console.error("Error in getNotifications: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }


    async deleteParticularNotification(notificationIndex, userName, roleType) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                // Find the user by user_name and role_type
                const user = await UsersModel.findOne({
                    where: {
                        user_name: userName,
                        role_type: roleType
                    },
                    transaction: t
                });

                if (!user) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("No user exists with the given user_name and role_type");
                }

                const notifications = user.notifications ? JSON.parse(user.notifications) : [];
                const currentNotifications = notifications.length > 0 ? JSON.parse(notifications) : [];

                // Check if the index is valid
                if (notificationIndex < 0 || notificationIndex >= currentNotifications.length) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid notification index");
                }

                // Mark the notification as deleted
                currentNotifications[notificationIndex].deleted = true;

                // Update user's notifications
                await UsersModel.update({
                    notifications: JSON.stringify(currentNotifications)
                }, {
                    where: {
                        user_id: user.user_id
                    },
                    transaction: t
                });

                // Transaction will auto-commit if no errors
            } catch (err) {
                console.error("Error in deleteNotificationByIndex: ", err.message);

                // If it's a known error, rethrow it for the router to handle
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    throw err;
                } else {
                    // Log and throw a generic server error for unknown errors
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
                }
            }
        });
    }
}
module.exports = NotificationService;
