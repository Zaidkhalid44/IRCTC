const puppeteer = require('puppeteer');
const request = require('request');
const Jimp = require('jimp');
const { exec } = require('child_process');
const fs = require('fs');
const minimist = require('minimist');
const Tesseract = require('tesseract.js');

async function automateIRCTC() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-notifications']
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000); // Set navigation timeout to 60 seconds

    try {
        await page.goto('https://www.irctc.co.in/nget/train-search');
    } catch (error) {
        console.error("Navigation to IRCTC site failed:", error);
        await browser.close();
        return;
    }

    // Wait for necessary elements to load
    await page.waitForSelector('.loginText');
    await page.click('.loginText');
   
    // Read user credentials from config.json
    const config = require('./config.json');
    const userid = config.userid;
    const password = config.password;

    await page.waitForSelector('[formcontrolname="userid"]');
    await page.type('[formcontrolname="userid"]', userid, { delay: 100 } );

    await page.waitForSelector('[formcontrolname="password"]');
    await page.type('[formcontrolname="password"]', password, { delay: 100 });

    // Download captcha image using Puppeteer
    const captchaImagePath = './captcha.png';
    try {
        await downloadCaptchaImage(page, captchaImagePath);
    } catch (error) {
        console.error("Failed to download captcha image:", error);
        await browser.close();
        return;
    }

    // Process captcha using Tesseract
    const captchaText = await getCaptchaText(captchaImagePath);

    // Log extracted captcha text
    console.log('Extracted Captcha:', captchaText);

    // Fill captcha
    await page.waitForSelector('input[formcontrolname="captcha"]');
    await page.type('input[formcontrolname="captcha"]', captchaText, { delay: 100 });

    // Submit the form
    await page.keyboard.press('Enter');
    console.log("Login Successful");
    await page.waitForSelector('.ui-inputtext');
    await page.type('.ui-inputtext', 'CNB', { delay: 100 });

    // Uncomment the line below to keep the browser open for inspection
    // await browser.close();
}

async function downloadCaptchaImage(page, dest) {
    console.log("Waiting for captcha image...");
    const captchaImgElement = await page.waitForSelector('img.captcha-img', { timeout: 60000 }); // Increased timeout to 60 seconds
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
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const cropX = 0;  // Example crop starting x-coordinate
    const cropY = 0;  // Example crop starting y-coordinate
    const cropWidth = Math.min(width, 150);  // Ensure cropping dimensions are within image bounds
    const cropHeight = Math.min(height, 50); // Ensure cropping dimensions are within image bounds

    await image.crop(cropX, cropY, cropWidth, cropHeight).writeAsync(imagePath);
    console.log('Image is Cropped');
}

async function getCaptchaText(imagePath) {
    await processCaptchaImage(imagePath);

    return new Promise((resolve, reject) => {
        exec(`tesseract ${imagePath} stdout -l eng`, (error, stdout, stderr) => {
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

// Example usage
automateIRCTC();
