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
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMedicineSchema, updateMedicineSchema } from '../validators/medicineValidator.js';
import { uploadMedicineForm } from '../middleware/upload.js';
import { supplierSchema, updateSupplierSchema } from '../validators/supplierValidator.js';


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


router.get('/suppliers', getSuppliers);
router.post('/suppliers', validate(supplierSchema), createSupplier);
router.get('/suppliers/:id', getSupplierById);
router.put('/suppliers/:id', validate(updateSupplierSchema), updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);


export default router;