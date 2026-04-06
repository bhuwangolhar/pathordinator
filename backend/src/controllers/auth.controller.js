const db = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = db.User;
const Organization = db.Organization;

exports.signup = async (req, res) => {
  try {
    const { name, email, password, organizationName } = req.body;

    // Validate inputs
    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and organization name are required"
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName
    });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user for the organization
    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      role: "admin",
      organization_id: organization.id,
      is_active: true
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: "Organization and admin account created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        token
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create account"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
      include: [{ model: Organization, as: 'organization', attributes: ['id', 'name'] }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated"
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id,
        organization: user.organization,
        token
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const { org_id } = req.query;

    if (!email || !org_id) {
      return res.status(400).json({
        success: false,
        message: "Email and organization ID are required"
      });
    }

    const user = await User.findOne({
      where: { email, organization_id: org_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization"
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user"
    });
  }
};

exports.verifyUserPassword = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({
        success: false,
        message: "User ID and password are required"
      });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated"
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    
    res.json({
      success: true,
      data: {
        passwordValid: isPasswordValid,
        user: isPasswordValid ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        } : null
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to verify password"
    });
  }
};
