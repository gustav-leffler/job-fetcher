const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { toXML } = require("to-xml");

const KEYWORDS = "%23gatewayumea2024";
// const KEYWORDS = "";

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
      return await fetchPage(start);
    } else {
      throw e;
    }
  }
};

const fetchPage = async (start) => {
  try {
    const jobsData = [];
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
    jobs.each((index, element) => {
      // const title = $(element).find("h3.base-search-card__title").text().trim();
      // const employeer = $(element)
      //   .find("h4.base-search-card__subtitle")
      //   .text()
      //   .trim();
      // const postedDate = $(element).find("time").attr("datetime");
      const url = $(element)
        .find("a.base-card__full-link")
        .attr("href")
        .split("?")[0];
      // // console.log(jobTitle);
      // jobsData.push({ title, employeer, postedDate, url });
      jobUrls.push(url);
    });
    for (const jobUrl of jobUrls) {
      const jobPost = await fetchJobPost(jobUrl);
      jobsData.push(jobPost);
      break; // TODO REMOVE ME
    }

    // console.log("jobsData:", jobsData, "jobsData length:", jobsData.length);
    return jobsData;
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
    break; // TODO: REMOVE ME
  }
  console.log("Done fetching jobs, found", jobs.length, "jobs");

  jobs.sort((a, b) =>
    a.postedDate > b.postedDate ? 1 : b.postedDate > a.postedDate ? -1 : 0
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
