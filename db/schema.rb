# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_24_225205) do
  create_table "characters", force: :cascade do |t|
    t.text "ability_boosts", default: "{}"
    t.string "background_id"
    t.string "character_class_id"
    t.integer "charisma"
    t.integer "constitution"
    t.datetime "created_at", null: false
    t.integer "dexterity"
    t.json "equipment"
    t.integer "intelligence"
    t.integer "level"
    t.string "name"
    t.json "skill_proficiencies"
    t.string "species_id"
    t.integer "strength"
    t.string "subclass_id"
    t.datetime "updated_at", null: false
    t.integer "wisdom"
  end
end
