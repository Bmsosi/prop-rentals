import cron from "node-cron";
import {
  getExpiringInsurances,
  getExpiredInsurances,
  updateInsuranceStatus,
} from "../services/insuranceService.js";
import {
  createInsuranceExpiringNotification,
  createInsuranceExpiredNotification,
} from "../services/notificationService.js";
import {
  sendInsuranceExpiringEmail,
  sendInsuranceExpiredEmail,
} from "../services/emailService.js";

async function checkInsuranceExpiry() {
  console.log("Running insurance expiry check...");

  try {
    const expiringInsurances = await getExpiringInsurances(30);

    for (const insurance of expiringInsurances) {
      const daysUntilExpiry = Math.floor(
        (new Date(insurance.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (insurance.status !== "EXPIRING_SOON") {
        await updateInsuranceStatus(insurance.id, "EXPIRING_SOON");
        console.log(
          `Marked insurance ${insurance.id} as EXPIRING_SOON (${daysUntilExpiry} days)`
        );
      }

      const tenantName = insurance.tenant?.firstName && insurance.tenant?.lastName
        ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}`
        : "Tenant";

      const landlord = insurance.lease?.landlord || insurance.customLease?.landlord;

      try {
        await createInsuranceExpiringNotification(
          insurance,
          insurance.tenantId
        );
        await sendInsuranceExpiringEmail(
          insurance,
          insurance.tenant.email,
          tenantName,
          daysUntilExpiry
        );
        console.log(`Sent expiring notification to tenant: ${insurance.tenant.email}`);
      } catch (error) {
        console.error(
          `Failed to notify tenant ${insurance.tenantId}:`,
          error.message
        );
      }

      if (landlord) {
        const landlordName = landlord.firstName && landlord.lastName
          ? `${landlord.firstName} ${landlord.lastName}`
          : "Landlord";

        try {
          await createInsuranceExpiringNotification(insurance, landlord.id);
          await sendInsuranceExpiringEmail(
            insurance,
            landlord.email,
            landlordName,
            daysUntilExpiry
          );
          console.log(`Sent expiring notification to landlord: ${landlord.email}`);
        } catch (error) {
          console.error(
            `Failed to notify landlord ${landlord.id}:`,
            error.message
          );
        }
      }
    }

    const expiredInsurances = await getExpiredInsurances();

    for (const insurance of expiredInsurances) {
      await updateInsuranceStatus(insurance.id, "EXPIRED");
      console.log(`Marked insurance ${insurance.id} as EXPIRED`);

      const tenantName = insurance.tenant?.firstName && insurance.tenant?.lastName
        ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}`
        : "Tenant";

      const landlord = insurance.lease?.landlord || insurance.customLease?.landlord;

      try {
        await createInsuranceExpiredNotification(
          insurance,
          insurance.tenantId
        );
        await sendInsuranceExpiredEmail(
          insurance,
          insurance.tenant.email,
          tenantName
        );
        console.log(`Sent expired notification to tenant: ${insurance.tenant.email}`);
      } catch (error) {
        console.error(
          `Failed to notify tenant ${insurance.tenantId}:`,
          error.message
        );
      }

      if (landlord) {
        const landlordName = landlord.firstName && landlord.lastName
          ? `${landlord.firstName} ${landlord.lastName}`
          : "Landlord";

        try {
          await createInsuranceExpiredNotification(insurance, landlord.id);
          await sendInsuranceExpiredEmail(
            insurance,
            landlord.email,
            landlordName
          );
          console.log(`Sent expired notification to landlord: ${landlord.email}`);
        } catch (error) {
          console.error(
            `Failed to notify landlord ${landlord.id}:`,
            error.message
          );
        }
      }
    }

    console.log(
      `Insurance expiry check completed. Expiring: ${expiringInsurances.length}, Expired: ${expiredInsurances.length}`
    );
  } catch (error) {
    console.error("Error during insurance expiry check:", error);
  }
}

export function startInsuranceCronJob() {
  cron.schedule("0 0 * * *", async () => {
    console.log("Starting scheduled insurance expiry check at midnight");
    await checkInsuranceExpiry();
  });

  console.log("Insurance expiry cron job initialized (runs daily at midnight)");
}

export { checkInsuranceExpiry };

