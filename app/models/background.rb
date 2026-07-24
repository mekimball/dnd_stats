class Background
  attr_reader :name, :attributes, :feat, :description
  STANDARD_ORDER = %w[STR DEX CON INT WIS CHA]

  def initialize(data)
    @name = data["name"]
    @attributes = data["attributes"] || []
    @feat = data["feat"]
    @description = data["description"]
  end

  def self.all
    @all ||= begin
     file_path = Rails.root.join('config', 'data', 'backgrounds.json')
     data = JSON.load_file(file_path)
     data.map { |background| Background.new(background) }
   end
  end

  def self.all_feats
    all.map(&:feat).uniq.sort
  end

  def self.all_attributes
    STANDARD_ORDER & all.flat_map(&:attributes).uniq
  end

  def self.search(param)
    if param[:search_mode] == 'feat' && param[:selected_feat].present?
      all.select { |bg| bg.feat == param[:selected_feat] }
    elsif param[:search_mode] == 'attributes'
      selected = Array(param[:selected_attrs]).reject(&:blank?).map(&:upcase)
      if selected.present?
        all.select { |bg| (selected - bg.attributes).empty? }
      else
        all
      end
    else
      all
    end
  end
end