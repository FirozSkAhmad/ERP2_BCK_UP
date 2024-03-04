const csv = require('csv-parser');
const stream = require('stream');
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');

class BulkUpload {
    constructor(dbConnection) {
        this.dbConnection = dbConnection;
    }

    async processCsvFile(buffer, type) {
        const results = await this.parseCsv(buffer);
        return this.uploadDataBasedOnType(type, results);
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

    async uploadDataBasedOnType(type, data) {
        return this.bulkInsert(ProjectsModel, data, type);
    }

    async bulkInsert(Model, data, type) {
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
            return { status: 200, message: `${data.length} ${type} data added successfully.` };
        } catch (error) {
            console.error('Bulk insert error:', error);
            throw error;
        }
    }

    validateRequiredFields(data, type) {
        const requiredFields = {
            APARTMENT: ['Project Name', 'Tower Number', 'Flat Number'],
            VILLA: ['Project Name', 'Villa Number'],
            PLOT: ['Project Name', 'Plot Number'],
            FARM_LAND: ['Project Name', 'Plot Number', 'Sq.yards'],
        };

        const missingFields = data.some(item => {
            const fields = requiredFields[type];
            return fields.some(field => !item[field]);
        });

        if (missingFields) {
            throw new global.DATA.PLUGINS.httperrors.BadRequest(`Missing required fields for type ${type}`);
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