import { ObjectId } from "mongodb";
import { z } from "zod";

const LIMIT_DEFAULT = 20;
const OFFSET_DEFAULT = 0;

const mediaTypes = [
    "book",
    "manga",
    "movie",
    "animation",
    "cartoon",
    "anime",
    "series"
]

const status = [
    "reading",
    "finished",
    "planned",
    "dropped"
]

const objectIdSchema = z.custom<ObjectId>((value) => value instanceof ObjectId, {
    message: "Expected a Mongo ObjectId"
});

export type RatingQuery = {
    $gte?: number;
    $lte?: number;
};

type RegexQuery = {
    $regex: string;
    $options: string;
}

type FieldRegex = {
    title?: RegexQuery;
    description?: RegexQuery;
    annotation?: RegexQuery;
    genre?: RegexQuery;
}

export type MediaQuery = {
    type?: string;
    genre?: string;
    rating?: number | RatingQuery;
    status?: string;
    finishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    $or?: FieldRegex[]
}

export type MediaListResponse = {
    data: MediaSchema[];
    filters: FilterMediaSchema;
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}

export const ratingFilterSchema = z.object({
    rating: z.coerce.number().optional(),
    minRating: z.coerce.number().optional(),
    maxRating: z.coerce.number().optional(),
    status: z.enum(status).optional(),
    finishedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional()
});

export type RatingFilterSchema = z.infer<typeof ratingFilterSchema>

export const paginationSchema = z.object({
    limit: z.coerce.number()
        .min(1, { message: "Limit must be at least 1" })
        .max(100, { message: "Limit cannot exceed 100" })
        .default(LIMIT_DEFAULT),
    offset: z.coerce.number().min(0).default(OFFSET_DEFAULT)
});

export const filterMediaSchema = z.object({
    type: z.enum(mediaTypes).optional(),
    genre: z.string().optional(),
    search: z.string().optional(),
    ...ratingFilterSchema.shape,
    ...paginationSchema.shape
});

export type FilterMediaSchema = z.infer<typeof filterMediaSchema>;

const baseMediaSchema = z.object({
    title: z.string(),
    type: z.enum(mediaTypes),
    genre: z.string(),
    description: z.string(),
    rating: z.number().optional(),
    annotation: z.string().optional(),
    status: z.enum(status),
    finishedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional()
});

export const MediaSchema = z.object({
    _id: objectIdSchema,
    ...baseMediaSchema.shape
});

export type MediaSchema = z.infer<typeof MediaSchema>;

export const NewMediaSchema = baseMediaSchema;

export const NewMediaSchemasArray = z.array(NewMediaSchema);

export type NewMediaSchema = z.infer<typeof NewMediaSchema>;

export type NewMediaSchemasArray = z.infer<typeof NewMediaSchemasArray>;

export const UpdatedMediaSchema = z.object({
    _id: z.string().refine((value) => ObjectId.isValid(value), {
        message: "Invalid Mongo ObjectId"
    }),
    title: z.string().optional(),
    type: z.enum(mediaTypes).optional(),
    genre: z.string().optional(),
    description: z.string().optional(),
    rating: z.number().optional(),
    annotation: z.string().optional(),
    status: z.enum(status).optional(),
    finishedAt: z.coerce.date().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional()
});

export type UpdatedMediaSchema = z.infer<typeof UpdatedMediaSchema>;

export const DeleteMediaSchema = z.object({
    _id: objectIdSchema,
    ...baseMediaSchema.shape
});

export type DeleteMediaSchema = z.infer<typeof DeleteMediaSchema>;