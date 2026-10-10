import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Generate a filled BC Residential Tenancy Agreement PDF
 * @param {Object} leaseData - Lease information
 * @returns {Promise<String>} - S3 URL of the generated PDF
 */
export const generateLeaseContractPDF = async (leaseData) => {
    try {
        console.log('📄 Starting PDF generation with data:', {
            tenant: leaseData.tenantFullName,
            tenantPhone: leaseData.tenantPhone,
            tenantOtherPhone: leaseData.tenantOtherPhone,
            tenantEmail: leaseData.tenantEmail,
            landlord: leaseData.landlordFullName,
            property: leaseData.propertyAddress,
            unitNumber: leaseData.unitNumber,
            rent: leaseData.rentAmount,
        });

        // Download the BC residential tenancy form template
        const templateUrl = 'https://www2.gov.bc.ca/assets/gov/housing-and-tenancy/residential-tenancies/forms/rtb1_chrome.pdf';
        const templateResponse = await axios.get(templateUrl, { responseType: 'arraybuffer' });
        const templateBytes = templateResponse.data;

        // Load the PDF
        const pdfDoc = await PDFDocument.load(templateBytes);
        
        // Get the form
        const form = pdfDoc.getForm();
        
        try {
            // Get all form fields (for debugging)
            const fields = form.getFields();
            console.log(`Found ${fields.length} form fields in BC tenancy agreement`);

            // Helper function to safely set text field
            const setTextField = (fieldName, value) => {
                try {
                    if (value) {
                        const field = form.getTextField(fieldName);
                        field.setText(String(value));
                    }
                } catch (err) {
                    console.log(`Could not set field "${fieldName}":`, err.message);
                }
            };

            // Helper function to check/uncheck a checkbox
            const checkBox = (fieldName, shouldCheck = true) => {
                try {
                    const field = form.getCheckBox(fieldName);
                    if (shouldCheck) {
                        field.check();
                    } else {
                        field.uncheck();
                    }
                } catch (err) {
                    console.log(`Could not ${shouldCheck ? 'check' : 'uncheck'} field "${fieldName}":`, err.message);
                }
            };

            // === LANDLORD INFORMATION ===
            // Section: "the LANDLORD(S)"
            console.log('Filling landlord info:', leaseData.landlordFullName, leaseData.landlordEmail, leaseData.landlordPhone);
            
            if (leaseData.landlordFullName) {
                const nameParts = leaseData.landlordFullName.trim().split(/\s+/);
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
                const firstMiddle = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
                
                console.log('Landlord name parts:', { lastName, firstMiddle });
                // Landlord 1 name fields
                setTextField('last name', lastName);
                setTextField('first and middle names', firstMiddle);
                
                // Landlord signature field - put the full name here
                setTextField('Signature landlord', leaseData.landlordFullName);
                console.log('✓ Set landlord signature:', leaseData.landlordFullName);
            }

            // Landlord contact info
            // Note: LL email 1 (field 121) appears in the service section, not landlord contact section
            // We set it here and it will appear in both places if the PDF uses the same field
            if (leaseData.landlordEmail) {
                console.log('Setting landlord email (LL email 1):', leaseData.landlordEmail);
                setTextField('LL email 1', leaseData.landlordEmail); // Field 121 - appears in service section
            }
            
            // === TENANT INFORMATION ===
            // Section: "and the TENANT(S)"
            console.log('Filling tenant info:', leaseData.tenantFullName, leaseData.tenantEmail, leaseData.tenantPhone);
            
            if (leaseData.tenantFullName) {
                const nameParts = leaseData.tenantFullName.trim().split(/\s+/);
                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
                const firstMiddle = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
                
                console.log('Tenant name parts:', { lastName, firstMiddle });
                // Tenant 1 name fields
                setTextField('last name_3', lastName);
                setTextField('first and middle names_3', firstMiddle);
                
                // Tenant signature field - try common signature field names
                // Based on the field list, tenant signature fields might be around fields 58-66
                setTextField('first and middle names_7', leaseData.tenantFullName);
                console.log('✓ Set tenant signature:', leaseData.tenantFullName);
            }

            // === TENANT CONTACT INFORMATION ===
            // Based on test PDF field positions:
            // Field 11 (undefined_2) = tenant phone
            // Field 119 (TT email 1) = tenant email
            // Field 13 (undefined_3) = tenant other phone
            // Field 120 (TT email 2) = tenant other email
            
            if (leaseData.tenantPhone) {
                console.log('Setting tenant phone:', leaseData.tenantPhone);
                setTextField('undefined_2', leaseData.tenantPhone); // Field 11 - tenant phone
            }
            
            if (leaseData.tenantEmail) {
                console.log('Setting tenant email:', leaseData.tenantEmail);
                setTextField('TT email 1', leaseData.tenantEmail); // Field 119 - tenant email
            }
            
            if (leaseData.tenantOtherPhone) {
                console.log('Setting tenant other phone:', leaseData.tenantOtherPhone);
                setTextField('undefined_3', leaseData.tenantOtherPhone); // Field 13 - tenant other phone
            }
            
            if (leaseData.tenantOtherEmail) {
                console.log('Setting tenant other email:', leaseData.tenantOtherEmail);
                setTextField('TT email 2', leaseData.tenantOtherEmail); // Field 120 - tenant other email
            }
            
            // === ADDRESS FOR SERVICE SECTION ===
            console.log('Setting address for service - landlord');
            
            // Explicitly uncheck "landlord's agent" and check "landlord"
            try {
                const field14 = form.getCheckBox('ADDRESS FOR SERVICE of the');
                const field15 = form.getCheckBox('landlord');
                
                console.log('Before: Field 14 (agent) checked:', field14.isChecked());
                console.log('Before: Field 15 (landlord) checked:', field15.isChecked());
                
                // First check "landlord"
                field15.check();
                console.log('After checking field 15:', field15.isChecked());
                
                // Then uncheck "landlord's agent"
                field14.uncheck();
                console.log('After unchecking field 14:', field14.isChecked());
                
                console.log('✓ Set landlord checkbox (unchecked agent)');
            } catch (err) {
                console.log('❌ Error setting service address checkboxes:', err.message);
            }
            
            // ADDRESS FOR SERVICE section
            // Field 16 = unitsite
            // Field 17 = street number and street name_2
            // Field 83 = City1
            // Field 84 = Province1
            // Field 85 = Postalcode1
            if (leaseData.unitNumber) {
                setTextField('unitsite', leaseData.unitNumber); // Service address unit (field 16)
            }
            
            if (leaseData.propertyAddress) {
                setTextField('street number and street name_2', leaseData.propertyAddress); // Field 17 ✓
            }
            
            if (leaseData.propertyCity) {
                setTextField('City1', leaseData.propertyCity); // Field 83 ✓
            }
            
            if (leaseData.propertyState) {
                setTextField('Province1', leaseData.propertyState); // Field 84 ✓
            }
            
            if (leaseData.propertyZipCode) {
                setTextField('Postalcode1', leaseData.propertyZipCode); // Field 85 ✓
            }
            
            // Service contact (landlord) - Fields 19, 21, 121 in service section
            if (leaseData.landlordPhone) {
                console.log('Setting service daytime phone:', leaseData.landlordPhone);
                setTextField('undefined_4', leaseData.landlordPhone); // Field 19 - service daytime phone
                setTextField('undefined_5', leaseData.landlordPhone); // Field 21 - service other phone
            }
            
            if (leaseData.landlordEmail) {
                console.log('Setting service email (LL email 1):', leaseData.landlordEmail);
                // LL email 1 appears in service section (field 121)
                // This will be set globally for landlord
            }

            // === RENTAL UNIT ADDRESS ===
            // Section: "ADDRESS OF PLACE BEING RENTED TO TENANT(s)"
            // Correct field names from PDF inspection:
            // Field 74 = unit #
            // Field 75 = street number and street name1
            // Field 76 = city2
            // Field 77 = province2
            // Field 78 = postal code2
            console.log('Filling rental unit address:', {
                unit: leaseData.unitNumber,
                street: leaseData.propertyAddress,
                city: leaseData.propertyCity,
                province: leaseData.propertyState,
                postal: leaseData.propertyZipCode
            });
            
            console.log('Unit number value:', leaseData.unitNumber, 'Type:', typeof leaseData.unitNumber, 'Length:', leaseData.unitNumber?.length);
            if (leaseData.unitNumber && leaseData.unitNumber.trim()) {
                console.log('Setting rental unit number:', leaseData.unitNumber);
                setTextField('unit #', leaseData.unitNumber); // Field 74 ✓
                console.log('✓ Set unit # field');
            } else {
                console.log('⚠️  Unit number is empty, undefined, or whitespace!', { received: leaseData.unitNumber });
            }
            
            if (leaseData.propertyAddress) {
                setTextField('street number and street name1', leaseData.propertyAddress); // Field 75 ✓
            }
            
            if (leaseData.propertyCity) {
                setTextField('city2', leaseData.propertyCity); // Field 76 ✓
            }
            
            if (leaseData.propertyState) {
                setTextField('province2', leaseData.propertyState); // Field 77 ✓
            }
            
            if (leaseData.propertyZipCode) {
                setTextField('postal code2', leaseData.propertyZipCode); // Field 78 ✓
            }

            // === LEASE START AND END DATES ===
            if (leaseData.startDate) {
                const startDate = new Date(leaseData.startDate);
                setTextField('This tenancy created by this agreement starts on', startDate.getDate().toString());
                setTextField('month1', (startDate.getMonth() + 1).toString());
                setTextField('year1', startDate.getFullYear().toString());
            }

            // End date (for fixed term - option C)
            if (leaseData.endDate) {
                const endDate = new Date(leaseData.endDate);
                // For option C) Fixed term ending date
                setTextField('This tenancy created by this agreement ends on', endDate.getDate().toString()); // Field 71 - Fixed term end day
                setTextField('month2', (endDate.getMonth() + 1).toString()); // Field 72 - Fixed term end month
                setTextField('year2', endDate.getFullYear().toString()); // Field 73 - Fixed term end year
                console.log('Set fixed term end date:', endDate.toLocaleDateString());
            }

            // === RENT AMOUNT ===
            if (leaseData.rentAmount) {
                setTextField('The tenant will pay the rent of', `$${leaseData.rentAmount.toFixed(2)}`);
            }

            // === LEASE TERM TYPE (A, B, or C) ===
            console.log('Setting lease term type:', leaseData.leaseTermType);
            if (leaseData.leaseTermType) {
                const termType = leaseData.leaseTermType.toUpperCase();
                
                if (termType === 'MONTH_TO_MONTH') {
                    // A) Month-to-month
                    checkBox('A and continues on a monthtomonth basis until ended in accordance with the Act');
                    console.log('✓ Checked A) Month-to-month');
                } else if (termType === 'YEAR_TO_YEAR') {
                    // B) Other periodic basis
                    checkBox('B and continues on another periodic basis as specified below until ended in accordance with the Act');
                    
                    // Check periodic basis sub-options (Fields 27-29)
                    console.log('Periodic basis value:', leaseData.periodicBasis);
                    if (leaseData.periodicBasis === 'weekly') {
                        checkBox('weekly'); // Field 27
                        console.log('✓ Checked weekly');
                    } else if (leaseData.periodicBasis === 'bi-weekly') {
                        checkBox('biweekly'); // Field 28
                        console.log('✓ Checked bi-weekly');
                    } else if (leaseData.periodicBasis === 'other') {
                        checkBox('other'); // Field 29
                        console.log('✓ Checked other');
                        if (leaseData.periodicOther) {
                            setTextField('undefined_7', leaseData.periodicOther); // Field 30
                            console.log('✓ Set other periodic text:', leaseData.periodicOther);
                        }
                    }
                    console.log('✓ Checked B) Other periodic:', leaseData.periodicBasis);
                } else if (termType === 'LONG_TERM') {
                    // C) Fixed term
                    checkBox('C and is for a fixed term ending on');
                    console.log('✓ Checked C) Fixed term');
                    
                    // If fixed term, check D or E based on fixedEndCondition
                    console.log('Fixed end condition:', leaseData.fixedEndCondition);
                    if (leaseData.fixedEndCondition === 'continues') {
                        // D) Continues month-to-month
                        checkBox('D At the end of this time the tenancy will continue on a monthtomonth basis or another fixed length of');
                        console.log('✓ Checked D) Continues month-to-month');
                    } else if (leaseData.fixedEndCondition === 'ends') {
                        // E) Tenant must vacate
                        checkBox('E At the end of this time the tenancy is ended and the tenant must vacate the rental unit');
                        console.log('✓ Checked E) Tenant must vacate');
                        
                        // Fill vacate reason if provided
                        if (leaseData.vacateReason) {
                            setTextField('Reason tenant must vacate required', leaseData.vacateReason);
                            console.log('✓ Set vacate reason:', leaseData.vacateReason);
                        } else {
                            console.log('⚠️  Vacate reason is empty');
                        }
                    } else {
                        console.log('⚠️  No fixed end condition matched:', leaseData.fixedEndCondition);
                    }
                }
            }

            // === PAYMENT FREQUENCY (for rent payment frequency checkboxes) ===
            if (leaseData.paymentFrequency) {
                const freq = leaseData.paymentFrequency.toUpperCase();
                console.log('Setting payment frequency:', freq);
                
                if (freq === 'WEEKLY') {
                    // Check both weekly checkboxes
                    checkBox('week'); // Field 37 - first set
                    checkBox('week_2'); // Field 41 - second set
                    console.log('✓ Checked weekly payment frequency');
                } else if (freq === 'BI_WEEKLY') {
                    // BI_WEEKLY not directly supported in this form, default to weekly
                    checkBox('week');
                    checkBox('week_2');
                    console.log('✓ Checked weekly payment frequency (bi-weekly not available)');
                } else if (freq === 'DAILY') {
                    // Check both daily checkboxes
                    checkBox('day'); // Field 36 - first set
                    checkBox('day_2'); // Field 40 - second set
                    console.log('✓ Checked daily payment frequency');
                } else if (freq === 'MONTHLY') {
                    // Check both monthly checkboxes with FULL field names
                    checkBox('month to the landlord on'); // Field 38 - first set
                    checkBox('month subject to rent increases given in accordance with the RTA'); // Field 42 - second set
                    console.log('✓ Checked monthly payment frequency');
                }
            }

            // === PAYMENT DUE DATE ===
            if (leaseData.paymentDay) {
                setTextField('the first day of the rental period which falls on the due date eg 1st 2nd 3rd  31st', 
                    leaseData.paymentDay.toString());
            }

            // === SECURITY DEPOSIT ===
            if (leaseData.securityDeposit) {
                console.log('Setting security deposit:', leaseData.securityDeposit);
                // Security deposit amount goes in field 45 (section title field doubles as amount field)
                setTextField('4 SECURITY DEPOSIT AND PET DAMAGE DEPOSIT', leaseData.securityDeposit.toFixed(2));
                console.log('✓ Set security deposit amount in field 45:', leaseData.securityDeposit.toFixed(2));
                if (leaseData.securityDepositDueDate) {
                    const dueDate = new Date(leaseData.securityDepositDueDate);
                    console.log('Security deposit due date:', dueDate.toLocaleDateString());
                    // Day goes in field 46, month/year in fields 79/80
                    setTextField('The tenant is required to pay a security deposit of', dueDate.getDate().toString());
                    setTextField('month3', (dueDate.getMonth() + 1).toString());
                    setTextField('year3', dueDate.getFullYear().toString());
                    console.log('✓ Set security deposit date (day/month/year)');
                }
            }

            // === PET DEPOSIT ===
            if (leaseData.petDeposit) {
                console.log('Setting pet deposit:', leaseData.petDeposit);
                // Pet deposit amount goes in field 49 (undefined_8)
                setTextField('undefined_8', leaseData.petDeposit.toFixed(2));
                console.log('✓ Set pet deposit amount in field 49:', leaseData.petDeposit.toFixed(2));
                // Uncheck "not applicable" since a pet deposit is provided
                checkBox('not applicable', false);
                console.log('✓ Unchecked "not applicable"');
                if (leaseData.petDepositDueDate) {
                    const dueDate = new Date(leaseData.petDepositDueDate);
                    console.log('Pet deposit due date:', dueDate.toLocaleDateString());
                    // Day goes in field 48, month/year in fields 81/82
                    setTextField('The tenant is required to pay a pet damage deposit of', dueDate.getDate().toString());
                    setTextField('month4', (dueDate.getMonth() + 1).toString());
                    setTextField('year4', dueDate.getFullYear().toString());
                    console.log('✓ Set pet deposit date (day/month/year)');
                }
            } else {
                // No pet deposit provided, check "not applicable"
                console.log('No pet deposit, checking "not applicable"');
                checkBox('not applicable', true);
                console.log('✓ Checked "not applicable"');
            }

            // === PARKING ===
            if (leaseData.parkingSpaces) {
                setTextField('Parking for', `${leaseData.parkingSpaces} vehicle(s)`);
            }

            // === INCLUDED SERVICES ===
            if (leaseData.includedServices && Array.isArray(leaseData.includedServices)) {
                leaseData.includedServices.forEach(service => {
                    const serviceUpper = service.toUpperCase();
                    if (serviceUpper.includes('WATER')) checkBox('water');
                    if (serviceUpper.includes('GAS')) checkBox('natural gas');
                    if (serviceUpper.includes('ELECTRIC')) checkBox('Electricity');
                    if (serviceUpper.includes('HEAT')) checkBox('Heat');
                    if (serviceUpper.includes('GARBAGE')) checkBox('Garbage collection');
                    if (serviceUpper.includes('RECYCLE')) checkBox('Recycling Services');
                    if (serviceUpper.includes('CABLE')) checkBox('Cabblevision');
                    if (serviceUpper.includes('INTERNET')) checkBox('Internet');
                    if (serviceUpper.includes('LAUNDRY')) checkBox('Laundry');
                    if (serviceUpper.includes('PARKING')) checkBox('Parking');
                    if (serviceUpper.includes('STORAGE')) checkBox('Storage');
                });
            }

            console.log('✅ PDF form fields filled successfully');

            // Flatten the form (make it non-editable)
            form.flatten();
            
        } catch (formError) {
            console.log('Form fields not found or not fillable, will add data as text overlay');
            
            // If the PDF doesn't have fillable fields, add text overlay
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Add lease information as text overlay on the first page
            let yPosition = height - 150;
            const leftMargin = 50;
            const fontSize = 10;
            const lineHeight = 15;

            const addText = (text, isBold = false) => {
                firstPage.drawText(text, {
                    x: leftMargin,
                    y: yPosition,
                    size: fontSize,
                    font: isBold ? boldFont : font,
                    color: rgb(0, 0, 0),
                });
                yPosition -= lineHeight;
            };

            // Add a header
            addText('RESIDENTIAL TENANCY AGREEMENT', true);
            yPosition -= 10;

            // Property Information
            if (leaseData.propertyAddress) {
                addText(`Property Address: ${leaseData.propertyAddress}`);
            }

            yPosition -= 5;

            // Landlord Information
            addText('Landlord Information:', true);
            if (leaseData.landlordFullName) addText(`Name: ${leaseData.landlordFullName}`);
            if (leaseData.landlordAddress) addText(`Address: ${leaseData.landlordAddress}`);
            if (leaseData.landlordPhone) addText(`Phone: ${leaseData.landlordPhone}`);
            if (leaseData.landlordEmail) addText(`Email: ${leaseData.landlordEmail}`);

            yPosition -= 5;

            // Tenant Information
            addText('Tenant Information:', true);
            if (leaseData.tenantFullName) addText(`Name: ${leaseData.tenantFullName}`);
            if (leaseData.tenantPhone) addText(`Phone: ${leaseData.tenantPhone}`);
            if (leaseData.tenantEmail) addText(`Email: ${leaseData.tenantEmail}`);

            yPosition -= 5;

            // Lease Terms
            addText('Lease Terms:', true);
            if (leaseData.startDate) {
                addText(`Start Date: ${new Date(leaseData.startDate).toLocaleDateString()}`);
            }
            if (leaseData.endDate) {
                addText(`End Date: ${new Date(leaseData.endDate).toLocaleDateString()}`);
            }
            if (leaseData.rentAmount) {
                addText(`Rent Amount: $${leaseData.rentAmount.toFixed(2)}`);
            }
            if (leaseData.paymentFrequency) {
                addText(`Payment Frequency: ${leaseData.paymentFrequency}`);
            }
            if (leaseData.securityDeposit) {
                addText(`Security Deposit: $${leaseData.securityDeposit.toFixed(2)}`);
            }
        }

        // Save the PDF
        const pdfBytes = await pdfDoc.save();

        // Upload to S3
        const fileName = `lease-contracts/${uuidv4()}-${Date.now()}.pdf`;
        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: Buffer.from(pdfBytes),
            ContentType: 'application/pdf',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Return the S3 URL
        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        
        console.log('Contract PDF generated and uploaded:', s3Url);
        return s3Url;

    } catch (error) {
        console.error('Error generating contract PDF:', error);
        throw new Error(`Failed to generate contract PDF: ${error.message}`);
    }
};

