import type { ComponentType } from "react";
import AiAgentStory from "./scenes/AiAgent";
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
  "reinvent-database-cleaner": DatabaseCleanerStory,
  "reinvent-gallery-custom-links": GalleryLinksStory,
  "reinvent-lightbox": LightboxStory,
  "reinvent-media-cleanup": MediaCleanupStory,
  "reinvent-rename-replace-media": RenameReplaceStory,
  "reinvent-retina-images": RetinaImagesStory,
  "reinvent-rss-featured-image": RssFeaturedImageStory,
  "reinvent-watermark": WatermarkStory,
};

export default appStories;
