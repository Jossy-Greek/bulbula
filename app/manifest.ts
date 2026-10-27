import type { MetadataRoute } from "next";

/** "Add to home screen": opens like an app, in the brand colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bulbula Directory",
    short_name: "Bulbula",
    description: "Businesses, services and community places in Bole Bulbula, Addis Ababa.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#0e3d47",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
