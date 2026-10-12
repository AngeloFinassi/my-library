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
    NewMediaSchemasArray,
    openMidia
} from "../types/Media.ts";
import { searchOpenLibrary, getOpenLibraryDescription } from "./openLibrary.ts";

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
    const searchResult = await searchOpenLibrary(media.title);

    if (!searchResult.docs || searchResult.docs.length === 0) {
        throw new Error("No media found in Open Library for the provided title");
    }

    const result = converteOpenLibraryToMidia(searchResult, media);

    if (result.externalKey) {
        const description = await getOpenLibraryDescription(result.externalKey);

        if (description !== undefined) {
            result.description = description;
        }
    }

    const parsedResult = MediaSchema.parse(result);
    await mediaCollection.insertOne(parsedResult);
    return parsedResult;
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


const converteOpenLibraryToMidia = (openMidia: openMidia, midia: NewMediaSchema): MediaSchema => {
    const doc = openMidia.docs?.[0];

    if (!doc) {
        throw new Error("No valid Open Library document found for the provided title");
    }

    const genre = subjectToGenre(doc.subject);
    const coverUrl = typeof doc.cover_i === "number"
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : undefined;

    return MediaSchema.parse({
        _id: new ObjectId(),
        title: midia.title,
        type: midia.type,
        genre: genre.length > 0 ? genre : undefined,
        description: "",
        annotation: midia.annotation ?? "",
        rating: midia.rating,
        finishedAt: midia.finishedAt,
        status: midia.status,
        authorName: Array.isArray(doc.author_name) ? doc.author_name : undefined,
        coverUrl,
        firstPublishYear: typeof doc.first_publish_year === "number" ? doc.first_publish_year : undefined,
        languages: Array.isArray(doc.language) ? doc.language : undefined,
        externalKey: typeof doc.key === "string" ? doc.key : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
    });
};

const buildFilterQuery = (filters: FilterMediaSchema): MediaQuery => {
    const query: MediaQuery = {};
    const ratingFilter: RatingQuery = {};

    if (filters.type) {
        query.type = filters.type;
    }

    if (filters.genre) {
        query.genre = Array.isArray(filters.genre) ? filters.genre : [filters.genre];
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

    if (ratingFilter.$gte !== undefined || ratingFilter.$lte !== undefined) {
        if (query.rating !== undefined && typeof query.rating === "number") {
            query.rating = {
                ...ratingFilter,
                $gte: query.rating
            };
        } else {
            query.rating = ratingFilter;
        }
    }

    return query;
};

const subjectToGenre = (subjects?: string[]): string[] => {
    return (subjects ?? [])
        .filter((subject) => subject.startsWith("genre:"))
        .map((subject) => subject.replace(/^genre:/, ""));
};

export default {
    getMidias,
    getMediaById,
    createMedia,
    updateMedia,
    deleteMedia,
    createBulkMidia
};