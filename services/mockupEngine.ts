// services/mockupEngine.ts
import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * Generate a framed print mockup using Sharp
 * @param mockupName Name of the mockup folder in /mockups
 * @param artworkPath Path to uploaded artwork
 * @param outputPath Path to save generated mockup
 */
export async function generateMockup(
  mockupName: string,
  artworkPath: string,
  outputPath: string
) {
  const mockupFolder = path.join(process.cwd(), "mockups", mockupName);
  const baseImagePath = path.join(mockupFolder, "base.jpg");
  const configPath = path.join(mockupFolder, "config.json");

  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Base image not found for mockup: ${mockupName}`);
  }
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found for mockup: ${mockupName}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // Sharp composite layers
  let compositeLayers = [
    {
      input: artworkPath,
      top: config.frame.top || 0,
      left: config.frame.left || 0,
      blend: "over",
    },
  ];

  if (config.overlay) {
    const overlayPath = path.join(mockupFolder, config.overlay);
    if (fs.existsSync(overlayPath)) {
      compositeLayers.push({
        input: overlayPath,
        blend: "multiply",
        opacity: config.opacity || 0.9,
      });
    }
  }

  // Generate final mockup
  await sharp(baseImagePath)
    .composite(compositeLayers)
    .toFile(outputPath);

  return outputPath;
}
