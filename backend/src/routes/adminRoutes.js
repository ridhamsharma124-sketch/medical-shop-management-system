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
  getAllPharmacists,
  createPharmacist,
  updatePharmacist,
  deletePharmacist,
} from '../controllers/pharmacistController.js';
import { getActivities } from '../controllers/activityController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createMedicineSchema, updateMedicineSchema } from '../validators/medicineValidator.js';
import { createPharmacistSchema, updatePharmacistSchema } from '../validators/pharmacistValidator.js';
import { uploadMedicineForm } from '../middleware/upload.js';

const router = Router();

const READ_ROLES = ['admin', 'pharmacist'];
const WRITE_ROLES = ['admin', 'pharmacist'];
const ADMIN_ONLY = 'admin';

// Medicine list + create (form-data only, image file )
router.get('/medicines', protect, restrictTo(...READ_ROLES), getAllMedicines);
router.post(
  '/medicines',
  protect,
  restrictTo(...WRITE_ROLES),
  uploadMedicineForm,
  validate(createMedicineSchema),
  createMedicine
);

router.get('/medicines/search', protect, restrictTo(...READ_ROLES), searchMedicines);
router.get('/medicines/:id', protect, restrictTo(...READ_ROLES), getMedicineById);
router.put(
  '/medicines/:id',
  protect,
  restrictTo(...WRITE_ROLES),
  uploadMedicineForm,
  validate(updateMedicineSchema),
  updateMedicine
);
router.delete('/medicines/:id', protect, restrictTo(...WRITE_ROLES), deleteMedicine);

// Pharmacist management (admin only)
router.get('/pharmacists', protect, restrictTo(ADMIN_ONLY), getAllPharmacists);
router.post(
  '/pharmacists',
  protect,
  restrictTo(ADMIN_ONLY),
  validate(createPharmacistSchema),
  createPharmacist
);
router.delete('/pharmacists/:id', protect, restrictTo(ADMIN_ONLY), deletePharmacist);
router.put(
  '/pharmacists/:id',
  protect,
  restrictTo(ADMIN_ONLY),
  validate(updatePharmacistSchema),
  updatePharmacist
);

// Activity log (admin only)
router.get('/activity', protect, restrictTo(ADMIN_ONLY), getActivities);

export default router;