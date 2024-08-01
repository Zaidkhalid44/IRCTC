const puppeteer = require('puppeteer');
const Jimp = require('jimp');
const { exec } = require('child_process');
const config = require('./config.json');

async function automateIRCTC() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-notifications']
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000); // Set navigation timeout to 60 seconds
    await page.goto('https://www.irctc.co.in/nget/train-search');

    // Wait for necessary elements to load
    await page.waitForSelector('.loginText', { visible: true, timeout: 60000 });
    await page.click('.loginText');
   
    // Read user credentials from config.json
    
    const userid = config.userid;
    await page.waitForSelector('[formcontrolname="userid"]');
    await page.type('[formcontrolname="userid"]', userid, { delay: 10 });
    
    const password = config.password;
    await page.waitForSelector('[formcontrolname="password"]');
    await page.type('[formcontrolname="password"]', password, { delay: 10 });

    // Attempt to solve captcha up to 5 times
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempt ${attempt} to solve captcha`);

        const captchaImagePath = './captcha.png';
        try {
            await downloadCaptchaImage(page, captchaImagePath);
        } catch (error) {
            console.error("Failed to download captcha image:", error);
            await browser.close();
            return;
        }

        const captchaText = await getCaptchaText(captchaImagePath);

        console.log('Extracted Captcha:', captchaText);

        // Fill captcha
        await page.waitForSelector('input[formcontrolname="captcha"]');
        await page.type('input[formcontrolname="captcha"]', captchaText, { delay: 100 });

        // Submit the form
        await page.keyboard.press('Enter');
         // Wait for the form to submit
        if (await isLoggedIn(page)) {
            console.log("Captcha solved and login successful.");
            break;
        } else {
            console.log("Login failed, retrying...");
        }

        // Wait for some indication that login was successful
        // try {
        //     await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 3000 });

        //     // Check if the login was successful by looking for a specific element or URL
        //     if (await isLoggedIn(page)) {
        //         console.log("Captcha solved and login successful.");
        //         break;
        //     } else {
        //         console.log("Login failed, retrying...");
        //     }
        // } catch (error) {
        //     console.log("Captcha failed, retrying...");
        // }

        if (attempt === maxAttempts) {
            console.error("Max attempts to solve captcha reached. Exiting...");
            await browser.close();
            return;
        }
    }
    const origin=config.origin;
    await page.waitForSelector('#origin input.ui-autocomplete-input', { visible: true, timeout: 20000 });
    await page.type('#origin input.ui-autocomplete-input', origin, { delay: 40 });
    // Wait for the autocomplete suggestions and select the first option
    await page.waitForSelector('.ui-autocomplete-list-item', { visible: true, timeout: 20000 });
    await page.keyboard.press('Enter');

    const destination=config.destination;
    await page.waitForSelector('#destination input.ui-autocomplete-input', { visible: true, timeout: 20000 });
    await page.type('#destination input.ui-autocomplete-input', destination, { delay: 40 });
    // Wait for the autocomplete suggestions and select the first option
    await page.waitForSelector('.ui-autocomplete-list-item', { visible: true, timeout: 20000 });
    await page.keyboard.press('Enter');
    // Quota Selection
    //await page.waitForNetworkIdle({ idleTime: 25, timeout: 7000 });
    //await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(500);
    await page.waitForSelector('p-dropdown[formcontrolname="journeyQuota"] .ui-dropdown-trigger', { visible: true, timeout: 30000 });

    // Click the inner trigger button to open the dropdown
    await page.click('p-dropdown[formcontrolname="journeyQuota"]', { delay: 100 });

    // Wait for the dropdown options to be visible
    console.log("Waiting for journey quota dropdown options...");
    await page.waitForSelector('p-dropdown[formcontrolname="journeyQuota"] .ui-dropdown-item');
    console.log("Journey quota dropdown options found.");
    const desiredQuota = config.quota;
    console.log(`Selecting journey quota: ${desiredQuota}`);
    await page.click(`p-dropdown[formcontrolname="journeyQuota"] .ui-dropdown-item[aria-label="${desiredQuota}"]`);

    await page.keyboard.press('Enter');

    const journeyDate=config.date;
    await page.waitForSelector('#jDate input.ui-inputtext', { visible: true, timeout: 20000 });
    await page.click('#jDate input.ui-inputtext');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.type('#jDate input.ui-inputtext', journeyDate, { delay: 100 });
    await page.keyboard.press('Enter');

    const trainNumber=config.train_number;
    const className=config.class;
    await page.waitForSelector('.form-group.no-pad.col-xs-12.bull-back.border-all', { visible: true, timeout: 40000 });
    let trainContainers =await page.$$(".form-group.no-pad.col-xs-12.bull-back.border-all");
    console.log("total containers "+trainContainers.length);

    
    for (const container of trainContainers) {
        const trainHeading = await container.$('.col-sm-5.col-xs-11.train-heading strong');
        if (trainHeading) {
            const trainText = await (await trainHeading.getProperty('textContent')).jsonValue();
            const extractedTrainNumber = trainText.match(/\((\d+)\)/);
            if (extractedTrainNumber && extractedTrainNumber[1] === trainNumber) {
                console.log(`${trainNumber} found.`);
                const classElement = await page.evaluateHandle((container, className) => {
                    const elements = container.querySelectorAll(`.pre-avl strong`);
                    for (let element of elements) {
                        if (element.textContent.includes(className)) {
                            return element.closest('.pre-avl');
                        }
                    }
                    return null;
                }, container, className);
                
                if (classElement) {
                    console.log(`${className} found.`);
                    await (await classElement.asElement()).click();
                    //await page.waitForNetworkIdle({ idleTime: 100, timeout: 9000});
                    await delay(1000);
                    const selectedDate = await page.$('.link.ng-star-inserted .pre-avl strong');
                    if (selectedDate) {
                        await selectedDate.click();
                        console.log(`Clicked on the selected date: ${await page.evaluate(el => el.textContent, selectedDate)}`);
                        await page.waitForSelector('button.btnDefault.train_Search.ng-star-inserted:not(.disable-book)');
                        await page.click('button.btnDefault.train_Search.ng-star-inserted:not(.disable-book)');
                    } else {
                        console.error("Selected date element not found.");
                    }
                    
                    
                } else {
                    console.error(`${className} not found.`);
                }
                break;
            }
        }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

   // await page.waitForNetworkIdle({ idleTime: 100, timeout: 3000});
   await delay(700);
    await page.evaluate(() => {
        window.scrollBy({
            top: 180,
            behavior: 'smooth'  
        });
    });
    
    const PassengerName=config.name;
    await page.waitForSelector('input[placeholder="Passenger Name"]', { visible: true });
    await page.type('input[placeholder="Passenger Name"]', PassengerName, { delay: 90 });

    const passengerAge=config.age;
    await page.waitForSelector('input[formcontrolname="passengerAge"]');
    await page.type('input[formcontrolname="passengerAge"]', passengerAge, { delay: 90 });

    const passengerGender=config.gender;
    await page.waitForSelector('select[formcontrolname="passengerGender"]');
    await page.select('select[formcontrolname="passengerGender"]', passengerGender);

    const windoeBerthPreference=config.berthPreference;
    await page.waitForSelector('select[formcontrolname="passengerBerthChoice"]');
    await page.select('select[formcontrolname="passengerBerthChoice"]', windoeBerthPreference);

    const passengerFoodChoice=config.foodChoice;
    const foodChoiceSelector = 'select[formcontrolname="passengerFoodChoice"]';
    const isFoodChoicePresent = await page.$(foodChoiceSelector) !== null;

    if (isFoodChoicePresent) {
        await page.waitForSelector(foodChoiceSelector);
        await page.select(foodChoiceSelector, passengerFoodChoice);
    } else {
        console.log("Food choice option not found. Skipping selection.");
        // Handle the absence of food choice selection as per your requirements
    }

    await page.waitForSelector('input[formcontrolname="mobileNumber"]');
    await page.click('input[formcontrolname="mobileNumber"]');

    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    const phoneNo=config.phonenumber;
    await page.type('input[formcontrolname="mobileNumber"]', phoneNo, { delay: 90 });


    console.log('Waiting for radio button...');
    try {
        await page.waitForSelector('p-radiobutton[id="2"] .ui-radiobutton-box', { visible: true, timeout: 30000 });
        console.log('Radio button found, clicking...');
        await page.click('p-radiobutton[id="2"] .ui-radiobutton-box');
        console.log('Radio button clicked.');
    } catch (error) {
        console.error('Radio button not found within timeout:', error);
        await page.screenshot({ path: 'radio_button_error.png' });
        console.log('Screenshot taken for debugging.');
    }


console.log('Waiting for continue button...');
await page.waitForSelector('button.train_Search.btnDefault', { visible: true });
console.log('Continue button found, clicking...');
await page.click('button.train_Search.btnDefault');
console.log('Continue button clicked.');


//writing captcha again

console.log('Waiting for captcha image again...');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await delay(2000);
  await page.waitForSelector('img.captcha-img', { visible: true,timeout: 5000 });
  await delay(700);
  await page.evaluate(() => {
      window.scrollBy({
          top: 380,
          behavior: 'smooth' 
      });
  });
const maxAttemptsAgain = 5;
    for (let attempt = 1; attempt <= maxAttemptsAgain; attempt++) {
        console.log(`Attempt ${attempt} to solve captcha`);
        await delay(1000);

        const captchaImagePath = './captcha2.png';
        try {
            await downloadCaptchaImage(page, captchaImagePath);
        } catch (error) {
            console.error("Failed to download captcha image:", error);
            await browser.close();
            return;
        }

        const captchaText = await getCaptchaText(captchaImagePath);

        console.log('Extracted Captcha:', captchaText);

        // Fill captcha
        await page.waitForSelector('input[formcontrolname="captcha"]');
        await page.type('input[formcontrolname="captcha"]', captchaText, { delay: 90 });

        // Submit the form
        await page.keyboard.press('Enter');
         // Wait for the form to submit
        if (await afterDetailsFilled(page)) {
            console.log("Captcha solved again.");
            break;
        } else {
            console.log("Login failed after the filling details, retrying...");
        }

        // Wait for some indication that login was successful
        // try {
        //     await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 3000 });

        //     // Check if the login was successful by looking for a specific element or URL
        //     if (await isLoggedIn(page)) {
        //         console.log("Captcha solved and login successful.");
        //         break;
        //     } else {
        //         console.log("Login failed, retrying...");
        //     }
        // } catch (error) {
        //     console.log("Captcha failed, retrying...");
        // }

        if (attempt === maxAttemptsAgain) {
            console.error("Max attempts to solve captcha reached. Exiting...");
            await browser.close();
            return;
        }
    }
    console.log("Captcha solved again and details filled successfully.");
    await page.waitForSelector('.bank-type:nth-child(1)', {visible: true, timeout: 60000});
    await page.click('.bank-type:nth-child(1)');

    await page.waitForSelector('.bank-text:has(img[src="./assets/images/payment/113.png"])', {visible: true, timeout: 30000});
    await page.click('.bank-text:has(img[src="./assets/images/payment/113.png"])');

    await page.waitForSelector('button.btn.btn-primary.hidden-xs.ng-star-inserted');
    await page.click('button.btn.btn-primary.hidden-xs.ng-star-inserted');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#vpaCheck', {visible: true, timeout: 30000});

    const UPIID=config.UPI;
    await page.type('#vpaCheck', UPIID, {delay: 90});
    await page.keyboard.press('Enter');

    await page.waitForSelector('#upi-sbmt');
    await page.click('#upi-sbmt');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await delay(60000);

    
}

async function downloadCaptchaImage(page, dest) {
    console.log("Waiting for captcha image...");
    await delay(1000);
    const captchaImgElement = await page.waitForSelector('img.captcha-img', { visible: true }); // Increased timeout to 60 seconds
    if (!captchaImgElement) {
        throw new Error("Captcha image not found.");
    }
    console.log("Captcha image found, downloading...");
    await captchaImgElement.screenshot({ path: dest });
    console.log("Captcha image downloaded.");
}

async function processCaptchaImage(imagePath) {
    // Optionally process captcha image with Jimp (resize, enhance, etc.)
    const image = await Jimp.read(imagePath);

    // Convert to grayscale
    image.grayscale().invert();

    // Increase contrast
    image.contrast(0.7).threshold({ max: 128 });

    // Resize for better OCR
    image.resize(300, Jimp.AUTO);

    await image.writeAsync(imagePath);
    console.log('Image processed.');
}

async function getCaptchaText(imagePath) {
    await processCaptchaImage(imagePath);

    return new Promise((resolve, reject) => {
        exec(`tesseract ${imagePath} stdout -l eng --psm 7`, (error, stdout) => { // Added --psm 7 option
            if (error) {
                console.error(`Error executing Tesseract: ${error}`);
                reject(error);
            } else {
                const captchaText = stdout.trim();
                resolve(captchaText);
            }
        });
    });
}

async function isLoggedIn(page) {
    // Check for the presence of the element that appears after login
    try {
     // Wait for the page to load
        await page.waitForSelector('a[href="/nget/logout"]', { visible:true, timeout: 3000 });
        console.log("Logout button found");
        return true;
    } catch (error) {
        return false;
    }
}
async function afterDetailsFilled(page)
{
    try {
        // Wait for the page to load
        await page.waitForSelector('.payment_opt', { visible:true, timeout: 3000 });
           console.log("Payment heading found");
           return true;
       } catch (error) {
           return false;
       }
}
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

// Example usage
automateIRCTC();
