// JavaScript for Learning Dashboard

// Function to handle button clicks
document.querySelectorAll('nav button').forEach(button => {
    button.addEventListener('click', function() {
        alert(`You clicked on ${this.textContent}`);
    });
});

// Function to update progress bars
function updateProgressBars() {
    const progressBars = document.querySelectorAll('.progress');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.textContent = width; // Display the width percentage
    });
}

// Call the function to update progress bars on load
updateProgressBars();
