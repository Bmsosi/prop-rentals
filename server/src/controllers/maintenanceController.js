import {
  createMaintenanceRequestSchema,
  updateMaintenanceRequestSchema,
} from "../validations/maintenanceValidation.js";
import {
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceMessages,
  addMaintenanceMessage,
} from "../services/maintenanceService.js";
import {
  CreatedResponse,
  SuccessResponse,
  HandleError,
} from "../utils/httpResponse.js";

async function createMaintenance(req, res) {
  try {
    console.log("📝 CREATE MAINTENANCE REQUEST");
    console.log("Request body:", req.body);
    console.log("User:", req.user?.id, req.user?.role);

    const body = createMaintenanceRequestSchema.parse(req.body);
    console.log(" Validation passed:", body);

    const userId = req.user.id;
    const userRole = req.user.role;
    const maintenanceRequest = await createMaintenanceRequest(
      userId,
      userRole,
      body
    );

    console.log("Maintenance request created:", maintenanceRequest.id);

    return CreatedResponse(
      res,
      "Maintenance request created successfully",
      maintenanceRequest
    );
  } catch (error) {
    console.error("CREATE MAINTENANCE ERROR:", error.message);
    console.error("Error details:", error);
    return HandleError(res, error);
  }
}

async function fetchAllMaintenanceRequests(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const filters = {
      status: req.query.status,
      priority: req.query.priority,

      category: req.query.category,
      listingId: req.query.listingId,
    };

    const maintenanceRequests = await getAllMaintenanceRequests(
      userId,
      userRole,
      filters
    );

    // Debug: Log invoice data
    if (filters.listingId) {
      console.log(`📍 Returning ${maintenanceRequests.length} maintenance requests for listing ${filters.listingId}`);
      maintenanceRequests.forEach(req => {
        console.log(`  - ${req.title}: ${req.invoices?.length || 0} invoices, totalCost: ${req.totalCost}`);
      });
    }

    return SuccessResponse(
      res,
      200,
      "Maintenance requests fetched successfully",
      maintenanceRequests
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

async function fetchMaintenanceRequestById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const maintenanceRequest = await getMaintenanceRequestById(
      id,
      userId,
      userRole
    );

    return SuccessResponse(
      res,
      200,
      "Maintenance request fetched successfully",
      maintenanceRequest
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

async function updateMaintenance(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const updates = updateMaintenanceRequestSchema.parse(req.body);

    const updatedRequest = await updateMaintenanceRequest(
      id,
      userId,
      userRole,
      updates
    );

    return SuccessResponse(
      res,
      200,
      "Maintenance request updated successfully",
      updatedRequest
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

async function deleteMaintenance(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await deleteMaintenanceRequest(id, userId, userRole);

    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function fetchMaintenanceMessages(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const messages = await getMaintenanceMessages(id, userId, userRole);
    return SuccessResponse(res, 200, "Messages fetched", messages);
  } catch (error) {
    return HandleError(res, error);
  }
}

async function postMaintenanceMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { body } = req.body;
    const message = await addMaintenanceMessage(id, userId, userRole, body);
    return CreatedResponse(res, "Message sent", message);
  } catch (error) {
    return HandleError(res, error);
  }
}

export {
  createMaintenance,
  fetchAllMaintenanceRequests,
  fetchMaintenanceRequestById,
  updateMaintenance,
  deleteMaintenance,
  fetchMaintenanceMessages,
  postMaintenanceMessage,
};
