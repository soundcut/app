let passiveSupported;
export default function checkPassiveEventListener() {
  if (passiveSupported !== undefined) {
    return passiveSupported;
  }

  try {
    const options = {
      // eslint-disable-next-line getter-return
      get passive() {
        passiveSupported = true;
      },
    };

    window.addEventListener('test', options, options);
    window.removeEventListener('test', options, options);
  } catch (err) {
    passiveSupported = false;
  }

  return passiveSupported;
}
