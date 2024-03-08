const ProjectController = require('../controller/projects_controller')
const UserController = require('../controller/users_controller')
const AdminController = require('../controller/admin_controller')
const ReceiptController = require('../controller/receipts_controller')
const IncomeController = require('../controller/income_controller')
const PayrollController = require('../controller/payroll_controller')
const HistoryController = require('../controller/history_controller')
const CommissionController = require('../controller/commission_controller')
const BulkUploadController = require('../controller/bulkupload_controller')
const PaymentsController = require('../controller/payments_controller')
const ExpensesController = require('../controller/expenses_controller')
const MiscellaneousController = require('../controller/miscellaneous_controller')

class IndexRoute {
    constructor(expressApp) {
        this.app = expressApp
    }

    async initialize() {
        this.app.use('/project', ProjectController)
        this.app.use('/auth', UserController)
        this.app.use('/admin', AdminController)
        this.app.use('/receipt', ReceiptController)
        this.app.use('/payments', PaymentsController)
        this.app.use('/income', IncomeController)
        this.app.use('/payroll', PayrollController);
        this.app.use('/commissions', CommissionController)
        this.app.use('/history', HistoryController)
        this.app.use("/upload", BulkUploadController);
        this.app.use("/miscellaneous", MiscellaneousController);
        this.app.use("/expenses", ExpensesController);
    }
}

module.exports = IndexRoute;