const request = require("supertest");
const express = require("express");
const applicationRoutes = require("../routes/applicationRoutes");
const Application = require("../models/Application");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});
app.use("/applications", applicationRoutes);

jest.mock("../models/Application");

describe("Application API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create an application", async () => {
    const applicationData = { company: "Test Co", jobTitle: "Tester" };
    Application.create.mockResolvedValue({ ...applicationData, userId: 1 });

    const res = await request(app)
      .post("/applications")
      .send(applicationData);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company).toBe("Test Co");
  });

  it("should get all applications", async () => {
    const applications = [{ company: "Test Co", jobTitle: "Tester" }];
    Application.findAndCountAll.mockResolvedValue({ rows: applications, count: 1 });

    const res = await request(app).get("/applications");

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applications.length).toBe(1);
  });
});
