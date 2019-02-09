function formatTime(time) {
  return [
    Math.floor((time % 3600) / 60), // minutes
    ('00' + Math.floor(time % 60)).slice(-2), // seconds
    ('000' + Math.floor((time % 1) * 1000)).slice(-3), // miliseconds
  ].join(':');
}

module.exports = formatTime;
