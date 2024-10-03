// Sample MCQs array (you would replace this with your actual array)
const mcqs = [
    {
        question: " What happens when a value is assigned to a member of a union?                ",
        options: [' The value is stored in all members      ', ' Only that member"s value is stored, others are undefined      ', ' The union resizes to accommodate the value      ', ' All members of the union are initialized to the same value    '],
        answer: "B. Only that member's value is stored, others are undefined",
        explanation: " Assigning a value to a union member stores the value in the shared memory, making other members' values undefined.    "
    }
];

// Function to format MCQ for ChatGPT
function formatMCQ(mcq) {
    return `Question: ${mcq.question}\n\nOptions:\nA.${mcq.options[0]}\nB.${mcq.options[1]}\nC.${mcq.options[2]}\nD.${mcq.options[3]}\n\nAnswer: ${mcq.answer}\nExplanation: ${mcq.explanation}\n\nPlease rewrite this MCQ as a JavaScript array (make necessary chenges if needed )in the following format: {question, options, B. answer, explanation}.\n dont put ABCD is option only put it in answer \n also very important use html code inside the array where ever needed (e.g samp, pre code etc)`;
}

// Function to set text in ChatGPT prompt area
function setPromptText(text) {
    const promptArea = document.querySelector('#prompt-textarea');
    if (promptArea) {
        // Create a new 'input' event
        const inputEvent = new Event('input', { bubbles: true });
        
        // Set the text content and inner HTML
        promptArea.textContent = text;
        promptArea.innerHTML = `<p>${text}</p>`;
        
        // Dispatch the event
        promptArea.dispatchEvent(inputEvent);
    }
}
// Function to wait for ChatGPT response indefinitely
async function waitForResponse(currentResponseCount) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((_mutations, obs) => {
            const responseDivs = document.querySelectorAll('.markdown.prose');
            const lastResponseDiv = responseDivs[responseDivs.length - 1];

            if (responseDivs.length > currentResponseCount && 
                lastResponseDiv && 
                !lastResponseDiv.classList.contains('result-streaming')) {
                obs.disconnect();
                resolve(lastResponseDiv.textContent);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


function clickSendButton() {
    // Select the button using its `data-testid` attribute
    const sendButton = document.querySelector('button[data-testid="send-button"]');

    if (sendButton) {
        // Wait for 5 seconds (5000 milliseconds) before clicking
        setTimeout(() => {
            sendButton.click();
            console.log("Send button clicked after 5 seconds!");
        }, 5000);
        return true;
    } else {
        console.log("Send button not found!");
        return false;
    }
}

// Main function to process MCQs
async function processMCQs() {
    const responses = [];

    for (const mcq of mcqs) {
        // Format and set the MCQ in the prompt area
        const formattedMCQ = formatMCQ(mcq);
        setPromptText(formattedMCQ);
        let flag = clickSendButton();

        if (flag) {
            const response = await waitForResponse(responses.length);
            if (response) {
                // Add response to array
                responses.push({
                    question: mcq.question,
                    givenAnswer: response,
                    correctAnswer: mcq.answer,
                    explanation: mcq.explanation
                });
            } else {
                console.log('No response for question:', mcq.question);
            }
            // Wait a bit before next request to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            console.log('Failed to send question:', mcq.question);
        }
    }

    return responses;
}

// Execute the script and log results
console.log('Starting MCQ processing...');
processMCQs().then(responses => {
    console.log('All responses:', responses);
}).catch(error => {
    console.error('Error processing MCQs:', error);
});




/* Function to simulate Enter key press
function simulateEnterPress() {
    const promptArea = document.querySelector('#prompt-textarea');
    if (promptArea) {
        const enterKeyEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            shiftKey: false,
            ctrlKey: false,
            metaKey: false
        });
        
        promptArea.dispatchEvent(enterKeyEvent);
        return true;
    }
    return false;
}*/
