const LeadsModel = require('../utils/Models/Leads/LeadsModel')

class LeadsService {
    constructor(io) {
        this.io = io;
    }

    async createLead(leadDetails) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                // this.validateRequiredFields(payrollDetails);

                const requiredFields = ['name', 'email_id', 'ph_no', 'location'];


                // Identify missing fields
                const missingFields = requiredFields.filter(field => !leadDetails.hasOwnProperty(field));

                if (missingFields.length > 0) {
                    // Throw an error with a detailed message of missing fields
                    throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
                }

                await LeadsModel.create({
                    ...leadDetails
                }, { transaction: t })
                // Emit an event after lead creation
                this.io.emit('new-lead', { message: `New lead created successfully. Please refresh the page to see the updates.` });

                return "Added lead Successfully";
            }
            catch (err) {
                console.error("Error in createLead: ", err.message);
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

    async getLeads() {
        try {
            const data = await LeadsModel.findAll({
                attributes: {
                    exclude: ["createdAt", "updatedAt"]
                }
            });

            // Return the fetched role types
            return data;
        }
        catch (err) {
            console.error("Error in getLeads ", err.message);

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

module.exports = LeadsService;