import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getOwnAppointments,
  updateAppointment,
} from "../controllers/appointment.controller.js";
import { authenticate, authorise } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.js";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
} from "../validators/measurement.validators.js";

const router = Router();

router.use(authenticate);

// Client requests appointment
router.post("/", validate(createAppointmentSchema), createAppointment);

// Client views their own appointments
router.get("/own", getOwnAppointments);

// Admin views all appointments (filterable: ?status=REQUESTED&clientId=xxx)
router.get("/", authorise("STAFF_ADMIN", "SUPER_ADMIN"), getAppointments);

// Admin updates appointment status
router.put(
  "/:id",
  authorise("STAFF_ADMIN", "SUPER_ADMIN"),
  validate(updateAppointmentSchema),
  updateAppointment,
);

export default router;
