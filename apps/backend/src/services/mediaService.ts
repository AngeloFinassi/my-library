import { database } from "../config/database.ts";
import { ObjectId } from "mongodb";
import {
    MediaSchema,
    MediaListResponse,
    NewMediaSchema,
    UpdatedMediaSchema,
    DeleteMediaSchema,
    FilterMediaSchema,
    RatingQuery,
    MediaQuery,
    NewMediaSchemasArray
} from "../types/Media.ts";

const mediaCollection = database.collection("media");

const toObjectId = (id: string): ObjectId => {
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid media id");
    }

    return new ObjectId(id);
};

const getMidias = async (filters: FilterMediaSchema): Promise<MediaListResponse> => {
    const query: MediaQuery = buildFilterQuery(filters);

    const { limit, offset } = filters;

    const result = await mediaCollection
        .find(query)
        .skip(offset)
        .limit(limit)
        .toArray();

    const total = await mediaCollection.countDocuments(query);
    const data = result.map((item) => MediaSchema.parse(item));

    return {
        data,
        filters,
        pagination: {
            limit,
            offset,
            total
        }

    }
};

const getMediaById = async (id: string): Promise<MediaSchema> => {
    const doc = await mediaCollection.findOne({ _id: toObjectId(id) });

    if (!doc) {
        throw new Error("Media not found");
    }

    return MediaSchema.parse(doc);
};

const createMedia = async (media: NewMediaSchema): Promise<MediaSchema> => {
    const result = await mediaCollection.insertOne(media);

    return MediaSchema.parse({
        _id: result.insertedId,
        ...media
    });
};

const createBulkMidia = async (mediaArray: NewMediaSchemasArray): Promise<MediaSchema[]> => {
    const result = await mediaCollection.insertMany(mediaArray);

    return mediaArray.map((media, index) => MediaSchema.parse({
        _id: result.insertedIds[index],
        ...media
    }));
}

const updateMedia = async (media: UpdatedMediaSchema): Promise<MediaSchema> => {
    const { _id, ...mediaData } = media;

    const doc = await mediaCollection.findOneAndUpdate(
        { _id: toObjectId(_id) },
        { $set: mediaData },
        { returnDocument: "after" }
    );

    if (!doc) {
        throw new Error("Media not found");
    }

    return MediaSchema.parse(doc);
};

const deleteMedia = async (id: string): Promise<DeleteMediaSchema> => {
    const doc = await mediaCollection.findOneAndDelete({ _id: toObjectId(id) });

    if (!doc) {
        throw new Error("Media not found");
    }

    return DeleteMediaSchema.parse(doc);
};

const buildFilterQuery = (filters: FilterMediaSchema): MediaQuery => {
    const query: MediaQuery = {};
    const ratingFilter: RatingQuery = {};

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.genre) {
        query.genre = filters.genre;
    }
    
    if (filters.rating !== undefined) {
        query.rating = filters.rating;
    }

    if (filters.maxRating !== undefined) {
        ratingFilter.$lte = filters.maxRating;
    }

    if (filters.minRating !== undefined) {
        ratingFilter.$gte = filters.minRating;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.finishedAt) {
        query.finishedAt = filters.finishedAt;
    }

    if (filters.createdAt) {
        query.createdAt = filters.createdAt;
    }

    if (filters.updatedAt) {
        query.updatedAt = filters.updatedAt;
    }

    if (filters.search) {
        query.$or = [
            {
                title: {
                    $regex: filters.search,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: filters.search,
                    $options: "i"
                }
            },
            {
                annotation: {
                    $regex: filters.search,
                    $options: "i"
                }
            },
            {
                genre: {
                    $regex: filters.search,
                    $options: "i"
                }
            }
        ];
    }

    if (filters.rating !== undefined) {
        query.rating = filters.rating;
        return query;
    }

    if (ratingFilter.$gte !== undefined || ratingFilter.$lte !== undefined) {
        query.rating = ratingFilter;
    }

    return query;
}

export default {
    getMidias,
    getMediaById,
    createMedia,
    updateMedia,
    deleteMedia,
    createBulkMidia
};