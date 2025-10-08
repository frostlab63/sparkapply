const { similarity } = require("text-similarity-node");

async function getJobRecommendations(userProfile, jobs) {
  const userProfileString = `Skills: ${userProfile.skills.join(", ")}. Experience: ${userProfile.experience}. Location: ${userProfile.location}`;

  const jobScores = jobs.map(job => {
    const jobString = `Title: ${job.title}. Company: ${job.company}. Location: ${job.location}. Skills: ${job.skills.join(", ")}`;
    const score = similarity.cosine(userProfileString, jobString, true);
    return { jobId: job.id, score };
  });

  jobScores.sort((a, b) => b.score - a.score);

  return jobScores.map(job => job.jobId);
}

module.exports = { getJobRecommendations };
