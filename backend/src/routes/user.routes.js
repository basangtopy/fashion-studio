import { Router } from "express";
import {
  updateProfile,
  changePassword,
  updateProfilePicture,
  getAllClients,
  getClientById,
  getClientOnlineStatus,
  createClientAccount,
  updateClientAccount,
  changeUserRole,
  getStaffAdmins,
} from "../controllers/user.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import validate from "../middleware/validate.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  createClientSchema,
  changeUserRoleSchema,
} from "../validators/user.validators.js";

const router = Router();

router.use(authenticate);

// ── Current user profile management ──────────────────────────────────────
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.put("/password", validate(changePasswordSchema), changePassword);
router.put(
  "/profile-picture",
  uploadSingle("profilePicture"),
  updateProfilePicture,
);

// ── Admin client management ───────────────────────────────────────────────
router.get(
  "/admin/clients",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getAllClients,
);

router.get(
  "/admin/clients/:id/online",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getClientOnlineStatus,
);

router.get(
  "/admin/clients/:id",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  getClientById,
);

router.post(
  "/admin/clients",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  validate(createClientSchema),
  createClientAccount,
);

router.put(
  "/admin/clients/:id",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  validate(updateProfileSchema),
  updateClientAccount,
);

// ── Super Admin role management ──────────────────────────────────────────
router.get(
  "/admin/staff",
  authorise("SUPER_ADMIN"),
  getStaffAdmins,
);

router.patch(
  "/admin/users/:id/role",
  authorise("SUPER_ADMIN"),
  validate(changeUserRoleSchema),
  changeUserRole,
);

export default router;
