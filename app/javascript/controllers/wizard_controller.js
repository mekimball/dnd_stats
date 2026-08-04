import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["step", "tab"]
    static values = { currentStep: { type: Number, default: 0 } }

    connect() {
        this.showStep(this.currentStepValue)
    }

    next(event) {
        event.preventDefault()
        if (this.currentStepValue < this.stepTargets.length - 1) {
            this.currentStepValue++
            this.showStep(this.currentStepValue)
        }
    }

    previous(event) {
        event.preventDefault()
        if (this.currentStepValue > 0) {
            this.currentStepValue--
            this.showStep(this.currentStepValue)
        }
    }

    goToTab(event) {
        event.preventDefault()
        const index = parseInt(event.currentTarget.dataset.stepIndex, 10)
        if (!isNaN(index)) {
            this.currentStepValue = index
            this.showStep(this.currentStepValue)
        }
    }

    showStep(index) {
        this.stepTargets.forEach((el, i) => {
            el.style.display = i === index ? "block" : "none"
        })

        this.tabTargets.forEach((tab, i) => {
            if (i === index) {
                tab.classList.add("border-b-4", "border-red-600", "text-red-600", "font-bold")
                tab.classList.remove("text-slate-500", "border-transparent")
            } else {
                tab.classList.remove("border-b-4", "border-red-600", "text-red-600", "font-bold")
                tab.classList.add("text-slate-500", "border-transparent")
            }
        })

        // Refresh equipment choices whenever navigating to Step 5 (index 4)
        if (index === 4) {
            const eqController = this.application.getControllerForElementAndIdentifier(
                document.querySelector('[data-controller~="equipment"]'),
                "equipment"
            )
            if (eqController) eqController.updateEquipmentOptions()
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}