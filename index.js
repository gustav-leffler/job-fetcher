const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { toXML } = require("to-xml");

// const KEYWORDS = "%23gatewayumea2024";
const KEYWORDS = "";

const fetchJobPost = async (url) => {
  try {
    const resp = await axios.get(url);
    const html = resp.data;

    const $ = cheerio.load(html);
    const jobPosting = JSON.parse($("script[type=application/ld+json]").html());
    return jobPosting;
  } catch (e) {
    if (e?.response?.status === 429) {
      console.log("LinkedIn thinks we are going to fast, lets wait 5 seconds.");
      await new Promise((r) => setTimeout(r, 5000));
      return await fetchJobPost(url);
    } else {
      throw e;
    }
  }
};

const fetchPage = async (start) => {
  try {
    const jobPosts = [];
    const resp = await axios.get(
      "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=" +
        KEYWORDS +
        "&location=Ume%C3%A5%2C%2BV%C3%A4sterbotten%2C%2BSweden&geoId=&trk=public_jobs_jobs-search-bar_search-submit&start=" +
        start
    );
    const html = resp.data;

    const $ = cheerio.load(html);
    const jobs = $("li");
    const jobUrls = [];
    jobs.each((_, element) => {
      const url = $(element)
        .find("a.base-card__full-link")
        .attr("href")
        .split("?")[0];
      jobUrls.push(url);
    });
    for (const jobUrl of jobUrls) {
      const jobPost = await fetchJobPost(jobUrl);
      jobPosts.push(jobPost);
    }
    return jobPosts;
  } catch (e) {
    if (e?.response?.status === 429) {
      console.log("LinkedIn thinks we are going to fast, lets wait 5 seconds.");
      await new Promise((r) => setTimeout(r, 5000));
      return await fetchPage(start);
    } else {
      throw e;
    }
  }
};

const fetchLinkedInJobs = async () => {
  let jobs = [];
  for (let i = 0; i < 1000; i += 25) {
    console.log("Fetching", i, "-", i + 25);
    const fetchedJobs = await fetchPage(i);
    jobs = jobs.concat(fetchedJobs);
    if (fetchedJobs.length === 0) {
      break;
    }
  }
  console.log("Done fetching jobs, found", jobs.length, "jobs");

  jobs.sort((a, b) =>
    a.datePosted > b.datePosted ? 1 : b.datePosted > a.datePosted ? -1 : 0
  );

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    toXML({ jobs: { job: jobs } }, null, 2);

  try {
    fs.writeFileSync("jobs.xml", xml);
    console.log("File has been saved.");
  } catch (error) {
    console.error(err);
  }

  // Let user read final message
  await new Promise((r) => setTimeout(r, 1000));
};

fetchLinkedInJobs();
