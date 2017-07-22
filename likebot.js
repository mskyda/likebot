require('chromedriver');

var webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    Promise = require('promise'),
    settings = require('./settings.json'),
    log4js = require('log4js');

var likeBot = {

    init: function(){

		log4js.configure({
			appenders: { likebot: { type: 'file', filename: 'likebot.log' } },
			categories: { default: { appenders: ['likebot'], level: 'debug' } }
		});

		var logger = log4js.getLogger('likebot');

		var xpath_first_photo = '//header/../div/div/div[1]/div[1]/a[1]';
		var xpath_like_class = '//div[2]/section/a[1]/span[1]';
		var xpath_like_button = '//div[2]/section/a[1]';

		var browser = new webdriver.Builder()
			.forBrowser('chrome')
			.build();

		browser.manage().window().setSize(1024, 700);
		browser.get('https://www.instagram.com/accounts/login/');
		browser.sleep(settings.sleep_delay);
		browser.findElement(by.name('username')).sendKeys(settings.instagram_account_username);
		browser.findElement(by.name('password')).sendKeys(settings.instagram_account_password);
		browser.findElement(by.xpath('//button')).click();
		browser.sleep(settings.sleep_delay).then(function() {
			like_by_nickname(0);
		});

		function like_by_nickname(indexNickname) {
			if (indexNickname >= settings.instagram_accounts_to_be_liked.length) {
				logger.info('Everything is done. Finishing...');
				browser.quit();
				return;
			}
			var promise = new Promise(function (resolve, reject) {
				browser.sleep(settings.sleep_delay);
				logger.info('Doing likes for: ' + settings.instagram_accounts_to_be_liked[indexNickname]);
				browser.get('https://instagram.com/' + settings.instagram_accounts_to_be_liked[indexNickname]);
				browser.sleep(settings.sleep_delay);
				browser.findElement(by.xpath(xpath_first_photo)).click().then(function () {
					like(resolve, 0, settings.like_depth_per_user);
				});
			});
			promise.then(function() {
				indexNickname++;
				like_by_nickname(indexNickname);
			});
		};

		function like(resolve, index, max_likes) {
			browser.getCurrentUrl().then(function(url) {
				logger.debug('Current url:   ' + url);
				browser.sleep(settings.sleep_delay);

				browser.findElement(by.xpath(xpath_like_class)).getAttribute('class').then(function(classname) {
					logger.debug('CSS Classname: ' + classname);
					if (classname.indexOf('coreSpriteHeartFull') > 0) {
						logger.info('Already liked. Stopping...');
						resolve();
					} else {
						if (classname.indexOf('coreSpriteHeartOpen') > 0) {
							browser.findElement(by.xpath(xpath_like_button)).click();
							browser.sleep(settings.sleep_delay);
						}

						var nextBtn = index === 0 ? '//div[1]/div[1]/div[1]/a[1]' : '//div[1]/div[1]/div[1]/a[2]';

						// Analyzing "Next" button availability
						browser.findElements(by.xpath(nextBtn)).then(function(buttons) {

							logger.debug('Buttons: ' + buttons.length + ', Photo Index: ' + index);

							if (buttons.length) {
								buttons[buttons.length - 1].click().then(function() {
									// if we exceed maximum likes depth, stop like this current user.
									index++;
									if (index == max_likes) {
										resolve();
										return;
									}
									like(resolve, index, max_likes);
								});
							} else {
								// "Next" button doesn't exist. Stop like this current user.
								logger.info('Next button does not exist. Stopping...');
								resolve();
							}

						});
					}
				});
			});
		}

    }

};

likeBot.init();
