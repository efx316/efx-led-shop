import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const provider = process.env.STORAGE_PROVIDER || 's3';

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadFile(
  file: Express.Multer.File,
  folder: string = 'photos'
): Promise<UploadResult> {
  if (provider === 's3') {
    return uploadToS3(file, folder);
  } else if (provider === 'spaces') {
    return uploadToSpaces(file, folder);
  } else {
    throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

async function uploadToS3(file: Express.Multer.File, folder: string): Promise<UploadResult> {
  const client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });

  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME not configured');
  }

  const key = `${folder}/${Date.now()}-${file.originalname}`;
  const stream = Readable.from(file.buffer);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: file.mimetype,
      ACL: 'public-read',
    })
  );

  const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;

  return { url, key };
}

async function uploadToSpaces(file: Express.Multer.File, folder: string): Promise<UploadResult> {
  const client = new S3Client({
    endpoint: process.env.SPACES_ENDPOINT,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.SPACES_KEY || '',
      secretAccessKey: process.env.SPACES_SECRET || '',
    },
    forcePathStyle: false,
  });

  const bucket = process.env.SPACES_BUCKET;
  if (!bucket) {
    throw new Error('SPACES_BUCKET not configured');
  }

  const key = `${folder}/${Date.now()}-${file.originalname}`;
  const stream = Readable.from(file.buffer);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: file.mimetype,
      ACL: 'public-read',
    })
  );

  const endpoint = process.env.SPACES_ENDPOINT?.replace('https://', '') || '';
  const url = `https://${bucket}.${endpoint}/${key}`;

  return { url, key };
}



