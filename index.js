const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const url = 'https://www.accuweather.com/en/gb/london/ec4a-2/february-weather/328328?year=2022';
const domain = new URL(url).origin;

async function scrape() {
    // Get HTML response
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML
    const $ = cheerio.load(html)

    const data = {
        days: []
    };

    const yearAndMonthSelector = $('div.map-dropdown div.map-dropdown-toggle h2');
    data.year = yearAndMonthSelector.eq(1).html();
    data.month = yearAndMonthSelector.eq(0).html();


    $('div.monthly-calendar-container div.monthly-calendar a').each((i, element) => {
        const dayElement = $(element);
        data.days.push({
            date: dayElement.find('div.date').html().trim(),
            low: dayElement.find('div.low').html().trim(),
            high: dayElement.find('div.high').html().trim(),
            detailPageUrl: domain + dayElement.attr('href')
        });
    });

    // this line creates list of promises which makes execution parallel
    const promises = data.days.map(day => getDetailDailyInformation(day));

    let index = 0;
    for (const promise of promises) {
        // mapping results to corresponding object
        data.days[index].detail = await promise;
        index++;
    }

    const fileName = `${data.year}-${data.month}.json`;
    fs.writeFile(fileName, JSON.stringify(data), 'utf8', err => {
        if (err) return console.log(err);
        console.log(`successfully written to file > ${fileName}`)
    });
}

async function getDetailDailyInformation(dayObject) {

    const response = await axios.get(dayObject.detailPageUrl);
    const html = response.data;

    // Load HTML
    const $ = cheerio.load(html)

    const day = {};
    day.humanReadableDate = $('div.subnav-pagination div').html().trim()
    day.dayOfWeek = day.humanReadableDate.split(',')[0];

    /*
    * get Day Card Information
    */
    const firstHalfDayElement = $('div.half-day-card-content').eq(0);
    day.firstHalfOfDay = {
        phrase: firstHalfDayElement.find('div.phrase').html(),
        items: []
    }

    // a little complicated because structure of DOM in website
    // needs striping tags :<    
    firstHalfDayElement.find('div.panels p.panel-item').each((i, element) => {
        let startRemovingIndex = $(element).html().indexOf("<span");
        let itemKey = $(element).html().substring(0, startRemovingIndex);
        day.firstHalfOfDay.items.push({
            [itemKey]: $(element).find('span').html().trim()
        })
    })

    /*
    * get Night Card Information
    */

    const secondHalfDayElement = $('div.half-day-card-content').eq(1);
    day.secondHalfOfDay = {
        phrase: secondHalfDayElement.find('div.phrase').html(),
        items: []
    }

    secondHalfDayElement.find('div.panels p.panel-item').each((i, element) => {
        let startRemovingIndex = $(element).html().indexOf("<span");
        let itemKey = $(element).html().substring(0, startRemovingIndex);
        day.secondHalfOfDay.items.push({
            [itemKey]: $(element).find('span').html().trim()
        })
    })

    const sunriseElement = $('div.sunrise-sunset')

    day.sunriseSunset = {
        rise1: sunriseElement.find('div.left div.spaced-content').eq(1).find('span.text-value').html(),
        set1: sunriseElement.find('div.left div.spaced-content').eq(2).find('span.text-value').html(),
        rise2: sunriseElement.find('div.right div.spaced-content').eq(1).find('span.text-value').html(),
        set2: sunriseElement.find('div.right div.spaced-content').eq(2).find('span.text-value').html(),
    }
    return day;
}


(async () => {
    console.log(`fetching data from URL:${url}`);
    await scrape()
})();