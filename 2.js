// JavaScript for 2.html

// Function to handle button clicks for user roles
document.querySelectorAll('.card button').forEach(button => {
    button.addEventListener('click', function() {
        alert(`You clicked on ${this.textContent}`);
        // Here you can add redirection or other functionality as needed
    });
});

// Function for the "Get Started" button
document.querySelector('.get-started').addEventListener('click', function() {
    alert('Get Started button clicked!');
    // Here you can add redirection or other functionality as needed
});
