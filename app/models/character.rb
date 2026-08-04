class Character < ApplicationRecord
  validates :name, :species_id, :character_class_id, presence: true

  # Native attribute typecasting for JSON/Text columns
  attribute :level, :integer, default: 1
  attribute :strength, :integer, default: 10
  attribute :dexterity, :integer, default: 10
  attribute :constitution, :integer, default: 10
  attribute :intelligence, :integer, default: 10
  attribute :wisdom, :integer, default: 10
  attribute :charisma, :integer, default: 10
  attribute :ability_boosts, :json, default: {}
  attribute :skill_proficiencies, :json, default: []
  attribute :equipment, :json, default: []

  before_save :clear_subclass_if_under_level_3

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

  # Background Bonus Lookup Helper
  def background_bonus_for(stat_name)
    boosts = ability_boosts
    boosts = JSON.parse(boosts) if boosts.is_a?(String)
    return 0 unless boosts.is_a?(Hash)

    boosts.transform_keys(&:to_s)[stat_name.to_s].to_i
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
    base_ac = 10
    dex_mod = modifier_for(:dexterity)

    if gear.any? { |item| item.include?("Chain Mail") }
      base_ac = 16
    elsif gear.any? { |item| item.include?("Leather Armor") }
      base_ac = 11 + dex_mod
    else
      base_ac = 10 + dex_mod
    end

    base_ac += 2 if gear.any? { |item| item.include?("Shield") }
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
end