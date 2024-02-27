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
            await this.dbConnection.transaction(async (t) => {
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

    generatePayloadIdentifier(item, type) {
        switch (type) {
            case 'APARTMENT':
                return `${item['Project type']}_${item['Project Name']}_${item['Tower Number']}_${item['Flat Number']}`;
            case 'VILLA':
                return `${item['Project type']}_${item['Project Name']}_${item['Villa Number']}`;
            case 'PLOT':
                return `${item['Project type']}_${item['Project Name']}_${item['Plot Number']}`;
            case 'FARM_LAND':
                return `${item['Project type']}_${item['Project Name']}_${item['Plot Number']}_${item['Sq.yards']}`;
            default:
                return ''; // Consider a more robust handling or default case
        }
    }

}

module.exports = BulkUpload;