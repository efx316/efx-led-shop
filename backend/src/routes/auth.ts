import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createUser, getUserByEmail, verifyPassword } from '../services/userService.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await createUser(data);
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company_name: user.company_name,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await getUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(data.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company_name: user.company_name,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;

