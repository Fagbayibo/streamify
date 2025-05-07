import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {upsertStreamUser} from "../config/stream.js";

export const signUpUser = async (req, res) => {
  const {fullName, email, password} = req.body;
  try {
    // If user don't send payload
    if (!email || !password || !fullName) {
      return res.status(400).json({message: "All field are required"});
    }
    // If the password is not greater than the expected length
    if (password.length < 6) {
      return res.status(400).json({message: "Password length must be a least 6 characters."});
    }

    // Check email validity
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({message: "Please enter a valid Gmail address."});
    }

    // Check if the users is already exist
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res.status(400).json({message: "Email already existed. Please use a different email"});
    }

    // Generate avatar image for users
    const idx = Math.floor(Math.random() * 100) + 1; //Generate a number between 1 and 100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    const createNewUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    //TODO: CREATE THE USER IN STREAM

    try {
      await upsertStreamUser({
        id: createNewUser._id.toString(),
        name: createNewUser.fullName,
        Image: createNewUser.profilePic || "",
      });
      console.log(`Stream user created for ${createNewUser.fullName}`);
    } catch (error) {}

    // Create jwtt token for authentication
    const token = jwt.sign({userId: createNewUser._id}, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    // Create cookies
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, // Prevent XSS attacks
      sameSite: "strict", //Prevent CSRF attacks
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createNewUser,
    });
  } catch (error) {
    console.log("====================================");
    console.log("Failed:", error);
    console.log("====================================");
    res.status(500).json({message: "Internal server errorr", error});
  }
};

export const logInUser = async (req, res) => {
  const {email, password} = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({message: "All field are required"});
    }

    // Check if User exist
    const existingUser = await User.findOne({email});
    if (!existingUser) {
      return res.status(400).json({message: "No account with provided email"});
    }

    // Check if password correct
    const isPasswordCorrect = await existingUser.matchPassword(password);
    if (!isPasswordCorrect) return res.status(400).json({message: "Password Incorrect"});

    // Create a token and cookie
    const token = jwt.sign({userId: existingUser._id}, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Send the token to the user
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token: existingUser,
    });
  } catch (error) {
    console.log("====================================");
    console.log("Failed:", error);
    console.log("====================================");
    res.status(500).json({message: "Internal Server Error"});
  }
};

export const logOutUser = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({success: true, message: "Logout successfully"});
};

export const onboardUser = async (req, res) => {
  console.log(req.user);

  try {
    const userId = req.user._id;

    const {fullName, bio, nativeLanguage, learningLanguage, location} = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [!fullName && "fullName", !bio && "bio", !nativeLanguage && "nativeLanguage", !learningLanguage && "learningLanguage", !location && "location"].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnBoarded: true,
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({message: "User not found"});
    }

    //TODO: update User info in stream
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });

      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log(`Error updating Stream user during onboarding:`, streamError.message);
    }
    res.status(200).json({success: true, user: updatedUser});
  } catch (error) {
    console.error("Onboarding error", error);
    res.status(500).json({message: "Internal server error"});
  }
};
