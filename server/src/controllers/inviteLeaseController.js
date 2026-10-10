import crypto from "crypto";
import { prisma } from "../prisma/client.js";

// Generate a lease invite link
export const generateLeaseInviteController = async (req, res) => {
    try {
        const { tenantId, leaseType } = req.body;
        const leaseId = req.params.id;

        if (!["STANDARD", "CUSTOM"].includes(leaseType)) {
            return res.status(400).json({ message: "Invalid leaseType" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const url = `${baseUrl}/leases-invite/sign/${token}`;

        const invite = await prisma.leaseInvite.create({
            data: {
                leaseId,
                tenantId: null,
                leaseType,
                token,
                url,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
            },
        });

        res.json({ invite });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating lease invite" });
    }
};

// Get lease info from invite token
export const getLeaseInviteController = async (req, res) => {
    try {
        const { token } = req.params;

        const invite = await prisma.leaseInvite.findUnique({ where: { token } });
        if (!invite) return res.status(404).json({ message: "Invalid token" });
        if (invite.expiresAt < new Date()) return res.status(400).json({ message: "Invite expired" });

        let lease;
        if (invite.leaseType === "CUSTOM") {
            lease = await prisma.customLease.findUnique({ 
                where: { id: invite.leaseId },
                select: {
                    id: true,
                    leaseName: true,
                    fileUrl: true,
                    leaseStatus: true,
                    startDate: true,
                    endDate: true,
                    rentAmount: true,
                }
            });
        } else {
            lease = await prisma.lease.findUnique({ 
                where: { id: invite.leaseId },
                select: {
                    id: true,
                    contractPdfUrl: true,
                    leaseStatus: true,
                    startDate: true,
                    endDate: true,
                    rentAmount: true,
                }
            });
        }

        // Return invite and lease data (including PDF URLs)
        res.json({ invite: { ...invite, lease }, lease });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching lease invite" });
    }
};

// Mark lease as signed
// export const signLeaseController = async (req, res) => {
//     try {
//         const { token } = req.params;

//         const invite = await prisma.leaseInvite.findUnique({ where: { token } });
//         if (!invite) return res.status(404).json({ message: "Invalid token" });
//         if (invite.expiresAt < new Date()) return res.status(400).json({ message: "Invite expired" });

//         await prisma.leaseInvite.update({
//             where: { token },
//             data: { 
//                 tenantId: userId,
//                 signed: true 
//             },
//         });

//         res.json({ message: "Lease signed successfully" });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Error signing lease" });
//     }
// };

export const signLeaseController = async (req, res) => {
    try {
        const { token } = req.params;
        const { userId, signature } = req.body; // Accept userId from request body
        
        // Validate userId is provided
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Verify the invite token
        const invite = await prisma.leaseInvite.findUnique({
            where: { token },
        });

        if (!invite) return res.status(404).json({ message: "Invalid token" });
        if (invite.expiresAt < new Date())
            return res.status(400).json({ message: "Invite expired" });
        if (invite.signed)
            return res.status(400).json({ message: "This lease has already been signed" });

        // Verify the user exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if tenant already has an active lease (standard or custom)
        const existingStandardLease = await prisma.lease.findFirst({
            where: { 
                tenantId: userId, 
                leaseStatus: "ACTIVE",
                endDate: { gte: new Date() } // Lease hasn't ended yet
            },
        });

        const existingCustomLease = await prisma.customLease.findFirst({
            where: { 
                tenantId: userId, 
                leaseStatus: "ACTIVE",
                endDate: { gte: new Date() } // Lease hasn't ended yet
            },
        });

        if (existingStandardLease || existingCustomLease) {
            return res.status(400).json({ 
                message: "You already have an active lease. You cannot sign another lease until your current lease ends or is terminated.",
                existingLeaseId: existingStandardLease?.id || existingCustomLease?.id
            });
        }

        // Fetch the correct lease type
        let leaseModel =
            invite.leaseType === "CUSTOM" ? prisma.customLease : prisma.lease;

        const lease = await leaseModel.findUnique({
            where: { id: invite.leaseId },
            include: {
                listing: {
                    include: {
                        landlord: true
                    }
                },
                landlord: true
            }
        });

        if (!lease) return res.status(404).json({ message: "Lease not found" });

        // Update invite (mark signed + attach tenant)
        await prisma.leaseInvite.update({
            where: { token },
            data: { tenantId: userId, signed: true },
        });

        // Update lease (attach tenant + activate)
        const updatedLease = await leaseModel.update({
            where: { id: invite.leaseId },
            data: {
                tenantId: userId,
                leaseStatus: "ACTIVE",
            },
        });

        // For standard leases, regenerate the PDF with tenant information if not already present
        if (invite.leaseType !== "CUSTOM" && (!lease.contractPdfUrl || lease.contractPdfUrl === null)) {
            try {
                const { generateLeaseContractPDF } = await import('../services/pdfGenerationService.js');
                
                const tenantFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const landlordFullName = `${lease.landlord?.firstName || ''} ${lease.landlord?.lastName || ''}`.trim();
                
                const contractPdfUrl = await generateLeaseContractPDF({
                    unitNumber: lease.unitNumber,
                    propertyAddress: lease.propertyAddress || lease.listing?.streetAddress,
                    propertyCity: lease.propertyCity || lease.listing?.city,
                    propertyState: lease.propertyState || lease.listing?.state,
                    propertyZipCode: lease.propertyZipCode || lease.listing?.zipCode,
                    landlordFullName: lease.landlordFullName || landlordFullName,
                    landlordAddress: lease.landlordAddress,
                    landlordPhone: lease.landlordPhone || lease.landlord?.phone,
                    landlordEmail: lease.landlordEmail || lease.landlord?.email,
                    tenantFullName: lease.tenantFullName || tenantFullName,
                    tenantPhone: lease.tenantPhone || user.phone,
                    tenantEmail: lease.tenantEmail || user.email,
                    tenantOtherPhone: lease.tenantOtherPhone,
                    tenantOtherEmail: lease.tenantOtherEmail,
                    startDate: lease.startDate,
                    endDate: lease.endDate,
                    rentAmount: lease.rentAmount,
                    paymentFrequency: lease.paymentFrequency,
                    paymentDay: lease.paymentDay,
                    securityDeposit: lease.securityDeposit,
                    securityDepositDueDate: lease.securityDepositDueDate,
                    petDeposit: lease.petDeposit,
                    petDepositDueDate: lease.petDepositDueDate,
                    parkingSpaces: lease.parkingSpaces,
                    includedServices: lease.includedServices,
                    leaseTermType: lease.leaseTermType,
                    periodicBasis: lease.periodicBasis,
                    periodicOther: lease.periodicOther,
                    fixedEndCondition: lease.fixedEndCondition,
                    vacateReason: lease.vacateReason,
                });

                // Update lease with the PDF URL
                await leaseModel.update({
                    where: { id: invite.leaseId },
                    data: { contractPdfUrl },
                });

                console.log('Contract PDF generated after signing:', contractPdfUrl);
            } catch (pdfError) {
                console.error('Failed to generate contract PDF after signing:', pdfError);
                // Continue without PDF - don't fail the signing process
            }
        }

        // Update the associated listing status to RENTED
        if (lease.listingId) {
            await prisma.listing.update({
                where: { id: lease.listingId },
                data: { status: "RENTED" },
            });
        }

        // Create notification for landlord about lease signing
        try {
            const { createLeaseSignedNotification } = await import("../services/notificationService.js");
            const landlordId = lease.listing?.landlordId || lease.landlordId;
            const tenantName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Tenant";
            
            console.log(`📧 Lease signing notification - Lease ID: ${lease.id}`);
            console.log(`📧 Lease signing notification - Lease data:`, {
                id: lease.id,
                listingId: lease.listingId,
                listing: lease.listing ? {
                    id: lease.listing.id,
                    title: lease.listing.title,
                    streetAddress: lease.listing.streetAddress,
                    landlordId: lease.listing.landlordId,
                } : null,
                landlordId: lease.landlordId,
                leaseStatus: updatedLease.leaseStatus, // Use updated status
                leaseType: invite.leaseType,
            });
            console.log(`📧 Landlord ID from lease: ${landlordId}`);
            
            if (landlordId) {
                console.log(`📧 Creating lease signed notification for landlord: ${landlordId}`);
                const notification = await createLeaseSignedNotification(
                    { 
                        ...lease, 
                        ...updatedLease, // Include updated fields
                        leaseType: invite.leaseType,
                        leaseStatus: updatedLease.leaseStatus || "ACTIVE" // Ensure we use the updated status
                    },
                    landlordId,
                    tenantName
                );
                console.log(`✅ Lease signed notification created successfully for landlord: ${landlordId}, notificationId: ${notification?.id}`);
            } else {
                console.error("⚠️ No landlordId found for lease signed notification");
                console.error("⚠️ Lease listing data:", JSON.stringify(lease.listing, null, 2));
                console.error("⚠️ Lease landlordId:", lease.landlordId);
            }
        } catch (error) {
            // Log error but don't fail the lease signing
            console.error("❌ Error creating lease signed notification:", error);
            console.error("❌ Error message:", error.message);
            console.error("❌ Error stack:", error.stack);
        }

        res.json({ message: "Lease signed successfully", lease: updatedLease });
    } catch (err) {
        console.error("Error signing lease:", err);
        res.status(500).json({ message: "Error signing lease", error: err.message });
    }
};




