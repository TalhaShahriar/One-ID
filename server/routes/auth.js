import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { sendOTPEmail } from '../utils/email.js';
import { logEvent } from '../utils/audit.js';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-random-key-change-this-in-production';

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, nid, password, role, constituency } = req.body;

    if (!name || !email || !phone || !nid || !password || !role || !constituency) {
      return res.status(400).json({ error: 'All registration parameters are mandatory.' });
    }

    if (role !== 'VOTER' && role !== 'CANDIDATE') {
      return res.status(400).json({ error: 'Role must be "VOTER" or "CANDIDATE" only.' });
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Log event of type REGISTER_ATTEMPT even if user exists
      await logEvent(null, 'REGISTER_ATTEMPT', `${email} attempted registration`, req.ip, null);
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Log the registration attempt before user creation
    await logEvent(null, 'REGISTER_ATTEMPT', `${email} attempted registration`, req.ip, null);

    // Hash NID using bcrypt(nid, 10). NEVER store plaintext NID
    const nid_hash = await bcrypt.hash(nid, 10);

    // Hash password with bcrypt(password, 12)
    const password_hash = await bcrypt.hash(password, 12);

    // Generate 6-digit numeric OTP and expiry (5 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        nid_hash,
        password_hash,
        role,
        constituency,
        is_verified: false,
        otp,
        otp_expires_at
      }
    });

    // Send the OTP verification email
    await sendOTPEmail(email, name, otp);

    return res.status(201).json({ message: 'Registration successful. OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP verification token must be supplied.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const now = new Date();
    if (user.otp_expires_at && user.otp_expires_at < now) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }

    // Mark user as verified, clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        otp: null,
        otp_expires_at: null
      }
    });

    // Log verification event
    await logEvent(user.id, 'EMAIL_VERIFIED', 'Email verified successfully', req.ip, null);

    return res.status(200).json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Generate new OTP and update DB
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otp_expires_at
      }
    });

    // Send OTP email
    await sendOTPEmail(email, user.name, otp);

    return res.status(200).json({ message: 'OTP resent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password fields are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Account not verified. Please verify your email first.', unverified: true });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Log failed login
      await logEvent(user.id, 'FAILED_LOGIN', 'Failed login attempt', req.ip, null);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate registration/MFA OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otp_expires_at
      }
    });

    // Send email with MFA OTP code
    await sendOTPEmail(email, user.name, otp);

    // Log that MFA was dispatched
    await logEvent(user.id, 'LOGIN_MFA_SENT', 'MFA OTP sent', req.ip, null);

    return res.status(200).json({ message: 'MFA OTP sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-mfa
router.post('/verify-mfa', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP verification token must be supplied.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const now = new Date();
    if (user.otp_expires_at && user.otp_expires_at < now) {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }

    // Issue JWT Token with userId
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        constituency: user.constituency
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Clear otp in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otp_expires_at: null
      }
    });

    // Log successful authentication event
    await logEvent(user.id, 'LOGIN_SUCCESS', 'User logged in', req.ip, null);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        constituency: user.constituency
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (Protected route)
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id, 10) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Safe return context: filter secret data hashes
    const secureUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      constituency: user.constituency,
      is_verified: user.is_verified,
      created_at: user.created_at
    };

    return res.json(secureUser);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is mandatory.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account matching this email address was found.' });
    }

    // Generate 6-digit numeric OTP and expiry (5 min)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otp_expires_at
      }
    });

    // Send the OTP verification email
    await sendOTPEmail(email, user.name, otp);

    // Log the event
    await logEvent(user.id, 'FORGOT_PASSWORD_REQUEST', `Forgot password OTP sent to ${email}`, req.ip, null);

    return res.status(200).json({ message: 'A 6-digit password reset OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification OTP.' });
    }

    const now = new Date();
    if (user.otp_expires_at && user.otp_expires_at < now) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Hash the new password with bcrypt(password, 12)
    const password_hash = await bcrypt.hash(password, 12);

    // Update user in DB, clear OTP details
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        otp: null,
        otp_expires_at: null
      }
    });

    // Log successful password reset event
    await logEvent(user.id, 'PASSWORD_RESET_SUCCESS', `Password reset successfully for ${email}`, req.ip, null);

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    next(err);
  }
});

export default router;
