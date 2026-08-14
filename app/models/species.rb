class Species
  include ActiveModel::Model

  attr_accessor :id, :name, :speed, :size, :size_options, :traits,
                :extra_skill_count, :origin_feat_granted, :description,
                :keen_senses_choices, :lineages, :ability_score_bonuses

  DATA_PATH = Rails.root.join("config", "data", "species.json")

  def self.all
    @all ||= JSON.parse(File.read(DATA_PATH)).map { |data| new(data) }
  end

  def self.find(id)
    all.find { |s| s.id == id.to_s }
  end

  def as_json(options = {})
    {
      "id" => id,
      "name" => name,
      "speed" => speed,
      "size" => size,
      "size_options" => size_options,
      "traits" => traits,
      "extra_skill_count" => extra_skill_count,
      "origin_feat_granted" => origin_feat_granted,
      "description" => description,
      "keen_senses_choices" => keen_senses_choices,
      "lineages" => lineages,
      "ability_score_bonuses" => ability_score_bonuses
    }
  end
end
