import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Team } from '../models/Team';
import { SLAPolicy } from '../models/SLAPolicy';
import { EmailService } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

const router = Router();

interface RegisterRequest extends AuthRequest {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends AuthRequest {
  body: {
    email: string;
    password: string;
  };
}

/**
 * POST /api/auth/register
 * Register a new team
 */
router.post('/register', async (req: RegisterRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if team already exists
    const existingTeam = await Team.findOne({ email: email.toLowerCase() });
    if (existingTeam) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create team
    const team = new Team({
      name,
      email: email.toLowerCase(),
      passwordHash,
      members: [
        {
          name,
          email: email.toLowerCase(),
          role: 'admin'
        }
      ],
      subscriptionPlan: 'free',
      ticketsUsed: 0,
      ticketLimit: 100 // Free plan
    });

    await team.save();

    // Create default SLA policy
    const defaultPolicy = new SLAPolicy({
      teamId: team._id,
      name: 'Default Policy',
      p1ResponseTime: 1,
      p2ResponseTime: 4,
      p3ResponseTime: 24,
      p1ResolutionTime: 2,
      p2ResolutionTime: 8,
      p3ResolutionTime: 48,
      businessHoursOnly: false
    });

    await defaultPolicy.save();

    // Link policy to team
    team.slaPolicy = defaultPolicy._id;
    await team.save();

    // Generate JWT token
    const jwtSecret = (process.env.JWT_SECRET || 'your-secret-key') as Secret;
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRY || '24h') as SignOptions['expiresIn']
    };
    const token = jwt.sign(
      { teamId: team._id.toString(), email: team.email },
      jwtSecret,
      signOptions
    );

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(team.email, team.name);
    } catch (emailError) {
      console.error('Warning: Could not send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      token,
      team: {
        _id: team._id,
        name: team.name,
        email: team.email,
        subscriptionPlan: team.subscriptionPlan
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login a team
 */
router.post('/login', async (req: LoginRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find team
    const team = await Team.findOne({ email: email.toLowerCase() });
    if (!team) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, team.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const jwtSecret = (process.env.JWT_SECRET || 'your-secret-key') as Secret;
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRY || '24h') as SignOptions['expiresIn']
    };
    const token = jwt.sign(
      { teamId: team._id.toString(), email: team.email },
      jwtSecret,
      signOptions
    );

    res.json({
      token,
      team: {
        _id: team._id,
        name: team.name,
        email: team.email,
        subscriptionPlan: team.subscriptionPlan,
        members: team.members
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
