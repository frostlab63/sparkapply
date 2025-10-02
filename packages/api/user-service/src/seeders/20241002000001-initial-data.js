'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123!@#', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@sparkapply.com',
        password_hash: adminPasswordHash,
        role: 'admin',
        is_verified: true,
        is_active: true,
        profile_completion: 100,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@sparkapply.com'"
    );
    const adminUserId = adminUser[0].id;

    // Create admin preferences
    await queryInterface.bulkInsert('user_preferences', [
      {
        user_id: adminUserId,
        email_notifications: JSON.stringify({
          job_matches: false,
          application_updates: true,
          profile_views: false,
          marketing: false,
          security_alerts: true,
          weekly_digest: false,
          recruiter_messages: false,
          interview_reminders: false,
        }),
        privacy_settings: JSON.stringify({
          profile_visibility: 'private',
          show_contact_info: false,
          allow_recruiter_contact: false,
          show_salary_expectations: false,
          show_location: false,
          show_experience: false,
          show_education: false,
          allow_profile_download: false,
        }),
        job_alert_preferences: JSON.stringify({
          frequency: 'never',
          keywords: [],
          locations: [],
          salary_range: { min: null, max: null, currency: 'USD' },
          job_types: [],
          industries: [],
          experience_levels: [],
          work_arrangements: [],
          company_sizes: [],
        }),
        ui_preferences: JSON.stringify({
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
          date_format: 'MM/DD/YYYY',
          time_format: '12h',
          currency: 'USD',
          items_per_page: 50,
          show_onboarding: false,
          compact_view: true,
        }),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create sample job seeker users
    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker',
        is_verified: true,
        is_active: true,
        profile_completion: 75,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'jane.smith@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker',
        is_verified: true,
        is_active: true,
        profile_completion: 90,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'mike.johnson@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'job_seeker',
        is_verified: false,
        is_active: true,
        profile_completion: 25,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('users', sampleUsers);

    // Get the sample user IDs
    const [sampleUserIds] = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN ('john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com')"
    );

    // Create job seeker profiles for sample users
    const jobSeekerProfiles = sampleUserIds.map((user, index) => {
      const profiles = [
        {
          user_id: user.id,
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1-555-0101',
          location: 'San Francisco, CA',
          bio: 'Experienced software engineer with a passion for building scalable web applications. Skilled in React, Node.js, and cloud technologies.',
          years_experience: 5,
          salary_expectation: 120000,
          skills: JSON.stringify([
            { name: 'JavaScript', level: 'expert', category: 'programming' },
            { name: 'React', level: 'expert', category: 'frontend' },
            { name: 'Node.js', level: 'advanced', category: 'backend' },
            { name: 'AWS', level: 'intermediate', category: 'cloud' },
            { name: 'PostgreSQL', level: 'intermediate', category: 'database' },
          ]),
          education: JSON.stringify([
            {
              id: '1',
              degree: 'Bachelor of Science in Computer Science',
              institution: 'University of California, Berkeley',
              graduation_year: 2019,
              gpa: 3.7,
            },
          ]),
          experience: JSON.stringify([
            {
              id: '1',
              title: 'Senior Software Engineer',
              company: 'TechCorp Inc.',
              start_date: '2021-03-01',
              end_date: null,
              description: 'Lead development of microservices architecture, mentored junior developers, and improved system performance by 40%.',
              current: true,
            },
            {
              id: '2',
              title: 'Software Engineer',
              company: 'StartupXYZ',
              start_date: '2019-06-01',
              end_date: '2021-02-28',
              description: 'Developed full-stack web applications using React and Node.js, implemented CI/CD pipelines.',
              current: false,
            },
          ]),
          job_preferences: JSON.stringify({
            desired_roles: ['Senior Software Engineer', 'Tech Lead', 'Full Stack Developer'],
            industries: ['Technology', 'Fintech', 'Healthcare'],
            work_arrangement: 'hybrid',
            salary_min: 110000,
            salary_max: 150000,
            locations: ['San Francisco', 'Remote'],
          }),
          availability: 'within_month',
          profile_completion_percentage: 85,
          is_public: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: user.id,
          first_name: 'Jane',
          last_name: 'Smith',
          phone: '+1-555-0102',
          location: 'New York, NY',
          bio: 'Creative UX/UI designer with 7 years of experience in creating user-centered designs for web and mobile applications.',
          years_experience: 7,
          salary_expectation: 95000,
          skills: JSON.stringify([
            { name: 'Figma', level: 'expert', category: 'design' },
            { name: 'Adobe Creative Suite', level: 'expert', category: 'design' },
            { name: 'User Research', level: 'advanced', category: 'research' },
            { name: 'Prototyping', level: 'advanced', category: 'design' },
            { name: 'HTML/CSS', level: 'intermediate', category: 'frontend' },
          ]),
          education: JSON.stringify([
            {
              id: '1',
              degree: 'Master of Fine Arts in Interaction Design',
              institution: 'Parsons School of Design',
              graduation_year: 2017,
              gpa: 3.9,
            },
          ]),
          experience: JSON.stringify([
            {
              id: '1',
              title: 'Senior UX Designer',
              company: 'DesignStudio Pro',
              start_date: '2020-01-01',
              end_date: null,
              description: 'Lead UX design for B2B SaaS products, conducted user research, and improved user satisfaction by 35%.',
              current: true,
            },
          ]),
          job_preferences: JSON.stringify({
            desired_roles: ['Senior UX Designer', 'Design Lead', 'Product Designer'],
            industries: ['Technology', 'E-commerce', 'Media'],
            work_arrangement: 'remote',
            salary_min: 85000,
            salary_max: 110000,
            locations: ['New York', 'Remote'],
          }),
          availability: 'within_2_weeks',
          profile_completion_percentage: 90,
          is_public: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          user_id: user.id,
          first_name: 'Mike',
          last_name: 'Johnson',
          phone: null,
          location: 'Austin, TX',
          bio: 'Recent computer science graduate looking for entry-level software development opportunities.',
          years_experience: 0,
          salary_expectation: 65000,
          skills: JSON.stringify([
            { name: 'Python', level: 'intermediate', category: 'programming' },
            { name: 'Java', level: 'intermediate', category: 'programming' },
            { name: 'Git', level: 'beginner', category: 'tools' },
          ]),
          education: JSON.stringify([
            {
              id: '1',
              degree: 'Bachelor of Science in Computer Science',
              institution: 'University of Texas at Austin',
              graduation_year: 2024,
              gpa: 3.5,
            },
          ]),
          experience: JSON.stringify([]),
          job_preferences: JSON.stringify({
            desired_roles: ['Software Engineer', 'Junior Developer', 'Backend Developer'],
            industries: ['Technology', 'Gaming', 'Education'],
            work_arrangement: 'on_site',
            salary_min: 55000,
            salary_max: 75000,
            locations: ['Austin', 'Dallas'],
          }),
          availability: 'immediately',
          profile_completion_percentage: 60,
          is_public: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      return profiles[index];
    });

    await queryInterface.bulkInsert('job_seeker_profiles', jobSeekerProfiles);

    // Create default preferences for sample users
    const userPreferences = sampleUserIds.map(user => ({
      user_id: user.id,
      email_notifications: JSON.stringify({
        job_matches: true,
        application_updates: true,
        profile_views: true,
        marketing: false,
        security_alerts: true,
        weekly_digest: true,
        recruiter_messages: true,
        interview_reminders: true,
      }),
      privacy_settings: JSON.stringify({
        profile_visibility: 'public',
        show_contact_info: false,
        allow_recruiter_contact: true,
        show_salary_expectations: false,
        show_location: true,
        show_experience: true,
        show_education: true,
        allow_profile_download: false,
      }),
      job_alert_preferences: JSON.stringify({
        frequency: 'daily',
        keywords: [],
        locations: [],
        salary_range: { min: null, max: null, currency: 'USD' },
        job_types: ['full_time'],
        industries: [],
        experience_levels: [],
        work_arrangements: [],
        company_sizes: [],
      }),
      ui_preferences: JSON.stringify({
        theme: 'light',
        language: 'en',
        timezone: 'America/New_York',
        date_format: 'MM/DD/YYYY',
        time_format: '12h',
        currency: 'USD',
        items_per_page: 20,
        show_onboarding: true,
        compact_view: false,
      }),
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert('user_preferences', userPreferences);

    console.log('✅ Initial data seeded successfully');
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data in reverse order
    await queryInterface.bulkDelete('user_preferences', null, {});
    await queryInterface.bulkDelete('job_seeker_profiles', null, {});
    await queryInterface.bulkDelete('user_activity_logs', null, {});
    await queryInterface.bulkDelete('user_files', null, {});
    await queryInterface.bulkDelete('users', null, {});
    
    console.log('✅ Initial data removed successfully');
  }
};
