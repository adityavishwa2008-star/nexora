import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim();
    if (typeof req.body.phone === 'string') updates.phone = req.body.phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      res.status(400);
      throw new Error('Current password and a new password of at least 6 characters are required');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};

const addressFields = ['name', 'phone', 'line1', 'city', 'state', 'pincode'];

const validateAddress = (address) => {
  if (addressFields.some((field) => typeof address[field] !== 'string' || !address[field].trim())) {
    return 'Complete address fields are required';
  }
  return null;
};

export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req, res, next) => {
  try {
    const validationError = validateAddress(req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const user = await User.findById(req.user._id);
    const address = {
      ...req.body,
      isDefault: Boolean(req.body.isDefault) || user.addresses.length === 0,
    };
    if (address.isDefault) user.addresses.forEach((item) => { item.isDefault = false; });
    user.addresses.push(address);
    await user.save();
    res.status(201).json(user.addresses);
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req, res, next) => {
  try {
    const validationError = validateAddress(req.body);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    Object.assign(address, req.body);
    if (address.isDefault) user.addresses.forEach((item) => { if (!item._id.equals(address._id)) item.isDefault = false; });
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    address.deleteOne();
    if (!user.addresses.some((item) => item.isDefault) && user.addresses[0]) user.addresses[0].isDefault = true;
    await user.save();
    res.json(user.addresses);
  } catch (error) {
    next(error);
  }
};
