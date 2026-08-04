require 'rails_helper'

RSpec.describe Character, type: :model do
  subject(:character) do
    Character.new(
      name: 'Valeros',
      level: 1,
      character_class_id: 'fighter',
      species_id: 'human',
      background_id: 'soldier',
      strength: 15,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 10,
      charisma: 8,
      ability_boosts: { 'strength' => 2, 'constitution' => 1 },
      skill_proficiencies: ['athletics', 'perception'],
      equipment: ['Chain Mail', 'Greatsword', 'Shield']
    )
  end

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(character).to be_valid
    end

    it 'is invalid without a name' do
      character.name = nil
      expect(character).not_to be_valid
    end

    it 'is invalid without a species_id' do
      character.species_id = nil
      expect(character).not_to be_valid
    end

    it 'is invalid without a character_class_id' do
      character.character_class_id = nil
      expect(character).not_to be_valid
    end
  end

  describe '#effective_stat and #modifier_for' do
    it 'calculates effective stat incorporating base and background boosts' do
      # Base STR 15 + 2 background boost = 17
      expect(character.effective_stat(:strength)).to eq(17)
      expect(character.modifier_for(:strength)).to eq(3)
    end

    it 'returns correct modifier for unboosted stats' do
      # DEX 14 = +2 modifier
      expect(character.effective_stat(:dexterity)).to eq(14)
      expect(character.modifier_for(:dexterity)).to eq(2)
    end
  end

  describe '#max_hp' do
    it 'calculates Level 1 Max HP for Fighter (Hit Die d10 + CON modifier)' do
      # CON 14 + 1 boost = 15 (+2 Mod). Hit Die 10 + 2 = 12 HP at Lv 1
      expect(character.max_hp).to eq(12)
    end

    it 'scales Max HP accurately at Level 5' do
      character.level = 5
      # Level 1 HP: 12. Levels 2-5: 4 levels * (6 + 2) = 32. Total = 44 HP
      expect(character.max_hp).to eq(44)
    end
  end

  describe '#armor_class' do
    it 'calculates Armor Class based on heavy armor and shield' do
      # Chain Mail (16) + Shield (+2) = 18 AC
      expect(character.armor_class).to eq(18)
    end

    it 'calculates unarmored AC with Dexterity modifier if no armor equipped' do
      character.equipment = []
      # Base 10 + DEX Mod 2 = 12 AC
      expect(character.armor_class).to eq(12)
    end
  end

  describe '#proficient_in_skill?' do
    it 'returns true for skills selected from class choices' do
      expect(character.proficient_in_skill?('athletics')).to be true
    end

    it 'returns true for skills granted by background' do
      # Soldier background grants Intimidation proficiency
      expect(character.proficient_in_skill?('intimidation')).to be true
    end

    it 'returns false for non-proficient skills' do
      expect(character.proficient_in_skill?('arcana')).to be false
    end
  end

  describe 'subclass management' do
    it 'clears subclass_id before saving if level is less than 3' do
      character.level = 2
      character.subclass_id = 'champion'
      character.save

      expect(character.subclass_id).to be_nil
    end

    it 'retains subclass_id if level is 3 or higher' do
      character.level = 3
      character.subclass_id = 'champion'
      character.save

      expect(character.subclass_id).to eq('champion')
    end
  end

  describe 'unlocked features' do
    it 'returns unlocked class features up to current level' do
      character.level = 2
      features = character.unlocked_class_features

      expect(features).to include('Fighting Style', 'Second Wind (2 uses)', 'Action Surge (1 use)')
      expect(features).not_to include('Extra Attack')
    end

    it 'returns unlocked subclass features if subclass is selected at Level 3+' do
      character.level = 3
      character.subclass_id = 'champion'

      features = character.unlocked_subclass_features
      expect(features).to include('Improved Critical (19-20)', 'Remarkable Athlete')
    end
  end
end