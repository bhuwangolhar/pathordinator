const db = require("../../models");

const User = db.User;

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();

    res.json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.create({
      name,
      email,
      role
    });

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create user"
    });
  }
};