const DocumentManagementService = require("../services/documentManagementService");
const Document = require("../models/Document");
const Application = require("../models/Application");
const fs = require("fs/promises");

jest.mock("../models/Document");
jest.mock("../models/Application");
jest.mock("fs/promises");

describe("DocumentManagementService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a document", async () => {
    const documentData = { applicationId: 1, userId: 1, type: 'resume', title: 'My Resume' };
    const fileBuffer = Buffer.from("this is a test file");
    const originalFilename = "resume.pdf";
    const createdDocument = { 
      ...documentData, 
      id: 1, 
      originalName: originalFilename, 
      fileSize: fileBuffer.length,
      update: jest.fn().mockResolvedValue(true) // Mock the update method
    };

    Document.create.mockResolvedValue(createdDocument);
    Application.update.mockResolvedValue([1]);
    fs.writeFile.mockResolvedValue();
    fs.access.mockRejectedValue(new Error('ENOENT'));
    fs.mkdir.mockResolvedValue();

    const result = await DocumentManagementService.uploadDocument(documentData, fileBuffer, originalFilename);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(createdDocument);
    expect(Document.create).toHaveBeenCalledWith(expect.any(Object));
    expect(createdDocument.update).toHaveBeenCalled();
  });
});
