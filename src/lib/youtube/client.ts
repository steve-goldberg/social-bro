import { google, youtube_v3 } from 'googleapis';

export function getYouTubeClient(): youtube_v3.Youtube {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set');
  }
  return google.youtube({
    version: 'v3',
    auth: apiKey,
  });
}
