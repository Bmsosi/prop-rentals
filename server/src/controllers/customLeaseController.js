import {
    createCustomLease,
    getAllCustomLeases,
    getCustomLeaseById,
    updateCustomLeaseById,
    deleteCustomLeaseById,
} from "../services/customLeaseService.js";
import {
    createCustomLeaseSchema,
    updateCustomLeaseSchema,
} from "../validations/customLeaseValidation.js";
import { SuccessResponse, CreatedResponse, HandleError } from "../utils/httpResponse.js";
import { prisma } from "../prisma/client.js";

export const createCustomLeaseController = async (req, res) => {
    try {
        const landlordId = req.user.id;
        const body = createCustomLeaseSchema.parse(req.body);
     
        const lease = await createCustomLease(landlordId, body);
        return CreatedResponse(res, "Custom lease created", lease);
    } catch (err) {
        return HandleError(res, err);
    }
};

export const getAllCustomLeasesController = async (req, res) => {
    try {
        const filters = {
            listingId: req.query.listingId,
        };
        const leases = await getAllCustomLeases(req.user.id, req.user.role, filters);
        return SuccessResponse(res, 200, "Retrieved", leases);
    } catch (err) {
        return HandleError(res, err);
    }
};

export const getCustomLeaseByIdController = async (req, res) => {
    try {
        const lease = await getCustomLeaseById(req.params.id);
        return SuccessResponse(res, 200, "Retrieved", lease);
    } catch (err) {
        return HandleError(res, err);
    }
};

export const updateCustomLeaseController = async (req, res) => {
    try {
        const body = updateCustomLeaseSchema.parse(req.body);
        const lease = await updateCustomLeaseById(req.params.id, req.user.id, body);
        return SuccessResponse(res, 200, "Updated", lease);
    } catch (err) {
        return HandleError(res, err);
    }
};

export const deleteCustomLeaseController = async (req, res) => {
    try {
        const result = await deleteCustomLeaseById(req.params.id, req.user.id);
        return SuccessResponse(res, 200, result.message);
    } catch (err) {
        return HandleError(res, err);
    }
};

export const getCustomLeaseByListingIdController =async (req, res) => {
  const { listingId } = req.params;

  const lease = await prisma.CustomLease.findFirst({
    where: { listingId },
  });

  res.json({ lease });
}
