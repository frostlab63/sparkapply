const gamificationService = require("../services/gamificationService");
const User = require("../models/User");
const Badge = require("../models/Badge");

jest.mock("../models/User");
jest.mock("../models/Badge");

describe("Gamification Service", () => {
  it("should award a badge to a user", async () => {
    const user = { _id: "userId", badges: [], points: 0, save: jest.fn() };
    const badge = { _id: "badgeId", points: 10 };

    User.findById.mockResolvedValue(user);
    Badge.findById.mockResolvedValue(badge);

    await gamificationService.awardBadge("userId", "badgeId");

    expect(user.badges).toContain("badgeId");
    expect(user.points).toBe(10);
    expect(user.save).toHaveBeenCalled();
  });
});
