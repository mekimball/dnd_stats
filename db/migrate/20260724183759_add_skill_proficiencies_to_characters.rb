class AddSkillProficienciesToCharacters < ActiveRecord::Migration[8.1]
  def change
    add_column :characters, :skill_proficiencies, :json
  end
end
