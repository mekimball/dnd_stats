class AddSpeciesOptionsToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :species_lineage, :string
    add_column :characters, :lineage_spellcasting_ability, :string
    add_column :characters, :size, :string
  end
end
