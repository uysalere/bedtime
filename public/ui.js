export function updateUI(translations, language) {
    // Update all text content
    document.getElementById('title').textContent = translations[language].title;
    document.getElementById('labelMainCharacter').textContent = translations[language].mainCharacter;
    document.getElementById('labelFriends').textContent = translations[language].friends;
    document.getElementById('labelTopic').textContent = translations[language].storyAbout;
    document.getElementById('labelLocation').textContent = translations[language].location;
    document.getElementById('labelAge').textContent = translations[language].age;
    document.getElementById('labelExcitement').textContent = translations[language].excitement;
    document.getElementById('generateText').textContent = translations[language].generate;
    document.getElementById('storyTitle').textContent = translations[language].yourStory;
    document.getElementById('shareText').textContent = translations[language].share;


    // Update placeholders
    document.getElementById('mainCharacter').placeholder = translations[language].mainCharacterPlaceholder;
    document.getElementById('friends').placeholder = translations[language].friendsPlaceholder;
    document.getElementById('topic').placeholder = translations[language].storyAboutPlaceholder;
    document.getElementById('location').placeholder = translations[language].locationPlaceholder;
}

export function updateExcitementValue(value) {
    document.getElementById('excitementValue').textContent = value;
}

export function showStory(story) {
    const storyContainer = document.getElementById('storyContainer');
    const storyText = document.getElementById('storyText');

    storyText.textContent = story;
    storyContainer.classList.remove('hidden');
}