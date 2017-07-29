'use strict';

require('chromedriver');

const webdriver = require('selenium-webdriver'),
    by = webdriver.By,
	prompt = require('prompt');

prompt.start();

prompt.get([
	{
		description: 'Instagram tag to like',
		name: 'tag',
		required: true
	},
	{
		description: 'How many likes',
		name: 'likes',
		required: true,
		type: 'number'
	},
	{
		description: 'Instagram login',
		name: 'login',
		required: true
	},
	{
		description: 'Instagram password',
		name: 'password',
		required: true,
		hidden: true,
		replace: '*',
	},
	{
		description: 'Run in background? [y/n]',
		name: 'hiddenBrowser',
		required: true
	}
], (err, result) => {

	if(!err) {

		const bot = new Bot(result);

		bot.init();

	}
});

class Bot{

	constructor(settings) {

		this.settings = settings;

		this.xpath = {
			firstPic: '//header/../div/div/div[1]/div[1]/a[1]',
			likeClass: '//div[2]/section/a[1]/span[1]',
			likeBtn: '//div[2]/section/a[1]',
			nextBtn: '//div[1]/div[1]/div[1]/a[2]'
		};

		this.browser = new webdriver.Builder().forBrowser(this.settings.hiddenBrowser.toLowerCase() === 'y' ? 'phantomjs' : 'chrome').build();

	}

	static sleepDelay() { return Math.round(Math.random() * 500 + 500); } // 500-100

	init() {

		this.openBrowser();

		this.logIn();

		this.openPosts();

		this.processPost(0);

	}

	openBrowser() {

		console.log('*** Open browser ***');
		this.browser.manage().window().setSize(1024, 768);
		this.browser.get('https://instagram.com/accounts/login/');
		this.browser.sleep(Bot.sleepDelay());

	}

	logIn() {

		console.log('*** Login ***');
		this.browser.findElement(by.name('username')).sendKeys(this.settings.login);
		this.browser.findElement(by.name('password')).sendKeys(this.settings.password);
		this.browser.findElement(by.xpath('//button')).click();
		this.browser.sleep(Bot.sleepDelay());

	}

	openPosts() {

		this.browser.get(`https://instagram.com/explore/tags/${this.settings.tag}`);

		this.browser.sleep(Bot.sleepDelay());

		this.browser.findElements(by.xpath(this.xpath.firstPic)).then(links => {

			links[1].click();

			this.browser.sleep(Bot.sleepDelay())

			console.log(`*** Open posts by tag: ${this.settings.tag} ***`);

		});

	}

	processPost(index) {

		this.browser.getCurrentUrl().then(url => {

			console.log(`${index + 1}/${this.settings.likes}: Open post: ${url}`);

			this.browser.sleep(Bot.sleepDelay());

			this.likePost(index);

			this.goNext(index);
			
		});

	}

	likePost(index) {

		this.browser.findElement(by.xpath(this.xpath.likeClass)).getAttribute('class').then((className) => {

			if (className.indexOf('coreSpriteHeartFull') > 0) {

				console.log(`${index + 1}/${this.settings.likes}: already liked. Skip it`);

			} else if (className.indexOf('coreSpriteHeartOpen') > 0){

				console.log(`${index + 1}/${this.settings.likes}: Like post`);

				this.browser.findElement(by.xpath(this.xpath.likeBtn)).click();
			}

			this.browser.sleep(Bot.sleepDelay());

		});

	}

	goNext(index) {

		this.browser.findElements(by.xpath(this.xpath.nextBtn)).then((buttons) => {

			if (!buttons.length) {

				console.log(`${index + 1}/${this.settings.likes}: Next button is absent`);

				this.exit();
			}

			buttons[buttons.length - 1].click().then(() => {

				index++;

				if (index === this.settings.likes) {

					this.exit();

				} else {

					console.log(`${index}/${this.settings.likes}: Go to the next post`);

					this.processPost(index);

				}

			});

		});

	}

	exit() {

		console.log('*** All done. Exit ***');

		this.browser.quit();

	}
}