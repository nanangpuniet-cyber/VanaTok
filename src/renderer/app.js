window.addEventListener('DOMContentLoaded', async () => {
  const version = await window.vanatok.getVersion();
  const title = document.querySelector('.brand small');
  if (title) {
    title.textContent = `v${version}`;
  }
});
