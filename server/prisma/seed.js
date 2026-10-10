import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/*
==========================================
🏠 RENTAL MANAGEMENT SEED DATA GUIDE
==========================================

📊 OVERVIEW:
This file creates realistic demo data for the rental management system.
All passwords are: "password123"

⚡ QUICK REFERENCE - CRITICAL RULES:
┌────────────────────────────────────────────────────────┐
│ APPLICATIONS:                                          │
│  ✓ PENDING = tenantId NULL (no account, shows N/A)   │
│  ✓ NEW/APPROVED/REJECTED = tenantId assigned         │
│                                                        │
│ LEASES:                                                │
│  ✓ DRAFT = tenantId NULL (shows "No tenant assigned")│
│  ✓ ACTIVE = tenantId assigned (tenant signed)        │
│  ✓ One tenant = ONE ACTIVE lease maximum             │
│  ✓ One listing = ONE lease maximum                   │
│                                                        │
│ TENANT WITH ACTIVE LEASE:                              │
│  ⚠️ CANNOT sign another lease (backend blocks it)     │
│  ⚠️ Can still apply (for testing edge cases)          │
└────────────────────────────────────────────────────────┘

👥 USERS:
- 3 Landlords (ADMIN role)
- 5 Tenants (TENANT role)
  • 3 tenants WITH active leases (Jane, Mike, Emma)
  • 2 tenants WITHOUT leases (Alex, Sophia) - for application testing

🏠 LISTINGS:
- 20 properties with unique images
- Mix of apartments, houses, condos
- Different landlords own different properties

📋 APPLICATIONS (Application Status Flow):
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│ PENDING │ →   │   NEW   │ →   │ APPROVED │ →   │  Lease   │
└─────────┘     └─────────┘     └──────────┘     │  Signed  │
    ↓                 ↓               ↓           └──────────┘
No tenant        Has tenant     Ready to send      ACTIVE
account          assigned        lease to          Lease
                                 tenant
    
⚠️ KEY RULES:
- PENDING: tenantId = NULL (unassigned, no account)
- NEW/APPROVED/REJECTED: tenantId assigned
- If tenant has ACTIVE lease: CANNOT sign another lease

📜 LEASES (Standard & Custom):
┌──────────┐     ┌──────────┐     ┌─────────┐
│  DRAFT   │ →   │  Sent to │ →   │ ACTIVE  │
│  Created │     │  Tenant  │     │ Signed  │
└──────────┘     └──────────┘     └─────────┘

⚠️ CRITICAL RULES:
1. One listing = ONE lease max (standard OR custom, not both)
2. One tenant = ONE ACTIVE lease max at a time (enforced in backend)
3. Tenants can have multiple DRAFT leases (not signed yet)
4. ACTIVE lease → listing status becomes "RENTED"
5. DRAFT lease → listing status remains "ACTIVE"
6. If tenant tries to sign 2nd lease → Backend returns error

💰 PAYMENTS:
- Automatically generated for ACTIVE leases
- Monthly rent payments
- Some maintenance-related payments

🔧 MAINTENANCE:
- Various priority levels
- Different statuses (OPEN, IN_PROGRESS, COMPLETED)
- Some have invoices linked

🧾 INVOICES:
- Linked to maintenance requests
- Create corresponding MAINTENANCE payments
- Status synced with payments

==========================================
*/

