const db = require("../../models");

const User = db.User;
const DeliverySession = db.DeliverySession;
const { Op } = require("sequelize");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      raw: true
    });

    // Get count of active sessions for each user (only for delivery_partner role)
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        let online_status = false;

        // Only check active sessions for delivery_partner role
        // A session is active if it has no ended_at (NULL) AND is_active is true
        if (user.role === 'delivery_partner') {
          const activeSessionsCount = await DeliverySession.count({
            where: {
              delivery_partner_id: user.id,
              is_active: true,
              ended_at: {
                [Op.eq]: null
              }
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
      count: usersWithStatus.length,
      data: usersWithStatus
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

exports.deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.update({ is_active: false });

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

exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.update({ is_active: true });

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