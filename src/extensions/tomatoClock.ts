import * as vscode from "vscode"

/** 时钟的状态 */
enum ClockEnum {
    /** 暂停，初始状态 */
    STOP,
    /** 专注阶段 */
    FOCUS,
    /** 间隙阶段 */
    REST
}

/**
 * 番茄钟
 */
class TomatoClock {
	/** 名称 */
	public name?: string
	/** 专注时长 */
	public focusTime: number
	/** 间隙时长 */
	public restTime: number
	/** 专注时间的定时器 */
	focusTimer?: NodeJS.Timeout
	/** 间隙时间的定时器 */
	restTimer?: NodeJS.Timeout
	/** 番茄钟状态 */
	public status?: ClockEnum
	constructor(focusTime: number, restTime: number, name = "番茄钟") {
		this.name = name
		this.focusTime = focusTime
		this.restTime = restTime
		this.status = ClockEnum.STOP
	}

	// 开始一个钟
	async start() {
		const clockName = await vscode.window.showInputBox({
			title: "番茄钟名称",
			placeHolder: "请输入名称",
			value: "番茄钟"
		})
		if (!clockName?.trim()) {
			vscode.window.showErrorMessage("请输入名称")
			return
		}
		this.name = clockName
		this.startFocus()
	}

	startFocus() {
		vscode.window.showInformationMessage(`${this.name} 已经开始，坚持就是胜利！`)
		// 修改状态
		this.status = ClockEnum.FOCUS
		this.focusTimer = setTimeout(() => {
			clearTimeout(this.focusTimer)
			this.focusTimer = undefined
			this.startRest()
		}, this.focusTime * 60 * 1000)
	}

	// 一个钟结束，开始间隙
	startRest() {
		vscode.window.showInformationMessage(`${this.name} 已经完成，恭喜！`)
		this.status = ClockEnum.REST
		this.restTimer = setTimeout(() => {
			clearTimeout(this.restTimer)
			this.restTimer = undefined
			this.startFocus()
		}, this.restTime * 60 * 1000)
	}

	// 结束一个番茄钟
	finish() {
		if (this.focusTimer) clearTimeout(this.focusTimer)
		if (this.restTimer) clearTimeout(this.restTimer)
		this.status = ClockEnum.STOP
		vscode.window.showInformationMessage(`${this.name} 已经完成，恭喜！`)
	}
}

export default TomatoClock