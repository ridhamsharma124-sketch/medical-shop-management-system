import { Router } from 'express';
import {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  searchMedicines,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicineController.js';
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController.js';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profileController.js';
import { adjustStock, getStockHistory } from '../controllers/inventoryController.js';
import { createPurchaseOrder, getSupplierPurchases, getPurchaseHistory, getPurchaseOrderById, getAllPurchaseItems } from '../controllers/PurchaseOrderController.js';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { customerSchema, updateCustomerSchema } from '../validators/customerValidator.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMedicineSchema, updateMedicineSchema } from '../validators/medicineValidator.js';
import { uploadMedicineForm } from '../middleware/upload.js';
import { supplierSchema, updateSupplierSchema } from '../validators/supplierValidator.js';
import { getNotifications } from '../controllers/notificationController.js';
import { createSalesBill } from '../controllers/salesController.js';


const router = Router();

router.use(protect, authorize('pharmacist'));

router.get('/medicines', getAllMedicines);
router.post('/medicines', uploadMedicineForm, validate(createMedicineSchema), createMedicine);
router.get('/medicines/search', searchMedicines);
router.get('/medicines/:id', getMedicineById);
router.put(
  '/medicines/:id',
  uploadMedicineForm,
  validate(updateMedicineSchema, { noDefaults: true }),
  updateMedicine
);
router.delete('/medicines/:id', deleteMedicine);

router.get('/inventory/stock-history', getStockHistory);
router.patch('/inventory/:id/stock', adjustStock);


router.get('/suppliers', getSuppliers);
router.post('/suppliers', validate(supplierSchema), createSupplier);
router.get('/suppliers/:id', getSupplierById);
router.put('/suppliers/:id', validate(updateSupplierSchema), updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

router.post('/purchase-orders', createPurchaseOrder);
router.get('/purchase-orders', getPurchaseHistory);
router.get('/purchase-orders/:id', getPurchaseOrderById);
router.get('/suppliers/:supplierId/purchases', getSupplierPurchases);
router.get('/purchase-items', getAllPurchaseItems);


router.get('/customers', getAllCustomers);
router.post('/customers', validate(customerSchema), createCustomer);
router.get('/customers/:id', getCustomerById);
router.put('/customers/:id', validate(updateCustomerSchema), updateCustomer);
router.delete('/customers/:id', deleteCustomer);

router.post('/sales-bills', createSalesBill);


router.get("/notifications", getNotifications)

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/profile/change-password", changePassword);


export default router;