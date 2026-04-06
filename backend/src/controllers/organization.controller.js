const db = require("../../models");
const bcrypt = require("bcrypt");

const User = db.User;
const Organization = db.Organization;
const DeliverySession = db.DeliverySession;
const { Op } = require("sequelize");

exports.addUserToOrganization = async (req, res) => {
  try {
    const { organization_id } = req.params;
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Verify organization exists
    const org = await Organization.findByPk(organization_id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    // Check if email already exists in the organization
    const existingUser = await User.findOne({
      where: { email, organization_id }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists in this organization"
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      role: role || 'customer',
      organization_id,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: "User added to organization successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add user"
    });
  }
};

exports.getOrganizationUsers = async (req, res) => {
  try {
    const { organization_id } = req.params;

    // Verify organization exists
    const org = await Organization.findByPk(organization_id);
    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    const users = await User.findAll({
      where: { organization_id },
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'],
      raw: true
    });

    // Get count of active sessions for each user (only for delivery_partner role)
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        let online_status = false;

        // Only check active sessions for delivery_partner role
        if (user.role === 'delivery_partner') {
          const activeSessionsCount = await DeliverySession.count({
            where: {
              delivery_partner_id: user.id,
              is_active: true,
              ended_at: { [Op.eq]: null }
            }
          });
          online_status = activeSessionsCount > 0;
        }
        
        return {
          ...user,
          online_status
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStatus
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization users"
    });
  }
};

exports.getOrganizationDetails = async (req, res) => {
  try {
    const { organization_id } = req.params;

    const org = await Organization.findByPk(organization_id, {
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email', 'role', 'is_active']
      }]
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    res.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        userCount: org.users.length,
        users: org.users
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organization details"
    });
  }
};

exports.deactivateOrgUser = async (req, res) => {
  try {
    const { organization_id, user_id } = req.params;

    const user = await User.findOne({
      where: { id: user_id, organization_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization"
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot deactivate admin users"
      });
    }

    await user.update({ is_active: false });

    // Emit user deactivated event
    if (global.io) {
      global.io.to(`org-${organization_id}`).emit('users-updated');
      global.io.to(`org-${organization_id}`).emit('user-deactivated', {
        userId: user_id,
        userName: user.name,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
      data: user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user"
    });
  }
};

exports.activateOrgUser = async (req, res) => {
  try {
    const { organization_id, user_id } = req.params;

    const user = await User.findOne({
      where: { id: user_id, organization_id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization"
      });
    }

    await user.update({ is_active: true });

    // Emit user activated event
    if (global.io) {
      global.io.to(`org-${organization_id}`).emit('users-updated');
      global.io.to(`org-${organization_id}`).emit('user-activated', {
        userId: user_id,
        userName: user.name,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: "User activated successfully",
      data: user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to activate user"
    });
  }
};
