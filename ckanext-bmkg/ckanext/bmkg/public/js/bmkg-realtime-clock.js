/**
 * BMKG Real-Time Clock Module (Portal Data BMKG)
 * Updates the digital clock & Indonesian localized calendar in the top bar every second.
 */
(function() {
  function initRealtimeClock() {
    const timeElem = document.getElementById('liveClockTime');
    const dateElem = document.getElementById('liveClockDate');
    if (!timeElem || !dateElem) return;

    function updateClock() {
      const now = new Date();
      const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
      dateElem.textContent = now.toLocaleDateString('id-ID', dateOptions);

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      let tz = 'WIB';
      const offset = -now.getTimezoneOffset() / 60;
      if (offset === 8) tz = 'WITA';
      else if (offset === 9) tz = 'WIT';
      else if (offset !== 7) tz = `UTC${offset >= 0 ? '+' : ''}${offset}`;

      timeElem.textContent = `${hours}:${minutes}:${seconds} ${tz}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeClock);
  } else {
    initRealtimeClock();
  }
})();
