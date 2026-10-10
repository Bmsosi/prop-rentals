import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Rental Management API",
      version: "1.0.0",
      description: "A comprehensive API for managing rental properties, users, and listings",
      contact: {
        name: "API Support",
        email: "support@rentalmanagement.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT authentication token",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "username", "firstName", "lastName"],
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            username: {
              type: "string",
              description: "Unique username",
            },
            firstName: {
              type: "string",
              description: "User's first name",
            },
            lastName: {
              type: "string",
              description: "User's last name",
            },
            role: {
              type: "string",
              enum: ["USER", "ADMIN", "LANDLORD"],
              description: "User role in the system",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT authentication token",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Listing: {
          type: "object",
          required: ["title", "description", "price", "location"],
          properties: {
            id: {
              type: "string",
              description: "Unique listing identifier",
            },
            title: {
              type: "string",
              description: "Property title",
            },
            description: {
              type: "string",
              description: "Detailed property description",
            },
            price: {
              type: "number",
              description: "Monthly rental price",
            },
            location: {
              type: "string",
              description: "Property location",
            },
            bedrooms: {
              type: "integer",
              description: "Number of bedrooms",
            },
            bathrooms: {
              type: "integer",
              description: "Number of bathrooms",
            },
            area: {
              type: "number",
              description: "Property area in square feet",
            },
            available: {
              type: "boolean",
              description: "Property availability status",
            },
            userId: {
              type: "string",
              description: "ID of the user who created the listing",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Listing creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routes/*.js",
    "./src/controllers/*.js",
  ],
};

export const specs = swaggerJsdoc(options);