import * as Query from 'querystring'
import fetch from 'node-fetch'

import {FrameBuffer} from '../../framebuffer'
import {Font8} from '../../fonts/font8'
import {App, Job} from '../../app'
import {Drawable, Text} from '../../drawable'

export class Weather extends App {
	items: {[key: string]: Drawable}

	constructor() {
		super()

		const currentX = Font8.measure('100°F') + 9
		const highX = Font8.measure(' 100°') + currentX
		const lowX = Font8.measure(' 00°') + highX

		const items = {
			current: new Text(Font8, '0°F', currentX, 0, 0xFFFFFF, 'right'),
			high: new Text(Font8, '0°', highX, 0, 0xFF5555, 'right'),
			low: new Text(Font8, '0°', lowX, 0, 0x5555FF, 'right')
		}

		this.items = items
	}

	update(ts: number, data: WeatherData) {
		if (!data) return

		const current = (<Text>this.items.current)
		current.msg = `${data.current.temp}°F`

		const high = (<Text>this.items.high)
		high.msg = `${data.current.high}°F`

		const low = (<Text>this.items.low)
		low.msg = `${data.current.temp}°F`
	}

	draw(buf: FrameBuffer) {
		Object.values(this.items).forEach(d => d.draw(buf))
	}
}


const iconMap: {[key:string]: WeatherIcon}= {
	'511': 'sleet',
	'611': 'sleet',
	'612': 'sleet',
	'613': 'sleet',

	'01d': 'clear-day',
	'01n': 'clear-night',
	'02d': 'partly-cloudy-day',
	'02n': 'partly-cloudy-night',
	'03d': 'partly-cloudy-day',
	'03n': 'partly-cloudy-night',
	'04d': 'cloudy',
	'04n': 'cloudy',
	'09d': 'rain',
	'10d': 'rain',
	'11d': 'rain',
	'13d': 'snow',
	'50d': 'fog',
	// '': 'wind',
}

function getIcon(codes: OWConditionCodes, windSpeed: number): WeatherIcon {
	let icon = iconMap[codes.id+'']
	if (!icon) {
		icon = iconMap[codes.icon]
		if (windSpeed >= 25 && ['01d','01n','02d','02n','03d','03n','04d','04n'].includes(codes.icon)) {
			icon = 'wind'
		}
	}
	return icon
}

export class WeatherJob extends Job {
	cfg: WeatherConfig

	constructor(cfg: WeatherConfig) {
		super()
		this.cfg = cfg
	}

	async run(): Promise<WeatherData | undefined> {
		console.log('checking weather')
		const qs = Query.stringify(this.cfg.params)
		const url = `${this.cfg.url}?${qs}`

		try {
			const res = await fetch(url)

			if (res.status != 200) {
				console.log('Non-200 response from weather fetcher:', res.status)
				console.log('URL:', url)
				console.log('Body:', await res.text())
				return
			}

			const body: OpenWeatherData = await res.json()

			let currentIcon = iconMap[body.current.weather[0].icon]
			if (!currentIcon) {
				currentIcon = iconMap[body.current.weather[0].id+'']
			}

			console.log(body.current.temp)

			return {
				current: {
					temp: Math.round(body.current.temp),
					high: Math.round(body.daily[0].temp.max),
					low: Math.round(body.daily[0].temp.min),
					icon: getIcon(body.current.weather[0], body.current.wind_speed)
				},
				daily: body.daily.map(d => {
					return {
						sunrise: d.sunrise,
						sunset: d.sunset,
						high: Math.round(d.temp.max),
						low: Math.round(d.temp.min),
						icon: getIcon(d.weather[0], d.wind_speed)
					}
				})
			}
		} catch(err) {
			console.log('Error fetching weather data from:', url)
			console.log(err)
		}
	}
}
