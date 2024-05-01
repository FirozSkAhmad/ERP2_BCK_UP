const MiscellaneousModel = require('../utils/Models/Miscellaneous/MiscellaneousModel')

class MiscellaneousService {
    constructor(io) {
        this.io = io;
    }

    async addMiscellaneous(miscellaneousDetails) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                this.validateRequiredFields(miscellaneousDetails);
                await MiscellaneousModel.create({
                    ...miscellaneousDetails
                }, { transaction: t })

                // Emit an event after miscellaneous action
                this.io.emit('new-miscellaneous', { message: `New miscellaneous added. Please refresh the page to see the updates.` });

                return "Added Miscellaneous Successfully";

            }
            catch (err) {
                console.error("Error in addMiscellaneous: ", err.message);

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

    validateRequiredFields(data) {
        try {
            const requiredFields = ['name', 'reason', 'amount'];

            // Identify missing fields
            const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));

            if (missingFields.length > 0) {
                // Throw an error with a detailed message of missing fields
                throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
            }
        } catch (err) {
            console.error("Error in validateRequiredFields: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }
}

module.exports = MiscellaneousService;