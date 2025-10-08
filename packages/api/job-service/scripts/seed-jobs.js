const { sequelize } = require('../src/config/database');
const Job = require('../src/models/Job');

const sampleJobs = [
  {
    title: 'Senior Software Engineer',
    company_name: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    experience_level: 'senior',
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing and implementing scalable web applications using modern technologies.',
    requirements: 'Bachelor\'s degree in Computer Science or related field. 5+ years of experience with JavaScript, React, Node.js, and PostgreSQL. Experience with cloud platforms (AWS/GCP) preferred.',
    benefits: 'Competitive salary, health insurance, 401k matching, flexible work hours, remote work options, professional development budget.',
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    categories: ['Software Engineering', 'Full Stack', 'Web Development'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: true,
  },
  {
    title: 'Frontend Developer',
    company_name: 'StartupXYZ',
    location: 'New York, NY',
    remote_type: 'remote',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 80000,
    salary_max: 120000,
    salary_currency: 'USD',
    description: 'Join our dynamic startup as a Frontend Developer. You\'ll work on cutting-edge user interfaces and help shape the future of our product.',
    requirements: '3+ years of experience with React, TypeScript, and modern CSS. Experience with state management libraries (Redux/Zustand). Strong understanding of responsive design.',
    benefits: 'Equity package, health insurance, unlimited PTO, home office stipend, learning and development budget.',
    skills: ['React', 'TypeScript', 'CSS', 'Redux', 'HTML', 'Figma'],
    categories: ['Frontend', 'React', 'UI/UX'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: false,
  },
  {
    title: 'Data Scientist',
    company_name: 'DataTech Solutions',
    location: 'Austin, TX',
    remote_type: 'on_site',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 90000,
    salary_max: 140000,
    salary_currency: 'USD',
    description: 'We\'re seeking a Data Scientist to analyze complex datasets and build machine learning models that drive business decisions.',
    requirements: 'Master\'s degree in Data Science, Statistics, or related field. 3+ years of experience with Python, SQL, and machine learning frameworks. Experience with cloud platforms.',
    benefits: 'Competitive salary, comprehensive health benefits, retirement plan, professional development opportunities, conference attendance.',
    skills: ['Python', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'AWS'],
    categories: ['Data Science', 'Machine Learning', 'Analytics'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: true,
  },
  {
    title: 'DevOps Engineer',
    company_name: 'CloudFirst Inc.',
    location: 'Seattle, WA',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    experience_level: 'senior',
    salary_min: 110000,
    salary_max: 160000,
    salary_currency: 'USD',
    description: 'Looking for a DevOps Engineer to help us scale our infrastructure and improve our deployment processes.',
    requirements: '4+ years of experience with AWS/Azure, Docker, Kubernetes, and CI/CD pipelines. Strong scripting skills in Python or Bash.',
    benefits: 'Stock options, health insurance, flexible schedule, remote work, professional development budget, team retreats.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Python', 'Terraform', 'Jenkins'],
    categories: ['DevOps', 'Cloud', 'Infrastructure'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: false,
  },
  {
    title: 'Product Manager',
    company_name: 'InnovateCorp',
    location: 'Boston, MA',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: 'USD',
    description: 'We\'re looking for a Product Manager to drive product strategy and work closely with engineering and design teams.',
    requirements: '3+ years of product management experience. Strong analytical skills and experience with product analytics tools. MBA preferred but not required.',
    benefits: 'Competitive salary, equity, health benefits, flexible work arrangements, professional development, team building events.',
    skills: ['Product Strategy', 'Analytics', 'Agile', 'Jira', 'Figma', 'SQL'],
    categories: ['Product Management', 'Strategy', 'Analytics'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: false,
  },
  {
    title: 'UX Designer',
    company_name: 'DesignStudio Pro',
    location: 'Los Angeles, CA',
    remote_type: 'remote',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 75000,
    salary_max: 110000,
    salary_currency: 'USD',
    description: 'Join our creative team as a UX Designer. You\'ll be responsible for creating intuitive and engaging user experiences.',
    requirements: '3+ years of UX design experience. Proficiency in Figma, Sketch, or Adobe XD. Strong portfolio demonstrating user-centered design process.',
    benefits: 'Creative environment, health insurance, flexible hours, remote work, design conference attendance, creative tools budget.',
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing'],
    categories: ['UX Design', 'Design', 'User Experience'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: true,
  },
  {
    title: 'Backend Developer',
    company_name: 'ServerTech Ltd.',
    location: 'Chicago, IL',
    remote_type: 'on_site',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 85000,
    salary_max: 125000,
    salary_currency: 'USD',
    description: 'We need a Backend Developer to build robust APIs and manage our server infrastructure.',
    requirements: '3+ years of experience with Node.js, Express, and databases (PostgreSQL/MongoDB). Experience with microservices architecture.',
    benefits: 'Competitive salary, health benefits, 401k, flexible PTO, learning stipend, team lunch every Friday.',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Microservices'],
    categories: ['Backend', 'API Development', 'Server'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: false,
  },
  {
    title: 'Full Stack Developer',
    company_name: 'WebSolutions Inc.',
    location: 'Denver, CO',
    remote_type: 'hybrid',
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_min: 90000,
    salary_max: 130000,
    salary_currency: 'USD',
    description: 'Looking for a Full Stack Developer to work on both frontend and backend of our web applications.',
    requirements: '3+ years of experience with React, Node.js, and databases. Experience with cloud deployment and version control.',
    benefits: 'Health insurance, dental, vision, 401k matching, flexible work schedule, professional development budget.',
    skills: ['React', 'Node.js', 'JavaScript', 'PostgreSQL', 'Git', 'AWS'],
    categories: ['Full Stack', 'Web Development', 'JavaScript'],
    source: 'manual',
    posted_date: new Date(),
    is_active: true,
    is_featured: false,
  }
];

async function seedJobs() {
  try {
    console.log('🌱 Starting job seeding process...');
    
    // Sync the database
    await sequelize.sync();
    console.log('✅ Database synced successfully');
    
    // Clear existing jobs (optional - remove this if you want to keep existing data)
    await Job.destroy({ where: {} });
    console.log('🗑️  Cleared existing jobs');
    
    // Create sample jobs
    const createdJobs = await Job.bulkCreate(sampleJobs);
    console.log(`✅ Created ${createdJobs.length} sample jobs`);
    
    // Display created jobs
    console.log('\n📋 Created Jobs:');
    createdJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company_name} (${job.location})`);
    });
    
    console.log('\n🎉 Job seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  seedJobs();
}

module.exports = { seedJobs, sampleJobs };
