import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // -----------------------------
    // Environment variables
    // -----------------------------

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

    // -----------------------------
    // Get information from request
    // -----------------------------

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

    // -----------------------------
    // Validate file size
    // -----------------------------

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

    if (fileSize && Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: "File is larger than 500 MB"
      });
    }

    // -----------------------------
    // Clean file name
    // -----------------------------

    const originalName = fileName
      .split("/")
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    // -----------------------------
    // Detect folder
    // -----------------------------

    let folder = "other";

    if (contentType.startsWith("image/")) {
      folder = "images";
    } else if (contentType.startsWith("video/")) {
      folder = "videos";
    } else if (contentType.startsWith("audio/")) {
      folder = "audio";
    } else if (
      contentType === "application/pdf" ||
      contentType.includes("document") ||
      contentType.includes("text")
    ) {
      folder = "documents";
    } else if (
      contentType === "application/vnd.android.package-archive"
    ) {
      folder = "apk";
    }

    // -----------------------------
    // Generate unique file name
    // -----------------------------

    const randomId = crypto.randomBytes(12).toString("hex");

    const fileKey =
      `${folder}/${Date.now()}-${randomId}-${originalName}`;

    // -----------------------------
    // Create B2 S3 client
    // -----------------------------

    const s3 = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    });

    // -----------------------------
    // Create upload command
    // -----------------------------

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: contentType
    });

    // -----------------------------
    // Generate temporary upload URL
    // -----------------------------

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 900
      }
    );

    // -----------------------------
    // Response
    // -----------------------------

    return res.status(200).json({
      success: true,

      fileKey: fileKey,

      fileName: originalName,

      contentType: contentType,

      uploadUrl: uploadUrl,

      expiresIn: 900
    });

  } catch (error) {

    console.error("B2 upload URL error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to create upload URL"
    });
  }
        }
