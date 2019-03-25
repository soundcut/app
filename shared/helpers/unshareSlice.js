const { ensureBrowserId } = require('./browserId');

const SLICE_PATH = '/api/slice';

async function unshareSlice(id) {
  let browserId = 'anonymous';
  try {
    browserId = ensureBrowserId();
  } catch (err) {
    console.error({ err });
    /* pass */
  }

  const url = `${SLICE_PATH}/${id}`;

  const promise = fetch(url, {
    method: 'DELETE',
    headers: {
      'X-Browser-Id': browserId,
    },
  });

  try {
    const response = await promise;

    if (response.status !== 204) {
      const err = new Error('Server Error');
      err.response = response;
      throw err;
    }
  } catch (err) {
    console.error({ err });
    throw err;
  }
}

module.exports = unshareSlice;
