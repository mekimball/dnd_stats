class AddFormSelectionsToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :generation_method, :string
    add_column :characters, :class_equipment_option, :string
    add_column :characters, :background_equipment_option, :string
    add_column :characters, :custom_equipment, :json
  end
end
