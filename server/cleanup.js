function cleanup(err) {
  if (err) {
    console.error(err);
  }
  console.error('Cleaning up...');
  process.exit();
}

module.exports = cleanup;
