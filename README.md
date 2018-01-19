[![Build Status](https://travis-ci.org/wmzy/reverse-read-line.svg?branch=master)](https://travis-ci.org/wmzy/reverse-read-line)
[![Coverage Status](https://coveralls.io/repos/github/wmzy/reverse-read-line/badge.svg?branch=master)](https://coveralls.io/github/wmzy/reverse-read-line?branch=master)
# reverse-read-line

> Read text file line by line from end.

## install

```bash
npm install reverse-read-line
```

## Usage

```javascript
import reverseReadLine from 'reverse-read-line';

const reader = new Reader(filename, options/* more time you need not specify */); 
await reader.open();
const lines = await reader.readLines(2);
await reader.close();
console.log(lines);
```

Options:

| name       | type   | default   | description
| :--------: | :----: | :-------: | :-----
| encoding   | string | 'utf8'    | the file encoding
| bufferSize | number | 4096      | the size will be read once
| separator  | string | undefined | line separator. if undefined it will auto judging 
