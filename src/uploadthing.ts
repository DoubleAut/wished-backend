import { createUploadthing, type FileRouter } from 'uploadthing/express';
import { UTApi } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter: FileRouter = {
    wishedUploader: f({
        image: {
            maxFileSize: '4MB',
            maxFileCount: 4,
        },
    }).onUploadComplete((data) => {
        console.log('upload completed', data);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

export const utapi = new UTApi();
