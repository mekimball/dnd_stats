class AddAbilityBoostsToCharacters < ActiveRecord::Migration[8.0]
  def change
    add_column :characters, :background_id, :string unless column_exists?(:characters, :background_id)
    add_column :characters, :ability_boosts, :text, default: "{}" unless column_exists?(:characters, :ability_boosts)
  end
end
