import type { openMidia } from "../types/Media.ts";

const OPEN_LIBRARY_URL = "https://openlibrary.org/search.json";

type SearchOptions = {
    fields?: string[];
    limit?: number;
};

const DEFAULT_FIELDS = [
    "key",
    "title",
    "author_name",
    "cover_i",
    "first_publish_year",
    "subject",
    "language",
    "edition_count"
];

const DEFAULT_LIMIT = 1;

export const searchOpenLibrary = async (
    title: string,
    options: SearchOptions = {}
): Promise<openMidia> => {
    const {
        fields = DEFAULT_FIELDS,
        limit = DEFAULT_LIMIT
    } = options;

    const url = new URL(OPEN_LIBRARY_URL);

    url.searchParams.set("q", title.trim());
    url.searchParams.set("fields", fields.join(","));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library request failed: ${response.status}`
        );
    }

    const data = await response.json() as openMidia;

    if (!data || !Array.isArray(data.docs)) {
        throw new Error("Invalid Open Library response");
    }

    return data;
};

export const getOpenLibraryDescription = async (key?: string): Promise<string | undefined> => {
    if (!key) {
        return undefined;
    }

    const normalizedKey = key.startsWith("/") ? key : `/${key}`;
    const url = `https://openlibrary.org${normalizedKey}.json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Open Library request failed: ${response.status}`
        );
    }

    const data = await response.json() as {
        description?: string | { value?: string } | null;
    };

    if (typeof data.description === "string") {
        return data.description;
    }

    if (data.description && typeof data.description === "object") {
        return data.description.value ?? undefined;
    }

    return undefined;
};
