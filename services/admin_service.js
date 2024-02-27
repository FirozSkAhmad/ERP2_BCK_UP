const Constants = require('../utils//Constants/response_messages')
const UsersModal = require('../utils/Models/Users/UsersModel')

class AdminService {
    constructor() {

    }

    async createSuperAdmin(userdetails) {
        try {
            // Check if a user with the same email or phone number already exists in users
            const checkInUsers = await users.findOne({
                where: {
                    emailId: userdetails.emailId
                }
            });

            if (checkInUsers) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("EMAIL ID ALREADY IN USE");
            }

            const password = userdetails.password;
            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey);

            const userPayload = {
                user_name: userdetails.user_name,
                emailId: userdetails.emailId,
                password: hashedPassword,
                status: "A",
                role_type: "SUPER ADMIN",
                address: userdetails.address ? userdetails.address : null,
                contact_no: userdetails.contact_no ? userdetails.contact_no : null,
                pancard_no: userdetails.pancard_no ? userdetails.pancard_no : null,
                bank_ac_no: userdetails.bank_ac_no ? userdetails.bank_ac_no : null,
                bussiness_experience: userdetails.bussiness_experience ? userdetails.bussiness_experience : null
            };

            const newUser = await users.create(userPayload);
            return newUser;
        } catch (err) {
            console.error("Error in createSuperAdmin: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getPendingUsersList() {
        try {
            const data = await UsersModal.findAll({
                where: {
                    status: 'NV' // Filter to get only users with status "NV"
                }
            }).catch(err => {
                console.log("Error while reading the userstatus details", err);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });
            return data;
        } catch (err) {
            console.error("Error in createNewProject: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }


    async approvedUsersList() {
        try {
            // Use the findAll method with a where clause to filter users by status 'A'
            const data = await UsersModal.findAll({
                where: {
                    status: 'A' // Only select users with status 'A'
                }
            })

            return data;
        } catch (err) {
            console.error("Error in approvedUsersList: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }


    async rejectedUsersList() {
        try {
            // Use the findAll method with a where clause to filter users by status 'R'
            const data = await UsersModal.findAll({
                where: {
                    status: 'R' // Only select users with status 'R'
                }
            })

            return data;
        } catch (err) {
            console.error("Error in approvedUsersList: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async validateUser(userDetails) {
        try {
            if (userDetails.status === 'R') {
                await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                    // Find the user by emailId
                    const user = await UsersModal.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    });

                    if (!user) {
                        // No user found with the given emailId
                        throw new global.DATA.PLUGINS.httperrors.BadRequest('No user data found with the given emailId');
                    }

                    // Update the user status to 'R'
                    await UsersModal.update({ status: 'R' }, {
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    });

                    console.log('User status updated to Rejected successfully');
                    return 'Rejected Successfully';
                });
            } else if (userDetails.status === 'A') {
                await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                    // Find the user by emailId
                    const user = await UsersModal.findOne({
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    });

                    if (!user) {
                        // No user found with the given emailId
                        return new global.DATA.PLUGINS.httperrors.BadRequest('No user data found with the given emailId');
                    }

                    // Update the user status to 'A'
                    await UsersModal.update({ status: 'A' }, {
                        where: {
                            emailId: userDetails.emailId
                        },
                        transaction: t
                    });

                    console.log('User status updated to Approved successfully');
                    return 'Approved Successfully';
                });
            }
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