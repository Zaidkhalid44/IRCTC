# IRCTC AUTOMATION PROJECT USING PUPPETEER
---
This project automates the IRCTC train ticket booking process using JavaScript, Puppeteer, and Tesseract.js. It streamlines various tasks such as logging in, solving captchas, filling in forms, and even handling UPI payments, reducing manual effort by approximately 90%.

## Project Demo

Watch the [demo video on LinkedIn](https://www.linkedin.com/feed/update/urn:li:activity:7220874544272531456/) to see the automation in action.

## Features

- **Automated Login**: Automatically logs into the IRCTC portal using user-provided credentials.
- **Captcha Solving**: Integrates Tesseract.js to solve captchas with an 80% success rate.
- **Form Filling**: Automatically fills in the required booking details such as train number, class, passenger information, and contact details.
- **UPI Payment Handling**: Pre-fills the UPI ID for payment, requiring only user confirmation on their mobile device.
- **Efficient Booking**: Completes the entire ticket booking process in under 2 minutes.

## Technologies Used

- **JavaScript**: The core language used for scripting the automation.
- **Puppeteer**: A Node.js library that provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol.
- **Tesseract.js**: An OCR (Optical Character Recognition) engine that solves captchas.
- **Jimp**: A JavaScript Image Manipulation Program, used for processing images (e.g., captcha images).

## Prerequisites
Before you begin, ensure you have met the following requirements:

- **Puppeteer**:Puppeteer is a Node.js library that will be installed automatically when running npm install, but ensure you have Google Chrome or Chromium installed for it to work correctly.
- **Node.js**: Ensure Node.js (v14.x or higher) and npm (v6.x or higher) are installed on your system. You can download Node.js from nodejs.org.
- **Tesseract**: Tesseract requires Tesseract OCR software to be installed on your system. Download and install Tesseract from here.
- **Jimp**: The Jimp package will be installed as part of the project's dependencies.

## How It Works

- **Login Process**: The script uses Puppeteer to open the IRCTC login page and automatically enter your credentials.
- **Captcha Solving**: Tesseract.js is used to extract text from the captcha image, which is then input into the captcha field.
- **Form Filling**: The script navigates through the booking process by selecting the train, class, and filling out passenger details based on your input.
- **Payment**: The UPI ID is filled in, and you just need to confirm the payment on your mobile device.

## Project Structure

- `irctcAutomation.js`: The main script that handles the automation process.
- `README.txt`: Documentation for the project.

## Contributing

If you'd like to contribute, please fork the repository and use a feature branch. Pull requests are welcome.

## Contact

- **Author**: Zaid Khalid
- **Email**: [zaidkhalidmca@gmail.com](mailto:zaidkhalidmca@gmail.com)
- **LinkedIn**: [Zaid Khalid](https://www.linkedin.com/in/zaidkhalid/)
- **GitHub**: [Zaid Khalid](https://github.com/Zaidkhalid44)

## License

This project is licensed under the MIT License.

---
