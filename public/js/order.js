document.addEventListener('DOMContentLoaded', () => {
    const summaryTableBody = document.querySelector('#summaryTable tbody');
    const payButton = document.getElementById('pay');
    const cancelButton = document.getElementById('cancel');
    
    // Retrieve the order data from sessionStorage
    const storedData = JSON.parse(sessionStorage.getItem('orders')) || {};
    const orders = storedData.orders || [];
    const grandTotal = storedData.grandTotal || 0;
  
    // Populate the table with order data
    orders.forEach(order => {
      const row = document.createElement('tr');
  
      // Extract wash and iron actions separately
      let washAction = '';
      let ironAction = '';
      const actions = order.action.split(', ');
      actions.forEach(action => {
        if (action.includes('wash')) washAction = action;
        if (action.includes('iron')) ironAction = action;
      });
  
      row.innerHTML = `
        <td>${order.item}</td>
        <td>${washAction}</td>
        <td>${ironAction}</td>
        <td>${order.quantity}</td>
        <td>${order.total}</td>
      `;
      summaryTableBody.appendChild(row);
    });
  
    // Update the Pay button with the grand total
    payButton.textContent = `Pay ${grandTotal}`;
  
    // Handle the Pay button click event
    payButton.addEventListener('click', async () => {
      try {
        // Send order data to the server
        const response = await fetch('order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(storedData),  // Send the entire storedData, including grandTotal
        });
  
        if (response.ok) {
            const data = await response.json();  // Expect JSON response with authorization_url
            const { authorizationUrl } = data;
            if (authorizationUrl) {
                window.location.href = authorizationUrl;  // Redirect to Paystack
            } else {
                alert('Payment URL not received. Please try again.');
            }
        } else {
            alert('Failed to place the order. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while placing the order. Please try again.');
    }
    });  
    // Handle the Cancel button click event
    cancelButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel the order?')) {
        sessionStorage.clear();
        alert('Order cancelled.');
        summaryTableBody.innerHTML = '';  // Clear the table
        payButton.textContent = 'Pay';    // Reset the Pay button
      }
    });
  });
  