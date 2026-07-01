import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/knowledge' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['Papers', 'Tutorials', 'Work Shapes', 'Architecture']),
    format: z.enum(['Write-up', 'Audio', 'Video', 'App']),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    order: z.number().default(100),
    // optional media (rendered above the body by the entry template)
    videoEmbed: z.string().optional(), // YouTube/Vimeo embed URL
    videoSrc: z.string().optional(), // path to a self-hosted video file (<video> tag)
    audioSrc: z.string().optional(), // path to an audio file
    appSrc: z.string().optional(), // iframe URL for a standalone mini-app
  }),
});

export const collections = { knowledge };
