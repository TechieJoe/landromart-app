document.addEventListener('DOMContentLoaded', async () => {
    const summaryTableBody = document.querySelector('#summaryTable tbody');
    const payButton = document.getElementById('pay');
  
    try {
      // Fetch cart data from backend
      const response = await fetch('cart', {
        method: 'GET',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch cart data');
      }
  
      const cartData = await response.json();
      console.log('cart Data:'+ cartData)
  
      // Populate table with cart items
      cartData.orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.item.name}</td>
          <td>${order.action}</td>
          <td class="quantity-controls">
            <button class="decrease-quantity" data-id="${order.item._id}">-</button>
            <span class="quantity">${order.quantity}</span>
            <button class="increase-quantity" data-id="${order.item._id}">+</button>
          </td>
          <td>${order.total}</td>
          <td><button class="remove-item" data-id="${order.item._id}">Remove</button></td>
        `;
        summaryTableBody.appendChild(row);
      });
  
      // Add event listeners for increase and decrease buttons
      document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', async (event) => {
          const itemId = event.target.dataset.id;
          const quantityElement = event.target.previousElementSibling;
          const newQuantity = parseInt(quantityElement.textContent) + 1;
  
          await updateCartQuantity(itemId, newQuantity);
          quantityElement.textContent = newQuantity;
        });
      });
  
      document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', async (event) => {
          const itemId = event.target.dataset.id;
          const quantityElement = event.target.nextElementSibling;
          const newQuantity = parseInt(quantityElement.textContent) - 1;
  
          if (newQuantity > 0) {
            await updateCartQuantity(itemId, newQuantity);
            quantityElement.textContent = newQuantity;
          }
        });
      });
  
      // Handle item removal
      document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', async (event) => {
          const itemId = event.target.dataset.id;
          await removeCartItem(itemId);
          event.target.closest('tr').remove();  // Remove the row from the table
        });
      });
  
      // Handle Pay button
      payButton.addEventListener('click', async () => {
        try {
          const response = await fetch('order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartData),
          });
  
          if (response.ok) {
            const data = await response.json();
            const { authorizationUrl } = data;
            if (authorizationUrl) {
              window.location.href = authorizationUrl;
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
  
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  });
  
  // Helper function to update cart item quantity
  async function updateCartQuantity(itemId, newQuantity) {
    try {
      const response = await fetch('/cart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, quantity: newQuantity }),
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to update cart item quantity');
      }
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
    }
  }
  
  // Helper function to remove cart item
  async function removeCartItem(itemId) {
    try {
      const response = await fetch(`/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
  
      if (!response.ok) {
        throw new Error('Failed to remove cart item');
      }
    } catch (error) {
      console.error('Error removing cart item:', error);
    }
  }
  