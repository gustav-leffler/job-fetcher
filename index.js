const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { toXML } = require("to-xml");

const OUTPUT = "jobs.xml";
const CONTENT_FILTER = "#gatewayumea2024";
// const KEYWORDS = "%23gatewayumea2024";
const KEYWORDS = "";

const fetchJobPost = async (url) => {
  try {
    const resp = await axios.get(url);
    const html = resp.data;

    const $ = cheerio.load(html);
    const jobPostingJson = $("script[type=application/ld+json]").html();
    if (jobPostingJson) {
      const jobPosting = JSON.parse(jobPostingJson);
      const decoratedId = $("#decoratedJobPostingId").html();
      const id = decoratedId.match(/\d+/)[0];
      jobPosting.id = id;
      jobPosting.url = url;

      // Only include jobs that contains CONTENT_FILTER in description
      if (jobPosting.description.indexOf(CONTENT_FILTER) > -1) {
        return jobPosting;
      } else {
        return null;
      }
    } else {
      console.warn(
        "Unable to fetch JobPosting for",
        url,
        "(does not contain JobPosting data)"
      );
      // TODO: if the page doesn't contain a JobPosting-object we have to crawl it manually.
      // If it is needed? I'm not sure why all pages doesn't have this
      // With manual crawling im not able to find a validThrough-date, which I think we require?
      return null;
    }
  } catch (e) {
    if (e?.response?.status === 429) {
      console.log(
        "LinkedIn thinks we are going too fast, lets wait 5 seconds."
      );
      await new Promise((r) => setTimeout(r, 5000));
      return await fetchJobPost(url);
    } else {
      console.error("Fetch JobPosting Error", e);
      return null;
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
      try {
        const url = $(element).find("a").attr("href").split("?")[0];
        jobUrls.push(url);
      } catch (e) {
        console.log("error:", e);
      }
    });
    for (const jobUrl of jobUrls) {
      try {
        const jobPost = await fetchJobPost(jobUrl);
        if (jobPost?.title) {
          jobPosts.push(jobPost);
        }
      } catch (e) {
        console.error("Failed to fetch jobPosting for", jobUrl);
      }
    }
    return { jobUrlsLength: jobUrls.length, jobPosts };
  } catch (e) {
    if (e?.response?.status === 429) {
      console.log(
        "LinkedIn thinks we are going too fast, lets wait 5 seconds."
      );
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
    const { jobUrlsLength, jobPosts } = await fetchPage(i);
    console.log(
      "fetched",
      jobPosts.length,
      "/",
      jobUrlsLength,
      "from page ",
      i,
      "-",
      i + 25
    );
    jobs = jobs.concat(jobPosts);
    if (jobUrlsLength.length === 0) {
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
    fs.writeFileSync(OUTPUT, xml);
    console.log("File has been saved.");
  } catch (error) {
    console.error(err);
  }

  // Let user read final message
  await new Promise((r) => setTimeout(r, 1000));
};

fetchLinkedInJobs();
