'use strict';

const express = require('express'),
	bodyParser = require('body-parser'),
	http = require('http'),
	app = express(),
	server = http.createServer(app),
	webdriver = require('selenium-webdriver'),
	by = webdriver.By;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./public/'));

app.post('/', (req, res) => {

	let bot = new Bot(req.body, res);

	bot.init();

});

server.listen(8080);

class Bot{

	constructor(settings, response) {

		this.response = response;

		this.settings = settings;

		this.xpath = {
			firstPic: '//header/../div/div/div[1]/div[1]/a[1]',
			likeClass: '//div[2]/section/a[1]/span[1]',
			likeBtn: '//div[2]/section/a[1]',
			nextBtn: '//div[1]/div[1]/div[1]/a[2]'
		};

		this.browser = new webdriver.Builder().forBrowser('phantomjs').build();

	}

	static sleepDelay() { return Math.round(Math.random() * 500 + 500); } // 500-100

	init() {

		this.openBrowser();

		this.logIn();

	}

	openBrowser() {

		this.response.write('<br> *** Open browser ***');
		this.browser.manage().window().setSize(1024, 768);
		this.browser.get('https://instagram.com/accounts/login/');
		this.browser.sleep(Bot.sleepDelay());

	}

	logIn() {

		this.response.write('<br> *** Login ***');
		this.browser.findElement(by.name('username')).sendKeys(this.settings.login);
		this.browser.findElement(by.name('password')).sendKeys(this.settings.password);
		this.browser.findElement(by.xpath('//button')).click();
		this.browser.sleep(Bot.sleepDelay() * 5).then(() => {

			return this.browser.getCurrentUrl();

		}).then((currentUrl) => {

			if(currentUrl.indexOf('login') !== -1){

				this.response.write('<br> *** Cannot login. Check credentials ***');

				this.exit();

			} else {

				this.openPosts();

				this.processPost(0);

			}

		});

	}

	openPosts() {

		this.browser.get(`https://instagram.com/explore/tags/${this.settings.tag}`);

		this.browser.sleep(Bot.sleepDelay());

		this.browser.findElements(by.xpath(this.xpath.firstPic)).then(links => {

			links[1].click();

			this.browser.sleep(Bot.sleepDelay());

			this.response.write(`<br> *** Open posts by tag: ${this.settings.tag} ***`);

		});

	}

	processPost(index) {

		this.browser.getCurrentUrl().then(url => {

			this.response.write(`<br> ${index + 1}/${this.settings.likes}: Open post: ${url}`);

			this.browser.sleep(Bot.sleepDelay());

			this.likePost(index);

			this.goNext(index);

		});

	}

	likePost(index) {

		this.browser.findElement(by.xpath(this.xpath.likeClass)).getAttribute('class').then((className) => {

			if (className.indexOf('coreSpriteHeartFull') > 0) {

				this.response.write(`<br> ${index + 1}/${this.settings.likes}: already liked. Skip it`);

			} else if (className.indexOf('coreSpriteHeartOpen') > 0){

				this.response.write(`<br> ${index + 1}/${this.settings.likes}: Like post`);

				this.browser.findElement(by.xpath(this.xpath.likeBtn)).click();
			}

			this.browser.sleep(Bot.sleepDelay());

		});

	}

	goNext(index) {

		this.browser.findElements(by.xpath(this.xpath.nextBtn)).then((buttons) => {

			if (!buttons.length) {

				this.response.write(`<br> ${index + 1}/${this.settings.likes}: Next button is absent`);

				this.exit();
			}

			buttons[buttons.length - 1].click().then(() => {

				index++;

				if (index === +this.settings.likes) {

					this.exit();

				} else {

					this.response.write(`<br> ${index}/${this.settings.likes}: Go to the next post`);

					this.processPost(index);

				}

			});

		});

	}

	exit() {

		this.browser.manage().deleteAllCookies();

		this.browser.quit();

		this.response.write('<br> *** All done. Exit ***');

		this.response.end();

	}
}