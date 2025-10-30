
import * as userModel from '../models/userModel.js';
import bcrypt from 'bcryptjs';




const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

//Get current user profile
export const getMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userModel.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};



// Update user by ID
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { username, email, password } = req.body;
    const updates = {};

    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Update my profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, password } = req.body;
    const updates = {};

    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No update fields provided' });
    }

    const updatedUser = await userModel.updateUserById(userId, updates);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Delete user by ID
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await userModel.deleteUserById(userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Admin controller to get all users with filtering, pagination, sorting
export const adminGetUsers = async (req, res, next) => {
  try {
    const { page, limit, search, sortBy, sortDir, created_from, created_to } = req.query;

    const result = await userModel.getUsersFiltered({
      page, limit, search, sortBy, sortDir, created_from, created_to,
    });

    const links = buildPageLinks(req, result.pagination.page, result.pagination.pages);

    res.status(200).json({ ...result, links });
  } catch (err) {
    next(err);
  }
};
