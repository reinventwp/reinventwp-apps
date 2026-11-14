import type { ComponentType } from "react";
import AiAgentStory from "./scenes/AiAgent";
import AltTextStory from "./scenes/AltText";
import AutoFeaturedImageStory from "./scenes/AutoFeaturedImage";
import DatabaseCleanerStory from "./scenes/DatabaseCleaner";
import GalleryLinksStory from "./scenes/GalleryLinks";
import LightboxStory from "./scenes/Lightbox";
import MediaCleanupStory from "./scenes/MediaCleanup";
import RenameReplaceStory from "./scenes/RenameReplace";
import RetinaImagesStory from "./scenes/RetinaImages";
import RssFeaturedImageStory from "./scenes/RssFeaturedImage";
import TextToSpeechStory from "./scenes/TextToSpeech";
import WatermarkStory from "./scenes/Watermark";

/** One three-step story per app, by WordPress.org slug. Apps without one show no scene. */
const appStories: Record<string, ComponentType> = {
  "ai-agent": AiAgentStory,
  "natural-text-to-speech": TextToSpeechStory,
  "reinvent-alt-text": AltTextStory,
  "reinvent-auto-featured-image": AutoFeaturedImageStory,
  "reinvent-database-cleaner": DatabaseCleanerStory,
  "reinvent-image-links": GalleryLinksStory,
  "reinvent-lightbox": LightboxStory,
  "reinvent-media-cleanup": MediaCleanupStory,
  "reinvent-rename-replace-media": RenameReplaceStory,
  "reinvent-retina-images": RetinaImagesStory,
  "reinvent-rss-featured-image": RssFeaturedImageStory,
  "reinvent-watermark": WatermarkStory,
};

export default appStories;
