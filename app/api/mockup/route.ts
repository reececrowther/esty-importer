// app/api/mockup/route.ts
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";
import path from "path";
import fs from "fs";
import { generateMockup } from "@/services/mockupEngine";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const form = new formidable.IncomingForm({ multiples: true });

  const data: any = await new Promise((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });

  try {
    const mockupName = data.fields.mockupName;
    const artworkFile = Array.isArray(data.files.artwork)
      ? data.files.artwork[0]
      : data.files.artwork;

    if (!artworkFile) throw new Error("No artwork file uploaded");

    const artworkPath = artworkFile.filepath || artworkFile.path;

    const outputFileName = `mockup_${Date.now()}.jpg`;
    const outputPath = path.join(process.cwd(), "storage", "exports", outputFileName);

    await generateMockup(mockupName, artworkPath, outputPath);

    return NextResponse.json({ url: `/storage/exports/${outputFileName}` });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to generate mockup" }, { status: 500 });
  }
}
