import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import fs from 'fs';
import bodyParser from 'body-parser';

const gemini_api_key = process.env.GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiModel = googleAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/generate-story', async (req, res) => {

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // For Nginx

    try {
        const prompt = createBedtimePrompt(req.body);
        const result = await geminiModel.generateContentStream(prompt);
        let fullStory = '';
        for await (const item of result.stream) {
            if (item && item.candidates && item.candidates[0] && item.candidates[0].content && item.candidates[0].content.parts) {
                fullStory += item.candidates[0].content.parts[0].text;
            } else {
                console.error("Error: Unexpected response format from Gemini:", item);
                // Handle the error appropriately, e.g., send an error response to the client
                res.status(500).send("An error occurred during story generation.");
                return; // Stop processing the stream
            }
        }

        res.json({ story: fullStory }); // Send the generated story as JSON
    } catch (error) {
        console.log("Error in /generate-story:", error);
        res.status(500).send("An error occurred during story generation.");
    }
});

function createBedtimePrompt(data) {
    const mainCharacter = data.mainCharacter;
    const friends = data.friends;
    const topic = data.topic;
    const location = data.location;
    const age = data.age;
    const excitement = data.excitement;
    const language = data.language;

    return `
    Write a bedtime story in ${language} for a ${age} year old, with an excitement level of ${excitement}/100.
    The main character is ${mainCharacter}.
    ${friends ? `Their friends are ${friends}.` : ''}
    The story takes place in ${location}.
    The story is about ${topic}.
    Excitement level(not printed) higher to lower: more twists in the story with a more excited language to more mellow story that is slow.
    `;
}

app.post('/save-story', (req, res) => {
    const story = req.body.story;
    const mainCharacter = req.body.mainCharacter;
    const language = req.body.language;

    const fileContent = `
    <!DOCTYPE html>
<html lang="${language}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-960JDDS52W"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-960JDDS52W');
    </script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1748104146013564"
        crossorigin="anonymous"></script>
    <title>Bedtime</title>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../styles.css">
</head>

<body>
    <div class="container">
        <header>
            <div class="logo">
                <span class="tooltip">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span class="tooltiptext">Unleash the magic of storytelling! AI weaves enchanting bedtime tales,
                        personalized for your little ones. Sweet dreams
                        guaranteed (and free).</span>
                </span>
                <a href="/">
                    <h1 id="title">Bedtime</h1>
                </a>
            </div>
        </header>

        <div id="storyContainer" class="story-container">
            <h2 id="storyTitle">${mainCharacter}'s Magical Story</h2>
            <p id="storyText">${story}</p>
        </div>
    </div>

    <footer>
        <a href="https://uyslab.com" class="full-footer-link" aria-label="Go to uyslab homepage">
            <p>&copy; 2025 uyslab</p>
        </a>
    </footer>
</body>

</html>
    `;
    const timestamp = Date.now().toString(36);
    const filename = `${mainCharacter.split('(')[0].trim()}-${timestamp}.html`;
    const filePath = path.join(__dirname, 'public', 'stories', filename);

    fs.writeFile(filePath, fileContent, err => {
        if (err) {
            console.error("Error saving story:", err);
            res.status(500).send("Error saving the story.");
        } else {
            const storyUrl = `${req.protocol}://${req.get('host')}/stories/${filename}`;
            res.send({ url: storyUrl }); // Send the story URL back to the client
            console.log(`Story saved to ${filename}`);
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});