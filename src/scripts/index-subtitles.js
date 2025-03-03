import fs from 'fs';
import zlib from 'zlib';
import MiniSearch from 'minisearch';

console.log('Parsing subtitles...');

const subtitles = JSON.parse(fs.readFileSync('src/assets/Subtitles.json', { encoding: 'utf8' }));

const timestampRegex = new RegExp(/\[[\d:.]+\]/, 'g');
const charsToRemove = new RegExp(/['".,!?]/, 'g');
const charsToWhitespace = new RegExp(/[^A-Za-z0-9 ]/, 'g');

const subtitleIndex = new MiniSearch({
    autoVacuum: false,
    fields: ['subtitles'],
    idField: 'id',
    searchOptions: { fields: ['subtitles'] },
    storeFields: ['id', 'title', 'duration', 'thumbnail', 'upload_date', 'stream_title', 'stream_date', 'subtitle_filename', 'subtitles'],
    tokenize: (string, _fieldName) => {
        string = string.replace(timestampRegex, ' ');
        string = string.replace(charsToRemove, '');
        string = string.replace(charsToWhitespace, ' ');
        return string.trim().split(/\s+/);
    }
});

console.log('Indexing subtitles...');

subtitleIndex.addAll(subtitles);

const savePath = 'public/assets/SubtitleIndex.json.gzip';

console.log('Compressing index...');

zlib.gzip(JSON.stringify(subtitleIndex), (err, buffer) => {
    if (err) {
        console.error('Error gzipping file:', err);
    } else {
        fs.writeFile(savePath, buffer, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log(`Index saved to ${savePath}`);
            }
        });
    }
});
