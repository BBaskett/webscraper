const fs = require("fs");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const path = require("path");
const prompts = require("prompts");
const open = require("open");
require("dotenv").config();

let URL = `https://${process.argv[2]}.craigslist.org/d/cars-trucks/search/cta`;
const writeStream = fs.createWriteStream(process.env.OUTPUT_FILE, {
  flags: "w",
});

// WriteStream Headers
writeStream.write(`Price,Name,Location,Link\n`);

async function parsePage(pageBody) {
  const $ = await cheerio.load(pageBody);
  try {
    await $("ul.rows")
      .find("li.result-row")
      .each((i, el) => {
        const name = $(el).find(".result-title").text().replace(/"/g, ""); // Remove quotes from the string if they exist
        const price = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumSignificantDigits: 2,
        }).format(
          parseInt(
            $(el)
              .find(".result-meta .result-price")
              .text()
              .slice(1) // Remove "$" from the beginning of the string
              .replace(/,/g, "") // Remove commas from number string
          ),
          10
        );
        let location = $(el)
          .find(".result-meta .result-hood")
          .text()
          .slice(2, -1) // Remove enclosing parentheses around location
          .toUpperCase();
        location = location.length === 0 ? "NO LOCATION PROVIDED" : location;
        const link = $(el).find(".result-title").attr("href");
        // Write to CSV
        writeStream.write(`"${price}","${name}","${location}",${link}\n`);
      });
  } catch (e) {
    console.error(e.message);
    return process.exit(1);
  }
}

async function crawlPage(url, iteration) {
  await console.log(`Crawling Page [Iteration ${iteration}]`);
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await parsePage(await page.content());
    if (await page.$("a[title='next page']")) {
      console.log("---> Next Button Exists");
      return crawlPage(
        path.join(URL, "?s=", (120 * iteration).toString()),
        iteration + 1
      );
    } else {
      console.log("Scraping Completed");
      await browser.close();
      try {
        await open(process.env.OUTPUT_FILE);
        return process.exit();
      } catch (e) {
        console.log(`Could not open the file.\n\nError: ${e}`);
        return process.exit(1);
      }
      return process.exit();
    }
  } catch (e) {
    console.error(e.message);
    return process.exit(1);
  }
}

if (process.argv[2]) {
  return crawlPage(URL, 1);
} else {
  (async function getLocations() {
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(process.env.CRAIGSLIST_LOCATIONS);
      await (async function buildLocationsList() {
        try {
          const $ = await cheerio.load(await page.content());
          let locations = [];
          await $('h1 > a[name="US"]')
            .parent()
            .next()
            .find(".box > ul a")
            .each((i, el) => {
              locations.push({
                title: el.children[0].data.toLocaleUpperCase(),
                value: el.attribs.href,
              });
            });
          await locations.sort((a, b) => {
            if (a.title > b.title) {
              return 1;
            }
            if (a.title < b.title) {
              return -1;
            }
            return 0;
          });
          (async () => {
            const response = await prompts({
              type: "select",
              name: "value",
              message: "Select a location",
              choices: locations,
              initial: 0,
            });
            URL = `${response.value}d/cars-trucks/search/cta`;
            return crawlPage(URL, 1);
          })();
        } catch (e) {
          console.error(e.message);
          return process.exit(1);
        }
      })();
    } catch (e) {
      console.error(e.message);
      return process.exit(1);
    }
  })();
}