async function main() {
  console.log("Starting database seeding...\n");

  console.log("Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.maintenanceMessage.deleteMany();
  await prisma.maintenanceImage.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.employmentInfo.deleteMany();
  await prisma.requestApplication.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.leaseInvite.deleteMany();
  await prisma.customLease.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenantInsurance.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listingAmenity.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("👥 Creating users (5 tenants + 3 landlords)...");

  const landlord1 = await prisma.user.create({
    data: {
      email: "landlord@test.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Landlord",
      role: "ADMIN",
      phone: "+1 (555) 010-1001",
      profileImage: "https://i.pravatar.cc/150?img=12",
    },
  });

  const landlord2 = await prisma.user.create({
    data: {
      email: "sarah.property@test.com",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Property",
      role: "ADMIN",
      phone: "+1 (555) 020-1002",
      profileImage: "https://i.pravatar.cc/150?img=5",
    },
  });

  const landlord3 = await prisma.user.create({
    data: {
      email: "david.estates@test.com",
      password: hashedPassword,
      firstName: "David",
      lastName: "Estates",
      role: "ADMIN",
      phone: "+1 (555) 030-1003",
      profileImage: "https://i.pravatar.cc/150?img=13",
    },
  });

  // Create tenants: 3 with active leases + 2 without leases (for applications)
  const tenants = [];
  const tenantData = [
    // Tenants WITH active leases (will NOT appear in applications)
    { email: "tenant@test.com", firstName: "Jane", lastName: "Tenant", img: 1, hasLease: true },
    { email: "mike.renter@test.com", firstName: "Mike", lastName: "Renter", img: 15, hasLease: true },
    { email: "emma.wilson@test.com", firstName: "Emma", lastName: "Wilson", img: 9, hasLease: true },
    // Tenants WITHOUT active leases (CAN appear in applications)
    { email: "alex.tenant@test.com", firstName: "Alex", lastName: "Anderson", img: 7, hasLease: false },
    { email: "sophia.resident@test.com", firstName: "Sophia", lastName: "Chen", img: 10, hasLease: false },
  ];

  for (let i = 0; i < tenantData.length; i++) {
    const tenant = await prisma.user.create({
      data: {
        email: tenantData[i].email,
        password: hashedPassword,
        firstName: tenantData[i].firstName,
        lastName: tenantData[i].lastName,
        role: "TENANT",
        phone: `+1 (555) ${String(i + 100).padStart(3, '0')}-200${i}`,
        profileImage: `https://i.pravatar.cc/150?img=${tenantData[i].img}`,
      },
    });
    tenants.push(tenant);
  }

  console.log("🏠 Creating 30+ listings...");

  // Different property images for each listing type (3 images per listing)
  const propertyImages = [
    // 0 - Modern Apartment
    ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
    // 1 - Suburban House
    ["https://images.unsplash.com/photo-1568605114967-8130f3a36994", "https://images.unsplash.com/photo-1570129477492-45c003edd2be", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
    // 2 - Luxury Condo
    ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750", "https://images.unsplash.com/photo-1600607687644-c7171b42498b"],
    // 3 - Victorian Townhouse
    ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d"],
    // 4 - Studio
    ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1", "https://images.unsplash.com/photo-1586023492125-27b2c045efd7"],
    // 5 - Loft
    ["https://images.unsplash.com/photo-1536376072261-38c75010e6c9", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600573472550-8090b5e0745e"],
    // 6 - Family Home
    ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6", "https://images.unsplash.com/photo-1600607687644-c7171b42498b", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d"],
    // 7 - Beachfront Condo
    ["https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde"],
    // 8 - Garden Apartment
    ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1560440021-33f9b867899d", "https://images.unsplash.com/photo-1600585154526-990dced4db0d"],
    // 9 - High-rise Condo
    ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde", "https://images.unsplash.com/photo-1600607687644-c7171b42498b", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"],
    // 10 - Penthouse
    ["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea", "https://images.unsplash.com/photo-1600573472592-401b489837a2", "https://images.unsplash.com/photo-1600047509358-9dc75507daeb"],
    // 11 - Cottage
    ["https://images.unsplash.com/photo-1600585154526-990dced4db0d", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"],
    // 12 - Downtown Loft
    ["https://images.unsplash.com/photo-1600573472550-8090b5e0745e", "https://images.unsplash.com/photo-1600047509358-9dc75507daeb", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9"],
    // 13 - Townhome
    ["https://images.unsplash.com/photo-1600585154363-67eb9e2e2099", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
    // 14 - Ranch House
    ["https://images.unsplash.com/photo-1600607687644-afd7c1e5d2f0", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"],
    // 15 - Urban Apartment
    ["https://images.unsplash.com/photo-1600573472549-e4c4f7d9b87c", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"],
    // 16 - Country Home
    ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", "https://images.unsplash.com/photo-1600607687644-afd7c1e5d2f0"],
    // 17 - Modern Loft
    ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1536376072261-38c75010e6c9", "https://images.unsplash.com/photo-1600573472550-8090b5e0745e"],
    // 18 - Duplex
    ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9", "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099"],
    // 19 - Executive Suite
    ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
    // 20 - Modern Studio
    ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1"],
    // 21 - Spacious Apartment
    ["https://images.unsplash.com/photo-1600607687644-c7171b42498b", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600573472549-e4c4f7d9b87c"],
    // 22 - Luxury Apartment
    ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00"],
    // 23 - Cozy Condo
    ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3", "https://images.unsplash.com/photo-1600573472549-e4c4f7d9b87c", "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde"],
    // 24 - Modern Townhouse
    ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9", "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099"],
    // 25 - Elegant Home
    ["https://images.unsplash.com/photo-1600607687644-afd7c1e5d2f0", "https://images.unsplash.com/photo-1600585154526-990dced4db0d", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"],
    // 26 - Contemporary Apartment
    ["https://images.unsplash.com/photo-1600573472550-8090b5e0745e", "https://images.unsplash.com/photo-1600047509358-9dc75507daeb", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c"],
    // 27 - Classic Condo
    ["https://images.unsplash.com/photo-1600585154363-67eb9e2e2099", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3"],
    // 28 - Modern Family Home
    ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6", "https://images.unsplash.com/photo-1600607687644-c7171b42498b", "https://images.unsplash.com/photo-1600607687644-afd7c1e5d2f0"],
    // 29 - Urban Loft
    ["https://images.unsplash.com/photo-1536376072261-38c75010e6c9", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", "https://images.unsplash.com/photo-1600573472550-8090b5e0745e"],
  ];

  const listings = [];
  const listingData = [
    {
      landlord: landlord1,
      title: "Modern Downtown Apartment",
      type: "APARTMENT",
      beds: 2, baths: 2, sqft: 1200, year: 2020,
      street: "123 Main St, Apt 4B", city: "Vancouver", state: "BC", zip: "V6B 1S2",
      rent: 3500, deposit: 3500, petDeposit: 500,
      status: "RENTED",
      desc: "Beautiful modern apartment in downtown with stunning city views. Features include hardwood floors, granite countertops, and stainless steel appliances. Walking distance to shops, restaurants, and public transit.",
      amenities: ["Gym", "Swimming Pool", "Parking", "Elevator", "In-unit Laundry", "Air Conditioning", "Dishwasher"],
    },
    {
      landlord: landlord1,
      title: "Cozy Suburban House",
      type: "SINGLE_FAMILY",
      beds: 3, baths: 2, sqft: 1800, year: 2015,
      street: "456 Oak Ave", city: "Toronto", state: "ON", zip: "M5V 2Y1",
      rent: 4200, deposit: 4200, petDeposit: 0,
      status: "ACTIVE",
      desc: "Spacious family home in quiet neighborhood with large backyard and modern updates. Perfect for families with children or pets. Recently renovated kitchen and bathrooms.",
      amenities: ["Backyard", "Garage", "Fireplace", "Central Heating", "Dishwasher"],
    },
    {
      landlord: landlord1,
      title: "Luxury Condo with Bay View",
      type: "CONDO",
      beds: 2, baths: 2.5, sqft: 1400, year: 2021,
      street: "789 Bay View Blvd, Unit 12", city: "Vancouver", state: "BC", zip: "V6B 1S2",
      rent: 4800, deposit: 4800, petDeposit: 0,
      status: "ACTIVE",
      desc: "Stunning luxury condo with panoramic bay views. Floor-to-ceiling windows, high-end finishes, and access to building amenities including concierge service.",
      amenities: ["Concierge", "Pool", "Gym", "Parking", "Balcony", "In-unit Laundry", "Air Conditioning"],
    },
    {
      landlord: landlord2,
      title: "Charming Victorian Townhouse",
      type: "TOWNHOUSE",
      beds: 3, baths: 2.5, sqft: 2000, year: 1905,
      street: "321 Heritage Lane", city: "Montréal", state: "QC", zip: "H3G 0A2",
      rent: 5200, deposit: 5200, petDeposit: 750,
      status: "RENTED",
      desc: "Historic Victorian townhouse with original details and modern amenities. Three stories with hardwood floors, crown molding, and a private patio.",
      amenities: ["Patio", "Fireplace", "Hardwood Floors", "Updated Kitchen", "Parking"],
    },
    {
      landlord: landlord2,
      title: "Studio in Downtown Core",
      type: "STUDIO",
      beds: 0, baths: 1, sqft: 500, year: 2018,
      street: "555 Main St, #203", city: "Toronto", state: "ON", zip: "M5V 2Y1",
      rent: 2200, deposit: 2200, petDeposit: 0,
      status: "ACTIVE",
      desc: "Efficient studio in the heart of downtown. Perfect for young professionals. Recently renovated with modern appliances.",
      amenities: ["In-unit Laundry", "Hardwood Floors", "Air Conditioning"],
    },
    {
      landlord: landlord2,
      title: "Spacious 4BR Family Home",
      type: "SINGLE_FAMILY",
      beds: 4, baths: 3, sqft: 2500, year: 2010,
      street: "890 Elm Street", city: "Calgary", state: "AB", zip: "T2P 0Y3",
      rent: 5500, deposit: 5500, petDeposit: 1000,
      status: "RENTED",
      desc: "Large family home with spacious rooms, updated kitchen, and beautiful backyard. Close to schools and parks.",
      amenities: ["Backyard", "Garage", "Central AC", "Fireplace", "Dishwasher", "Laundry Room"],
    },
    {
      landlord: landlord1,
      title: "Modern Loft in Downtown",
      type: "APARTMENT",
      beds: 1, baths: 1, sqft: 900, year: 2019,
      street: "234 King St, #5A", city: "Toronto", state: "ON", zip: "M5V 2Y1",
      rent: 3800, deposit: 3800, petDeposit: 0,
      status: "ACTIVE",
      desc: "Industrial-style loft with exposed brick, high ceilings, and modern finishes. Perfect for creative professionals.",
      amenities: ["High Ceilings", "Exposed Brick", "In-unit Laundry", "Gym", "Roof Deck"],
    },
    {
      landlord: landlord3,
      title: "Penthouse Suite Downtown",
      type: "APARTMENT",
      beds: 3, baths: 3, sqft: 2200, year: 2022,
      street: "100 Bay St, Penthouse", city: "Toronto", state: "ON", zip: "M5J 2S4",
      rent: 7500, deposit: 7500, petDeposit: 0,
      status: "ACTIVE",
      desc: "Luxurious penthouse with 360-degree city views. Top-floor living with premium finishes and private elevator access.",
      amenities: ["Private Elevator", "Terrace", "Gym", "Concierge", "Parking", "In-unit Laundry", "Smart Home"],
    },
    {
      landlord: landlord3,
      title: "Garden Apartment with Patio",
      type: "APARTMENT",
      beds: 1, baths: 1, sqft: 750, year: 2017,
      street: "678 Green St, #1A", city: "Vancouver", state: "BC", zip: "V6B 1S2",
      rent: 2800, deposit: 2800, petDeposit: 500,
      status: "RENTED",
      desc: "Ground-floor apartment with private patio and garden access. Pet-friendly and quiet location.",
      amenities: ["Patio", "Garden Access", "Parking", "Storage", "Pet Friendly"],
    },
    {
      landlord: landlord1,
      title: "Renovated 2BR in Kitsilano",
      type: "APARTMENT",
      beds: 2, baths: 1, sqft: 1000, year: 2016,
      street: "456 West 4th Ave, #3B", city: "Vancouver", state: "BC", zip: "V6J 1M5",
      rent: 3200, deposit: 3200, petDeposit: 0,
      status: "ACTIVE",
      desc: "Freshly renovated 2-bedroom in quiet Kitsilano neighborhood. New kitchen and bathroom, hardwood floors throughout.",
      amenities: ["Hardwood Floors", "Updated Kitchen", "Storage", "Laundry in Building"],
    },
    {
      landlord: landlord2,
      title: "Executive Condo in Financial District",
      type: "CONDO",
      beds: 2, baths: 2, sqft: 1300, year: 2020,
      street: "200 Bay St, Unit 25", city: "Toronto", state: "ON", zip: "M5J 2J4",
      rent: 5000, deposit: 5000, petDeposit: 0,
      status: "RENTED",
      desc: "High-end condo perfect for executives. Walking distance to major offices and public transit.",
      amenities: ["Concierge", "Gym", "Pool", "Parking", "In-unit Laundry", "City Views"],
    },
    {
      landlord: landlord3,
      title: "Duplex with Water View",
      type: "MULTI_FAMILY",
      beds: 3, baths: 2, sqft: 1900, year: 2012,
      street: "789 Marine Dr", city: "Vancouver", state: "BC", zip: "V6P 1A1",
      rent: 4500, deposit: 4500, petDeposit: 750,
      status: "ACTIVE",
      desc: "Beautiful duplex with water views. Two-level living with private entrance and garage.",
      amenities: ["Water View", "Garage", "Backyard", "Fireplace", "Storage"],
    },
    {
      landlord: landlord1,
      title: "Budget-Friendly Studio",
      type: "STUDIO",
      beds: 0, baths: 1, sqft: 400, year: 2015,
      street: "111 Main St, #12", city: "Montréal", state: "QC", zip: "H3G 0A2",
      rent: 1800, deposit: 1800, petDeposit: 0,
      status: "ACTIVE",
      desc: "Affordable studio perfect for students or young professionals. Close to metro and nightlife.",
      amenities: ["Laundry in Building", "Bike Storage"],
    },
    {
      landlord: landlord2,
      title: "Contemporary Loft with Skylights",
      type: "APARTMENT",
      beds: 2, baths: 2, sqft: 1600, year: 2021,
      street: "345 Yonge St, #8C", city: "Toronto", state: "ON", zip: "M5B 1R8",
      rent: 4300, deposit: 4300, petDeposit: 0,
      status: "ACTIVE",
      desc: "Bright and airy loft with skylights and modern design. Open floor plan perfect for entertaining.",
      amenities: ["Skylights", "Open Floor Plan", "In-unit Laundry", "Parking", "Gym", "Roof Deck"],
    },
    {
      landlord: landlord3,
      title: "Classic 1BR in Downtown",
      type: "APARTMENT",
      beds: 1, baths: 1, sqft: 700, year: 1960,
      street: "987 Granville St, #4D", city: "Vancouver", state: "BC", zip: "V6Z 1L3",
      rent: 2600, deposit: 2600, petDeposit: 0,
      status: "RENTED",
      desc: "Classic apartment in prestigious downtown area. Well-maintained building with concierge service.",
      amenities: ["Concierge", "Elevator", "Laundry in Building", "Storage"],
    },
    {
      landlord: landlord1,
      title: "Waterfront Condo",
      type: "CONDO",
      beds: 2, baths: 2, sqft: 1250, year: 2018,
      street: "567 Harbourfront Dr, #15B", city: "Vancouver", state: "BC", zip: "V6B 1A1",
      rent: 5200, deposit: 5200, petDeposit: 0,
      status: "ACTIVE",
      desc: "Stunning waterfront condo with ocean views. Premium building with resort-style amenities.",
      amenities: ["Ocean Views", "Gym", "Pool", "Concierge", "Parking", "In-unit Laundry", "Storage"],
    },
    {
      landlord: landlord2,
      title: "Family House in Westmount",
      type: "SINGLE_FAMILY",
      beds: 4, baths: 3.5, sqft: 3000, year: 2005,
      street: "432 Westmount Ave", city: "Montréal", state: "QC", zip: "H3Y 1A1",
      rent: 8500, deposit: 8500, petDeposit: 1500,
      status: "RENTED",
      desc: "Elegant family home in exclusive Westmount. Large rooms, gourmet kitchen, and manicured garden.",
      amenities: ["Garden", "Garage", "Fireplace", "Central AC", "Updated Kitchen", "Hardwood Floors"],
    },
    {
      landlord: landlord3,
      title: "Converted Warehouse Loft",
      type: "APARTMENT",
      beds: 2, baths: 2, sqft: 1800, year: 2017,
      street: "890 King St W, #3", city: "Toronto", state: "ON", zip: "M5V 1J5",
      rent: 4600, deposit: 4600, petDeposit: 500,
      status: "ACTIVE",
      desc: "Unique warehouse conversion with industrial charm. High ceilings, exposed beams, and modern amenities.",
      amenities: ["High Ceilings", "Exposed Beams", "In-unit Laundry", "Parking", "Pet Friendly"],
    },
    {
      landlord: landlord1,
      title: "Affordable 2BR in East End",
      type: "APARTMENT",
      beds: 2, baths: 1, sqft: 950, year: 2010,
      street: "234 Commercial Dr, #2F", city: "Vancouver", state: "BC", zip: "V5L 3X1",
      rent: 2900, deposit: 2900, petDeposit: 0,
      status: "ACTIVE",
      desc: "Affordable 2-bedroom in family-friendly East End. Close to parks, shops, and restaurants.",
      amenities: ["Laundry in Building", "Storage", "Parking Available"],
    },
    {
      landlord: landlord2,
      title: "Designer Townhouse",
      type: "TOWNHOUSE",
      beds: 3, baths: 3, sqft: 2200, year: 2019,
      street: "567 Church St", city: "Toronto", state: "ON", zip: "M4Y 2E5",
      rent: 6500, deposit: 6500, petDeposit: 1000,
      status: "RENTED",
      desc: "Beautifully designed townhouse with high-end finishes. Private rooftop deck with city views.",
      amenities: ["Roof Deck", "Garage", "In-unit Laundry", "Smart Home", "Designer Finishes"],
    },
    {
      landlord: landlord3,
      title: "Modern Studio Apartment",
      type: "STUDIO",
      beds: 0, baths: 1, sqft: 450, year: 2020,
      street: "123 Yonge St, #101", city: "Toronto", state: "ON", zip: "M5C 1W4",
      rent: 2100, deposit: 2100, petDeposit: 0,
      status: "ACTIVE",
      desc: "Sleek modern studio with smart home features. Perfect for professionals seeking convenience.",
      amenities: ["Smart Home", "In-unit Laundry", "Gym", "Parking"],
    },
    {
      landlord: landlord1,
      title: "Spacious 3BR Apartment",
      type: "APARTMENT",
      beds: 3, baths: 2, sqft: 1500, year: 2018,
      street: "456 Robson St, #5C", city: "Vancouver", state: "BC", zip: "V6B 1A9",
      rent: 4800, deposit: 4800, petDeposit: 600,
      status: "ACTIVE",
      desc: "Large 3-bedroom apartment with modern amenities. Great for families or roommates.",
      amenities: ["In-unit Laundry", "Dishwasher", "Air Conditioning", "Parking", "Storage"],
    },
    {
      landlord: landlord2,
      title: "Luxury 2BR Apartment",
      type: "APARTMENT",
      beds: 2, baths: 2, sqft: 1350, year: 2021,
      street: "789 Bloor St W, #12A", city: "Toronto", state: "ON", zip: "M6G 1L3",
      rent: 5500, deposit: 5500, petDeposit: 0,
      status: "ACTIVE",
      desc: "Premium apartment with high-end finishes and stunning city views. Building amenities included.",
      amenities: ["Concierge", "Gym", "Pool", "Parking", "In-unit Laundry", "Balcony"],
    },
    {
      landlord: landlord3,
      title: "Cozy 1BR Condo",
      type: "CONDO",
      beds: 1, baths: 1, sqft: 800, year: 2016,
      street: "321 Ste-Catherine St, Unit 8", city: "Montréal", state: "QC", zip: "H3B 1A1",
      rent: 3200, deposit: 3200, petDeposit: 400,
      status: "ACTIVE",
      desc: "Charming one-bedroom condo in vibrant neighborhood. Recently updated with modern fixtures.",
      amenities: ["Hardwood Floors", "Updated Kitchen", "Storage", "Pet Friendly"],
    },
    {
      landlord: landlord1,
      title: "Modern 2BR Townhouse",
      type: "TOWNHOUSE",
      beds: 2, baths: 2.5, sqft: 1800, year: 2019,
      street: "654 Davie St", city: "Vancouver", state: "BC", zip: "V6E 1M6",
      rent: 5200, deposit: 5200, petDeposit: 800,
      status: "ACTIVE",
      desc: "Contemporary townhouse with private entrance and modern design. Perfect for professionals.",
      amenities: ["Private Entrance", "Garage", "In-unit Laundry", "Patio", "Updated Kitchen"],
    },
    {
      landlord: landlord2,
      title: "Elegant 4BR Family Home",
      type: "SINGLE_FAMILY",
      beds: 4, baths: 3, sqft: 2800, year: 2012,
      street: "987 Rosedale Valley Rd", city: "Toronto", state: "ON", zip: "M4T 1R2",
      rent: 7200, deposit: 7200, petDeposit: 1200,
      status: "ACTIVE",
      desc: "Beautiful family home with spacious rooms and large backyard. Ideal for families with children.",
      amenities: ["Backyard", "Garage", "Fireplace", "Central AC", "Updated Kitchen", "Hardwood Floors"],
    },
    {
      landlord: landlord3,
      title: "Contemporary 2BR Apartment",
      type: "APARTMENT",
      beds: 2, baths: 1, sqft: 1100, year: 2017,
      street: "147 Queen St W, #3B", city: "Toronto", state: "ON", zip: "M5H 2M9",
      rent: 4100, deposit: 4100, petDeposit: 0,
      status: "ACTIVE",
      desc: "Stylish two-bedroom apartment with modern design. Close to restaurants and shopping.",
      amenities: ["In-unit Laundry", "Dishwasher", "Hardwood Floors", "Storage"],
    },
    {
      landlord: landlord1,
      title: "Classic 1BR Condo",
      type: "CONDO",
      beds: 1, baths: 1, sqft: 750, year: 2014,
      street: "258 Broadway, Unit 15", city: "Vancouver", state: "BC", zip: "V5K 0A1",
      rent: 3000, deposit: 3000, petDeposit: 0,
      status: "ACTIVE",
      desc: "Well-maintained one-bedroom condo in historic building. Great location with character.",
      amenities: ["Hardwood Floors", "Updated Bathroom", "Storage", "Laundry in Building"],
    },
    {
      landlord: landlord2,
      title: "Modern 3BR Family Home",
      type: "SINGLE_FAMILY",
      beds: 3, baths: 2.5, sqft: 2100, year: 2016,
      street: "369 Mount Pleasant Rd", city: "Toronto", state: "ON", zip: "M4S 2L8",
      rent: 6800, deposit: 6800, petDeposit: 1000,
      status: "ACTIVE",
      desc: "Spacious family home with modern updates and large yard. Perfect for growing families.",
      amenities: ["Backyard", "Garage", "Fireplace", "Central AC", "Updated Kitchen", "In-unit Laundry"],
    },
    {
      landlord: landlord3,
      title: "Urban 1BR Loft",
      type: "APARTMENT",
      beds: 1, baths: 1, sqft: 950, year: 2015,
      street: "741 St-Laurent Blvd, #4A", city: "Montréal", state: "QC", zip: "H2Z 1Y4",
      rent: 3600, deposit: 3600, petDeposit: 0,
      status: "ACTIVE",
      desc: "Industrial-style loft with high ceilings and exposed brick. Perfect for creative professionals.",
      amenities: ["High Ceilings", "Exposed Brick", "In-unit Laundry", "Gym", "Roof Access"],
    },
  ];

  for (let i = 0; i < listingData.length; i++) {
    const data = listingData[i];
    const listing = await prisma.listing.create({
      data: {
        landlordId: data.landlord.id,
        title: data.title,
        propertyType: data.type,
        bedrooms: data.beds,
        bathrooms: data.baths,
        totalSquareFeet: data.sqft,
        yearBuilt: data.year,
        country: "Canada",
        state: data.state,
        city: data.city,
        streetAddress: data.street,
        zipCode: data.zip,
        rentCycle: "MONTHLY",
        rentAmount: data.rent,
        securityDeposit: data.deposit,
        petDeposit: data.petDeposit,
        availableDate: new Date("2024-01-01"),
        status: data.status,
        description: data.desc,
        contactName: `${data.landlord.firstName} ${data.landlord.lastName}`,
        phoneNumber: data.landlord.phone,
        email: data.landlord.email,
        notes: data.petDeposit > 0 ? "Pet-friendly property" : "No pets allowed",
        amenities: {
          create: data.amenities.map(a => ({ name: a })),
        },
        images: {
          create: [
            { url: propertyImages[i][0], isPrimary: true },
            { url: propertyImages[i][1], isPrimary: false },
            { url: propertyImages[i][2], isPrimary: false },
          ],
        },
      },
    });
    listings.push(listing);
  }

  console.log("📋 Creating applications for different test scenarios...");

  const applications = [];

  /*
  ==========================================
  📋 APPLICATION SCENARIOS FOR TESTING
  ==========================================
  
  ⚠️ CRITICAL BUSINESS RULES:
  
  1️⃣ PENDING Applications (NOT Assigned):
     ✓ tenantId = NULL (no tenant account)
     ✓ fullName = "N/A" or null (no applicant info)
     ✓ email/phone = N/A or null
     ✓ Represents: Application link sent but not submitted yet
     ✓ Landlord cannot send lease until tenant submits and registers
  
  2️⃣ NEW Applications (Assigned):
     ✓ tenantId = Specific tenant ID
     ✓ Represents: Registered tenant submitted application
     ✓ Landlord can approve/reject
  
  3️⃣ APPROVED Applications (Assigned):
     ✓ tenantId = Specific tenant ID
     ✓ Ready to create and send lease
     ✓ Tenant can sign lease ONLY if they don't have an active one
  
  4️⃣ REJECTED Applications (Assigned):
     ✓ tenantId = Specific tenant ID
     ✓ Application declined by landlord
  
  5️⃣ Tenant with ACTIVE Lease:
     ⚠️ Should NOT appear in applications (business rule)
     ⚠️ In TEST data: We use separate tenants without leases (Alex, Sophia)
     ⚠️ Backend BLOCKS signing: Returns error if tenant has active lease
     ⚠️ Tenants Jane, Mike, Emma have active leases → NOT in applications
  
  6️⃣ Listing with ACTIVE Lease:
     ❌ Applications are HIDDEN from landlord's Applications page
     ✓ Frontend filters these out automatically
     ✓ Prevents double-booking
  
  ==========================================
  TEST SCENARIOS BELOW:
  ==========================================
  
  SCENARIO 1: NO LEASE → ✅ VISIBLE
  - Listings: 6, 11, 12, 13, 14, 15, 16, 17, 18, 19
  - Applications: Mix of NEW, PENDING, APPROVED, REJECTED
  - Purpose: Test full application workflow
  
  SCENARIO 2: ACTIVE LEASE → ❌ HIDDEN
  - Standard Leases: Listings 0 (Jane), 3 (Mike)
  - Custom Leases: Listing 2 (Emma)
  - Applications: Still exist in DB but hidden from UI
  - Purpose: Verify filtering logic works
  
  SCENARIO 3: DRAFT LEASE → ✅ VISIBLE
  - Standard: Listings 8, 10 (Emma's drafts)
  - Custom: Listings 1, 4, 7, 9 (Jane & Mike's drafts)
  - Applications: Can still receive/send lease
  - Purpose: Test sending draft leases to approved applicants
  
  ==========================================
  */

  // Helper function to generate placeholder applicant data
  const getPlaceholderApplicant = () => {
    const firstNames = ["Sarah", "Michael", "Emily", "David", "Jessica", "Daniel", "Amanda", "Christopher", "Lisa", "Matthew"];
    const lastNames = ["Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez"];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@email.com`;
    const phone = `555-${Math.floor(Math.random() * 9000) + 1000}`;
    return { firstName, lastName, email, phone };
  };

  // SCENARIO 1: Applications for listings WITHOUT any lease (✅ VISIBLE)
  const noLeaseApplications = [
    // NEW - Applicant submitted application but hasn't signed lease yet
    { applicant: getPlaceholderApplicant(), listing: listings[6], status: "NEW" },

    // PENDING - No applicant info (application link sent but not submitted)
    { applicant: null, listing: listings[11], status: "PENDING" },
    { applicant: null, listing: listings[12], status: "PENDING" },

    // APPROVED - Applicants ready to create and send lease (not signed yet)
    { applicant: getPlaceholderApplicant(), listing: listings[13], status: "APPROVED" },
    { applicant: getPlaceholderApplicant(), listing: listings[15], status: "APPROVED" },

    // REJECTED - Application declined
    { applicant: getPlaceholderApplicant(), listing: listings[14], status: "REJECTED" },
  ];

  for (let i = 0; i < noLeaseApplications.length; i++) {
    const data = noLeaseApplications[i];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const publicId = `APP-NOLEASE-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Main St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // SCENARIO 2: Applications for listings WITH ACTIVE standard lease (❌ HIDDEN)
  // These will be filtered out on frontend but kept in DB for data integrity
  const activeStandardLeaseApps = [
    { applicant: null, listing: listings[0], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[3], status: "NEW" },  // Placeholder applicant (not signed contract yet)
  ];

  for (let i = 0; i < activeStandardLeaseApps.length; i++) {
    const data = activeStandardLeaseApps[i];
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const publicId = `APP-ACTIVE-STD-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Oak St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // SCENARIO 3: Applications for listings WITH DRAFT standard lease (✅ VISIBLE)
  const draftStandardLeaseApps = [
    { applicant: getPlaceholderApplicant(), listing: listings[8], status: "APPROVED" },  // Placeholder applicant - Ready to send draft
    { applicant: null, listing: listings[10], status: "PENDING" },
  ];

  for (let i = 0; i < draftStandardLeaseApps.length; i++) {
    const data = draftStandardLeaseApps[i];
    const daysAgo = Math.floor(Math.random() * 15) + 1;
    const publicId = `APP-DRAFT-STD-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Elm St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // SCENARIO 4: Applications for listings WITH ACTIVE custom lease (❌ HIDDEN)
  const activeCustomLeaseApps = [
    { applicant: null, listing: listings[2], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[2], status: "NEW" },  // Placeholder applicant (not signed contract yet)
  ];

  for (let i = 0; i < activeCustomLeaseApps.length; i++) {
    const data = activeCustomLeaseApps[i];
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    const publicId = `APP-ACTIVE-CUST-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Pine St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // SCENARIO 5: Applications for listings WITH DRAFT custom lease (✅ VISIBLE)
  const draftCustomLeaseApps = [
    { applicant: getPlaceholderApplicant(), listing: listings[7], status: "APPROVED" },  // Placeholder applicant - Ready to send draft
    { applicant: null, listing: listings[9], status: "PENDING" },
  ];

  for (let i = 0; i < draftCustomLeaseApps.length; i++) {
    const data = draftCustomLeaseApps[i];
    const daysAgo = Math.floor(Math.random() * 10) + 1;
    const publicId = `APP-DRAFT-CUST-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Maple St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // Additional random applications for variety
  // These use listings without leases (16-19)
  // Applications don't have tenantId assigned until lease is signed
  const extraApps = [
    { applicant: getPlaceholderApplicant(), listing: listings[16], status: "NEW" },      // Placeholder applicant
    { applicant: null, listing: listings[17], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[18], status: "APPROVED" }, // Placeholder applicant
    { applicant: null, listing: listings[19], status: "PENDING" },
  ];

  for (let i = 0; i < extraApps.length; i++) {
    const data = extraApps[i];
    const daysAgo = Math.floor(Math.random() * 40) + 1;
    const publicId = `APP-EXTRA-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} Cedar St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  // Additional applications for new listings (20-29) - no leases yet
  const newListingApps = [
    { applicant: getPlaceholderApplicant(), listing: listings[20], status: "NEW" },
    { applicant: null, listing: listings[21], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[22], status: "APPROVED" },
    { applicant: getPlaceholderApplicant(), listing: listings[23], status: "NEW" },
    { applicant: null, listing: listings[24], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[25], status: "APPROVED" },
    { applicant: getPlaceholderApplicant(), listing: listings[26], status: "REJECTED" },
    { applicant: null, listing: listings[27], status: "PENDING" },
    { applicant: getPlaceholderApplicant(), listing: listings[28], status: "NEW" },
    { applicant: getPlaceholderApplicant(), listing: listings[29], status: "APPROVED" },
  ];

  for (let i = 0; i < newListingApps.length; i++) {
    const data = newListingApps[i];
    const daysAgo = Math.floor(Math.random() * 50) + 1;
    const publicId = `APP-NEW-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`;

    const app = await prisma.requestApplication.create({
      data: {
        publicId: publicId,
        tenantId: null, // No tenant assigned until lease is signed
        landlordId: data.listing.landlordId,
        listingId: data.listing.id,
        fullName: data.applicant ? `${data.applicant.firstName} ${data.applicant.lastName}` : "N/A",
        email: data.applicant ? data.applicant.email : "N/A",
        phone: data.applicant ? data.applicant.phone : "N/A",
        moveInDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
        currentAddress: data.applicant ? `${Math.floor(Math.random() * 9999)} ${["Oak", "Pine", "Elm", "Maple", "Cedar", "Ash", "Birch"][Math.floor(Math.random() * 7)]} St` : "N/A",
        monthlyIncome: data.applicant ? Math.floor(Math.random() * 8000) + 4000 : 0,
        status: data.status,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    applications.push(app);
  }

  console.log("📝 Creating standard leases (1 lease per listing max)...");

  const leases = [];
  /*
  ==========================================
  📜 STANDARD LEASE CREATION GUIDE
  ==========================================
  
  ⚠️ KEY BUSINESS RULES:
  1. One listing = ONE lease maximum (standard OR custom, not both)
  2. One tenant = ONE ACTIVE lease maximum
  3. ACTIVE lease = Has tenant assigned, listing status = "RENTED"
  4. DRAFT lease = NO tenant assigned (tenantId = null), listing status = "ACTIVE"
  
  📋 LEASE STATUS WORKFLOW:
  
  DRAFT (tenantId = null)
     ↓
  Landlord creates lease for listing
     ↓
  Landlord sends to approved applicant
     ↓
  Tenant signs lease
     ↓
  ACTIVE (tenantId assigned)
  
  📋 CURRENT ASSIGNMENTS:
  
  ACTIVE STANDARD LEASES (2 total):
  - Listing 0 → Tenant 0 (Jane)   | Started 180 days ago, ends in 180 days
  - Listing 3 → Tenant 1 (Mike)   | Started 90 days ago, ends in 270 days
  
  DRAFT STANDARD LEASES (2 total):
  - Listing 8  → No tenant (will assign when sent)  | Starts in 15 days
  - Listing 10 → No tenant (will assign when sent)  | Starts in 20 days
  
  📝 TO ADD MORE LEASES:
  
  FOR ACTIVE LEASE:
  { tenant: tenants[X], listing: listings[Y], status: "ACTIVE", startDays: -30, endDays: 335 }
  - Must specify tenant (who signed the lease)
  - Ensure tenant doesn't have another ACTIVE lease
  
  FOR DRAFT LEASE:
  { tenant: null, listing: listings[Y], status: "DRAFT", startDays: 15, endDays: 380 }
  - tenant = null (not assigned yet)
  - Landlord will assign when sending to approved applicant
  
  ==========================================
  */
  const leaseData = [
    // ✅ ACTIVE STANDARD LEASES (Tenant assigned after signing)
    { tenant: tenants[0], listing: listings[0], status: "ACTIVE", startDays: -180, endDays: 180 },  // Jane signed
    { tenant: tenants[1], listing: listings[3], status: "ACTIVE", startDays: -90, endDays: 270 },   // Mike signed
    { tenant: tenants[3], listing: listings[11], status: "ACTIVE", startDays: -60, endDays: 305 },  // Alex signed (new)
    { tenant: tenants[4], listing: listings[12], status: "ACTIVE", startDays: -45, endDays: 320 },  // Sophia signed (new)

    // 📝 DRAFT STANDARD LEASES (No tenant assigned yet - will assign when sent)
    { tenant: null, listing: listings[8], status: "DRAFT", startDays: 15, endDays: 380 },   // Not assigned
    { tenant: null, listing: listings[10], status: "DRAFT", startDays: 20, endDays: 385 },  // Not assigned
    { tenant: null, listing: listings[13], status: "DRAFT", startDays: 30, endDays: 395 },  // Not assigned (new)
    { tenant: null, listing: listings[14], status: "DRAFT", startDays: 25, endDays: 390 },  // Not assigned (new)
    { tenant: null, listing: listings[15], status: "DRAFT", startDays: 35, endDays: 400 },  // Not assigned (new)
  ];

  for (const data of leaseData) {
    const startDate = new Date(Date.now() + data.startDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + data.endDays * 24 * 60 * 60 * 1000);

    // Get landlord info
    const landlord = await prisma.user.findUnique({ where: { id: data.listing.landlordId } });

    const lease = await prisma.lease.create({
      data: {
        listing: { connect: { id: data.listing.id } },
        ...(data.tenant ? { tenant: { connect: { id: data.tenant.id } } } : {}),
        landlord: { connect: { id: data.listing.landlordId } },
        leaseStatus: data.status,
        startDate: startDate,
        endDate: endDate,
        rentAmount: data.listing.rentAmount,
        paymentFrequency: data.listing.rentCycle,
        securityDeposit: data.listing.securityDeposit,
        securityDepositDueDate: startDate,
        paymentDay: 1,
        petDeposit: null,
        petDepositDueDate: null,
        parkingSpaces: 1,
        includedServices: ["Water", "Garbage Collection"],
        // Add required fields for standard lease
        landlordFullName: `${landlord.firstName} ${landlord.lastName}`,
        landlordEmail: landlord.email,
        landlordPhone: landlord.phone,
        landlordAddress: `${data.listing.streetAddress}, ${data.listing.city}, ${data.listing.state}`,
        tenantFullName: data.tenant ? `${data.tenant.firstName} ${data.tenant.lastName}` : null,
        tenantEmail: data.tenant?.email || null,
        tenantPhone: data.tenant?.phone || null,
        tenantOtherPhone: null,
        tenantOtherEmail: null,
        additionalTenants: [],
        additionalLandlords: [],
        unitNumber: data.listing.aptUnit || `${Math.floor(Math.random() * 500) + 100}`,
        propertyAddress: data.listing.streetAddress,
        propertyCity: data.listing.city,
        propertyState: data.listing.state,
        propertyZipCode: data.listing.zipCode,
        leaseTermType: "LONG_TERM",
        periodicBasis: null,
        periodicOther: null,
        fixedEndCondition: "continues",
        vacateReason: null,
        // contractPdfUrl will be null for now (can be generated later)
        contractPdfUrl: null,
      },
    });
    leases.push(lease);

    // Update listing status to RENTED for ACTIVE leases
    if (data.status === "ACTIVE") {
      await prisma.listing.update({
        where: { id: data.listing.id },
        data: { status: "RENTED" },
      });
    }
  }

  console.log("📑 Creating custom leases (1 lease per listing max, no overlap with standard)...");

  const customLeases = [];
  /*
  ==========================================
  📄 CUSTOM LEASE CREATION GUIDE
  ==========================================
  
  ⚠️ KEY BUSINESS RULES:
  1. One listing = ONE lease maximum (standard OR custom, not both)
  2. One tenant = ONE ACTIVE lease maximum (standard OR custom)
  3. ACTIVE lease = Has tenant assigned, listing status = "RENTED"
  4. DRAFT lease = NO tenant assigned (tenantId = null), listing status = "ACTIVE"
  5. Custom lease uses uploaded PDF (fileUrl) instead of generated contract
  
  📋 LEASE STATUS WORKFLOW:
  
  DRAFT (tenantId = null)
     ↓
  Landlord creates custom lease with PDF
     ↓
  Landlord sends to approved applicant
     ↓
  Tenant signs lease
     ↓
  ACTIVE (tenantId assigned)
  
  📋 CURRENT ASSIGNMENTS:
  
  ACTIVE CUSTOM LEASES (1 total):
  - Listing 2 → Tenant 2 (Emma)  | Started 90 days ago, 12-month lease
  
  DRAFT CUSTOM LEASES (4 total):
  - Listing 1 → No tenant (will assign when sent)  | Starts in 30 days
  - Listing 4 → No tenant (will assign when sent)  | Starts in 45 days
  - Listing 7 → No tenant (will assign when sent)  | Starts in 15 days
  - Listing 9 → No tenant (will assign when sent)  | Starts in 30 days
  
  📝 TO ADD MORE LEASES:
  
  FOR ACTIVE LEASE:
  { tenant: tenants[X], listing: listings[Y], status: "ACTIVE", startDays: -30, months: 12, rent: 2500 }
  - Must specify tenant (who signed the lease)
  - Ensure tenant doesn't have another ACTIVE lease
  
  FOR DRAFT LEASE:
  { tenant: null, listing: listings[Y], status: "DRAFT", startDays: 30, months: 12, rent: 2500 }
  - tenant = null (not assigned yet)
  - Landlord will assign when sending to approved applicant
  
  ==========================================
  */
  const customLeaseData = [
    // ✅ ACTIVE CUSTOM LEASE (Tenant assigned after signing)
    { tenant: tenants[2], listing: listings[2], status: "ACTIVE", startDays: -90, months: 12, rent: 4800 }, // Emma signed

    // 📝 DRAFT CUSTOM LEASES (No tenant assigned yet)
    { tenant: null, listing: listings[1], status: "DRAFT", startDays: 30, months: 12, rent: 4200 },
    { tenant: null, listing: listings[4], status: "DRAFT", startDays: 45, months: 24, rent: 2200 },
    { tenant: null, listing: listings[7], status: "DRAFT", startDays: 15, months: 12, rent: 7500 },
    { tenant: null, listing: listings[9], status: "DRAFT", startDays: 30, months: 12, rent: 2800 },
    { tenant: null, listing: listings[16], status: "DRAFT", startDays: 40, months: 12, rent: 1800 },
    { tenant: null, listing: listings[17], status: "DRAFT", startDays: 50, months: 18, rent: 4300 },
    { tenant: null, listing: listings[18], status: "DRAFT", startDays: 35, months: 12, rent: 2900 },
    { tenant: null, listing: listings[19], status: "DRAFT", startDays: 45, months: 12, rent: 6500 },
    { tenant: null, listing: listings[20], status: "DRAFT", startDays: 30, months: 12, rent: 2100 },
    { tenant: null, listing: listings[21], status: "DRAFT", startDays: 25, months: 12, rent: 4800 },
  ];

  for (const data of customLeaseData) {
    const startDate = new Date(Date.now() + data.startDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + data.months * 30 * 24 * 60 * 60 * 1000);

    const customLease = await prisma.customLease.create({
      data: {
        listing: { connect: { id: data.listing.id } },
        ...(data.tenant ? { tenant: { connect: { id: data.tenant.id } } } : {}),
        landlord: { connect: { id: data.listing.landlordId } },
        leaseName: `Custom Lease - ${data.listing.title}`,
        leaseStatus: data.status,
        startDate: startDate,
        endDate: endDate,
        rentAmount: data.rent,
        paymentFrequency: "MONTHLY",
        paymentDay: 1,
        securityDeposit: data.rent,
        depositAmount: data.rent,
        paymentMethod: ["BANK_TRANSFER", "CHECK", "CASH"][Math.floor(Math.random() * 3)],
        fileUrl: `/lease-agreement-sample.pdf`, // Reference to public folder PDF
      },
    });
    customLeases.push(customLease);

    // Update listing status to RENTED for ACTIVE custom leases
    if (data.status === "ACTIVE") {
      await prisma.listing.update({
        where: { id: data.listing.id },
        data: { status: "RENTED" },
      });
    }
  }

  console.log("💰 Creating 40+ payments...");

  const payments = [];

  // Create payments for active leases
  for (let i = 0; i < leases.length; i++) {
    const lease = leases[i];
    if (lease.leaseStatus !== "ACTIVE") continue;

    // Find the listing to get landlordId
    const listing = listings.find(l => l.id === lease.listingId);
    if (!listing) continue;

    const monthsSinceStart = Math.floor((Date.now() - lease.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));

    // Create past payments (paid)
    for (let month = 0; month < Math.min(monthsSinceStart, 6); month++) {
      const dueDate = new Date(lease.startDate.getTime() + month * 30 * 24 * 60 * 60 * 1000);
      const paidDate = new Date(dueDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000);
      const monthName = dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

      await prisma.payment.create({
        data: {
          leaseId: lease.id,
          tenantId: lease.tenantId,
          landlordId: listing.landlordId,
          amount: lease.rentAmount,
          dueDate: dueDate,
          paidDate: paidDate,
          type: "RENT",
          status: "PAID",
          paymentMethod: ["BANK_TRANSFER", "CHECK", "CASH", "CREDIT_CARD"][Math.floor(Math.random() * 4)],
          notes: `Monthly rent payment for ${monthName}`,
        },
      });
    }

    // Current month payment (pending or overdue)
    const currentDueDate = new Date(lease.startDate.getTime() + monthsSinceStart * 30 * 24 * 60 * 60 * 1000);
    const isPastDue = currentDueDate < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const currentMonthName = currentDueDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (monthsSinceStart >= 0) {
      await prisma.payment.create({
        data: {
          leaseId: lease.id,
          tenantId: lease.tenantId,
          landlordId: listing.landlordId,
          amount: lease.rentAmount,
          dueDate: currentDueDate,
          type: "RENT",
          status: "PENDING",
          notes: isPastDue ? `OVERDUE: Monthly rent for ${currentMonthName}` : `Monthly rent for ${currentMonthName}`,
        },
      });
    }

    // Security deposit payment
    if (lease.securityDeposit > 0) {
      await prisma.payment.create({
        data: {
          leaseId: lease.id,
          tenantId: lease.tenantId,
          landlordId: listing.landlordId,
          amount: lease.securityDeposit,
          dueDate: lease.startDate,
          paidDate: lease.startDate,
          type: "DEPOSIT",
          status: "PAID",
          paymentMethod: "BANK_TRANSFER",
          notes: "Security deposit payment",
        },
      });
    }
  }

  // Create maintenance payments
  for (let i = 0; i < 10; i++) {
    const listing = listings[i % listings.length];
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const isPaid = Math.random() > 0.3;
    const dueDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const isOverdue = !isPaid && dueDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await prisma.payment.create({
      data: {
        landlordId: listing.landlordId,
        amount: Math.floor(Math.random() * 500) + 100,
        dueDate: dueDate,
        paidDate: isPaid ? new Date(dueDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null,
        type: "MAINTENANCE",
        status: isPaid ? "PAID" : "PENDING",
        paymentMethod: isPaid ? ["BANK_TRANSFER", "CHECK", "CREDIT_CARD"][Math.floor(Math.random() * 3)] : null,
        notes: ["HVAC Repair", "Plumbing Fix", "Electrical Work", "Appliance Replacement", "Painting"][Math.floor(Math.random() * 5)],
      },
    });
  }

  console.log("🔧 Creating 25+ maintenance requests...");

  const maintenanceIssues = [
    { title: "Air Conditioning Not Working", desc: "AC unit not cooling properly. Thermostat shows correct temperature but air coming out is warm.", priority: "HIGH", category: "HVAC" },
    { title: "Leaking Faucet in Kitchen", desc: "Kitchen sink faucet has a constant drip that's getting worse.", priority: "MEDIUM", category: "PLUMBING" },
    { title: "Pre-rental Deep Cleaning", desc: "Full deep cleaning needed before new tenant moves in next month.", priority: "LOW", category: "CLEANING" },
    { title: "Broken Garbage Disposal", desc: "Garbage disposal is jammed and not working. Making loud grinding noise.", priority: "MEDIUM", category: "APPLIANCE" },
    { title: "Water Heater Issue", desc: "No hot water in the morning. Water heater may need replacement.", priority: "HIGH", category: "PLUMBING" },
    { title: "Refrigerator Not Cooling", desc: "Fridge stopped cooling. Food is spoiling.", priority: "URGENT", category: "APPLIANCE" },
    { title: "Broken Window Lock", desc: "Window lock in bedroom is broken, security concern.", priority: "HIGH", category: "SECURITY" },
    { title: "Pest Control Service", desc: "Regular quarterly pest control service needed.", priority: "LOW", category: "PEST_CONTROL" },
    { title: "Clogged Bathroom Drain", desc: "Bathroom sink draining very slowly, standing water.", priority: "MEDIUM", category: "PLUMBING" },
    { title: "Smoke Detector Beeping", desc: "Smoke detector beeping intermittently, needs battery or replacement.", priority: "HIGH", category: "SECURITY" },
    { title: "Leaking Roof", desc: "Water stain on ceiling, appears to be roof leak.", priority: "URGENT", category: "STRUCTURAL" },
    { title: "Broken Dishwasher", desc: "Dishwasher not draining, standing water at bottom.", priority: "MEDIUM", category: "APPLIANCE" },
    { title: "Loose Stair Railing", desc: "Stair railing is loose and unsafe.", priority: "HIGH", category: "STRUCTURAL" },
    { title: "Landscape Maintenance", desc: "Monthly lawn care and hedge trimming needed.", priority: "LOW", category: "LANDSCAPING" },
    { title: "Annual HVAC Inspection", desc: "Scheduled annual HVAC system inspection and maintenance.", priority: "LOW", category: "HVAC" },
    { title: "Electrical Outlet Not Working", desc: "Bedroom outlet has no power, may be tripped circuit.", priority: "MEDIUM", category: "ELECTRICAL" },
    { title: "Mold in Bathroom", desc: "Mold growing on bathroom ceiling, ventilation issue.", priority: "HIGH", category: "OTHER" },
    { title: "Broken Closet Door", desc: "Closet door off track, won't close properly.", priority: "LOW", category: "OTHER" },
    { title: "Water Pressure Low", desc: "Noticeably low water pressure throughout apartment.", priority: "MEDIUM", category: "PLUMBING" },
    { title: "Heating Not Working", desc: "Furnace not turning on, cold apartment.", priority: "URGENT", category: "HVAC" },
    { title: "Cracked Window Pane", desc: "Living room window has crack, needs replacement.", priority: "MEDIUM", category: "OTHER" },
    { title: "Carpet Cleaning", desc: "End of lease carpet cleaning required.", priority: "LOW", category: "CLEANING" },
    { title: "Lock Change Request", desc: "Tenant requested lock change for security.", priority: "MEDIUM", category: "SECURITY" },
    { title: "Dryer Not Heating", desc: "Dryer runs but doesn't heat up, clothes stay wet.", priority: "MEDIUM", category: "APPLIANCE" },
    { title: "Gutter Cleaning", desc: "Gutters overflowing, need seasonal cleaning.", priority: "LOW", category: "LANDSCAPING" },
  ];

  const maintenanceStatuses = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  // Create 3 maintenance requests specifically for DEMO TENANT (tenants[0] - tenant@test.com)
  // These will show in tenant's dashboard and maintenance view
  const demoTenantMaintenance = [
    { title: "Air Conditioning Not Cooling", desc: "AC not working properly in bedroom. Need urgent repair.", priority: "HIGH", category: "HVAC", status: "OPEN", daysAgo: 2 },
    { title: "Kitchen Sink Leak", desc: "Small leak under kitchen sink. Water dripping slowly.", priority: "MEDIUM", category: "PLUMBING", status: "IN_PROGRESS", daysAgo: 7 },
    { title: "Broken Light Fixture", desc: "Light fixture in living room stopped working.", priority: "LOW", category: "ELECTRICAL", status: "COMPLETED", daysAgo: 15 },
  ];

  // Find the demo tenant's lease listing (listings[2])
  const demoListing = listings[2];

  for (const issue of demoTenantMaintenance) {
    const createdDate = new Date(Date.now() - issue.daysAgo * 24 * 60 * 60 * 1000);
    await prisma.maintenanceRequest.create({
      data: {
        listingId: demoListing.id,
        userId: tenants[0].id, // Request submitted BY tenant
        title: issue.title,
        description: issue.desc,
        priority: issue.priority,
        category: issue.category,
        status: issue.status,
        createdAt: createdDate,
        updatedAt:
          issue.status === "COMPLETED"
            ? new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            : createdDate,
      },
    });
  }

  // Create remaining maintenance requests (for other listings)
  for (let i = 0; i < 22; i++) {
    const issue = maintenanceIssues[i];
    const listing = listings[(i + 3) % listings.length]; // Skip listings[0,1,2] to avoid conflicts
    const status = maintenanceStatuses[Math.floor(Math.random() * maintenanceStatuses.length)];
    const daysAgo = Math.floor(Math.random() * 120) + 1;
    const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    await prisma.maintenanceRequest.create({
      data: {
        listingId: listing.id,
        userId: listing.landlordId,
        title: issue.title,
        description: issue.desc,
        priority: issue.priority,
        category: issue.category,
        status: status,
        createdAt: createdDate,
        updatedAt:
          status === "COMPLETED"
            ? new Date(
                createdDate.getTime() +
                  Math.random() * 14 * 24 * 60 * 60 * 1000
              )
            : createdDate,
      },
    });
  }

  // ========================================
  // INVOICES (Auto-creates Payments)
  // ========================================
  console.log("\n🧾 Creating invoices for maintenance requests...");

  // Get all maintenance requests to create invoices for some
  const allMaintenanceRequests = await prisma.maintenanceRequest.findMany({
    include: {
      listing: {
        include: {
          leases: {
            where: { leaseStatus: "ACTIVE" },
          },
          customLeases: {
            where: { leaseStatus: "ACTIVE" },
          },
        },
      },
    },
  });

  // Invoice descriptions with amounts
  const invoiceTemplates = [
    { description: "Labor: 2 hours @ $75/hr\nParts: $50\nService fee: $25", amount: 225 },
    { description: "Emergency service call\nDiagnostic: $100\nRepair labor: $150\nParts and materials: $80", amount: 330 },
    { description: "Standard maintenance service\nLabor: 3 hours @ $65/hr\nMaterials: $45", amount: 240 },
    { description: "Parts replacement: $120\nInstallation: $80\nTesting: $50", amount: 250 },
    { description: "Professional cleaning service\nLabor: 4 hours @ $50/hr\nSupplies: $30", amount: 230 },
    { description: "Inspection: $75\nRepair work: $180\nFollow-up service: $45", amount: 300 },
    { description: "HVAC maintenance\nFilter replacement: $40\nCleaning: $120\nTuning: $90", amount: 250 },
    { description: "Plumbing repair\nLabor: $150\nPipe fittings: $35\nSealant: $15", amount: 200 },
    { description: "Electrical work\nLabor: 2.5 hours @ $80/hr\nCircuit breaker: $45\nWiring: $30", amount: 275 },
    { description: "Appliance repair\nDiagnostic fee: $85\nReplacement part: $120\nLabor: $95", amount: 300 },
  ];

  let invoiceCount = 0;

  // Create invoices for maintenance requests based on status
  for (const request of allMaintenanceRequests) {
    // Determine if this request should have an invoice
    let shouldCreateInvoice = false;
    let invoiceStatus = "PENDING";
    let sharedWithTenant = true;

    if (request.status === "COMPLETED") {
      // ALL completed requests should have invoices (80% paid, 20% pending)
      shouldCreateInvoice = true;
      invoiceStatus = Math.random() > 0.2 ? "PAID" : "PENDING";
      sharedWithTenant = true;
    } else if (request.status === "IN_PROGRESS") {
      // ALL in-progress requests should have invoices (work has started)
      shouldCreateInvoice = true;
      invoiceStatus = "PENDING";
      sharedWithTenant = true;
    } else if (request.status === "OPEN") {
      // OPEN requests typically don't have invoices yet (work not started)
      // But 20% might have preliminary estimates
      shouldCreateInvoice = Math.random() > 0.8;
      if (shouldCreateInvoice) {
        invoiceStatus = "PENDING";
        sharedWithTenant = false; // Don't share until work starts
      }
    } else if (request.status === "CANCELLED") {
      // 50% of cancelled requests have invoices (for work done before cancellation)
      shouldCreateInvoice = Math.random() > 0.5;
      invoiceStatus = "CANCELLED";
      sharedWithTenant = false;
    }

    if (!shouldCreateInvoice) {
      continue; // Skip to next maintenance request
    }

    const template = invoiceTemplates[invoiceCount % invoiceTemplates.length];

    // Get tenant from active lease
    const activeLease = request.listing.leases[0] || request.listing.customLeases[0];
    const tenantId = activeLease?.tenantId || request.userId;
    const leaseId = request.listing.leases[0]?.id || null;
    const customLeaseId = request.listing.customLeases[0]?.id || null;

    // Determine payment status
    let paymentStatus = "PENDING";
    let paidDate = null;

    if (invoiceStatus === "PAID") {
      paymentStatus = "PAID";
      // Set paid date to a few days after maintenance completion
      paidDate = new Date(request.updatedAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
    } else if (invoiceStatus === "CANCELLED") {
      paymentStatus = "CANCELLED";
    }

    // Create payment first
    const payment = await prisma.payment.create({
      data: {
        type: "MAINTENANCE",
        amount: template.amount,
        status: paymentStatus,
        dueDate: request.createdAt, // Due when maintenance request created
        paidDate: paidDate,
        landlordId: request.listing.landlordId,
        tenantId: tenantId,
        leaseId: leaseId,
        customLeaseId: customLeaseId,
        notes: template.description.split('\n')[0], // First line as note
      },
    });

    // Create invoice linked to payment
    await prisma.invoice.create({
      data: {
        maintenanceRequestId: request.id,
        description: template.description,
        amount: template.amount,
        status: invoiceStatus,
        sharedWithTenant: sharedWithTenant,
        sharedWithLandlord: true,
        createdById: request.listing.landlordId,
        createdByRole: "LANDLORD",
        paymentId: payment.id,
        createdAt: new Date(request.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000), // Created 2 days after request
      },
    });

    invoiceCount++;
  }

  console.log(`Created ${invoiceCount} invoices with linked payments`);

  console.log("\n🛡️ Creating Renters Insurance data...");

  // Get active leases with tenants for insurance
  const activeStandardLeases = leases.filter(l => l.leaseStatus === "ACTIVE" && l.tenantId);
  const activeCustomLeases = customLeases.filter(l => l.leaseStatus === "ACTIVE" && l.tenantId);

  // Create insurance records with different statuses
  const insuranceProviders = [
    "State Farm",
    "Allstate",
    "Geico",
    "Progressive",
    "Lemonade",
    "Liberty Mutual",
    "Farmers Insurance",
    "USAA",
  ];

  const insuranceData = [];

  // Create insurance for tenants with active standard leases
  for (let i = 0; i < activeStandardLeases.length && i < 5; i++) {
    const lease = activeStandardLeases[i];
    const tenant = tenants.find(t => t.id === lease.tenantId);
    if (!tenant) continue;

    const provider = insuranceProviders[i % insuranceProviders.length];
    const policyNumber = `POL-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const startDate = new Date(lease.startDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before lease start

    // Create different statuses for different tenants
    let status, expiryDate, verifiedBy, verifiedAt, rejectionReason;

    if (i === 0) {
      // Expiring in 30 days (EXPIRING_SOON)
      status = "EXPIRING_SOON";
      expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    } else if (i === 1) {
      // Not expiring soon (VERIFIED)
      status = "VERIFIED";
      expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    } else if (i === 2) {
      // Pending (PENDING)
      status = "PENDING";
      expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months from now
      verifiedBy = null;
      verifiedAt = null;
    } else if (i === 3) {
      // Rejected (REJECTED)
      status = "REJECTED";
      expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      rejectionReason = "Document quality is insufficient. Please upload a clearer copy of your insurance certificate.";
    } else {
      // Another VERIFIED (not expiring soon)
      status = "VERIFIED";
      expiryDate = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000); // ~10 months from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    }

    const documentUrl = `https://example.com/insurance-docs/${tenant.id}-insurance.pdf`;
    const documentKey = `insurance/${tenant.id}/${policyNumber}.pdf`;

    const insurance = await prisma.tenantInsurance.create({
      data: {
        tenantId: tenant.id,
        leaseId: lease.id,
        customLeaseId: null,
        providerName: provider,
        policyNumber: policyNumber,
        coverageType: "Renters Insurance",
        coverageAmount: 100000 + Math.floor(Math.random() * 50000), // $100k - $150k
        monthlyCost: 15 + Math.floor(Math.random() * 20), // $15 - $35/month
        startDate: startDate,
        expiryDate: expiryDate,
        documentUrl: documentUrl,
        documentKey: documentKey,
        status: status,
        verifiedBy: verifiedBy,
        verifiedAt: verifiedAt,
        rejectionReason: rejectionReason,
        notes: status === "VERIFIED" ? "Insurance verified and up to date." : null,
      },
    });

    insuranceData.push(insurance);
  }

  // Create insurance for tenants with active custom leases (if any)
  for (let i = 0; i < activeCustomLeases.length && insuranceData.length < 5; i++) {
    const lease = activeCustomLeases[i];
    const tenant = tenants.find(t => t.id === lease.tenantId);
    if (!tenant) continue;

    const provider = insuranceProviders[insuranceData.length % insuranceProviders.length];
    const policyNumber = `POL-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const startDate = new Date(lease.startDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before lease start

    // Create different statuses for different tenants
    let status, expiryDate, verifiedBy, verifiedAt, rejectionReason;

    if (insuranceData.length === 0) {
      // Expiring in 30 days (EXPIRING_SOON)
      status = "EXPIRING_SOON";
      expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    } else if (insuranceData.length === 1) {
      // Not expiring soon (VERIFIED)
      status = "VERIFIED";
      expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    } else if (insuranceData.length === 2) {
      // Pending (PENDING)
      status = "PENDING";
      expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months from now
      verifiedBy = null;
      verifiedAt = null;
    } else if (insuranceData.length === 3) {
      // Rejected (REJECTED)
      status = "REJECTED";
      expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      rejectionReason = "Document quality is insufficient. Please upload a clearer copy of your insurance certificate.";
    } else {
      // Another VERIFIED (not expiring soon)
      status = "VERIFIED";
      expiryDate = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000); // ~10 months from now
      verifiedBy = lease.landlordId;
      verifiedAt = new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    }

    const documentUrl = `https://example.com/insurance-docs/${tenant.id}-insurance.pdf`;
    const documentKey = `insurance/${tenant.id}/${policyNumber}.pdf`;

    const insurance = await prisma.tenantInsurance.create({
      data: {
        tenantId: tenant.id,
        leaseId: null,
        customLeaseId: lease.id,
        providerName: provider,
        policyNumber: policyNumber,
        coverageType: "Renters Insurance",
        coverageAmount: 100000 + Math.floor(Math.random() * 50000), // $100k - $150k
        monthlyCost: 15 + Math.floor(Math.random() * 20), // $15 - $35/month
        startDate: startDate,
        expiryDate: expiryDate,
        documentUrl: documentUrl,
        documentKey: documentKey,
        status: status,
        verifiedBy: verifiedBy,
        verifiedAt: verifiedAt,
        rejectionReason: rejectionReason,
        notes: status === "VERIFIED" ? "Insurance verified and up to date." : null,
      },
    });

    insuranceData.push(insurance);
  }

  console.log(`Created ${insuranceData.length} insurance records with different statuses:`);
  console.log(`  - ${insuranceData.filter(i => i.status === "EXPIRING_SOON").length} Expiring in 30 days`);
  console.log(`  - ${insuranceData.filter(i => i.status === "VERIFIED").length} Not expiring soon (Verified)`);
  console.log(`  - ${insuranceData.filter(i => i.status === "PENDING").length} Pending`);
  console.log(`  - ${insuranceData.filter(i => i.status === "REJECTED").length} Rejected`);

  console.log("\n✅ Seeding completed successfully!");
  console.log(`
==========================================
📊 DATABASE SEEDING SUMMARY
==========================================

Created:
- 3 Landlords
- 5 Tenants (5 with active leases, 0 available)
- 30 Listings
- 30+ Applications (including ${applications.filter(a => a.status === 'PENDING' && !a.tenantId).length} unassigned PENDING)
- ${leases.length} Standard Leases (${leases.filter(l => l.leaseStatus === 'ACTIVE').length} ACTIVE, ${leases.filter(l => l.leaseStatus === 'DRAFT').length} DRAFT)
- ${customLeases.length} Custom Leases (${customLeases.filter(l => l.leaseStatus === 'ACTIVE').length} ACTIVE, ${customLeases.filter(l => l.leaseStatus === 'DRAFT').length} DRAFT)
- 40+ Rent Payments
- 25+ Maintenance Requests
- ${invoiceCount} Invoices with Payments
- ${insuranceData.length} Renters Insurance Records

📋 TENANT LEASE ASSIGNMENTS:
──────────────────────────────────────
👤 ${tenants[0].firstName} ${tenants[0].lastName} (tenant@test.com):
   ✅ ACTIVE: ${leases.filter(l => l.tenantId === tenants[0].id && l.leaseStatus === 'ACTIVE').length + customLeases.filter(l => l.tenantId === tenants[0].id && l.leaseStatus === 'ACTIVE').length} lease(s) - Standard

👤 ${tenants[1].firstName} ${tenants[1].lastName} (mike.renter@test.com):
   ✅ ACTIVE: ${leases.filter(l => l.tenantId === tenants[1].id && l.leaseStatus === 'ACTIVE').length + customLeases.filter(l => l.tenantId === tenants[1].id && l.leaseStatus === 'ACTIVE').length} lease(s) - Standard

👤 ${tenants[2].firstName} ${tenants[2].lastName} (emma.wilson@test.com):
   ✅ ACTIVE: ${leases.filter(l => l.tenantId === tenants[2].id && l.leaseStatus === 'ACTIVE').length + customLeases.filter(l => l.tenantId === tenants[2].id && l.leaseStatus === 'ACTIVE').length} lease(s) - Custom

👤 ${tenants[3].firstName} ${tenants[3].lastName} (alex.tenant@test.com):
   ✅ ACTIVE: ${leases.filter(l => l.tenantId === tenants[3].id && l.leaseStatus === 'ACTIVE').length + customLeases.filter(l => l.tenantId === tenants[3].id && l.leaseStatus === 'ACTIVE').length} lease(s) - Standard

👤 ${tenants[4].firstName} ${tenants[4].lastName} (sophia.resident@test.com):
   ✅ ACTIVE: ${leases.filter(l => l.tenantId === tenants[4].id && l.leaseStatus === 'ACTIVE').length + customLeases.filter(l => l.tenantId === tenants[4].id && l.leaseStatus === 'ACTIVE').length} lease(s) - Standard

📝 DRAFT LEASES (No tenant assigned):
   - ${leases.filter(l => l.leaseStatus === 'DRAFT').length} Standard draft leases
   - ${customLeases.filter(l => l.leaseStatus === 'DRAFT').length} Custom draft leases

🔑 TEST CREDENTIALS:
──────────────────────────────────────
Landlord: landlord@test.com / password123

Tenants WITH Active Leases (CANNOT sign new leases):
  - tenant@test.com / password123 (Jane - has standard lease)
  - mike.renter@test.com / password123 (Mike - has standard lease)
  - emma.wilson@test.com / password123 (Emma - has custom lease)
  - alex.tenant@test.com / password123 (Alex - has standard lease)
  - sophia.resident@test.com / password123 (Sophia - has standard lease)

Tenants WITHOUT Leases (CAN sign leases & appear in applications):
  - None (all tenants now have active leases)

⚠️ BUSINESS RULES ENFORCED:
──────────────────────────────────────
✓ One tenant = ONE ACTIVE lease maximum
✓ One listing = ONE lease maximum
✓ PENDING applications = NOT assigned to tenant
✓ Active lease → listing status = RENTED
✓ Draft lease → listing status = ACTIVE

==========================================
  `);
}

main()
  .catch((e) => {
    console.error("Error occurred during query execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });