import * as Query from 'querystring'
import * as Path from 'path'
import fetch from 'node-fetch'

import {FrameBuffer} from '../../framebuffer'
import {Font8} from '../../fonts/font8'
import {App, Job} from '../../app'
import {Drawable, Text, Img} from '../../drawable'
import {Gif} from '../../gif'

interface WeatherData {
	current: CurrentConditions
	daily: DailyForecast[]
}

interface CurrentConditions {
	temp: number
	high: number
	low: number
	icon: WeatherIcon
}

interface DailyForecast {
	sunrise: number
	sunset: number
	high: number
	low: number
	icon: WeatherIcon
}

enum WeatherIcon {
	clearDay = 'clear-day',
	clearNight = 'clear-night',
	cloudy = 'cloudy',
	fog = 'fog',
	partlyCloudyDay = 'partly-cloudy-day',
	partlyCloudyNight = 'partly-cloudy-night',
	rain = 'rain',
	sleet = 'sleet',
	snow = 'snow',
	wind = 'wind',
}

function createImg(key: WeatherIcon) {
	const path = Path.join(__dirname, `../../../icons/weather-${key}.gif`)
	return new Img(new Gif(path), 0, 0)
}

const icons: {[key in WeatherIcon]: Img} = {
	[WeatherIcon.clearDay]: createImg(WeatherIcon.clearDay),
	[WeatherIcon.clearNight]: createImg(WeatherIcon.clearNight),
	[WeatherIcon.cloudy]: createImg(WeatherIcon.cloudy),
	[WeatherIcon.fog]: createImg(WeatherIcon.fog),
	[WeatherIcon.partlyCloudyDay]: createImg(WeatherIcon.partlyCloudyDay),
	[WeatherIcon.partlyCloudyNight]: createImg(WeatherIcon.partlyCloudyNight),
	[WeatherIcon.rain]: createImg(WeatherIcon.rain),
	[WeatherIcon.sleet]: createImg(WeatherIcon.sleet),
	[WeatherIcon.snow]: createImg(WeatherIcon.snow),
	[WeatherIcon.wind]: createImg(WeatherIcon.wind),
}

export class Weather extends App {
	items: {[key: string]: Drawable}

	constructor() {
		super()

		const currentX = Font8.measure('100°') + 9
		const highX = Font8.measure('100°') + currentX + 2
		const lowX = Font8.measure('00°') + highX + 1

		const items: {[key: string]: Drawable} = {
			icon: icons[WeatherIcon.clearDay],
			current: new Text(Font8, '0°', currentX, 0, 0xFFFFFF, 'right'),
			high: new Text(Font8, '0°', highX, 0, 0xFF5555, 'right'),
			low: new Text(Font8, '0°', lowX, 0, 0x5555FF, 'right')
		}

		this.items = items
	}

	update(ts: number, data: WeatherData) {
		if (!data) return

		this.items.icon = icons[data.current.icon]
		this.items.icon.update(ts)

		const current = (<Text>this.items.current)
		current.msg = `${data.current.temp}°`

		const high = (<Text>this.items.high)
		high.msg = `${data.current.high}°`

		const low = (<Text>this.items.low)
		low.msg = `${data.current.low}°`
	}

	draw(buf: FrameBuffer) {
		Object.values(this.items).forEach(d => d.draw(buf))
	}
}


const iconMap: {[key:string]: WeatherIcon} = {
	'511': WeatherIcon.sleet,
	'611': WeatherIcon.sleet,
	'612': WeatherIcon.sleet,
	'613': WeatherIcon.sleet,

	'01d': WeatherIcon.clearDay,
	'01n': WeatherIcon.clearNight,
	'02d': WeatherIcon.partlyCloudyDay,
	'02n': WeatherIcon.partlyCloudyNight,
	'03d': WeatherIcon.partlyCloudyDay,
	'03n': WeatherIcon.partlyCloudyNight,
	'04d': WeatherIcon.cloudy,
	'04n': WeatherIcon.cloudy,
	'09d': WeatherIcon.rain,
	'10d': WeatherIcon.rain,
	'11d': WeatherIcon.rain,
	'13d': WeatherIcon.snow,
	'50d': WeatherIcon.fog,
	// '': WeatherIcon.wind,
}

function getIcon(codes: OWConditionCodes, windSpeed: number): WeatherIcon {
	let icon = iconMap[codes.id+'']
	if (!icon) {
		icon = iconMap[codes.icon]
		if (windSpeed >= 25 && ['01d','01n','02d','02n','03d','03n','04d','04n'].includes(codes.icon)) {
			icon = WeatherIcon.wind
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

			console.log(body.current.temp, currentIcon)

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
