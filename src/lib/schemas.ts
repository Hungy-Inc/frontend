import { z } from 'zod';

export const donationCategorySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    icon: z.string().optional(),
});

export type DonationCategoryFormData = z.infer<typeof donationCategorySchema>;

export const donationLocationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    location: z.string().min(1, 'Location is required'),
    contactInfo: z.string().optional(),
});

export type DonationLocationFormData = z.infer<typeof donationLocationSchema>;

// Outreach Location Schema
export const outreachLocationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    location: z.string().min(1, 'Location description is required'),
});

export type OutreachLocationFormData = z.infer<typeof outreachLocationSchema>;

// Organization Schema
export const organizationSchema = z.object({
    name: z.string().min(1, "Organization name is required"),
    email: z.string().email("Invalid email address"),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().default('America/Halifax'),
    incoming_dollar_value: z.coerce.number().min(0).default(10),
    mealsvalue: z.coerce.number().min(0).default(10),
    foodboxmealscount: z.coerce.number().min(0).default(2),
    backpackmealscount: z.coerce.number().min(0).default(10),
    notes: z.string().optional(),
    adminUser: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        password: z.string().optional(),
    }).optional(),
    isActive: z.boolean().default(true),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;

// User Schema
export const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    organizationId: z.coerce.number().min(1, "Organization is required"),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
