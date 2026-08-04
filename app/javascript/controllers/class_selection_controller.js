import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["levelInput", "classSelect", "subclassContainer", "subclassSelect"]
    static values = { classes: Array }

    connect() {
        this.updateSubclasses()
    }

    updateSubclasses() {
        const level = parseInt(this.levelInputTarget?.value || 1, 10)
        const selectedClassId = this.classSelectTarget?.value

        const selectedClass = this.classesValue.find(c => c.id === selectedClassId)
        const subclasses = selectedClass?.subclasses || []

        // Subclasses only unlock at Level 3+ in 2024 rules
        if (level >= 3 && selectedClass && subclasses.length > 0) {
            const savedSubclass = this.subclassSelectTarget.dataset.selectedSubclass || this.subclassSelectTarget.value

            // Populate subclass options from classes.json
            this.subclassSelectTarget.innerHTML = '<option value="">Select a Subclass</option>' +
                subclasses.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('')

            // Preserve existing selection if valid for this class
            if (subclasses.some(sc => sc.id === savedSubclass)) {
                this.subclassSelectTarget.value = savedSubclass
            } else {
                this.subclassSelectTarget.value = ""
            }

            this.subclassContainerTarget.style.display = "block"
            this.subclassSelectTarget.disabled = false
        } else {
            // Hide & clear subclass if under level 3 or no class selected
            this.subclassContainerTarget.style.display = "none"
            this.subclassSelectTarget.disabled = true
            this.subclassSelectTarget.value = ""
        }
    }
}