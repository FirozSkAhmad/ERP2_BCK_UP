const MiscellaneousModel = require('../utils/Models/Miscellaneous/MiscellaneousModel')

class MiscellaneousService {
    constructor() {

    }

    async addMiscellaneous(miscellaneousDetails) {
        try {
            this.validateRequiredFields(miscellaneousDetails);
            await MiscellaneousModel.create({
                ...miscellaneousDetails
            })

            return "Added Miscellaneous Successfully";

        }
        catch (err) {
            console.error("Error in addMiscellaneous: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    validateRequiredFields(data) {
        const requiredFields = ['name', 'reason', 'amount'];

        // Identify missing fields
        const missingFields = requiredFields.filter(field => !data.hasOwnProperty(field));

        if (missingFields.length > 0) {
            // Throw an error with a detailed message of missing fields
            throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }
}

module.exports = MiscellaneousService;