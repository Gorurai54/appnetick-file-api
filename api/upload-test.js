import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "GET only"
    });
  }

  try {

    const s3 = new S3Client({
      region: process.env.B2_REGION,
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
      }
    });

    const fileKey =
      "test/" +
      Date.now() +
      "-" +
      crypto.randomBytes(6).toString("hex") +
      ".txt";

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: fileKey,
      ContentType: "text/plain"
    });


    const bucket = process.env.B2_BUCKET;

if (!bucket) {
  return res.status(500).json({
    success: false,
    error: "B2_BUCKET is missing"
  });
}

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 900
      }
    );

    return res.status(200).json({
      success: true,
      message: "Upload URL generated successfully",
      fileKey: fileKey,
      uploadUrl: uploadUrl,
      expiresIn: 900
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.Code || error.name || null
    });
  }
}
