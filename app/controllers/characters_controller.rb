class CharactersController < ApplicationController
  before_action :set_character, only: [ :show, :edit, :update, :destroy ]
  before_action :load_options, only: [ :new, :create, :edit, :update ]

  def index
    @characters = Character.order(created_at: :desc)
  end

  def show
  end

  def new
    @character = Character.new(level: 1)
  end

  def create
    @character = Character.new(character_params)
    if @character.save
      redirect_to @character, notice: "#{@character.name} was successfully created!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @character.update(character_params)
      redirect_to @character, notice: "#{@character.name} was successfully updated!"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    character_name = @character.name
    @character.destroy
    redirect_to characters_path, notice: "#{character_name} was deleted.", status: :see_other
  end

  private

  def set_character
    @character = Character.find(params[:id])
  end

  def load_options
    @class_options = CharacterClass.all
    @species_options = Species.all
  end

  private

  def character_params
    params.require(:character).permit(
      :name,
      :level,
      :character_class_id,
      :subclass_id,
      :species_id,
      :species_lineage,
      :lineage_spellcasting_ability,
      :size,
      :background_id,
      :strength,
      :dexterity,
      :constitution,
      :intelligence,
      :wisdom,
      :charisma,
      :class_equipment_option,
      :background_equipment_option,
      ability_boosts: {},
      skill_proficiencies: [],
      custom_equipment: []
    )
  end
end
