class Item
  include ActiveModel::Model

  attr_reader :id, :name, :category, :subtype, :rarity, :attunement, :cost, :weight, :description, :properties

  def initialize(data = {})
    return if data.blank?

    data = data.stringify_keys
    @id = data["id"]
    @name = data["name"]
    @category = data["category"]
    @subtype = data["subtype"]
    @rarity = data["rarity"] || "mundane"
    @attunement = data["attunement"] || false
    @cost = data["cost"]
    @weight = data["weight"] || 0.0
    @description = data["description"]
    @properties = data["properties"] || {}
  end

  def self.all
    @all ||= begin
               file_path = Rails.root.join("config", "data", "items.json")
               if File.exist?(file_path)
                 data = JSON.load_file(file_path)
                 data.map { |item| Item.new(item) }
               else
                 []
               end
             end
  end

  def self.find(id)
    return nil if id.blank?

    target = id.to_s.parameterize
    all.find { |i| i.id.to_s.parameterize == target || i.name.to_s.parameterize == target }
  end

  def self.by_category(category)
    all.select { |i| i.category == category.to_s }
  end

  def magic_item?
    rarity != "mundane"
  end

  def as_json(options = {})
    {
      "id" => id,
      "name" => name,
      "category" => category,
      "subtype" => subtype,
      "rarity" => rarity,
      "attunement" => attunement,
      "cost" => cost,
      "weight" => weight,
      "description" => description,
      "properties" => properties
    }
  end
end