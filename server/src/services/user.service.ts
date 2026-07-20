import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { UserRole } from '../types/auth';
import { ApiError } from '../utils/apiError';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const toPublicUser = (user: IUser) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  phone: user.phone,
  location: user.location,
  points: user.points,
  actionCounts: user.actionCounts,
  badges: user.badges,
  createdAt: user.createdAt
});

export const createUser = async ({
  name,
  email,
  password,
  role
}: CreateUserInput) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, 'Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role
  });
};

export const findUserForLogin = (email: string) => {
  return User.findOne({ email: email.toLowerCase().trim() }).select(
    '+passwordHash'
  );
};

export const findOrCreateSocialUser = async (data: {
  email: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
  providerId: string;
}) => {
  const normalizedEmail = data.email.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    if (!data.role) return null;

    // Generate a secure random password for social users
    const passwordHash = await bcrypt.hash(Math.random().toString(36), 12);
    
    user = await User.create({
      name: data.name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash,
      role: data.role,
      avatar: data.avatar
    });
  }

  return user;
};
