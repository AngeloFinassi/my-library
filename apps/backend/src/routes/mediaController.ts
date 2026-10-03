import express from "express";
import mediaService from "../services/mediaService.ts";
import {
    NewMediaSchema,
    UpdatedMediaSchema
} from "../types/Media.ts";

const router = express.Router();

router.get("/", async (_req, res) => {
    const media = await mediaService.getMidias();
    res.json(media);
});

router.get("/:id", async (req, res) => {
    try {
        const media = await mediaService.getMediaById(req.params.id);
        res.send(media);
    } catch (error) {
        res.status(404).send("Media not found");
    }
});

router.post("/create", async (req, res) => {
    const newMedia = NewMediaSchema.parse(req.body);
    const addedMedia = await mediaService.createMedia(newMedia);

    res.json(addedMedia);
});

router.put("/update", async (req, res) => {
    const updatedMedia = UpdatedMediaSchema.parse(req.body);
    const media = await mediaService.updateMedia(updatedMedia);

    res.json(media);
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedMedia = await mediaService.deleteMedia(req.params.id);
        res.json(deletedMedia);
    } catch (error) {
        res.status(404).send("Media not found");
    }
});

export default router;