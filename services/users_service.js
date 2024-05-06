const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const sendgrid = require('@sendgrid/mail')
const UsersModel = require('../utils/Models/Users/UsersModel')
const _ = require('lodash');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

class UserService {
    constructor(io) {
        this.io = io;
        this.jwtObject = new JWTHelper();
    }

    async createUser(userdetails) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                const { email_id, password, confirmpassword, role_type, user_name } = userdetails;

                // Check if user name already exists
                const existingUserName = await UsersModel.findOne({
                    where: {
                        user_name: user_name,
                        status: {
                            [Op.or]: ['NV', 'A']  // Checking for either 'NV' or 'A'
                        }
                    }
                });

                if (existingUserName) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Given user name is already in use");
                }

                // Check if email already exists with statuses 'NV' or 'A'
                const existingUser = await UsersModel.findOne({
                    where: {
                        email_id: email_id,
                        status: {
                            [Op.or]: ['NV', 'A']
                        }
                    }
                });

                if (existingUser) {
                    const errorMessages = {
                        NV: "Given EmailId Already Register, But Might Not Approved Yet !",
                        A: "USER ALREADY IN USE WITH GIVEN EMAIL ID"
                    };
                    throw new global.DATA.PLUGINS.httperrors.BadRequest(errorMessages[existingUser.status]);
                }

                if (password !== confirmpassword) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("PASSWORDS DOES NOT MATCH");
                }

                const salt = await global.DATA.PLUGINS.bcrypt.genSalt(10);
                const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, salt);

                let additionalFields = {};
                if (role_type.toUpperCase() === 'CHANNEL PARTNER') {
                    const { address, contact_no, pancard_no, bank_ac_no, bussiness_experience } = userdetails;
                    if (!address || !contact_no || !pancard_no || !bank_ac_no || !bussiness_experience) {
                        throw new global.DATA.PLUGINS.httperrors.BadRequest("All fields (address, contact_no, pancard_no, bank_ac_no, bussiness_experience) are required for CHANNEL PARTNER");
                    }
                    additionalFields = { address, contact_no, pancard_no, bank_ac_no, bussiness_experience };
                } else {
                    additionalFields = {
                        address: null,
                        contact_no: null,
                        pancard_no: null,
                        bank_ac_no: null,
                        bussiness_experience: null
                    };
                }

                const currentDate = new Date().toISOString().slice(0, 10); // Simplified date handling

                const userPayload = {
                    user_name,
                    email_id,
                    password: hashedPassword,
                    role_type: role_type.toUpperCase(),
                    status: "NV",
                    date_of_signUp: currentDate,
                    ...additionalFields
                };

                const newUser = await UsersModel.create(userPayload, { transaction: t });
                // Emit an event after user creation
                this.io.emit('new-user', { message: `New user registered: ${newUser.user_name}` });
                return newUser;
            } catch (err) {
                console.error("Error in createUser: ", err.message);
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    throw err;
                } else {
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
                }
            }
        });
    }


    async loginUser(userDetails) {
        try {
            const userData = await UsersModel.findOne({
                "where": {
                    email_id: userDetails.email_id
                }
            })

            if (!userData) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("No user exists with given emailId")
            }

            if (userData) {
                if (userData.status === "NV") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Given EmailId Not Approved Yet!")
                }
                else if (userData.status === "R") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("logIn Access For Given EmailId DENIED By SUPER ADMIN")
                }
            }

            const userPassword = userData.password;

            const isValid = await global.DATA.PLUGINS.bcrypt.compare(userDetails.password, userPassword);
            if (!isValid) {
                throw new global.DATA.PLUGINS.httperrors.Unauthorized("InCorrect Password")
            }

            // Valid email and password
            const tokenPayload = userData.user_id + ":" + userData.role_type + ":" + userData.user_name

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            // const refreshToken = await this.jwtObject.generateRefreshToken(tokenPayload);

            const data = {
                accessToken,
                ...userData.toJSON() // Assuming userData is a Sequelize model instance
            };

            // Now remove any properties you don't want to expose manually or using lodash
            delete data.password; // For example, removing the password
            delete data._previousDataValues;
            delete data._changed;
            delete data._options;
            delete data.isNewRecord;

            return data
        }
        catch (err) {
            console.error("Error in loginUser: ", err.message);

            // Rethrow if it's a known error
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Throw a generic error for unknown issues
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }

        }
    }

    sendLinkToEmail(user_name, email_id, link) {
        return new Promise((resolve, reject) => {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SENDER_EMAIL_ID,
                    pass: process.env.SENDER_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.SENDER_EMAIL_ID,
                to: email_id,
                subject: 'Password Reset Request',
                html: `<html>
                <head>
                    <style>
                        .button {
                            background-color: #4CAF50; /* Green */
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            text-align: center;
                            text-decoration: none;
                            display: inline-block;
                            font-size: 16px;
                        }
                    </style>
                </head>
                <body>
                    <h2> Hello ${user_name}, Welcome to VRC Application </h2>
                    <p>You recently requested to reset your password for your VRC account. Use the below button to reset it. <span>
                    <b>This password reset link is only valid for the next 15 minutes.</b>
                    </span></p>
                    <p>If you did not request a password reset, please ignore this email or contact support if you have questions.
                    </p>
                    <p>
                        <a href="${link}"><button class="button">RESET YOUR PASSWORD</button></a>
                    </p>    
                    <p>
                        Thanks, <br>
                        VRC Team
                    </p>
                </body>
            </html>`};

            transporter.sendMail(mailOptions).then(() => {
                console.log("Email Sent to the Mail");
                resolve("EMAIL SENT SUCCESSFULLY");
            }).catch(err => {
                console.error("Error occurred during email sending", err.message);
                reject("EMAIL NOT SENT");
            });
        });
    }

    async sendPasswordResetRequest(email_id) {
        try {

            if (!email_id) {
                return "EMAIL CANNOT BE EMPTY"
            }

            // check user exists or not
            const user = await UsersModel.findOne({
                where: {
                    email_id,
                    status: 'A'
                }
            }).catch(err => {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("User Not Registered")
            }

            // Valid email and password
            const tokenPayload = user.user_id.toString();

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            const Link = 'dummy link'//`${process.env.RESET_BASE_URL}/${accessToken}`

            const response = await this.sendLinkToEmail(user.user_name, email_id, Link);
            console.log("accessToken", accessToken)
            return response;
        }
        catch (err) {
            throw err;
        }
    }

    async changePassword(token, password) {
        try {
            let userId = null;
            await global.DATA.PLUGINS.jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRETKEY, (err, decoded) => {
                if (err) {
                    return "INVALID LINK/LINK EXPIRED"
                } else {
                    // Access the decoded data
                    userId = decoded.aud;
                }
            });
            const newPassword = password;
            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(newPassword, randomkey)

            await UsersModel.update({
                password: hashedPassword
            }, {
                where: {
                    user_id: userId
                }
            }).catch(err => {
                console.log("Error while updating the password", err.message);
                throw err;
            })

            return "Password Updated Successfully"

        }
        catch (err) {
            throw err;
        }
    }
}
module.exports = UserService;