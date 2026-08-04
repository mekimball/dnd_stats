class CharacterClass
  include ActiveModel::Model

  attr_accessor :id, :name, :hit_die, :primary_ability, :saving_throws,
                :armor_proficiencies, :weapon_proficiencies,
                :skill_choices, :skill_count, :starting_equipment,
                :subclass_level, :subclasses, :features

  DATA_PATH = Rails.root.join("config", "data", "classes.json")

  def self.all
    @all ||= JSON.parse(File.read(DATA_PATH)).map { |data| new(data) }
  end

  def self.find(id)
    all.find { |c| c.id == id.to_s }
  end
end