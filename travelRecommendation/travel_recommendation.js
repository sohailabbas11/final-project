fetch('data.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return response.json();
  })
  .then((data) => {
    initializeSearch(data);
  })
  .catch((error) => console.error('Error:', error));