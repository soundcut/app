function formatTime(time) {
  return [
    Math.floor((time % 3600) / 60), // minutes
    ('00' + Math.floor(time % 60)).slice(-2), // seconds
    ('00' + Math.floor((time % 1) * 100)).slice(-2), // tenth miliseconds
  ].join(':');
}

module.exports = formatTime;
