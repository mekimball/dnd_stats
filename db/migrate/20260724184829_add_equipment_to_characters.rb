class AddEquipmentToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :equipment, :json
  end
end
