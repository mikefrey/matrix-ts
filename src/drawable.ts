import {FrameBuffer} from './framebuffer'
import {Font} from './fonts/font'

export abstract class Drawable {
	abstract draw(buf: FrameBuffer, offsetX?: number, offsetY?: number): void
	abstract width(): number
}

export class Text extends Drawable {
	font: Font
	msg: string
	x: number
	y: number
	color: number
	align: TextAlign
	length: number

	constructor(font: Font, msg: string, x: number, y: number, color: number = 0xFFFFFF, align: TextAlign = 'left') {
		super()
		this.font = font
		this.msg = msg
		this.x = x
		this.y = y
		this.color = color
		this.align = align
		this.length = font.measure(msg)
	}

	draw(buf: FrameBuffer, offsetX: number = 0, offsetY: number = 0): number {
		let x = offsetX + this.x
		let y = offsetY + this.y

		if (this.align == 'right') {
			x -= this.length
		} else if (this.align == 'center') {
			x -= this.length / 2
		}

		for (let c of this.msg) {
			const char = this.font.get(c)
			const w = char[0].length

			if (x + w > 0 && x < buf.width) {
				for (let yy = 0; yy < char.length; yy++) {
					let row = char[yy]
					for (let xx = 0; xx < row.length; xx++) {
						let px = row[xx]
						if (px) {
							buf.set(x+xx, y+yy, this.color)
						}
					}
				}
			}

			x += w + 1 // add 1 for a break between characters
		}

		return x
	}

	width(): number {
		return this.length
	}
}
