class CharacterClass
  include ActiveModel::Model

  attr_accessor :id, :name, :hit_die, :primary_ability, :saving_throws,
                :armor_proficiencies, :weapon_proficiencies, :starting_equipment,
                :skill_choices, :skill_choice_count, :skill_count, :skill_options,
                :features, :subclasses

  # Custom initializer that safely ignores any unknown keys in classes.json
  def initialize(attributes = {})
    return if attributes.blank?

    attributes.each do |key, value|
      setter = "#{key}="
      send(setter, value) if respond_to?(setter)
    end
  end

  def self.all
    @all ||= begin
               file_path = Rails.root.join("config", "data", "classes.json")
               if File.exist?(file_path)
                 JSON.parse(File.read(file_path)).map { |data| CharacterClass.new(data) }
               else
                 []
               end
             end
  end

  def self.find(id)
    all.find { |c| c.id == id.to_s }
  end

  # Smart helper to extract the number of choices allowed
  def skill_choice_count
    return @skill_choice_count if @skill_choice_count.present?
    return @skill_count.to_i if @skill_count.present?

    if @skill_choices.is_a?(Hash)
      @skill_choices["count"] || @skill_choices[:count] || 2
    elsif @skill_choices.is_a?(Integer) || @skill_choices.is_a?(String)
      @skill_choices.to_i
    else
      2
    end
  end

  # Smart helper to extract available skill options
  def skill_options
    return @skill_options if @skill_options.present?

    if @skill_choices.is_a?(Hash)
      @skill_choices["options"] || @skill_choices[:options] || []
    elsif @skill_choices.is_a?(Array)
      @skill_choices
    else
      []
    end
  end
end
