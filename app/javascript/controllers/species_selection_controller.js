import { Controller } from "@hotwired/stimulus"

// Fallback descriptions for species with plain-string trait lists (2024 Rules)
const TRAIT_DESCRIPTIONS = {
    "Resourceful": "You gain Heroic Advantage whenever you finish a Long Rest.",
    "Skillful": "You gain proficiency in one skill of your choice.",
    "Versatile": "You gain an Origin feat of your choice."
}

export default class extends Controller {
    static targets = [
        "speciesSelect", "detailsContainer", "name", "size", "speed",
        "description", "traits", "lineageContainer", "lineageSelect",
        "lineageDetails", "spellcastingAbilityContainer", "sizeChoiceContainer", "sizeSelect"
    ]
    static values = { species: Array }

    connect() {
        this.updateDetails()
    }

    updateDetails() {
        const selectedId = this.speciesSelectTarget?.value
        this.currentSpecies = this.speciesValue.find(s => s.id === selectedId)

        if (this.currentSpecies) {
            this.nameTarget.textContent = this.currentSpecies.name || ""
            this.descriptionTarget.textContent = this.currentSpecies.description || ""

            // Size handling (supports array 'size_options' or single string 'size')
            if (this.currentSpecies.size_options && this.hasSizeChoiceContainerTarget) {
                this.sizeTarget.textContent = this.currentSpecies.size_options.join(" or ")
                this.sizeChoiceContainerTarget.style.display = "block"
                this.sizeSelectTarget.innerHTML = this.currentSpecies.size_options
                    .map(opt => `<option value="${opt}">${opt}</option>`).join("")
            } else {
                this.sizeTarget.textContent = this.currentSpecies.size || "Medium"
                if (this.hasSizeChoiceContainerTarget) {
                    this.sizeChoiceContainerTarget.style.display = "none"
                }
            }

            // Lineage Handling (Elves)
            const lineages = this.currentSpecies.lineages || []
            if (lineages.length > 0) {
                if (this.hasLineageContainerTarget) this.lineageContainerTarget.style.display = "block"
                if (this.hasSpellcastingAbilityContainerTarget) this.spellcastingAbilityContainerTarget.style.display = "block"

                if (this.hasLineageSelectTarget) {
                    const currentVal = this.lineageSelectTarget.value
                    this.lineageSelectTarget.innerHTML = '<option value="">Select a Lineage</option>' +
                        lineages.map(l => `<option value="${l.id}">${l.name}</option>`).join("")

                    if (lineages.some(l => l.id === currentVal)) {
                        this.lineageSelectTarget.value = currentVal
                    }
                }
            } else {
                if (this.hasLineageContainerTarget) this.lineageContainerTarget.style.display = "none"
                if (this.hasSpellcastingAbilityContainerTarget) this.spellcastingAbilityContainerTarget.style.display = "none"
                if (this.hasLineageSelectTarget) this.lineageSelectTarget.value = ""
                if (this.hasLineageDetailsTarget) this.lineageDetailsTarget.innerHTML = ""
            }

            this.updateSpeedAndTraits()
            this.detailsContainerTarget.style.display = "block"
        } else {
            this.detailsContainerTarget.style.display = "none"
        }
    }

    updateLineage() {
        this.updateSpeedAndTraits()
    }

    updateSpeedAndTraits() {
        if (!this.currentSpecies) return

        let baseSpeed = this.currentSpecies.speed || 30
        const lineages = this.currentSpecies.lineages || []
        const selectedLineageId = this.hasLineageSelectTarget ? this.lineageSelectTarget.value : null
        const selectedLineage = lineages.find(l => l.id === selectedLineageId)

        if (selectedLineage && selectedLineage.speed_bonus) {
            baseSpeed += selectedLineage.speed_bonus
        }
        this.speedTarget.textContent = `${baseSpeed} ft.`

        if (selectedLineage && this.hasLineageDetailsTarget) {
            this.lineageDetailsTarget.innerHTML = `
        <div class="p-3 bg-red-50 border border-red-200 rounded text-sm text-slate-800">
          <strong class="font-bold text-red-900 block mb-1">${selectedLineage.name} Lineage Benefit:</strong>
          ${selectedLineage.description}
        </div>`
        } else if (this.hasLineageDetailsTarget) {
            this.lineageDetailsTarget.innerHTML = ""
        }

        // Render Traits (Handles string arrays, object arrays, and custom descriptions)
        const traits = this.currentSpecies.traits || []
        if (Array.isArray(traits) && traits.length > 0) {
            this.traitsTarget.innerHTML = traits.map(t => {
                if (typeof t === "string") {
                    const desc = TRAIT_DESCRIPTIONS[t] || ""
                    return `
            <div class="mb-3 p-3 bg-white rounded border border-slate-200 shadow-sm">
              <strong class="text-slate-900 font-bold block mb-1">${t}</strong>
              ${desc ? `<span class="text-slate-600 text-sm leading-relaxed">${desc}</span>` : ""}
            </div>`
                } else if (typeof t === "object" && t !== null) {
                    const title = t.name || t.title
                    const desc = t.description || t.details || ""
                    return `
            <div class="mb-3 p-3 bg-white rounded border border-slate-200 shadow-sm">
              ${title ? `<strong class="text-slate-900 font-bold block mb-1">${title}</strong>` : ""}
              <span class="text-slate-600 text-sm leading-relaxed">${desc}</span>
            </div>`
                }
                return ""
            }).join("")
        } else {
            this.traitsTarget.innerHTML = '<span class="text-slate-400 italic text-sm">No traits listed.</span>'
        }
    }
}