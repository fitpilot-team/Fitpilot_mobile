import { getAssetUrl, getVideoThumbnailUrl } from '../services/api';
import type { ExerciseMedia } from '../types';

export type ResolvedTechniqueMedia = {
  videoUrl: string | null;
  useYouTubeModal: boolean;
  gifUrl: string | null;
  posterUrl: string | null;
};

export const isYouTubeUrl = (value: string | null | undefined) => !!value && /youtube\.com|youtu\.be/i.test(value);

const isGifUrl = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }

  const [withoutQuery] = value.split(/[?#]/);
  return /\.gif$/i.test(withoutQuery ?? value);
};

export const resolveTechniqueMedia = (
  media: ExerciseMedia | null | undefined,
): ResolvedTechniqueMedia => {
  const videoUrl = getAssetUrl(media?.video_url);
  const useYouTubeModal = !videoUrl || isYouTubeUrl(videoUrl);
  const thumbnailUrl = getAssetUrl(media?.thumbnail_url);
  const imageUrl = getAssetUrl(media?.image_url);
  const gifUrl = [thumbnailUrl, imageUrl].find((candidate) => isGifUrl(candidate)) ?? null;
  const posterUrl =
    (!useYouTubeModal ? getVideoThumbnailUrl(videoUrl) : null) ||
    [imageUrl, thumbnailUrl].find((candidate) => candidate && !isGifUrl(candidate)) ||
    null;

  return { videoUrl, useYouTubeModal, gifUrl, posterUrl };
};
