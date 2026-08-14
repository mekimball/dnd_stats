class Character < ApplicationRecord
  validates :name, :species_id, :character_class_id, presence: true

  # Native attribute typecasting for Rails & JSON columns
  attribute :level, :integer, default: 1
  attribute :strength, :integer, default: 10
  attribute :dexterity, :integer, default: 10
  attribute :constitution, :integer, default: 10
  attribute :intelligence, :integer, default: 10
  attribute :wisdom, :integer, default: 10
  attribute :charisma, :integer, default: 10
  attribute :size, :string, default: "Medium"
  attribute :species_lineage, :string
  attribute :lineage_spellcasting_ability, :string
  attribute :generation_method, :string, default: "manual"
  attribute :class_equipment_option, :string
  attribute :background_equipment_option, :string
  attribute :custom_equipment, :json, default: []
  attribute :ability_boosts, :json, default: {}
  attribute :skill_proficiencies, :json, default: []
  attribute :equipment, :json, default: []

  before_save :clear_subclass_if_under_level_3
  before_save :build_equipment_list

  # 18 Standard D&D 5e Skills mapped to ability scores
  SKILLS = {
    acrobatics: :dexterity,
    animal_handling: :wisdom,
    arcana: :intelligence,
    athletics: :strength,
    deception: :charisma,
    history: :intelligence,
    insight: :wisdom,
    intimidation: :charisma,
    investigation: :intelligence,
    medicine: :wisdom,
    nature: :intelligence,
    perception: :wisdom,
    performance: :charisma,
    persuasion: :charisma,
    religion: :intelligence,
    sleight_of_hand: :dexterity,
    stealth: :dexterity,
    survival: :wisdom
  }.freeze

  # ActiveModel Lookups
  def character_class
    CharacterClass.find(character_class_id)
  end

  def species
    Species.find(species_id)
  end

  def background
    Background.find(background_id) if background_id.present?
  end

  def subclass
    return nil unless character_class && subclass_id.present?
    (character_class.subclasses || []).find { |s| s["id"] == subclass_id }
  end

  def subclass_name
    subclass&.fetch("name", nil)
  end

  # Background Bonus Lookup Helper (Handles {"plus_two" => "STR", "plus_one_a" => "DEX"})
  def background_bonus_for(stat_name)
    boosts = ability_boosts
    boosts = JSON.parse(boosts) if boosts.is_a?(String)
    return 0 unless boosts.is_a?(Hash)

    target_stat = stat_name.to_s.downcase
    target_abbr = target_stat[0..2] # e.g. "str", "dex"

    bonus = 0

    boosts.each do |slot, chosen_stat|
      next if chosen_stat.blank?

      chosen_norm = chosen_stat.to_s.downcase
      matches_stat = (chosen_norm == target_stat || chosen_norm == target_abbr)

      if matches_stat
        if slot.to_s == "plus_two"
          bonus += 2
        elsif slot.to_s.start_with?("plus_one")
          bonus += 1
        end
      end
    end

    # Fallback if stored directly as {"strength" => 2}
    if bonus.zero?
      boosts.each do |k, val|
        k_norm = k.to_s.downcase
        if (k_norm == target_stat || k_norm == target_abbr) && val.is_a?(Numeric)
          bonus += val.to_i
        end
      end
    end

    bonus
  end

  # Ability Score Calculations
  def effective_stat(stat_name)
    base = public_send(stat_name) || 10
    species_bonus = (species&.ability_score_bonuses || {})[stat_name.to_s].to_i
    bg_bonus = background_bonus_for(stat_name)

    base + species_bonus + bg_bonus
  end

  def modifier_for(stat_name)
    ((effective_stat(stat_name) - 10) / 2.0).floor
  end

  # Max HP Calculation (Levels 1–20)
  def max_hp
    return 0 unless character_class

    con_mod = modifier_for(:constitution)
    hit_die = character_class.hit_die

    level_1_hp = hit_die + con_mod
    average_hp_per_level = (hit_die / 2).floor + 1 + con_mod

    level_1_hp + ((level - 1) * average_hp_per_level)
  end

  # Proficiency & Skill Calculations
  def proficiency_bonus
    ((level - 1) / 4) + 2
  end

  def proficient_in_skill?(skill_name)
    target = skill_name.to_s.downcase
    class_skills = (skill_proficiencies || []).map { |s| s.to_s.downcase }
    bg_skills = (background&.skill_proficiencies || []).map { |s| s.to_s.downcase }

    class_skills.include?(target) || bg_skills.include?(target)
  end

  def skill_modifier(skill_name)
    stat = SKILLS[skill_name.to_sym]
    return 0 unless stat

    total = modifier_for(stat)
    total += proficiency_bonus if proficient_in_skill?(skill_name)
    total
  end

  # Derived Combat Stats
  def armor_class
    gear = equipment || []
    dex_mod = modifier_for(:dexterity)

    if gear.any? { |item| item.to_s.downcase.include?("chain mail") }
      base_ac = 16
    elsif gear.any? { |item| item.to_s.downcase.include?("leather armor") }
      base_ac = 11 + dex_mod
    else
      base_ac = 10 + dex_mod
    end

    base_ac += 2 if gear.any? { |item| item.to_s.downcase.include?("shield") }
    base_ac
  end

  def initiative
    modifier_for(:dexterity)
  end

  def passive_perception
    10 + skill_modifier(:perception)
  end

  # Unlocked Feature Helpers
  def unlocked_class_features
    return [] unless character_class && character_class.features.is_a?(Hash)

    unlocked = []
    (1..level).each do |lvl|
      lvl_features = character_class.features[lvl.to_s] || []
      unlocked.concat(lvl_features)
    end
    unlocked
  end

  def unlocked_subclass_features
    return [] unless subclass && subclass["features"].is_a?(Hash)

    unlocked = []
    (1..level).each do |lvl|
      lvl_features = subclass["features"][lvl.to_s] || []
      unlocked.concat(lvl_features)
    end
    unlocked
  end

  private

  def clear_subclass_if_under_level_3
    self.subclass_id = nil if level < 3
  end

  def build_equipment_list
    return if class_equipment_option.blank? && background_equipment_option.blank? && custom_equipment.blank?

    compiled_items = []

    # 1. Class Equipment Choice
    if character_class.present? && class_equipment_option.present?
      loadouts = character_class.starting_equipment || {}
      selected_items = loadouts[class_equipment_option]
      compiled_items += Array(selected_items)
    end

    # 2. Background Equipment Choice
    if background.present? && background_equipment_option.present?
      if background_equipment_option == "B"
        compiled_items << "50 GP (Background Gold)"
      elsif background.equipment.present?
        compiled_items << background.equipment
      end
    end

    # 3. Custom Equipment Selected from Catalog
    if custom_equipment.present?
      compiled_items += Array(custom_equipment).reject(&:blank?)
    end

    self.equipment = compiled_items.compact.uniq
  end
end