import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "filterAttribute", "backgroundSelect", "detailsContainer",
        "name", "description", "feat", "skills", "tools", "equipment",
        "boostsContainer", "boostMode", "boostControls"
    ]
    static values = { backgrounds: Array }

    connect() {
        this.filterBackgrounds()
    }

    // Filter background options by selected ability score checkboxes
    filterBackgrounds() {
        const selectedFilters = this.filterAttributeTargets
            .filter(cb => cb.checked)
            .map(cb => cb.value.toUpperCase())

        const currentSelectedId = this.backgroundSelectTarget.value

        const filtered = this.backgroundsValue.filter(bg => {
            if (selectedFilters.length === 0) return true
            const bgAttrs = (bg.attributes || []).map(a => a.toUpperCase())
            return selectedFilters.every(f => bgAttrs.includes(f))
        })

        // Rebuild select dropdown
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

    // Display details of chosen background
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

    // Re-render ability boost selectors when switching between +2/+1 and +1/+1/+1
    changeBoostMode() {
        this.renderBoostControls()
    }

    renderBoostControls() {
        if (!this.currentBackground || !this.hasBoostControlsTarget) return

        const attrs = this.currentBackground.attributes || ["STR", "DEX", "CON"]
        const mode = this.hasBoostModeTarget ? this.boostModeTarget.value : "two_one"

        if (mode === "two_one") {
            // +2 to one stat, +1 to a second stat (Select 2)
            this.boostControlsTarget.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+2 Ability Boost</label>
            <select name="character[ability_boosts][plus_two]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map((a, i) => `<option value="${a}" ${i === 0 ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Ability Boost</label>
            <select name="character[ability_boosts][plus_one_a]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map((a, i) => `<option value="${a}" ${i === 1 ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
        </div>
      `
        } else {
            // +1 to three different stats (Select 3)
            this.boostControlsTarget.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #1</label>
            <select name="character[ability_boosts][plus_one_a]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map((a, i) => `<option value="${a}" ${i === 0 ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #2</label>
            <select name="character[ability_boosts][plus_one_b]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map((a, i) => `<option value="${a}" ${i === 1 ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">+1 Boost #3</label>
            <select name="character[ability_boosts][plus_one_c]" class="w-full border border-slate-300 rounded p-2.5 bg-white font-medium text-slate-800">
              ${attrs.map((a, i) => `<option value="${a}" ${i === 2 ? 'selected' : ''}>${a}</option>`).join("")}
            </select>
          </div>
        </div>
      `
        }
    }
}