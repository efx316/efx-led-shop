import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  } else if (provider === 'local' || provider === 'filesystem') {
    return uploadToLocal(file, folder);
  } else {
    throw new Error(`Unsupported storage provider: ${provider}. Use 'local', 's3', or 'spaces'`);
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

async function uploadToLocal(file: Express.Multer.File, folder: string): Promise<UploadResult> {
  // Use UPLOAD_DIR environment variable or default to 'uploads' directory
  // For Railway Volumes, mount a volume and set UPLOAD_DIR to the mount path
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const folderPath = path.join(uploadDir, folder);
  
  // Ensure directory exists
  await fs.mkdir(folderPath, { recursive: true });
  
  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}-${sanitizedName}`;
  const filePath = path.join(folderPath, filename);
  
  // Write file to disk
  await fs.writeFile(filePath, file.buffer);
  
  // Generate URL - use Railway's public domain or API_URL
  let baseUrl = 'http://localhost:3000';
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (process.env.API_URL) {
    baseUrl = process.env.API_URL;
  } else if (process.env.NODE_ENV === 'production') {
    // Try to get from Railway environment variables
    const railwayDomain = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN;
    if (railwayDomain) {
      baseUrl = `https://${railwayDomain}`;
    }
  }
  
  const url = `${baseUrl}/uploads/${folder}/${filename}`;
  const key = `${folder}/${filename}`;
  
  return { url, key };
}



