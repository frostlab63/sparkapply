const User = require('../models/User');
const Badge = require('../models/Badge');

class GamificationService {
  async awardBadge(userId, badgeId) {
    const user = await User.findById(userId);
    const badge = await Badge.findById(badgeId);

    if (user && badge) {
      if (!user.badges.includes(badgeId)) {
        user.badges.push(badgeId);
        user.points += badge.points;
        await user.save();
      }
    }
  }

  async trackAction(userId, action) {
    const user = await User.findById(userId);
    if (user) {
      user.points += 1; // Award 1 point for each action
      await user.save();

      // Check for achievement badges
      if (action === 'job_application' && user.applications.length >= 10) {
        const badge = await Badge.findOne({ name: 'Ten Applications' });
        if (badge) {
          await this.awardBadge(userId, badge._id);
        }
      }
    }
  }
}

module.exports = new GamificationService();
