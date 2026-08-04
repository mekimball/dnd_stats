class AddSubclassToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :subclass_id, :string
  end
end
