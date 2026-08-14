import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["classOptions", "backgroundOptions", "customItemsContainer"]
    static values = {
        classes: Array,
        backgrounds: Array,
        items: Array,
        savedClassOption: String,
        savedBackgroundOption: String,
        savedCustomEquipment: Array
    }

    connect() {
        this.updateEquipmentOptions()
        this.renderSavedCustomItems()
    }

    renderSavedCustomItems() {
        if (!this.hasCustomItemsContainerTarget) return
        this.customItemsContainerTarget.innerHTML = ""

        const saved = this.savedCustomEquipmentValue || []
        if (saved.length > 0) {
            saved.forEach(itemName => this.addCustomItem(null, itemName))
        } else {
            this.addCustomItem()
        }
    }

    addCustomItem(event, selectedValue = "") {
        if (event) event.preventDefault()

        const div = document.createElement("div")
        div.className = "flex gap-2 items-center"
        div.innerHTML = `
      <select name="character[custom_equipment][]" 
              class="w-full border border-slate-300 rounded p-2 text-sm text-slate-800 bg-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none">
        ${this.buildItemSelectOptions(selectedValue)}
      </select>
      <button type="button" 
              data-action="click->equipment#removeCustomItem" 
              class="px-3 py-2 bg-slate-200 hover:bg-red-100 text-slate-600 hover:text-red-700 font-bold rounded text-xs transition">&times;</button>
    `
        this.customItemsContainerTarget.appendChild(div)
    }

    buildItemSelectOptions(selectedValue = "") {
        if (!this.hasItemsValue || this.itemsValue.length === 0) {
            return '<option value="">No items available in items.json</option>'
        }

        const categories = {}
        this.itemsValue.forEach(item => {
            const cat = item.category ? item.category.replace(/_/g, ' ').toUpperCase() : 'OTHER'
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(item)
        })

        let html = '<option value="">-- Select an Item --</option>'
        Object.keys(categories).sort().forEach(cat => {
            html += `<optgroup label="${cat}">`
            categories[cat].sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
                const costStr = item.cost ? ` (${item.cost})` : ''
                const isSelected = item.name === selectedValue ? 'selected' : ''
                html += `<option value="${item.name}" ${isSelected}>${item.name}${costStr}</option>`
            })
            html += `</optgroup>`
        })

        return html
    }

    renderClassEquipment(classId) {
        const selectedClass = this.classesValue.find(c => c.id === classId)
        if (!selectedClass || !selectedClass.starting_equipment) {
            this.classOptionsTarget.innerHTML = '<p class="text-xs text-slate-400 italic">Select a class in Step 2 to view starting equipment.</p>'
            return
        }

        const loadouts = selectedClass.starting_equipment
        const selectedOption = this.savedClassOptionValue || 'A'
        let html = '<div class="space-y-3">'

        Object.entries(loadouts).forEach(([key, items]) => {
            const isArray = Array.isArray(items)
            const label = isArray ? `Option ${key}` : `Option ${key} (Gold)`
            const itemList = isArray ? items.join(", ") : items
            const isChecked = key === selectedOption ? 'checked' : ''

            html += `
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[class_equipment_option]" value="${key}" ${isChecked} class="mt-1 text-red-600 focus:ring-red-500 accent-red-600">
          <div>
            <strong class="text-sm font-bold text-slate-900 block">${label}</strong>
            <span class="text-xs text-slate-600 leading-relaxed">${itemList}</span>
          </div>
        </label>`
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
        const selectedBgOption = this.savedBackgroundOptionValue || 'A'

        this.backgroundOptionsTarget.innerHTML = `
      <div class="space-y-3">
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[background_equipment_option]" value="A" ${selectedBgOption === 'A' ? 'checked' : ''} class="mt-1 text-red-600 focus:ring-red-500 accent-red-600">
          <div>
            <strong class="text-sm font-bold text-slate-900 block">Option A (Background Gear)</strong>
            <span class="text-xs text-slate-600 leading-relaxed">${eqText}</span>
          </div>
        </label>
        
        <label class="flex items-start gap-3 p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition shadow-sm">
          <input type="radio" name="character[background_equipment_option]" value="B" ${selectedBgOption === 'B' ? 'checked' : ''} class="mt-1 text-red-600 focus:ring-red-500 accent-red-600">
          <div>
            <strong class="text-sm font-bold text-slate-900 block">Option B (Starting Gold)</strong>
            <span class="text-xs text-slate-600">50 GP in place of background items.</span>
          </div>
        </label>
      </div>`
    }

    updateEquipmentOptions() {
        const classId = document.querySelector('[data-class-selection-target="classSelect"]')?.value
        const backgroundId = document.querySelector('[data-background-selection-target="backgroundSelect"]')?.value

        this.renderClassEquipment(classId)
        this.renderBackgroundEquipment(backgroundId)
    }

    removeCustomItem(event) {
        if (event) event.preventDefault()
        const row = event.currentTarget.closest(".flex")
        if (row) row.remove()
    }
}