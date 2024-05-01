// const createError = require('http-errors')
const { SQL_ERROR, PROJECT_CREATION_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize')
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');

class ProjectsService {
    constructor(io) {
        this.io = io;
    }

    async createNewProject(payload) {
        return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
            try {
                // Check if project_type is provided and valid
                if (!payload.project_type || !['APARTMENT', 'VILLA', 'PLOT', 'FARM_LAND'].includes(payload.project_type.toUpperCase())) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Invalid or missing project_type.");
                }

                // Validate required fields based on project_type
                this.validateRequiredFields(payload);

                // Construct payload identifier based on project type
                let payloadIdentifierCheck = this.constructPayloadIdentifier(payload);

                // Check if a project with the same identifier already exists
                const existingProject = await ProjectsModel.findOne({ where: { pid: payloadIdentifierCheck } });
                if (existingProject) {
                    throw new global.DATA.PLUGINS.httperrors.Conflict("Project already created with the given details");
                }

                // Create the new project
                await ProjectsModel.create({ ...payload, pid: payloadIdentifierCheck });

                // Emit an event after creating a new project
                this.io.emit('new-project', { message: `New project created successfully. Please refresh the page to see the updates.` });

                return "Successfully created project.";

            } catch (err) {
                console.error("Error in createNewProject: ", err.message);
                if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                    throw err;
                } else {
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
                }
            }
        });
    }

    validateRequiredFields(payload) {
        try {
            const requiredFields = {
                APARTMENT: ['project_name', 'tower_number', 'flat_number'],
                VILLA: ['project_name', 'villa_number'],
                PLOT: ['project_name', 'plot_number'],
                FARM_LAND: ['project_name', 'plot_number', 'sq_yards'],
            };

            const fields = requiredFields[payload.project_type.toUpperCase()];
            const missingFields = fields.filter(field => !payload[field]);

            if (missingFields.length > 0) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields: ${missingFields.join(', ')}`);
            }
        } catch (err) {
            console.error("Error in validateRequiredFields: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }

    }

    constructPayloadIdentifier(payload) {
        const baseIdentifier = `${payload.project_type.toUpperCase()}_${payload.project_name}`;
        switch (payload.project_type.toUpperCase()) {
            case 'APARTMENT':
                return `${baseIdentifier}_${payload.tower_number}_${payload.flat_number}`;
            case 'VILLA':
                return `${baseIdentifier}_${payload.villa_number}`;
            case 'PLOT':
            case 'FARM_LAND':
                return `${baseIdentifier}_${payload.plot_number}` + (payload.project_type.toUpperCase() === 'FARM_LAND' ? `_${payload.sq_yards}` : '');
            default:
                return baseIdentifier; // Fallback, should not reach here due to initial validation
        }
    }


    // async editProject(payload) {
    //     try {
    //         let currentProjectId = payload.project_id;
    //         let currentPid = payload.pid;
    //         let payloadIdentifierCheck;
    //         let checkProjectName = (payload.project_name).split('').join('');
    //         let checkProjectType = (payload.project_type).split('').join('');
    //         if (checkProjectType === 'Apartment') {
    //             let checkProjectTowerNumber = (payload.tower_number).split('').join('');
    //             let checkProjectFlatNumber = (payload.flat_number).split('').join('');
    //             payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectTowerNumber + '_' + checkProjectFlatNumber;
    //         }
    //         else if (checkProjectType === 'Villa') {
    //             let checkProjectVillaNumber = (payload.villa_number).split('').join('');
    //             payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectVillaNumber;
    //         }
    //         else if (checkProjectType === 'Plot') {
    //             let checkProjectPlotNumber = (payload.plot_number).split('').join('');
    //             payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectPlotNumber;
    //         }
    //         else {
    //             throw createError.BadRequest("Provide Correct Project Type");
    //         }
    //         if (currentPid !== payloadIdentifierCheck) {

    //             console.log('payloadidentifier in edit:', payloadIdentifierCheck);
    //             // Check in Projects table whether pid is present or not
    //             const finder = await ProjectsModel.findOne({
    //                 where: {
    //                     pid: payloadIdentifierCheck
    //                 }
    //             }).catch(err => {
    //                 console.log("Error", err.message)
    //                 throw createError.InternalServerError(SQL_ERROR)
    //             })

    //             //Project Already Present
    //             if (finder) {
    //                 throw createError.Conflict("Project already created with the given details, Change it");
    //             }
    //         }

    //         console.log('edit doesn not exist:', payloadIdentifierCheck);
    //         let UpdateQuery;
    //         if (payload.project_type === 'Apartment') {
    //             UpdateQuery = `update projects set project_name='${payload.project_name}', tower_number='${payload.tower_number}' , flat_number='${payload.flat_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
    //         }
    //         else if (payload.project_type === 'Villa') {
    //             UpdateQuery = `update projects set project_name='${payload.project_name}' , villa_number='${payload.villa_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
    //         }
    //         else if (payload.project_type === 'Plot') {
    //             UpdateQuery = `update projects set project_name='${payload.project_name}' , plot_number='${payload.plot_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
    //         }
    //         console.log('edit update query:', UpdateQuery);
    //         const response = await DATA.CONNECTION.mysql.query(UpdateQuery, {
    //             type: Sequelize.QueryTypes.UPDATE
    //         }).catch(err => {
    //             console.log("Error while updating data", err.message);
    //             throw createError.InternalServerError(SQL_ERROR);
    //         })

    //         //send data as response
    //         const updatedData = await ProjectsModel.findOne({
    //             where: {
    //                 project_id: currentProjectId
    //             }
    //         }).catch(err => {
    //             console.log("Error", err.message)
    //             throw createError.InternalServerError(SQL_ERROR)
    //         })

    //         return updatedData;


    //     } catch (err) {
    //         throw err;
    //     }
    // }

    // async changeProjectStatus(payload) {
    //     try {
    //         await global.DATA.CONNECTION.mysql.transaction(async (t) => {

    //             let payloadIdentifierCheck;
    //             let checkProjectName = (payload.project_name).split('').join('');
    //             let checkProjectType = (payload.project_type).split('').join('');
    //             if (checkProjectType === 'Apartment') {
    //                 let checkProjectTowerNumber = (payload.tower_number).split('').join('');
    //                 let checkProjectFlatNumber = (payload.flat_number).split('').join('');
    //                 payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectTowerNumber + '_' + checkProjectFlatNumber;
    //             }
    //             else if (checkProjectType === 'Villa') {
    //                 let checkProjectVillaNumber = (payload.villa_number).split('').join('');
    //                 payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectVillaNumber;
    //             }
    //             else if (checkProjectType === 'Plot') {
    //                 let checkProjectPlotNumber = (payload.plot_number).split('').join('');
    //                 payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectPlotNumber;
    //             }

    //             const getProjectData = await global.DATA.MODELS.projects.findOne({
    //                 where: {
    //                     pid: payloadIdentifierCheck
    //                 },
    //                 transaction: t
    //             }).catch(err => {
    //                 throw createError.InternalServerError(SQL_ERROR);
    //             })
    //             console.log('sd:', getProjectData);
    //             console.log('sd check:', (getProjectData == null));
    //             payload.pid = payloadIdentifierCheck;
    //             payload.project_id = getProjectData?.project_id;
    //             console.log('payload:', payload);

    //             if ((getProjectData == null)) throw createError.BadRequest("Project Does not exists")
    //             console.log("Reached HEre")

    //             //check project exist in projects table or not 
    //             const checkProjectExistAlreadyInProject = await global.DATA.MODELS.projects.findOne({
    //                 where: {
    //                     project_id: payload.project_id
    //                 },
    //                 transaction: t
    //             }).catch(err => {
    //                 console.log(err);
    //                 throw createError.InternalServerError(SQL_ERROR);
    //             })

    //             //Update status and amount in projects table
    //             await global.DATA.MODELS.projects.update({
    //                 status: payload.status,
    //                 amount_received: parseInt(checkProjectExistAlreadyInProject.amount_received) + parseInt(payload.amount_received)
    //             }, {
    //                 where: {
    //                     project_id: payload.project_id,
    //                 },
    //                 transaction: t
    //             }).catch(err => {
    //                 console.log(err);
    //                 throw createError.InternalServerError(SQL_ERROR);
    //             })

    //             //check project exist in income table or not 
    //             const checkProjectExistAlreadyInIncome = await global.DATA.MODELS.income.findOne({
    //                 where: {
    //                     project_id: payload.project_id
    //                 },
    //                 transaction: t
    //             }).catch(err => {
    //                 throw createError.InternalServerError(SQL_ERROR);
    //             })

    //             console.log("checkProjectExistAlreadyInIncome:", checkProjectExistAlreadyInIncome)

    //             if (checkProjectExistAlreadyInIncome) {
    //                 console.log("project already exists in income table");
    //                 //then update details with amount added 

    //                 let previouslyReceivedAmount = checkProjectExistAlreadyInIncome.amount_received;
    //                 console.log('previously received amount:', previouslyReceivedAmount);


    //                 let updateIncomeDetails = {
    //                     status: payload.status,
    //                     amount_received: parseInt(previouslyReceivedAmount) + parseInt(payload.amount_received),
    //                 }

    //                 await global.DATA.MODELS.income.update(updateIncomeDetails, {
    //                     where: {
    //                         project_id: payload.project_id
    //                     },
    //                     transaction: t
    //                 })
    //             }
    //             else {
    //                 throw createError.BadRequest("First Onboard the Client and then change the project status")
    //             }

    //         })
    //         return "Project Status Changed Successfully"


    //     } catch (err) {
    //         throw err;
    //     }
    // }

    async getProjectNames() {
        try {
            const response = await global.DATA.CONNECTION.mysql.query(`select project_name from projects`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            // console.log("View All Projects", data);
            let uniqueProjectNames = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectNameData = data.filter(item => {
                if (!uniqueProjectNames.has(item.project_name.split('').join(''))) {
                    uniqueProjectNames.add(item.project_name.split('').join(''));
                    return true;
                }
                return false;
            });

            // console.log(uniqueProjectNameData);
            return uniqueProjectNameData;
        }
        catch (err) {
            console.error("Error in getProjectNames: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getAvailableFilteredProjectNames(project_type) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type,
                    status: 'AVAILABLE'
                },
                attributes: ['project_name']
            });

            // Map the response to get project names
            const projectNames = response.map(item => item.project_name);

            // Use a Set to filter out unique names and then convert it back to an array
            const uniqueProjectNames = [...new Set(projectNames)];

            return uniqueProjectNames;
        }
        catch (err) {
            console.error("Error in getAvailableFilteredProjectNames: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getFilteredTowerNumbers(project_name) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: "APARTMENT",
                    project_name,
                    status: 'AVAILABLE'
                },
                attributes: ['tower_number']
            })

            // Map the response to get project names
            const towerNumbers = response.map(item => item.tower_number);

            // Use a Set to filter out unique names and then convert it back to an array
            const uniqueTowerNumbers = [...new Set(towerNumbers)];

            return uniqueTowerNumbers;
        }
        catch (err) {
            console.error("Error in getFilteredTowerNumbers: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getFilteredFlatNumbers(project_name, tower_number) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: "APARTMENT",
                    project_name,
                    tower_number,
                    status: 'AVAILABLE'
                },
                attributes: ['flat_number']
            })

            const flatNumbers = response.map(item => item.flat_number);

            const uniqueFlatNumbers = [...new Set(flatNumbers)];

            return uniqueFlatNumbers;
        }
        catch (err) {
            console.error("Error in getFilteredFlatNumbers: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getFilteredVillaNumbers(project_name) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: "VILLA",
                    project_name,
                    status: 'AVAILABLE'
                },
                attributes: ['villa_number']
            })

            // Map the response to get project names
            const villaNumbers = response.map(item => item.tower_number);

            // Use a Set to filter out unique names and then convert it back to an array
            const uniqueVillaNumbers = [...new Set(villaNumbers)];

            return uniqueVillaNumbers;
        }
        catch (err) {
            console.error("Error in getFilteredVillaNumbers: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getFilteredPlotNumbers(project_name) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: "PLOT",
                    project_name,
                    status: 'AVAILABLE'
                },
                attributes: ['plot_number']
            })

            // Map the response to get project names
            const plotNumbers = response.map(item => item.tower_number);

            // Use a Set to filter out unique names and then convert it back to an array
            const uniquePlotNumbers = [...new Set(plotNumbers)];

            return uniquePlotNumbers;
        }
        catch (err) {
            console.error("Error in getFilteredPlotNumbers: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getFilteredPlotNumbersOfFLs(project_name) {
        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: "FARM_LAND",
                    project_name,
                    status: 'AVAILABLE'
                },
                attributes: ['plot_number']
            })

            // Map the response to get project names
            const plotNumbers = response.map(item => item.tower_number);

            // Use a Set to filter out unique names and then convert it back to an array
            const uniquePlotNumbers = [...new Set(plotNumbers)];

            return uniquePlotNumbers;
        }
        catch (err) {
            console.error("Error in getFilteredPlotNumbersOfFLs: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getSqYards(project_name, plot_number) {
        try {
            const SqYards = await ProjectsModel.findOne({
                where: {
                    project_type: "FARM_LAND",
                    project_name,
                    plot_number,
                    status: 'AVAILABLE'
                },
                attributes: ['sq_yards']
            })

            return SqYards.sq_yards;
        }
        catch (err) {
            console.error("Error in getFilteredPlotNumbersOfFLs: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getProjectsData(projectType) {
        try {
            // Define exclusion rules based on project type
            const excludeFields = {
                APARTMENT: ['villa_number', 'plot_number', 'sq_yards'],
                VILLA: ['tower_number', 'flat_number', 'plot_number', 'sq_yards'],
                PLOT: ['tower_number', 'flat_number', 'villa_number', 'sq_yards'],
                FARM_LAND: ['tower_number', 'flat_number', 'villa_number']
            };

            // Get the list of fields to exclude for the given project type
            const fieldsToExclude = excludeFields[projectType.toUpperCase()] || [];

            const response = await ProjectsModel.findAll({
                where: {
                    project_type: projectType
                },
                attributes: {
                    exclude: fieldsToExclude
                }
            });
            return response;
        } catch (err) {
            console.error("Error in getProjectsData: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }


    async getAvailableProjectsData(projectType) {
        try {
            // Define exclusion rules based on project type
            const excludeFields = {
                APARTMENT: ['villa_number', 'plot_number', 'sq_yards'],
                VILLA: ['tower_number', 'flat_number', 'plot_number', 'sq_yards'],
                PLOT: ['tower_number', 'flat_number', 'villa_number', 'sq_yards'],
                FARM_LAND: ['tower_number', 'flat_number', 'villa_number']
            };

            // Get the list of fields to exclude for the given project type
            const fieldsToExclude = excludeFields[projectType.toUpperCase()] || [];

            const response = await ProjectsModel.findAll({
                where: {
                    project_type: projectType,
                    status: 'AVAILABLE' // This line filters the results to only include available projects
                },
                attributes: {
                    exclude: fieldsToExclude
                }
            });
            return response; // Directly return the response, no need for extra variable
        } catch (err) {
            console.error("Error in getProjectsData: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async getStatusCount(projectType) {
        try {

            const statuses = ['AVAILABLE', 'TOKEN', 'ADVANCE', 'PART_PAYMENT', 'BLOCK', 'SOLD'];
            const counts = await Promise.all(statuses.map(async (status) => {
                const count = await ProjectsModel.count({
                    where: {
                        project_type: projectType,
                        status: status
                    }
                });
                return { status, count };
            }));

            // Construct the response object
            const response = counts.reduce((acc, { status, count }) => {
                acc[status] = count;
                return acc;
            }, {});

            return response;
        } catch (err) {
            console.error("Error in getStatusCount: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

}

module.exports = ProjectsService;