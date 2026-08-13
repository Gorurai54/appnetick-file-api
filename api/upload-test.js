export default async function handler(req, res) {
  return res.status(200).json({
    success: true,

    B2_ENDPOINT: !!process.env.B2_ENDPOINT,
    B2_REGION: !!process.env.B2_REGION,
    B2_KEY_ID: !!process.env.B2_KEY_ID,
    B2_APPLICATION_KEY: !!process.env.B2_APPLICATION_KEY,
    B2_BUCKET: !!process.env.B2_BUCKET,

    bucketLength: process.env.B2_BUCKET
      ? process.env.B2_BUCKET.length
      : 0
  });
}
