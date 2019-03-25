const { ensureBrowserId } = require('./browserId');

const SLICE_PATH = '/api/slice';

async function fetchSlice(id) {
  let browserId = 'anonymous';
  try {
    browserId = ensureBrowserId();
  } catch (err) {
    console.error({ err });
    /* pass */
  }

  const url = `${SLICE_PATH}/${id}`;

  const fetchPromise = fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'audio/mpeg; charset=utf-8',
      'X-Browser-Id': browserId,
    },
  });

  try {
    const response = await fetchPromise;
    if (response.status !== 200) {
      throw response;
    }

    const blob = await response.blob();
    const owner = response.headers.get('X-Owner') === '1';
    const filename = response.headers
      .get('content-disposition')
      .match(/filename="(.+)"/)[1];
    const file = new File([blob], filename);

    return {
      file,
      owner,
    };
  } catch (err) {
    console.error({ err });
    throw err;
  }
}

module.exports = fetchSlice;
