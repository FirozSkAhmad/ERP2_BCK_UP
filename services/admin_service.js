const Constants = require('../utils//Constants/response_messages')
const UsersModel = require('../utils/Models/Users/UsersModel')
const { Op } = require('sequelize');

class AdminService {
    constructor() {

    }

    async createSuperAdmin(userdetails) {
        try {
            const { email_id, password, user_name, address = null, contact_no = null, pancard_no = null, bank_ac_no = null, bussiness_experience = null } = userdetails;

            // Check if a user with the same email already exists
            const existingUser = await UsersModel.findOne({ where: { email_id } });
            if (existingUser) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("EMAIL ID ALREADY IN USE");
            }

            // Hash the password
            const salt = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, salt);

            const currentDate = new Date().toISOString().slice(0, 10); // Simplified date handling


            // Prepare the user payload
            const userPayload = {
                user_name,
                email_id,
                password: hashedPassword,
                status: "A",
                role_type: "SUPER ADMIN",
                date_of_signUp: currentDate,
                date_of_validation: currentDate,
                address,
                contact_no,
                pancard_no,
                bank_ac_no,
                bussiness_experience
            };

            // Create the new user
            const newUser = await UsersModel.create(userPayload);
            return newUser;
        } catch (err) {
            console.error("Error in createSuperAdmin: ", err.message);

            // Rethrow if it's a known error
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }

            // Throw a generic error for unknown issues
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getUsersList(status_filter) {
        try {
            // Map human-readable status to DB status codes and sorting preferences
            const statusDetails = {
                PENDING: { code: 'NV', sortBy: 'createdAt' },
                APPROVED: { code: 'A', sortBy: 'updatedAt' },
                REJECTED: { code: 'R', sortBy: 'updatedAt' }
            };

            const statusInfo = statusDetails[status_filter.toUpperCase()];
            if (!statusInfo) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid status provided");
            }

            const data = await UsersModel.findAll({
                where: {
                    status: statusInfo.code,
                    user_id: {
                        [Op.ne]: 1 // Exclude users with user_id: 1
                    }
                },
                attributes: { exclude: ['password'] }, // Exclude the password from the results
                order: [[statusInfo.sortBy, 'DESC']] // Dynamically set sorting based on status
            });

            return data;
        } catch (err) {
            console.error("Error in getUsersList: ", err.message);

            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }

            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async validateUser(userDetails) {
        try {
            return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                const currentDate = new Date().toISOString().slice(0, 10); // Simplified date handling
                const updateData = { status: userDetails.status.toUpperCase(), date_of_validation: currentDate };

                if (userDetails.status.toUpperCase() === 'A' && userDetails.role_type) {
                    // Assuming you want to change the role_type only if status is 'A'
                    updateData.role_type = userDetails.role_type.toUpperCase();
                }

                // Update the user status (and role_type if applicable)
                const [updatedCount] = await UsersModel.update(updateData, {
                    where: {
                        email_id: userDetails.email_id
                    },
                    transaction: t
                });

                if (updatedCount === 0) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest('No user data found with the given emailId');
                }

                return userDetails.status.toUpperCase() === 'R' ? 'Rejected Successfully' : 'Approved Successfully';
            });
        } catch (err) {
            console.error("Error in validateUser: ", err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred (An error occurred during the user validation process)");
        }
    }
}

module.exports = AdminService;