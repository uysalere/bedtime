import { translations } from './translations.js';
import { updateUI, updateExcitementValue, showStory } from './ui.js';

// Initialize the app
let currentLanguage = 'en';

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI with default language
    updateUI(translations, currentLanguage);

    // Language selector
    const languageSelect = document.getElementById('language');
    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateUI(translations, currentLanguage);
    });

    // Excitement slider
    const excitementSlider = document.getElementById('excitement');
    excitementSlider.addEventListener('input', (e) => {
        updateExcitementValue(e.target.value);
    });

    // Form submission
    const storyForm = document.getElementById('storyForm');
    let storyData = {};
    storyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(storyForm);
        storyData = Object.fromEntries(formData.entries());

        // Get the generate button and its original text
        const generateButton = document.getElementById('generateText');
        const languageSelect = document.getElementById('language');
        const language = languageSelect.options[languageSelect.selectedIndex].text;

        try {
            // Change button text to "Loading..."
            generateButton.innerHTML = `${translations[currentLanguage].loading} <span class="loading-dots"></span>`;

            const response = await fetch('/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...storyData,
                    language: language
                })
            });

            const result = await response.json();
            showStory(result.story);
        } catch (error) {
            console.error('Failed to generate story:', error);
        } finally {
            // Revert button text back to the original
            generateButton.textContent = originalButtonText;

            shareButton.disabled = false;
            shareButton.textContent = translations[currentLanguage].share;
        }
    });

    // Share button
    const shareButton = document.getElementById('shareButton');
    shareButton.addEventListener('click', async () => {
        const languageSelect = document.getElementById('language');
        const language = languageSelect.options[languageSelect.selectedIndex].text;
        const storyText = document.getElementById('storyText').textContent;
        shareButton.disabled = true; // Disable the button while processing

        try {
            const response = await fetch('/save-story', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: language,
                    story: storyText,
                    mainCharacter: storyData.mainCharacter,
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Check if clipboard API is supported
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(data.url)
                        .then(() => {
                            shareButton.textContent = `Copied ${data.url}`;
                        })
                        .catch(err => {
                            console.error('Failed to copy URL: ', err);
                            fallbackToRedirect(data.url); // Fallback if clipboard fails
                        });
                } else {
                    fallbackToRedirect(data.url); // Fallback for iOS and unsupported browsers
                }
            } else {
                console.error('Error saving story:', response.status);
                shareButton.textContent = 'Error sharing story';
            }
        } catch (error) {
            console.error('Error:', error);
            shareButton.textContent = 'Error sharing story';
        }
    });

    function fallbackToRedirect(url) {
        window.open(url, '_blank');
        shareButton.textContent = `Opened ${url}`;
    }
});
