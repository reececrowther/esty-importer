// app/api/mockup/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { generateMockup } from "@/services/mockupEngine";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mockupName = formData.get("mockupName");
    const artwork = formData.get("artwork");

    if (!mockupName || typeof mockupName !== "string") {
      return NextResponse.json({ error: "mockupName required" }, { status: 400 });
    }
    if (!artwork || !(artwork instanceof File)) {
      return NextResponse.json({ error: "No artwork file uploaded" }, { status: 400 });
    }

    const tmpDir = path.join(process.cwd(), "storage", "uploads");
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `artwork_${Date.now()}_${artwork.name}`);
    const bytes = await artwork.arrayBuffer();
    await fs.promises.writeFile(tmpPath, Buffer.from(bytes));

    const outputFileName = `mockup_${Date.now()}.jpg`;
    const outputPath = path.join(process.cwd(), "storage", "exports", outputFileName);
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    await generateMockup(mockupName, tmpPath, outputPath);

    try {
      await fs.promises.unlink(tmpPath);
    } catch {
      // ignore cleanup errors
    }

    return NextResponse.json({ url: `/storage/exports/${outputFileName}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate mockup";
    console.error(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
