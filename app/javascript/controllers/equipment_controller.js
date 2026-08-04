import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "classOptions", "backgroundOptions",
        "customItemsContainer", "customItemTemplate"
    ]
    static values = { classes: Array, backgrounds: Array }

    connect() {
        this.updateEquipmentOptions()
    }

    // Reads current Class and Background selections from the form and updates choices
    updateEquipmentOptions() {
        const classId = document.querySelector('[data-class-selection-target="classSelect"]')?.value
        const backgroundId = document.querySelector('[data-background-selection-target="backgroundSelect"]')?.value

        this.renderClassEquipment(classId)
        this.renderBackgroundEquipment(backgroundId)
    }

    renderClassEquipment(classId) {
        const selectedClass = this.classesValue.find(c => c.id === classId)

        if (!selectedClass || !selectedClass.starting_equipment) {
            this.classOptionsTarget.innerHTML = '<p class="text-xs text-slate-400 italic">Select a class in Step 2 to view starting equipment.</p>'
            return
        }

        const loadouts = selectedClass.starting_equipment
        let html = '<div class="space-y-3">'

        Object.entries(loadouts).forEach(([key, items]) => {
            const isArray = Array.isArray(items)
            const label = isArray ? `Option ${key}` : `Option ${key} (Gold)`
            const itemList = isArray ? items.join(", ") : items

            html += `
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[class_equipment_option]" value="${key}" class="mt-1 text-red-600 focus:ring-red-500 accent-red-600" ${key === 'A' ? 'checked' : ''}>
          <div>
            <strong class="text-sm font-bold text-slate-900 block">${label}</strong>
            <span class="text-xs text-slate-600 leading-relaxed">${itemList}</span>
          </div>
        </label>
      `
        })

        html += '</div>'
        this.classOptionsTarget.innerHTML = html
    }

    renderBackgroundEquipment(backgroundId) {
        const selectedBg = this.backgroundsValue.find(b => b.id === backgroundId)

        if (!selectedBg) {
            this.backgroundOptionsTarget.innerHTML = '<p class="text-xs text-slate-400 italic">Select a background in Step 4 to view starting equipment.</p>'
            return
        }

        const eqText = selectedBg.equipment || "Choose A or B: (A) Standard Background Gear; or (B) 50 GP"

        this.backgroundOptionsTarget.innerHTML = `
      <div class="space-y-3">
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[background_equipment_option]" value="A" checked class="mt-1 text-red-600 focus:ring-red-500 accent-red-600">
          <div>
            <strong class="text-sm font-bold text-slate-900 block">Option A (Background Gear)</strong>
            <span class="text-xs text-slate-600 leading-relaxed">${eqText}</span>
          </div>
        </label>
        
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[background_equipment_option]" value="B" class="mt-1 text-red-600 focus:ring-red-500 accent-red-600">
          <div>
            <strong class="text-sm font-bold text-slate-900 block">Option B (Starting Gold)</strong>
            <span class="text-xs text-slate-600">50 GP in place of background items.</span>
          </div>
        </label>
      </div>
    `
    }

    // Adds a new custom equipment text row
    addCustomItem(event) {
        event.preventDefault()
        const div = document.createElement("div")
        div.className = "flex gap-2 items-center"
        div.innerHTML = `
      <input type="text" name="character[custom_equipment][]" placeholder="e.g. Healing Potion, Rope (50 ft.), Gemstone" class="w-full border border-slate-300 rounded p-2 text-sm text-slate-800 focus:ring-2 focus:ring-red-600 focus:outline-none">
      <button type="button" data-action="click->equipment#removeCustomItem" class="px-3 py-2 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-700 font-bold rounded text-xs transition">&times;</button>
    `
        this.customItemsContainerTarget.appendChild(div)
    }

    removeCustomItem(event) {
        event.preventDefault()
        event.currentTarget.closest(".flex").remove()
    }
}