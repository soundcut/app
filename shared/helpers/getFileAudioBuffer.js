const parser = require('mp3-parser');
const concatArrayBuffer = require('../helpers/ArrayBuffer.concat');
const concatAudioBuffer = require('../helpers/AudioBuffer.concat');

const CHUNK_MAX_SIZE = 1000 * 1000;
const CONCCURENT_DECODE_WORKERS = 4;

function makeSaveChunk(chunkArrayBuffers, tagsArrayBuffer, sourceArrayBuffer) {
  return function saveChunk(chunk) {
    chunkArrayBuffers.push(
      concatArrayBuffer(
        tagsArrayBuffer,
        sourceArrayBuffer.slice(
          chunk.frames[0]._section.offset,
          chunk.frames[chunk.frames.length - 1]._section.offset +
            chunk.frames[chunk.frames.length - 1]._section.byteLength
        )
      )
    );
  };
}

function emptyChunk(chunk) {
  chunk.byteLength = 0;
  chunk.frames.length = 0;
  return chunk;
}

function addChunkFrame(chunk, frame) {
  chunk.byteLength = chunk.byteLength + frame._section.byteLength;
  chunk.frames.push(frame);
}

const asyncWorker = (source, items, fn, output) => async () => {
  let next;
  while ((next = items.pop())) {
    const idx = source.indexOf(next);
    const result = await fn(next);
    output[idx] = result;
  }
};

function getArrayBuffer(file) {
  return new Promise(resolve => {
    let fileReader = new FileReader();
    fileReader.onloadend = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

// Use a promise wrapper on top of event based syntax
// for browsers (Safari) which do not support promise-based syntax.
function decodeArrayBuffer(audioCtx, arrayBuffer) {
  return new Promise(audioCtx.decodeAudioData.bind(audioCtx, arrayBuffer));
}

async function getFileAudioBuffer(file, audioCtx) {
  const arrayBuffer = await getArrayBuffer(file);

  const view = new DataView(arrayBuffer);

  const tags = parser.readTags(view);
  const firstFrame = tags.pop();
  const tagsArrayBuffer = arrayBuffer.slice(0, firstFrame._section.offset);
  const chunkArrayBuffers = [];
  const saveChunk = makeSaveChunk(
    chunkArrayBuffers,
    tagsArrayBuffer,
    arrayBuffer
  );
  let chunk = { byteLength: 0, frames: [] };
  let next = firstFrame._section.offset + firstFrame._section.byteLength;
  while (next) {
    const frame = parser.readFrame(view, next);
    next = frame && frame._section.nextFrameIndex;

    if (frame) {
      const chunkEnd =
        chunk && chunk.byteLength + frame._section.byteLength >= CHUNK_MAX_SIZE;
      if (chunkEnd) {
        saveChunk(chunk);
        chunk = emptyChunk(chunk);
      }

      addChunkFrame(chunk, frame);
    }

    if (chunk && (!frame || !next)) {
      saveChunk(chunk);
    }
  }

  const workers = [];
  const source = chunkArrayBuffers;
  const items = chunkArrayBuffers.slice();
  const audioBuffers = new Array(chunkArrayBuffers.length);
  const decode = decodeArrayBuffer.bind(null, audioCtx);

  for (let i = 0; i < CONCCURENT_DECODE_WORKERS; i++) {
    workers.push(asyncWorker(source, items, decode, audioBuffers)());
  }
  await Promise.all(workers);

  let audioBuffer;
  let current;
  while ((current = audioBuffers.shift())) {
    audioBuffer = audioBuffer
      ? concatAudioBuffer(audioCtx, audioBuffer, current)
      : current;
  }

  return audioBuffer;
}

module.exports = getFileAudioBuffer;
