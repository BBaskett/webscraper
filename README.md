# Craigslist Cars & Trucks Web Scraper

## Instructions

1. Close the repository

   > `git clone https://github.com/BBaskett/webscraper.git`

2. Open terminal

   _**Note**: Make sure you are at the root of the project directory_

3. Run the `scrape` command to start scraping!

   > `npm run scrape [location?]`

   _**Note**: What is `location`? This is the location which you wish to perform your search. You can find a location by going to [Craigslist](https://www.craigslist.org/about/sites). Once a location is selected, copy the text which prepends ".craigslist.org" (e.g. **cnj**.craigslist.org would search Central New Jersey)_

   _If you don't provide a location, you can select from a list of US craigslist locations._

4. Open the `vehicles.csv` file.

## How does it work

The webscraper uses [Puppeteer](https://github.com/puppeteer/puppeteer/tree/v5.2.1) to launch a headless Chrome (or Chromium) instance which extracts the HTML from each page, then passes the content of the page to a function which utilizes [Cheerio](https://cheerio.js.org/) to parse the page and transpose the information into a csv file.

### Disclaimer

Currently only supports US craigslist locations.
