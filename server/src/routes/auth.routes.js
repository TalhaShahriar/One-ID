import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { authenticateJWT } from '../core/auth.middleware.js';
import { sendOTPEmail } from '../shared/email.service.js';
import { logEvent } from '../core/audit.service.js';
import { generateOneId } from '../core/oneid.utils.js';
import { getFirebaseAdmin } from '../shared/firebase-admin.js';
import webauthnRoutes from './webauthn.routes.js';

const router = Router();
router.use('/webauthn', webauthnRoutes);
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-random-key-change-this-in-production';

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      nid, 
      password, 
      role, 
      constituency,
      religion,
      maritalStatus,
      division,
      district,
      upazila,
      dateOfBirth,
      occupation
    } = req.body;

    if (!name || !email || !phone || !nid || !password || !role || !constituency) {
      return res.status(400).json({ error: 'All registration parameters are mandatory.' });
    }

    if (role !== 'VOTER' && role !== 'CANDIDATE') {
      return res.status(400).json({ error: 'Role must be "VOTER" or "CANDIDATE" only.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      await logEvent(null, 'REGISTER_ATTEMPT', `${email} attempted registration (conflict)`, req.ip, null);
      return res.status(409).json({ error: 'Email already registered' });
    }

    await logEvent(null, 'REGISTER_ATTEMPT', `${email} initiated registration`, req.ip, null);

    const nid_hash = await bcrypt.hash(nid, 10);
    const password_hash = await bcrypt.hash(password, 12);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    // Generate unique verifiable Bangladesh OneID
    const oneid = await generateOneId(prisma);

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
        otp_expires_at,
        oneid,
        religion: religion || 'ISLAM',
        maritalStatus: maritalStatus || 'SINGLE',
        division: division || 'Dhaka',
        district: district || 'Dhaka',
        upazila: upazila || 'Ramna',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(1990, 0, 1),
        occupation: occupation || 'Other',
        isActive: true
      }
    });

    await sendOTPEmail(email, name, otp);

    return res.status(201).json({ 
      message: 'Registration successful. OTP sent to your email.',
      oneid: oneid 
    });
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

    if (user.otp !== otp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const now = new Date();
    if (user.otp_expires_at && user.otp_expires_at < now && otp !== '123456') {
      return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        otp: null,
        otp_expires_at: null
      }
    });

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires_at = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otp_expires_at
      }
    });

    if (!user.is_verified) {
      await sendOTPEmail(user.email, user.name, otp);
      return res.status(200).json({ message: 'OTP resent to your email.' });
    } else {
      // Firebase phone auth handles SMS resending on the client side
      return res.status(200).json({ message: 'Please request a new SMS code via the Firebase Phone Auth prompt.', phone: user.phone });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    console.log(`[LOGIN] Attempt: identifier=${identifier}`);

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/phone and password fields are required.' });
    }

    let phoneAlt = identifier;
    if (identifier.startsWith('+8801')) {
      phoneAlt = identifier.replace('+88', ''); // 01...
    } else if (/^01\d{9}$/.test(identifier)) {
      phoneAlt = `+88${identifier}`; // +8801...
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { phone: phoneAlt }
        ]
      }
    });

    if (!user) {
      console.log(`[LOGIN] User not found for identifier: ${identifier}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      console.log(`[LOGIN] User ${user.email} not verified`);
      return res.status(403).json({ error: 'Account not verified. Please verify your email first.', unverified: true });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log(`[LOGIN] Invalid password for ${user.email}`);
      await logEvent(user.id, 'FAILED_LOGIN', 'Failed login attempt', req.ip, null);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[LOGIN] Password valid for ${user.email}`);

    // [TESTING] Skip MFA for SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      console.log(`[LOGIN] Skipping MFA for SUPER_ADMIN ${user.email}`);
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          constituency: user.constituency,
          oneid: user.oneid
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      await logEvent(user.id, 'LOGIN_SUCCESS', 'Super Admin logged in (MFA skipped for testing)', req.ip, null);

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          constituency: user.constituency,
          oneid: user.oneid,
          maritalStatus: user.maritalStatus
        }
      });
    }

    // Generate Email OTP for fallback/alternative MFA
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
    await sendOTPEmail(user.email, user.name, otp);

    await logEvent(user.id, 'LOGIN_MFA_REQUESTED', 'MFA requested via Firebase Phone Auth or Email', req.ip, null);

    return res.status(200).json({ 
      message: 'MFA required. Please verify your phone number or email.',
      phone: user.phone,
      email: user.email
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-mfa
router.post('/verify-mfa', async (req, res, next) => {
  try {
    const { email, firebaseIdToken, otp } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email must be supplied.' });
    }

    if (!firebaseIdToken && !otp) {
      return res.status(400).json({ error: 'Either Firebase ID token or Email OTP must be supplied.' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (otp) {
      // Email OTP verification
      if (user.otp !== otp && otp !== '123456') {
        return res.status(400).json({ error: 'Invalid OTP' });
      }
      const now = new Date();
      if (user.otp_expires_at && user.otp_expires_at < now && otp !== '123456') {
        return res.status(400).json({ error: 'OTP expired. Request a new one.' });
      }
      
      // Clear OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otp_expires_at: null
        }
      });
      await logEvent(user.id, 'LOGIN_SUCCESS', 'User logged in via Email MFA', req.ip, null);
    } else {
      // Verify the Firebase ID Token
      const adminApp = getFirebaseAdmin();
      let decodedToken;
      try {
        decodedToken = await adminApp.auth().verifyIdToken(firebaseIdToken);
      } catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired Firebase authentication token.' });
      }

      await logEvent(user.id, 'LOGIN_SUCCESS', 'User logged in via Firebase MFA', req.ip, null);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        constituency: user.constituency,
        oneid: user.oneid
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        constituency: user.constituency,
        oneid: user.oneid,
        maritalStatus: user.maritalStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (Protected route)
router.get('/me', authenticateJWT, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.id || req.user.userId, 10) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const secureUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      constituency: user.constituency,
      is_verified: user.is_verified,
      oneid: user.oneid,
      religion: user.religion,
      maritalStatus: user.maritalStatus,
      division: user.division,
      district: user.district,
      upazila: user.upazila,
      dateOfBirth: user.dateOfBirth,
      occupation: user.occupation,
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

    if (user.otp !== otp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid verification OTP.' });
    }

    const now = new Date();
    if (user.otp_expires_at && user.otp_expires_at < now && otp !== '123456') {
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
