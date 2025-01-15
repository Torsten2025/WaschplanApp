document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reservationForm');
  const messageEl = document.getElementById('message');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const start = formData.get('start');
    const end = formData.get('end');
    const email = formData.get('email');

    fetch('/api/reservations', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ start, end, email })
    })
    .then(res => res.json())
    .then(data => {
      if(data.error) {
        messageEl.style.color = 'red';
        messageEl.textContent = data.error;
      } else {
        messageEl.style.color = 'green';
        messageEl.textContent = data.message;
        form.reset();
      }
    })
    .catch(err => {
      messageEl.style.color = 'red';
      messageEl.textContent = 'Ein unbekannter Fehler ist aufgetreten.';
    });
  });
});
