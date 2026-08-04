import { Controller } from "@hotwired/stimulus"

const POINT_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
const STAT_NAMES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]

export default class extends Controller {
    static targets = [
        "methodTab", "pointBuySection", "arraySection", "rollSection", "manualSection",
        "pointsRemaining", "arraySelect", "rollSelect", "rolledPool",
        "strInput", "dexInput", "conInput", "intInput", "wisInput", "chaInput"
    ]

    connect() {
        this.rolledScores = []
        this.selectMethod("standard_array")
    }

    // --- Method Selection ---
    changeMethod(event) {
        const method = event.currentTarget.dataset.method
        this.selectMethod(method)
    }

    selectMethod(method) {
        this.activeMethod = method

        // Highlight active method tab
        this.methodTabTargets.forEach(tab => {
            const isSelected = tab.dataset.method === method
            tab.classList.toggle("bg-red-700", isSelected)
            tab.classList.toggle("text-white", isSelected)
            tab.classList.toggle("bg-slate-800", !isSelected)
            tab.classList.toggle("text-slate-300", !isSelected)
        })

        // Show/Hide sections
        this.pointBuySectionTarget.style.display = method === "point_buy" ? "block" : "none"
        this.arraySectionTarget.style.display = method === "standard_array" ? "block" : "none"
        this.rollSectionTarget.style.display = method === "roll" ? "block" : "none"
        this.manualSectionTarget.style.display = method === "manual" ? "block" : "none"

        if (method === "point_buy") this.resetPointBuy()
        if (method === "standard_array") this.resetStandardArray()
    }

    // --- Point Buy Logic ---
    resetPointBuy() {
        STAT_NAMES.forEach(stat => this.setStatValue(stat, 8))
        this.updatePointBuySummary()
    }

    adjustPointBuy(event) {
        const stat = event.currentTarget.dataset.stat
        const delta = parseInt(event.currentTarget.dataset.delta, 10)
        const currentVal = this.getStatValue(stat)
        const newVal = currentVal + delta

        if (newVal < 8 || newVal > 15) return

        const currentTotalCost = this.calculatePointBuyTotal()
        const costDiff = POINT_COSTS[newVal] - POINT_COSTS[currentVal]

        if (currentTotalCost + costDiff > 27) return

        this.setStatValue(stat, newVal)
        this.updatePointBuySummary()
    }

    calculatePointBuyTotal() {
        return STAT_NAMES.reduce((sum, stat) => sum + (POINT_COSTS[this.getStatValue(stat)] || 0), 0)
    }

    updatePointBuySummary() {
        const used = this.calculatePointBuyTotal()
        if (this.hasPointsRemainingTarget) {
            this.pointsRemainingTarget.textContent = 27 - used
        }
    }

    // --- Standard Array Logic ---
    resetStandardArray() {
        this.arraySelectTargets.forEach(select => select.value = "")
        STAT_NAMES.forEach(stat => this.setStatValue(stat, 8))
        this.updateArrayDropdowns()
    }

    updateArrayAssignment(event) {
        const select = event.currentTarget
        const stat = select.dataset.stat
        const val = parseInt(select.value, 10) || 8

        this.setStatValue(stat, val)
        this.updateArrayDropdowns()
    }

    updateArrayDropdowns() {
        const chosenValues = this.arraySelectTargets.map(s => parseInt(s.value, 10)).filter(Boolean)

        this.arraySelectTargets.forEach(select => {
            const currentSelectVal = parseInt(select.value, 10)
            Array.from(select.options).forEach(opt => {
                if (!opt.value) return
                const optVal = parseInt(opt.value, 10)
                opt.disabled = chosenValues.includes(optVal) && optVal !== currentSelectVal
            })
        })
    }

    // --- Roll 4d6 Drop Lowest Logic ---
    rollDice() {
        this.rolledScores = []
        for (let i = 0; i < 6; i++) {
            const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
            dice.sort((a, b) => a - b)
            const sum = dice.slice(1).reduce((a, b) => a + b, 0)
            this.rolledScores.push(sum)
        }

        // Sort descending for clean display
        this.rolledScores.sort((a, b) => b - a)

        // Update pool readout text
        if (this.hasRolledPoolTarget) {
            this.rolledPoolTarget.textContent = `Available Pool: [ ${this.rolledScores.join(", ")} ]`
        }

        // Populate dropdown options using array index
        this.rollSelectTargets.forEach(select => {
            select.value = ""
            select.disabled = false
            select.innerHTML = '<option value="">Select</option>' +
                this.rolledScores.map((score, idx) => `<option value="${idx}">${score}</option>`).join("")
        })

        // Reset base inputs
        STAT_NAMES.forEach(stat => this.setStatValue(stat, 8))
    }

    updateRollAssignment(event) {
        const select = event.currentTarget
        const stat = select.dataset.stat
        const chosenIndex = select.value

        if (chosenIndex !== "") {
            const val = this.rolledScores[parseInt(chosenIndex, 10)]
            this.setStatValue(stat, val)
        } else {
            this.setStatValue(stat, 8)
        }

        this.updateRollDropdowns()
    }

    updateRollDropdowns() {
        const chosenIndices = this.rollSelectTargets.map(s => s.value).filter(val => val !== "")

        this.rollSelectTargets.forEach(select => {
            const currentSelectIndex = select.value
            Array.from(select.options).forEach(opt => {
                if (opt.value === "") return
                opt.disabled = chosenIndices.includes(opt.value) && opt.value !== currentSelectIndex
            })
        })
    }

    // --- Helpers ---
    getStatValue(stat) {
        return parseInt(this[`${stat.slice(0, 3)}InputTarget`].value, 10) || 8
    }

    setStatValue(stat, value) {
        const targetKey = `${stat.slice(0, 3)}InputTarget`
        if (this[targetKey]) {
            this[targetKey].value = value
            this[targetKey].dispatchEvent(new Event("input", { bubbles: true }))
        }
    }
}