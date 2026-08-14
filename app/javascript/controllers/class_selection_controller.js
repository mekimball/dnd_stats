import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = [
        "levelInput", "classSelect",
        "subclassContainer", "subclassSelect", "subclassFeaturesContainer", "subclassFeaturesList",
        "unlockedFeaturesContainer", "featuresList",
        "skillsContainer", "skillsHeading", "skillsList"
    ]
    static values = {
        classes: Array,
        savedSkills: Array
    }

    connect() {
        this.updateAll()
    }

    updateAll() {
        const level = parseInt(this.levelInputTarget?.value || 1, 10)
        const selectedClassId = this.classSelectTarget?.value
        this.currentClass = this.classesValue.find(c => c.id === selectedClassId)

        // Dynamic header formatting: "Level 1" vs "Levels 1–20"
        if (this.hasLevelDisplayTarget) {
            this.levelDisplayTarget.textContent = level === 1 ? "Level 1" : `Levels 1–${level}`
        }

        if (this.currentClass) {
            this.renderSkills()
            this.renderUnlockedClassFeatures(level)
            this.updateSubclassSection(level)
        } else {
            if (this.hasUnlockedFeaturesContainerTarget) this.unlockedFeaturesContainerTarget.style.display = "none"
            if (this.hasSkillsContainerTarget) this.skillsContainerTarget.style.display = "none"
            if (this.hasSubclassContainerTarget) this.subclassContainerTarget.style.display = "none"
        }
    }

    // --- 1. Class Skill Selection with Choice Limits ---
    renderSkills() {
        if (!this.hasSkillsContainerTarget) return

        const skillOptions = this.currentClass.skill_options || []
        const allowedCount = this.currentClass.skill_choice_count || 2
        const saved = this.savedSkillsValue || []

        if (skillOptions.length === 0) {
            this.skillsContainerTarget.style.display = "none"
            return
        }

        this.skillsHeadingTarget.textContent = `Class Skill Proficiencies (Choose ${allowedCount}):`

        this.skillsListTarget.innerHTML = skillOptions.map(skill => {
            const formattedName = skill.replace(/_/g, ' ')
            const isChecked = saved.includes(skill) ? 'checked' : ''
            return `
        <label class="flex items-center gap-2.5 p-2.5 bg-white rounded border border-slate-200 cursor-pointer hover:border-slate-300 shadow-sm text-sm font-medium text-slate-800 capitalize">
          <input type="checkbox" 
                 name="character[skill_proficiencies][]" 
                 value="${skill}" 
                 ${isChecked}
                 data-action="change->class-selection#enforceSkillLimit"
                 class="w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 class-skill-checkbox">
          <span>${formattedName}</span>
        </label>
      `
        }).join('')

        this.enforceSkillLimit()
        this.skillsContainerTarget.style.display = "block"
    }

    enforceSkillLimit() {
        const allowedCount = this.currentClass?.skill_choice_count || 2
        const checkboxes = Array.from(this.skillsListTarget.querySelectorAll('.class-skill-checkbox'))
        const checkedCount = checkboxes.filter(cb => cb.checked).length

        checkboxes.forEach(cb => {
            if (!cb.checked && checkedCount >= allowedCount) {
                cb.disabled = true
                cb.closest('label').classList.add('opacity-50', 'cursor-not-allowed')
            } else {
                cb.disabled = false
                cb.closest('label').classList.remove('opacity-50', 'cursor-not-allowed')
            }
        })
    }

    // --- 2. Unlocked Class Features Display ---
    renderUnlockedClassFeatures(level) {
        if (!this.hasUnlockedFeaturesContainerTarget) return

        const featuresMap = this.currentClass.features || {}
        let unlocked = []

        for (let l = 1; l <= level; l++) {
            const lvlFeatures = featuresMap[l.toString()] || []
            lvlFeatures.forEach(feat => {
                const featName = typeof feat === 'object' ? feat.name : feat
                const featDesc = typeof feat === 'object' ? feat.description : null
                unlocked.push({ level: l, name: featName, description: featDesc })
            })
        }

        if (unlocked.length > 0) {
            this.featuresListTarget.innerHTML = unlocked.map(f => `
        <div class="p-3 bg-white rounded border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <strong class="text-slate-900 font-bold text-sm">${f.name}</strong>
            <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">Lvl ${f.level}</span>
          </div>
          ${f.description ? `<p class="text-xs text-slate-600 leading-relaxed">${f.description}</p>` : ''}
        </div>
      `).join('')
            this.unlockedFeaturesContainerTarget.style.display = "block"
        } else {
            this.unlockedFeaturesContainerTarget.style.display = "none"
        }
    }

    // --- 3. Subclass Section & Features ---
    updateSubclassSection(level) {
        const subclasses = this.currentClass.subclasses || []

        if (level >= 3 && subclasses.length > 0) {
            const savedSubclass = this.subclassSelectTarget.dataset.selectedSubclass || this.subclassSelectTarget.value

            this.subclassSelectTarget.innerHTML = '<option value="">Select a Subclass</option>' +
                subclasses.map(sc => `<option value="${sc.id}">${sc.name}</option>`).join('')

            if (subclasses.some(sc => sc.id === savedSubclass)) {
                this.subclassSelectTarget.value = savedSubclass
            }

            this.subclassContainerTarget.style.display = "block"
            this.subclassSelectTarget.disabled = false
            this.renderUnlockedSubclassFeatures(level)
        } else {
            this.subclassContainerTarget.style.display = "none"
            this.subclassSelectTarget.disabled = true
            this.subclassSelectTarget.value = ""
            if (this.hasSubclassFeaturesContainerTarget) {
                this.subclassFeaturesContainerTarget.style.display = "none"
            }
        }
    }

    renderUnlockedSubclassFeatures(level) {
        if (!this.hasSubclassFeaturesContainerTarget) return

        const selectedSubclassId = this.subclassSelectTarget.value
        const subclasses = this.currentClass?.subclasses || []
        const selectedSubclass = subclasses.find(sc => sc.id === selectedSubclassId)

        if (!selectedSubclass || !selectedSubclass.features) {
            this.subclassFeaturesContainerTarget.style.display = "none"
            return
        }

        let unlocked = []
        const featuresMap = selectedSubclass.features || {}

        for (let l = 3; l <= level; l++) {
            const lvlFeatures = featuresMap[l.toString()] || []
            lvlFeatures.forEach(feat => {
                const featName = typeof feat === 'object' ? feat.name : feat
                const featDesc = typeof feat === 'object' ? feat.description : null
                unlocked.push({ level: l, name: featName, description: featDesc })
            })
        }

        if (unlocked.length > 0) {
            this.subclassFeaturesListTarget.innerHTML = unlocked.map(f => `
        <div class="p-3 bg-amber-100/50 rounded border border-amber-200">
          <div class="flex items-center justify-between mb-1">
            <strong class="text-amber-950 font-bold text-sm">${f.name}</strong>
            <span class="px-2 py-0.5 bg-amber-200 text-amber-900 text-xs font-bold rounded">Lvl ${f.level} Subclass</span>
          </div>
          ${f.description ? `<p class="text-xs text-amber-900/80 leading-relaxed">${f.description}</p>` : ''}
        </div>
      `).join('')
            this.subclassFeaturesContainerTarget.style.display = "block"
        } else {
            this.subclassFeaturesContainerTarget.style.display = "none"
        }
    }
}