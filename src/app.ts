import {FrameBuffer} from './framebuffer'

export abstract class App {
	abstract update(ts: number, data: any): void
	abstract draw(buf: FrameBuffer): void
}

export abstract class Job {
	abstract async run(): Promise<any>
}

interface JobEntry {
	job: Job
	interval: number
	data?: any
	timeout?: NodeJS.Timeout
}

interface AppEntry {
	app: App
	job?: string
}

export class AppManager {
	#jobs: {[name:string]: JobEntry}
	#apps: Map<string, AppEntry>
	activeApp: string = ''

	constructor() {
		this.#jobs = {}
		this.#apps = new Map()
	}

	addJob(name: string, job: Job, interval: number) {
		this.#jobs[name] = {job, interval}
	}

	addApp(name: string, app: App, job?: string) {
		this.#apps.set(name, {app, job})
		if (!this.activeApp) {
			this.activeApp = name
		}
	}

	startJobs() {
		const run = async (ent: JobEntry) => {
			ent.timeout = setTimeout(() => run(ent), ent.interval)
			const data = await ent.job.run()
			ent.data = data
		}

		Object.values(this.#jobs).forEach(ent => run(ent))
	}

	stopJobs() {
		Object.values(this.#jobs).forEach(ent => ent.timeout && clearTimeout(ent.timeout))
	}

	update(ts: number) {
		const entry = this.#apps.get(this.activeApp)
		if (!entry) {
			console.log('no active app')
			return
		}

		let data: any = {}
		if (entry.job) {
			const jobEntry = this.#jobs[entry.job]
			if (!jobEntry) {
				console.log(`job entry '${entry.job}' missing`)
			}
			data = jobEntry.data
		}
		entry.app.update(ts, data)
	}

	draw(buf: FrameBuffer) {
		const entry = this.#apps.get(this.activeApp)
		entry?.app.draw(buf)
	}
}
