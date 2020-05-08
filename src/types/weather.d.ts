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

type WeatherIcon = 'clear-day' | 'clear-night' | 'cloudy' | 'fog' | 'partly-cloudy-day' | 'partly-cloudy-night' | 'rain' | 'sleet' | 'snow' | 'wind'
