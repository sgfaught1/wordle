const allBoxes = document.querySelectorAll('.box');
const allRows = document.querySelectorAll('.box-row');
const validKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

async function getWord() {
    try {
        let res = await fetch('https://random-word-api.herokuapp.com/word?length=5');
        let myText = await res.json();
        let secretWord = myText[0];
        console.log(secretWord)

        let res1 = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + secretWord)
        let checker = await res1.json()
        console.log(checker[0].word)
        return secretWord

    } catch (e) {
        console.log('ERROR!')
        return getWord()
    }

}

// Use an IIFE (Immediately Invoked Function Expression) to handle async/await at the top level
(async () => {
    const solution = await getWord();
    console.log("Solution:", solution); // Check the fetched word

    let guess = [];
    let currentIndex = 0;
    let currentRow = 0;
    const endHeading = document.querySelector('h2');
    const resetBtn = document.querySelector('#reset');
    const key = document.querySelector('#key')
    const legend = document.querySelector('#legend')

    $(key).click(function() {
    $(legend).slideToggle();
    $(this).text() === 'Key (+)' ? $(this).text('Key (-)') : $(this).text('Key (+)')
    })

    function input() {
        allBoxes.forEach(box => box.setAttribute('tabindex', '0')); // Make each box focusable

        document.addEventListener('keydown', handleKeyInput);

        // Add touch event listeners for mobile
        allBoxes.forEach(box => {
            box.addEventListener('touchstart', handleTouchInput);
        });

        // Set focus to the first box initially
        if (currentIndex === 0) {
            allBoxes[0].focus();
            allBoxes.forEach(box => box.classList.remove('reset-game'))
        }
    }

    function handleKeyInput(e) {
        e.preventDefault(); // Prevent default key behavior

        // Handle current row and box index
        const boxIndex = currentRow * 5 + currentIndex;

        if (e.key === 'Backspace') {
            if (currentIndex > 0) {
                currentIndex--;
                guess.pop();
                allBoxes[boxIndex - 1].textContent = ''; // Clear content of previous box
                allBoxes[boxIndex - 1].focus(); // Focus the previous box
            }
        } else if (e.key === 'Enter') {
            if (guess.length === 5) {
                submitAnswer();
            }
        } else if (validKeys.includes(e.key)) {
            if (currentIndex < 5) {
                allBoxes[boxIndex].textContent = e.key.toUpperCase(); // Set text content to pressed key
                guess.push(e.key.toLowerCase());
                currentIndex++;
                if (currentIndex < 5) {
                    allBoxes[boxIndex + 1].focus(); // Focus the next box
                }
            }
        }
    }

    function handleTouchInput(e) {
        e.preventDefault(); // Prevent default touch behavior

        // Focus the hidden input to bring up the keyboard
        hiddenInput.focus();

        // Listen for input events on the hidden input
        hiddenInput.addEventListener('input', () => {
            const char = hiddenInput.value;
            hiddenInput.value = ''; // Clear the input value

            if (char && validKeys.includes(char)) {
                // Handle current row and box index
                const boxIndex = currentRow * 5 + currentIndex;

                if (currentIndex < 5) {
                    allBoxes[boxIndex].textContent = char.toUpperCase(); // Set text content to entered character
                    guess.push(char.toLowerCase());
                    currentIndex++;
                    if (currentIndex < 5) {
                        allBoxes[boxIndex + 1].focus(); // Focus the next box
                    }
                }
            }
        });
    }

    async function submitAnswer() {
        try {
            let answer = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + guess.join(''))
            let myAnswer = await answer.json()
            let newGuess = myAnswer[0].word
            console.log(newGuess)
            console.log(solution);

            const solutionFrequency = {};
            const guessFrequency = {};

            endHeading.innerHTML = 'Type any 5-letter word below & press Enter!'


            // Build frequency map for the solution
            for (let char of solution) {
                if (!solutionFrequency[char]) {
                    solutionFrequency[char] = 0;
                }
                solutionFrequency[char]++;
            }

            // First pass: check for greens
            for (let i = 0; i < guess.length; i++) {
                const boxIndex = currentRow * 5 + i;
                if (solution[i] === guess[i]) {
                    allBoxes[boxIndex].classList.add('blueCard');
                    solutionFrequency[guess[i]]--;
                } else {
                    allBoxes[boxIndex].classList.add('grayCard');
                    if (!guessFrequency[guess[i]]) {
                        guessFrequency[guess[i]] = 0;
                    }
                    guessFrequency[guess[i]]++;
                }
            }

            // Second pass: check for yellows
            for (let i = 0; i < guess.length; i++) {
                const boxIndex = currentRow * 5 + i;
                if (solution[i] !== guess[i] && solution.includes(guess[i]) && solutionFrequency[guess[i]] > 0) {
                    allBoxes[boxIndex].classList.add('orangeCard');
                    allBoxes[boxIndex].classList.remove('grayCard');
                    solutionFrequency[guess[i]]--;
                }
            }

            if (guess.join('') === solution) {
                endHeading.innerHTML = "Congratulations! You got it!";
                confetti({
                    particleCount: 300,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                // and launch a few from the right edge
                confetti({
                    particleCount: 300,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            } else if (currentRow < allRows.length - 1) {
                currentRow++;
                currentIndex = 0;
                guess = [];
                allBoxes[currentRow * 5].focus();
            } else {
                endHeading.innerHTML = `Game Over! The correct word was ${solution.toUpperCase()}.`;
            }
        } catch (e) {
            endHeading.innerHTML = 'Not a word! Try again!'
        }

    }

    function reset() {
        location.reload(true);
    }

    resetBtn.addEventListener('click', reset);

    input();
})();
