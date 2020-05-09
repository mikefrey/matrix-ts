const fs = require('fs')
const Path = require('path')
const GifReader = require('omggif').GifReader

const path = Path.join(__dirname, '../icons/weather-rain.gif')
const buf = fs.readFileSync(path)

const img = new GifReader(buf)


console.log('width:', img.width)
console.log('height:', img.height)
console.log('loop count:', img.loopCount())
console.log('num frames:', img.numFrames())

const frameInfo = img.frameInfo(0)
console.log(frameInfo)

const px = new Uint8Array(img.width*img.height*4)
img.decodeAndBlitFrameRGBA(0, px)

console.log(px)
