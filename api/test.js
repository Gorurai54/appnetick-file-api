import {
  S3Client,
  HeadBucketCommand
} from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  try {
    const s3 = new S3Client({
      region: process.env.B2_REGION,
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
      }
    });

    await s3.send(
      new HeadBucketCommand({
        Bucket: process.env.B2_BUCKET
      })
    );

    return res.status(200).json({
      success: true,
      message: "B2 bucket connection successful",
      bucket: process.env.B2_BUCKET
    });

  } catch (error) {
    console.error("B2 TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.Code || error.name || null
    });
  }
}
