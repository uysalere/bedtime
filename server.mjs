import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    GoogleGenAI,
    HarmBlockMethod,
    HarmBlockThreshold,
    HarmCategory,
} from "@google/genai";
import fs from 'fs';
import bodyParser from 'body-parser';

const gemini_api_key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ vertexai: false, apiKey: gemini_api_key });

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
        const result = await genAI.models.generateContentStream({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                ],
            },
        });
        let fullStory = '';
        for await (const item of result) {
            if (item && item.text) {
                fullStory += item.text;
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
    const { mainCharacter, friends, topic, location, age, excitement, language } = data;

    // Determine language style guidance based on age
    let languageStyleGuidance = '';
    if (age <= 5) {
        languageStyleGuidance = 'Use very simple words and short sentences. Keep the tone extremely gentle and reassuring. Focus on basic concepts and sensory details. Avoid anything remotely complex, scary, or ambiguous.';
    } else if (age <= 9) {
        languageStyleGuidance = 'Use clear, engaging language suitable for young school children. Introduce slightly more complex sentences but keep the vocabulary common. Themes should be straightforward and positive. Mild peril is okay if resolved quickly and gently.';
    } else if (age <= 13) {
        languageStyleGuidance = 'Use language appropriate for pre-teens/early teens. More complex sentence structures, richer vocabulary, and more nuanced themes (like friendship challenges, simple dilemmas) are suitable. The tone can be more adventurous or slightly mysterious, but still ultimately comforting.';
    } else if (age < 18) { // Ages 14-17
        languageStyleGuidance = 'Use language suitable for teenagers (14-17). Allow for complex vocabulary, nuanced themes, and a mature tone (e.g., introspection, complex relationships, moral ambiguity within reason). If fitting for the story and character, *mildly* stronger or more colloquial language appropriate for this age group can be included. Focus on relatability and engagement, while generally maintaining a tone suitable for winding down before sleep.';
    } else { // Age 18+
        languageStyleGuidance = `Use sophisticated language suitable for adults. Fully complex vocabulary, sentence structures, and mature/ M-rated themes (e.g., philosophical questions, complex relationships, social commentary, existential thoughts) are appropriate. The tone can range widely (dark, satirical, emotional, atmospheric, etc.). Contextually relevant adult language, including potentially **stronger language (profanity if appropriate)** or more intense/unsettling situations, may be used if they genuinely serve the narrative and requested excitement level. Aim for a thought-provoking or atmospheric story that can still function in a 'winding down' context, unless the topic/excitement dictates a more intense ending. Avoid gratuitous shock value unless specifically implied by the topic.`;
    }

    // Determine excitement guidance
    const excitementDescription = excitement > 75 ? 'Include several twists, turns, and moments of high energy or suspense, using vivid and dynamic language.' :
        excitement > 40 ? 'Maintain a good pace with some interesting events or mild challenges, using engaging language.' :
            'Focus on a calm, gentle, and relaxing narrative with minimal conflict, using soothing and descriptive language.';

    return `
    Create a bedtime story in ${language} aimed at a ${age}-year-old.

    **Story Core:**
    - Main Character: ${mainCharacter}
    ${friends ? `- Friends: ${friends}` : ''}
    - Setting: ${location}
    - Central Topic/Plot: ${topic}

    **Style & Tone Guidance:**
    - Language Style: ${languageStyleGuidance}
    - Excitement Level (${excitement}/100): ${excitementDescription} Ensure the story winds down towards the end for bedtime.

    **Instructions:**
    - Weave the character(s), setting, and topic into a coherent narrative.
    - Adapt the complexity, tone, vocabulary, and themes according to the age and specified language style.
    - Adjust the story's pacing and intensity based on the excitement level, ensuring a calming conclusion suitable for sleep.
    - Do not explicitly state the excitement level or age guidelines in the story itself.
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