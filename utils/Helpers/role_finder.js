const cron = require('node-cron');
const sequelize = require('sequelize');
const { Op } = sequelize;
const UsersModel = require('../Models/Users/UsersModel');


const roleFinder = async (email_id) => {
    try {
        // Find the user by email
        const existingUser = await UsersModel.findOne({
            where: { email_id }
        });

        if (!existingUser) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest("No use found with given emailId");
        }

        return {
            user_name: existingUser.user_name,
            role_type: existingUser.role_type
        };
    } catch (err) {
        console.error("Error in roleFinder: ", err.message);
        if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
            throw err;
        } else {
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }
};

module.exports = {
    roleFinder
};
