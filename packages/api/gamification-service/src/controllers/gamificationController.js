const gamificationService = require("../services/gamificationService");

class GamificationController {
  async awardBadge(req, res) {
    const { userId, badgeId } = req.body;
    await gamificationService.awardBadge(userId, badgeId);
    res.status(200).send({ message: "Badge awarded successfully" });
  }

  async trackAction(req, res) {
    const { userId, action } = req.body;
    await gamificationService.trackAction(userId, action);
    res.status(200).send({ message: "Action tracked successfully" });
  }
}

module.exports = new GamificationController();
