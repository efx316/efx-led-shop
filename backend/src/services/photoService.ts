import pool from '../db/index.js';
import { uploadFile } from './storageService.js';
import multer from 'multer';

export interface Photo {
  id: number;
  user_id: number;
  file_url: string;
  file_key: string;
  description: string | null;
  approved: boolean;
  created_at: Date;
}

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function createPhoto(
  userId: number,
  file: Express.Multer.File,
  description?: string
): Promise<Photo> {
  const { url, key } = await uploadFile(file, 'photos');

  const result = await pool.query(
    `INSERT INTO photos (user_id, file_url, file_key, description, approved)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, user_id, file_url, file_key, description, approved, created_at`,
    [userId, url, key, description || null]
  );

  return result.rows[0];
}

export async function getUserPhotos(userId: number): Promise<Photo[]> {
  const result = await pool.query(
    `SELECT id, user_id, file_url, file_key, description, approved, created_at
     FROM photos
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function getPhotoById(id: number, userId: number): Promise<Photo | null> {
  const result = await pool.query(
    `SELECT id, user_id, file_url, file_key, description, approved, created_at
     FROM photos
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  return result.rows[0] || null;
}



