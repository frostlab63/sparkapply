/**
 * Comprehensive Job Management Workflow Tests
 * Tests the complete end-to-end job management system
 */

const request = require('supertest');
const { sequelize } = require('../models');
const app = require('../app');
const JobMatchingService = require('../services/jobMatchingService');
const RecommendationEngine = require('../services/recommendationEngine');
const ApplicationTrackingService = require('../services/applicationTrackingService');

describe('Job Management Workflow', () => {
  let testUser, testEmployer, testJob, testApplication;
  let jobMatchingService, recommendationEngine, applicationTrackingService;

  beforeAll(async () => {
    // Initialize services
    jobMatchingService = new JobMatchingService();
    recommendationEngine = new RecommendationEngine();
    applicationTrackingService = new ApplicationTrackingService();

    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test data
    testUser = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      skills: ['javascript', 'react', 'node.js'],
      experience_level: 'mid',
      location: 'San Francisco, CA',
      remote_preference: 'hybrid',
      salary_expectation_min: 80000,
      salary_expectation_max: 120000
    };

    testEmployer = {
      id: 2,
      company_name: 'Tech Corp',
      email: 'hr@techcorp.com'
    };

    testJob = {
      id: 1,
      title: 'Senior JavaScript Developer',
      company_name: 'Tech Corp',
      location: 'San Francisco, CA',
      remote_type: 'hybrid',
      experience_level: 'senior',
      skills: ['javascript', 'react', 'typescript'],
      salary_min: 100000,
      salary_max: 140000,
      description: 'We are looking for a senior JavaScript developer...',
      is_active: true,
      posted_date: new Date(),
      expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  });

  describe('Complete Job Lifecycle', () => {
    test('should handle complete job posting to hiring workflow', async () => {
      // 1. Job Posting
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      expect(jobResponse.body.title).toBe(testJob.title);
      expect(jobResponse.body.is_active).toBe(true);

      const createdJobId = jobResponse.body.id;

      // 2. Job Matching
      const matches = await jobMatchingService.generateJobMatches(
        testUser.id,
        testUser,
        { limit: 10, minScore: 0.3 }
      );

      expect(matches).toBeInstanceOf(Array);
      expect(matches.length).toBeGreaterThan(0);

      const jobMatch = matches.find(match => match.job.id === createdJobId);
      expect(jobMatch).toBeDefined();
      expect(jobMatch.compatibility_score).toBeGreaterThan(0.3);

      // 3. Job Recommendations
      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        testUser,
        { limit: 5, minScore: 0.2 }
      );

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);

      // 4. Job Application
      const applicationData = {
        user_id: testUser.id,
        job_id: createdJobId,
        cover_letter: 'I am very interested in this position...',
        resume_url: 'https://example.com/resume.pdf',
        source: 'direct'
      };

      const application = await applicationTrackingService.submitApplication(applicationData);

      expect(application.status).toBe('submitted');
      expect(application.user_id).toBe(testUser.id);
      expect(application.job_id).toBe(createdJobId);

      // 5. Application Status Updates
      const statusUpdates = [
        { status: 'under_review', notes: 'Initial review started' },
        { status: 'screening', notes: 'Passed initial screening' },
        { status: 'phone_interview', notes: 'Phone interview scheduled', interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        { status: 'technical_interview', notes: 'Technical interview scheduled' },
        { status: 'final_interview', notes: 'Final interview with team lead' },
        { status: 'offer_extended', notes: 'Offer extended', offer_details: { salary: 110000, start_date: '2024-01-15' } }
      ];

      let updatedApplication = application;

      for (const update of statusUpdates) {
        updatedApplication = await applicationTrackingService.updateApplicationStatus(
          application.id,
          update.status,
          {
            updated_by: testEmployer.id,
            notes: update.notes,
            interview_date: update.interview_date,
            offer_details: update.offer_details
          }
        );

        expect(updatedApplication.status).toBe(update.status);
      }

      // 6. Application Analytics
      const userStats = await applicationTrackingService.getUserApplicationStats(testUser.id);
      expect(userStats.total).toBe(1);
      expect(userStats.by_status['offer_extended']).toBe(1);

      const jobStats = await applicationTrackingService.getJobApplicationStats(createdJobId);
      expect(jobStats.total).toBe(1);
      expect(jobStats.conversion_funnel.submitted).toBe(1);
      expect(jobStats.conversion_funnel.offer_extended).toBe(1);

      // 7. Application Timeline
      const timeline = await applicationTrackingService.getApplicationTimeline(application.id);
      expect(timeline.length).toBe(statusUpdates.length + 1); // +1 for initial submission

      // Verify timeline progression
      expect(timeline[0].to_status).toBe('submitted');
      expect(timeline[timeline.length - 1].to_status).toBe('offer_extended');
    });

    test('should handle job application rejection workflow', async () => {
      // Create job and application
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const application = await applicationTrackingService.submitApplication({
        user_id: testUser.id,
        job_id: jobResponse.body.id,
        cover_letter: 'Test application',
        resume_url: 'https://example.com/resume.pdf'
      });

      // Progress through some stages
      await applicationTrackingService.updateApplicationStatus(
        application.id,
        'under_review',
        { updated_by: testEmployer.id, notes: 'Under review' }
      );

      await applicationTrackingService.updateApplicationStatus(
        application.id,
        'screening',
        { updated_by: testEmployer.id, notes: 'Screening completed' }
      );

      // Reject application
      const rejectedApplication = await applicationTrackingService.updateApplicationStatus(
        application.id,
        'rejected',
        {
          updated_by: testEmployer.id,
          notes: 'Thank you for your interest',
          rejection_reason: 'Skills not aligned with requirements'
        }
      );

      expect(rejectedApplication.status).toBe('rejected');
      expect(rejectedApplication.rejection_reason).toBe('Skills not aligned with requirements');

      // Verify cannot transition from rejected
      await expect(
        applicationTrackingService.updateApplicationStatus(
          application.id,
          'phone_interview',
          { updated_by: testEmployer.id }
        )
      ).rejects.toThrow('Invalid status transition');
    });

    test('should handle application withdrawal', async () => {
      // Create job and application
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const application = await applicationTrackingService.submitApplication({
        user_id: testUser.id,
        job_id: jobResponse.body.id,
        cover_letter: 'Test application',
        resume_url: 'https://example.com/resume.pdf'
      });

      // Withdraw application
      const withdrawnApplication = await applicationTrackingService.withdrawApplication(
        application.id,
        testUser.id,
        'Found another opportunity'
      );

      expect(withdrawnApplication.status).toBe('withdrawn');

      // Verify cannot withdraw again
      await expect(
        applicationTrackingService.withdrawApplication(
          application.id,
          testUser.id,
          'Already withdrawn'
        )
      ).rejects.toThrow('Cannot withdraw application in current status');
    });
  });

  describe('Job Matching Algorithm', () => {
    test('should calculate accurate compatibility scores', async () => {
      const userProfile = {
        skills: ['javascript', 'react', 'node.js', 'typescript'],
        experience_level: 'senior',
        location: 'San Francisco, CA',
        remote_preference: 'hybrid',
        salary_expectation_min: 90000,
        salary_expectation_max: 130000
      };

      const job = {
        skills: ['javascript', 'react', 'typescript'],
        experience_level: 'senior',
        location: 'San Francisco, CA',
        remote_type: 'hybrid',
        salary_min: 100000,
        salary_max: 140000
      };

      const compatibility = await jobMatchingService.calculateCompatibilityScore(userProfile, job);

      expect(compatibility.overall).toBeGreaterThan(0.7);
      expect(compatibility.skills).toBeGreaterThan(0.8);
      expect(compatibility.experience).toBe(1.0);
      expect(compatibility.location).toBeGreaterThan(0.9);
      expect(compatibility.salary).toBeGreaterThan(0.7);
    });

    test('should handle skill category matching', async () => {
      const userProfile = {
        skills: ['python', 'django', 'postgresql'],
        experience_level: 'mid'
      };

      const job = {
        skills: ['python', 'flask', 'mysql'],
        experience_level: 'mid'
      };

      const compatibility = await jobMatchingService.calculateCompatibilityScore(userProfile, job);

      expect(compatibility.skills).toBeGreaterThan(0.5); // Should match on Python and database category
    });

    test('should penalize experience level mismatches appropriately', async () => {
      const userProfile = { experience_level: 'entry' };
      const seniorJob = { experience_level: 'senior' };
      const midJob = { experience_level: 'mid' };

      const seniorCompatibility = await jobMatchingService.calculateCompatibilityScore(userProfile, seniorJob);
      const midCompatibility = await jobMatchingService.calculateCompatibilityScore(userProfile, midJob);

      expect(midCompatibility.experience).toBeGreaterThan(seniorCompatibility.experience);
    });
  });

  describe('Recommendation Engine', () => {
    test('should generate diverse recommendations', async () => {
      const userProfile = {
        skills: ['javascript', 'react'],
        experience_level: 'mid',
        location: 'San Francisco, CA'
      };

      // Create multiple jobs with different characteristics
      const jobs = [
        { ...testJob, id: 1, title: 'Frontend Developer', skills: ['javascript', 'react'] },
        { ...testJob, id: 2, title: 'Backend Developer', skills: ['node.js', 'express'] },
        { ...testJob, id: 3, title: 'Full Stack Developer', skills: ['javascript', 'react', 'node.js'] },
        { ...testJob, id: 4, title: 'Mobile Developer', skills: ['react native', 'javascript'] }
      ];

      // Mock candidate jobs
      jest.spyOn(recommendationEngine, 'getCandidateJobs').mockResolvedValue(jobs);

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        userProfile,
        { limit: 4, diversityFactor: 0.3 }
      );

      expect(recommendations.length).toBeLessThanOrEqual(4);
      expect(recommendations.every(rec => rec.score > 0)).toBe(true);

      // Should have variety in job types
      const jobTitles = recommendations.map(rec => rec.job.title);
      const uniqueTitles = new Set(jobTitles);
      expect(uniqueTitles.size).toBeGreaterThan(1);
    });

    test('should include exploration items', async () => {
      const userProfile = { skills: ['javascript'], experience_level: 'mid' };

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        userProfile,
        { limit: 10, includeExploration: true }
      );

      // Should include some exploration items
      const explorationItems = recommendations.filter(rec => rec.type === 'exploration');
      expect(explorationItems.length).toBeGreaterThan(0);
    });
  });

  describe('Application Analytics', () => {
    test('should calculate accurate conversion funnel', async () => {
      // Create multiple applications with different statuses
      const applications = [
        { status: 'submitted' },
        { status: 'under_review' },
        { status: 'screening' },
        { status: 'phone_interview' },
        { status: 'rejected' },
        { status: 'hired' }
      ];

      // Mock applications
      jest.spyOn(applicationTrackingService, 'getJobApplicationStats').mockResolvedValue({
        total: 6,
        conversion_funnel: {
          submitted: 6,
          under_review: 5,
          screening: 4,
          phone_interview: 3,
          technical_interview: 2,
          offer_extended: 1,
          hired: 1
        }
      });

      const stats = await applicationTrackingService.getJobApplicationStats(testJob.id);

      expect(stats.conversion_funnel.submitted).toBe(6);
      expect(stats.conversion_funnel.hired).toBe(1);
      expect(stats.conversion_funnel.hired / stats.conversion_funnel.submitted).toBeCloseTo(0.167, 2);
    });

    test('should track user application success rate', async () => {
      const stats = await applicationTrackingService.getUserApplicationStats(testUser.id);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('success_rate');
      expect(stats).toHaveProperty('by_status');
      expect(stats).toHaveProperty('active_applications');
    });
  });

  describe('Error Handling', () => {
    test('should handle duplicate applications', async () => {
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const applicationData = {
        user_id: testUser.id,
        job_id: jobResponse.body.id,
        cover_letter: 'First application',
        resume_url: 'https://example.com/resume.pdf'
      };

      // First application should succeed
      await applicationTrackingService.submitApplication(applicationData);

      // Second application should fail
      await expect(
        applicationTrackingService.submitApplication(applicationData)
      ).rejects.toThrow('User has already applied to this job');
    });

    test('should handle invalid status transitions', async () => {
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const application = await applicationTrackingService.submitApplication({
        user_id: testUser.id,
        job_id: jobResponse.body.id,
        cover_letter: 'Test application',
        resume_url: 'https://example.com/resume.pdf'
      });

      // Invalid transition: submitted -> hired (skipping intermediate steps)
      await expect(
        applicationTrackingService.updateApplicationStatus(
          application.id,
          'hired',
          { updated_by: testEmployer.id }
        )
      ).rejects.toThrow('Invalid status transition');
    });

    test('should handle expired job applications', async () => {
      const expiredJob = {
        ...testJob,
        expires_date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(expiredJob)
        .expect(201);

      await expect(
        applicationTrackingService.submitApplication({
          user_id: testUser.id,
          job_id: jobResponse.body.id,
          cover_letter: 'Late application',
          resume_url: 'https://example.com/resume.pdf'
        })
      ).rejects.toThrow('Job application deadline has passed');
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk operations efficiently', async () => {
      const startTime = Date.now();

      // Create multiple jobs
      const jobPromises = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('/api/v1/jobs')
          .send({ ...testJob, title: `Job ${i}` })
      );

      await Promise.all(jobPromises);

      // Generate matches for multiple users
      const userProfiles = Array.from({ length: 5 }, (_, i) => ({
        ...testUser,
        id: i + 1
      }));

      const matchPromises = userProfiles.map(profile =>
        jobMatchingService.generateJobMatches(profile.id, profile, { limit: 5 })
      );

      const allMatches = await Promise.all(matchPromises);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(allMatches.every(matches => matches.length > 0)).toBe(true);
    });

    test('should handle recommendation generation at scale', async () => {
      const startTime = Date.now();

      const recommendations = await recommendationEngine.generateRecommendations(
        testUser.id,
        testUser,
        { limit: 50 }
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should maintain data consistency across services', async () => {
      // Create job
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const jobId = jobResponse.body.id;

      // Submit application
      const application = await applicationTrackingService.submitApplication({
        user_id: testUser.id,
        job_id: jobId,
        cover_letter: 'Integration test application',
        resume_url: 'https://example.com/resume.pdf'
      });

      // Verify job application count updated
      const updatedJobResponse = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .expect(200);

      expect(updatedJobResponse.body.application_count).toBe(1);

      // Generate matches and verify application is excluded
      const matches = await jobMatchingService.generateJobMatches(
        testUser.id,
        testUser,
        { excludeApplied: true }
      );

      const appliedJobMatch = matches.find(match => match.job_id === jobId);
      expect(appliedJobMatch).toBeUndefined();
    });

    test('should handle concurrent applications gracefully', async () => {
      const jobResponse = await request(app)
        .post('/api/v1/jobs')
        .send(testJob)
        .expect(201);

      const jobId = jobResponse.body.id;

      // Simulate concurrent applications from different users
      const applicationPromises = Array.from({ length: 5 }, (_, i) =>
        applicationTrackingService.submitApplication({
          user_id: i + 10, // Different user IDs
          job_id: jobId,
          cover_letter: `Application from user ${i + 10}`,
          resume_url: 'https://example.com/resume.pdf'
        })
      );

      const applications = await Promise.all(applicationPromises);

      expect(applications.length).toBe(5);
      expect(applications.every(app => app.status === 'submitted')).toBe(true);

      // Verify all applications are tracked
      const jobApplications = await applicationTrackingService.getJobApplications(jobId);
      expect(jobApplications.applications.length).toBe(5);
    });
  });
});

// Helper functions for test setup
async function createTestUser(userData = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    ...userData
  };
}

async function createTestJob(jobData = {}) {
  return {
    id: Math.floor(Math.random() * 10000),
    title: 'Test Job',
    company_name: 'Test Company',
    location: 'Test Location',
    is_active: true,
    posted_date: new Date(),
    expires_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ...jobData
  };
}

module.exports = {
  createTestUser,
  createTestJob
};
