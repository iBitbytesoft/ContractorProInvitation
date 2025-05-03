import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing table definitions remain unchanged
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  avatarUrl: text("avatar_url"),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  location: text("location"),
  purchaseDate: timestamp("purchase_date"),
  serialNumber: text("serial_number"),
  notes: text("notes"),
  imageUrl: text("image_url"),
});

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abn: text("abn"),
  industry: text("industry").notNull(),
  address: text("address"),
  website: text("website"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  licenseNumber: text("license_number"),
  insuranceExpiry: timestamp("insurance_expiry"),
  complianceStatus: text("compliance_status"),
  bankName: text("bank_name"),
  accountName: text("account_name"),
  bsb: text("bsb"),
  bankAccount: text("bank_account"),
  paymentTerms: text("payment_terms"),
  rating: integer("rating"),
  approvalStatus: text("approval_status"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  uploadDate: timestamp("upload_date").notNull(),
  category: text("category").notNull(),
});

// Enhanced form validation schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const insertAssetSchema = createInsertSchema(assets)
  .omit({ id: true })
  .extend({
    imageFile: z.instanceof(File).optional(),
    purchaseDate: z.string().optional(),
    status: z.enum(["available", "in_use", "maintenance", "retired"]),
    type: z.enum(["heavy_equipment", "tools", "vehicles", "other"]),
  });

export const insertVendorSchema = createInsertSchema(vendors)
  .omit({ id: true, createdAt: true })
  .extend({
    industry: z.enum(["electrical", "plumbing", "civil", "mechanical", "construction", "other"]),
    complianceStatus: z.enum(["pending", "approved", "expired"]).default("pending"),
    paymentTerms: z.enum(["net7", "net14", "net30", "net60"]).default("net30"),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).default("pending"),
    rating: z.number().min(1).max(5).optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().regex(/^\+?[\d\s-()]{10,}$/, "Invalid phone number").optional(),
    website: z.string().url("Invalid website URL").optional(),
    abn: z.string().regex(/^\d{11}$/, "Invalid ABN format").optional().or(z.literal('').optional()),
    bsb: z.string().regex(/^\d{6}$/, "Invalid BSB format").optional(),
    bankAccount: z.string().regex(/^\d{6,10}$/, "Invalid bank account number").optional(),
    insuranceExpiry: z.string().optional(),
  });

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({ id: true })
  .extend({
    file: z.instanceof(File),
    category: z.enum(["contract", "invoice", "report", "certification", "other"]),
  });

// Business profile schema
export const businessProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-()]{10,}$/, "Invalid phone number"),
  address: z.string().min(1, "Address is required"),
  website: z.string().url("Invalid website URL").optional(),
  description: z.string().max(500, "Description must be less than 500 characters"),
  logo: z.instanceof(File).optional(),
});

// User invitation schema
export const userInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "user"]),
  message: z.string().max(200, "Message must be less than 200 characters").optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type UserInvitation = z.infer<typeof userInvitationSchema>;