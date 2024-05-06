const csv = require('csv-parser');
const stream = require('stream');
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');

class BulkUpload {
    constructor(io) {
        this.io = io;
    }

    async processCsvFile(buffer, type, user_name, role_type) {
        try {
            const results = await this.parseCsv(buffer);
            return this.uploadDataBasedOnType(type, results, user_name, role_type);
        }
        catch (err) {
            console.error('processCsvFile error:', err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    parseCsv(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (error) => reject(error));
        });
    }

    async uploadDataBasedOnType(type, data, user_name, role_type) {
        try {
            return this.bulkInsert(ProjectsModel, data, type, user_name, role_type);
        }
        catch (err) {
            console.error('uploadDataBasedOnType error:', err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    async bulkInsert(Model, data, type, user_name, role_type) {
        try {
            // Validate required fields based on type
            this.validateRequiredFields(data, type);

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                const preparedData = data.map(item => ({
                    project_type: type,
                    project_name: item['Project Name'],
                    tower_number: item['Tower Number'] || null,
                    flat_number: item['Flat Number'] || null,
                    villa_number: item['Villa Number'] || null,
                    plot_number: item['Plot Number'] || null,
                    sq_yards: item['Sq.yards'] || null,
                    pid: this.generatePayloadIdentifier(item, type),
                    status: 'AVAILABLE',
                }));
                await Model.bulkCreate(preparedData, { transaction: t });
            });
            // Emit an event after bulk upload
            this.io.emit('new-bulkUpload', { user_name, role_type, message: `New projects bulk uploaded. Please refresh the page to see the updates.` });

            return { status: 200, message: `${data.length} ${type} data added successfully.` };
        } catch (err) {
            console.error('Bulk insert error:', err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }

    validateRequiredFields(data, type) {
        try {
            const requiredFields = {
                APARTMENT: ['Project Name', 'Tower Number', 'Flat Number'],
                VILLA: ['Project Name', 'Villa Number'],
                PLOT: ['Project Name', 'Plot Number'],
                FARM_LAND: ['Project Name', 'Plot Number', 'Sq.yards'],
            };

            const typeFields = requiredFields[type];
            if (!typeFields) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest(`Unsupported type ${type}`);
            }

            const errors = [];

            data.forEach(item => {
                const itemFields = Object.keys(item);
                const missingFields = typeFields.filter(field => !item.hasOwnProperty(field));
                const extraFields = itemFields.filter(field => !typeFields.includes(field));

                if (missingFields.length > 0) {
                    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
                }
                if (extraFields.length > 0) {
                    errors.push(`Extra fields provided: ${extraFields.join(', ')}`);
                }
            });

            if (errors.length > 0) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest(`Validation errors for type ${type}: ${errors.join('; ')}`);
            }
        } catch (err) {
            console.error('Error in validateRequiredFields:', err.message);
            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            } else {
                // Log and throw a generic server error for unknown errors
                throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
            }
        }
    }


    generatePayloadIdentifier(item, type) {
        switch (type) {
            case 'APARTMENT':
                return `${type}_${item['Project Name']}_${item['Tower Number']}_${item['Flat Number']}`;
            case 'VILLA':
                return `${type}_${item['Project Name']}_${item['Villa Number']}`;
            case 'PLOT':
                return `${type}_${item['Project Name']}_${item['Plot Number']}`;
            case 'FARM_LAND':
                return `${type}_${item['Project Name']}_${item['Plot Number']}_${item['Sq.yards']}`;
            default:
                return ''; // Consider a more robust handling or default case
        }
    }

}

module.exports = BulkUpload;