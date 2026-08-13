import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
      "test/test-" +
      Date.now() +
      ".txt";

    const fileContent =
      "Hello Appnetick!\n" +
      "B2 upload test successful.\n" +
      "Uploaded at: " +
      new Date().toISOString();

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: fileKey,
      Body: fileContent,
      ContentType: "text/plain"
    });

    await s3.send(command);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to B2",
      fileKey: fileKey,
      bucket: process.env.B2_BUCKET
    });

  } catch (error) {

    console.error("B2 UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.Code || error.name || null
    });
  }
}
