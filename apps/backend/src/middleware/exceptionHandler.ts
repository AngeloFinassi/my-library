import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const execeptionHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    let status = 500;
    let payload: Record<string, any> = { error: err.message || "Internal Server Error" };

    if (err instanceof z.ZodError) {
        status = 400;
        payload = {
            error: err.issues.map((issue) => ({
                message: issue.message,
                field: issue.path?.[0]
            }))
        };
    }

    return res.status(status).json(payload);
}