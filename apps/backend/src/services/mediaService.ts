import { database } from "../config/database.ts";
import { ObjectId } from "mongodb";
import {
    MediaSchema,
    NewMediaSchema,
    UpdatedMediaSchema,
    DeleteMediaSchema
} from "../types/Media.ts";

const mediaCollection = database.collection("media");

const toObjectId = (id: string): ObjectId => {
    if (!ObjectId.isValid(id)) {
        throw new Error("Invalid media id");
    }

    return new ObjectId(id);
};

const getMidias = async (): Promise<MediaSchema[]> => {
    const result = await mediaCollection.find({}).toArray();
    return result.map((item) => MediaSchema.parse(item));
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

export default {
    getMidias,
    getMediaById,
    createMedia,
    updateMedia,
    deleteMedia
};