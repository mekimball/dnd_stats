import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "mode", "diceRule", "pointBudget",
        "str", "dex", "con", "int", "wis", "cha",
        "strMod", "dexMod", "conMod", "intMod", "wisMod", "chaMod",
        "maxHp", "classSelect", "speciesSelect", "levelSelect",
        "pointBuyContainer", "diceContainer", "diceResults",
        "pointBuyButtons", "diceSelect",
        "skillContainer", "skillCountNotice",
        "equipmentContainer",
        "subclassContainer", "subclassSelect",
        "featuresContainer"
    ]

    static values = {
        classData: Array,
        speciesData: Array,
        savedSubclass: String,
        savedSkills: Array
    }

    connect() {
        this.pointBuyCosts = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
        this.rolledPool = []
        this.assignedRolls = {}

        this.updateMode()
        this.recalculateAll()
    }

    // --- Stat Generation Mode Switching ---
    updateMode() {
        if (!this.hasModeTarget) return

        const mode = this.modeTarget.value

        // Toggle Point Buy Budget Banner
        if (this.hasPointBuyContainerTarget) {
            this.pointBuyContainerTarget.classList.toggle("hidden", mode !== "point_buy")
            this.pointBuyContainerTarget.style.display = mode === "point_buy" ? "block" : "none"
        }

        // Toggle Dice Rolling Section
        if (this.hasDiceContainerTarget) {
            this.diceContainerTarget.classList.toggle("hidden", mode !== "dice")
            this.diceContainerTarget.style.display = mode === "dice" ? "block" : "none"
        }

        // Toggle Per-Stat Point Buy Buttons
        if (this.hasPointBuyButtonsTargets) {
            this.pointBuyButtonsTargets.forEach(el => {
                el.classList.toggle("hidden", mode !== "point_buy")
                el.style.display = mode === "point_buy" ? "flex" : "none"
            })
        }

        // Toggle Per-Stat Dice Dropdowns
        if (this.hasDiceSelectTargets) {
            this.diceSelectTargets.forEach(el => {
                el.classList.toggle("hidden", mode !== "dice")
                el.style.display = mode === "dice" ? "block" : "none"
            })
        }

        // Mode-specific stat input behavior
        const stats = ["str", "dex", "con", "int", "wis", "cha"]

        if (mode === "array") {
            const arrayValues = [15, 14, 13, 12, 10, 8]
            stats.forEach((stat, i) => {
                const input = this.getStatInput(stat)
                if (input) {
                    input.value = arrayValues[i]
                    input.readOnly = true
                    input.style.display = "block"
                }
            })
        } else if (mode === "point_buy") {
            stats.forEach(stat => {
                const input = this.getStatInput(stat)
                if (input) {
                    input.value = 8
                    input.readOnly = true
                    input.style.display = "block"
                }
            })
            this.updatePointBuyBudget()
        } else if (mode === "dice") {
            this.assignedRolls = {}
            stats.forEach(stat => {
                const input = this.getStatInput(stat)
                if (input) {
                    input.value = ""
                    input.readOnly = true
                    input.style.display = "none"
                }
            })
            this.syncDiceDropdowns()
        } else if (mode === "custom") {
            stats.forEach(stat => {
                const input = this.getStatInput(stat)
                if (input) {
                    input.readOnly = false
                    input.style.display = "block"
                }
            })
        }

        this.recalculateAll()
    }

    // --- Class & Subclass Feature Preview ---
    updateFeaturesPreview() {
        if (!this.hasFeaturesContainerTarget) return

        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""
        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const level = parseInt(this.hasLevelSelectTarget ? this.levelSelectTarget.value : 1) || 1
        const subclassId = this.hasSubclassSelectTarget ? this.subclassSelectTarget.value : ""

        const classFeatures = charClass.features || {}
        const subclasses = charClass.subclasses || []
        const selectedSubclass = subclasses.find(s => s.id === subclassId) || {}
        const subclassFeatures = selectedSubclass.features || {}

        let unlockedClassList = []
        let unlockedSubclassList = []

        for (let l = 1; l <= level; l++) {
            if (classFeatures[l]) unlockedClassList.push(...classFeatures[l])
            if (subclassFeatures[l]) unlockedSubclassList.push(...subclassFeatures[l])
        }

        let html = `<div class="space-y-3">`

        html += `<div>`
        html += `<span class="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Class Features (Lv 1-${level}):</span>`
        if (unlockedClassList.length > 0) {
            html += `<div class="flex flex-wrap gap-1.5">${unlockedClassList.map(f => `<span class="bg-indigo-100 text-indigo-900 text-xs px-2.5 py-1 rounded font-semibold">${f}</span>`).join('')}</div>`
        } else {
            html += `<p class="text-xs text-slate-400 italic">None unlocked</p>`
        }
        html += `</div>`

        if (level >= 3 && selectedSubclass.name) {
            html += `<div class="pt-2 border-t border-slate-200">`
            html += `<span class="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">${selectedSubclass.name} Features:</span>`
            if (unlockedSubclassList.length > 0) {
                html += `<div class="flex flex-wrap gap-1.5">${unlockedSubclassList.map(f => `<span class="bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded font-semibold">${f}</span>`).join('')}</div>`
            } else {
                html += `<p class="text-xs text-slate-400 italic">No subclass features unlocked yet</p>`
            }
            html += `</div>`
        }

        html += `</div>`
        this.featuresContainerTarget.innerHTML = html
    }

    // --- Point Buy Mode ---
    adjustPointBuy(event) {
        const stat = event.currentTarget.dataset.stat
        const delta = parseInt(event.currentTarget.dataset.delta)
        const targetInput = this.getStatInput(stat)
        if (!targetInput) return

        let currentValue = parseInt(targetInput.value) || 8
        let newValue = currentValue + delta

        if (newValue < 8 || newValue > 15) return

        let currentTotalCost = this.calculatePointBuySpent()
        let currentStatCost = this.pointBuyCosts[currentValue]
        let newStatCost = this.pointBuyCosts[newValue]
        let costDifference = newStatCost - currentStatCost

        if (currentTotalCost + costDifference <= 27) {
            targetInput.value = newValue
            this.updatePointBuyBudget()
            this.recalculateAll()
        }
    }

    calculatePointBuySpent() {
        const stats = ["str", "dex", "con", "int", "wis", "cha"]
        return stats.reduce((sum, stat) => {
            const input = this.getStatInput(stat)
            const val = input ? parseInt(input.value) : 8
            return sum + (this.pointBuyCosts[val] || 0)
        }, 0)
    }

    updatePointBuyBudget() {
        if (!this.hasPointBudgetTarget) return
        const spent = this.calculatePointBuySpent()
        this.pointBudgetTarget.textContent = 27 - spent
    }

    // --- Dice Rolling Mode ---
    rollAllDice() {
        const rule = this.hasDiceRuleTarget ? this.diceRuleTarget.value : "4d6_drop_1"
        const totalDice = rule === "5d6_drop_2" ? 5 : 4
        const dropCount = rule === "5d6_drop_2" ? 2 : 1

        this.rolledPool = []

        for (let i = 0; i < 6; i++) {
            let rolls = []
            for (let d = 0; d < totalDice; d++) {
                rolls.push(Math.floor(Math.random() * 6) + 1)
            }
            rolls.sort((a, b) => a - b)

            let dropped = rolls.slice(0, dropCount)
            let kept = rolls.slice(dropCount)
            let sum = kept.reduce((a, b) => a + b, 0)

            this.rolledPool.push({ id: i.toString(), score: sum, kept: kept, dropped: dropped })
        }

        this.rolledPool.sort((a, b) => b.score - a.score)

        this.renderDiceResults()
        this.resetDiceSelections()
    }

    renderDiceResults() {
        if (!this.hasDiceResultsTarget) return

        const allScores = this.rolledPool.map(r => r.score).join(", ")

        let html = `
      <div class="mb-4 p-3 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
        <span class="text-xs uppercase tracking-wider text-slate-400 font-bold">Rolled Stats</span>
        <span class="text-xl font-black text-green-400 font-mono tracking-widest">${allScores}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
    `

        this.rolledPool.forEach((roll, index) => {
            const keptHtml = roll.kept.map(d => `<span class="font-black text-indigo-900">${d}</span>`).join(", ")
            const droppedHtml = roll.dropped.map(d => `<span class="line-through text-slate-400 font-medium decoration-slate-400 decoration-2">${d}</span>`).join(", ")

            const diceDisplay = [keptHtml, droppedHtml].filter(Boolean).join(", ")

            html += `
        <div class="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 text-center shadow-xs flex flex-col justify-between">
          <div>
            <div class="text-[10px] font-black tracking-wider text-indigo-500 uppercase mb-0.5">Roll #${index + 1}</div>
            <div class="text-2xl font-black text-indigo-950 mb-1.5">${roll.score}</div>
          </div>
          
          <div class="text-xs font-mono bg-white py-1 px-1.5 rounded border border-indigo-100">
            ${diceDisplay}
          </div>
        </div>
      `
        })

        html += `</div>`
        this.diceResultsTarget.innerHTML = html
    }

    resetDiceSelections() {
        this.assignedRolls = {}

        const stats = ["str", "dex", "con", "int", "wis", "cha"]
        stats.forEach(stat => {
            const input = this.getStatInput(stat)
            if (input) input.value = ""
        })

        this.syncDiceDropdowns()
        this.recalculateAll()
    }

    assignDiceScore(event) {
        if (!this.assignedRolls) this.assignedRolls = {}
        if (!this.rolledPool) this.rolledPool = []

        const select = event.currentTarget
        const statName = select.dataset.stat
        const rollId = select.value

        if (rollId && rollId !== "") {
            this.assignedRolls[statName] = rollId
        } else {
            delete this.assignedRolls[statName]
        }

        const selectedRoll = this.rolledPool.find(r => r.id === rollId)
        const targetInput = this.getStatInput(statName)

        if (targetInput) {
            targetInput.value = selectedRoll ? selectedRoll.score : ""
        }

        this.syncDiceDropdowns()
        this.recalculateAll()
    }

    syncDiceDropdowns() {
        const selects = this.element.querySelectorAll('[data-stat-generator-target="diceSelect"]')
        if (!selects || selects.length === 0) return

        const allAssignedIds = Object.values(this.assignedRolls || {})

        selects.forEach(select => {
            const statName = select.dataset.stat
            const currentAssignedId = (this.assignedRolls && this.assignedRolls[statName]) || ""

            let optionsHtml = `<option value="">-- Select --</option>`

            this.rolledPool.forEach(roll => {
                const isSelected = (currentAssignedId === roll.id)
                const isAssignedElsewhere = allAssignedIds.includes(roll.id) && !isSelected
                const disabledAttr = isAssignedElsewhere ? "disabled" : ""
                const selectedAttr = isSelected ? "selected" : ""
                const labelText = isAssignedElsewhere ? `${roll.score} (Assigned)` : `${roll.score}`

                optionsHtml += `<option value="${roll.id}" ${selectedAttr} ${disabledAttr}>${labelText}</option>`
            })

            select.innerHTML = optionsHtml
            select.value = currentAssignedId
        })
    }

    // --- Subclass Handling (2024 Rule: Level 3+) ---
    updateSubclassOptions() {
        if (!this.hasSubclassContainerTarget || !this.hasSubclassSelectTarget) return

        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""
        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const level = parseInt(this.hasLevelSelectTarget ? this.levelSelectTarget.value : 1) || 1
        const subclasses = charClass.subclasses || []

        if (level >= 3 && subclasses.length > 0) {
            this.subclassContainerTarget.classList.remove("hidden")
            this.subclassContainerTarget.style.display = "block"
            this.subclassSelectTarget.disabled = false

            if (this.currentSubclassClassId !== classId || this.subclassSelectTarget.options.length <= 1) {
                this.currentSubclassClassId = classId
                let optionsHtml = `<option value="">-- Choose Subclass --</option>`
                subclasses.forEach(sub => {
                    optionsHtml += `<option value="${sub.id}">${sub.name}</option>`
                })
                this.subclassSelectTarget.innerHTML = optionsHtml

                // Restore saved subclass when editing
                if (this.hasSavedSubclassValue && this.savedSubclassValue) {
                    this.subclassSelectTarget.value = this.savedSubclassValue
                }
            }
        } else {
            this.subclassContainerTarget.classList.add("hidden")
            this.subclassContainerTarget.style.display = "none"
            this.subclassSelectTarget.disabled = true
            this.subclassSelectTarget.value = ""
        }
    }

    // --- Starting Equipment Options ---
    updateEquipmentOptions() {
        if (!this.hasEquipmentContainerTarget) return

        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""
        if (this.currentEquipmentClassId === classId && this.equipmentContainerTarget.children.length > 0) return
        this.currentEquipmentClassId = classId

        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const equipmentOptions = charClass.starting_equipment || {}

        let html = `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">`

        Object.entries(equipmentOptions).forEach(([category, options]) => {
            const formattedCategory = category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())

            html += `
        <div class="bg-white p-3 border rounded-lg shadow-xs">
          <label class="block font-bold text-xs uppercase text-slate-500 mb-2">${formattedCategory}</label>
          <select name="character[equipment][]" class="w-full border rounded p-2 text-sm bg-slate-50">
      `

            options.forEach(item => {
                html += `<option value="${item}">${item}</option>`
            })

            html += `
          </select>
        </div>
      `
        })

        html += `</div>`
        this.equipmentContainerTarget.innerHTML = html
    }

    // --- Skill Proficiencies ---
    updateSkillOptions() {
        if (!this.hasSkillContainerTarget) return

        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""
        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const choices = charClass.skill_choices || []
        const maxCount = charClass.skill_count || 2

        let checkedSkills = Array.from(
            this.skillContainerTarget.querySelectorAll("input[type='checkbox']:checked")
        ).map(cb => cb.value)

        if (checkedSkills.length === 0 && this.hasSavedSkillsValue && this.savedSkillsValue.length > 0) {
            checkedSkills = this.savedSkillsValue
        }

        if (this.hasSkillCountNoticeTarget) {
            this.skillCountNoticeTarget.textContent = `Choose ${maxCount} skills for ${charClass.name || 'Class'}:`
        }

        let html = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">`

        choices.forEach(skill => {
            const formattedName = skill.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())
            const isChecked = checkedSkills.includes(skill) ? "checked" : ""

            html += `
        <label class="flex items-center gap-2 p-2 border rounded bg-white text-xs font-semibold cursor-pointer hover:bg-slate-50">
          <input type="checkbox" 
                 name="character[skill_proficiencies][]" 
                 value="${skill}" 
                 ${isChecked}
                 data-action="change->stat-generator#enforceSkillLimit"
                 data-max="${maxCount}"
                 class="skill-checkbox rounded text-indigo-600 focus:ring-indigo-500">
          <span>${formattedName}</span>
        </label>
      `
        })

        html += `</div>`
        this.skillContainerTarget.innerHTML = html
    }

    enforceSkillLimit(event) {
        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""
        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const maxCount = charClass.skill_count || 2

        const checkedBoxes = this.skillContainerTarget.querySelectorAll("input[type='checkbox']:checked")

        if (checkedBoxes.length > maxCount) {
            event.target.checked = false
            alert(`You can only select ${maxCount} skills for this class.`)
        }
    }

    // --- Dynamic Stats & HP Calculation ---
    recalculateAll() {
        const speciesId = this.hasSpeciesSelectTarget ? this.speciesSelectTarget.value : ""
        const classId = this.hasClassSelectTarget ? this.classSelectTarget.value : ""

        const species = (this.speciesDataValue || []).find(s => s.id === speciesId) || {}
        const bonuses = species.ability_score_bonuses || {}

        const mode = this.hasModeTarget ? this.modeTarget.value : "array"
        const stats = ["str", "dex", "con", "int", "wis", "cha"]
        const statNames = { str: "strength", dex: "dexterity", con: "constitution", int: "intelligence", wis: "wisdom", cha: "charisma" }

        stats.forEach(stat => {
            const input = this.getStatInput(stat)
            const modDisplay = this.getStatModDisplay(stat)
            const rawValue = input ? input.value : ""
            const bonus = bonuses[statNames[stat]] || 0

            if (mode === "dice" && (rawValue === "" || rawValue === null)) {
                if (modDisplay) modDisplay.textContent = "Unassigned"
            } else {
                const baseValue = parseInt(rawValue) || 10
                const effectiveStat = baseValue + bonus
                const modifier = Math.floor((effectiveStat - 10) / 2)

                const modDisplayStr = modifier >= 0 ? `+${modifier}` : `${modifier}`
                if (modDisplay) modDisplay.textContent = `${modDisplayStr} (${effectiveStat})`
            }
        })

        // Level-scaled Max HP Calculation
        const charClass = (this.classDataValue || []).find(c => c.id === classId) || {}
        const hitDie = charClass.hit_die || 8
        const level = parseInt(this.hasLevelSelectTarget ? this.levelSelectTarget.value : 1) || 1

        const conInput = this.getStatInput("con")
        const conRaw = conInput ? conInput.value : ""
        const conBase = parseInt(conRaw) || 10
        const conBonus = bonuses["constitution"] || 0
        const conMod = Math.floor(((conBase + conBonus) - 10) / 2)

        const level1Hp = hitDie + conMod
        const avgPerLevel = Math.floor(hitDie / 2) + 1 + conMod
        const totalMaxHp = level1Hp + ((level - 1) * avgPerLevel)

        if (this.hasMaxHpTarget) {
            this.maxHpTarget.textContent = totalMaxHp
        }

        this.updateSkillOptions()
        this.updateEquipmentOptions()
        this.updateSubclassOptions()
        this.updateFeaturesPreview()
    }

    // --- Safe DOM Helper Methods ---
    getStatInput(statName) {
        return this.element.querySelector(`input[data-stat-generator-target="${statName}"]`)
    }

    getStatModDisplay(statName) {
        return this.element.querySelector(`[data-stat-generator-target="${statName}Mod"]`)
    }
}