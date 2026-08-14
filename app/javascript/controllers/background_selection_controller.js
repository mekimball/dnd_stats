import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "filterAttribute", "backgroundSelect", "detailsContainer",
        "name", "description", "feat", "skills", "tools", "equipment",
        "boostsContainer", "boostMode", "boostControls"
    ]
    static values = {
        backgrounds: Array,
        selectedBackground: String,
        savedBoosts: Object
    }

    connect() {
        if (this.hasSelectedBackgroundValue && this.selectedBackgroundValue !== "") {
            this.backgroundSelectTarget.value = this.selectedBackgroundValue
        }
        this.filterBackgrounds()
    }

    updateDetails() {
        const selectedId = this.backgroundSelectTarget.value
        this.currentBackground = this.backgroundsValue.find(b => b.id === selectedId)

        if (this.currentBackground) {
            this.nameTarget.textContent = this.currentBackground.name || ""
            this.descriptionTarget.textContent = this.currentBackground.description || ""
            this.featTarget.textContent = this.currentBackground.feat || "None"

            const skills = this.currentBackground.skill_proficiencies || []
            this.skillsTarget.textContent = skills.length > 0
                ? skills.map(s => s.replace(/_/g, ' ')).join(", ")
                : "None"

            this.toolsTarget.textContent = this.currentBackground.tool_proficiency || "None"
            this.equipmentTarget.textContent = this.currentBackground.equipment || "Standard equipment"

            this.renderBoostControls()
            this.detailsContainerTarget.style.display = "block"
        } else {
            this.detailsContainerTarget.style.display = "none"
        }
    }

    renderBoostControls() {
        if (!this.currentBackground || !this.hasBoostControlsTarget) return

        const attrs = this.currentBackground.attributes || ["STR", "DEX", "CON"]
        const mode = this.hasBoostModeTarget ? this.boostModeTarget.value : "two_one"
        const saved = this.savedBoostsValue || {}

        if (mode === "two_one") {
            const pTwo = saved.plus_two || attrs[0]
            const pOne = saved.plus_one_a || attrs[1]

            this.boostControlsTarget.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+2 Ability Boost</label>
            <select name="character[ability_boosts][plus_two]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map(a => `<option value="${a}" ${a === pTwo ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Ability Boost</label>
            <select name="character[ability_boosts][plus_one_a]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map(a => `<option value="${a}" ${a === pOne ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
        </div>`
        } else {
            const pOneA = saved.plus_one_a || attrs[0]
            const pOneB = saved.plus_one_b || attrs[1]
            const pOneC = saved.plus_one_c || attrs[2]

            this.boostControlsTarget.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #1</label>
            <select name="character[ability_boosts][plus_one_a]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map(a => `<option value="${a}" ${a === pOneA ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #2</label>
            <select name="character[ability_boosts][plus_one_b]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map(a => `<option value="${a}" ${a === pOneB ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #3</label>
            <select name="character[ability_boosts][plus_one_c]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map(a => `<option value="${a}" ${a === pOneC ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
        </div>`
        }
    }

    filterBackgrounds() {
        const selectedFilters = this.filterAttributeTargets
            .filter(cb => cb.checked)
            .map(cb => cb.value.toUpperCase())

        const currentSelectedId = this.backgroundSelectTarget.value || this.selectedBackgroundValue

        const filtered = this.backgroundsValue.filter(bg => {
            if (selectedFilters.length === 0) return true
            const bgAttrs = (bg.attributes || []).map(a => a.toUpperCase())
            return selectedFilters.every(f => bgAttrs.includes(f))
        })

        this.backgroundSelectTarget.innerHTML = '<option value="">Select a Background</option>' +
            filtered.map(bg => {
                const attrsList = (bg.attributes || []).join(", ")
                return `<option value="${bg.id}">${bg.name} (${attrsList})</option>`
            }).join("")

        if (filtered.some(bg => bg.id === currentSelectedId)) {
            this.backgroundSelectTarget.value = currentSelectedId
        } else {
            this.backgroundSelectTarget.value = ""
        }

        this.updateDetails()
    }
}