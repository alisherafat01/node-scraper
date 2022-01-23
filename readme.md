### Nodejs lightweight scraper sample 

this sample uses `accuweather.com` website for getting weather data, you pass a certain month address to it and it gets a brief data of the month and automatically fetchs all data of it's days by loading detail page which is in another url.

- Wihtout using headless browser libriaries like puppeteer
- It can be implemented just by one dependency `(cheerio)`
- Easy to code because it uses Jquery syntax for finding DOM


### Use:
1. Edit url in index.js 

2. ```npm index.js```

### Output

```
fetching data from URL:https://www.accuweather.com/en/gb/london/ec4a-2/february-weather/328328?year=2022

successfully written to file > 2022-February.json
```