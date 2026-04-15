import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://latejar.app", lastModified: new Date() },
    { url: "https://latejar.app/privacy", lastModified: new Date() },
  ];
}
