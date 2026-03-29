import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveBase64Image(base64Data: string): Promise<string> {
  const base64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  const ext = base64Data.startsWith("data:image/png") ? "png" : "jpg";
  const filename = `${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  return `/api/uploads/${filename}`;
}

export function serveUploads(app: any): void {
  const express = require("express");
  app.use("/api/uploads", express.static(UPLOAD_DIR));
}
