import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export default async function handler(req, res) {

  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    // ============================================
    // B2 CONFIG
    // ============================================

    const endpoint = process.env.B2_ENDPOINT;
    const region = process.env.B2_REGION;
    const accessKeyId = process.env.B2_KEY_ID;
    const secretAccessKey = process.env.B2_APPLICATION_KEY;
    const bucket = process.env.B2_BUCKET;

    if (
      !endpoint ||
      !region ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucket
    ) {
      return res.status(500).json({
        success: false,
        error: "B2 environment variables are missing"
      });
    }

    // ============================================
    // REQUEST BODY
    // ============================================

    const {
      fileName,
      contentType,
      fileSize
    } = req.body || {};

    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: "fileName is required"
      });
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: "contentType is required"
      });
    }

    // ============================================
    // FILE SIZE
    // ============================================

    const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB

    if (
      fileSize &&
      Number(fileSize) > MAX_FILE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        error: "File size exceeds 1 GB limit"
      });
    }

    // ============================================
    // CLEAN FILE NAME
    // ============================================

    const originalName = String(fileName)
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    // ============================================
    // FOLDER
    // ============================================

    let folder = "files";

    if (contentType.startsWith("image/")) {

      folder = "images";

    } else if (contentType.startsWith("video/")) {

      folder = "videos";

    } else if (contentType.startsWith("audio/")) {

      folder = "audio";

    } else if (
      contentType === "application/vnd.android.package-archive"
    ) {

      folder = "apk";

    } else if (
      contentType === "application/pdf" ||
      contentType.startsWith("text/") ||
      contentType.includes("document") ||
      contentType.includes("spreadsheet")
    ) {

      folder = "documents";
    }

    // ============================================
    // UNIQUE FILE KEY
    // ============================================

    const randomId = crypto
      .randomBytes(12)
      .toString("hex");

    const fileKey =
      folder +
      "/" +
      Date.now() +
      "-" +
      randomId +
      "-" +
      originalName;

    // ============================================
    // B2 S3 CLIENT
    // ============================================

    const s3 = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    });

    // ============================================
    // PUT OBJECT
    // ============================================

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType
    });

    // ============================================
    // SIGNED UPLOAD URL
    // ============================================

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 900
      }
    );

    // ============================================
    // RESPONSE
    // ============================================

    return res.status(200).json({

      success: true,

      message: "Upload URL generated successfully",

      fileName: originalName,

      fileKey: fileKey,

      contentType: contentType,

      fileSize: fileSize || null,

      uploadUrl: uploadUrl,

      expiresIn: 900

    });

  } catch (error) {

    console.error(
      "B2 UPLOAD URL ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error.message ||
        "Failed to generate upload URL",

      code:
        error.Code ||
        error.name ||
        null

    });
  }
}
