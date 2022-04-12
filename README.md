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
import * as rrl from 'reverse-read-line';

const reader = rrl.create(filename, options); 
const lines = await reader.readLines(2);
await reader.close();
console.log(lines);

```

stream:

```javascript
import * as rrl from 'reverse-read-line';

const stream = rrl.createStream(filename, options); 
stream.on('data', (line) => {
  console.log(line);
});

```

read lines:

```javascript
import * as rrl from 'reverse-read-line';

const lines = await rrl.readLines(filename, 5, options); 
console.log(lines);

```

Options:

| name       | type   | default   | description
| :--------: | :----: | :-------: | :-----
| encoding   | string | 'utf8'    | the file encoding
| bufferSize | number | 4096      | the size will be read once
| separator  | string | undefined | line separator. if undefined it will auto judging 
