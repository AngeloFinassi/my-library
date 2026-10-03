import { ObjectId } from "mongodb";
import { z } from "zod";

const mediaTypes = [
    "book",
    "manga",
    "movie",
    "animation",
    "cartoon",
    "anime",
    "series"
] as const;

const objectIdSchema = z.custom<ObjectId>((value) => value instanceof ObjectId, {
    message: "Expected a Mongo ObjectId"
});

const baseMediaSchema = z.object({
    title: z.string(),
    type: z.enum(mediaTypes),
    genre: z.string(),
    description: z.string(),
    rating: z.number().optional(),
    annotation: z.string().optional()
});

export const MediaSchema = z.object({
    _id: objectIdSchema,
    ...baseMediaSchema.shape
});

export type MediaSchema = z.infer<typeof MediaSchema>;

export const NewMediaSchema = baseMediaSchema;

export type NewMediaSchema = z.infer<typeof NewMediaSchema>;

export const UpdatedMediaSchema = z.object({
    _id: z.string().refine((value) => ObjectId.isValid(value), {
        message: "Invalid Mongo ObjectId"
    }),
    title: z.string().optional(),
    type: z.enum(mediaTypes).optional(),
    genre: z.string().optional(),
    description: z.string().optional(),
    rating: z.number().optional(),
    annotation: z.string().optional()
});

export type UpdatedMediaSchema = z.infer<typeof UpdatedMediaSchema>;

export const DeleteMediaSchema = z.object({
    _id: objectIdSchema,
    ...baseMediaSchema.shape
});

export type DeleteMediaSchema = z.infer<typeof DeleteMediaSchema>;