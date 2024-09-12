document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submit');
    const orderTable = document.getElementById('orderTable');
    let orders = [];
    let grandTotal = 0;

    orderTable.addEventListener('click', function(event) {
        if (event.target.classList.contains('increment')) {
            let valueElement = event.target.previousElementSibling;
            let value = parseInt(valueElement.textContent);
            valueElement.textContent = value + 1;
        }

        if (event.target.classList.contains('decrement')) {
            let valueElement = event.target.nextElementSibling;
            let value = parseInt(valueElement.textContent);
            if (value > 0) {
                valueElement.textContent = value - 1;
            }
        }
    });

    submitButton.addEventListener('click', () => {
        orders = []; // Reset the orders array on each submit click
        grandTotal = 0;

        const rows = orderTable.querySelectorAll('tr');

        rows.forEach((row, index) => {
            if (index === 0) return; // Skip the header row

            const itemCheckbox = row.querySelector('.item');
            const optionalCheckboxes = row.querySelectorAll('.optional');
            const valueElement = row.querySelector('.value');
            const quantity = parseInt(valueElement.textContent);

            let itemChecked = itemCheckbox.checked;
            let action = [];
            let total = 0;

            optionalCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    action.push(`${checkbox.dataset.action}(${checkbox.dataset.price})`);
                    total += parseInt(checkbox.dataset.price) * quantity;
                }
            });

            if (itemChecked && action.length > 0 && quantity > 0) {
                // Get the item name by navigating the DOM tree
                const itemName = row.querySelector('td').textContent.trim().split(' ')[0];

                orders.push({
                    item: itemName,
                    action: action.join(', '),
                    quantity: quantity,
                    total: total
                });
                grandTotal += total; // Accumulate the total of each order into grandTotal
            }
        });

        // Structure the final data with orders array and grandTotal as a separate key-value
        const finalData = {
            orders: orders,
            grandTotal: grandTotal
        };

        console.log(finalData);

        // Store the result in sessionStorage
        sessionStorage.setItem('orders', JSON.stringify(finalData));

        // Redirect to the order.html page
        window.location.href = 'order.html';
    });
});
