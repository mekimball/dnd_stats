class Background
  include ActiveModel::Model

  attr_reader :id, :name, :attributes, :feat, :description, :skill_proficiencies, :tool_proficiency, :equipment
  STANDARD_ORDER = %w[STR DEX CON INT WIS CHA].freeze

  def initialize(data = {})
    return if data.blank?

    data = data.stringify_keys if data.respond_to?(:stringify_keys)
    @id = data["id"] || data["name"]&.parameterize
    @name = data["name"]
    @attributes = data["attributes"] || data["ability_options"] || []
    @feat = data["feat"] || data["origin_feat"]
    @description = data["description"]
    @skill_proficiencies = data["skill_proficiencies"] || []
    @tool_proficiency = data["tool_proficiency"]
    @equipment = data["equipment"]
  end

  # Returns all backgrounds, merging core_2024 detailed proficiencies if missing in backgrounds.json
  def self.all
    file_path = Rails.root.join("config", "data", "backgrounds.json")
    core_path = Rails.root.join("config", "data", "core_2024_backgrounds.json")

    all_data = JSON.load_file(file_path)
    core_data = File.exist?(core_path) ? JSON.load_file(core_path) : []

    core_by_id = core_data.each_with_object({}) do |bg, hash|
      key = (bg["id"] || bg["name"])&.parameterize
      hash[key] = bg if key.present?
    end

    all_data.map do |bg_hash|
      key = (bg_hash["id"] || bg_hash["name"])&.parameterize
      core_info = core_by_id[key] || {}

      merged = core_info.merge(bg_hash.compact)
      merged["skill_proficiencies"] ||= core_info["skill_proficiencies"]
      merged["tool_proficiency"] ||= core_info["tool_proficiency"]
      merged["equipment"] ||= core_info["equipment"]

      Background.new(merged)
    end
  end

  # Returns only the official 16 core backgrounds
  def self.core_2024
    core_path = Rails.root.join("config", "data", "core_2024_backgrounds.json")
    if File.exist?(core_path)
      data = JSON.load_file(core_path)
      data.map { |background| Background.new(background) }
    else
      all
    end
  end

  def self.find(id)
    return nil if id.blank?

    target = id.to_s.parameterize
    all.find { |b| b.id.to_s.parameterize == target || b.name.to_s.parameterize == target }
  end

  def self.all_feats
    all.map(&:feat).compact.uniq.sort
  end

  def self.all_attributes
    STANDARD_ORDER & all.flat_map(&:attributes).compact.map(&:upcase).uniq
  end

  def self.search(param)
    search_mode = param[:search_mode] || "attributes"

    if search_mode == "feat" && param[:selected_feat].present?
      all.select { |bg| bg.feat == param[:selected_feat] }
    elsif search_mode == "attributes"
      selected = Array(param[:selected_attrs]).reject(&:blank?).map(&:upcase)
      if selected.present?
        all.select { |bg| (selected - bg.attributes.map(&:upcase)).empty? }
      else
        all
      end
    else
      all
    end
  end

  def ability_options
    attributes
  end

  def origin_feat
    feat
  end

  def as_json(options = {})
    {
      "id" => id,
      "name" => name,
      "attributes" => attributes,
      "ability_options" => attributes,
      "feat" => feat,
      "origin_feat" => feat,
      "description" => description,
      "skill_proficiencies" => skill_proficiencies,
      "tool_proficiency" => tool_proficiency,
      "equipment" => equipment
    }
  end
end